import { create } from 'zustand';
import * as connectionService from '../api/connectionService';

const useConnectionStore = create((set, get) => ({
  connections: [],
  receivedRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,

  fetchConnections: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await connectionService.getConnections();
      set({ connections: result.data || result.connections || result, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  createInvite: async (options) => {
    set({ isLoading: true, error: null });
    try {
      const invite = await connectionService.createConnectionInvite(options);
      set({ isLoading: false });
      return invite;
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  disconnect: async (targetManagerId) => {
    set({ isLoading: true, error: null });
    try {
      await connectionService.disconnect(targetManagerId);
      set((s) => ({
        connections: s.connections.filter((c) => c.managerId !== targetManagerId && c.id !== targetManagerId),
        isLoading: false,
      }));
    } catch (err) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  fetchRequests: async () => {
    set({ error: null });
    try {
      const result = await connectionService.getRequests();
      set({
        receivedRequests: result.received || [],
        sentRequests: result.sent || [],
      });
    } catch (err) {
      set({ error: err.message });
    }
  },

  sendRequest: async ({ nickname, message }) => {
    try {
      const req = await connectionService.sendRequest({ nickname, message });
      set((s) => ({ sentRequests: [req, ...s.sentRequests] }));
      return req;
    } catch (err) {
      throw err;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const result = await connectionService.acceptRequest(requestId);
      set((s) => ({
        receivedRequests: s.receivedRequests.filter((r) => r.id !== requestId),
        connections: result.connection
          ? [...s.connections, { ...result.connection, clientCount: 0 }]
          : s.connections,
      }));
      return result;
    } catch (err) {
      throw err;
    }
  },

  rejectRequest: async (requestId) => {
    try {
      await connectionService.rejectRequest(requestId);
      set((s) => ({
        receivedRequests: s.receivedRequests.filter((r) => r.id !== requestId),
      }));
    } catch (err) {
      throw err;
    }
  },

  reset: () => set({ connections: [], receivedRequests: [], sentRequests: [], error: null }),
}));

export default useConnectionStore;
