import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type HostelReportRow = {
  id: number;
  name: string;
  gender: string;
  students: number;
  beds: number;
  rooms: number;
  occupied: number;
  vacant: number;
  occupancy: number;
  warden: string | null;
};

export type WardenStatRow = {
  id: string;
  name: string;
  position: string;
  hostelId: number | null;
  hostel: string | null;
  students: number;
  complaints: number;
  resolved: number;
  pending: number;
};

export type ReportsData = {
  generatedAt: string;
  scope: number | null;
  summary: {
    totalStudents: number;
    allStudents: number;
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    occupancy: number;
    monthlyExpected: number;
    totalComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
    resolvedComplaints: number;
    rejectedComplaints: number;
  };
  byStatus: Record<string, number>;
  studentsByHostel: HostelReportRow[];
  studentsByRoom: { hostelId: number; room: string; count: number }[];
  complaintsByHostel: { id: number; name: string; total: number; pending: number; resolved: number }[];
  wardenStats: WardenStatRow[];
  wardens: { id: string; name: string; hostelId: number | null }[];
  hostels: { id: number; name: string }[];
};

type ReportsResult = ReportsData & { ok?: boolean; error?: string };

export type ReportFilters = {
  hostelId?: number | null;
  wardenId?: string | null;
  status?: string | null;
  from?: string | null;
  to?: string | null;
};

export async function fetchReports(filters: ReportFilters = {}): Promise<ReportsData> {
  const body: Record<string, unknown> = {};
  if (filters.hostelId) body.hostelId = filters.hostelId;
  if (filters.wardenId) body.wardenId = filters.wardenId;
  if (filters.status) body.status = filters.status;
  if (filters.from) body.from = filters.from;
  if (filters.to) body.to = filters.to;

  if (apiMode) {
    return api.post<ReportsData>("/reports", body);
  }
  const { data, error } = await supabase.functions.invoke<ReportsResult>("reports-api", {
    body,
  });
  if (error) throw new Error(error.message || "Could not load reports.");
  if (data?.error) throw new Error(data.error);
  return data as ReportsData;
}