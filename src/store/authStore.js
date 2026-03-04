import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../api/authService';

const useAuthStore = create(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      accountId: null,
      email: null,
      isLoading: false,
      error: null,

      signup: async ({ email, password, name }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.signup({ email, password, name });
          // After signup, auto-login
          await authService.login({ email, password });
          set({
            isLoggedIn: true,
            accountId: data.accountId || data.id,
            email,
            isLoading: false,
          });
          return data;
        } catch (err) {
          set({ isLoading: false, error: err.message });
          throw err;
        }
      },

      login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.login({ email, password });
          set({
            isLoggedIn: true,
            accountId: data.accountId || data.id,
            email,
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
          // ignore logout errors
        }
        set({
          isLoggedIn: false,
          accountId: null,
          email: null,
          error: null,
        });
      },

      checkSession: async () => {
        try {
          const data = await authService.checkSession();
          set({
            isLoggedIn: true,
            accountId: data.accountId || data.id,
            email: data.email,
          });
          return true;
        } catch {
          set({ isLoggedIn: false, accountId: null, email: null });
          return false;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        accountId: state.accountId,
        email: state.email,
      }),
    },
  ),
);

export default useAuthStore;
