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

const results = [];
function log(name, status, data) {
  const ok = status >= 200 && status < 300;
  results.push(`${ok ? "PASS" : "FAIL"} ${name} (${status}) -> ${JSON.stringify(data).slice(0, 220)}`);
}

try {
  const h = await req("/health");
  log("health", h.status, h.data);

  const bookings = await req("/bookings");
  log("bookings list", bookings.status, Array.isArray(bookings.data) ? { count: bookings.data.length, first: bookings.data[0]?.id } : bookings.data);

  const fees = await req("/fees?month=2026-09");
  log("fees list", fees.status, Array.isArray(fees.data) ? { count: fees.data.length } : fees.data);

  const notices = await req("/notifications");
  log("notifications list", notices.status, Array.isArray(notices.data) ? { count: notices.data.length } : { error: notices.data });

  const unread = await req("/notifications/unread");
  log("notifications unread", unread.status, unread.data);

  const stats = await req("/fees/stats");
  log("fees stats", stats.status, stats.data);

  const improStats = await req("/improvements/stats");
  log("improvements stats", improStats.status, improStats.data);

  const re = await req("/reports", { method: "POST", body: {} });
  log("reports", re.status, re.data?.summary ? { totalStudents: re.data.summary.totalStudents, feeCollected: re.data.summary.feeCollected } : re.data);

  const pb = await req("/public/bookings", {
    method: "POST",
    body: { hostel_id: 1, hostel_name: "Test", room_label: "A1", block: "A", floor: 1, bed_number: 999, applicant: { fullName: "Test User" } },
  });
  ok("public booking (bad bed) rejected cleanly", pb.status === 400, String(pb.data?.error ?? pb.data));
  const okb = await req("/public/bookings", {
    method: "POST",
    body: { hostel_id: 1, hostel_name: "Test", room_label: "A1", block: "A", floor: 1, bed_number: 2, applicant: { fullName: "Smoke Test" } },
  });
  ok("public booking (good bed) accepted w/ MGH id", okb.status === 201 && String(okb.data?.id ?? "").startsWith("MGH-"), String(okb.data?.id ?? okb.data?.error));
} catch (e) {
  console.error("EXCEPTION:", e.message);
  process.exitCode = 1;
}

console.log(results.join("\n"));
process.exit(process.exitCode ?? 0);