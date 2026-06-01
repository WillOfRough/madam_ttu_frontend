import { create } from 'zustand';
import * as clientService from '../api/clientService';
import * as matchService from '../api/matchService';

const ACTIVE_MATCH_STATUSES = ['proposal_sent', 'proposal_accepted', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled'];

const useClientListStore = create((set, get) => {
  // 최신 요청만 상태에 반영하기 위한 시퀀스 가드 (빠른 연속 검색 시 stale 응답 차단)
  let activeReq = 0;
  // 진행 중 매칭 맵 캐시 (clientId → 활성 매칭 수). 한 번 받아두면 홈↔회원관리/페이지
  // 이동 시 재호출을 기다리지 않고 즉시 배지를 그려 "매칭가능→매칭중" 깜빡임을 없앤다.
  let matchMap = null;

  return {
  clients: [],
  // 진행 중 매칭 데이터 도착 여부 — false 동안 배지는 중립 자리표시자를 보여 깜빡임 방지
  matchesLoaded: false,
  totalCount: 0,
  filteredCount: 0,
  genderCounts: { male: 0, female: 0 },
  page: 1,
  limit: 20,
  filters: {
    owner: 'all',
    gender: null,
    approval: null,
    status: null,
    sort: 'createdAt:desc',
    name: '',
  },
  isLoading: false,
  error: null,
  selectedForMatch: [],

  setSelectedForMatch: (selected) => set({ selectedForMatch: selected }),
  toggleSelectForMatch: (client) => set((state) => {
    const exists = state.selectedForMatch.find((c) => c.id === client.id);
    if (exists) return { selectedForMatch: state.selectedForMatch.filter((c) => c.id !== client.id) };
    if (state.selectedForMatch.length >= 2) return { selectedForMatch: [state.selectedForMatch[1], client] };
    return { selectedForMatch: [...state.selectedForMatch, client] };
  }),
  clearSelectedForMatch: () => set({ selectedForMatch: [] }),

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
      page: 1,
    }));
  },

  setPage: (page) => set({ page }),

  fetchClients: async () => {
    const reqId = ++activeReq;
    const { page, limit, filters } = get();
    set({ isLoading: true, error: null });
    try {
      // 1단계: 회원 목록 — 도착 즉시 렌더 (통계/매칭 배지를 기다리지 않음)
      const result = await clientService.listClients({ ...filters, page, limit });
      if (reqId !== activeReq) return; // 더 최신 검색이 진행 중이면 폐기

      const list = result.data || result.clients || result;
      const filteredCount = result.pagination?.total ?? result.totalCount ?? 0;

      // 비활성/휴면 회원을 맨 뒤로 정렬
      const sorted = [...list].sort((a, b) => {
        const aActive = (a.status || 'active') === 'active' ? 0 : 1;
        const bActive = (b.status || 'active') === 'active' ? 0 : 1;
        return aActive - bActive;
      });

      // 매칭 맵 캐시가 있으면 즉시 배지에 반영 (재진입 시 깜빡임 없이 정확하게 표시)
      const withMatch = matchMap
        ? sorted.map((c) => ({ ...c, activeMatchCount: matchMap[c.id] ?? 0 }))
        : sorted;
      set({ clients: withMatch, filteredCount, isLoading: false, matchesLoaded: matchMap != null });

      // 2단계: 성별 카운트 — 비차단. 응답에 있으면 즉시, 없으면 백그라운드 조회
      if (result.genderCounts) {
        const gc = result.genderCounts;
        set({ genderCounts: gc, totalCount: gc.male + gc.female });
      } else {
        const baseFilters = { ...filters, gender: null, page: 1, limit: 1 };
        Promise.all([
          clientService.listClients({ ...baseFilters, gender: 'male' }).catch(() => null),
          clientService.listClients({ ...baseFilters, gender: 'female' }).catch(() => null),
        ]).then(([maleRes, femaleRes]) => {
          if (reqId !== activeReq) return;
          const gc = {
            male: maleRes?.pagination?.total ?? maleRes?.totalCount ?? 0,
            female: femaleRes?.pagination?.total ?? femaleRes?.totalCount ?? 0,
          };
          set({ genderCounts: gc, totalCount: gc.male + gc.female });
        });
      }

      // 3단계: 진행 중 매칭 수 — 비차단으로 항상 새로고침해 캐시(matchMap)를 갱신하고
      // 도착하면 배지를 최신값으로 정정한다.
      matchService.listMatches({ size: 200 }).then((matchRes) => {
        if (reqId !== activeReq) return;
        const matchList = matchRes.data || matchRes.matches || [];
        const freshMap = {};
        for (const m of matchList) {
          if (!ACTIVE_MATCH_STATUSES.includes(m.status)) continue;
          const aId = m.clientA?.clientId;
          const bId = m.clientB?.clientId;
          if (aId) freshMap[aId] = (freshMap[aId] || 0) + 1;
          if (bId) freshMap[bId] = (freshMap[bId] || 0) + 1;
        }
        matchMap = freshMap;
        set((state) => ({
          clients: state.clients.map((c) => ({ ...c, activeMatchCount: freshMap[c.id] ?? 0 })),
          matchesLoaded: true,
        }));
      }).catch(() => {
        // 매칭 조회 실패 시 자리표시자에 갇히지 않도록 로딩만 종료 (배지는 '매칭가능'으로 폴백)
        if (reqId === activeReq) set({ matchesLoaded: true });
      });
    } catch (err) {
      if (reqId !== activeReq) return;
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () => {
    matchMap = null;
    set({
      clients: [],
      totalCount: 0,
      filteredCount: 0,
      page: 1,
      genderCounts: { male: 0, female: 0 },
      matchesLoaded: false,
      filters: { owner: 'all', gender: null, approval: null, status: null, sort: 'createdAt:desc', name: '' },
      error: null,
    });
  },
  };
});

export default useClientListStore;
