import { create } from 'zustand';
import * as clientService from '../api/clientService';
import * as matchService from '../api/matchService';

const ACTIVE_MATCH_STATUSES = ['proposal_sent', 'proposal_accepted', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled'];

// '오늘의 회원' 제안 횟수·방치일수·성사율 통계는 매칭 전체를 회원별로 집계해 만든다.
// 한 페이지(STATS_PAGE_SIZE)를 넘으면 나머지 페이지를 병렬로 받아 전수 집계한다 —
// 과거엔 200건 단발 조회라 매니저 누적 매칭이 200건을 넘으면 오래된 매칭이 윈도우 밖으로
// 밀려 '제안 N회'가 과소 집계(심하면 0='첫 제안 대기')되던 문제가 있었다.
// STATS_MAX_PAGES 는 폭주 방지 상한 — 이 이상은 백엔드 집계 필드로 옮기는 게 정석.
// 참고: matches 엔드포인트의 page 는 0-기반이다(clients 의 1-기반과 다름).
const STATS_PAGE_SIZE = 200;
const STATS_MAX_PAGES = 10;

// 서버가 모르는 통계 기반 정렬 — 매칭 전체를 받아(필요 시 여러 페이지) 클라에서 정렬·페이지네이션한다.
const STAT_SORTS = ['neglect:desc', 'success:desc'];

// 클라이언트에서 전역 정렬해야 하는 sort 모음.
// 나이순은 서버가 정렬해 주지만, '비활성 회원 뒤로'라는 2차 정렬을 서버 페이지네이션과
// 섞으면 페이지마다 따로 재정렬돼 페이지 경계에서 나이순이 깨진다(1페이지는 멀쩡, 2·3·4페이지부터
// 어긋남). 그래서 통계 정렬과 동일하게 크게 받아 전역으로 정렬·슬라이스한다.
const CLIENT_SORTS = [...STAT_SORTS, 'birthDate:asc'];

// 매칭불가(미승인·비활성) 회원은 항상 뒤로 보내는 공통 기준
const isBlocked = (c) => (c.approvalStatus !== 'approved' || (c.status || 'active') !== 'active') ? 1 : 0;

// 나이순 — birthDate 오름차순(= 나이 많은 순). 나이 정보가 없으면(또는 매칭불가면) 뒤로.
const sortByAge = (list) => {
  const ageOf = (c) => (c.age != null && c.age !== '' ? Number(c.age) : null);
  return [...list].sort((a, b) => {
    if (isBlocked(a) !== isBlocked(b)) return isBlocked(a) - isBlocked(b);
    const aa = ageOf(a);
    const ba = ageOf(b);
    if (aa == null && ba == null) return 0;
    if (aa == null) return 1;
    if (ba == null) return -1;
    return ba - aa; // 나이 많은 순
  });
};

// 매칭 목록 → 회원별 통계 맵 (clientId → { lastProposalAt, total, completed, active })
// draft 는 아직 제안이 나가지 않은 상태라 제외한다.
const buildStats = (matchList) => {
  const stats = {};
  for (const m of matchList) {
    if (m.status === 'draft') continue;
    for (const side of [m.clientA, m.clientB]) {
      const id = side?.clientId;
      if (!id) continue;
      const s = stats[id] || (stats[id] = { lastProposalAt: null, total: 0, completed: 0, active: 0 });
      s.total += 1;
      if (m.status === 'completed') s.completed += 1;
      if (ACTIVE_MATCH_STATUSES.includes(m.status)) s.active += 1;
      if (m.createdAt && (!s.lastProposalAt || new Date(m.createdAt) > new Date(s.lastProposalAt))) {
        s.lastProposalAt = m.createdAt;
      }
    }
  }
  return stats;
};

// 통계 정렬 — 매칭불가(미승인·비활성) 회원은 항상 뒤로 보낸다
const sortByStat = (list, sort, stats) => {
  const blocked = isBlocked;
  const arr = [...list];
  if (sort === 'neglect:desc') {
    // 마지막 제안이 오래된 순 — 제안 이력이 없으면 가입일 기준, 매칭 진행 중인 회원은 뒤로
    const baseTime = (c) => {
      const base = stats[c.id]?.lastProposalAt || c.createdAt;
      return base ? new Date(base).getTime() : 0;
    };
    arr.sort((a, b) => {
      if (blocked(a) !== blocked(b)) return blocked(a) - blocked(b);
      const aServing = (stats[a.id]?.active ?? 0) > 0 ? 1 : 0;
      const bServing = (stats[b.id]?.active ?? 0) > 0 ? 1 : 0;
      if (aServing !== bServing) return aServing - bServing;
      return baseTime(a) - baseTime(b);
    });
  } else {
    // 성사율 높은 순 — 매칭 이력이 없는 회원은 뒤로, 동률이면 성사 횟수 많은 순
    const rate = (c) => { const s = stats[c.id]; return s?.total ? s.completed / s.total : -1; };
    arr.sort((a, b) => {
      if (blocked(a) !== blocked(b)) return blocked(a) - blocked(b);
      const r = rate(b) - rate(a);
      if (r !== 0) return r;
      return (stats[b.id]?.completed || 0) - (stats[a.id]?.completed || 0);
    });
  }
  return arr;
};

const useClientListStore = create((set, get) => {
  // 최신 요청만 상태에 반영하기 위한 시퀀스 가드 (빠른 연속 검색 시 stale 응답 차단)
  let activeReq = 0;
  // 진행 중 매칭 맵 캐시 (clientId → 활성 매칭 수). 한 번 받아두면 홈↔회원관리/페이지
  // 이동 시 재호출을 기다리지 않고 즉시 배지를 그려 "매칭가능→매칭중" 깜빡임을 없앤다.
  let matchMap = null;
  // 회원별 매칭 통계 캐시 (방치일수·성사율 배지/정렬용) — matchMap 과 같은 응답에서 만든다.
  let statsMap = null;
  // '제안이 필요한 회원' 큐레이션용 활성 회원 풀 (현재 페이지와 무관하게 전체에서 뽑는다)
  let poolCache = null;

  // 매칭 목록을 (필요 시 여러 페이지) 받아 matchMap + statsMap 재료를 만든다.
  // 첫 페이지로 totalPages 를 파악한 뒤, 나머지는 한꺼번에 병렬로 받아 전수 집계한다
  // (페이지 수에 비례해 느려지지 않도록 직렬이 아닌 Promise.all 로 받는다).
  // 캐시 할당은 호출부에서 reqId 가드 후에 한다 — 로그아웃(reset) 후 도착한
  // 인플라이트 응답이 이전 매니저의 데이터로 캐시를 되살리는 것을 막기 위함.
  const fetchMatchStats = async () => {
    const first = await matchService.listMatches({ page: 0, size: STATS_PAGE_SIZE });
    const matchList = [...(first.data || first.matches || [])];

    const totalPages = Math.min(first.pagination?.totalPages ?? 1, STATS_MAX_PAGES);
    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          matchService.listMatches({ page: i + 1, size: STATS_PAGE_SIZE })
            .then((r) => r.data || r.matches || [])
            .catch(() => []) // 일부 페이지 실패해도 받은 만큼은 집계 (전부 실패해야 빈 통계)
        )
      );
      for (const part of rest) matchList.push(...part);
    }

    const freshMap = {};
    for (const m of matchList) {
      if (!ACTIVE_MATCH_STATUSES.includes(m.status)) continue;
      const aId = m.clientA?.clientId;
      const bId = m.clientB?.clientId;
      if (aId) freshMap[aId] = (freshMap[aId] || 0) + 1;
      if (bId) freshMap[bId] = (freshMap[bId] || 0) + 1;
    }
    return { freshMap, freshStats: buildStats(matchList) };
  };

  return {
  clients: [],
  // 진행 중 매칭 데이터 도착 여부 — false 동안 배지는 중립 자리표시자를 보여 깜빡임 방지
  matchesLoaded: false,
  // 회원별 매칭 통계 (clientId → { lastProposalAt, total, completed, active })
  matchStats: {},
  // 큐레이션 섹션용 활성 회원 풀
  statsPool: [],
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
      const isClientSort = CLIENT_SORTS.includes(filters.sort);
      const needsStats = STAT_SORTS.includes(filters.sort);
      let result;
      let pageList;
      let filteredCount;

      if (isClientSort) {
        // 클라이언트 전역 정렬: 한 번에 크게 받아 클라에서 정렬·슬라이스(페이지 경계 어긋남 방지).
        // 통계 정렬일 때만 매칭 통계를 함께 기다린다(나이순은 통계가 필요 없음).
        let statRes;
        [result, statRes] = await Promise.all([
          clientService.listClients({ ...filters, sort: 'createdAt:desc', page: 1, limit: 200 }),
          needsStats && !statsMap ? fetchMatchStats().catch(() => null) : Promise.resolve(null),
        ]);
        if (reqId !== activeReq) return; // 더 최신 검색이 진행 중이면 폐기
        if (statRes) {
          matchMap = statRes.freshMap;
          statsMap = statRes.freshStats;
        } else if (needsStats && !statsMap) {
          statsMap = {}; // 통계 조회 실패 — 빈 통계로 정렬 폴백
        }

        const list = result.data || result.clients || result;
        const sorted = needsStats
          ? sortByStat(list, filters.sort, statsMap || {})
          : sortByAge(list);
        filteredCount = sorted.length;
        pageList = sorted.slice((page - 1) * limit, page * limit);
      } else {
        // 1단계: 회원 목록 — 도착 즉시 렌더 (통계/매칭 배지를 기다리지 않음)
        result = await clientService.listClients({ ...filters, page, limit });
        if (reqId !== activeReq) return; // 더 최신 검색이 진행 중이면 폐기

        const list = result.data || result.clients || result;
        filteredCount = result.pagination?.total ?? result.totalCount ?? 0;

        // 비활성/휴면 회원을 맨 뒤로 정렬
        pageList = [...list].sort((a, b) => {
          const aActive = (a.status || 'active') === 'active' ? 0 : 1;
          const bActive = (b.status || 'active') === 'active' ? 0 : 1;
          return aActive - bActive;
        });
      }

      // 매칭 맵 캐시가 있으면 즉시 배지에 반영 (재진입 시 깜빡임 없이 정확하게 표시)
      const withMatch = matchMap
        ? pageList.map((c) => ({ ...c, activeMatchCount: matchMap[c.id] ?? 0 }))
        : pageList;
      set({
        clients: withMatch,
        filteredCount,
        isLoading: false,
        matchesLoaded: matchMap != null,
        matchStats: statsMap || {},
      });

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

      // 3단계: 진행 중 매칭 수 + 회원별 통계 — 비차단으로 항상 새로고침해 캐시를 갱신하고
      // 도착하면 배지를 최신값으로 정정한다.
      fetchMatchStats().then(({ freshMap, freshStats }) => {
        if (reqId !== activeReq) return;
        matchMap = freshMap;
        statsMap = freshStats;
        set((state) => ({
          clients: state.clients.map((c) => ({ ...c, activeMatchCount: matchMap[c.id] ?? 0 })),
          matchStats: statsMap,
          matchesLoaded: true,
        }));
      }).catch(() => {
        // 매칭 조회 실패 시 자리표시자에 갇히지 않도록 로딩만 종료 (배지는 '매칭가능'으로 폴백)
        if (reqId === activeReq) set({ matchesLoaded: true });
      });

      // 4단계: 큐레이션 풀 — 현재 페이지·필터와 무관하게 활성 회원 전체에서
      // '제안이 필요한 회원'을 뽑기 위한 풀을 1회 캐싱한다.
      if (!poolCache) {
        clientService.listClients({ approval: 'approved', status: 'active', sort: 'createdAt:desc', page: 1, limit: 200 })
          .then((poolRes) => {
            if (reqId !== activeReq) return; // reset(로그아웃)·최신 검색 이후 도착한 응답 폐기
            poolCache = poolRes.data || poolRes.clients || poolRes;
            set({ statsPool: poolCache });
          })
          .catch(() => {});
      }
    } catch (err) {
      if (reqId !== activeReq) return;
      set({ isLoading: false, error: err.message });
    }
  },

  reset: () => {
    // 진행 중이던 요청의 응답이 reset 이후 도착해 이전 매니저의 데이터로
    // 상태·캐시를 되살리지 않도록 시퀀스를 올려 전부 무효화한다.
    activeReq += 1;
    matchMap = null;
    statsMap = null;
    poolCache = null;
    set({
      clients: [],
      totalCount: 0,
      filteredCount: 0,
      page: 1,
      genderCounts: { male: 0, female: 0 },
      matchesLoaded: false,
      matchStats: {},
      statsPool: [],
      filters: { owner: 'all', gender: null, approval: null, status: null, sort: 'createdAt:desc', name: '' },
      error: null,
    });
  },
  };
});

export default useClientListStore;
