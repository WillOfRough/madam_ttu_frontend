import { create } from 'zustand';
import * as matchService from '../api/matchService';

const useMatchStore = create((set, get) => ({
  matches: [],
  totalCount: 0,
  page: 1,
  size: 20,
  filters: {
    status: null,
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

  fetchMatches: async () => {
    const { page, size, filters } = get();
    set({ isLoading: true, error: null });
    try {
      if (filters.status) {
        // 필터 활성화 시: 전체 데이터를 가져와서 클라이언트에서 필터링 + 페이징
        const result = await matchService.listMatches({ page: 0, size: 9999 });
        const all = (result.data || result.matches || []).filter((m) => m.status === filters.status);
        const start = (page - 1) * size;
        set({
          matches: all.slice(start, start + size),
          totalCount: all.length,
          isLoading: false,
        });
      } else {
        // 필터 없음: 서버 페이징 그대로 사용
        const result = await matchService.listMatches({ page: page - 1, size });
        set({
          matches: result.data || result.matches || [],
          totalCount: result.pagination?.total ?? (result.data || result.matches || []).length,
          isLoading: false,
        });
      }
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () =>
    set({
      matches: [],
      totalCount: 0,
      page: 1,
      filters: { status: null },
      error: null,
    }),
}));

export default useMatchStore;
