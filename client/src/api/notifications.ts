// HTTP calls for notifications: the list with its unread count, and marking read.
import type { NotificationsResponse } from '@/types/api';
import { request } from './client';

export function listNotifications(): Promise<NotificationsResponse> {
  return request<NotificationsResponse>('/notifications');
}

export async function markNotificationRead(id: string): Promise<void> {
  await request<void>(`/notifications/${id}/read`, { method: 'POST' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<void>('/notifications/read-all', { method: 'POST' });
}
