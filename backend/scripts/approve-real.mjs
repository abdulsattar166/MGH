const BASE = "http://localhost:4000/api";

// AUTH_DISABLED => default admin acts as super admin, same as warden-11 flow the manager uses.
// Approve the EXACT booking the user reported failing.
const res = await fetch(`${BASE}/bookings/MGH-2026-000001/approve`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
});
const text = await res.text();
let data;
try { data = JSON.parse(text); } catch { data = text; }
console.log("STATUS:", res.status);
console.log("BODY:", JSON.stringify(data).slice(0, 900));
