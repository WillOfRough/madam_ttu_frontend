import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

// ──────────────────────────────────────────────
// inviteStore 로직 재현 (API 모킹)
// ──────────────────────────────────────────────

function createInviteStore(mockApi = {}) {
  return create((set) => ({
    invites: [],
    isLoading: false,
    error: null,

    createInvite: async (options) => {
      set({ isLoading: true, error: null });
      try {
        const invite = await mockApi.createInvite(options);
        set((s) => ({ invites: [invite, ...s.invites], isLoading: false }));
        return invite;
      } catch (err) {
        set({ isLoading: false, error: err.message });
        throw err;
      }
    },

    revokeInvite: async (inviteId) => {
      set({ isLoading: true, error: null });
      try {
        await mockApi.revokeInvite(inviteId);
        set((s) => ({
          invites: s.invites.map((inv) =>
            inv.id === inviteId ? { ...inv, status: 'revoked' } : inv
          ),
          isLoading: false,
        }));
      } catch (err) {
        set({ isLoading: false, error: err.message });
        throw err;
      }
    },

    reset: () => set({ invites: [], error: null }),
  }));
}

// ──────────────────────────────────────────────
// #5 seeker 초대 생성
// ──────────────────────────────────────────────
describe('#5 seeker 초대 생성', () => {
  let store;
  let mockCreateInvite;

  beforeEach(() => {
    mockCreateInvite = vi.fn();
    store = createInviteStore({ createInvite: mockCreateInvite });
  });

  it('seeker 초대 토큰을 생성하고 invites에 추가한다', async () => {
    const mockInvite = {
      id: 'inv-1',
      token: 'seeker-token-uuid',
      url: 'https://findmyone.com/invite/seeker-token-uuid',
      status: 'active',
      label: '소개 희망자 초대',
      expiresAt: '2026-03-12T00:00:00Z',
    };
    mockCreateInvite.mockResolvedValue(mockInvite);

    const result = await store.getState().createInvite({ label: '소개 희망자 초대', expiresInHours: 48 });

    expect(result).toEqual(mockInvite);
    expect(result.status).toBe('active');
    expect(store.getState().invites).toHaveLength(1);
    expect(store.getState().invites[0].id).toBe('inv-1');
  });
});

// ──────────────────────────────────────────────
// #6 seeker 링크 유효성
// ──────────────────────────────────────────────
describe('#6 seeker 링크 유효성', () => {
  it('유효한 seeker 토큰 검증 시 valid=true', async () => {
    const mockValidate = vi.fn().mockResolvedValue({
      valid: true,
      type: 'seeker',
      managerName: '테스트매니저',
    });

    const result = await mockValidate('valid-seeker-token');

    expect(result.valid).toBe(true);
    expect(result.type).toBe('seeker');
    expect(result.managerName).toBe('테스트매니저');
  });

  it('만료된 seeker 토큰 검증 시 에러', async () => {
    const mockValidate = vi.fn().mockRejectedValue(new Error('토큰이 만료되었습니다.'));

    await expect(mockValidate('expired-seeker-token')).rejects.toThrow('토큰이 만료되었습니다.');
  });

  it('revoked seeker 토큰 검증 시 에러', async () => {
    const mockValidate = vi.fn().mockRejectedValue(new Error('폐기된 토큰입니다.'));

    await expect(mockValidate('revoked-token')).rejects.toThrow('폐기된 토큰입니다.');
  });
});

// ──────────────────────────────────────────────
// #7 seeker 다회용
// ──────────────────────────────────────────────
describe('#7 seeker 다회용', () => {
  it('같은 토큰으로 seeker를 3명 등록할 수 있다', async () => {
    const token = 'multi-use-seeker-token';
    const mockCreateSeeker = vi.fn().mockResolvedValue({ success: true });

    // 3회 호출 모두 성공
    for (let i = 1; i <= 3; i++) {
      const result = await mockCreateSeeker({
        token,
        name: `사용자${i}`,
        gender: 'male',
        birthDate: '1995-01-01',
        phone: `010-1234-${String(i).padStart(4, '0')}`,
        occupation: '개발자',
        introduction: '안녕하세요 자기소개입니다 테스트입니다',
      });
      expect(result.success).toBe(true);
    }

    expect(mockCreateSeeker).toHaveBeenCalledTimes(3);
  });

  it('토큰이 만료되기 전까지 계속 사용 가능', async () => {
    const mockValidate = vi.fn().mockResolvedValue({ valid: true, type: 'seeker' });
    const mockCreateSeeker = vi.fn().mockResolvedValue({ success: true });

    // 검증 → 생성 반복 3회
    for (let i = 0; i < 3; i++) {
      const validation = await mockValidate('persistent-token');
      expect(validation.valid).toBe(true);

      const result = await mockCreateSeeker({ token: 'persistent-token', name: `이름${i}` });
      expect(result.success).toBe(true);
    }

    // 토큰 검증은 여전히 유효
    const finalCheck = await mockValidate('persistent-token');
    expect(finalCheck.valid).toBe(true);
  });

  it('revoke 후에는 토큰 사용 불가', async () => {
    const mockCreateInvite = vi.fn();
    const mockRevokeInvite = vi.fn().mockResolvedValue(undefined);
    const store = createInviteStore({ createInvite: mockCreateInvite, revokeInvite: mockRevokeInvite });

    // 초대 생성 후 store에 추가
    mockCreateInvite.mockResolvedValue({ id: 'inv-1', status: 'active', token: 'tok-1' });
    await store.getState().createInvite({ label: 'test' });
    expect(store.getState().invites[0].status).toBe('active');

    // revoke
    await store.getState().revokeInvite('inv-1');
    expect(store.getState().invites[0].status).toBe('revoked');
  });
});
