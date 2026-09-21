import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type Notice = {
  id: number;
  hostel_id: number;
  title: string;
  body: string;
  author_name: string | null;
  is_pinned: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string | null;
};

const NOTICE_COLS =
  "id, hostel_id, title, body, author_name, is_pinned, expires_at, created_at, updated_at";

export function isNoticeExpired(notice: Pick<Notice, "expires_at">): boolean {
  if (!notice.expires_at) return false;
  return new Date(notice.expires_at).getTime() < Date.now();
}

export async function fetchNotices(hostelId?: number | null): Promise<Notice[]> {
  if (apiMode) {
    return api.get<Notice[]>(`/notices${hostelId ? `?hostelId=${hostelId}` : ""}`);
  }
  let query = supabase
    .from("notices")
    .select(NOTICE_COLS)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (hostelId) query = query.eq("hostel_id", hostelId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as Notice[]) ?? [];
}

export async function createNotice(payload: {
  hostelId: number;
  title: string;
  body: string;
  authorName?: string | null;
  isPinned?: boolean;
  expiresAt?: string | null;
}): Promise<Notice | null> {
  if (apiMode) {
    const data = await api.post<Notice | undefined>("/notices", {
      hostelId: payload.hostelId,
      title: payload.title,
      body: payload.body,
      authorName: payload.authorName ?? null,
      isPinned: payload.isPinned ?? false,
      expiresAt: payload.expiresAt || null,
    });
    return data ?? null;
  }
  const { data, error } = await supabase
    .from("notices")
    .insert({
      hostel_id: payload.hostelId,
      title: payload.title,
      body: payload.body,
      author_name: payload.authorName ?? null,
      is_pinned: payload.isPinned ?? false,
      expires_at: payload.expiresAt || null,
    })
    .select(NOTICE_COLS)
    .single();
  if (error) throw new Error(error.message);
  return (data as Notice) ?? null;
}

export async function updateNotice(
  id: number,
  patch: { title?: string; body?: string; isPinned?: boolean; expiresAt?: string | null }
): Promise<Notice | null> {
  if (apiMode) {
    const data = await api.put<Notice | undefined>(`/notices/${id}`, patch);
    return data ?? null;
  }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.body !== undefined) updates.body = patch.body;
  if (patch.isPinned !== undefined) updates.is_pinned = patch.isPinned;
  if (patch.expiresAt !== undefined) updates.expires_at = patch.expiresAt || null;

  const { data, error } = await supabase
    .from("notices")
    .update(updates)
    .eq("id", id)
    .select(NOTICE_COLS)
    .single();
  if (error) throw new Error(error.message);
  return (data as Notice) ?? null;
}

export async function deleteNotice(id: number): Promise<void> {
  if (apiMode) {
    await api.del(`/notices/${id}`);
    return;
  }
  const { error } = await supabase.from("notices").delete().eq("id", id);
  if (error) throw new Error(error.message);
}