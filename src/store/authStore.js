import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../api/authService';

const DEV = import.meta.env.DEV;
const MOCK_MANAGER_ID = '00000000-0000-0000-0000-000000000001';

const useAuthStore = create(
  persist(
    (set) => ({
      isLoggedIn: false,
      managerId: null,
      email: null,
      name: null,
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
            isLoading: false,
          });
          return data;
        } catch (err) {
          // DEV: 백엔드 없이 로컬 테스트용 패스스루
          if (DEV) {
            const mockName = email.split('@')[0] || 'Manager';
            set({
              isLoggedIn: true,
              managerId: MOCK_MANAGER_ID,
              email,
              name: mockName,
              isLoading: false,
            });
            return { managerId: MOCK_MANAGER_ID, email, name: mockName };
          }
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
            isLoading: false,
          });
          return data;
        } catch (err) {
          if (DEV) {
            set({
              isLoggedIn: true,
              managerId: MOCK_MANAGER_ID,
              email,
              name,
              isLoading: false,
            });
            return { managerId: MOCK_MANAGER_ID, email, name };
          }
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      logout: async () => {
        set({
          isLoggedIn: false,
          managerId: null,
          email: null,
          name: null,
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
          });
          return true;
        } catch {
          set({
            isLoggedIn: false,
            managerId: null,
            email: null,
            name: null,
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
      }),
    },
  ),
);

export default useAuthStore;
