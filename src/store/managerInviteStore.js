import { create } from 'zustand';
import * as inviteService from '../api/inviteService';

const useManagerInviteStore = create((set) => ({
  invites: [],
  quota: null,
  pagination: null,
  statusFilter: '',
  isLoading: false,
  error: null,

  fetchInvites: async ({ status, page = 1, limit = 20 } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const result = await inviteService.getManagerInvites({ status: status || undefined, page, limit });
      set({
        invites: result.data || [],
        quota: result.quota || null,
        pagination: result.pagination || null,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  setStatusFilter: (status) => set({ statusFilter: status }),

  reset: () => set({ invites: [], quota: null, pagination: null, statusFilter: '', error: null }),
}));

export default useManagerInviteStore;
