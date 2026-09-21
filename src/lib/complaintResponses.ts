import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";
import { logAudit } from "@/lib/auditLogs";

export type ComplaintResponse = {
  id: number;
  complaint_id: number;
  author_name: string | null;
  author_role: string | null;
  message: string;
  created_at: string;
};

export async function fetchComplaintResponses(
  complaintId: number,
): Promise<ComplaintResponse[]> {
  if (apiMode) {
    return api.get<ComplaintResponse[]>(`/complaints/${complaintId}/responses`);
  }
  const { data, error } = await supabase
    .from("complaint_responses")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ComplaintResponse[];
}

export async function addComplaintResponse(
  complaintId: number,
  message: string,
): Promise<void> {
  if (apiMode) {
    const res = await api.post<{ ok?: boolean; error?: string }>(`/complaints/${complaintId}/responses`, {
      message,
    });
    if (res?.error) throw new Error(res.error);
    void logAudit({
      action: "complaint.responded",
      resource: "complaints",
      resourceId: String(complaintId),
      details: "Added a response to a complaint",
    });
    return;
  }
  let authorId: string | null = null;
  let authorName: string | null = null;
  let authorRole: string | null = null;

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (user) {
    authorId = user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role")
      .eq("id", user.id)
      .maybeSingle();
    authorName = profile?.name ?? user.email ?? "Unknown";
    authorRole = profile?.role ?? "unknown";
  }

  const { error } = await supabase.from("complaint_responses").insert({
    complaint_id: complaintId,
    author_id: authorId,
    author_name: authorName,
    author_role: authorRole,
    message,
  });
  if (error) throw new Error(error.message);

  void logAudit({
    action: "complaint.responded",
    resource: "complaints",
    resourceId: String(complaintId),
    details: "Added a response to a complaint",
  });
}