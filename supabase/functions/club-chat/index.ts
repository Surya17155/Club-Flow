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

    // Gate logic: active_club_id takes priority for ALL users (including super admins)
    let clubIds: string[];
    if (active_club_id) {
      // If not super admin, verify membership and chatbot permission
      if (!isSuperAdmin) {
        const membership = (userClubs || []).find((c: any) => c.club_id === active_club_id);
        if (!membership) {
          return new Response(JSON.stringify({ error: "You are not a member of this club" }), { status: 403, headers: corsHeaders });
        }
        const memberRole = membership.role;
        if (memberRole !== 'president' && memberRole !== 'admin') {
          const { data: powerData } = await adminClient
            .from('delegated_powers')
            .select('id')
            .eq('club_id', active_club_id)
            .eq('user_id', userId)
            .eq('power', 'use_chatbot')
            .maybeSingle();
          if (!powerData) {
            return new Response(JSON.stringify({ error: "You don't have chatbot access for this club" }), { status: 403, headers: corsHeaders });
          }
        }
      }
      clubIds = [active_club_id];
    } else if (isSuperAdmin) {
      clubIds = []; // will fetch all
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
        return { name: p?.full_name || "Unknown", email: p?.email, role: m.role, programme: p?.programme, year: p?.year, phone: p?.phone, instagram: p?.social_instagram, linkedin: p?.social_linkedin, gmail: p?.social_gmail };
      });

      // Per-event attendee names
      const eventDetails = clubEvents.slice(0, 10).map((e: any) => {
        const eventAttendees = attendanceData
          .filter((a: any) => a.event_id === e.id)
          .map((a: any) => {
            const p = profiles.find((pr: any) => pr.user_id === a.student_id);
            return p?.full_name || "Unknown";
          });
        return {
          name: e.name, date: e.event_date, type: e.event_type, category: e.category,
          attendance_count: eventAttendees.length,
          attendees: eventAttendees.slice(0, 50),
        };
      });

      return {
        name: club.name,
        description: club.description,
        about: club.about,
        total_members: clubMembers.length,
        members_by_role: clubMembers.reduce((acc: any, m: any) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {}),
        member_list: memberDetails,
        total_events: clubEvents.length,
        recent_events: eventDetails,
        total_attendance_records: clubAttendance.length,
      };
    });

    const scopedToClub = !!active_club_id;
    const activeClubName = scopedToClub
      ? (clubs || []).find((c: any) => c.id === active_club_id)?.name || "your club"
      : null;

    const userRoleDesc = isSuperAdmin
      ? (scopedToClub ? `Super Admin currently viewing: ${activeClubName}` : "Super Admin with unrestricted access to all clubs")
      : `Club member currently viewing: ${activeClubName || (userClubs || []).map((c: any) => `${c.clubs?.name} (${c.role})`).join(", ")}`;

    const scopeRule = scopedToClub
      ? `**SECURITY RULE**: You must ONLY answer questions about "${activeClubName}". You have been given data ONLY for this club. If asked about other clubs, respond: "Sorry, I can only provide information about ${activeClubName} right now. Please switch to that club first." Do NOT reference or reveal data from any other club.`
      : (isSuperAdmin ? "You have unrestricted access to all club data." : "You must only answer questions about the user's own clubs.");

**User Role**: ${userRoleDesc}

${!isSuperAdmin ? `**SECURITY RULE**: You must ONLY answer questions about ${activeClubName ? `"${activeClubName}"` : "the user's own club"}. You have been given data ONLY for this club. If asked about other clubs, respond: "Sorry, I cannot provide information about other clubs for security purposes." Do NOT reference or reveal data from any other club.` : "You have unrestricted access to all club data."}

**Club Data**:
${JSON.stringify(clubSummaries, null, 2)}

**RESPONSE FORMAT RULES (STRICTLY FOLLOW)**:

**MEMBER QUERIES**: When the user asks about members (e.g. "show members", "who are the members", "list members", "member details", "tell me about members"), you MUST respond with a JSON block wrapped in \`\`\`members-json markers. Format:
\`\`\`members-json
{"header":"Club Members","subtext":"5 members found","members":[{"name":"John Doe","role":"President","programme":"B.Tech CSE","email":"john@iilm.edu","phone":"9876543210","instagram":"https://instagram.com/john","linkedin":"https://linkedin.com/in/john","gmail":"john@gmail.com"}]}
\`\`\`
Include ALL member fields available. The role field must match exactly: President, Vice President, Secretary, Social Media Head, or Member. You may add a short markdown note AFTER the JSON block if needed.

**EVENT QUERIES**: When the user asks about events (e.g. "show events", "what events happened", "list events", "upcoming events", "past events"), you MUST respond with a JSON block wrapped in \`\`\`events-json markers. Format:
\`\`\`events-json
{"header":"Recent Events","subtext":"3 events found","events":[{"name":"Hackathon 2026","date":"2026-03-15","end_date":"2026-03-16","type":"hackathon","category":"technical","access_type":"open","description":"Annual coding competition","attendance_count":45,"attendees":["Alice","Bob"]}]}
\`\`\`
You may add a short markdown note AFTER the JSON block if needed.

**OTHER QUERIES**: For non-member, non-event queries, use clean markdown with headings, bullet points, and bold labels. Keep responses concise.

Answer questions accurately based on the data above. If asked about data you don't have, say so honestly.`;

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
