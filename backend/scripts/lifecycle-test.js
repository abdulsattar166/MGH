const BASE = "http://localhost:4000/api";
async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}
const log = [];
const ok = (name, cond, extra = "") => log.push(`${cond ? "PASS" : "FAIL"} ${name} ${extra}`);

// Find an available bed in hostel 1
const avail = await req("/rooms/booking-rooms?hostelId=1");
let chosen = null;
for (const r of avail.data) {
  for (const b of r.beds) {
    if (b.status === "available") { chosen = { room: r.label, bed: b.number }; break; }
  }
  if (chosen) break;
}
ok("found available bed", Boolean(chosen), JSON.stringify(chosen));

if (chosen) {
  const applicant = {
    fullName: "E2E Test Student", fatherName: "T", gender: "Male", dob: "2000-01-01",
    mobile: "03001234567", whatsapp: "03001234567", email: "e2e@test.pk", cnic: "61101-1234567-1",
    cnicFront: "", cnicBack: "", district: "Test", city: "Test", tehsil: "T", province: "Punjab",
    country: "Pakistan", address: "Test Street", area: "T", joiningDate: "2026-10-01",
    duration: "6 Months", message: "E2E test", emergencyName: "X", emergencyPhone: "03001111111",
    emergencyRelation: "Father", occupation: "Student",
  };
  const created = await req("/public/bookings", {
    method: "POST",
    body: { hostel_id: 1, hostel_name: "Jinnah Boys House", room_label: chosen.room, block: chosen.room.charAt(0), floor: 1, bed_number: chosen.bed, applicant },
  });
  ok("create booking", created.status === 201, created.data?.id ?? created.data?.error);
  const bookingId = created.data?.id;

  if (bookingId) {
    const track = await req(`/public/track/${bookingId}`);
    ok("track pending", track.status === 200 && track.data?.status === "pending", track.data?.status);

    const listAsWarden = await req("/bookings");
    ok("list is array", Array.isArray(listAsWarden.data), JSON.stringify(listAsWarden.data).slice(0, 160) ?? String(listAsWarden.data));
    if (Array.isArray(listAsWarden.data)) {
      ok("appears in list", listAsWarden.data.some((b) => b.id === bookingId));
      ok("wardenId linked", Boolean(listAsWarden.data.find((b) => b.id === bookingId)?.wardenId));
    }

    const approved = await req(`/bookings/${bookingId}/approve`, { method: "PUT" });
    ok("approve booking", approved.status === 200, JSON.stringify(approved.data?.booking?.status ?? approved.data?.error));
    const studentId = approved.data?.studentId;

    const track2 = await req(`/public/track/${bookingId}`);
    ok("track approved", track2.status === 200 && track2.data?.status === "approved", `fee=${track2.data?.fee_amount}`);

    const fees = await req("/fees");
    ok("fee record created", Array.isArray(fees.data) && fees.data.some((f) => f.studentId === studentId), `studentId=${studentId}`);

    const notif = await req("/notifications");
    ok("notifications created", Array.isArray(notif.data) && notif.data.length >= 1, `count=${notif.data.length}`);

    // Now reject transition should fail (approved)
    const rejectAttempt = await req(`/bookings/${bookingId}/reject`, { method: "PUT", body: { reason: "test" } });
    ok("reject after approve fails", rejectAttempt.status === 400, rejectAttempt.data?.error);

    // Test a second booking then reject with reason
    const chosen2 = null;
  }
}

// Fee collect flow on an existing pending fee record (student 1, month 2026-09)
const feeSearch = await req("/fees?month=2026-09&status=approved");
if (feeSearch.data?.length) {
  const fee = feeSearch.data[0];
  const collect = await req("/fees/collect", { method: "POST", body: { student_id: fee.studentId, month: fee.month, amount: fee.amount, method: "cash" } });
  ok("fee collect", collect.status === 200 && collect.data?.status === "fetched", `status=${collect.data?.status} ref=${collect.data?.reference}`);
  const stats = await req("/fees/stats");
  ok("fee stats updated", stats.data?.collected > 0, `collected=${stats.data?.collected}`);
  const statusChange = await req(`/fees/${fee.id}/status`, { method: "POST", body: { status: "unfetched" } });
  ok("fee unfetched", statusChange.status === 200 && statusChange.data?.status === "unfetched", statusChange.data?.status);
}

// PDF report
const pdf = await fetch(`${BASE}/reports/pdf?wardenId=11`);
ok("pdf report", pdf.status === 200 && (pdf.headers.get("content-type") ?? "").includes("application/pdf"), `type=${pdf.headers.get("content-type")}`);

console.log(log.join("\n"));
process.exit(0);