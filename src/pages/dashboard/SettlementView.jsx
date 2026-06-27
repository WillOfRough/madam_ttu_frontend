import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpCircle, Inbox,
  AlertCircle, ArrowRight, Heart, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import styles from './Settlement.module.css';
import sv from './SettlementView.module.css';

/* === 유틸 === */
const won = (n) => {
  if (n == null) return '0';
  const sign = n < 0 ? '-' : '';
  return sign + Math.abs(n).toLocaleString('ko-KR');
};

function formatDateShort(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function formatDateFull(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 매칭 종료월 기준 다음다음 달 10일
function calcPayoutDate(matchEndedAt) {
  if (!matchEndedAt) return null;
  const d = new Date(matchEndedAt);
  if (isNaN(d.getTime())) return null;
  const m = ((d.getMonth() + 2) % 12) + 1;
  const y = d.getFullYear() + Math.floor((d.getMonth() + 2) / 12);
  return new Date(y, m - 1, 10);
}

function formatPayoutDate(matchEndedAt) {
  const d = calcPayoutDate(matchEndedAt);
  if (!d) return '-';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function getEndDateKey(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isRefund(status) {
  return status === 'partial_refunded' || status === 'refunded';
}

function isPaid(status) {
  return status === 'settled';
}

function isCancelled(status) {
  return status === 'cancelled';
}

// 정산 내역 탭 옵션
const STATUS_TAB_OPTIONS = [
  { k: 'all',             l: '전체' },
  { k: 'ready_to_settle', l: '정산 대상' },
  { k: 'settled',         l: '정산 완료' },
];

const ROLE_TAB_OPTIONS = [
  { k: 'all',    l: '전체' },
  { k: 'match',  l: '매칭 매니저' },
  { k: 'member', l: '회원 매니저' },
];

// 정산제외(excluded)는 항상 합산/표시에서 제외.
// status === 'all' 이면 정산대상/정산완료 둘 다 통과.
function isCountedFor(s, status) {
  if (!s || s.excluded === true) return false;
  if (status === 'all') return s.status === 'ready_to_settle' || s.status === 'settled';
  return s.status === status;
}

function sumAmount(list, status) {
  return list.reduce((a, s) => a + (isCountedFor(s, status) ? (s.amount || 0) : 0), 0);
}

// 같은 매칭(matchId)의 매칭 매니저(matchmaker) 레코드는 회원 수만큼(보통 2건) 내려온다.
// → 한 건의 "A ↔ B 매칭 성사 보상"으로 합쳐서 보여준다. (금액 합산, 양쪽 회원명 결합)
// 회원 매니저(client_owner)는 회원별 등록자가 다를 수 있어 그대로 둔다.
// 상태/정산제외가 다르면 별개로 취급(같은 그룹으로 합치지 않음).
function mergeMatchmaker(list) {
  const result = [];
  const groups = new Map(); // key -> merged record

  list.forEach((s) => {
    if (s.role !== 'matchmaker' || !s.matchId) {
      result.push(s);
      return;
    }
    const key = `${s.matchId}|${s.status}|${s.excluded ? 1 : 0}`;
    let g = groups.get(key);
    if (!g) {
      g = { ...s, amount: 0, _clientNames: [], _ids: [] };
      groups.set(key, g);
      result.push(g);
    }
    g.amount += (s.amount || 0);
    if (s.id) g._ids.push(s.id);
    const nm = s.clientName || s.payerName;
    if (nm && !g._clientNames.includes(nm)) g._clientNames.push(nm);
  });

  groups.forEach((g) => {
    g.clientAName = g._clientNames[0] || null;
    g.clientBName = g._clientNames[1] || null;
    delete g._clientNames;
  });

  return result;
}

// 역할 매핑
const ROLE_LABEL = {
  matchmaker: '매칭 매니저',
  client_owner: '회원 매니저',
  both: '매물+매칭',
};

const STATUS_LABEL = {
  pending: '입금대기',
  confirmed: '입금완료',
  partial_refunded: '부분환불',
  ready_to_settle: '정산대상',
  settled: '정산완료',
  cancelled: '취소',
  refunded: '환불완료',
};

const STATUS_BADGE_TONE = {
  pending:          { bg: 'var(--amber-100)',     color: 'var(--amber-600)' },
  confirmed:        { bg: 'var(--lilac-100)',     color: '#4F3DA0' },
  ready_to_settle:  { bg: 'var(--tangerine-100)', color: 'var(--tangerine-700)' },
  partial_refunded: { bg: 'var(--rose-100)',      color: 'var(--rose-600)' },
  refunded:         { bg: 'var(--rose-100)',      color: 'var(--rose-600)' },
  settled:          { bg: 'var(--mint-100)',      color: 'var(--mint-600)' },
  cancelled:        { bg: 'var(--ink-100)',       color: 'var(--ink-500)' },
};

// 정산제외 사유 한글 매핑
const EXCLUSION_REASON_LABEL = {
  manual_confirm: '수동 결제 확인',
  zero_amount: '0원 결제',
  coupon: '쿠폰 결제',
};

// 기간 필터: 날짜 경계 계산 (period 기반, 레거시 매니저 모드용)
function getPeriodRange(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;

  if (period === 'this') {
    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    return { from, to };
  }
  if (period === 'last') {
    let lm = m - 1;
    let ly = y;
    if (lm < 1) { lm = 12; ly--; }
    const lastDay = new Date(ly, lm, 0).getDate();
    const from = `${ly}-${String(lm).padStart(2, '0')}-01`;
    const to = `${ly}-${String(lm).padStart(2, '0')}-${lastDay}`;
    return { from, to };
  }
  // 3m
  const threeBack = new Date(y, m - 4, 1);
  const from = `${threeBack.getFullYear()}-${String(threeBack.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
  return { from, to };
}

// 선택된 연/월 기준 from/to 계산
function getMonthRange(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${String(month).padStart(2, '0')}-01`,
    to:   `${year}-${String(month).padStart(2, '0')}-${lastDay}`,
  };
}

function getCurrentMonthLabel() {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
}

/**
 * 정산 화면 공통 컴포넌트. 본인 정산(Settlement)과 admin 매니저별 정산(AdminSettlement)이 공유한다.
 *
 * @param {object}   service               데이터 소스. getMonthlySummary({year}), getDailySummary({from,to}),
 *                                         listSettlements({from,to,page,size,status}) 필수.
 *                                         getByRoleSummary() 가 있으면 역할별 패널을 표시한다.
 * @param {string}   [title='정산']         상단 헤더 타이틀
 * @param {boolean}  [showHelp=true]       상단 정책 도움말 버튼 표시 여부
 * @param {function} [renderMonthlyAction] ({year, month, summary, reload}) => ReactNode.
 *                                         Hero 하단에 렌더링 (레거시 admin 월단위 일괄지급 등).
 * @param {function} [onToggleExclude]     (settlementObj) => Promise<bool>. 단건 제외/복구 (영수증 시트용).
 * @param {number}   [selectedYear]        admin 제어 연도. 없으면 내부 this/last/3m period 사용.
 * @param {number}   [selectedMonth]       admin 제어 월. 없으면 내부 period 사용.
 * @param {boolean}  [collapsibleCalendar] true 이면 달력을 접기/펼치기 버튼으로 토글 (기본 collapsed).
 * @param {boolean}  [selectionEnabled]    true 이면 체크박스 + 일괄 액션 바 표시.
 * @param {function} [onBulkExclude]       (idsArray, excluded) => Promise<void>. bulk exclude/restore.
 */
export default function SettlementView({
  service,
  title = '정산',
  showHelp = true,
  renderMonthlyAction,
  onToggleExclude,
  selectedYear,
  selectedMonth,
  collapsibleCalendar = false,
  selectionEnabled = false,
  onBulkExclude,
}) {
  // month-driven 모드 여부: selectedYear + selectedMonth 가 모두 전달되면 admin 모드
  const isAdminMode = selectedYear != null && selectedMonth != null;

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  // admin 모드가 아닐 때 사용하는 기간 세그먼트
  const [period, setPeriod] = useState('this');

  // 필터 상태 (공통)
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ready_to_settle');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showSheet, setShowSheet] = useState(null);

  // 달력 접기 상태 (collapsibleCalendar=true 이면 기본 접혀있음)
  const [calendarExpanded, setCalendarExpanded] = useState(!collapsibleCalendar);

  // 선택된 행 ids (selectionEnabled=true 일 때)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // 데이터 상태
  const [monthly, setMonthly] = useState(null);
  const [dailySeries, setDailySeries] = useState([]);
  // admin 모드: 해당 월의 전체 데이터셋 (ready_to_settle + settled 합산)
  const [monthDataset, setMonthDataset] = useState([]);
  // 비admin 모드: 기존 settlements + pagination
  const [settlements, setSettlements] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalElements: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // byRole 은 admin 모드에서 monthDataset 으로 직접 계산하므로 서버 의존 없음
  // 비admin 모드에서는 getByRoleSummary 가 있으면 그것을 사용
  const showByRole = isAdminMode || typeof service?.getByRoleSummary === 'function';
  const [byRoleFromServer, setByRoleFromServer] = useState({
    clientOwner: { expectedAmount: 0, settledAmount: 0 },
    matchmaker:  { expectedAmount: 0, settledAmount: 0 },
  });

  // 실제 사용할 연/월
  const activeYear  = isAdminMode ? selectedYear  : nowYear;
  const activeMonth = isAdminMode ? selectedMonth : nowMonth;

  // 기간에 맞는 from/to
  const periodRange = useMemo(() => {
    if (isAdminMode) return getMonthRange(selectedYear, selectedMonth);
    return getPeriodRange(period);
  }, [isAdminMode, selectedYear, selectedMonth, period]);


  // 초기 로드: 월별 요약 + 일별 차트 + (비admin 모드) 역할별 누적
  useEffect(() => {
    let cancelled = false;
    const tasks = [
      service.getMonthlySummary({ year: activeYear }),
      service.getDailySummary({ from: periodRange.from, to: periodRange.to }),
    ];
    if (!isAdminMode && typeof service?.getByRoleSummary === 'function') {
      tasks.push(service.getByRoleSummary());
    }
    Promise.allSettled(tasks).then(([monthlyR, dailyR, byRoleR]) => {
      if (cancelled) return;
      if (monthlyR.status === 'fulfilled') setMonthly(monthlyR.value);
      if (dailyR.status === 'fulfilled') setDailySeries(dailyR.value?.items || []);
      if (byRoleR && byRoleR.status === 'fulfilled' && byRoleR.value) {
        setByRoleFromServer({
          clientOwner: {
            expectedAmount: byRoleR.value?.clientOwner?.expectedAmount ?? 0,
            settledAmount:  byRoleR.value?.clientOwner?.settledAmount  ?? 0,
          },
          matchmaker: {
            expectedAmount: byRoleR.value?.matchmaker?.expectedAmount ?? 0,
            settledAmount:  byRoleR.value?.matchmaker?.settledAmount  ?? 0,
          },
        });
      }
    });
    return () => { cancelled = true; };
  }, [service, isAdminMode, activeYear, periodRange, reloadKey]);

  // admin 모드: 선택 월의 전체 데이터셋 로드 (ready_to_settle + settled, size 100 각각)
  // 이 데이터셋은 summary 계산 + 목록 클라이언트 필터링에 함께 사용됨
  useEffect(() => {
    if (!isAdminMode) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const dateKeyOf = (s) => s?.matchEndedAt || s?.createdAt || '';
    const sortByDateDesc = (list) => [...list].sort((a, b) => dateKeyOf(b).localeCompare(dateKeyOf(a)));

    Promise.all([
      service.listSettlements({
        from: periodRange.from, to: periodRange.to,
        page: 0, size: 100, status: 'ready_to_settle',
      }),
      service.listSettlements({
        from: periodRange.from, to: periodRange.to,
        page: 0, size: 100, status: 'settled',
      }),
    ])
      .then(([r1, r2]) => {
        if (cancelled) return;
        const merged = sortByDateDesc([...(r1?.data || []), ...(r2?.data || [])]);
        setMonthDataset(merged);
        setSelectedIds(new Set()); // 월 변경 시 선택 초기화
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || '정산 정보를 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAdminMode, service, periodRange, reloadKey]);

  // 비admin 모드: 기간/필터 변경 시 목록 재조회
  useEffect(() => {
    if (isAdminMode) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const PAGE_SIZE = 20;
    const dateKeyOf = (s) => s?.matchEndedAt || s?.createdAt || '';
    const sortByDateDesc = (list) => list.sort((a, b) => dateKeyOf(b).localeCompare(dateKeyOf(a)));

    const promise = statusFilter === 'all'
      ? Promise.all([
          service.listSettlements({
            from: periodRange.from, to: periodRange.to,
            page: 0, size: 100, status: 'ready_to_settle',
          }),
          service.listSettlements({
            from: periodRange.from, to: periodRange.to,
            page: 0, size: 100, status: 'settled',
          }),
        ]).then(([r1, r2]) => {
          const merged = sortByDateDesc([...(r1?.data || []), ...(r2?.data || [])]);
          const start = page * PAGE_SIZE;
          return {
            data: merged.slice(start, start + PAGE_SIZE),
            pagination: {
              page,
              totalPages: Math.max(1, Math.ceil(merged.length / PAGE_SIZE)),
              totalElements: merged.length,
            },
          };
        })
      : service.listSettlements({
          from: periodRange.from, to: periodRange.to,
          page, size: PAGE_SIZE, status: statusFilter,
        });

    promise
      .then((res) => {
        if (cancelled) return;
        setSettlements(res?.data || []);
        setPagination(res?.pagination || { page: 0, totalPages: 1, totalElements: 0 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || '정산 정보를 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [isAdminMode, service, periodRange, statusFilter, page, reloadKey]);

  // 기간/필터 변경 시 페이지 리셋
  useEffect(() => { setPage(0); }, [period, roleFilter, statusFilter]);

  // 이번달 요약 계산 (월별 summary 에서 해당 월 row)
  const thisMonthSummary = useMemo(() => {
    const items = monthly?.items || [];
    const item = items.find((i) => i.month === activeMonth);
    return item || { month: activeMonth, count: 0, amount: 0, settledCount: 0, settledAmount: 0 };
  }, [monthly, activeMonth]);

  // admin 모드: monthDataset 으로부터 byRole 계산
  const byRole = useMemo(() => {
    if (!isAdminMode) return byRoleFromServer;
    const co = { expectedAmount: 0, settledAmount: 0 };
    const mm = { expectedAmount: 0, settledAmount: 0 };
    monthDataset.forEach((s) => {
      if (s.excluded) return;
      const amt = s.amount || 0;
      if (s.role === 'client_owner') {
        if (s.status === 'ready_to_settle') co.expectedAmount += amt;
        else if (s.status === 'settled')    co.settledAmount  += amt;
      } else if (s.role === 'matchmaker') {
        if (s.status === 'ready_to_settle') mm.expectedAmount += amt;
        else if (s.status === 'settled')    mm.settledAmount  += amt;
      }
    });
    return { clientOwner: co, matchmaker: mm };
  }, [isAdminMode, monthDataset, byRoleFromServer]);

  // admin 모드: monthDataset 에서 hero 표시용 count/amount (ready_to_settle)
  const adminHeroSummary = useMemo(() => {
    if (!isAdminMode) return null;
    let count = 0; let amount = 0; let settledCount = 0; let settledAmount = 0;
    monthDataset.forEach((s) => {
      if (s.excluded) return;
      if (s.status === 'ready_to_settle') { count++; amount += (s.amount || 0); }
      else if (s.status === 'settled')    { settledCount++; settledAmount += (s.amount || 0); }
    });
    return { count, amount, settledCount, settledAmount };
  }, [isAdminMode, monthDataset]);

  // admin 모드: 선택월 distinct 매칭 수(정산 레코드 수와 구분 — 매칭 1건이 레코드 여러 개)
  const adminMatchCount = useMemo(() => {
    if (!isAdminMode) return 0;
    const ids = new Set();
    monthDataset.forEach((s) => {
      if (s.excluded) return;
      if ((s.status === 'ready_to_settle' || s.status === 'settled') && s.matchId) ids.add(s.matchId);
    });
    return ids.size;
  }, [isAdminMode, monthDataset]);

  // 실제 hero 에 표시할 값
  const heroCount         = isAdminMode ? (adminHeroSummary?.count        ?? 0) : (thisMonthSummary.count        || 0);
  const heroAmount        = isAdminMode ? (adminHeroSummary?.amount       ?? 0) : (thisMonthSummary.amount       || 0);
  const heroSettledCount  = isAdminMode ? (adminHeroSummary?.settledCount  ?? 0) : (thisMonthSummary.settledCount  || 0);
  const heroSettledAmount = isAdminMode ? (adminHeroSummary?.settledAmount ?? 0) : (thisMonthSummary.settledAmount || 0);

  // 목록용 데이터 소스
  const rawList = isAdminMode ? monthDataset : settlements;

  // 역할 + 선택 일자 + statusFilter 필터
  const filteredSettlements = useMemo(() => {
    let list = rawList.filter((s) => isCountedFor(s, statusFilter));
    if (roleFilter === 'match')  list = list.filter((s) => s.role === 'matchmaker');
    else if (roleFilter === 'member') list = list.filter((s) => s.role === 'client_owner');
    if (selectedDay != null) {
      const dayKey = `${activeYear}-${String(activeMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      list = list.filter((s) => {
        const k = getEndDateKey(s.matchEndedAt) || getEndDateKey(s.createdAt);
        return k === dayKey;
      });
    }
    return list;
  }, [rawList, statusFilter, roleFilter, selectedDay, activeYear, activeMonth]);

  // 매칭 매니저 레코드 병합
  const displaySettlements = useMemo(
    () => mergeMatchmaker(filteredSettlements),
    [filteredSettlements],
  );

  // 일자별 그룹
  const grouped = useMemo(() => {
    const g = {};
    displaySettlements.forEach((s) => {
      const key = getEndDateKey(s.matchEndedAt) || getEndDateKey(s.createdAt);
      if (!key) return;
      if (!g[key]) g[key] = [];
      g[key].push(s);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [displaySettlements]);

  // 달력용 일별 데이터
  const dailyChartData = useMemo(() => {
    const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();
    const map = {};
    dailySeries.forEach((d) => {
      if (typeof d.date === 'string' && d.date.includes('-')) {
        const day = parseInt(d.date.split('-')[2], 10);
        if (day) map[day] = d;
      }
    });
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const item = map[d] || {};
      const isCurrent = activeYear === nowYear && activeMonth === nowMonth;
      return {
        d,
        amount: item.amount || 0,
        count: item.count || 0,
        isFuture: isCurrent ? d > nowDay : false,
        isToday:  isCurrent ? d === nowDay : false,
      };
    });
  }, [dailySeries, activeYear, activeMonth, nowYear, nowMonth, nowDay]);

  // 선택 관련 헬퍼
  // 행이 선택됐는지 확인 (merged row 의 경우 _ids[0] 으로 대표)
  const rowKey = (s) => (s._ids && s._ids.length) ? s._ids[0] : s.id;
  const isRowSelected = (s) => selectedIds.has(rowKey(s));

  const toggleRow = useCallback((s) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const k = rowKey(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }, []);

  const allSelected = displaySettlements.length > 0 && displaySettlements.every((s) => isRowSelected(s));
  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displaySettlements.map(rowKey)));
    }
  }, [allSelected, displaySettlements]);

  // 선택된 모든 ids (merged row 는 _ids 전체 포함)
  const selectedAllIds = useMemo(() => {
    const ids = [];
    displaySettlements.forEach((s) => {
      const k = (s._ids && s._ids.length) ? s._ids[0] : s.id;
      if (selectedIds.has(k)) {
        ids.push(...((s._ids && s._ids.length) ? s._ids : (s.id ? [s.id] : [])));
      }
    });
    return ids;
  }, [displaySettlements, selectedIds]);

  const handleBulkAction = useCallback(async (excluded) => {
    if (!onBulkExclude || selectedAllIds.length === 0) return;
    await onBulkExclude(selectedAllIds, excluded);
    setSelectedIds(new Set());
  }, [onBulkExclude, selectedAllIds]);

  const handlePeriodChange = useCallback((p) => {
    setPeriod(p);
    setRoleFilter('all');
    setSelectedDay(null);
  }, []);

  const monthlyAction = renderMonthlyAction
    ? renderMonthlyAction({ year: activeYear, month: activeMonth, summary: thisMonthSummary, reload })
    : null;

  const monthLabelDisplay = isAdminMode
    ? `${selectedYear}년 ${selectedMonth}월`
    : getCurrentMonthLabel();

  return (
    <div className={styles.page}>
      {/* === 상단 헤더 === */}
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>{title}</span>
        {showHelp && (
          <button
            className={styles.helpBtn}
            onClick={() => setShowSheet('policy')}
            aria-label="정산 정책 안내"
          >
            <HelpCircle size={18} />
          </button>
        )}
      </div>

      <div className={styles.content}>
        {/* === Hero 카드 === */}
        {isAdminMode ? (
          <AdminSummary
            monthLabel={monthLabelDisplay}
            amount={heroAmount}
            count={heroCount}
            settledAmount={heroSettledAmount}
            settledCount={heroSettledCount}
            matchCount={adminMatchCount}
            byRole={byRole}
          />
        ) : (
          <HeroCard
            monthLabel={monthLabelDisplay}
            accrued={heroAmount}
            count={heroCount}
            settledAmount={heroSettledAmount}
            settledCount={heroSettledCount}
            byRole={byRole}
            showByRole={showByRole}
            expectedTotal={monthly?.expectedTotal ?? 0}
            onPolicy={showHelp ? () => setShowSheet('policy') : undefined}
            actionSlot={monthlyAction}
          />
        )}

        {/* === 매칭 종료 달력 === */}
        {collapsibleCalendar ? (
          <>
            <div className={sv.calendarToggleRow}>
              <button
                className={sv.calendarToggleBtn}
                onClick={() => setCalendarExpanded((v) => !v)}
                aria-expanded={calendarExpanded}
              >
                {calendarExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                매칭 달력 {calendarExpanded ? '접기' : '펼치기'}
              </button>
            </div>
            {calendarExpanded && (
              <CalendarCard
                data={dailyChartData}
                monthLabel={`${activeMonth}월`}
                year={activeYear}
                month={activeMonth}
                fluid={isAdminMode}
                selectedDay={selectedDay}
                onSelectDay={(d) => setSelectedDay(d)}
              />
            )}
          </>
        ) : (
          <CalendarCard
            data={dailyChartData}
            monthLabel={`${activeMonth}월`}
            year={activeYear}
            month={activeMonth}
            fluid={isAdminMode}
            selectedDay={isAdminMode ? selectedDay : (period === 'this' ? selectedDay : null)}
            onSelectDay={(d) => {
              if (!isAdminMode && period !== 'this') setPeriod('this');
              setSelectedDay(d);
            }}
          />
        )}

        {/* === 정산 내역 === */}
        <div className={styles.listSection}>
          <div className={styles.listSectionHeader}>
            <div>
              <div className={styles.listSectionTitle}>정산 내역</div>
              <div className={styles.listSectionMeta}>
                {displaySettlements.length}건 · {won(sumAmount(displaySettlements, statusFilter))}원
              </div>
            </div>
            {selectedDay != null && (
              <button
                className={styles.selectedDayChip}
                onClick={() => setSelectedDay(null)}
              >
                {activeMonth}월 {selectedDay}일
                <X size={12} />
              </button>
            )}
          </div>

          {/* 기간 세그먼트 — 비admin 모드에서만 표시 */}
          {!isAdminMode && (
            <div className={styles.segmentControl}>
              {[
                { k: 'this', l: '이번 달' },
                { k: 'last', l: '지난 달' },
                { k: '3m',   l: '3개월' },
              ].map((p) => (
                <button
                  key={p.k}
                  className={`${styles.segmentBtn} ${period === p.k ? styles.segmentBtnActive : ''}`}
                  onClick={() => handlePeriodChange(p.k)}
                >
                  {p.l}
                </button>
              ))}
            </div>
          )}

          {/* 필터 툴바 — 상태(정산 대상/완료) + 유형(역할) */}
          <div className={styles.filterToolbar}>
            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>상태</span>
              <div className={styles.segGroup} role="tablist" aria-label="정산 상태">
                {STATUS_TAB_OPTIONS.map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === o.k}
                    className={`${styles.segChip} ${statusFilter === o.k ? styles.segChipActive : ''}`}
                    onClick={() => setStatusFilter(o.k)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterGroupLabel}>유형</span>
              <div className={styles.segGroup} role="tablist" aria-label="매니저 유형">
                {ROLE_TAB_OPTIONS.map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    role="tab"
                    aria-selected={roleFilter === o.k}
                    className={`${styles.segChip} ${roleFilter === o.k ? styles.segChipActive : ''}`}
                    onClick={() => setRoleFilter(o.k)}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 전체선택 행 — selectionEnabled 이고 목록이 있을 때 */}
          {selectionEnabled && !loading && !error && displaySettlements.length > 0 && (
            <div className={sv.selectAllRow}>
              <input
                type="checkbox"
                className={sv.txCheckbox}
                checked={allSelected}
                onChange={toggleAll}
                id="sv-select-all"
                aria-label="전체 선택"
              />
              <label className={sv.selectAllLabel} htmlFor="sv-select-all">
                전체 선택 ({displaySettlements.length}건)
              </label>
            </div>
          )}

          {/* 거래 목록 */}
          {loading ? (
            <div className={styles.stateBox}>
              <div className={styles.loadingDots}>
                <span /><span /><span />
              </div>
            </div>
          ) : error ? (
            <div className={styles.stateBox}>
              <AlertCircle size={20} color="var(--rose-600)" />
              <div className={styles.stateText} style={{ color: 'var(--rose-600)' }}>{error}</div>
            </div>
          ) : grouped.length === 0 ? (
            <div className={styles.stateBox}>
              <Inbox size={22} color="var(--ink-300)" />
              <div className={styles.stateText}>해당 기간 내역이 없어요</div>
            </div>
          ) : (
            <div className={styles.txList}>
              {grouped.map(([date, items]) => {
                const sum = sumAmount(items, statusFilter);
                return (
                  <div key={date} className={styles.txGroup}>
                    <div className={styles.txGroupHeader}>
                      <span className={styles.txGroupDate}>{formatDateShort(date)}</span>
                      <span className={styles.txGroupLabel}>매칭 종료</span>
                      <span className={styles.txGroupLine} />
                      <span
                        className={styles.txGroupSum}
                        style={{ color: sum < 0 ? 'var(--rose-600)' : 'var(--ink-700)' }}
                      >
                        {sum > 0 ? '+' : ''}{won(sum)}원
                      </span>
                    </div>
                    <div className={styles.txGroupItems}>
                      {items.map((s) => (
                        selectionEnabled ? (
                          <div key={rowKey(s)} className={sv.txRowWithCheck}>
                            <input
                              type="checkbox"
                              className={sv.txCheckbox}
                              checked={isRowSelected(s)}
                              onChange={(e) => { e.stopPropagation(); toggleRow(s); }}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="행 선택"
                            />
                            <TxRow
                              s={s}
                              onClick={() => setShowSheet(s)}
                              selected={isRowSelected(s)}
                            />
                          </div>
                        ) : (
                          <TxRow
                            key={s.id}
                            s={s}
                            onClick={() => setShowSheet(s)}
                          />
                        )
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 — 비admin 모드에서만 */}
          {!isAdminMode && !loading && !error && pagination.totalPages > 1 && (
            <div className={styles.pager}>
              <button
                className={styles.pagerBtn}
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                이전
              </button>
              <span className={styles.pagerInfo}>{page + 1} / {pagination.totalPages}</span>
              <button
                className={styles.pagerBtn}
                disabled={page >= pagination.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </button>
            </div>
          )}
        </div>

        {/* === 환불 정책 푸터 카드 === */}
        {showHelp && <RefundPolicyCard onClick={() => setShowSheet('refund')} />}

        {/* === 일괄 액션 바 (인라인, 목록 하단) === */}
        {selectionEnabled && selectedIds.size > 0 && (
          <div className={sv.bulkBar}>
            <span className={sv.bulkBarCount}>선택 {selectedIds.size}건</span>
            <div className={sv.bulkBarActions}>
              <button className={sv.bulkExcludeBtn} onClick={() => handleBulkAction(true)}>
                정산 제외
              </button>
              <button className={sv.bulkRestoreBtn} onClick={() => handleBulkAction(false)}>
                정산 복구
              </button>
              <button className={sv.bulkCancelBtn} onClick={() => setSelectedIds(new Set())}>
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === 시트 === */}
      {showSheet === 'policy' && (
        <PolicySheet onClose={() => setShowSheet(null)} />
      )}
      {showSheet === 'refund' && (
        <RefundSheet onClose={() => setShowSheet(null)} />
      )}
      {showSheet && typeof showSheet === 'object' && (
        <ReceiptSheet
          s={showSheet}
          onClose={() => setShowSheet(null)}
          onToggleExclude={onToggleExclude}
          reload={reload}
        />
      )}
    </div>
  );
}

/* === Admin 요약 카드 (밝고 컴팩트한 중립 버전 — 다크 HeroCard 대체) === */
function AdminSummary({ monthLabel, amount, count, settledAmount, settledCount, matchCount, byRole }) {
  const co = byRole?.clientOwner || { expectedAmount: 0, settledAmount: 0 };
  const mm = byRole?.matchmaker  || { expectedAmount: 0, settledAmount: 0 };
  const hasSettled = settledCount > 0 || settledAmount > 0;

  return (
    <div className={sv.adminSummary}>
      <div className={sv.adminSummaryLabel}>
        {monthLabel} 정산{matchCount != null ? ` · 매칭 ${matchCount}건` : ''}
      </div>
      <div className={sv.adminSummaryAmountRow}>
        <span className={amount > 0 ? sv.adminSummaryAmountOn : sv.adminSummaryAmount}>
          {won(amount)}<span className={sv.adminSummaryUnit}>원</span>
        </span>
        <span className={sv.adminSummaryMeta}>
          미정산 {count}건{hasSettled ? ` · 지급완료 ${settledCount}건 ${won(settledAmount)}원` : ''}
        </span>
      </div>
      <div className={sv.adminRoleSplit}>
        <div className={sv.adminRoleRow}>
          <span className={sv.adminRoleName}>회원 매니저</span>
          <span className={sv.adminRoleVal}>
            미정산 {won(co.expectedAmount)}원<span className={sv.adminRoleSub}> · 지급 {won(co.settledAmount)}원</span>
          </span>
        </div>
        <div className={sv.adminRoleRow}>
          <span className={sv.adminRoleName}>매칭 매니저</span>
          <span className={sv.adminRoleVal}>
            미정산 {won(mm.expectedAmount)}원<span className={sv.adminRoleSub}> · 지급 {won(mm.settledAmount)}원</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* === Hero 카드 === */
function HeroCard({ monthLabel, accrued, count, settledAmount, settledCount, byRole, showByRole, expectedTotal, onPolicy, actionSlot }) {
  const co = byRole?.clientOwner || { expectedAmount: 0, settledAmount: 0 };
  const mm = byRole?.matchmaker  || { expectedAmount: 0, settledAmount: 0 };

  return (
    <div className={`${styles.heroCard} ${sv.heroCardAdmin}`}>
      <div className={styles.heroGlow} />

      <div className={styles.heroTopRow}>
        <div className={styles.heroMonthLabel}>{monthLabel} 정산</div>
        {onPolicy && (
          <button className={styles.heroPolicyBtn} onClick={onPolicy}>
            정책 <ArrowRight size={10} />
          </button>
        )}
      </div>

      <div className={styles.heroAmountBlock}>
        <div className={styles.heroAmount}>
          {won(accrued)}
          <span className={styles.heroAmountUnit}>원</span>
        </div>
        <div className={styles.heroAmountMeta}>
          <span>미정산 {count}건</span>
          {(settledCount > 0 || settledAmount > 0) && (
            <span>· 지급완료 {settledCount}건 {won(settledAmount)}원</span>
          )}
        </div>
      </div>

      {showByRole && (
        <div className={styles.heroRoleRow}>
          <div className={styles.heroRolePanel}>
            <div className={styles.heroRoleLabel}>
              <span className={styles.heroRoleDot} style={{ background: '#7AB2FF' }} />
              회원 매니저
            </div>
            <div className={styles.heroRoleLine}>
              <span className={styles.heroRoleLineKey}>미정산</span>
              <span className={styles.heroRoleLineVal}>
                {won(co.expectedAmount)}<span className={styles.heroRoleUnit}>원</span>
              </span>
            </div>
            <div className={styles.heroRoleLine}>
              <span className={styles.heroRoleLineKey}>지급완료</span>
              <span className={styles.heroRoleLineVal}>
                {won(co.settledAmount)}<span className={styles.heroRoleUnit}>원</span>
              </span>
            </div>
          </div>
          <div className={styles.heroRolePanel}>
            <div className={styles.heroRoleLabel}>
              <span className={styles.heroRoleDot} style={{ background: 'var(--tangerine-400)' }} />
              매칭 매니저
            </div>
            <div className={styles.heroRoleLine}>
              <span className={styles.heroRoleLineKey}>미정산</span>
              <span className={styles.heroRoleLineVal}>
                {won(mm.expectedAmount)}<span className={styles.heroRoleUnit}>원</span>
              </span>
            </div>
            <div className={styles.heroRoleLine}>
              <span className={styles.heroRoleLineKey}>지급완료</span>
              <span className={styles.heroRoleLineVal}>
                {won(mm.settledAmount)}<span className={styles.heroRoleUnit}>원</span>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.heroCumulativeRow}>
        <span className={styles.heroCumulativeLabel}>받을 정산 잔고</span>
        <span className={styles.heroCumulativeValue}>{won(expectedTotal)}원</span>
      </div>

      {actionSlot && <div style={{ marginTop: 14 }}>{actionSlot}</div>}
    </div>
  );
}

/* === 매칭 종료 달력 카드 === */
function CalendarCard({ data, monthLabel, year, month, selectedDay, onSelectDay, fluid }) {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=일
  const totalDays = data.length;
  const totalCells = Math.ceil((firstDow + totalDays) / 7) * 7;
  const totalCount = data.reduce((a, d) => a + (d.count || 0), 0);

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const idx = i - firstDow;
    return idx >= 0 && idx < totalDays ? data[idx] : null;
  });

  return (
    <div className={`${styles.calendarCard} ${fluid ? styles.calendarCardFluid : ''}`}>
      <div className={styles.calendarHeader}>
        <div>
          <div className={styles.calendarTitle}>{monthLabel} 매칭 달력</div>
          <div className={styles.calendarSubtitle}>
            {totalCount > 0 ? `종료 ${totalCount}건 · 날짜 탭하면 그날 내역만 보기` : '매칭 종료일이 표시돼요'}
          </div>
        </div>
      </div>

      <div className={styles.calendarWeekRow}>
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div
            key={d}
            className={`${styles.calendarWeekday} ${i === 0 ? styles.calendarWeekdaySun : ''} ${i === 6 ? styles.calendarWeekdaySat : ''}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} className={styles.calendarCellEmpty} />;
          const dow = i % 7;
          const hasMatch = (cell.count || 0) > 0;
          const isSelected = selectedDay === cell.d;
          const dayClass = `${styles.calendarCellDay} ${dow === 0 ? styles.calendarCellDaySun : ''} ${dow === 6 ? styles.calendarCellDaySat : ''}`;
          const cellClass = [
            styles.calendarCell,
            cell.isFuture ? styles.calendarCellFuture : '',
            cell.isToday ? styles.calendarCellToday : '',
            hasMatch ? styles.calendarCellHasMatch : '',
            isSelected ? styles.calendarCellSelected : '',
          ].filter(Boolean).join(' ');
          return (
            <button
              key={cell.d}
              className={cellClass}
              onClick={() => hasMatch && onSelectDay(isSelected ? null : cell.d)}
              disabled={!hasMatch}
              aria-pressed={isSelected}
              aria-label={`${cell.d}일${hasMatch ? ` 매칭 ${cell.count}건` : ''}`}
            >
              <span className={dayClass}>{cell.d}</span>
              {hasMatch && (
                <span className={styles.calendarCellBadge}>{cell.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.calendarLegend}>
        <span className={styles.calendarLegendItem}>
          <span className={styles.calendarLegendBadge}>1</span>
          매칭 종료 건수
        </span>
      </div>
    </div>
  );
}

/* === 거래 행 === */
function TxRow({ s, onClick, selected }) {
  const refund = isRefund(s.status);
  const paid = isPaid(s.status);
  const cancelled = isCancelled(s.status);
  const excluded = s.excluded === true;

  const roleLabel = ROLE_LABEL[s.role] || s.role;
  const roleIsMatch = s.role === 'matchmaker';
  const roleIsClient = s.role === 'client_owner';

  const muted = excluded || refund || cancelled;
  const roleBg = muted ? 'var(--ink-100)' : roleIsMatch ? 'var(--tangerine-100)' : roleIsClient ? 'var(--male-100)' : 'var(--ink-100)';
  const roleColor = muted ? 'var(--ink-400)' : roleIsMatch ? 'var(--tangerine-700)' : roleIsClient ? 'var(--male)' : 'var(--ink-500)';
  const badgeBg = roleIsMatch ? 'var(--tangerine-100)' : roleIsClient ? 'var(--male-100)' : 'var(--ink-100)';
  const badgeColor = roleIsMatch ? 'var(--tangerine-700)' : roleIsClient ? 'var(--male)' : 'var(--ink-500)';

  const pairLabel = (s.clientAName && s.clientBName)
    ? `${s.clientAName} ↔ ${s.clientBName}`
    : (s.clientAName || s.clientBName || null);
  const memberLabel = roleIsClient
    ? (s.ownedClientName || pairLabel || s.clientName)
    : (pairLabel || s.ownedClientName || s.clientName);
  const recipientName = memberLabel || '회원';
  const reasonLabel = roleIsMatch
    ? '매칭 성사 보상'
    : roleIsClient
      ? '회원 매물 보상'
      : s.role === 'both'
        ? '매물 + 매칭 보상'
        : '정산';
  const matchCode = s.matchId ? `#${String(s.matchId).slice(-6)}` : '';
  const payoutDate = formatPayoutDate(s.matchEndedAt);

  return (
    <button
      className={`${styles.txRow} ${sv.txRowFlat}${selected ? ` ${sv.txRowSelected}` : ''}`}
      onClick={onClick}
      style={muted ? { opacity: 0.55 } : undefined}
    >
      <div className={styles.txRowIcon} style={{ background: roleBg, color: roleColor }}>
        {refund ? <X size={15} /> : <Heart size={15} />}
      </div>

      <div className={styles.txRowBody}>
        <div className={styles.txRowBadgeRow}>
          <span className={styles.txRoleBadge} style={{ background: badgeBg, color: badgeColor }}>
            {roleLabel}
          </span>
          {excluded ? (
            <span
              className={styles.txStatusBadge}
              style={{ background: 'var(--ink-100)', color: 'var(--ink-500)' }}
            >
              정산제외
            </span>
          ) : (() => {
            const label = STATUS_LABEL[s.status];
            const tone = STATUS_BADGE_TONE[s.status];
            if (!label || !tone) return null;
            return (
              <span className={styles.txStatusBadge} style={{ background: tone.bg, color: tone.color }}>
                {label}
              </span>
            );
          })()}
        </div>
        <div className={styles.txRowMatch}>
          {recipientName} <span style={{ color: 'var(--ink-400)', fontWeight: 500 }}>· {reasonLabel}</span>
        </div>
        <div className={styles.txRowPayout}>
          {matchCode && <span style={{ color: 'var(--ink-400)' }}>{matchCode} · </span>}
          {excluded
            ? `정산 제외 · ${EXCLUSION_REASON_LABEL[s.exclusionReason] || s.exclusionReason || '사유 없음'}`
            : paid ? `${payoutDate} 입금` : `${payoutDate} 입금 예정`}
        </div>
      </div>

      <div
        className={styles.txRowAmount}
        style={{
          color: muted ? 'var(--ink-400)' : 'var(--ink-900)',
          textDecoration: muted ? 'line-through' : 'none',
        }}
      >
        {(s.amount || 0) > 0 ? '+' : ''}{won(s.amount)}
        <span className={styles.txRowAmountUnit}>원</span>
      </div>
    </button>
  );
}

/* === 환불 정책 푸터 카드 === */
function RefundPolicyCard({ onClick }) {
  const rules = [
    { when: '만남 7일 전까지', rule: '전액 환불' },
    { when: '만남 3일 전까지', rule: '50% 환불' },
    { when: '24시간 전까지', rule: '환불 불가' },
  ];

  return (
    <button className={styles.refundCard} onClick={onClick}>
      <div className={styles.refundCardHeader}>
        <div className={styles.refundCardIconWrap}>
          <AlertCircle size={14} />
        </div>
        <div className={styles.refundCardTitle}>환불 정책</div>
        <ArrowRight size={14} color="var(--ink-300)" />
      </div>
      <div className={styles.refundCardRules}>
        {rules.map((r) => (
          <div key={r.when} className={styles.refundCardRule}>
            <span className={styles.refundCardRuleWhen}>{r.when}</span>
            <span className={styles.refundCardRuleText}>{r.rule}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

/* === 시트 래퍼 === */
function SheetWrap({ onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div className={styles.sheetOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.sheetPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        {children}
      </div>
    </div>,
    document.body
  );
}

/* === 정산 정책 시트 === */
function PolicySheet({ onClose }) {
  return (
    <SheetWrap onClose={onClose}>
      <div className={styles.sheetTitle}>정산 정책</div>
      <div className={styles.sheetSubtitle}>매칭 종료 후 정산</div>

      <div className={styles.sheetSection}>
        <div className={styles.sheetSectionLabel}>결제액 기준 비율 분배</div>
        <div className={styles.policyBox}>
          <div className={styles.policyTotalCaption}>매칭 1건 예시 (결제 59,800원 기준)</div>
          <div className={styles.policyTotalAmount}>59,800<span className={styles.policyTotalUnit}>원</span></div>
          <div className={styles.policyRuleList}>
            <div className={styles.policyRuleRow}>
              <div className={styles.policyRuleLeft}>
                <span className={styles.policyRuleDot} style={{ background: 'var(--tangerine-600)' }} />
                <span className={styles.policyRuleName}>매칭 매니저</span>
                <span className={styles.policyRoleDesc}>매칭 만든 사람 · 약 20%</span>
              </div>
              <div className={styles.policyRuleValue}>약 12,000원</div>
            </div>
            <div className={styles.policyRuleRow}>
              <div className={styles.policyRuleLeft}>
                <span className={styles.policyRuleDot} style={{ background: '#3B7EE0' }} />
                <span className={styles.policyRuleName}>회원 매니저</span>
                <span className={styles.policyRoleDesc}>각 회원 등록자 · 약 15%</span>
              </div>
              <div className={styles.policyRuleValue}>약 9,000원 × 2</div>
            </div>
          </div>
          <div className={styles.policyHint}>
            정산액은 결제 금액의 비율로 산정되므로 매칭마다 금액이 달라질 수 있습니다.
            (환불 발생 시 비율대로 차감)
          </div>
        </div>
      </div>

      <div className={styles.sheetSection}>
        <div className={styles.sheetSectionLabel}>정산 일정</div>
        <div className={styles.policyScheduleBox}>
          <b style={{ color: 'var(--ink-900)' }}>매칭 종료일 기준</b> 다음 달 첫째 주에 입금됩니다.<br />
          <span style={{ color: 'var(--ink-500)' }}>예) 4월 종료 매칭 → 5월 첫째 주 입금</span>
        </div>
      </div>

      <button className={styles.sheetConfirmBtn} onClick={onClose}>확인</button>
    </SheetWrap>
  );
}

/* === 환불 정책 시트 === */
function RefundSheet({ onClose }) {
  const rules = [
    { when: '만남 7일 전까지', rule: '전액 환불 가능', deduct: '수수료 100% 차감', colorBg: 'var(--rose-100)', colorFg: 'var(--rose-600)' },
    { when: '만남 3일 전까지', rule: '50% 환불', deduct: '수수료 50% 차감', colorBg: 'var(--amber-100)', colorFg: 'var(--amber-600)' },
    { when: '24시간 전까지', rule: '환불 불가', deduct: '차감 없음', colorBg: 'var(--mint-100)', colorFg: 'var(--mint-600)' },
  ];

  return (
    <SheetWrap onClose={onClose}>
      <div className={styles.sheetTitle}>환불 정책</div>
      <div className={styles.sheetSubtitle}>만남 일정을 기준으로 적용</div>

      <div className={styles.refundRuleList}>
        {rules.map((r, i) => (
          <div key={r.when} className={styles.refundRuleItem}>
            <div
              className={styles.refundRuleNum}
              style={{ background: r.colorBg, color: r.colorFg }}
            >
              {i + 1}
            </div>
            <div className={styles.refundRuleContent}>
              <div className={styles.refundRuleWhen}>{r.when}</div>
              <div className={styles.refundRuleText}>{r.rule}</div>
            </div>
            <div className={styles.refundRuleDeduct}>{r.deduct}</div>
          </div>
        ))}
      </div>

      <div className={styles.refundRuleNote}>
        💡 약속 24시간 전까지 일정 1회 변경이 가능해요. 변경 시 환불 정책은 새 일정 기준으로 적용됩니다.
      </div>

      <button className={styles.sheetConfirmBtn} onClick={onClose}>확인</button>
    </SheetWrap>
  );
}

/* === 영수증 시트 === */
function ReceiptSheet({ s, onClose, onToggleExclude, reload }) {
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = async () => {
    if (!onToggleExclude || submitting) return;
    setSubmitting(true);
    const ok = await onToggleExclude(s);
    setSubmitting(false);
    if (ok) { reload?.(); onClose(); }
  };

  const refund = isRefund(s.status);
  const paid = isPaid(s.status);
  const cancelled = isCancelled(s.status);
  const excluded = s.excluded === true;
  const matchLabel = s.matchId ? `매칭 #${String(s.matchId).slice(-6)}` : '매칭';
  const recipientName = s.managerName || '담당 매니저';
  const pairLabel = (s.clientAName && s.clientBName)
    ? `${s.clientAName} ↔ ${s.clientBName}`
    : (s.clientAName || s.clientBName || null);
  const memberLabel = s.role === 'client_owner'
    ? (s.ownedClientName || pairLabel || s.clientName)
    : (pairLabel || s.ownedClientName || s.clientName);
  const reasonLabel = s.role === 'matchmaker'
    ? '매칭 성사 보상'
    : s.role === 'client_owner'
      ? '회원 매물 보상'
      : s.role === 'both'
        ? '매물 + 매칭 보상'
        : '정산';
  const payoutDate = formatPayoutDate(s.matchEndedAt);

  const rows = [
    ['회원', memberLabel || '-'],
    ['수령 매니저', recipientName],
    ['정산 사유', reasonLabel],
    ['역할', ROLE_LABEL[s.role] || s.role],
    ['매칭', matchLabel],
    ['종료일', formatDateFull(s.matchEndedAt) || formatDateFull(s.createdAt)],
    ['입금일', excluded ? '정산 제외' : paid ? payoutDate : `${payoutDate} (예정)`],
    ['상태', excluded ? '정산제외' : (STATUS_LABEL[s.status] || s.status)],
  ];
  if (excluded) {
    rows.push(['제외 사유', EXCLUSION_REASON_LABEL[s.exclusionReason] || s.exclusionReason || '-']);
  }

  const statusLabel = excluded
    ? '정산 제외'
    : (STATUS_LABEL[s.status] || (paid ? '지급 완료' : '지급 대기'));
  const statusColor = excluded
    ? 'var(--ink-500)'
    : (STATUS_BADGE_TONE[s.status]?.color || (paid ? 'var(--mint-600)' : 'var(--amber-600)'));

  return (
    <SheetWrap onClose={onClose}>
      <div className={styles.receiptStatusLabel} style={{ color: statusColor }}>
        {statusLabel}
      </div>
      <div
        className={styles.receiptAmount}
        style={{
          color: (excluded || cancelled) ? 'var(--ink-400)' : refund ? 'var(--rose-600)' : 'var(--ink-900)',
          textDecoration: (excluded || cancelled) ? 'line-through' : 'none',
        }}
      >
        {(s.amount || 0) > 0 ? '+' : ''}{won(s.amount)}
        <span className={styles.receiptAmountUnit}>원</span>
      </div>
      <div className={styles.receiptRoleDesc}>
        {ROLE_LABEL[s.role] || s.role}
      </div>

      <div className={styles.receiptRows}>
        {rows.map(([k, v]) => (
          <div key={k} className={styles.receiptRow}>
            <span className={styles.receiptRowKey}>{k}</span>
            <span className={styles.receiptRowVal}>{v}</span>
          </div>
        ))}
      </div>

      {excluded && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--ink-50)',
            color: 'var(--ink-500)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          이 결제는 정산 대상에서 제외되어 매니저 정산 금액에 포함되지 않습니다.
        </div>
      )}

      {onToggleExclude && (
        <button
          type="button"
          onClick={handleToggle}
          disabled={submitting}
          style={{
            marginTop: 14,
            width: '100%',
            height: 46,
            borderRadius: 12,
            border: `1px solid ${excluded ? 'var(--mint-600)' : 'var(--ink-200)'}`,
            background: '#fff',
            color: excluded ? 'var(--mint-600)' : 'var(--rose-600)',
            fontSize: 14,
            fontWeight: 700,
            cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? '처리 중…' : excluded ? '정산에 다시 포함' : '정산에서 제외'}
        </button>
      )}

      <button className={styles.sheetCancelBtn} onClick={onClose}>닫기</button>
    </SheetWrap>
  );
}
