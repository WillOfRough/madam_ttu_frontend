import { apiFetch } from './config';

export async function listNotifications({ page = 0, size = 20 } = {}) {
  return apiFetch(`/api/v1/notifications?page=${page}&size=${size}`, { method: 'GET' });
}

export async function getUnreadCount() {
  return apiFetch('/api/v1/notifications/unread-count', { method: 'GET' });
}

export async function markAsRead(notificationId) {
  return apiFetch(`/api/v1/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function markAllAsRead() {
  return apiFetch('/api/v1/notifications/read-all', { method: 'POST' });
}
