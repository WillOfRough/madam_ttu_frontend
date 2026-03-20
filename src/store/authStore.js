import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../api/authService';

const useAuthStore = create(
  persist(
    (set) => ({
      isLoggedIn: false,
      managerId: null,
      email: null,
      name: null,
      role: null,
      managerInviteQuota: null,
      isLoading: false,
      error: null,

      login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login({ email, password });
          const mgr = data.manager || data;
          set({
            isLoggedIn: true,
            managerId: mgr.id,
            email: mgr.email || email,
            name: mgr.name || null,
            role: mgr.role || 'manager',
            isLoading: false,
          });
          return data;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      register: async ({ token, email, password, name, nickname }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register({ token, email, password, name, nickname });
          await authService.login({ email, password });
          const mgr = data.manager || data;
          set({
            isLoggedIn: true,
            managerId: mgr.id || data.id,
            email,
            name,
            role: mgr.role || 'manager',
            isLoading: false,
          });
          return data;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      signup: async ({ email, password, name, nickname, inviteCode }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.signup({ email, password, name, nickname, inviteCode });
          await authService.login({ email, password });
          const mgr = data.manager || data;
          set({
            isLoggedIn: true,
            managerId: mgr.id || data.id,
            email,
            name,
            role: mgr.role || 'manager',
            isLoading: false,
          });
          return data;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // 서버 로그아웃 실패해도 로컬 상태는 초기화
        }
        set({
          isLoggedIn: false,
          managerId: null,
          email: null,
          name: null,
          role: null,
          managerInviteQuota: null,
          error: null,
        });
      },

      checkSession: async () => {
        try {
          const data = await authService.checkSession();
          set({
            isLoggedIn: true,
            managerId: data.id,
            email: data.email,
            name: data.name || null,
            role: data.role || 'manager',
            managerInviteQuota: data.managerInviteQuota || null,
          });
          return true;
        } catch {
          set({
            isLoggedIn: false,
            managerId: null,
            email: null,
            name: null,
            role: null,
            managerInviteQuota: null,
          });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'knotsandlinks-auth',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        managerId: state.managerId,
        email: state.email,
        name: state.name,
        role: state.role,
        managerInviteQuota: state.managerInviteQuota,
      }),
    },
  ),
);

export default useAuthStore;
