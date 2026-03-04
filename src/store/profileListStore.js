import { create } from 'zustand';
import { listProfiles, updateProfileStatus as apiUpdateStatus } from '../api/profileService';
import { normalizeProfiles } from '../utils/profileNormalizer';

const useProfileListStore = create((set, get) => ({
  profiles: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchProfiles: async (force = false) => {
    const { lastFetched, isLoading } = get();
    // Cache for 30 seconds unless forced
    if (!force && lastFetched && Date.now() - lastFetched < 30_000) return;
    if (isLoading) return;

    set({ isLoading: true, error: null });
    try {
      const data = await listProfiles();
      const profiles = normalizeProfiles(
        Array.isArray(data) ? data : data.content || data.profiles || [],
      );
      set({ profiles, isLoading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  updateProfileStatus: async (profileId, status) => {
    try {
      await apiUpdateStatus(profileId, status);
      // Update local state
      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === profileId ? { ...p, status } : p,
        ),
      }));
      return true;
    } catch (err) {
      console.error('Failed to update profile status:', err);
      return false;
    }
  },

  getProfileById: (id) => {
    return get().profiles.find((p) => p.id === id);
  },
}));

export default useProfileListStore;
