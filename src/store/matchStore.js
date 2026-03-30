import { create } from 'zustand';
import * as matchService from '../api/matchService';

// 진행 상태 우선순위: 가장 진행된 상태가 먼저, cancelled은 맨 뒤
const STATUS_PRIORITY = {
  after_pending: 0,   // 애프터 대기
  completed: 1,       // 만남 완료
  scheduled: 2,       // 일정 확정
  arranging: 3,       // 일정 조율 중
  scheduling: 4,      // 가용시간 수집 중
  proposal_accepted: 5, // 프로포절 수락
  proposal_sent: 6,     // 프로포절 발송
  after_failed: 7,    // 애프터 미성사
  cancelled: 8,       // 취소 (맨 마지막)
};

function sortByStatusPriority(matches) {
  return [...matches].sort((a, b) => {
    const pa = STATUS_PRIORITY[a.status] ?? 6;
    const pb = STATUS_PRIORITY[b.status] ?? 6;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

const useMatchStore = create((set, get) => ({
  matches: [],
  totalCount: 0,
  page: 1,
  size: 20,
  filters: {
    status: null,
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

  fetchMatches: async () => {
    const { page, size, filters } = get();
    set({ isLoading: true, error: null });
    try {
      if (filters.status) {
        // 필터 활성화 시: 전체 데이터를 가져와서 클라이언트에서 필터링 + 페이징
        const result = await matchService.listMatches({ page: 0, size: 9999 });
        const all = (result.data || result.matches || []).filter((m) =>
          filters.status === 'active'
            ? !['completed', 'cancelled'].includes(m.status)
            : m.status === filters.status
        );
        const start = (page - 1) * size;
        const sorted = sortByStatusPriority(all);
        set({
          matches: sorted.slice(start, start + size),
          totalCount: all.length,
          isLoading: false,
        });
      } else {
        // 필터 없음: 전체 데이터를 가져와서 상태 우선순위로 정렬 + 페이징
        const result = await matchService.listMatches({ page: 0, size: 9999 });
        const all = sortByStatusPriority(result.data || result.matches || []);
        const start = (page - 1) * size;
        set({
          matches: all.slice(start, start + size),
          totalCount: all.length,
          isLoading: false,
        });
      }
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () =>
    set({
      matches: [],
      totalCount: 0,
      page: 1,
      filters: { status: null },
      error: null,
    }),
}));

export default useMatchStore;
