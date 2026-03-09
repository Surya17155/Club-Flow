import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    const { message, conversation_history = [], active_club_id } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: corsHeaders });
    }

    // Determine role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isSuperAdmin = !!adminRole;

    // Get user's clubs
    const { data: userClubs } = await adminClient
      .from("club_members")
      .select("club_id, role, clubs(id, name, description, about)")
      .eq("user_id", userId);

    // For non-super-admins, scope to the active club only
    let clubIds: string[];
    if (isSuperAdmin) {
      clubIds = []; // will fetch all
    } else if (active_club_id) {
      // Verify user is actually a member of this club
      const isMember = (userClubs || []).some((c: any) => c.club_id === active_club_id);
      if (!isMember) {
        return new Response(JSON.stringify({ error: "You are not a member of this club" }), { status: 403, headers: corsHeaders });
      }
      clubIds = [active_club_id];
    } else {
      clubIds = (userClubs || []).map((c: any) => c.club_id);
    }

    if (!isSuperAdmin && (!clubIds || clubIds.length === 0)) {
      // User has no clubs
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "You are a club management assistant. The user is not a member of any club. Politely inform them that you can only help with club-related queries once they join a club." },
            ...conversation_history,
            { role: "user", content: message },
          ],
          stream: true,
        }),
      });
      return new Response(resp.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    // Fetch club data
    let clubsQuery = adminClient.from("clubs").select("id, name, description, about");
    if (!isSuperAdmin) clubsQuery = clubsQuery.in("id", clubIds);
    const { data: clubs } = await clubsQuery;

    // Member counts per club
    let membersQuery = adminClient.from("club_members").select("club_id, role, user_id");
    if (!isSuperAdmin) membersQuery = membersQuery.in("club_id", clubIds);
    const { data: members } = await membersQuery;

    // Events
    let eventsQuery = adminClient.from("events").select("id, name, event_date, end_date, club_id, category, event_type, access_type, description").order("event_date", { ascending: false }).limit(50);
    if (!isSuperAdmin) eventsQuery = eventsQuery.in("club_id", clubIds);
    const { data: events } = await eventsQuery;

    // Attendance summary
    const eventIds = (events || []).map((e: any) => e.id);
    let attendanceData: any[] = [];
    if (eventIds.length > 0) {
      const { data } = await adminClient.from("attendance").select("event_id, student_id, status").in("event_id", eventIds);
      attendanceData = data || [];
    }

    // Profiles for member names
    const memberUserIds = (members || []).map((m: any) => m.user_id);
    let profiles: any[] = [];
    if (memberUserIds.length > 0) {
      const { data } = await adminClient.from("profiles").select("user_id, full_name, email, programme, year, roll_no, phone, social_instagram, social_linkedin, social_gmail").in("user_id", memberUserIds);
      profiles = data || [];
    }

    // Build context
    const clubSummaries = (clubs || []).map((club: any) => {
      const clubMembers = (members || []).filter((m: any) => m.club_id === club.id);
      const clubEvents = (events || []).filter((e: any) => e.club_id === club.id);
      const clubAttendance = attendanceData.filter((a: any) => clubEvents.some((e: any) => e.id === a.event_id));
      const memberDetails = clubMembers.map((m: any) => {
        const p = profiles.find((pr: any) => pr.user_id === m.user_id);
        return { name: p?.full_name || "Unknown", email: p?.email, role: m.role, programme: p?.programme, year: p?.year };
      });

      return {
        name: club.name,
        description: club.description,
        about: club.about,
        total_members: clubMembers.length,
        members_by_role: clubMembers.reduce((acc: any, m: any) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {}),
        member_list: memberDetails,
        total_events: clubEvents.length,
        recent_events: clubEvents.slice(0, 10).map((e: any) => ({
          name: e.name, date: e.event_date, type: e.event_type, category: e.category,
          attendance_count: clubAttendance.filter((a: any) => a.event_id === e.id).length,
        })),
        total_attendance_records: clubAttendance.length,
      };
    });

    const activeClubName = (!isSuperAdmin && active_club_id)
      ? (clubs || []).find((c: any) => c.id === active_club_id)?.name || "your club"
      : null;

    const userRoleDesc = isSuperAdmin
      ? "Super Admin with unrestricted access to all clubs"
      : `Club member currently viewing: ${activeClubName || (userClubs || []).map((c: any) => `${c.clubs?.name} (${c.role})`).join(", ")}`;

    const systemPrompt = `You are ClubBot, an AI assistant for a club management platform. You have real-time access to club data.

**User Role**: ${userRoleDesc}

${!isSuperAdmin ? `**SECURITY RULE**: You must ONLY answer questions about ${activeClubName ? `"${activeClubName}"` : "the user's own club"}. You have been given data ONLY for this club. If asked about other clubs, respond: "Sorry, I cannot provide information about other clubs for security purposes." Do NOT reference or reveal data from any other club.` : "You have unrestricted access to all club data."}

**Club Data**:
${JSON.stringify(clubSummaries, null, 2)}

Answer questions accurately based on the data above. Be concise, helpful, and use markdown formatting. If asked about data you don't have, say so honestly.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversation_history,
          { role: "user", content: message },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("club-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
