import { create } from 'zustand';
import * as seekerService from '../api/seekerService';

const useSeekerListStore = create((set, get) => ({
  seekers: [],
  totalCount: 0,
  page: 1,
  limit: 20,
  filters: {
    owner: 'all',
    gender: null,
    approval: null,
    sort: 'createdAt:desc',
    name: '',
    phone: '',
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
      const result = await seekerService.listSeekers({
        ...filters,
        page,
        limit,
      });
      set({
        seekers: result.data || result.seekers || result,
        totalCount: result.pagination?.total ?? result.totalCount ?? 0,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () => set({
    seekers: [],
    totalCount: 0,
    page: 1,
    filters: { owner: 'all', gender: null, approval: null, sort: 'createdAt:desc', name: '', phone: '' },
    error: null,
  }),
}));

export default useSeekerListStore;
