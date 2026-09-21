import { supabase } from "@/lib/supabase";
import { api, apiMode } from "@/lib/api";

export type ManagedWarden = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  hostel_id: number | null;
  avatar_url: string | null;
  role: string;
  position: string | null;
  is_active: boolean;
};

type Result = { ok?: boolean; wardens?: ManagedWarden[]; userId?: string; error?: string };

async function call(action: string, body: Record<string, unknown> = {}): Promise<Result> {
  if (apiMode) {
    const path = action === "list" ? "/wardens" : "/wardens/manage";
    return api.post<Result>(path, { action, ...body });
  }
  const { data, error } = await supabase.functions.invoke<Result>("manage-wardens", {
    body: { action, ...body },
  });
  if (error) throw new Error(error.message || "Request failed.");
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}

export async function listWardens(): Promise<ManagedWarden[]> {
  const res = await call("list");
  return res.wardens ?? [];
}

export async function createWarden(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  hostelId?: number | null;
  role?: string;
  avatarUrl?: string | null;
}): Promise<void> {
  await call("create", { ...payload });
}

export async function updateWarden(payload: {
  userId: string;
  name?: string;
  email?: string;
  phone?: string | null;
  hostelId?: number | null;
  position?: string | null;
  avatarUrl?: string | null;
}): Promise<void> {
  await call("update", { ...payload });
}

export async function setWardenHostel(userId: string, hostelId: number | null): Promise<void> {
  await call("set-hostel", { userId, hostelId });
}

export async function resetWardenPassword(
  userId: string,
  password: string,
  mustChangePassword = true
): Promise<void> {
  await call("reset-password", { userId, password, mustChangePassword });
}

export async function setWardenActive(userId: string, isActive: boolean): Promise<void> {
  await call("set-active", { userId, isActive });
}

export async function deleteWarden(userId: string): Promise<void> {
  await call("delete", { userId });
}