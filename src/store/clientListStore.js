import { create } from 'zustand';
import * as clientService from '../api/clientService';
import * as matchService from '../api/matchService';

const useClientListStore = create((set, get) => ({
  clients: [],
  totalCount: 0,
  filteredCount: 0,
  genderCounts: { male: 0, female: 0 },
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

  fetchClients: async () => {
    const { page, limit, filters } = get();
    set({ isLoading: true, error: null });
    try {
      const result = await clientService.listClients({
        ...filters,
        page,
        limit,
      });
      const clients = result.data || result.clients || result;
      const filteredCount = result.pagination?.total ?? result.totalCount ?? 0;

      // genderCounts: API 응답에 있으면 사용, 없으면 별도 조회
      let genderCounts = result.genderCounts;
      if (!genderCounts) {
        const baseFilters = { ...filters, gender: null, page: 1, limit: 1 };
        const [maleRes, femaleRes] = await Promise.all([
          clientService.listClients({ ...baseFilters, gender: 'male' }).catch(() => null),
          clientService.listClients({ ...baseFilters, gender: 'female' }).catch(() => null),
        ]);
        genderCounts = {
          male: maleRes?.pagination?.total ?? maleRes?.totalCount ?? 0,
          female: femaleRes?.pagination?.total ?? femaleRes?.totalCount ?? 0,
        };
      }

      // 매칭 목록에서 각 회원별 진행 중 매칭 수 계산
      const activeStatuses = ['proposal_sent', 'proposal_accepted', 'scheduling', 'arranging', 'scheduled'];
      let activeMatchMap = {};
      try {
        const matchRes = await matchService.listMatches({ size: 200 });
        const matchList = matchRes.data || matchRes.matches || [];
        for (const m of matchList) {
          if (!activeStatuses.includes(m.status)) continue;
          const aId = m.clientA?.clientId;
          const bId = m.clientB?.clientId;
          if (aId) activeMatchMap[aId] = (activeMatchMap[aId] || 0) + 1;
          if (bId) activeMatchMap[bId] = (activeMatchMap[bId] || 0) + 1;
        }
      } catch { /* 매칭 조회 실패 시 무시 */ }

      const enrichedClients = clients.map((c) => ({
        ...c,
        activeMatchCount: c.activeMatchCount ?? activeMatchMap[c.id] ?? 0,
      }));

      set({
        clients: enrichedClients,
        filteredCount,
        totalCount: genderCounts.male + genderCounts.female,
        genderCounts,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () => set({
    clients: [],
    totalCount: 0,
    filteredCount: 0,
    page: 1,
    genderCounts: { male: 0, female: 0 },
    filters: { owner: 'all', gender: null, approval: null, sort: 'createdAt:desc', name: '', phone: '' },
    error: null,
  }),
}));

export default useClientListStore;
