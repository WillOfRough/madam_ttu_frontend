import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Link2, AlertTriangle, Wallet, Calendar,
  CheckCircle, ChevronRight, Bell, Heart, Send, Sparkles, User as UserIcon,
} from 'lucide-react';
import useManagerStore from '../../store/managerStore';
import useAuthStore from '../../store/authStore';
import useConnectionStore from '../../store/connectionStore';
import useNotificationStore from '../../store/notificationStore';
import { isImportantNotification } from '../../api/notificationTypes';
import useClientListStore from '../../store/clientListStore';
import * as matchService from '../../api/matchService';
import * as settlementService from '../../api/settlementService';
import { SkeletonCard } from '../../components/Skeleton';
import styles from './DashboardHome.module.css';

/* ── Date util ── */
function getTodayKicker() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dow = dayNames[now.getDay()];
  return `${month}월 ${day}일 ${dow}요일`;
}

/* ── Stage config ── */
const STAGE_CONFIG = {
  draft:             { label: '대기',    tone: 'ink',       action: '프로포절 발송 필요' },
  proposal_sent:     { label: '제안발송', tone: 'lilac',     action: 'A 프로필 확인 대기' },
  proposal_accepted: { label: '상대수락', tone: 'lilac',     action: 'B 프로필 확인 대기' },
  awaiting_payment:  { label: '입금대기', tone: 'amber',     action: '입금 확인 필요' },
  scheduling:        { label: '일정조율', tone: 'tangerine', action: '일정 조율 중' },
  arranging:         { label: '조율확정', tone: 'tangerine', action: '일정 확정 필요' },
  scheduled:         { label: '약속확정', tone: 'mint',      action: '미팅 완료 처리 필요' },
  completed:         { label: '완료',    tone: 'mint',      action: '미팅 완료' },
  cancelled:         { label: '취소',    tone: 'rose',      action: '매칭 종료' },
};

const TODO_STATUSES = new Set([
  'draft', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled', 'completed',
]);

/* 매칭의 확정 만남 일시를 Date 로 반환 (없으면 null).
   - 실제 백엔드: confirmedSchedule.{date,startTime} (top-level 날짜 필드는 null)
   - mock/구필드 호환: meetingDate | confirmedAt | scheduledAt */
function getMeetingAt(match) {
  const cs = match.confirmedSchedule;
  if (cs?.date) {
    const dt = new Date(`${cs.date}T${cs.startTime || '00:00:00'}`);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const raw = match.meetingDate || match.confirmedAt || match.scheduledAt;
  if (!raw) return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const TONE_STYLES = {
  ink:       { actionBg: 'var(--ink-50)',        fg: 'var(--ink-700)',        dot: 'var(--ink-500)'        },
  lilac:     { actionBg: 'var(--lilac-100)',     fg: '#4F3DA0',               dot: 'var(--lilac-600)'      },
  amber:     { actionBg: 'var(--amber-100)',     fg: '#9A5E0E',               dot: 'var(--amber-600)'      },
  tangerine: { actionBg: 'var(--tangerine-100)', fg: 'var(--tangerine-700)',  dot: 'var(--tangerine-600)'  },
  mint:      { actionBg: 'var(--mint-100)',      fg: '#1A7A50',               dot: 'var(--mint-600)'       },
  rose:      { actionBg: 'var(--rose-100)',      fg: '#B13149',               dot: 'var(--rose-600)'       },
};

/* ── KPI tone map ── */
const KPI_TONE = {
  ink:       { iconBg: 'var(--ink-50)',         iconFg: 'var(--ink-700)'        },
  amber:     { iconBg: 'var(--amber-100)',       iconFg: 'var(--amber-600)'      },
  mint:      { iconBg: 'var(--mint-100)',        iconFg: 'var(--mint-600)'       },
  tangerine: { iconBg: 'var(--tangerine-100)',   iconFg: 'var(--tangerine-700)'  },
};

/* ── Mini Avatar ── */
function MiniAvatar({ name, gender, size = 30 }) {
  const isMale = gender === 'male' || gender === 'M';
  const bg = isMale ? 'var(--male-100)' : 'var(--female-100)';
  const fg = isMale ? 'var(--male)'     : 'var(--female)';
  const initial = name ? name.charAt(name.length > 1 ? 1 : 0) : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
      letterSpacing: '-0.01em',
    }}>
      {initial}
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ label, value, unit, sub, icon: Icon, tone = 'ink', pulse, onClick }) {
  const t = KPI_TONE[tone] || KPI_TONE.ink;
  return (
    <button
      className={styles.kpiCard}
      onClick={onClick}
      type="button"
      aria-label={`${label}: ${value}`}
      style={{ position: 'relative' }}
    >
      {pulse && (
        <span className={styles.kpiPulseDot} />
      )}
      <div
        className={styles.kpiIconBox}
        style={{ background: t.iconBg, color: t.iconFg }}
      >
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValueRow}>
        <span className={styles.kpiValue}>{value}</span>
        {unit && <span className={styles.kpiUnit}>{unit}</span>}
      </div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </button>
  );
}

/* ── Section Header ── */
function SectionHeader({ title, sub, action, onAction }) {
  return (
    <div className={styles.sectionHeaderStandalone}>
      <div>
        <div className={styles.sectionTitleSerif}>{title}</div>
        {sub && <div className={styles.sectionSubSerif}>{sub}</div>}
      </div>
      {action && (
        <button className={styles.sectionAction} onClick={onAction} type="button">
          {action}
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/* ── Todo Row 역할 배지 스타일 ──
   매칭 매니저(내가 만든 매칭) = 강조(tangerine), 회원 매니저(내 회원만 낀 매칭) = 차분(muted). */
const ROLE_BADGE_BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 10.5,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 'var(--r-xs)',
  letterSpacing: '-0.01em',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};
const ROLE_BADGE_STYLE = {
  match:  { ...ROLE_BADGE_BASE, background: 'var(--tangerine-100)', color: 'var(--tangerine-700)' },
  member: { ...ROLE_BADGE_BASE, background: 'var(--ink-100)',       color: 'var(--ink-500)'       },
};

/* ── Todo Row ── */
function TodoRow({ match, onClick, myManagerId }) {
  const status = match.status;
  const cfg  = STAGE_CONFIG[status] || STAGE_CONFIG.draft;
  const tone = cfg.tone;
  const t    = TONE_STYLES[tone] || TONE_STYLES.ink;
  const nameA   = match.clientA?.clientName   || 'A';
  const nameB   = match.clientB?.clientName   || 'B';
  const genderA = match.clientA?.clientGender || 'male';
  const genderB = match.clientB?.clientGender || 'female';

  /* 매칭 매니저(내가 만든 매칭) 여부. 아니면 내 회원이 상대편으로 들어간 매칭(=회원 매니저)
     이라 실제 처리 주체는 다른 매니저다. 헷갈리지 않도록 역할을 배지로 표시한다. */
  const isMyMatch = myManagerId != null && match.createdByManagerId === myManagerId;

  return (
    <button className={styles.todoRow} onClick={onClick} type="button">
      <div className={styles.todoAvatars}>
        <MiniAvatar name={nameA} gender={genderA} size={30} />
        <div style={{ marginLeft: -10 }}>
          <MiniAvatar name={nameB} gender={genderB} size={30} />
        </div>
      </div>
      <div className={styles.todoContent}>
        <div className={styles.todoNames}>
          {nameA}
          <span className={styles.todoHeart}>♥</span>
          {nameB}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className={styles.todoActionBadge} style={{ background: t.actionBg, color: t.fg }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.dot, display: 'inline-block', flexShrink: 0 }} />
            {cfg.action}
          </span>
          <span
            style={isMyMatch ? ROLE_BADGE_STYLE.match : ROLE_BADGE_STYLE.member}
            title={!isMyMatch && match.createdByManagerName ? `매칭 매니저: ${match.createdByManagerName}` : undefined}
          >
            {isMyMatch ? '매칭 매니저' : '회원 매니저'}
          </span>
        </div>
      </div>
      <ChevronRight size={16} color="var(--ink-300)" strokeWidth={1.8} />
    </button>
  );
}

/* ── Today Card ── */
function TodayCard({ match, onClick }) {
  const nameA = match.clientA?.clientName || 'A';
  const nameB = match.clientB?.clientName || 'B';
  const location = match.confirmedSchedule?.location || match.location || '장소 미정';
  const meetingAt = getMeetingAt(match);

  let dateLabel = '';
  let daysLabel = '';
  if (meetingAt) {
    const d = meetingAt;
    const now = new Date();
    const month = d.getMonth() + 1;
    const day   = d.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dow = dayNames[d.getDay()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    dateLabel = `${month}월 ${day}일 (${dow}) ${hours}:${minutes}`;
    // D-day 는 시각이 아닌 '날짜' 경계 기준으로 센다 (오늘=D-Day, 내일=D-1).
    const meetingDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((meetingDay - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) daysLabel = 'D-Day';
    else if (diffDays > 0) daysLabel = `D-${diffDays}`;
    else daysLabel = `D+${Math.abs(diffDays)}`;
  }

  return (
    <div
      className={styles.todayCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.todayIconBox}>
        <Calendar size={20} strokeWidth={1.8} />
      </div>
      <div className={styles.todayContent}>
        <div className={styles.todayPair}>
          {nameA} ↔ {nameB} · <span style={{ color: 'var(--mint-600)' }}>약속 확정</span>
        </div>
        <div className={styles.todayMeta}>
          {dateLabel}{location !== '장소 미정' ? ` · ${location}` : ''}
        </div>
      </div>
      {daysLabel && (
        <span className={styles.todayBadge}>{daysLabel}</span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   DashboardHome
══════════════════════════════════════ */
/* ── Notification icon mapping ── */
function NotifIcon({ type }) {
  if (!type) return <Bell size={14} />;
  if (type.includes('match')) return <Heart size={14} />;
  if (type.includes('proposal')) return <Send size={14} />;
  if (type.includes('after')) return <Sparkles size={14} />;
  if (type.includes('client')) return <UserIcon size={14} />;
  return <Link2 size={14} />;
}

/* ── Notification column (3rd column in dashboard grid) ── */
function NotificationsColumn() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAllRead = useNotificationStore((s) => s.markAllAsRead);
  const navigate = useNavigate();

  useEffect(() => {
    if (notifications.length === 0) fetchNotifications();
  }, []);

  // 알림탭과 동일하게 routine 알림은 숨기고 중요 알림만 노출
  const recent = useMemo(
    () => (notifications || []).filter((n) => isImportantNotification(n.type)).slice(0, 12),
    [notifications]
  );

  return (
    <div className={styles.dashCol}>
      <SectionHeader
        title="알림"
        sub={unreadCount > 0 ? `${unreadCount}건의 새 알림` : '모두 확인했어요'}
        action={unreadCount > 0 ? '모두 읽음' : '전체보기'}
        onAction={unreadCount > 0 ? markAllRead : () => navigate('/dashboard/notifications')}
      />
      <div className={styles.dashCard}>
        <div className={styles.dashCardBody}>
          {recent.length === 0 ? (
            <div className={styles.dashEmpty}>
              <div className={styles.dashEmptyIcon}>
                <Bell size={22} strokeWidth={1.6} />
              </div>
              <div className={styles.dashEmptyTitle}>새 알림이 없어요</div>
              <div className={styles.dashEmptyDesc}>
                새로운 활동이 생기면 알려드릴게요
              </div>
            </div>
          ) : (
            <ul className={styles.notifList}>
              {recent.map((n) => (
                <li key={n.id || n.notificationId}>
                  <button
                    className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
                    onClick={() => navigate('/dashboard/notifications')}
                    type="button"
                  >
                    <div className={styles.notifItemIcon}>
                      <NotifIcon type={n.type} />
                    </div>
                    <div className={styles.notifItemContent}>
                      <div className={styles.notifItemTitleRow}>
                        <span className={styles.notifItemTitle}>{n.title}</span>
                        {!n.read && <span className={styles.notifItemDot} />}
                      </div>
                      {n.message && <div className={styles.notifItemMsg}>{n.message}</div>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const summary      = useManagerStore((s) => s.summary);
  const isLoading    = useManagerStore((s) => s.isLoading);
  const fetchSummary = useManagerStore((s) => s.fetchSummary);
  const myName       = useAuthStore((s) => s.name);
  const myManagerId  = useAuthStore((s) => s.managerId);
  const connections  = useConnectionStore((s) => s.connections);
  const navigate     = useNavigate();

  const [todoMatches,    setTodoMatches]    = useState(null);
  const [scheduledMatches, setScheduledMatches] = useState(null);
  const [settlementData, setSettlementData] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  /* Todo list — 내가 관여한(직접 생성 OR 내 회원이 포함된) 매칭 중 처리 대기 항목.
     managerId 로 좁히면 '내가 만든 것'만 남아 내 회원이 받는 쪽으로 들어간 매칭을
     놓치므로, 관여 여부(accessible)를 기준으로 거른다. (MatchList 기본 동작과 동일) */
  useEffect(() => {
    matchService.listMatches({ size: 50 })
      .then((res) => {
        const all = res.data || res.matches || [];
        const todos = all
          .filter((m) => m.accessible !== false)
          .filter((m) => TODO_STATUSES.has(m.status));
        setTodoMatches(todos.slice(0, 5));
      })
      .catch(() => setTodoMatches([]));
  }, []);

  /* 다가오는 일정 — 내가 관여한 + 일정 확정(scheduled) 매칭을 만남일 임박순으로.
     오늘 이전(지난) 일정은 제외하고, 가장 가까운 순으로 3건만 노출. */
  useEffect(() => {
    matchService.listMatches({ status: 'scheduled', size: 50 })
      .then((res) => {
        const all = res.data || res.matches || [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const upcoming = all
          .filter((m) => m.accessible !== false)
          .map((m) => ({ m, at: getMeetingAt(m) }))
          .filter(({ at }) => at && at >= startOfToday)
          .sort((a, b) => a.at - b.at)
          .map(({ m }) => m);
        setScheduledMatches(upcoming.slice(0, 3));
      })
      .catch(() => setScheduledMatches([]));
  }, []);

  /* Monthly settlement */
  useEffect(() => {
    const now = new Date();
    settlementService.getMonthlySummary({ year: now.getFullYear(), month: now.getMonth() + 1 })
      .then((res) => {
        const item = (res?.items || []).find((m) => m.month === (now.getMonth() + 1));
        setSettlementData({
          amount: item?.amount ?? 0,
          count: item?.count ?? 0,
          expectedTotal: res?.expectedTotal ?? 0,
        });
      })
      .catch(() => setSettlementData(null));
  }, []);

  /* Loading skeleton */
  if (isLoading && !summary) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  const todoCount     = todoMatches?.length || 0;
  const firstName     = myName ? myName.replace(/매니저$/, '').trim() : '매니저';
  const clientCount   = summary?.myClientCount ?? 0;
  const pendingApproval = summary?.pendingCount ?? 0;
  const connectionsCount = connections?.length ?? 0;

  /* Settlement KPI — 이번달 정산대상 금액 + 받을 잔고 */
  const settlementAmount = settlementData
    ? (settlementData.amount || 0).toLocaleString('ko-KR')
    : '-';
  const settlementSub = settlementData
    ? `잔고 ${(settlementData.expectedTotal || 0).toLocaleString('ko-KR')}원`
    : '데이터 없음';

  return (
    <div className={styles.page}>

      {/* ── Greeting ── */}
      <section className={styles.greetingSection}>
        <div className={styles.greetingKicker}>{getTodayKicker()}</div>
        <h1 className={styles.greetingTitle}>
          {firstName} 매니저님,<br />
          오늘도 새로운 인연을 이어주세요.
        </h1>
        <p className={styles.greetingStats}>
          오늘 처리할 일이 <b style={{ color: 'var(--rose-600)' }}>{todoCount}건</b>,
          예정된 만남이 <b style={{ color: 'var(--ink-900)' }}>{scheduledMatches?.length || 0}건</b> 있어요.
        </p>
      </section>

      {/* ── KPI 4-col ── */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="회원"
          value={clientCount}
          sub="내 담당 회원"
          icon={Users}
          tone="ink"
          onClick={() => navigate('/dashboard/clients')}
        />
        <KpiCard
          label="승인 대기"
          value={pendingApproval}
          sub="확인 필요"
          icon={AlertTriangle}
          tone="amber"
          pulse={pendingApproval > 0}
          onClick={() => {
            useClientListStore.setState((s) => ({
              filters: {
                ...s.filters,
                owner: 'all',
                gender: null,
                status: null,
                approval: 'pending',
                name: '',
              },
              page: 1,
            }));
            navigate('/dashboard/clients');
          }}
        />
        <KpiCard
          label="네트워크"
          value={connectionsCount}
          sub="매니저 연결"
          icon={Link2}
          tone="mint"
          onClick={() => navigate('/dashboard/connections')}
        />
        <KpiCard
          label="이번달 정산"
          value={settlementAmount}
          unit={settlementAmount !== '-' ? '원' : undefined}
          sub={settlementSub}
          icon={Wallet}
          tone="tangerine"
          onClick={() => navigate('/dashboard/settlement')}
        />
      </div>

      {/* ── 3-column dashboard bottom grid ── */}
      <div className={styles.desktopMain}>
        {/* Col 1: 지금 해야 할 일 */}
        <div className={styles.dashCol}>
          <SectionHeader
            title="지금 해야 할 일"
            sub={`${todoCount}건의 매칭이 매니저님을 기다려요`}
            action="전체보기"
            onAction={() => navigate('/dashboard/matches')}
          />
          <div className={styles.dashCard}>
            <div className={styles.dashCardBody}>
              {todoMatches == null ? (
                <div className={styles.dashEmpty}>
                  <div className={styles.dashEmptyDesc}>불러오는 중…</div>
                </div>
              ) : todoMatches.length === 0 ? (
                <div className={styles.dashEmpty}>
                  <div className={styles.dashEmptyIcon} style={{ background: 'var(--mint-100)', color: 'var(--mint-600)' }}>
                    <CheckCircle size={22} strokeWidth={1.6} />
                  </div>
                  <div className={styles.dashEmptyTitle}>처리할 매칭이 없어요</div>
                  <div className={styles.dashEmptyDesc}>모든 매칭을 잘 처리하고 계세요</div>
                </div>
              ) : (
                <div className={styles.todoList}>
                  {todoMatches.map((m) => (
                    <TodoRow
                      key={m.matchId}
                      match={m}
                      myManagerId={myManagerId}
                      onClick={() => navigate(`/dashboard/matches/${m.matchId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 2: 예정된 만남 */}
        <div className={styles.dashCol}>
          <SectionHeader
            title="예정된 만남"
            sub={`예정된 만남 ${scheduledMatches?.length || 0}건`}
          />
          <div className={styles.dashCard}>
            <div className={styles.dashCardBody}>
              {scheduledMatches == null ? (
                <div className={styles.dashEmpty}>
                  <div className={styles.dashEmptyDesc}>불러오는 중…</div>
                </div>
              ) : scheduledMatches.length === 0 ? (
                <div className={styles.dashEmpty}>
                  <div className={styles.dashEmptyIcon}>
                    <Calendar size={22} strokeWidth={1.6} />
                  </div>
                  <div className={styles.dashEmptyTitle}>예정된 만남이 없어요</div>
                  <div className={styles.dashEmptyDesc}>
                    새 일정이 잡히면 이곳에 표시돼요
                  </div>
                </div>
              ) : (
                <div className={styles.todayCardWrapper}>
                  {scheduledMatches.map((m) => (
                    <TodayCard
                      key={m.matchId}
                      match={m}
                      onClick={() => navigate(`/dashboard/matches/${m.matchId}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 3: 알림 */}
        <NotificationsColumn />
      </div>

    </div>
  );
}
