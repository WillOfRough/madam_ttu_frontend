import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

// ──────────────────────────────────────────────
// authStore 로직 재현 (API 모킹 포함)
// ──────────────────────────────────────────────

function createAuthStore(mockApi = {}) {
  return create((set) => ({
    isLoggedIn: false,
    managerId: null,
    email: null,
    name: null,
    isLoading: false,
    error: null,

    login: async ({ email, password }) => {
      set({ isLoading: true, error: null });
      try {
        const data = await mockApi.login({ email, password });
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

    clearError: () => set({ error: null }),
  }));
}

// ──────────────────────────────────────────────
// #1 매니저 로그인
// ──────────────────────────────────────────────
describe('#1 매니저 로그인', () => {
  let store;
  let mockLogin;

  beforeEach(() => {
    mockLogin = vi.fn();
    store = createAuthStore({ login: mockLogin });
  });

  it('로그인 성공 시 isLoggedIn=true, managerId/email/name 설정', async () => {
    mockLogin.mockResolvedValue({
      manager: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'test@test.com',
        name: '테스트매니저',
      },
    });

    await store.getState().login({ email: 'test@test.com', password: 'password123' });
    const state = store.getState();

    expect(state.isLoggedIn).toBe(true);
    expect(state.managerId).toBe('00000000-0000-0000-0000-000000000001');
    expect(state.email).toBe('test@test.com');
    expect(state.name).toBe('테스트매니저');
    expect(state.isLoading).toBe(false);
  });

  it('로그인 실패 시 error 메시지 설정', async () => {
    mockLogin.mockRejectedValue(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'));

    await expect(
      store.getState().login({ email: 'wrong@test.com', password: 'wrong' })
    ).rejects.toThrow();

    const state = store.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.error).toBe('이메일 또는 비밀번호가 올바르지 않습니다.');
    expect(state.isLoading).toBe(false);
  });

  it('로그인 중 isLoading=true 상태', async () => {
    let resolveLogin;
    mockLogin.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));

    const loginPromise = store.getState().login({ email: 'a@b.com', password: 'p' });
    expect(store.getState().isLoading).toBe(true);

    resolveLogin({ manager: { id: 'id1', email: 'a@b.com', name: 'M' } });
    await loginPromise;
    expect(store.getState().isLoading).toBe(false);
  });
});

// ──────────────────────────────────────────────
// #2 매니저 로그아웃
// ──────────────────────────────────────────────
describe('#2 매니저 로그아웃', () => {
  let store;

  beforeEach(() => {
    const mockLogin = vi.fn().mockResolvedValue({
      manager: { id: 'id1', email: 'a@b.com', name: 'M' },
    });
    store = createAuthStore({ login: mockLogin });
  });

  it('로그아웃 시 모든 인증 상태 초기화', async () => {
    // 먼저 로그인
    await store.getState().login({ email: 'a@b.com', password: 'p' });
    expect(store.getState().isLoggedIn).toBe(true);

    // 로그아웃
    await store.getState().logout();
    const state = store.getState();

    expect(state.isLoggedIn).toBe(false);
    expect(state.managerId).toBeNull();
    expect(state.email).toBeNull();
    expect(state.name).toBeNull();
  });
});
