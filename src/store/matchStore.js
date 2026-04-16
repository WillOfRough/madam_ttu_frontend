import { create } from 'zustand';
import * as matchService from '../api/matchService';

// 진행 상태 우선순위: 가장 진행된 상태가 먼저, 종료 상태는 맨 뒤
const STATUS_PRIORITY = {
  scheduled: 0,         // 일정 확정
  arranging: 1,         // 일정 조율 중
  scheduling: 2,        // 입금 확인 완료, 일정조율 진행
  awaiting_payment: 3,  // 양쪽 수락 완료, 입금 대기
  proposal_accepted: 4, // 프로포절 수락
  proposal_sent: 5,     // 프로포절 발송
  completed: 6,         // 만남 완료 (애프터 대기/성사)
  cancelled: 7,         // 취소 (맨 마지막)
};

function hasDeletedMember(match) {
  return match.clientA?.deleted || match.clientB?.deleted;
}

function getEffectivePriority(match) {
  // 삭제된 회원 포함 매칭 → cancelled 바로 앞
  if (hasDeletedMember(match)) return 5.8;
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
  allManagerNames: [],
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

      // 전체 데이터에서 매니저 목록 추출 (상태 필터와 무관)
      const allManagerNames = [...new Set(raw.map((m) => m.createdByManagerName).filter(Boolean))].sort();

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
        allManagerNames,
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
      allManagerNames: [],
      page: 1,
      filters: { status: null },
      error: null,
    }),
}));

export default useMatchStore;
