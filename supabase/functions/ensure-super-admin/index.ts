import { createClient } from "npm:@supabase/supabase-js@2";

const SUPER_ADMINS = [
  {
    email: "abdulsattar1717asm@gmail.com",
    password: "Admin@12345",
    name: "Abdul Sattar",
    position: "Super Admin",
  },
  {
    email: "mubarakmehdi@admin.com",
    password: "mubarakhostels@12345",
    name: "Mubarak Mehdi",
    position: "Founder & CEO",
  },
];

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

  const results: string[] = [];

  for (const superAdmin of SUPER_ADMINS) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", superAdmin.email)
      .maybeSingle();

    if (profile) {
      const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
        password: superAdmin.password,
        email_confirm: true,
      });
      if (updErr) return json({ error: updErr.message });

      await admin
        .from("profiles")
        .update({ role: "admin", name: superAdmin.name, position: superAdmin.position })
        .eq("id", profile.id);
      results.push(`updated:${superAdmin.email}`);
      continue;
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: superAdmin.email,
      password: superAdmin.password,
      email_confirm: true,
      user_metadata: { name: superAdmin.name },
    });
    if (createErr) return json({ error: createErr.message });

    const id = created?.user?.id;
    if (id) {
      await admin.from("profiles").upsert({
        id,
        role: "admin",
        email: superAdmin.email,
        name: superAdmin.name,
        position: superAdmin.position,
      });
    }
    results.push(`created:${superAdmin.email}`);
  }

  return json({ ok: true, results });
});
