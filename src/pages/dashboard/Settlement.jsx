import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import * as settlementService from '../../api/settlementService';
import styles from './Settlement.module.css';

const STATUS_LABELS = {
  pending: '입금대기',
  confirmed: '입금완료',
  partial_refunded: '부분환불',
  ready_to_settle: '정산대상',
  settled: '정산완료',
  paid: '정산완료',
  cancelled: '취소',
  refunded: '환불',
};

const FILTER_OPTIONS = ['', 'ready_to_settle', 'settled', 'confirmed', 'partial_refunded', 'pending', 'cancelled'];
const ROLE_LABELS = { client_owner: '매물', matchmaker: '매칭', both: '매물+매칭' };
const DAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토'];

function formatCurrency(amount) {
  return (amount ?? 0).toLocaleString('ko-KR');
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Returns date string "YYYY-MM-DD" from ISO string, treating as local time
function isoToLocalYmd(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return toYmd(d);
}

// Build 35-42 calendar cells for the given year/month
function getCalendarCells(year, month, items) {
  const todayStr = toYmd(new Date());
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Group items by date key: prefer matchEndedAt, fallback createdAt
  const byDate = {};
  items.forEach((s) => {
    const key = isoToLocalYmd(s.matchEndedAt) || isoToLocalYmd(s.createdAt);
    if (!key) return;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(s);
  });

  // Start from the Sunday of the week containing the 1st
  const startDow = firstDay.getDay(); // 0=Sun
  const cells = [];
  const cursor = new Date(year, month - 1, 1 - startDow);

  // Determine total rows needed
  const totalDays = startDow + lastDay.getDate();
  const totalCells = Math.ceil(totalDays / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    const dateStr = toYmd(cursor);
    cells.push({
      date: new Date(cursor),
      dateStr,
      inMonth: cursor.getMonth() === month - 1,
      isToday: dateStr === todayStr,
      matches: byDate[dateStr] || [],
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return cells;
}

export default function Settlement() {
  const navigate = useNavigate();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [monthly, setMonthly] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalElements: 0 });
  const [statusFilter, setStatusFilter] = useState('ready_to_settle');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => ({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }));
  const [calendarItems, setCalendarItems] = useState([]);
  const [calendarFading, setCalendarFading] = useState(false);

  // Main data: monthly summary + paginated list
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      settlementService.getMonthlySummary({ year }),
      settlementService.listSettlements({
        status: statusFilter || undefined,
        page,
        size: 20,
      }),
    ])
      .then(([monthlyRes, listRes]) => {
        if (cancelled) return;
        setMonthly(monthlyRes);
        setSettlements(listRes?.data || []);
        setPagination(listRes?.pagination || { page: 0, totalPages: 1, totalElements: 0 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || '정산 정보를 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, statusFilter, page]);

  // Calendar data: full month fetch
  useEffect(() => {
    let cancelled = false;
    const { year: y, month: m } = calendarMonth;
    const lastDay = new Date(y, m, 0);
    const fromStr = `${y}-${String(m).padStart(2, '0')}-01`;
    const toStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
    settlementService.listSettlements({ from: fromStr, to: toStr, size: 500 })
      .then((res) => {
        if (cancelled) return;
        setCalendarItems(res?.data || []);
      })
      .catch(() => {
        if (cancelled) return;
        setCalendarItems([]);
      });
    return () => { cancelled = true; };
  }, [calendarMonth]);

  const thisMonth = useMemo(() => {
    const item = (monthly?.items || []).find((i) => i.month === month);
    return item || { month, count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
  }, [monthly, month]);

  // Calendar display: only settled + ready_to_settle
  const calendarDisplayItems = useMemo(
    () => calendarItems.filter((s) => s.status === 'settled' || s.status === 'ready_to_settle'),
    [calendarItems],
  );

  const calendarCells = useMemo(
    () => getCalendarCells(calendarMonth.year, calendarMonth.month, calendarDisplayItems),
    [calendarMonth, calendarDisplayItems],
  );

  // Calendar month summary
  const calendarSummary = useMemo(() => {
    let readyCount = 0; let readyAmt = 0;
    let settledCount = 0; let settledAmt = 0;
    calendarDisplayItems.forEach((s) => {
      if (s.status === 'ready_to_settle') { readyCount++; readyAmt += s.amount ?? 0; }
      if (s.status === 'settled') { settledCount++; settledAmt += s.amount ?? 0; }
    });
    return { readyCount, readyAmt, settledCount, settledAmt };
  }, [calendarDisplayItems]);

  function changeMonth(delta) {
    setCalendarFading(true);
    setTimeout(() => {
      setCalendarMonth((prev) => {
        let m = prev.month + delta;
        let y = prev.year;
        if (m > 12) { m = 1; y++; }
        if (m < 1) { m = 12; y--; }
        return { year: y, month: m };
      });
      setCalendarFading(false);
    }, 180);
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}><DollarSign size={18} /> 정산 대시보드</h2>

      {/* 이번달 요약 카드 */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}><TrendingUp size={14} /> 이번 달 총 정산</div>
          <div className={styles.summaryValue}>{formatCurrency(thisMonth.totalAmount)}<span className={styles.unit}>원</span></div>
          <div className={styles.summarySub}>{year}.{String(month).padStart(2, '0')} · {thisMonth.count}건</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPaid}`}>
          <div className={styles.summaryLabel}><CheckCircle2 size={14} /> 지급 완료</div>
          <div className={styles.summaryValue}>{formatCurrency(thisMonth.paidAmount)}<span className={styles.unit}>원</span></div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPending}`}>
          <div className={styles.summaryLabel}><Clock size={14} /> 지급 대기</div>
          <div className={styles.summaryValue}>{formatCurrency(thisMonth.pendingAmount)}<span className={styles.unit}>원</span></div>
        </div>
      </div>

      {/* 월별 캘린더 */}
      <div className={styles.calendarCard}>
        {/* Header: month navigation */}
        <div className={styles.calendarHeader}>
          <button
            className={styles.calendarNavBtn}
            onClick={() => changeMonth(-1)}
            aria-label="이전 달"
          >
            <ChevronLeft size={16} />
          </button>
          <div className={styles.calendarHeaderCenter}>
            <span className={styles.calendarMonthTitle}>
              {calendarMonth.year}년 {calendarMonth.month}월
            </span>
            <div className={styles.calendarSummaryRow}>
              <span className={`${styles.calendarSummaryChip} ${styles.calendarSummaryChipReady}`}>
                정산대상 {calendarSummary.readyCount}건 · ₩{formatCurrency(calendarSummary.readyAmt)}
              </span>
              <span className={styles.calendarSummarySep}>·</span>
              <span className={`${styles.calendarSummaryChip} ${styles.calendarSummaryChipSettled}`}>
                정산완료 {calendarSummary.settledCount}건 · ₩{formatCurrency(calendarSummary.settledAmt)}
              </span>
              <span className={styles.calendarSummarySep}>·</span>
              <span className={styles.calendarSummaryTotal}>
                월 합계 ₩{formatCurrency(calendarSummary.readyAmt + calendarSummary.settledAmt)}
              </span>
            </div>
          </div>
          <button
            className={styles.calendarNavBtn}
            onClick={() => changeMonth(1)}
            aria-label="다음 달"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className={styles.calendarDayHeaders}>
          {DAY_HEADERS.map((d, i) => (
            <div
              key={d}
              className={`${styles.calendarDayHeader} ${i === 0 ? styles.calendarDayHeaderSun : i === 6 ? styles.calendarDayHeaderSat : ''}`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className={`${styles.calendarGrid} ${calendarFading ? styles.calendarFading : ''}`}
          style={{ gridTemplateRows: `repeat(${calendarCells.length / 7}, minmax(80px, auto))` }}
        >
          {calendarCells.map(({ dateStr, date, inMonth, isToday, matches }) => {
            const dayNum = date.getDate();
            const dow = date.getDay();
            const visibleMatches = matches.slice(0, 3);
            const overflow = matches.length - 3;
            return (
              <div
                key={dateStr}
                className={[
                  styles.calendarCell,
                  !inMonth ? styles.calendarCellDimmed : '',
                  isToday ? styles.calendarCellToday : '',
                  dow === 0 ? styles.calendarCellSun : dow === 6 ? styles.calendarCellSat : '',
                ].filter(Boolean).join(' ')}
              >
                <span className={styles.calendarDayNum}>{dayNum}</span>
                <div className={styles.calendarPills}>
                  {visibleMatches.map((s) => (
                    <button
                      key={s.id}
                      className={`${styles.calendarMatchPill} ${s.status === 'settled' ? styles.calendarMatchPillSettled : styles.calendarMatchPillReady}`}
                      onClick={() => navigate(`/dashboard/matches/${s.matchId}`)}
                      title={`₩${formatCurrency(s.amount)} · ${STATUS_LABELS[s.status] || s.status}`}
                      aria-label={`매칭 ${s.matchId} 정산 ${formatCurrency(s.amount)}원`}
                    >
                      <span className={styles.calendarPillAmt}>₩{formatCurrency(s.amount)}</span>
                    </button>
                  ))}
                  {overflow > 0 && (
                    <span className={styles.calendarMoreCount}>+{overflow}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 정산 목록 */}
      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <span className={styles.listTitle}>정산 내역 {pagination.totalElements > 0 && `(${pagination.totalElements}건)`}</span>
          <div className={styles.filterBar}>
            {FILTER_OPTIONS.map((s) => (
              <button
                key={s || 'all'}
                className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
                onClick={() => { setStatusFilter(s); setPage(0); }}
              >
                {s === '' ? '전체' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>불러오는 중...</div>
        ) : error ? (
          <div className={styles.errorRow}>{error}</div>
        ) : settlements.length === 0 ? (
          <div className={styles.emptyRow}>정산 내역이 없습니다.</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>생성일</th>
                  <th>매칭 종료일</th>
                  <th>역할</th>
                  <th className={styles.shareCol}>비율</th>
                  <th className={styles.amountCol}>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.createdAt)}</td>
                    <td className={styles.endedAtCol}>{formatDate(s.matchEndedAt)}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[`role_${s.role}`] || ''}`}>
                        {ROLE_LABELS[s.role] || s.role}
                      </span>
                    </td>
                    <td className={styles.shareCol}>{s.share}/10</td>
                    <td className={styles.amountCol}>{formatCurrency(s.amount)}원</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${s.status}`] || ''}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className={styles.pager}>
                <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>이전</button>
                <span>{page + 1} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages - 1} onClick={() => setPage((p) => p + 1)}>다음</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
