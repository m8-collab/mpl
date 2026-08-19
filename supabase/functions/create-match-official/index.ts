// Supabase Edge Function: create-match-official
//
// Lets a full admin create a ready-to-use login for a match official
// directly (email + password set by the admin), instead of the official
// self-registering and waiting for approval. This can't be done safely
// from the browser — creating another person's auth account requires the
// service role key, which must never be shipped to a client.
//
// Deploy: supabase functions deploy create-match-official
// (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are
// injected automatically by Supabase — no manual secrets needed.)

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password } = await req.json();
    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Email and a password (6+ chars) are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the CALLER is a real, approved, full admin — using their own
    // token against the anon-key client, so RLS applies normally. This is
    // the actual security check; everything after this point trusts it.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "Not signed in" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerAdminRow } = await callerClient
      .from("admins")
      .select("approved, role")
      .eq("user_id", userRes.user.id)
      .single();

    if (!callerAdminRow?.approved || callerAdminRow.role !== "admin") {
      return new Response(JSON.stringify({ error: "Only approved full admins can do this" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller is a verified full admin — now use the service role to
    // actually create the match official's account.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip the confirmation email — the admin is vouching for this account directly
      user_metadata: { role: "match_official" },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "Couldn't create the account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The handle_new_admin_signup trigger already inserted a pending
    // admins row (role read from user_metadata above). Auto-approve it —
    // an admin creating this account directly IS the approval.
    const { error: approveErr } = await adminClient
      .from("admins")
      .update({ approved: true })
      .eq("user_id", created.user.id);
    if (approveErr) {
      return new Response(JSON.stringify({ error: `Account created but approval failed: ${approveErr.message}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: created.user.id, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
