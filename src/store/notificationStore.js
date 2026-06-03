import { create } from 'zustand';
import * as notificationService from '../api/notificationService';
import { countImportantUnread } from '../api/notificationTypes';

const useNotificationStore = create((set, get) => {
  // reset(로그아웃) 이후 도착하는 인플라이트 응답이 이전 매니저의 알림/배지를
  // 되살리지 않도록 하는 세대 카운터
  let gen = 0;

  return {
  notifications: [],
  unreadCount: 0,
  pagination: null,
  isLoading: false,
  error: null,
  _pollTimer: null,

  fetchNotifications: async ({ page = 0, size = 20 } = {}) => {
    const reqGen = gen;
    set({ isLoading: true, error: null });
    try {
      const res = await notificationService.listNotifications({ page, size });
      if (reqGen !== gen) return res; // reset 이후 도착 — 폐기
      const data = res.data || [];
      set({
        notifications: data,
        pagination: res.pagination || null,
        unreadCount: countImportantUnread(data),
        isLoading: false,
      });
      return res;
    } catch (err) {
      if (reqGen === gen) set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  // 배지 카운트는 type 으로 필터해야 하므로 unread-count API 대신
  // 알림 목록을 받아 "중요 + 안읽음" 만 직접 센다. (routine 알림 제외)
  fetchUnreadCount: async () => {
    const reqGen = gen;
    try {
      const res = await notificationService.listNotifications({ page: 0, size: 100 });
      if (reqGen !== gen) return; // reset 이후 도착 — 폐기
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
    gen += 1; // 진행 중인 알림 조회 응답 무효화
    const { _pollTimer } = get();
    if (_pollTimer) clearInterval(_pollTimer);
    set({
      notifications: [],
      unreadCount: 0,
      pagination: null,
      error: null,
      isLoading: false,
      _pollTimer: null,
    });
  },
  };
});

export default useNotificationStore;
