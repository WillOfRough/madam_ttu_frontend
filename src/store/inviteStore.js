import { create } from 'zustand';
import * as inviteService from '../api/inviteService';

const useInviteStore = create((set) => ({
  invites: [],
  isLoading: false,
  error: null,
  page: 1,
  totalPages: 1,
  totalCount: 0,
  statusFilter: '',
  quota: null,

  fetchQuota: async () => {
    try {
      const quota = await inviteService.getInviteQuota();
      set({ quota });
      return quota;
    } catch {
      // quota not available, ignore
    }
  },

  fetchInvites: async ({ page = 1, limit = 20, status } = {}) => {
    set({ isLoading: true, error: null });
    try {
      const result = await inviteService.getMyInvites({ page, limit, status });
      const invites = result.data || result.invites || result;
      const pagination = result.pagination || {};
      set({
        invites: Array.isArray(invites) ? invites : [],
        page: pagination.page || page,
        totalPages: pagination.totalPages || 1,
        totalCount: pagination.totalCount || 0,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  createInvite: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const invite = await inviteService.createInvite(options);
      set((s) => ({ invites: [invite, ...s.invites], isLoading: false }));
      return invite;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  revokeInvite: async (inviteId) => {
    set({ isLoading: true, error: null });
    try {
      await inviteService.revokeInvite(inviteId);
      set((s) => ({
        invites: s.invites.map((inv) =>
          inv.id === inviteId ? { ...inv, status: 'revoked' } : inv
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  setStatusFilter: (status) => set({ statusFilter: status }),
  reset: () => set({ invites: [], error: null, statusFilter: '' }),
}));

export default useInviteStore;
