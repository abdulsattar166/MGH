import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type AuditLog = {
  id: number;
  user_name: string | null;
  user_role: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  details: string | null;
  created_at: string;
};

export async function logAudit(input: {
  action: string;
  resource?: string;
  resourceId?: string;
  details?: string;
}): Promise<void> {
  try {
    if (apiMode) {
      await api.post("/audit-logs", {
        action: input.action,
        resource: input.resource ?? null,
        resourceId: input.resourceId ?? null,
        details: input.details ?? null,
      });
      return;
    }
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle();

    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_name: profile?.name ?? user.email ?? "Unknown",
      user_role: profile?.role ?? "unknown",
      action: input.action,
      resource: input.resource ?? null,
      resource_id: input.resourceId ?? null,
      details: input.details ?? null,
    });
  } catch {
    // audit logging must never break the main flow
  }
}

export async function fetchAuditLogs(limit = 10): Promise<AuditLog[]> {
  if (apiMode) {
    return api.get<AuditLog[]>(`/audit-logs?limit=${limit}`);
  }
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}

export async function fetchAuditLogsAll(limit = 500): Promise<AuditLog[]> {
  if (apiMode) {
    return api.get<AuditLog[]>(`/audit-logs?limit=${limit}`);
  }
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}