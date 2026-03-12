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
      const result = await matchService.listMatches({ page: page - 1, size });
      let data = result.data || result.matches || [];
      if (filters.status) {
        data = data.filter((m) => m.status === filters.status);
      }
      set({
        matches: data,
        totalCount: result.pagination?.total ?? data.length,
        isLoading: false,
      });
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
