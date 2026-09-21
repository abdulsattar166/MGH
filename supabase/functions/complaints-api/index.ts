import { createClient } from "npm:@supabase/supabase-js@2";

type Profile = {
  id: string;
  role: string;
  hostel_id: number | null;
  name: string | null;
  student_id: number | null;
};

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
  let me: Profile | null = null;
  if (token) {
    const { data: authData } = await admin.auth.getUser(token);
    if (authData?.user) {
      const { data: profile } = await admin
        .from("profiles")
        .select("id, role, hostel_id, name, student_id")
        .eq("id", authData.user.id)
        .maybeSingle();
      me = (profile as Profile) ?? null;
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = String(body.action ?? "list");

  const resolveWarden = async (hostelId: number | null) => {
    if (!hostelId) return null;
    const { data } = await admin
      .from("profiles")
      .select("id, name")
      .eq("role", "warden")
      .eq("hostel_id", hostelId)
      .maybeSingle();
    return data as { id: string; name: string } | null;
  };

  try {
    if (action === "list") {
      if (!me) return json({ error: "You are not signed in." }, 401);

      let query = admin.from("complaints").select("*").order("created_at", { ascending: false });

      if (me.role === "warden") {
        if (!me.hostel_id) return json({ ok: true, complaints: [] });
        query = query.eq("hostel_id", me.hostel_id);
      } else if (me.role === "admin" || me.role === "superintendent") {
        if (body.hostelId) query = query.eq("hostel_id", Number(body.hostelId));
        if (body.wardenId) query = query.eq("warden_id", String(body.wardenId));
      } else if (me.role === "student") {
        if (me.student_id) query = query.eq("student_id", me.student_id);
        else return json({ ok: true, complaints: [] });
      } else {
        return json({ error: "You do not have access to complaints." }, 403);
      }

      if (body.status) query = query.eq("status", String(body.status));
      if (body.priority) query = query.eq("priority", String(body.priority));
      if (body.from) query = query.gte("created_at", String(body.from));
      if (body.to) query = query.lte("created_at", String(body.to));

      const { data, error } = await query;
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, complaints: data ?? [] });
    }

    if (action === "lookup") {
      const code = String(body.studentCode ?? "").trim();
      if (!code) return json({ error: "Please enter your CNIC or Student ID." }, 400);

      let student: { id: number; name: string; cnic: string | null } | null = null;
      const { data: byCnic } = await admin
        .from("students")
        .select("id, name, cnic")
        .eq("cnic", code)
        .maybeSingle();
      if (byCnic) student = byCnic as typeof student;
      if (!student && /^\d+$/.test(code)) {
        const { data: byId } = await admin
          .from("students")
          .select("id, name, cnic")
          .eq("id", Number(code))
          .maybeSingle();
        if (byId) student = byId as typeof student;
      }
      if (!student) {
        return json({ error: "No student found with that CNIC or Student ID." }, 404);
      }

      const { data: complaints, error: cErr } = await admin
        .from("complaints")
        .select("*")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false });
      if (cErr) return json({ error: cErr.message }, 400);

      const ids = ((complaints ?? []) as { id: number }[]).map((c) => c.id);
      let responses: unknown[] = [];
      if (ids.length) {
        const { data: resp, error: rErr } = await admin
          .from("complaint_responses")
          .select("*")
          .in("complaint_id", ids)
          .order("created_at", { ascending: true });
        if (rErr) return json({ error: rErr.message }, 400);
        responses = resp ?? [];
      }

      return json({ ok: true, complaints: complaints ?? [], responses });
    }

    if (action === "create") {
      const description = String(body.description ?? "").trim();
      const category = String(body.category ?? "Other");
      const priority = String(body.priority ?? "Normal");
      if (!description) return json({ error: "Please describe your complaint." }, 400);

      let studentId: number | null = me?.student_id ?? null;
      if (!studentId && body.studentId) studentId = Number(body.studentId);
      if (!studentId && body.studentCode) {
        const { data: byCode } = await admin
          .from("students")
          .select("id")
          .eq("cnic", String(body.studentCode))
          .maybeSingle();
        if (byCode) studentId = Number((byCode as { id: number }).id);
      }

      let student: Record<string, unknown> | null = null;
      if (studentId) {
        const { data } = await admin.from("students").select("*").eq("id", studentId).maybeSingle();
        student = (data as Record<string, unknown>) ?? null;
      }

      const hostelId = (student?.hostel_id as number | undefined) ?? me?.hostel_id ?? null;
      const warden = await resolveWarden(hostelId ?? null);

      const { count } = await admin
        .from("complaints")
        .select("id", { count: "exact", head: true });
      const year = new Date().getFullYear();
      const code = `CMP-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;

      const studentName =
        (student?.name as string) ?? me?.name ?? (String(body.studentName ?? "") || null);

      const insert = {
        code,
        student_id: studentId,
        student_name: studentName,
        student_code: (student?.cnic as string) ?? null,
        hostel_id: hostelId,
        warden_id: warden?.id ?? null,
        room: (student?.room as string) ?? (String(body.room ?? "") || null),
        category,
        description,
        priority,
        status: "Pending",
      };

      const { data, error } = await admin.from("complaints").insert(insert).select().maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, complaint: data });
    }

    if (action === "update") {
      if (!me) return json({ error: "You are not signed in." }, 401);
      const id = Number(body.id);
      if (!id) return json({ error: "Missing complaint id." }, 400);

      const { data: complaint } = await admin
        .from("complaints")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!complaint) return json({ error: "Complaint not found." }, 404);

      const c = complaint as Record<string, unknown>;
      const isStaff = me.role === "admin" || me.role === "superintendent";
      const isOwnWarden = me.role === "warden" && me.hostel_id === c.hostel_id;
      if (!isStaff && !isOwnWarden) {
        return json({ error: "You cannot modify complaints for another hostel." }, 403);
      }

      const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.status !== undefined) fields.status = String(body.status);
      if (body.remarks !== undefined) fields.remarks = String(body.remarks);
      if (body.priority !== undefined) fields.priority = String(body.priority);

      const { data, error } = await admin
        .from("complaints")
        .update(fields)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, complaint: data });
    }

    if (action === "stats") {
      if (!me) return json({ error: "You are not signed in." }, 401);
      let query = admin.from("complaints").select("id, status, hostel_id, warden_id");
      if (me.role === "warden") {
        if (!me.hostel_id) {
          return json({ ok: true, stats: { total: 0, byStatus: {}, byHostel: {}, byWarden: {} } });
        }
        query = query.eq("hostel_id", me.hostel_id);
      } else if (me.role !== "admin" && me.role !== "superintendent") {
        return json({ error: "You do not have access." }, 403);
      }
      const { data, error } = await query;
      if (error) return json({ error: error.message }, 400);
      const rows = (data ?? []) as { status: string; hostel_id: number | null; warden_id: string | null }[];
      const byStatus: Record<string, number> = {};
      const byHostel: Record<string, number> = {};
      const byWarden: Record<string, number> = {};
      for (const r of rows) {
        byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        const hk = String(r.hostel_id ?? "none");
        byHostel[hk] = (byHostel[hk] ?? 0) + 1;
        const wk = r.warden_id ?? "none";
        byWarden[wk] = (byWarden[wk] ?? 0) + 1;
      }
      return json({ ok: true, stats: { total: rows.length, byStatus, byHostel, byWarden } });
    }

    return json({ error: "Unknown action." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
