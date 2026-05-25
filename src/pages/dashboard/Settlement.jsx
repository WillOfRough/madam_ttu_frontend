import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpCircle, Inbox,
  AlertCircle, ArrowRight, Heart, X, Check,
  TrendingUp, Clock,
} from 'lucide-react';
import * as settlementService from '../../api/settlementService';
import styles from './Settlement.module.css';

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
  const payoutMonth = d.getMonth() + 3; // +2 months, 0-indexed so +3
  const payoutYear = d.getFullYear() + Math.floor((d.getMonth() + 3) / 12);
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

// 합산금액 집계 대상: 실제 정산완료된 건만 (입금대기·환불·취소·정산제외는 제외)
function isCountedForTotal(s) {
  return s?.status === 'settled' && s?.excluded !== true;
}

function sumSettledAmount(list) {
  return list.reduce((a, s) => a + (isCountedForTotal(s) ? (s.amount || 0) : 0), 0);
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

// 기간 필터: 날짜 경계 계산
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

function getCurrentMonthLabel() {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월`;
}

/* === 메인 컴포넌트 === */
export default function Settlement() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 기간·필터 상태
  const [period, setPeriod] = useState('this');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedDay, setSelectedDay] = useState(null); // 달력에서 선택한 일자 (1~말일)
  const [showSheet, setShowSheet] = useState(null); // null | 'policy' | 'refund' | settlement-object

  // 데이터 상태
  const [monthly, setMonthly] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalElements: 0 });
  const [dailySeries, setDailySeries] = useState([]);
  const [byRole, setByRole] = useState({
    clientOwner: { expectedAmount: 0, settledAmount: 0 },
    matchmaker: { expectedAmount: 0, settledAmount: 0 },
  });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 기간에 맞는 from/to
  const periodRange = useMemo(() => getPeriodRange(period), [period]);

  // 이번달 KPI용 from/to
  const thisMonthFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const thisMonthTo = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  // 정산 내역 = 실제 정산완료된 건만 조회 (입금대기·환불·취소·제외 건은 달력에서 확인)
  const statusFilter = 'settled';

  // 초기 로드: 월별 요약 + 일별 차트 + 역할별 누적 (allSettled — 한쪽 실패해도 나머지 표시)
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      settlementService.getMonthlySummary({ year }),
      settlementService.getDailySummary({ from: thisMonthFrom, to: thisMonthTo }),
      settlementService.getByRoleSummary(),
    ]).then(([monthlyR, dailyR, byRoleR]) => {
      if (cancelled) return;
      if (monthlyR.status === 'fulfilled') setMonthly(monthlyR.value);
      if (dailyR.status === 'fulfilled') setDailySeries(dailyR.value?.items || []);
      if (byRoleR.status === 'fulfilled' && byRoleR.value) {
        setByRole({
          clientOwner: {
            expectedAmount: byRoleR.value?.clientOwner?.expectedAmount ?? 0,
            settledAmount: byRoleR.value?.clientOwner?.settledAmount ?? 0,
          },
          matchmaker: {
            expectedAmount: byRoleR.value?.matchmaker?.expectedAmount ?? 0,
            settledAmount: byRoleR.value?.matchmaker?.settledAmount ?? 0,
          },
        });
      }
    });
    return () => { cancelled = true; };
  }, [year, thisMonthFrom, thisMonthTo]);

  // 기간/필터 변경 시 목록 재조회
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {
      from: periodRange.from,
      to: periodRange.to,
      page,
      size: 20,
      status: statusFilter,
    };

    settlementService.listSettlements(params)
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
  }, [periodRange, statusFilter, page]);

  // 기간/필터 변경 시 페이지 리셋
  useEffect(() => { setPage(0); }, [period, roleFilter]);

  // 이번달 요약 계산 — 매칭 종료일 기준 ready_to_settle 합계
  const thisMonthSummary = useMemo(() => {
    const items = monthly?.items || [];
    const item = items.find((i) => i.month === month);
    return item || { month, count: 0, amount: 0 };
  }, [monthly, month]);

  // 역할 + 선택 일자 필터 적용 (서버가 settled만 반환하지만 안전망)
  const filteredSettlements = useMemo(() => {
    let list = settlements.filter(isCountedForTotal);
    if (roleFilter === 'match') list = list.filter(s => s.role === 'matchmaker');
    else if (roleFilter === 'member') list = list.filter(s => s.role === 'client_owner');
    if (selectedDay != null) {
      const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
      list = list.filter((s) => {
        const k = getEndDateKey(s.matchEndedAt) || getEndDateKey(s.createdAt);
        return k === dayKey;
      });
    }
    return list;
  }, [settlements, roleFilter, selectedDay, year, month]);

  // 일자별 그룹
  const grouped = useMemo(() => {
    const g = {};
    filteredSettlements.forEach((s) => {
      const key = getEndDateKey(s.matchEndedAt) || getEndDateKey(s.createdAt);
      if (!key) return;
      if (!g[key]) g[key] = [];
      g[key].push(s);
    });
    return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredSettlements]);

  // 달력용 일별 데이터 (1~말일 빈 날짜 채우기)
  const dailyChartData = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = now.getDate();
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
      return {
        d,
        amount: item.amount || 0,
        count: item.count || 0,
        isFuture: d > today,
        isToday: d === today,
      };
    });
  }, [dailySeries, year, month]);

  const handlePeriodChange = useCallback((p) => {
    setPeriod(p);
    setRoleFilter('all');
    setSelectedDay(null);
  }, []);

  return (
    <div className={styles.page}>
      {/* === 상단 헤더 === */}
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>정산</span>
        <button
          className={styles.helpBtn}
          onClick={() => setShowSheet('policy')}
          aria-label="정산 정책 안내"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className={styles.content}>
        {/* === Hero 카드 === */}
        <HeroCard
          monthLabel={getCurrentMonthLabel()}
          accrued={thisMonthSummary.amount || 0}
          count={thisMonthSummary.count || 0}
          byRole={byRole}
          onPolicy={() => setShowSheet('policy')}
        />

        {/* === 매칭 종료 달력 === */}
        <CalendarCard
          data={dailyChartData}
          monthLabel={`${month}월`}
          year={year}
          month={month}
          selectedDay={period === 'this' ? selectedDay : null}
          onSelectDay={(d) => {
            if (period !== 'this') setPeriod('this');
            setSelectedDay(d);
          }}
        />

        {/* === 정산 내역 === */}
        <div className={styles.listSection}>
          <div className={styles.listSectionHeader}>
            <div>
              <div className={styles.listSectionTitle}>정산 내역</div>
              <div className={styles.listSectionMeta}>
                {filteredSettlements.length}건 · {won(sumSettledAmount(filteredSettlements))}원
              </div>
            </div>
            {selectedDay != null && (
              <button
                className={styles.selectedDayChip}
                onClick={() => setSelectedDay(null)}
              >
                {month}월 {selectedDay}일
                <X size={12} />
              </button>
            )}
          </div>

          {/* 기간 세그먼트 */}
          <div className={styles.segmentControl}>
            {[
              { k: 'this', l: '이번 달' },
              { k: 'last', l: '지난 달' },
              { k: '3m', l: '3개월' },
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

          {/* 필터 칩 */}
          <div className={styles.filterChipRow}>
            {[
              { k: 'all', l: '전체' },
              { k: 'match', l: '매칭 매니저' },
              { k: 'member', l: '회원 매니저' },
            ].map((o) => (
              <button
                key={o.k}
                className={`${styles.filterChip} ${roleFilter === o.k ? styles.filterChipActive : ''}`}
                onClick={() => setRoleFilter(o.k)}
              >
                {o.l}
              </button>
            ))}
          </div>

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
                const sum = sumSettledAmount(items);
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
                        <TxRow
                          key={s.id}
                          s={s}
                          onClick={() => setShowSheet(s)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {!loading && !error && pagination.totalPages > 1 && (
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
        <RefundPolicyCard onClick={() => setShowSheet('refund')} />
      </div>

      {/* === 시트 === */}
      {showSheet === 'policy' && (
        <PolicySheet onClose={() => setShowSheet(null)} />
      )}
      {showSheet === 'refund' && (
        <RefundSheet onClose={() => setShowSheet(null)} />
      )}
      {showSheet && typeof showSheet === 'object' && (
        <ReceiptSheet s={showSheet} onClose={() => setShowSheet(null)} />
      )}
    </div>
  );
}

/* === Hero 카드 === */
function HeroCard({ monthLabel, accrued, count, byRole, onPolicy }) {
  const co = byRole?.clientOwner || { expectedAmount: 0, settledAmount: 0 };
  const mm = byRole?.matchmaker || { expectedAmount: 0, settledAmount: 0 };
  const totalExpected = (co.expectedAmount || 0) + (mm.expectedAmount || 0);

  return (
    <div className={styles.heroCard}>
      <div className={styles.heroGlow} />

      <div className={styles.heroTopRow}>
        <div className={styles.heroMonthLabel}>{monthLabel} 정산</div>
        <button className={styles.heroPolicyBtn} onClick={onPolicy}>
          정책 <ArrowRight size={10} />
        </button>
      </div>

      <div className={styles.heroAmountBlock}>
        <div className={styles.heroAmount}>
          {won(accrued)}
          <span className={styles.heroAmountUnit}>원</span>
        </div>
        <div className={styles.heroAmountMeta}>
          <span>{count}건</span>
        </div>
      </div>

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

      <div className={styles.heroCumulativeRow}>
        <span className={styles.heroCumulativeLabel}>받을 정산 잔고</span>
        <span className={styles.heroCumulativeValue}>{won(totalExpected)}원</span>
      </div>
    </div>
  );
}

/* === 매칭 종료 달력 카드 === */
function CalendarCard({ data, monthLabel, year, month, selectedDay, onSelectDay }) {
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=일
  const totalDays = data.length;
  const totalCells = Math.ceil((firstDow + totalDays) / 7) * 7;
  const totalCount = data.reduce((a, d) => a + (d.count || 0), 0);

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const idx = i - firstDow;
    return idx >= 0 && idx < totalDays ? data[idx] : null;
  });

  return (
    <div className={styles.calendarCard}>
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
function TxRow({ s, onClick }) {
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
      className={styles.txRow}
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
          <div className={styles.policyTotalCaption}>매칭 1건 예시 (결제 39,800원 기준)</div>
          <div className={styles.policyTotalAmount}>39,800<span className={styles.policyTotalUnit}>원</span></div>
          <div className={styles.policyRuleList}>
            <div className={styles.policyRuleRow}>
              <div className={styles.policyRuleLeft}>
                <span className={styles.policyRuleDot} style={{ background: 'var(--tangerine-600)' }} />
                <span className={styles.policyRuleName}>매칭 매니저</span>
                <span className={styles.policyRoleDesc}>매칭 만든 사람 · 약 25%</span>
              </div>
              <div className={styles.policyRuleValue}>약 10,000원</div>
            </div>
            <div className={styles.policyRuleRow}>
              <div className={styles.policyRuleLeft}>
                <span className={styles.policyRuleDot} style={{ background: '#3B7EE0' }} />
                <span className={styles.policyRuleName}>회원 매니저</span>
                <span className={styles.policyRoleDesc}>각 회원 등록자 · 약 12.5%</span>
              </div>
              <div className={styles.policyRuleValue}>약 5,000원 × 2</div>
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
function ReceiptSheet({ s, onClose }) {
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
            color: 'var(--ink-600)',
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          이 결제는 정산 대상에서 제외되어 매니저 정산 금액에 포함되지 않습니다.
        </div>
      )}

      <button className={styles.sheetCancelBtn} onClick={onClose}>닫기</button>
    </SheetWrap>
  );
}
