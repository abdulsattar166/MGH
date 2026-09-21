import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";
import type { ComplaintResponse } from "@/lib/complaintResponses";

export const COMPLAINT_STATUSES = [
  "Pending",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Rejected",
] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const COMPLAINT_CATEGORIES = [
  "Electrical",
  "Plumbing",
  "Internet",
  "Mess / Food",
  "Cleaning",
  "Furniture",
  "Security",
  "Other",
] as const;

export const COMPLAINT_PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;

export type Complaint = {
  id: number;
  code: string | null;
  student_id: number | null;
  student_name: string | null;
  student_code: string | null;
  hostel_id: number | null;
  warden_id: string | null;
  room: string | null;
  category: string;
  description: string;
  priority: string;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ComplaintFilters = {
  hostelId?: number | null;
  wardenId?: string | null;
  status?: string | null;
  priority?: string | null;
  from?: string | null;
  to?: string | null;
};

type InvokeResult = {
  complaints?: Complaint[];
  complaint?: Complaint;
  responses?: ComplaintResponse[];
  error?: string;
};

async function call(action: string, body: Record<string, unknown> = {}): Promise<InvokeResult> {
  if (apiMode) {
    const path = action === "list" ? "/complaints/list" : `/complaints/${action}`;
    return api.post<InvokeResult>(path, body);
  }
  const { data, error } = await supabase.functions.invoke<InvokeResult>("complaints-api", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message || "Request failed.");
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

export async function fetchComplaints(filters: ComplaintFilters = {}): Promise<Complaint[]> {
  const body: Record<string, unknown> = {};
  if (filters.hostelId) body.hostelId = filters.hostelId;
  if (filters.wardenId) body.wardenId = filters.wardenId;
  if (filters.status) body.status = filters.status;
  if (filters.priority) body.priority = filters.priority;
  if (filters.from) body.from = filters.from;
  if (filters.to) body.to = filters.to;
  const res = await call("list", body);
  return res.complaints ?? [];
}

export async function createComplaint(payload: {
  studentId?: number | null;
  studentCode?: string;
  studentName?: string;
  room?: string;
  category: string;
  description: string;
  priority: string;
}): Promise<Complaint | null> {
  const res = await call("create", { ...payload });
  return res.complaint ?? null;
}

export async function lookupComplaints(
  studentCode: string,
): Promise<{ complaints: Complaint[]; responses: ComplaintResponse[] }> {
  const res = await call("lookup", { studentCode });
  return { complaints: res.complaints ?? [], responses: res.responses ?? [] };
}

export async function updateComplaint(
  id: number,
  patch: { status?: string; remarks?: string; priority?: string }
): Promise<Complaint | null> {
  const res = await call("update", { id, ...patch });
  return res.complaint ?? null;
}