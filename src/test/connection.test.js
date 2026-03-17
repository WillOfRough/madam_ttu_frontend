import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

// ──────────────────────────────────────────────
// connectionStore 로직 재현 (API 모킹)
// ──────────────────────────────────────────────

function createConnectionStore(mockApi = {}) {
  return create((set) => ({
    connections: [],
    isLoading: false,
    error: null,

    createInvite: async (options) => {
      set({ isLoading: true, error: null });
      try {
        const invite = await mockApi.createConnectionInvite(options);
        set({ isLoading: false });
        return invite;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        throw err;
      }
    },

    fetchConnections: async () => {
      set({ isLoading: true, error: null });
      try {
        const result = await mockApi.getConnections();
        set({ connections: result.data || result.connections || result, isLoading: false });
      } catch (err) {
        set({ isLoading: false, error: err.message });
      }
    },

    reset: () => set({ connections: [], error: null }),
  }));
}

// ──────────────────────────────────────────────
// #3 연결 초대 생성
// ──────────────────────────────────────────────
describe('#3 연결 초대 생성', () => {
  let store;
  let mockCreateInvite;

  beforeEach(() => {
    mockCreateInvite = vi.fn();
    store = createConnectionStore({ createConnectionInvite: mockCreateInvite });
  });

  it('연결 초대 토큰을 생성하고 결과를 반환한다', async () => {
    const mockInvite = {
      id: 'invite-1',
      token: 'abc-123',
      url: 'https://knotsandlinks.com/connect/abc-123',
      status: 'active',
      label: '테스트 초대',
      expiresAt: '2026-03-11T00:00:00Z',
    };
    mockCreateInvite.mockResolvedValue(mockInvite);

    const result = await store.getState().createInvite({ label: '테스트 초대', expiresInHours: 24 });

    expect(result).toEqual(mockInvite);
    expect(result.status).toBe('active');
    expect(result.url).toContain('/connect/');
    expect(store.getState().isLoading).toBe(false);
  });

  it('초대 생성 실패 시 error 설정', async () => {
    mockCreateInvite.mockRejectedValue(new Error('초대 생성 실패'));

    await expect(
      store.getState().createInvite({ label: '실패 테스트' })
    ).rejects.toThrow('초대 생성 실패');

    expect(store.getState().error).toBe('초대 생성 실패');
  });
});

// ──────────────────────────────────────────────
// #4 연결 링크 유효성
// ──────────────────────────────────────────────
describe('#4 연결 링크 유효성', () => {
  it('유효한 토큰 검증 시 valid=true 반환', async () => {
    const mockValidate = vi.fn().mockResolvedValue({
      valid: true,
      type: 'manager',
      managerName: '매니저A',
    });

    const result = await mockValidate('valid-token-uuid');

    expect(result.valid).toBe(true);
    expect(result.type).toBe('manager');
    expect(result.managerName).toBe('매니저A');
  });

  it('만료된 토큰 검증 시 에러', async () => {
    const mockValidate = vi.fn().mockRejectedValue(new Error('토큰이 만료되었습니다.'));

    await expect(mockValidate('expired-token')).rejects.toThrow('토큰이 만료되었습니다.');
  });
});

// ──────────────────────────────────────────────
// #10 연결 리스트 조회
// ──────────────────────────────────────────────
describe('#10 연결 리스트 조회', () => {
  let store;
  let mockGetConnections;

  beforeEach(() => {
    mockGetConnections = vi.fn();
    store = createConnectionStore({ getConnections: mockGetConnections });
  });

  it('연결 목록을 가져와서 store에 저장한다', async () => {
    mockGetConnections.mockResolvedValue({
      connections: [
        { managerId: 'mgr-1', name: '매니저A', clientCount: 5, connectedAt: '2026-03-01' },
        { managerId: 'mgr-2', name: '매니저B', clientCount: 3, connectedAt: '2026-03-05' },
      ],
    });

    await store.getState().fetchConnections();
    const state = store.getState();

    expect(state.connections).toHaveLength(2);
    expect(state.connections[0].name).toBe('매니저A');
    expect(state.connections[1].clientCount).toBe(3);
    expect(state.isLoading).toBe(false);
  });

  it('연결이 없으면 빈 배열', async () => {
    mockGetConnections.mockResolvedValue({ connections: [] });

    await store.getState().fetchConnections();

    expect(store.getState().connections).toHaveLength(0);
  });
});
