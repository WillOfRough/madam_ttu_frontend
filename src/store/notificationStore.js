import { create } from 'zustand';
import * as notificationService from '../api/notificationService';
import { countImportantUnread } from '../api/notificationTypes';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  pagination: null,
  isLoading: false,
  error: null,
  _pollTimer: null,

  fetchNotifications: async ({ page = 0, size = 20 } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await notificationService.listNotifications({ page, size });
      const data = res.data || [];
      set({
        notifications: data,
        pagination: res.pagination || null,
        unreadCount: countImportantUnread(data),
        isLoading: false,
      });
      return res;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  // 배지 카운트는 type 으로 필터해야 하므로 unread-count API 대신
  // 알림 목록을 받아 "중요 + 안읽음" 만 직접 센다. (routine 알림 제외)
  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.listNotifications({ page: 0, size: 100 });
      set({ unreadCount: countImportantUnread(res.data || []) });
    } catch {
      // 실패해도 무시 (폴링이므로)
    }
  },

  markAsRead: async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      return { notifications, unreadCount: countImportantUnread(notifications) };
    });
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  startPolling: (intervalMs = 30000) => {
    const { _pollTimer, fetchUnreadCount } = get();
    if (_pollTimer) return; // 이미 폴링 중
    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, intervalMs);
    set({ _pollTimer: timer });
  },

  stopPolling: () => {
    const { _pollTimer } = get();
    if (_pollTimer) {
      clearInterval(_pollTimer);
      set({ _pollTimer: null });
    }
  },

  reset: () => {
    const { _pollTimer } = get();
    if (_pollTimer) clearInterval(_pollTimer);
    set({
      notifications: [],
      unreadCount: 0,
      pagination: null,
      error: null,
      _pollTimer: null,
    });
  },
}));

export default useNotificationStore;
