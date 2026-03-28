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
      description: "Add a single member to the active club.",
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
          role: { type: "string", enum: VALID_ROLES },
        },
        required: ["full_name", "email"],
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
              email, password: crypto.randomUUID() + "Aa1!", email_confirm: true,
              user_metadata: { full_name: fullName, programme: member.programme || "", section: member.section || "", year: member.year || "", roll_no: member.roll_no || "", phone: member.phone || "" },
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
          email, password: crypto.randomUUID() + "Aa1!", email_confirm: true,
          user_metadata: { full_name: fullName, programme: args.programme || "", section: args.section || "", year: args.year || "", roll_no: args.roll_no || "", phone: args.phone || "" },
        });
        if (ce) return JSON.stringify({ error: ce.message });
        uid = nu.user.id;
      }
      const { data: em } = await adminClient.from("club_members").select("id").eq("user_id", uid).eq("club_id", clubId).maybeSingle();
      if (em) return JSON.stringify({ error: "Already a member of this club" });
      const { error: me } = await adminClient.from("club_members").insert({ club_id: clubId, user_id: uid, role });
      if (me) return JSON.stringify({ error: me.message });
      return JSON.stringify({ success: true, name: fullName, role, action: "added" });
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

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
            .from('delegated_powers').select('id').eq('club_id', active_club_id).eq('user_id', userId).eq('power', 'use_chatbot').maybeSingle();
          if (!powerData) {
            return new Response(JSON.stringify({ error: "You don't have chatbot access for this club" }), { status: 403, headers: corsHeaders });
          }
        }
        // Can execute actions if president or has delegated powers
        canExecuteActions = memberRole === 'president' || memberRole === 'vice_president' || memberRole === 'secretary';
      } else {
        canExecuteActions = true; // Super admin can do anything
      }
      clubIds = [active_club_id];
    } else if (isSuperAdmin) {
      clubIds = [];
      canExecuteActions = false; // Need a specific club for actions
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

If the user wants to import these as members, use the import_members tool. Map the columns intelligently to member fields.`;
    }
    if (file_urls && file_urls.length > 0) {
      fileContext += `\n\n**UPLOADED FILE**: "${file_name || 'file'}" — URL: ${file_urls[0]}`;
    }

    const actionInstructions = canExecuteActions && scopedToClub
      ? `\n\n**AGENT CAPABILITIES**: You can perform actions on "${activeClubName}" using tools:
- import_members: bulk import from spreadsheet data
- add_single_member: add one member
- create_event: create a new event
When you use a tool, wrap the result in a \`\`\`tool-result block so the UI can render it nicely.
After executing a tool, summarize what was done clearly.`
      : "\n\n**NOTE**: You are in read-only mode. You can answer questions but cannot perform actions.";

    const systemPrompt = `You are ClubBot, an AI assistant for a club management platform. You have real-time access to club data.

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
          if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const aiData = await aiResponse.json();
        const choice = aiData.choices?.[0];
        const assistantMessage = choice?.message;

        if (!assistantMessage) break;

        currentMessages.push(assistantMessage);

        // Check for tool calls
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          for (const toolCall of assistantMessage.tool_calls) {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeTool(toolCall.function.name, args, adminClient, active_club_id, userId);
            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }
          continue; // Loop again so AI can process tool results
        }

        // No tool calls — stream the final response
        // Re-request with streaming for final output
        const streamResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: currentMessages,
            stream: true,
          }),
        });

        return new Response(streamResp.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // Fallback: return last message as plain text
      const lastMsg = currentMessages[currentMessages.length - 1];
      const content = typeof lastMsg === 'object' && lastMsg.content ? lastMsg.content : "I completed the requested actions.";
      // Stream it manually
      const encoder = new TextEncoder();
      const body = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`;
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
