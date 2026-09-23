import jwt from "jsonwebtoken";

const SECRET = "652251e7a003373037167941d3378a001ef74e271ce23a50d15805bafebe0e3e";
const BASE = "http://localhost:4000/api";

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: "1d" });
}

async function req(path, opts = {}, token) {
  const res = await fetch(BASE + path, {
    method: opts.method ?? "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const log = [];
const ok = (n, c, x = "") => log.push(`${c ? "PASS" : "FAIL"} ${n} ${x}`);

const warden11 = tokenFor({ id: 11, role: "warden", email: "mali1122330309@gmail.com" }); // hostel 1
const warden12 = tokenFor({ id: 12, role: "warden", email: "abdulsattar1122@gmail.com" }); // hostel 2

// Bookings scoping
const b1 = await req("/bookings", {}, warden11);
const b2 = await req("/bookings", {}, warden12);
ok("warden11 bookings is array", Array.isArray(b1.data));
ok("warden12 bookings is array", Array.isArray(b2.data));
if (Array.isArray(b1.data) && Array.isArray(b2.data)) {
  const hostels1 = new Set(b1.data.map((x) => x.hostelId));
  const hostels2 = new Set(b2.data.map((x) => x.hostelId));
  ok("warden11 only hostel 1", [...hostels1].every((h) => h === 1));
  ok("warden12 only hostel 2", [...hostels2].every((h) => h === 2));
}

// Fees scoping
const f1 = await req("/fees", {}, warden11);
const f2 = await req("/fees", {}, warden12);
if (Array.isArray(f1.data)) ok("warden11 fees scoped", f1.data.every((x) => x.hostelId === 1), `${f1.data.length} records`);
if (Array.isArray(f2.data)) ok("warden12 fees scoped", f2.data.every((x) => x.hostelId === 2), `${f2.data.length} records`);

// Axis attempt: warden11 tries to read booking in hostel 2 (attempt to create booking in hostel 2? not needed)
// Warden12 tries to view another warden's booking via GET /:id won't be possible without id; test fee status change on hostel 1 fee with warden12
await ok("...");

const students = await req("/students", {}, warden11);
ok("warden11 students scoped", Array.isArray(students.data) && students.data.every((s) => s.hostel_id === 1));

// PDF for warden
const pdf = await fetch(`${BASE}/reports/pdf`, {
  headers: { Authorization: `Bearer ${warden11}` },
});
ok("warden pdf", pdf.status === 200 && (pdf.headers.get("content-type") ?? "").includes("application/pdf"), pdf.status);

// Notifications scoping by user
const notif11 = await req("/notifications", {}, warden11);
ok("warden11 notifications exist", Array.isArray(notif11.data) && notif11.data.length >= 1, `count=${notif11.data.length}`);

// improvement create (public) + warden see it
const s1 = students.data[0];
const imp = await req("/improvements/create", {
  method: "POST",
  body: { subject: "Add water coolers", category: "Facilities", description: "Please add water coolers on floor 3", studentCode: s1?.cnic ?? "" },
});
ok("improvement create", imp.status === 200, imp.data?.improvement?.code ?? imp.data?.error);
const imps = await req("/improvements/list", { method: "POST", body: {} }, warden11);
ok("warden sees improvements", Array.isArray(imps.data.improvements) && imps.data.improvements.length >= 1, imps.data?.error ?? `count=${imps.data.improvements.length}`);

console.log(log.join("\n"));
process.exit(0);