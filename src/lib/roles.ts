/**
 * Human-friendly display labels for management roles.
 *
 * The stored role value stays the same (e.g. "warden") so that existing
 * Supabase data, RLS policies and the Express backend keep working unchanged —
 * we only change how the role is *shown* to the user.
 */
const ROLE_LABELS: Record<string, string> = {
  admin: "Super Admin",
  superintendent: "Superintendent",
  warden: "Hostel Admin",
  student: "Student",
};

/** Resolve a stored role value to its display label (falls back to the raw value). */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}