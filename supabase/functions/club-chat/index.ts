import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ROLES = ["president", "vice_president", "general_secretary", "secretary", "deputy_secretary", "social_media_head", "social_media_coordinator", "technical_pr_head", "technical_pr_coordinator", "treasurer", "deputy_treasurer", "assistant_treasurer", "member"];

// ── Tool definitions ──
const agentTools = [
  {
    type: "function",
    function: {
      name: "import_members",
      description: "Bulk import members from parsed spreadsheet data into the active club. Use when user provides a file with member data.",
      parameters: {
        type: "object",
        properties: {
          members: {
            type: "array",
            items: {
              type: "object",
              properties: {
                full_name: { type: "string" },
                email: { type: "string" },
                programme: { type: "string" },
                year: { type: "string" },
                section: { type: "string" },
                roll_no: { type: "string" },
                phone: { type: "string" },
                role: { type: "string", enum: VALID_ROLES },
              },
              required: ["full_name", "email"],
            },
          },
        },
        required: ["members"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_single_member",
      description: "Add a single member to the active club. If you only have name and email but are missing other details (programme, year, section, roll_no, phone, class_coordinator), respond with a member-form-json block so the user can fill in the missing details via a form in chat. Only call this tool when you have all the details OR when the user explicitly says to add with whatever info is available.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string" },
          email: { type: "string" },
          programme: { type: "string" },
          year: { type: "string" },
          section: { type: "string" },
          roll_no: { type: "string" },
          phone: { type: "string" },
          class_coordinator: { type: "string" },
          role: { type: "string", enum: VALID_ROLES },
        },
        required: ["full_name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_member",
      description: "Remove a member from the active club by their email address.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Email of the member to remove" },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_member",
      description: "Update a member's profile details (name, programme, year, section, roll_no, phone, class_coordinator, role). Provide the email to identify the member and any fields to update.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Email of the member to update" },
          full_name: { type: "string" },
          programme: { type: "string" },
          year: { type: "string" },
          section: { type: "string" },
          roll_no: { type: "string" },
          phone: { type: "string" },
          class_coordinator: { type: "string" },
          new_role: { type: "string", enum: VALID_ROLES, description: "New club role" },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_profiles_bulk",
      description: "Bulk update profile fields (e.g. class_coordinator) for multiple users identified by email. Use when user uploads a file with emails and fields to update.",
      parameters: {
        type: "object",
        properties: {
          updates: {
            type: "array",
            items: {
              type: "object",
              properties: {
                email: { type: "string" },
                full_name: { type: "string" },
                programme: { type: "string" },
                year: { type: "string" },
                section: { type: "string" },
                roll_no: { type: "string" },
                phone: { type: "string" },
                class_coordinator: { type: "string" },
              },
              required: ["email"],
            },
          },
        },
        required: ["updates"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_event_data",
      description: "Fetch detailed attendance data for a specific event by name or keyword. Returns the event details and full attendee list with all their profile information. Use when the user asks for event data, attendance report, or wants to download event information.",
      parameters: {
        type: "object",
        properties: {
          event_name: { type: "string", description: "Name or keyword to search for the event" },
        },
        required: ["event_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_event",
      description: "Create a new event for the active club.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          event_date: { type: "string", description: "ISO 8601 datetime" },
          end_date: { type: "string", description: "ISO 8601 datetime, optional" },
          event_type: { type: "string" },
          category: { type: "string", enum: ["Mandatory", "Optional"] },
          access_type: { type: "string", enum: ["Open to Club", "Open to All", "Invite Only"] },
          description: { type: "string" },
        },
        required: ["name", "event_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_member_form",
      description: "When adding a single member and you have partial info (just name and email), use this to show a form in the chat for the user to fill in missing details. Do NOT call add_single_member yet — wait for the form to be submitted.",
      parameters: {
        type: "object",
        properties: {
          full_name: { type: "string", description: "Pre-filled name" },
          email: { type: "string", description: "Pre-filled email" },
          programme: { type: "string", description: "Pre-filled programme if known" },
          year: { type: "string", description: "Pre-filled year if known" },
          section: { type: "string", description: "Pre-filled section if known" },
          roll_no: { type: "string", description: "Pre-filled roll no if known" },
          phone: { type: "string", description: "Pre-filled phone if known" },
          class_coordinator: { type: "string", description: "Pre-filled class coordinator if known" },
          role: { type: "string", enum: VALID_ROLES, description: "Pre-selected role" },
        },
        required: ["full_name", "email"],
      },
    },
  },
];

// ── Tool execution ──
async function executeTool(
  toolName: string,
  args: any,
  adminClient: any,
  clubId: string,
  userId: string
): Promise<string> {
  try {
    if (toolName === "import_members") {
      const results: { name: string; status: string; error?: string }[] = [];
      for (const member of args.members || []) {
        const email = member.email?.trim()?.toLowerCase();
        const fullName = member.full_name?.trim();
        if (!email || !fullName) { results.push({ name: fullName || "Unknown", status: "skipped", error: "Missing name/email" }); continue; }
        const role = VALID_ROLES.includes(member.role) ? member.role : "member";
        try {
          let uid: string | null = null;
          const { data: ep } = await adminClient.from("profiles").select("user_id").eq("email", email).maybeSingle();
          uid = ep?.user_id || null;
          if (!uid) {
            const { data: ul } = await adminClient.auth.admin.listUsers();
            const f = ul?.users?.find((u: any) => u.email === email);
            if (f) uid = f.id;
          }
          if (!uid) {
            const { data: nu, error: ce } = await adminClient.auth.admin.createUser({
              email, password: "iilm@123", email_confirm: true,
              user_metadata: { full_name: fullName, programme: member.programme || "", section: member.section || "", year: member.year || "", roll_no: member.roll_no || "", phone: member.phone || "", class_coordinator: member.class_coordinator || "" },
            });
            if (ce) { results.push({ name: fullName, status: "failed", error: ce.message }); continue; }
            uid = nu.user.id;
          } else {
            const upd: any = {};
            if (member.programme) upd.programme = member.programme;
            if (member.section) upd.section = member.section;
            if (member.year) upd.year = member.year;
            if (member.roll_no) upd.roll_no = member.roll_no;
            if (member.phone) upd.phone = member.phone;
            if (member.class_coordinator) upd.class_coordinator = member.class_coordinator;
            if (Object.keys(upd).length) await adminClient.from("profiles").update(upd).eq("user_id", uid);
          }
          const { data: em } = await adminClient.from("club_members").select("id, role").eq("user_id", uid).eq("club_id", clubId).maybeSingle();
          if (em) {
            if (em.role !== role) { await adminClient.from("club_members").update({ role }).eq("id", em.id); results.push({ name: fullName, status: "role_updated" }); }
            else results.push({ name: fullName, status: "already_exists" });
          } else {
            const { error: me } = await adminClient.from("club_members").insert({ club_id: clubId, user_id: uid, role });
            results.push({ name: fullName, status: me ? "failed" : "added", error: me?.message });
          }
        } catch (e: any) { results.push({ name: fullName, status: "failed", error: e.message }); }
      }
      const added = results.filter(r => r.status === "added").length;
      const updated = results.filter(r => r.status === "role_updated").length;
      const skipped = results.filter(r => ["already_exists", "skipped"].includes(r.status)).length;
      const failed = results.filter(r => r.status === "failed").length;
      return JSON.stringify({ success: true, summary: { total: results.length, added, updated, skipped, failed }, results });
    }

    if (toolName === "add_single_member") {
      const email = args.email?.trim()?.toLowerCase();
      const fullName = args.full_name?.trim();
      if (!email || !fullName) return JSON.stringify({ error: "Missing name or email" });
      const role = VALID_ROLES.includes(args.role) ? args.role : "member";
      let uid: string | null = null;
      const { data: ep } = await adminClient.from("profiles").select("user_id").eq("email", email).maybeSingle();
      uid = ep?.user_id || null;
      if (!uid) {
        const { data: ul } = await adminClient.auth.admin.listUsers();
        const f = ul?.users?.find((u: any) => u.email === email);
        if (f) uid = f.id;
      }
      if (!uid) {
        const { data: nu, error: ce } = await adminClient.auth.admin.createUser({
          email, password: "iilm@123", email_confirm: true,
          user_metadata: { full_name: fullName, programme: args.programme || "", section: args.section || "", year: args.year || "", roll_no: args.roll_no || "", phone: args.phone || "", class_coordinator: args.class_coordinator || "" },
        });
        if (ce) return JSON.stringify({ error: ce.message });
        uid = nu.user.id;
      } else {
        // Update profile with any provided details
        const upd: any = {};
        if (args.programme) upd.programme = args.programme;
        if (args.section) upd.section = args.section;
        if (args.year) upd.year = args.year;
        if (args.roll_no) upd.roll_no = args.roll_no;
        if (args.phone) upd.phone = args.phone;
        if (args.class_coordinator) upd.class_coordinator = args.class_coordinator;
        if (Object.keys(upd).length) await adminClient.from("profiles").update(upd).eq("user_id", uid);
      }
      const { data: em } = await adminClient.from("club_members").select("id").eq("user_id", uid).eq("club_id", clubId).maybeSingle();
      if (em) return JSON.stringify({ error: "Already a member of this club" });
      const { error: me } = await adminClient.from("club_members").insert({ club_id: clubId, user_id: uid, role });
      if (me) return JSON.stringify({ error: me.message });
      return JSON.stringify({ success: true, name: fullName, role, action: "added" });
    }

    if (toolName === "remove_member") {
      const email = args.email?.trim()?.toLowerCase();
      if (!email) return JSON.stringify({ error: "Email is required" });
      const { data: profile } = await adminClient.from("profiles").select("user_id, full_name").eq("email", email).maybeSingle();
      if (!profile) return JSON.stringify({ error: `No user found with email: ${email}` });
      const { data: membership } = await adminClient.from("club_members").select("id, role").eq("user_id", profile.user_id).eq("club_id", clubId).maybeSingle();
      if (!membership) return JSON.stringify({ error: `${profile.full_name} is not a member of this club` });
      if (membership.role === "president") return JSON.stringify({ error: "Cannot remove the president. Change their role first." });
      const { error } = await adminClient.from("club_members").delete().eq("id", membership.id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, name: profile.full_name, action: "removed" });
    }

    if (toolName === "update_member") {
      const email = args.email?.trim()?.toLowerCase();
      if (!email) return JSON.stringify({ error: "Email is required" });
      const { data: profile } = await adminClient.from("profiles").select("user_id, full_name").eq("email", email).maybeSingle();
      if (!profile) return JSON.stringify({ error: `No user found with email: ${email}` });
      
      // Update profile fields
      const profileUpd: any = {};
      if (args.full_name) profileUpd.full_name = args.full_name;
      if (args.programme) profileUpd.programme = args.programme;
      if (args.year) profileUpd.year = args.year;
      if (args.section) profileUpd.section = args.section;
      if (args.roll_no) profileUpd.roll_no = args.roll_no;
      if (args.phone) profileUpd.phone = args.phone;
      if (args.class_coordinator) profileUpd.class_coordinator = args.class_coordinator;
      
      const changes: string[] = [];
      if (Object.keys(profileUpd).length) {
        const { error } = await adminClient.from("profiles").update(profileUpd).eq("user_id", profile.user_id);
        if (error) return JSON.stringify({ error: error.message });
        changes.push(...Object.keys(profileUpd));
      }
      
      // Update club role if requested
      if (args.new_role && VALID_ROLES.includes(args.new_role)) {
        const { data: membership } = await adminClient.from("club_members").select("id").eq("user_id", profile.user_id).eq("club_id", clubId).maybeSingle();
        if (membership) {
          const { error } = await adminClient.from("club_members").update({ role: args.new_role }).eq("id", membership.id);
          if (error) return JSON.stringify({ error: error.message });
          changes.push(`role → ${args.new_role}`);
        } else {
          return JSON.stringify({ error: `${profile.full_name} is not a member of this club` });
        }
      }
      
      if (changes.length === 0) return JSON.stringify({ error: "No fields to update" });
      return JSON.stringify({ success: true, name: profile.full_name, updated_fields: changes, action: "updated" });
    }

    if (toolName === "update_profiles_bulk") {
      const results: { email: string; status: string; error?: string }[] = [];
      for (const upd of args.updates || []) {
        const email = upd.email?.trim()?.toLowerCase();
        if (!email) { results.push({ email: "unknown", status: "skipped", error: "No email" }); continue; }
        try {
          const { data: profile } = await adminClient.from("profiles").select("user_id").eq("email", email).maybeSingle();
          if (!profile) { results.push({ email, status: "not_found" }); continue; }
          const fields: any = {};
          if (upd.full_name) fields.full_name = upd.full_name;
          if (upd.programme) fields.programme = upd.programme;
          if (upd.year) fields.year = upd.year;
          if (upd.section) fields.section = upd.section;
          if (upd.roll_no) fields.roll_no = upd.roll_no;
          if (upd.phone) fields.phone = upd.phone;
          if (upd.class_coordinator) fields.class_coordinator = upd.class_coordinator;
          if (Object.keys(fields).length === 0) { results.push({ email, status: "skipped", error: "No fields to update" }); continue; }
          const { error } = await adminClient.from("profiles").update(fields).eq("user_id", profile.user_id);
          results.push({ email, status: error ? "failed" : "updated", error: error?.message });
        } catch (e: any) { results.push({ email, status: "failed", error: e.message }); }
      }
      const updated = results.filter(r => r.status === "updated").length;
      const notFound = results.filter(r => r.status === "not_found").length;
      const failed = results.filter(r => r.status === "failed").length;
      return JSON.stringify({ success: true, summary: { total: results.length, updated, not_found: notFound, failed }, results });
    }

    if (toolName === "fetch_event_data") {
      const search = (args.event_name || "").toLowerCase();
      const { data: events } = await adminClient.from("events")
        .select("id, name, event_date, end_date, event_type, category, access_type, description, attendance_given, club_id")
        .eq("club_id", clubId)
        .order("event_date", { ascending: false });
      
      // Also fetch club name
      const { data: clubRow } = await adminClient.from("clubs").select("name").eq("id", clubId).maybeSingle();
      const clubName = clubRow?.name || "Unknown Club";
      
      const matched = (events || []).filter((e: any) => e.name.toLowerCase().includes(search));
      if (matched.length === 0) return JSON.stringify({ error: `No event found matching "${args.event_name}"` });
      
      const eventResults = [];
      for (const event of matched.slice(0, 5)) {
        const { data: attendance } = await adminClient.from("attendance")
          .select("student_id, scanned_at, status, manually_added")
          .eq("event_id", event.id);
        
        const studentIds = (attendance || []).map((a: any) => a.student_id);
        let attendeeProfiles: any[] = [];
        if (studentIds.length > 0) {
          const { data } = await adminClient.from("profiles")
            .select("user_id, full_name, email, roll_no, phone, programme, year, section, class_coordinator, avatar_url")
            .in("user_id", studentIds);
          attendeeProfiles = data || [];
        }
        
        const attendees = (attendance || []).map((a: any) => {
          const p = attendeeProfiles.find((pr: any) => pr.user_id === a.student_id);
          return {
            name: p?.full_name || "Unknown",
            email: p?.email || "",
            roll_no: p?.roll_no || "",
            phone: p?.phone || "",
            programme: p?.programme || "",
            year: p?.year || "",
            section: p?.section || "",
            class_coordinator: p?.class_coordinator || "",
            avatar_url: p?.avatar_url || "",
            scanned_at: a.scanned_at,
            status: a.status,
            method: a.manually_added ? "Manual" : "QR Scan",
          };
        });
        
        eventResults.push({
          club_name: clubName,
          event_id: event.id,
          name: event.name,
          date: event.event_date,
          end_date: event.end_date,
          type: event.event_type,
          category: event.category,
          access_type: event.access_type,
          attendance_given: event.attendance_given,
          description: event.description,
          total_attendees: attendees.length,
          attendees,
        });
      }
      
      return JSON.stringify({ success: true, events: eventResults });
    }

    if (toolName === "request_member_form") {
      // This doesn't execute any DB action — just returns the pre-filled data
      // so the AI can output a member-form-json block
      return JSON.stringify({
        success: true,
        action: "show_form",
        prefilled: {
          full_name: args.full_name || "",
          email: args.email || "",
          programme: args.programme || "",
          year: args.year || "",
          section: args.section || "",
          roll_no: args.roll_no || "",
          phone: args.phone || "",
          class_coordinator: args.class_coordinator || "",
          role: args.role || "member",
        },
      });
    }

    if (toolName === "create_event") {
      const { error } = await adminClient.from("events").insert({
        club_id: clubId,
        name: args.name,
        event_date: args.event_date,
        end_date: args.end_date || null,
        event_type: args.event_type || "Workshop",
        category: args.category || "Optional",
        access_type: args.access_type || "Open to Club",
        description: args.description || null,
        created_by: userId,
      });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, event_name: args.name });
    }

    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  } catch (e: any) {
    return JSON.stringify({ error: e.message });
  }
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { message, conversation_history = [], active_club_id, file_data, file_urls, file_name } = await req.json();
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: adminRole } = await adminClient
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    const isSuperAdmin = !!adminRole;

    const { data: userClubs } = await adminClient
      .from("club_members").select("club_id, role, clubs(id, name, description, about)").eq("user_id", userId);

    // Gate logic
    let clubIds: string[];
    let canExecuteActions = false;

    if (active_club_id) {
      if (!isSuperAdmin) {
        const membership = (userClubs || []).find((c: any) => c.club_id === active_club_id);
        if (!membership) {
          return new Response(JSON.stringify({ error: "You are not a member of this club" }), { status: 403, headers: corsHeaders });
        }
        const memberRole = membership.role;
        if (memberRole !== 'president' && memberRole !== 'admin') {
          const { data: powerData } = await adminClient
            .from('delegated_powers').select('id, power').eq('club_id', active_club_id).eq('user_id', userId);
          const hasChatbotAccess = (powerData || []).some((p: any) => p.power === 'use_chatbot');
          if (!hasChatbotAccess) {
            return new Response(JSON.stringify({ error: "You don't have chatbot access for this club" }), { status: 403, headers: corsHeaders });
          }
        }
        // Can execute actions if president, or has delegated powers
        canExecuteActions = memberRole === 'president' || memberRole === 'vice_president' || memberRole === 'secretary';
        // Also allow if user has any delegated power (they're trusted post-holders)
        if (!canExecuteActions) {
          const { data: powerData } = await adminClient
            .from('delegated_powers').select('id').eq('club_id', active_club_id).eq('user_id', userId).limit(1);
          if (powerData && powerData.length > 0) canExecuteActions = true;
        }
      } else {
        canExecuteActions = true;
      }
      clubIds = [active_club_id];
    } else if (isSuperAdmin) {
      clubIds = [];
      canExecuteActions = false;
    } else {
      clubIds = (userClubs || []).map((c: any) => c.club_id);
      canExecuteActions = false;
    }

    if (!isSuperAdmin && (!clubIds || clubIds.length === 0)) {
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

    // Fetch data
    let clubsQuery = adminClient.from("clubs").select("id, name, description, about");
    if (clubIds.length > 0) clubsQuery = clubsQuery.in("id", clubIds);
    const { data: clubs } = await clubsQuery;

    let membersQuery = adminClient.from("club_members").select("club_id, role, user_id");
    if (clubIds.length > 0) membersQuery = membersQuery.in("club_id", clubIds);
    const { data: members } = await membersQuery;

    let eventsQuery = adminClient.from("events").select("id, name, event_date, end_date, club_id, category, event_type, access_type, description").order("event_date", { ascending: false }).limit(50);
    if (clubIds.length > 0) eventsQuery = eventsQuery.in("club_id", clubIds);
    const { data: events } = await eventsQuery;

    const eventIds = (events || []).map((e: any) => e.id);
    let attendanceData: any[] = [];
    if (eventIds.length > 0) {
      const { data } = await adminClient.from("attendance").select("event_id, student_id, status").in("event_id", eventIds);
      attendanceData = data || [];
    }

    const memberUserIds = (members || []).map((m: any) => m.user_id);
    let profiles: any[] = [];
    if (memberUserIds.length > 0) {
      const { data } = await adminClient.from("profiles").select("user_id, full_name, email, programme, year, roll_no, phone, social_instagram, social_linkedin, social_gmail, class_coordinator, section").in("user_id", memberUserIds);
      profiles = data || [];
    }

    // Build context
    const clubSummaries = (clubs || []).map((club: any) => {
      const clubMembers = (members || []).filter((m: any) => m.club_id === club.id);
      const clubEvents = (events || []).filter((e: any) => e.club_id === club.id);
      const clubAttendance = attendanceData.filter((a: any) => clubEvents.some((e: any) => e.id === a.event_id));
      const memberDetails = clubMembers.map((m: any) => {
        const p = profiles.find((pr: any) => pr.user_id === m.user_id);
        return { name: p?.full_name || "Unknown", email: p?.email, role: m.role, programme: p?.programme, year: p?.year, phone: p?.phone, section: p?.section, class_coordinator: p?.class_coordinator, instagram: p?.social_instagram, linkedin: p?.social_linkedin, gmail: p?.social_gmail };
      });
      const eventDetails = clubEvents.slice(0, 10).map((e: any) => {
        const eventAttendees = attendanceData
          .filter((a: any) => a.event_id === e.id)
          .map((a: any) => { const p = profiles.find((pr: any) => pr.user_id === a.student_id); return p?.full_name || "Unknown"; });
        return { name: e.name, date: e.event_date, type: e.event_type, category: e.category, attendance_count: eventAttendees.length, attendees: eventAttendees.slice(0, 50) };
      });
      return {
        name: club.name, description: club.description, about: club.about,
        total_members: clubMembers.length,
        members_by_role: clubMembers.reduce((acc: any, m: any) => { acc[m.role] = (acc[m.role] || 0) + 1; return acc; }, {}),
        member_list: memberDetails, total_events: clubEvents.length, recent_events: eventDetails,
        total_attendance_records: clubAttendance.length,
      };
    });

    const scopedToClub = !!active_club_id;
    const activeClubName = scopedToClub ? (clubs || []).find((c: any) => c.id === active_club_id)?.name || "your club" : null;

    const userRoleDesc = isSuperAdmin
      ? (scopedToClub ? `Super Admin currently viewing: ${activeClubName}` : "Super Admin with unrestricted access to all clubs")
      : `Club member currently viewing: ${activeClubName || (userClubs || []).map((c: any) => `${c.clubs?.name} (${c.role})`).join(", ")}`;

    const scopeRule = scopedToClub
      ? `**SECURITY RULE**: You must ONLY answer questions about "${activeClubName}". If asked about other clubs, respond: "Sorry, I can only provide information about ${activeClubName} right now."`
      : (isSuperAdmin ? "You have unrestricted access to all club data." : "You must only answer questions about the user's own clubs.");

    // File context
    let fileContext = "";
    if (file_data && file_data.headers && file_data.rows) {
      fileContext = `\n\n**UPLOADED FILE**: "${file_name || 'spreadsheet'}"
Headers: ${JSON.stringify(file_data.headers)}
Data (${file_data.rows.length} rows): ${JSON.stringify(file_data.rows.slice(0, 100))}
${file_data.rows.length > 100 ? `... and ${file_data.rows.length - 100} more rows` : ""}

If the user wants to import these as members, use the import_members tool. Map the columns intelligently to member fields.
If the file contains emails and class_coordinator names (or other profile fields), use the update_profiles_bulk tool to update those profiles.`;
    }
    if (file_urls && file_urls.length > 0) {
      fileContext += `\n\n**UPLOADED FILE**: "${file_name || 'file'}" — URL: ${file_urls[0]}`;
    }

    const actionInstructions = canExecuteActions && scopedToClub
      ? `\n\n**AGENT CAPABILITIES**: You can perform actions on "${activeClubName}" using tools:
- import_members: bulk import from spreadsheet data
- add_single_member: add one member (use when you have all details)
- request_member_form: show a form in chat when adding a single member with incomplete details. Output the result as a \`\`\`member-form-json block.
- remove_member: remove a member by email
- update_member: update a member's profile or role
- update_profiles_bulk: bulk update profile fields (e.g. class_coordinator) from a file
- fetch_event_data: get detailed attendance data for an event. **CRITICAL**: You MUST use this tool whenever the user asks for event details, event report, attendance data, attendance report, download event info, export attendance, or anything related to viewing/downloading a specific event's information. After calling this tool, you MUST output the result ONLY as an \`\`\`event-data-json block. NEVER output event details as plain text or as \`\`\`events-json when the user is asking about a specific event's details/report/attendance.
- create_event: create a new event

**IMPORTANT RULES FOR ACTIONS**:
1. When adding a SINGLE member and you only have name + email, use request_member_form to show an interactive form. Output the form data like:
\`\`\`member-form-json
{"full_name":"John","email":"john@iilm.edu","programme":"","year":"","section":"","roll_no":"","phone":"","class_coordinator":"","role":"member"}
\`\`\`

2. When adding MULTIPLE members (bulk), just use import_members — no form needed, email is sufficient.

3. **CRITICAL EVENT DATA RULE**: After using fetch_event_data, you MUST output the first matched event as an \`\`\`event-data-json block. Use the exact fields from the tool result. The format MUST be:
\`\`\`event-data-json
{"club_name":"Club Name","event_name":"Event Name","event_date":"...","end_date":"...","event_type":"...","category":"...","access_type":"...","attendance_given":true,"description":"...","total_attendees":25,"attendees":[{"name":"...","email":"...","roll_no":"...","phone":"...","programme":"...","year":"...","section":"...","class_coordinator":"...","avatar_url":"...","scanned_at":"...","method":"QR Scan"}]}
\`\`\`
Do NOT add any text before or after this block. The frontend will render it as an interactive card.

4. When you use any action tool (except fetch_event_data), wrap the result in a \`\`\`tool-result block.
5. After executing a tool, summarize what was done clearly.
6. NEVER hallucinate data. Only use real data from the database.`
      : "\n\n**NOTE**: You are in read-only mode. You can answer questions but cannot perform actions.";

    const systemPrompt = `You are ClubBot, an AI assistant and agent for a club management platform. You have real-time access to club data and can perform actions when authorized.

**User Role**: ${userRoleDesc}

${scopeRule}${actionInstructions}

**Club Data**:
${JSON.stringify(clubSummaries, null, 2)}${fileContext}

**RESPONSE FORMAT RULES (STRICTLY FOLLOW)**:

**MEMBER QUERIES**: When the user asks about members, respond with a JSON block wrapped in \`\`\`members-json markers. Format:
\`\`\`members-json
{"header":"Club Members","subtext":"5 members found","members":[{"name":"John Doe","role":"President","programme":"B.Tech CSE","email":"john@iilm.edu","phone":"9876543210","instagram":"https://instagram.com/john","linkedin":"https://linkedin.com/in/john","gmail":"john@gmail.com"}]}
\`\`\`

**EVENT QUERIES**: When the user asks about events, respond with a JSON block wrapped in \`\`\`events-json markers. Format:
\`\`\`events-json
{"header":"Recent Events","subtext":"3 events found","events":[{"name":"Hackathon 2026","date":"2026-03-15","end_date":"2026-03-16","type":"hackathon","category":"technical","access_type":"open","description":"Annual coding competition","attendance_count":45,"attendees":["Alice","Bob"]}]}
\`\`\`

**TOOL RESULTS**: After using a tool, wrap the result summary in \`\`\`tool-result markers:
\`\`\`tool-result
{"action":"import_members","title":"Members Imported","summary":"Successfully processed 15 members","details":{"added":12,"updated":2,"skipped":1,"failed":0},"items":[{"name":"John Doe","status":"added"},{"name":"Jane Doe","status":"already_exists"}]}
\`\`\`

**EVENT DATA (for download)**: After using fetch_event_data, output as:
\`\`\`event-data-json
{"event_name":"Event Name","event_date":"2026-03-15T10:00:00","end_date":"2026-03-15T16:00:00","event_type":"Workshop","category":"Technical","access_type":"Open to All","attendance_given":true,"description":"Event description here","total_attendees":25,"attendees":[...]}
\`\`\`

**MEMBER FORM**: When showing an add-member form, output as:
\`\`\`member-form-json
{"full_name":"...","email":"...","programme":"","year":"","section":"","roll_no":"","phone":"","class_coordinator":"","role":"member"}
\`\`\`

**OTHER QUERIES**: For non-member, non-event queries, use clean markdown.

Answer questions accurately. If asked about data you don't have, say so honestly.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build messages
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...conversation_history,
      { role: "user", content: message },
    ];

    // If actions are available, use tool-calling loop (non-streaming for tool calls)
    if (canExecuteActions && scopedToClub) {
      let currentMessages = [...aiMessages];
      let maxIterations = 5;

      while (maxIterations-- > 0) {
        console.log(`Tool loop iteration, messages: ${currentMessages.length}`);
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: currentMessages,
            tools: agentTools,
          }),
        });

        if (!aiResponse.ok) {
          const status = aiResponse.status;
          const errText = await aiResponse.text();
          console.error("AI gateway error in tool loop:", status, errText);
          if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const aiData = await aiResponse.json();
        const choice = aiData.choices?.[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) {
          console.error("No assistant message in AI response:", JSON.stringify(aiData));
          break;
        }

        currentMessages.push(assistantMessage);

        // Check for tool calls
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          for (const toolCall of assistantMessage.tool_calls) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              console.log(`Executing tool: ${toolCall.function.name}`);
              const result = await executeTool(toolCall.function.name, args, adminClient, active_club_id, userId);
              console.log(`Tool result: ${result.substring(0, 200)}`);
              currentMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: result,
              });
            } catch (toolErr: any) {
              console.error(`Tool execution error: ${toolErr.message}`);
              currentMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify({ error: toolErr.message }),
              });
            }
          }
          continue;
        }

        // No tool calls — we have the final text response, stream it directly
        const finalContent = assistantMessage.content || "I completed the requested actions.";
        const encoder = new TextEncoder();
        // Split into chunks for smoother streaming
        const chunkSize = 50;
        const chunks: string[] = [];
        for (let i = 0; i < finalContent.length; i += chunkSize) {
          chunks.push(finalContent.slice(i, i + chunkSize));
        }
        const stream = new ReadableStream({
          start(controller) {
            for (const chunk of chunks) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`));
            }
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Fallback if loop exhausted
      const encoder = new TextEncoder();
      const fallbackContent = "I completed the requested actions. Please check the results.";
      const body = `data: ${JSON.stringify({ choices: [{ delta: { content: fallbackContent } }] })}\n\ndata: [DONE]\n\n`;
      return new Response(encoder.encode(body), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Read-only mode: stream directly
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
