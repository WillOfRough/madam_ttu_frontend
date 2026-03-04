import { create } from 'zustand';

const useAdminStore = create((set) => ({
  isAuthenticated: false,
  genderFilter: 'all',
  searchQuery: '',
  selectedUserId: null,
  matchSourceId: null,

  login: (password) => {
    if (password === 'madam2026') {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => set({ isAuthenticated: false, selectedUserId: null, matchSourceId: null }),
  setGenderFilter: (filter) => set({ genderFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedUser: (userId) => set({ selectedUserId: userId }),
  setMatchSource: (userId) => set({ matchSourceId: userId }),
  clearSelection: () => set({ selectedUserId: null }),
  clearMatchSource: () => set({ matchSourceId: null }),
}));

export default useAdminStore;
