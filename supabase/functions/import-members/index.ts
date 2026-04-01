import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ROLES = ["president", "vice_president", "secretary", "social_media_head", "member"];
const DEFAULT_PASSWORD = "iilm@123";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Permission check
    const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id);
    const { data: callerClubRoles } = await adminClient.from("club_members").select("role, club_id").eq("user_id", caller.id);
    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    const isPresident = callerClubRoles?.some((r: any) => r.role === "president");

    if (!isAdmin && !isPresident) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { club_id, raw_data, headers: columnHeaders } = body;

    if (!club_id || !raw_data || !Array.isArray(raw_data) || raw_data.length === 0) {
      return new Response(JSON.stringify({ error: "Missing club_id or raw_data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify club access
    if (!isAdmin) {
      const isPresidentOfClub = callerClubRoles?.some((r: any) => r.role === "president" && r.club_id === club_id);
      if (!isPresidentOfClub) {
        return new Response(JSON.stringify({ error: "You can only import members to clubs you preside over" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Use AI to map columns intelligently
    let mappedMembers: any[];

    if (lovableApiKey) {
      const sampleRows = raw_data.slice(0, 5);
      const aiPrompt = `You are a data mapping assistant. Given spreadsheet data with these column headers: ${JSON.stringify(columnHeaders)}

Here are sample rows: ${JSON.stringify(sampleRows)}

Map each row to this structure:
- full_name (string, required) - the person's full name
- email (string, required) - their email address  
- programme (string, optional) - academic programme like "B.Tech (CS)", "BBA", etc.
- year (string, optional) - academic year like "1st Year", "2nd Year", etc.
- section (string, optional) - section like "A", "B", etc.
- roll_no (string, optional) - roll number or admission number
- phone (string, optional) - phone number
- role (string, optional) - club role. Must be one of: president, vice_president, secretary, social_media_head, member. Default to "member" if unclear. Map common terms: "VP" or "Vice President" → "vice_president", "Secretary" or "Sec" → "secretary", "Social Media" or "SMH" → "social_media_head", "President" or "Pres" → "president", everything else → "member".

IMPORTANT: Process ALL ${raw_data.length} rows, not just the samples.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: aiPrompt },
              { role: "user", content: `Here is the FULL data to process (${raw_data.length} rows):\n${JSON.stringify(raw_data)}` },
            ],
            tools: [{
              type: "function",
              function: {
                name: "map_members",
                description: "Return the mapped member data",
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
            }],
            tool_choice: { type: "function", function: { name: "map_members" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const parsed = JSON.parse(toolCall.function.arguments);
            mappedMembers = parsed.members;
          } else {
            mappedMembers = fallbackMapping(raw_data, columnHeaders);
          }
        } else {
          console.error("AI gateway error:", aiResponse.status);
          mappedMembers = fallbackMapping(raw_data, columnHeaders);
        }
      } catch (aiErr) {
        console.error("AI mapping failed, using fallback:", aiErr);
        mappedMembers = fallbackMapping(raw_data, columnHeaders);
      }
    } else {
      mappedMembers = fallbackMapping(raw_data, columnHeaders);
    }

    // Process each mapped member
    const results: { name: string; status: string; error?: string }[] = [];

    for (const member of mappedMembers) {
      const email = member.email?.trim()?.toLowerCase();
      const fullName = member.full_name?.trim();

      if (!email || !fullName) {
        results.push({ name: fullName || "Unknown", status: "skipped", error: "Missing name or email" });
        continue;
      }

      // Validate role
      const role = VALID_ROLES.includes(member.role) ? member.role : "member";

      try {
        // Check existing user
        let userId: string | null = null;

        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("user_id")
          .eq("email", email)
          .maybeSingle();

        userId = existingProfile?.user_id || null;

        if (!userId) {
          const { data: usersData } = await adminClient.auth.admin.listUsers();
          const found = usersData?.users?.find((u: any) => u.email === email);
          if (found) userId = found.id;
        }

        if (!userId) {
          // Create new user
          const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
            email,
            password: DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              programme: member.programme || "",
              section: member.section || "",
              year: member.year || "",
              roll_no: member.roll_no || "",
              phone: member.phone || "",
            },
          });

          if (createErr) {
            results.push({ name: fullName, status: "failed", error: createErr.message });
            continue;
          }
          userId = newUser.user.id;
        } else {
          // Update profile with any new info
          const updates: Record<string, string> = {};
          if (member.programme) updates.programme = member.programme;
          if (member.section) updates.section = member.section;
          if (member.year) updates.year = member.year;
          if (member.roll_no) updates.roll_no = member.roll_no;
          if (member.phone) updates.phone = member.phone;

          if (Object.keys(updates).length > 0) {
            await adminClient.from("profiles").update(updates).eq("user_id", userId);
          }
        }

        // Check existing membership
        const { data: existingMembership } = await adminClient
          .from("club_members")
          .select("id, role")
          .eq("user_id", userId)
          .eq("club_id", club_id)
          .maybeSingle();

        if (existingMembership) {
          if (existingMembership.role !== role) {
            await adminClient.from("club_members").update({ role }).eq("id", existingMembership.id);
            results.push({ name: fullName, status: "role_updated" });
          } else {
            results.push({ name: fullName, status: "already_exists" });
          }
        } else {
          const { error: memberErr } = await adminClient.from("club_members").insert({
            club_id,
            user_id: userId,
            role,
          });

          if (memberErr) {
            results.push({ name: fullName, status: "failed", error: memberErr.message });
          } else {
            results.push({ name: fullName, status: "added" });
          }
        }
      } catch (err: any) {
        results.push({ name: fullName, status: "failed", error: err.message });
      }
    }

    const added = results.filter(r => r.status === "added").length;
    const updated = results.filter(r => r.status === "role_updated").length;
    const skipped = results.filter(r => r.status === "already_exists" || r.status === "skipped").length;
    const failed = results.filter(r => r.status === "failed").length;

    return new Response(JSON.stringify({
      success: true,
      summary: { total: results.length, added, updated, skipped, failed },
      results,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Fallback mapping when AI is unavailable
function fallbackMapping(rows: any[], headers: string[]): any[] {
  const lowerHeaders = headers.map(h => h?.toLowerCase()?.trim() || "");

  const findCol = (keywords: string[]) => {
    return lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const nameIdx = findCol(["name", "full_name", "full name", "student name"]);
  const emailIdx = findCol(["email", "mail", "e-mail"]);
  const progIdx = findCol(["programme", "program", "course", "branch", "dept"]);
  const yearIdx = findCol(["year", "yr"]);
  const sectionIdx = findCol(["section", "sec"]);
  const rollIdx = findCol(["roll", "admission", "enrollment", "enroll", "reg"]);
  const phoneIdx = findCol(["phone", "mobile", "contact", "cell"]);
  const roleIdx = findCol(["role", "position", "post", "designation"]);

  return rows.map((row: any) => {
    const values = Array.isArray(row) ? row : Object.values(row);

    const roleRaw = roleIdx >= 0 ? String(values[roleIdx] || "").toLowerCase().trim() : "";
    let role = "member";
    if (roleRaw.includes("president") && !roleRaw.includes("vice")) role = "president";
    else if (roleRaw.includes("vice") || roleRaw === "vp") role = "vice_president";
    else if (roleRaw.includes("secretary") || roleRaw === "sec") role = "secretary";
    else if (roleRaw.includes("social") || roleRaw === "smh") role = "social_media_head";

    return {
      full_name: nameIdx >= 0 ? String(values[nameIdx] || "").trim() : "",
      email: emailIdx >= 0 ? String(values[emailIdx] || "").trim() : "",
      programme: progIdx >= 0 ? String(values[progIdx] || "").trim() : "",
      year: yearIdx >= 0 ? String(values[yearIdx] || "").trim() : "",
      section: sectionIdx >= 0 ? String(values[sectionIdx] || "").trim() : "",
      roll_no: rollIdx >= 0 ? String(values[rollIdx] || "").trim() : "",
      phone: phoneIdx >= 0 ? String(values[phoneIdx] || "").trim() : "",
      role,
    };
  });
}
