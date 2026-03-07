import { create } from 'zustand';
import * as inviteService from '../api/inviteService';

const useInviteStore = create((set) => ({
  invites: [],
  isLoading: false,
  error: null,

  fetchInvites: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await inviteService.getMyInvites();
      set({ invites: result.data || result.invites || result, isLoading: false });
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

  reset: () => set({ invites: [], error: null }),
}));

export default useInviteStore;
