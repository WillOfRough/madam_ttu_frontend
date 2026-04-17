import { create } from 'zustand';
import * as matchService from '../api/matchService';

const useMatchStore = create((set, get) => ({
  matches: [],
  totalCount: 0,
  page: 1,
  size: 20,
  filters: {
    status: null,
    clientName: '',
    managerName: '',
  },
  isLoading: false,
  error: null,

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    }));
  },

  setFilters: (patch) => {
    set((state) => ({
      filters: { ...state.filters, ...patch },
      page: 1,
    }));
  },

  setPage: (page) => set({ page }),

  fetchMatches: async () => {
    const { page, size, filters } = get();
    set({ isLoading: true, error: null });
    try {
      const params = { page: page - 1, size };
      if (filters.status) params.status = filters.status;
      if (filters.clientName?.trim()) params.clientName = filters.clientName.trim();
      if (filters.managerName?.trim()) params.managerName = filters.managerName.trim();

      const result = await matchService.listMatches(params);
      const raw = result.data || result.matches || [];
      const total =
        result.pagination?.total ??
        result.pagination?.totalElements ??
        result.totalCount ??
        raw.length;

      set({ matches: raw, totalCount: total, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () =>
    set({
      matches: [],
      totalCount: 0,
      page: 1,
      filters: { status: null, clientName: '', managerName: '' },
      error: null,
    }),
}));

export default useMatchStore;
