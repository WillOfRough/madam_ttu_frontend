import { create } from 'zustand';
import * as authService from '../api/authService';

const useAdminStore = create((set) => ({
  isAuthenticated: false,
  genderFilter: 'all',
  searchQuery: '',
  selectedUserId: null,
  matchSourceId: null,

  login: async ({ email, password }) => {
    try {
      await authService.login({ email, password });
      set({ isAuthenticated: true });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    set({ isAuthenticated: false, selectedUserId: null, matchSourceId: null });
  },

  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setGenderFilter: (filter) => set({ genderFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedUser: (userId) => set({ selectedUserId: userId }),
  setMatchSource: (userId) => set({ matchSourceId: userId }),
  clearSelection: () => set({ selectedUserId: null }),
  clearMatchSource: () => set({ matchSourceId: null }),
}));

export default useAdminStore;
