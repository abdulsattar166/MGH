import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !serviceRole) return json({ error: "Backend service is not configured." }, 500);

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: authData, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !authData?.user) return json({ error: "You are not signed in." }, 401);

  const { data: caller } = await admin
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (!caller || caller.role !== "admin") {
    return json({ error: "Only the super admin can manage warden accounts." }, 403);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = String(body.action ?? "list");
  const COLS = "id, name, email, phone, hostel_id, avatar_url, role, position, is_active";
  const userId = body.userId ? String(body.userId) : "";

  try {
    if (action === "list") {
      const { data, error } = await admin
        .from("profiles")
        .select(COLS)
        .in("role", ["warden", "superintendent"])
        .order("name");
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, wardens: data ?? [] });
    }

    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const name = String(body.name ?? "").trim();
      const phone = body.phone ? String(body.phone).trim() : null;
      const hostelId = body.hostelId ? Number(body.hostelId) : null;
      const role = body.role === "superintendent" ? "superintendent" : "warden";
      const avatarUrl = body.avatarUrl ? String(body.avatarUrl) : null;
      const position = body.position ? String(body.position).trim() : "";
      if (!email || !name || password.length < 6) {
        return json(
          { error: "Please provide a name, a valid email and a password of at least 6 characters." },
          400
        );
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });
      if (error) return json({ error: error.message }, 400);
      const id = data?.user?.id;
      const { error: profErr } = await admin.from("profiles").upsert({
        id,
        role,
        name,
        email,
        phone,
        hostel_id: hostelId,
        avatar_url: avatarUrl,
        position: position || (role === "warden" ? "Warden" : "Superintendent"),
        is_active: true,
        must_change_password: true,
      });
      if (profErr) return json({ error: profErr.message }, 400);
      return json({ ok: true, userId: id });
    }

    if (action === "update") {
      if (!userId) return json({ error: "Missing account id." }, 400);
      const fields: Record<string, unknown> = {};
      if (body.name !== undefined) fields.name = String(body.name).trim();
      if (body.phone !== undefined) fields.phone = body.phone ? String(body.phone).trim() : null;
      if (body.position !== undefined) fields.position = body.position ? String(body.position) : null;
      if (body.avatarUrl !== undefined) fields.avatar_url = body.avatarUrl ? String(body.avatarUrl) : null;
      if (body.hostelId !== undefined) {
        fields.hostel_id = body.hostelId === null || body.hostelId === "" ? null : Number(body.hostelId);
      }
      const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
      if (email) {
        const { error } = await admin.auth.admin.updateUserById(userId, { email });
        if (error) return json({ error: error.message }, 400);
        fields.email = email;
      }
      if (Object.keys(fields).length) {
        const { error } = await admin.from("profiles").update(fields).eq("id", userId);
        if (error) return json({ error: error.message }, 400);
      }
      return json({ ok: true });
    }

    if (action === "set-hostel") {
      if (!userId) return json({ error: "Missing account id." }, 400);
      const hostelId = body.hostelId === null || body.hostelId === "" ? null : Number(body.hostelId);
      const { error } = await admin.from("profiles").update({ hostel_id: hostelId }).eq("id", userId);
      if (error) return json({ error: error.message }, 400);
      // New permissions apply immediately: re-point this warden's open complaints.
      if (hostelId) {
        await admin
          .from("complaints")
          .update({ warden_id: userId })
          .eq("hostel_id", hostelId)
          .is("warden_id", null);
      }
      return json({ ok: true });
    }

    if (action === "reset-password") {
      if (!userId) return json({ error: "Missing account id." }, 400);
      const password = String(body.password ?? "");
      const mustChange = body.mustChangePassword !== false;
      if (password.length < 6) {
        return json({ error: "Password must be at least 6 characters." }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").update({ must_change_password: mustChange }).eq("id", userId);
      return json({ ok: true });
    }

    if (action === "set-active") {
      if (!userId) return json({ error: "Missing account id." }, 400);
      const active = Boolean(body.isActive);
      const { error } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: active ? "none" : "876000h",
      });
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").update({ is_active: active }).eq("id", userId);
      return json({ ok: true });
    }

    if (action === "delete") {
      if (!userId) return json({ error: "Missing account id." }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      await admin.from("profiles").delete().eq("id", userId);
      return json({ ok: true });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
