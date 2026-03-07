import { create } from 'zustand';
import * as managerService from '../api/managerService';

const useManagerStore = create((set) => ({
  info: null,
  summary: null,
  isLoading: false,
  error: null,

  fetchInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const info = await managerService.getMyInfo();
      set({ info, isLoading: false });
      return info;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await managerService.getDashboardSummary();
      set({ summary, isLoading: false });
      return summary;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  reset: () => set({ info: null, summary: null, error: null }),
}));

export default useManagerStore;
