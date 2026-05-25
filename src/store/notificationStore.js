import { create } from 'zustand';
import * as notificationService from '../api/notificationService';

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
      set({
        notifications: res.data || [],
        pagination: res.pagination || null,
        isLoading: false,
      });
      return res;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      set({ unreadCount: res.unreadCount ?? 0 });
    } catch {
      // 실패해도 무시 (폴링이므로)
    }
  },

  markAsRead: async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
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
