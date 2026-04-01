import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Check caller permissions: must be admin or president of some club
    const { data: callerRoles } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id);
    const { data: callerClubRoles } = await adminClient.from("club_members").select("role, club_id").eq("user_id", caller.id);
    const isAdmin = callerRoles?.some((r: any) => r.role === "admin");
    const isPresident = callerClubRoles?.some((r: any) => r.role === "president");

    if (!isAdmin && !isPresident) {
      return new Response(JSON.stringify({ error: "Insufficient permissions" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, full_name, programme, section, year, roll_no, phone, club_id, role } = body;

    if (!email || !full_name || !club_id) {
      return new Response(JSON.stringify({ error: "Missing required fields (email, full_name, club_id)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If not admin, verify caller is president of THIS specific club
    if (!isAdmin) {
      const isPresidentOfClub = callerClubRoles?.some((r: any) => r.role === "president" && r.club_id === club_id);
      if (!isPresidentOfClub) {
        return new Response(JSON.stringify({ error: "You can only add members to clubs you preside over" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let userId: string;

    // Step 1: Check if user already exists by looking up profile by email
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("user_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    // Also try to find via auth (for users who signed up but profile email might differ)
    let existingUserId: string | null = existingProfile?.user_id || null;
    
    if (!existingUserId) {
      // Fallback: check auth users by email via listing
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      const found = usersData?.users?.find((u: any) => u.email === email.trim().toLowerCase());
      if (found) existingUserId = found.id;
    }

    if (existingUserId) {
      userId = existingUserId;

      // Update their profile with any new info provided (only if fields are non-empty)
      const profileUpdates: Record<string, string> = {};
      if (programme) profileUpdates.programme = programme;
      if (section) profileUpdates.section = section;
      if (year) profileUpdates.year = year;
      if (roll_no) profileUpdates.roll_no = roll_no;
      if (phone) profileUpdates.phone = phone;

      if (Object.keys(profileUpdates).length > 0) {
        await adminClient
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", userId);
      }
    } else {
      // Step 2: Create new auth user with default password
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

      userId = newUser.user.id;
    }

    // Step 3: Check if already a member of this club
    const { data: existingMembership } = await adminClient
      .from("club_members")
      .select("id, role")
      .eq("user_id", userId)
      .eq("club_id", club_id)
      .maybeSingle();

    if (existingMembership) {
      // Already a member — update role if different
      if (existingMembership.role !== (role || "member")) {
        await adminClient
          .from("club_members")
          .update({ role: role || "member" })
          .eq("id", existingMembership.id);
        return new Response(JSON.stringify({ success: true, user_id: userId, action: "role_updated" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "This person is already a member of this club" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 4: Add to club
    const { error: memberError } = await adminClient.from("club_members").insert({
      club_id,
      user_id: userId,
      role: role || "member",
    });

    if (memberError) {
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isNewUser = !existingUserId;
    return new Response(JSON.stringify({ 
      success: true, 
      user_id: userId, 
      action: isNewUser ? "created" : "added_existing",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
