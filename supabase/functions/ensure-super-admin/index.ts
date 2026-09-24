import { createClient } from "npm:@supabase/supabase-js@2";

const SUPER_ADMIN_EMAIL = "mubarikmehdi@admin.com";
const SUPER_ADMIN_PASSWORD = "admin@12345";
const SUPER_ADMIN_NAME = "Mubarak Mehdi";

Deno.serve(async (req) => {
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!url || !serviceRole) {
    return json({ error: "Backend service is not configured." });
  }

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: session, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !session?.user) {
    return json({ error: "You are not signed in." });
  }

  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!caller || caller.role !== "admin") {
    return json({ error: "Only the super admin can perform this action." });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", SUPER_ADMIN_EMAIL)
    .maybeSingle();

  if (profile) {
    const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
      password: SUPER_ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (updErr) return json({ error: updErr.message });

    await admin.from("profiles").update({ role: "admin" }).eq("id", profile.id);
    return json({ ok: true, action: "updated" });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { name: SUPER_ADMIN_NAME },
  });
  if (createErr) return json({ error: createErr.message });

  const id = created?.user?.id;
  if (id) {
    await admin
      .from("profiles")
      .update({ role: "admin", email: SUPER_ADMIN_EMAIL, name: SUPER_ADMIN_NAME })
      .eq("id", id);
  }

  return json({ ok: true, action: "created" });
});