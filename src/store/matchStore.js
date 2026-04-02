import { create } from 'zustand';
import * as matchService from '../api/matchService';

// 진행 상태 우선순위: 가장 진행된 상태가 먼저, 종료 상태는 맨 뒤
const STATUS_PRIORITY = {
  scheduled: 0,       // 일정 확정
  arranging: 1,       // 일정 조율 중
  scheduling: 2,      // 가용시간 수집 중
  proposal_accepted: 3, // 프로포절 수락
  proposal_sent: 4,     // 프로포절 발송
  completed: 5,       // 만남 완료 (애프터 대기/성사)
  cancelled: 6,       // 취소 (맨 마지막)
};

function getEffectivePriority(match) {
  if (match.status === 'completed') {
    if (match.afterStatus === 'pending') return -1;    // 애프터 대기 → 최상위
    if (match.afterStatus === 'accepted') return 5;    // 애프터 성사 → completed 급
    if (match.afterStatus === 'rejected') return 5.5;  // 애프터 미성사 → cancelled 바로 앞
  }
  return STATUS_PRIORITY[match.status] ?? 4;
}

function sortByStatusPriority(matches) {
  return [...matches].sort((a, b) => {
    const pa = getEffectivePriority(a);
    const pb = getEffectivePriority(b);
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
      const result = await matchService.listMatches({ page: 0, size: 9999 });
      const raw = result.data || result.matches || [];

      let filtered = raw;
      if (filters.status) {
        filtered = raw.filter((m) =>
          filters.status === 'active'
            ? !['completed', 'cancelled'].includes(m.status)
            : m.status === filters.status
        );
      }

      const sorted = sortByStatusPriority(filtered);
      const start = (page - 1) * size;
      set({
        matches: sorted.slice(start, start + size),
        totalCount: filtered.length,
        isLoading: false,
      });
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
