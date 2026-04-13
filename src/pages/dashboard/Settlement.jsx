import { useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Users, Send } from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import styles from './Settlement.module.css';

const SETTLEMENT_MATCH_CREATOR = 10000; // 매칭을 만든 매니저 수당
const SETTLEMENT_CLIENT_OWNER = 5000;   // 회원을 등록한 매니저 수당

const SETTLEMENT_STATUSES = ['scheduling', 'payment_confirmed', 'arranging', 'scheduled', 'completed'];
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatCurrency(amount) {
  return new Intl.NumberFormat('ko-KR').format(amount);
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
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
      const raw = result?.data ?? [];
      setAllMatches(raw);
    } catch {
      setAllMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 정산 대상 매칭 (scheduling 이상, cancelled 제외)
  const settlementMatches = useMemo(
    () => allMatches.filter((m) => SETTLEMENT_STATUSES.includes(m.status)),
    [allMatches],
  );

  // 이번 달 매칭
  const monthMatches = useMemo(() => {
    return settlementMatches.filter((m) => {
      const dateStr = m.meetingDate || m.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [settlementMatches, year, month]);

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
    return map;
  }, [monthMatches]);

  // 매니저별 정산 (매칭매니저 10,000원 + 회원매니저 5,000원)
  const managerStats = useMemo(() => {
    const map = {};
    const getOrCreate = (name) => {
      if (!map[name]) map[name] = { matchCreatorCount: 0, clientOwnerCount: 0 };
      return map[name];
    };

    monthMatches.forEach((m) => {
      // 매칭매니저 (매칭을 만든 매니저): 10,000원
      const creatorName = m.createdByManagerName || '알 수 없음';
      getOrCreate(creatorName).matchCreatorCount += 1;

      // 회원매니저 A (clientA를 등록한 매니저): 5,000원
      const managerA = m.clientA?.managerName;
      if (managerA) getOrCreate(managerA).clientOwnerCount += 1;

      // 회원매니저 B (clientB를 등록한 매니저): 5,000원
      const managerB = m.clientB?.managerName;
      if (managerB) getOrCreate(managerB).clientOwnerCount += 1;
    });

    return Object.entries(map)
      .map(([name, s]) => ({
        name,
        matchCreatorCount: s.matchCreatorCount,
        clientOwnerCount: s.clientOwnerCount,
        matchCreatorAmount: s.matchCreatorCount * SETTLEMENT_MATCH_CREATOR,
        clientOwnerAmount: s.clientOwnerCount * SETTLEMENT_CLIENT_OWNER,
        total: s.matchCreatorCount * SETTLEMENT_MATCH_CREATOR + s.clientOwnerCount * SETTLEMENT_CLIENT_OWNER,
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthMatches]);

  // 요약 통계
  const summary = useMemo(() => {
    const totalMatches = monthMatches.length;
    const completed = monthMatches.filter((m) => m.status === 'completed').length;
    const totalSettlement = managerStats.reduce((s, m) => s + m.total, 0);
    const totalMatchCreator = managerStats.reduce((s, m) => s + m.matchCreatorAmount, 0);
    const totalClientOwner = managerStats.reduce((s, m) => s + m.clientOwnerAmount, 0);
    return { totalMatches, completed, totalSettlement, totalMatchCreator, totalClientOwner };
  }, [monthMatches, managerStats]);

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

  const handleSendReport = (managerName) => {
    toast.success(`${year}년 ${month + 1}월 ${managerName} 매니저 리포트 발송 완료`);
  };

  const handleSendAllReports = () => {
    if (managerStats.length === 0) {
      toast.error('발송할 리포트가 없습니다.');
      return;
    }
    toast.success(`${year}년 ${month + 1}월 전체 매니저 리포트 ${managerStats.length}건 발송 완료`);
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
          매니저별 정산
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
            {summary.totalMatches}<span className={styles.summaryUnit}>건</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>총 정산액</div>
          <div className={styles.summaryValue}>
            {formatCurrency(summary.totalSettlement)}<span className={styles.summaryUnit}>원</span>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>매칭 수당</div>
          <div className={styles.summaryValueSuccess}>
            {formatCurrency(summary.totalMatchCreator)}<span className={styles.summaryUnit}>원</span>
          </div>
          <div className={styles.summarySubLabel}>
            @{formatCurrency(SETTLEMENT_MATCH_CREATOR)}원 × {summary.totalMatches}건
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>회원 수당</div>
          <div className={styles.summaryValueSuccess}>
            {formatCurrency(summary.totalClientOwner)}<span className={styles.summaryUnit}>원</span>
          </div>
          <div className={styles.summarySubLabel}>
            @{formatCurrency(SETTLEMENT_CLIENT_OWNER)}원/명
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
              const dayOfWeek = new Date(year, month, day).getDay();
              const matches = dayMatchMap[day] || [];
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
                  {matches.length > 0 && (
                    <div className={styles.badgeMatch}>{matches.length}건</div>
                  )}
                  {matches.length > 0 && (
                    <div className={styles.badgeRevenue}>
                      {formatCurrency(matches.reduce((sum, m) => {
                        let amt = SETTLEMENT_MATCH_CREATOR;
                        if (m.clientA?.managerName) amt += SETTLEMENT_CLIENT_OWNER;
                        if (m.clientB?.managerName) amt += SETTLEMENT_CLIENT_OWNER;
                        return sum + amt;
                      }, 0))}
                    </div>
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
              <h3>매니저별 정산</h3>
            </div>
            <button className={styles.reportAllBtn} onClick={handleSendAllReports}>
              <Send size={14} />
              전체 리포트 발송
            </button>
          </div>
          {managerStats.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><Users size={32} /></div>
              이번 달 매칭 데이터가 없습니다.
            </div>
          ) : (
            <>
              {managerStats.map((mgr) => (
                <div key={mgr.name} className={styles.managerCard}>
                  <div className={styles.managerCardHeader}>
                    <span className={styles.managerCardName}>{mgr.name}</span>
                    <button
                      className={styles.reportBtn}
                      onClick={() => handleSendReport(mgr.name)}
                    >
                      <Send size={12} />
                      리포트
                    </button>
                  </div>
                  <div className={styles.managerCardBody}>
                    <div className={styles.managerStatRow}>
                      <span className={styles.managerStatLabel}>매칭 수당</span>
                      <span className={styles.managerStatDetail}>
                        {mgr.matchCreatorCount}건 × {formatCurrency(SETTLEMENT_MATCH_CREATOR)}원
                      </span>
                      <span className={styles.managerStatAmount}>
                        {formatCurrency(mgr.matchCreatorAmount)}원
                      </span>
                    </div>
                    <div className={styles.managerStatRow}>
                      <span className={styles.managerStatLabel}>회원 수당</span>
                      <span className={styles.managerStatDetail}>
                        {mgr.clientOwnerCount}명 × {formatCurrency(SETTLEMENT_CLIENT_OWNER)}원
                      </span>
                      <span className={styles.managerStatAmount}>
                        {formatCurrency(mgr.clientOwnerAmount)}원
                      </span>
                    </div>
                    <div className={`${styles.managerStatRow} ${styles.managerStatRowTotal}`}>
                      <span className={styles.managerStatLabel}>합계</span>
                      <span />
                      <span className={styles.managerStatTotal}>
                        {formatCurrency(mgr.total)}원
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className={styles.grandTotal}>
                <span>전체 합계</span>
                <span className={styles.grandTotalAmount}>
                  {formatCurrency(managerStats.reduce((s, m) => s + m.total, 0))}원
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
