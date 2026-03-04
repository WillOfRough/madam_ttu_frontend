import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAdminStore from '../store/adminStore';

// Mock the auth service so tests don't make real API calls
vi.mock('../api/authService', () => ({
  login: vi.fn(({ email, password }) => {
    if (email === 'admin@madam.mj' && password === 'madam2026') {
      return Promise.resolve({ accountId: 'admin-1', email });
    }
    return Promise.reject(new Error('Invalid credentials'));
  }),
  logout: vi.fn(() => Promise.resolve()),
}));

describe('Admin Store - 관리자 상태 관리', () => {
  beforeEach(async () => {
    await useAdminStore.getState().logout();
  });

  describe('인증', () => {
    it('올바른 자격 증명으로 로그인 성공', async () => {
      const result = await useAdminStore.getState().login({ email: 'admin@madam.mj', password: 'madam2026' });
      expect(result).toBe(true);
      expect(useAdminStore.getState().isAuthenticated).toBe(true);
    });

    it('잘못된 자격 증명으로 로그인 실패', async () => {
      const result = await useAdminStore.getState().login({ email: 'wrong@test.com', password: 'wrong' });
      expect(result).toBe(false);
      expect(useAdminStore.getState().isAuthenticated).toBe(false);
    });

    it('빈 비밀번호로 로그인 실패', async () => {
      const result = await useAdminStore.getState().login({ email: 'test@test.com', password: '' });
      expect(result).toBe(false);
    });

    it('로그아웃하면 인증 해제 및 선택 초기화', async () => {
      await useAdminStore.getState().login({ email: 'admin@madam.mj', password: 'madam2026' });
      useAdminStore.getState().setSelectedUser('m1');
      useAdminStore.getState().setMatchSource('m2');

      await useAdminStore.getState().logout();

      const state = useAdminStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.selectedUserId).toBeNull();
      expect(state.matchSourceId).toBeNull();
    });
  });

  describe('필터링', () => {
    it('성별 필터 설정', () => {
      useAdminStore.getState().setGenderFilter('male');
      expect(useAdminStore.getState().genderFilter).toBe('male');

      useAdminStore.getState().setGenderFilter('female');
      expect(useAdminStore.getState().genderFilter).toBe('female');

      useAdminStore.getState().setGenderFilter('all');
      expect(useAdminStore.getState().genderFilter).toBe('all');
    });

    it('검색어 설정', () => {
      useAdminStore.getState().setSearchQuery('김도윤');
      expect(useAdminStore.getState().searchQuery).toBe('김도윤');
    });

    it('빈 검색어 설정', () => {
      useAdminStore.getState().setSearchQuery('test');
      useAdminStore.getState().setSearchQuery('');
      expect(useAdminStore.getState().searchQuery).toBe('');
    });
  });

  describe('회원 선택', () => {
    it('회원 선택', () => {
      useAdminStore.getState().setSelectedUser('m1');
      expect(useAdminStore.getState().selectedUserId).toBe('m1');
    });

    it('회원 선택 해제', () => {
      useAdminStore.getState().setSelectedUser('m1');
      useAdminStore.getState().clearSelection();
      expect(useAdminStore.getState().selectedUserId).toBeNull();
    });

    it('매칭 소스 설정', () => {
      useAdminStore.getState().setMatchSource('m3');
      expect(useAdminStore.getState().matchSourceId).toBe('m3');
    });

    it('매칭 소스 해제', () => {
      useAdminStore.getState().setMatchSource('m3');
      useAdminStore.getState().clearMatchSource();
      expect(useAdminStore.getState().matchSourceId).toBeNull();
    });
  });
});
