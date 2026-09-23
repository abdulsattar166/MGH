import { api } from "@/lib/api";

export type Notification = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  data: unknown;
  isRead: boolean;
  createdAt: string;
};

export async function fetchNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>("/notifications");
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await api.get<{ count: number }>("/notifications/unread");
  return Number(data.count ?? 0);
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}

export async function deleteNotification(id: number): Promise<void> {
  await api.del(`/notifications/${id}`);
}