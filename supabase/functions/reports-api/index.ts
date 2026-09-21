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

  const { data: me } = await admin
    .from("profiles")
    .select("id, role, hostel_id")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!me || !["admin", "superintendent", "warden"].includes(me.role as string)) {
    return json({ error: "You do not have access to reports." }, 403);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const [hostelsRes, studentsRes, complaintsRes, profilesRes] = await Promise.all([
      admin.from("hostels").select("id, name, gender, rooms, beds").order("id"),
      admin.from("students").select("id, name, hostel_id, room, room_type, status, monthly_fee"),
      admin.from("complaints").select("id, status, hostel_id, warden_id, priority, created_at, category"),
      admin.from("profiles").select("id, name, role, hostel_id, position").in("role", ["warden", "superintendent"]),
    ]);

    for (const r of [hostelsRes, studentsRes, complaintsRes, profilesRes]) {
      if (r.error) return json({ error: r.error.message }, 400);
    }

    const hostels = (hostelsRes.data ?? []) as {
      id: number; name: string; gender: string; rooms: number; beds: number;
    }[];
    const wardens = (profilesRes.data ?? []) as {
      id: string; name: string; role: string; hostel_id: number | null; position: string | null;
    }[];
    const wardenByHostel = new Map<number, string>();
    for (const w of wardens) if (w.hostel_id) wardenByHostel.set(w.hostel_id, w.name);

    // Determine the effective hostel scope (warden is locked to their own hostel).
    let scope: number | null = me.role === "warden" ? (me.hostel_id as number | null) : null;
    if (me.role !== "warden" && body.hostelId) scope = Number(body.hostelId);

    const wardenFilter = body.wardenId ? String(body.wardenId) : null;
    const statusFilter = body.status ? String(body.status) : null;
    const fromFilter = body.from ? String(body.from) : null;
    const toFilter = body.to ? String(body.to) : null;

    const allStudents = (studentsRes.data ?? []) as {
      id: number; name: string; hostel_id: number | null; room: string | null;
      room_type: string | null; status: string; monthly_fee: number;
    }[];
    let students = scope ? allStudents.filter((s) => s.hostel_id === scope) : allStudents;

    const allComplaints = (complaintsRes.data ?? []) as {
      id: number; status: string; hostel_id: number | null; warden_id: string | null;
      priority: string; created_at: string; category: string;
    }[];
    let complaints = scope ? allComplaints.filter((c) => c.hostel_id === scope) : allComplaints;
    if (wardenFilter) complaints = complaints.filter((c) => c.warden_id === wardenFilter);
    if (statusFilter) complaints = complaints.filter((c) => c.status === statusFilter);
    if (fromFilter) complaints = complaints.filter((c) => c.created_at >= fromFilter);
    if (toFilter) complaints = complaints.filter((c) => c.created_at <= toFilter);

    const visibleHostels = scope ? hostels.filter((h) => h.id === scope) : hostels;
    const activeStudents = students.filter((s) => s.status !== "Left");

    const studentsByHostel = visibleHostels.map((h) => {
      const count = activeStudents.filter((s) => s.hostel_id === h.id).length;
      return {
        id: h.id, name: h.name, gender: h.gender,
        students: count, beds: h.beds, rooms: h.rooms,
        occupied: count,
        vacant: Math.max(0, h.beds - count),
        occupancy: h.beds ? Math.round((count / h.beds) * 100) : 0,
        warden: wardenByHostel.get(h.id) ?? null,
      };
    });

    const roomMap = new Map<string, number>();
    for (const s of activeStudents) {
      const key = `${s.hostel_id ?? "?"}|${s.room ?? "Unassigned"}`;
      roomMap.set(key, (roomMap.get(key) ?? 0) + 1);
    }
    const studentsByRoom = Array.from(roomMap.entries())
      .map(([key, count]) => {
        const [hostelId, room] = key.split("|");
        return { hostelId: Number(hostelId), room, count };
      })
      .sort((a, b) => a.room.localeCompare(b.room));

    const totalBeds = visibleHostels.reduce((s, h) => s + h.beds, 0);
    const occupiedBeds = activeStudents.length;

    const byStatus: Record<string, number> = {};
    for (const c of allComplaints) {
      if (scope && c.hostel_id !== scope) continue;
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
    }

    const complaintsByHostel = visibleHostels.map((h) => ({
      id: h.id,
      name: h.name,
      total: complaints.filter((c) => c.hostel_id === h.id).length,
      pending: complaints.filter((c) => c.hostel_id === h.id && c.status === "Pending").length,
      resolved: complaints.filter((c) => c.hostel_id === h.id && c.status === "Resolved").length,
    }));

    const wardenScope = scope ? wardens.filter((w) => w.hostel_id === scope) : wardens;
    const wardenStats = wardenScope
      .filter((w) => !wardenFilter || w.id === wardenFilter)
      .map((w) => ({
        id: w.id,
        name: w.name,
        position: w.position ?? "Warden",
        hostelId: w.hostel_id,
        hostel: w.hostel_id ? visibleHostels.find((h) => h.id === w.hostel_id)?.name ?? null : null,
        students: w.hostel_id ? activeStudents.filter((s) => s.hostel_id === w.hostel_id).length : 0,
        complaints: complaints.filter((c) => c.warden_id === w.id).length,
        resolved: complaints.filter((c) => c.warden_id === w.id && c.status === "Resolved").length,
        pending: complaints.filter((c) => c.warden_id === w.id && c.status === "Pending").length,
      }));

    const monthlyExpected = activeStudents.reduce((s, st) => s + Number(st.monthly_fee ?? 0), 0);

    return json({
      ok: true,
      generatedAt: new Date().toISOString(),
      scope,
      summary: {
        totalStudents: activeStudents.length,
        allStudents: students.length,
        totalBeds,
        occupiedBeds,
        vacantBeds: Math.max(0, totalBeds - occupiedBeds),
        occupancy: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        monthlyExpected,
        totalComplaints: complaints.length,
        pendingComplaints: byStatus["Pending"] ?? 0,
        inProgressComplaints:
          (byStatus["In Progress"] ?? 0) +
          (byStatus["Under Review"] ?? 0) +
          (byStatus["Assigned"] ?? 0),
        resolvedComplaints: byStatus["Resolved"] ?? 0,
        rejectedComplaints: byStatus["Rejected"] ?? 0,
      },
      byStatus,
      studentsByHostel,
      studentsByRoom,
      complaintsByHostel,
      wardenStats,
      wardens: wardens.map((w) => ({ id: w.id, name: w.name, hostelId: w.hostel_id })),
      hostels: visibleHostels.map((h) => ({ id: h.id, name: h.name })),
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
