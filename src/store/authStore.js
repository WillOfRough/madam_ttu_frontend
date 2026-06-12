import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../api/authService';
import useClientListStore from './clientListStore';
import useMatchStore from './matchStore';
import useConnectionStore from './connectionStore';
import useNotificationStore from './notificationStore';
import useManagerStore from './managerStore';
import useInviteStore from './inviteStore';
import useManagerInviteStore from './managerInviteStore';

// 매니저 계정에 종속된 데이터 store 일괄 초기화.
// SPA 라 로그아웃해도 zustand 모듈 싱글톤(특히 clientListStore 의 poolCache 등
// 클로저 캐시)이 메모리에 남아, 다음 매니저가 이전 매니저의 '오늘의 회원'·매칭
// 배지를 보게 되는 문제를 막는다.
function resetDataStores() {
  useClientListStore.getState().reset();
  useMatchStore.getState().reset();
  useConnectionStore.getState().reset();
  useNotificationStore.getState().reset();
  useManagerStore.getState().reset();
  useInviteStore.getState().reset();
  useManagerInviteStore.getState().reset();
}

const useAuthStore = create(
  persist(
    (set, get) => ({
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
          // 로그아웃 없이 계정이 바뀐 경우(세션 만료 후 다른 계정 로그인 등) 대비
          if (get().managerId && get().managerId !== mgr.id) resetDataStores();
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

      register: async ({ token, email, password, name, nickname, phone, verificationId, bankName, bankNumber }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.register({ token, email, password, name, nickname, phone, verificationId, bankName, bankNumber });
          await authService.login({ email, password });
          const mgr = data.manager || data;
          if (get().managerId) resetDataStores(); // 이전 세션 데이터 잔존 대비
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

      signup: async ({ email, password, name, nickname, phone, verificationId, inviteCode, bankName, bankNumber }) => {
        set({ isLoading: true, error: null });
        try {
          const data = await authService.signup({ email, password, name, nickname, phone, verificationId, inviteCode, bankName, bankNumber });
          await authService.login({ email, password });
          const mgr = data.manager || data;
          if (get().managerId) resetDataStores(); // 이전 세션 데이터 잔존 대비
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
        // 다음 로그인 매니저에게 이전 매니저의 데이터가 보이지 않도록 캐시 초기화
        resetDataStores();
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
          // persist 된 이전 세션과 다른 매니저면 데이터 캐시 초기화
          if (get().managerId && get().managerId !== data.id) resetDataStores();
          set({
            isLoggedIn: true,
            managerId: data.id,
            email: data.email,
            name: data.name || null,
            role: data.role || 'manager',
            managerInviteQuota: data.managerInviteQuota || null,
          });
          return true;
        } catch (err) {
          // 서버가 명시적으로 401(인증 만료)을 응답한 경우에만 로그아웃 처리한다.
          // 네트워크 실패(모바일 백그라운드 복귀 직후 라디오 미가동 등)나 5xx 서버 오류는
          // 세션 만료가 아니므로 기존 로그인 상태를 유지한다. (return null = 판정 불가)
          if (err?.status === 401) {
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
          return null;
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
