import { useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Users, XCircle, DollarSign, AlertTriangle } from 'lucide-react';
import * as matchService from '../../api/matchService';
import styles from './Settlement.module.css';

const PRICE_PER_PERSON = 19900;
const PRICE_PER_MATCH = PRICE_PER_PERSON * 2;

const SETTLEMENT_STATUSES = ['scheduling', 'arranging', 'scheduled', 'completed'];
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function getRefundStatus(meetingDate) {
  if (!meetingDate) return null;
  const hours = (new Date(meetingDate) - new Date()) / (1000 * 60 * 60);
  if (hours >= 168) return { label: '전액 환불', type: 'safe' };
  if (hours >= 72) return { label: '80% 환불', type: 'safe' };
  if (hours >= 24) return { label: '환불 불가 · 변경 가능', type: 'warn' };
  if (hours > 0) return { label: '환불 불가', type: 'danger' };
  return { label: '미팅 경과', type: 'danger' };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

function formatDateShort(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }
  return days;
}

export default function Settlement() {
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState('calendar');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await matchService.listMatches({ page: 0, size: 9999 });
      const raw = result.data || result.matches || [];
      setAllMatches(raw);
    } catch {
      setAllMatches([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 정산 대상 매칭 (scheduling 이상)
  const settlementMatches = useMemo(
    () => allMatches.filter((m) => SETTLEMENT_STATUSES.includes(m.status)),
    [allMatches],
  );

  // 취소 매칭
  const cancelledMatches = useMemo(
    () => allMatches.filter((m) => m.status === 'cancelled'),
    [allMatches],
  );

  // 이번 달 매칭 (meetingDate 또는 createdAt 기준)
  const monthMatches = useMemo(() => {
    return settlementMatches.filter((m) => {
      const dateStr = m.meetingDate || m.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [settlementMatches, year, month]);

  // 이번 달 취소 매칭
  const monthCancelled = useMemo(() => {
    return cancelledMatches.filter((m) => {
      const dateStr = m.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [cancelledMatches, year, month]);

  // 날짜별 매칭 맵
  const dayMatchMap = useMemo(() => {
    const map = {};
    monthMatches.forEach((m) => {
      const dateStr = m.meetingDate || m.createdAt;
      if (!dateStr) return;
      const day = new Date(dateStr).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(m);
    });
    monthCancelled.forEach((m) => {
      const dateStr = m.createdAt;
      if (!dateStr) return;
      const day = new Date(dateStr).getDate();
      if (!map[day]) map[day] = [];
      map[day].push(m);
    });
    return map;
  }, [monthMatches, monthCancelled]);

  // 매니저별 실적
  const managerStats = useMemo(() => {
    const map = {};
    monthMatches.forEach((m) => {
      const name = m.createdByManagerName || '알 수 없음';
      if (!map[name]) map[name] = { count: 0, completed: 0 };
      map[name].count += 1;
      if (m.status === 'completed') map[name].completed += 1;
    });
    return Object.entries(map)
      .map(([name, stats]) => ({ name, ...stats, revenue: stats.count * PRICE_PER_MATCH }))
      .sort((a, b) => b.count - a.count);
  }, [monthMatches]);

  // 요약 통계
  const summary = useMemo(() => {
    const total = monthMatches.length;
    const completed = monthMatches.filter((m) => m.status === 'completed').length;
    const cancelled = monthCancelled.length;
    const revenue = total * PRICE_PER_MATCH;
    return { total, completed, cancelled, revenue };
  }, [monthMatches, monthCancelled]);

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month]);

  const today = new Date();
  const isToday = (day) =>
    day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const goMonth = (delta) => {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          데이터 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>정산</h1>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'calendar' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          달력
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'manager' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('manager')}
        >
          매니저별
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'refund' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('refund')}
        >
          취소/환불
        </button>
      </div>

      {/* Month Navigator */}
      <div className={styles.monthNav}>
        <button className={styles.monthBtn} onClick={() => goMonth(-1)}>
          <ChevronLeft size={18} />
        </button>
        <span className={styles.monthLabel}>{year}년 {month + 1}월</span>
        <button className={styles.monthBtn} onClick={() => goMonth(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>총 매칭</div>
          <div className={styles.summaryValueNavy}>
            {summary.total}<span className={styles.summaryUnit}>건</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>예상 매출</div>
          <div className={styles.summaryValue}>
            {formatCurrency(summary.revenue)}<span className={styles.summaryUnit}>원</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>완료</div>
          <div className={styles.summaryValueSuccess}>
            {summary.completed}<span className={styles.summaryUnit}>건</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>취소</div>
          <div className={styles.summaryValueDanger}>
            {summary.cancelled}<span className={styles.summaryUnit}>건</span>
          </div>
        </div>
      </div>

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Calendar size={18} />
              <h3>정산 달력</h3>
            </div>
          </div>
          <div className={styles.calendarGrid}>
            {DAY_NAMES.map((d) => (
              <div key={d} className={styles.calendarDayHeader}>{d}</div>
            ))}
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className={styles.calendarCellEmpty} />;
              }
              const dayOfWeek = (new Date(year, month, day)).getDay();
              const matches = dayMatchMap[day] || [];
              const activeMatches = matches.filter((m) => m.status !== 'cancelled');
              const cancelledCount = matches.filter((m) => m.status === 'cancelled').length;
              const dateClass = dayOfWeek === 0
                ? styles.calendarDateSun
                : dayOfWeek === 6
                  ? styles.calendarDateSat
                  : styles.calendarDate;

              return (
                <div
                  key={day}
                  className={`${styles.calendarCell} ${isToday(day) ? styles.calendarCellToday : ''}`}
                >
                  <div className={dateClass}>{day}</div>
                  {activeMatches.length > 0 && (
                    <div className={styles.badgeMatch}>{activeMatches.length}건</div>
                  )}
                  {activeMatches.length > 0 && (
                    <div className={styles.badgeRevenue}>{formatCurrency(activeMatches.length * PRICE_PER_MATCH)}</div>
                  )}
                  {cancelledCount > 0 && (
                    <div className={styles.badgeCancelled}>취소 {cancelledCount}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manager Tab */}
      {activeTab === 'manager' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <Users size={18} />
              <h3>매니저별 실적</h3>
            </div>
          </div>
          {managerStats.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Users size={32} /></div>
              이번 달 매칭 데이터가 없습니다.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>매니저</th>
                  <th>매칭 수</th>
                  <th>완료</th>
                  <th>매출</th>
                </tr>
              </thead>
              <tbody>
                {managerStats.map((mgr) => (
                  <tr key={mgr.name}>
                    <td className={styles.managerName}>{mgr.name}</td>
                    <td className={styles.managerCount}>{mgr.count}건</td>
                    <td>{mgr.completed}건</td>
                    <td className={styles.managerRevenue}>{formatCurrency(mgr.revenue)}원</td>
                  </tr>
                ))}
                <tr>
                  <td className={styles.managerName}>합계</td>
                  <td className={styles.managerCount}>
                    {managerStats.reduce((s, m) => s + m.count, 0)}건
                  </td>
                  <td>
                    {managerStats.reduce((s, m) => s + m.completed, 0)}건
                  </td>
                  <td className={styles.managerRevenue}>
                    {formatCurrency(managerStats.reduce((s, m) => s + m.revenue, 0))}원
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Refund Tab */}
      {activeTab === 'refund' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <AlertTriangle size={18} />
              <h3>취소/환불 내역</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--charcoal-pale)' }}>
              {monthCancelled.length}건
            </span>
          </div>
          {monthCancelled.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><XCircle size={32} /></div>
              이번 달 취소/환불 내역이 없습니다.
            </div>
          ) : (
            monthCancelled.map((m) => {
              const clientAName = m.clientA?.clientName || m.clientA?.clientNickname || '?';
              const clientBName = m.clientB?.clientName || m.clientB?.clientNickname || '?';
              const refund = getRefundStatus(m.meetingDate);
              return (
                <div key={m.matchId} className={styles.refundItem}>
                  <div className={styles.refundInfo}>
                    <div className={styles.refundNames}>
                      {clientAName} & {clientBName}
                    </div>
                    <div className={styles.refundMeta}>
                      {m.createdByManagerName} · {formatDateShort(m.createdAt)}
                    </div>
                  </div>
                  {refund && (
                    <span className={
                      refund.type === 'safe' ? styles.refundSafe
                        : refund.type === 'warn' ? styles.refundWarn
                          : styles.refundDanger
                    }>
                      {refund.label}
                    </span>
                  )}
                  <div className={styles.refundAmount}>
                    -{formatCurrency(PRICE_PER_MATCH)}원
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
