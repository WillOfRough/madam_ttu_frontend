import { create } from 'zustand';
import * as connectionService from '../api/connectionService';

const useConnectionStore = create((set) => ({
  connections: [],
  isLoading: false,
  error: null,

  fetchConnections: async (managerId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await connectionService.getConnections(managerId);
      set({ connections: result.data || result.connections || result, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  createInvite: async (managerId, options) => {
    set({ isLoading: true, error: null });
    try {
      const invite = await connectionService.createConnectionInvite(managerId, options);
      set({ isLoading: false });
      return invite;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  disconnect: async (managerId, targetManagerId) => {
    set({ isLoading: true, error: null });
    try {
      await connectionService.disconnect(managerId, targetManagerId);
      set((s) => ({
        connections: s.connections.filter((c) => c.managerId !== targetManagerId && c.id !== targetManagerId),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  reset: () => set({ connections: [], error: null }),
}));

export default useConnectionStore;
