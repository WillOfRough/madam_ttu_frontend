import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

// ──────────────────────────────────────────────
// seekerListStore 로직 재현 (API 모킹)
// ──────────────────────────────────────────────

function createSeekerListStore(mockApi = {}) {
  return create((set, get) => ({
    seekers: [],
    totalCount: 0,
    page: 1,
    limit: 20,
    filters: {
      owner: 'all',
      gender: null,
      approval: null,
      sort: 'createdAt:desc',
    },
    isLoading: false,
    error: null,

    setFilter: (key, value) => {
      set((state) => ({
        filters: { ...state.filters, [key]: value },
        page: 1,
      }));
    },

    setPage: (page) => set({ page }),

    fetchSeekers: async () => {
      const { page, limit, filters } = get();
      set({ isLoading: true, error: null });
      try {
        const result = await mockApi.listSeekers({ ...filters, page, limit });
        set({
          seekers: result.data || result.seekers || result,
          totalCount: result.pagination?.total ?? result.totalCount ?? 0,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false, error: err.message });
      }
    },

    reset: () =>
      set({
        seekers: [],
        totalCount: 0,
        page: 1,
        filters: { owner: 'all', gender: null, approval: null, sort: 'createdAt:desc' },
        error: null,
      }),
  }));
}

// ──────────────────────────────────────────────
// #9 seeker 리스트 조회
// ──────────────────────────────────────────────
describe('#9 seeker 리스트 조회', () => {
  let store;
  let mockListSeekers;

  beforeEach(() => {
    mockListSeekers = vi.fn();
    store = createSeekerListStore({ listSeekers: mockListSeekers });
  });

  it('seeker 리스트를 가져와서 store에 저장한다', async () => {
    mockListSeekers.mockResolvedValue({
      data: [
        { id: 's-1', name: '홍길동', gender: 'male', occupation: '개발자', approvalStatus: 'pending' },
        { id: 's-2', name: '김영희', gender: 'female', occupation: '디자이너', approvalStatus: 'approved' },
      ],
      pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });

    await store.getState().fetchSeekers();
    const state = store.getState();

    expect(state.seekers).toHaveLength(2);
    expect(state.seekers[0].name).toBe('홍길동');
    expect(state.seekers[1].gender).toBe('female');
    expect(state.totalCount).toBe(2);
    expect(state.isLoading).toBe(false);
  });

  it('필터 변경 시 page가 1로 리셋된다', () => {
    store.getState().setPage(3);
    expect(store.getState().page).toBe(3);

    store.getState().setFilter('gender', 'male');
    expect(store.getState().page).toBe(1);
    expect(store.getState().filters.gender).toBe('male');
  });

  it('owner=me 필터로 내 seeker만 조회', async () => {
    mockListSeekers.mockResolvedValue({
      data: [{ id: 's-1', name: '내소개', isOwner: true }],
      pagination: { total: 1 },
    });

    store.getState().setFilter('owner', 'me');
    await store.getState().fetchSeekers();

    expect(mockListSeekers).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'me' })
    );
    expect(store.getState().seekers).toHaveLength(1);
  });

  it('API 실패 시 error 설정', async () => {
    mockListSeekers.mockRejectedValue(new Error('서버 오류'));

    await store.getState().fetchSeekers();

    expect(store.getState().error).toBe('서버 오류');
    expect(store.getState().seekers).toHaveLength(0);
  });

  it('reset 시 초기 상태로 복원', async () => {
    mockListSeekers.mockResolvedValue({
      data: [{ id: 's-1', name: '홍길동' }],
      pagination: { total: 1 },
    });
    await store.getState().fetchSeekers();
    expect(store.getState().seekers).toHaveLength(1);

    store.getState().reset();
    expect(store.getState().seekers).toHaveLength(0);
    expect(store.getState().totalCount).toBe(0);
    expect(store.getState().page).toBe(1);
  });
});
