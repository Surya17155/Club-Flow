import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPER_ADMIN_EMAIL = "suryakant.gnbba2029@iilm.edu";
const DEFAULT_PASSWORD = "iilm@123";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token);

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only super admin can manage outsiders
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");
    const isSuperAdmin = !!(roleData && roleData.length > 0);

    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Only Super Admin can perform this action" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // LIST outsiders
    if (req.method === "GET" || action === "list") {
      // Outsiders are users whose email does NOT end with @iilm.edu
      const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const outsiderUsers = usersData.users.filter((u: any) => u.email && !u.email.endsWith("@iilm.edu"));
      const outsiderIds = outsiderUsers.map((u: any) => u.id);

      // Fetch profiles
      let profiles: any[] = [];
      if (outsiderIds.length > 0) {
        const { data: profileData } = await adminClient
          .from("profiles")
          .select("*")
          .in("user_id", outsiderIds);
        profiles = profileData || [];
      }

      // Fetch club memberships
      let memberships: any[] = [];
      if (outsiderIds.length > 0) {
        const { data: memberData } = await adminClient
          .from("club_members")
          .select("user_id, role, clubs(name)")
          .in("user_id", outsiderIds);
        memberships = memberData || [];
      }

      const result = outsiderUsers.map((u: any) => {
        const profile = profiles.find((p: any) => p.user_id === u.id);
        const clubs = memberships
          .filter((m: any) => m.user_id === u.id)
          .map((m: any) => ({ club_name: (m.clubs as any)?.name, role: m.role }));
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          full_name: profile?.full_name || "",
          programme: profile?.programme || "",
          year: profile?.year || "",
          section: profile?.section || "",
          roll_no: profile?.roll_no || "",
          phone: profile?.phone || "",
          avatar_url: profile?.avatar_url || "",
          about: profile?.about || "",
          clubs,
        };
      });

      return new Response(JSON.stringify({ outsiders: result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ADD outsider
    if (req.method === "POST") {
      const body = await req.json();
      const action = body.action;

      if (action === "update") {
        const { user_id, full_name, programme, section, year, roll_no, phone } = body;
        if (!user_id) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const updates: Record<string, string> = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (programme !== undefined) updates.programme = programme;
        if (section !== undefined) updates.section = section;
        if (year !== undefined) updates.year = year;
        if (roll_no !== undefined) updates.roll_no = roll_no;
        if (phone !== undefined) updates.phone = phone;

        const { error: updateError } = await adminClient
          .from("profiles")
          .update(updates)
          .eq("user_id", user_id);
        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ success: true, action: "updated" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete") {
        const { user_id } = body;
        if (!user_id) {
          return new Response(JSON.stringify({ error: "Missing user_id" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete club memberships first
        await adminClient.from("club_members").delete().eq("user_id", user_id);
        // Delete profile
        await adminClient.from("profiles").delete().eq("user_id", user_id);
        // Delete user roles
        await adminClient.from("user_roles").delete().eq("user_id", user_id);
        // Delete auth user
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, action: "deleted" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Default: create outsider
      const { email, full_name, programme, section, year, roll_no, phone } = body;

      if (!email || !full_name) {
        return new Response(JSON.stringify({ error: "Missing required fields (email, full_name)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (email.endsWith("@iilm.edu")) {
        return new Response(JSON.stringify({ error: "This feature is for non-IILM emails only. IILM users should use normal signup." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create auth user with default password
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name,
          programme: programme || "",
          section: section || "",
          year: year || "",
          roll_no: roll_no || "",
          phone: phone || "",
        },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id, action: "created" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid method" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
