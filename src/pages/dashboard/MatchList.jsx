import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Plus, Search, X, ChevronDown, ChevronUp,
  AlertTriangle, UserRound, Info, ArrowRight, ChevronRight,
  Sparkles, SlidersHorizontal, ArrowUpRight, ChevronLeft,
} from 'lucide-react';
import useMatchStore from '../../store/matchStore';
import useAuthStore from '../../store/authStore';
import useClientListStore from '../../store/clientListStore';
import * as matchService from '../../api/matchService';
import * as clientService from '../../api/clientService';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import { toast } from '../../store/toastStore';
import { scorePair, topPairs, topChips } from './matchScore';
import styles from './MatchList.module.css';

/* ─── Stage config ─── */
const STAGE_CONFIG = {
  draft:             { label: '대기',    tone: 'ink',       action: '매칭 시작 전' },
  proposal_sent:     { label: '제안발송', tone: 'lilac',     action: 'A 프로필 확인 대기' },
  proposal_accepted: { label: '상대수락', tone: 'lilac',     action: 'B 프로필 확인 대기' },
  awaiting_payment:  { label: '입금대기', tone: 'amber',     action: '입금 대기 중' },
  scheduling:        { label: '일정조율', tone: 'tangerine', action: '일정 조율 중' },
  arranging:         { label: '조율확정', tone: 'tangerine', action: '매니저 확정 대기' },
  scheduled:         { label: '약속확정', tone: 'mint',      action: '약속 확정됨' },
  completed:         { label: '완료',    tone: 'mint',      action: '미팅 완료' },
  cancelled:         { label: '취소',    tone: 'rose',      action: '매칭 종료' },
};

const PIPELINE_STAGES = [
  'draft', 'proposal_sent', 'proposal_accepted', 'awaiting_payment',
  'scheduling', 'arranging', 'scheduled', 'completed',
];

const TONE_STYLES = {
  ink:       { actionBg: 'var(--ink-50)',         fg: 'var(--ink-700)',       dot: 'var(--ink-500)' },
  lilac:     { actionBg: 'var(--lilac-100)',       fg: '#4F3DA0',              dot: 'var(--lilac-600)' },
  amber:     { actionBg: 'var(--amber-100)',       fg: '#9A5E0E',              dot: 'var(--amber-600)' },
  tangerine: { actionBg: 'var(--tangerine-100)',   fg: 'var(--tangerine-700)', dot: 'var(--tangerine-600)' },
  mint:      { actionBg: 'var(--mint-100)',        fg: '#1A7A50',              dot: 'var(--mint-600)' },
  rose:      { actionBg: 'var(--rose-100)',        fg: '#B13149',              dot: 'var(--rose-600)' },
};

const STATUS_STEP_LABELS = {
  draft: '매칭 시작 전',
  proposal_sent: 'A 프로필 확인 대기',
  proposal_accepted: 'B 프로필 확인 대기',
  awaiting_payment: '입금 대기 중',
  scheduling: '일정 조율 중',
  arranging: '매니저 확정 대기',
  scheduled: '약속 확정됨',
  completed: '미팅 완료',
  cancelled: '매칭 종료',
};

/* ─── Filter chips config ─── */
const STATUS_CHIPS = [
  { value: 'todo',              label: '매니저 할일' },
  { value: 'active',            label: '진행중 전체' },
  { value: 'draft',             label: '대기중' },
  { value: 'proposal_sent',     label: '제안발송' },
  { value: 'proposal_accepted', label: '상대수락' },
  { value: 'awaiting_payment',  label: '입금대기' },
  { value: 'scheduling',        label: '일정조율' },
  { value: 'arranging',         label: '조율확정' },
  { value: 'scheduled',         label: '약속확정' },
  { value: 'completed',         label: '완료' },
  { value: 'cancelled',         label: '취소' },
];

const AFTER_CHIPS = [
  { value: 'pending',  label: '응답 대기' },
  { value: 'accepted', label: '성사' },
  { value: 'rejected', label: '미성사' },
];

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

/* ─── Mini Avatar ─── */
function MiniAvatar({ name, gender, size = 24 }) {
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
    }}>
      {initial}
    </div>
  );
}

/* ─── Match Card ─── */
function MatchCard({ match, onClick }) {
  const status = match.status;
  const cfg  = STAGE_CONFIG[status] || STAGE_CONFIG.draft;
  const tone = cfg.tone;
  const t    = TONE_STYLES[tone] || TONE_STYLES.ink;
  const nameA   = match.clientA?.clientName || 'A';
  const nameB   = match.clientB?.clientName || 'B';
  const genderA = match.clientA?.clientGender || 'male';
  const genderB = match.clientB?.clientGender || 'female';
  const idx     = PIPELINE_STAGES.indexOf(status);

  return (
    <div className={styles.matchCard} onClick={onClick}>
      {/* Row 1: avatars + pair names + status badge */}
      <div className={styles.cardRow1}>
        <div className={styles.cardAvatars}>
          <MiniAvatar name={nameA} gender={genderA} size={24} />
          <div style={{ marginLeft: -6, borderRadius: '50%', border: '1.5px solid var(--paper-card)' }}>
            <MiniAvatar name={nameB} gender={genderB} size={24} />
          </div>
        </div>
        <span className={styles.cardNames}>
          {nameA}
          {match.clientA?.clientNickname && (
            <span className={styles.cardNick}>{match.clientA.clientNickname}</span>
          )}
          <span className={styles.cardSep}>↔</span>
          {nameB}
          {match.clientB?.clientNickname && (
            <span className={styles.cardNick}>{match.clientB.clientNickname}</span>
          )}
        </span>
        <span
          className={styles.cardBadge}
          style={{ background: t.actionBg, color: t.fg }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.dot, display: 'inline-block', flexShrink: 0 }} />
          {cfg.label}
        </span>
      </div>

      {/* Row 2: next action + inline stepper */}
      <div className={styles.cardRow2}>
        <ArrowRight size={11} color={t.dot} strokeWidth={2} />
        <span className={styles.cardAction} style={{ color: t.fg }}>
          {cfg.action}
        </span>
        <div className={styles.stepDots}>
          {PIPELINE_STAGES.map((s, i) => (
            <div
              key={s}
              className={styles.stepDot}
              style={{
                width:      i === idx ? 8 : 4,
                background: i < idx  ? 'var(--ink-700)' : i === idx ? t.dot : 'var(--ink-100)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Row 3: date + manager */}
      <div className={styles.cardRow3}>
        <span>{formatDate(match.createdAt)}</span>
        {match.createdByManagerName && (
          <>
            <span className={styles.cardMeta3Dot}>·</span>
            <UserRound size={10} strokeWidth={2} color="var(--ink-300)" />
            <span>{match.createdByManagerName}</span>
          </>
        )}
        {match.status === 'completed' && match.afterStatus && (
          <>
            <span className={styles.cardMeta3Dot}>·</span>
            <StatusBadge status={`after_${match.afterStatus}`} />
          </>
        )}
        {!match.accessible && (
          <span className={styles.readOnlyBadge}>열람 불가</span>
        )}
      </div>
    </div>
  );
}

/* ─── RecommendedPairsCompact ─── */
function SignalBar({ score, max }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color = pct >= 70 ? 'var(--mint-600)' : pct >= 40 ? 'var(--tangerine-600)' : 'var(--ink-200)';
  return (
    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--ink-100)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function PairCard({ pair, onCreateMatch }) {
  const [expanded, setExpanded] = useState(false);
  const { a, b, total, signals } = pair;
  const chips = topChips(signals, 3);
  const nameA = a.name || a.nickname || '?';
  const nameB = b.name || b.nickname || '?';
  const genderA = (a.gender || 'male').toLowerCase();
  const genderB = (b.gender || 'female').toLowerCase();

  return (
    <div className={styles.pairCard}>
      <div className={styles.pairCardRow} onClick={() => setExpanded((v) => !v)}>
        {/* Avatars */}
        <div style={{ display: 'flex', flexShrink: 0 }}>
          <MiniAvatar name={nameA} gender={genderA} size={30} />
          <div style={{ marginLeft: -8, borderRadius: '50%', border: '1.5px solid var(--paper-card)' }}>
            <MiniAvatar name={nameB} gender={genderB} size={30} />
          </div>
        </div>
        {/* Names + chips */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={styles.pairNames}>
            {nameA}
            <span className={styles.pairArrow}>↔</span>
            {nameB}
          </div>
          {chips.length > 0 && (
            <div className={styles.pairChips}>
              {chips.map((c, i) => (
                <span key={i} className={styles.pairChip}>{c}</span>
              ))}
            </div>
          )}
        </div>
        {/* Score */}
        <div className={styles.pairScore}>
          <span className={styles.pairScoreNum}>{total}</span>
          <span className={styles.pairScoreMax}>/100</span>
        </div>
        <ChevronDown
          size={14}
          strokeWidth={2}
          color="var(--ink-300)"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </div>

      {/* Expanded signals */}
      {expanded && (
        <div className={styles.pairSignals}>
          {signals.filter((s) => s.max > 0).map((s) => (
            <div key={s.key} className={styles.pairSignalRow}>
              <span className={styles.pairSignalLabel}>{s.label}</span>
              <SignalBar score={s.score} max={s.max} />
              <span className={styles.pairSignalScore}>{s.score}<span style={{ color: 'var(--ink-300)' }}>/{s.max}</span></span>
              {s.detail && <span className={styles.pairSignalDetail}>{s.detail}</span>}
            </div>
          ))}
          <button
            className={styles.pairMatchBtn}
            onClick={(e) => { e.stopPropagation(); onCreateMatch(a.id, b.id); }}
            type="button"
          >
            <Heart size={12} strokeWidth={2} />
            이 두 분 매칭하기
          </button>
        </div>
      )}
    </div>
  );
}

function RecommendedPairsCompact({ clients, onCreateMatch }) {
  const [open, setOpen] = useState(false);
  const pairs = useMemo(() => topPairs(clients, 3), [clients]);

  if (pairs.length === 0) return null;

  return (
    <div className={styles.recSection}>
      <button
        className={styles.recToggle}
        onClick={() => setOpen((v) => !v)}
        type="button"
        aria-expanded={open}
      >
        <Sparkles size={13} strokeWidth={2} color="var(--tangerine-600)" />
        <span className={styles.recToggleLabel}>오늘의 추천 매칭</span>
        <span className={styles.recCount}>{pairs.length}쌍</span>
        <div style={{ flex: 1 }} />
        {open
          ? <ChevronUp size={14} strokeWidth={2} color="var(--ink-400)" />
          : <ChevronDown size={14} strokeWidth={2} color="var(--ink-400)" />}
      </button>
      {open && (
        <div className={styles.recContent}>
          {pairs.map((pair, i) => (
            <PairCard key={i} pair={pair} onCreateMatch={onCreateMatch} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── TodoGroups ─── */
const TODO_GROUPS = [
  {
    key: 'now',
    label: '🔥 지금 바로',
    tone: 'rose',
    fg: '#B13149',
    bg: 'var(--rose-100)',
    filter: (m) => m.status === 'awaiting_payment' || m.status === 'draft',
  },
  {
    key: 'today',
    label: '오늘 중',
    tone: 'amber',
    fg: '#9A5E0E',
    bg: 'var(--amber-100)',
    filter: (m) =>
      m.status === 'arranging' ||
      (m.status === 'completed' && (!m.afterStatus || m.afterStatus === 'pending')),
  },
  {
    key: 'soon',
    label: '곧',
    tone: 'tangerine',
    fg: 'var(--tangerine-700)',
    bg: 'var(--tangerine-100)',
    filter: (m) =>
      m.status === 'scheduling' || m.status === 'scheduled' || m.status === 'proposal_sent',
  },
];

function TodoGroups({ matches, onMatch }) {
  return (
    <div className={styles.todoGroups}>
      {TODO_GROUPS.map((group) => {
        const items = matches.filter(group.filter);
        if (items.length === 0) return null;
        return (
          <div key={group.key} className={styles.todoGroup}>
            <div className={styles.todoGroupHeader}>
              <span className={styles.todoGroupLabel} style={{ color: group.fg }}>{group.label}</span>
              <div className={styles.todoGroupDivider} />
              <span className={styles.todoGroupCount} style={{ background: group.bg, color: group.fg }}>
                {items.length}건
              </span>
            </div>
            <div className={styles.cardList}>
              {items.map((m) => (
                <MatchCard
                  key={m.matchId}
                  match={m}
                  onClick={() => {
                    if (m.accessible === false) {
                      toast.info('연결된 매니저의 매칭입니다. 열람 권한이 없습니다.');
                      return;
                    }
                    onMatch(m.matchId);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Tab bar ─── */
const TABS = [
  { k: 'todo',     label: '할 일' },
  { k: 'progress', label: '진행 중' },
  { k: 'done',     label: '완료' },
  { k: 'all',      label: '전체' },
];

/* ─── Status filter map for tabs → store filter ─── */
const TAB_STATUS_MAP = {
  todo:     'todo',
  progress: 'active',
  done:     'completed',
  all:      null,
};

/* ─── iOS Toggle ─── */
function IOSToggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      type="button"
      onClick={() => onChange(!checked)}
      className={`${styles.iosToggle} ${checked ? styles.iosToggleOn : ''}`}
    >
      <span className={styles.iosThumb} />
    </button>
  );
}

/* ─── Filter Bottom Sheet ─── */
function FilterSheet({ open, onClose, filters, setFilter, myManagerId, onlyMine, setOnlyMine, totalCount }) {
  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll while open (preserve original value)
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const currentStatus = filters.status || null;

  const handleStatusChip = (value) => {
    setFilter('status', currentStatus === value ? null : value);
  };

  const handleAfterChip = (value) => {
    setFilter('status', currentStatus === value ? null : value);
  };

  const handleOnlyMineToggle = (checked) => {
    setOnlyMine(checked);
    setFilter('managerId', checked && myManagerId ? myManagerId : '');
  };

  const handleReset = () => {
    setFilter('status', null);
    setFilter('managerId', '');
    setOnlyMine(false);
  };

  const afterChipValues = AFTER_CHIPS.map((c) => c.value);
  const isAfterStatus = afterChipValues.includes(currentStatus);

  return createPortal(
    <div
      className={styles.sheetOverlay}
      onClick={onClose}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className={styles.sheetHandle} />

        {/* Title */}
        <h2 id="filter-sheet-title" className={styles.sheetTitle}>필터</h2>

        {/* Section 1: 상태 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>매칭 상태</span>
          <div className={styles.chipGrid}>
            {STATUS_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                aria-pressed={currentStatus === chip.value}
                className={`${styles.filterChip} ${currentStatus === chip.value && !isAfterStatus ? styles.filterChipActive : ''}`}
                onClick={() => handleStatusChip(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: 에프터 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>에프터</span>
          <div className={styles.chipRow}>
            {AFTER_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                aria-pressed={currentStatus === chip.value}
                className={`${styles.filterChip} ${currentStatus === chip.value ? styles.filterChipActive : ''}`}
                onClick={() => handleAfterChip(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: 특수 필터 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>특수 필터</span>
          <div className={styles.chipRow}>
            <button
              type="button"
              aria-pressed={currentStatus === 'has_deleted_member'}
              className={`${styles.filterChip} ${currentStatus === 'has_deleted_member' ? styles.filterChipActive : ''}`}
              onClick={() => handleStatusChip('has_deleted_member')}
            >
              삭제 회원 포함
            </button>
          </div>
        </div>

        {/* Section 4: 담당자 */}
        {myManagerId && (
          <div className={styles.sheetSection}>
            <span className={styles.sheetKicker}>담당자</span>
            <div className={styles.toggleRow}>
              <div className={styles.toggleRowText}>
                <span className={styles.toggleLabel}>내 매칭만 보기</span>
                <span className={styles.toggleDesc}>내가 담당한 매칭만 표시돼요</span>
              </div>
              <IOSToggle checked={onlyMine} onChange={handleOnlyMineToggle} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.sheetFooter}>
          <button
            type="button"
            className={styles.sheetResetBtn}
            onClick={handleReset}
          >
            초기화
          </button>
          <button
            type="button"
            className={styles.sheetApplyBtn}
            onClick={onClose}
          >
            적용 ({totalCount})
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════
   MatchList
═══════════════════════════════════════════════ */
export default function MatchList() {
  const { matches, totalCount, page, size, filters, isLoading, error,
          setFilter, setFilters, setPage, fetchMatches } = useMatchStore();
  const navigate      = useNavigate();
  const myManagerId   = useAuthStore((s) => s.managerId);
  const { clients: storeClients } = useClientListStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate,   setShowCreate]   = useState(false);
  const [searchInput,  setSearchInput]  = useState(filters.clientName || '');
  const [onlyMine,     setOnlyMine]     = useState(Boolean(myManagerId));
  const [activeTab,    setActiveTab]    = useState('all');
  const [allClients,   setAllClients]   = useState([]);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const searchInputRef = useRef(null);

  /* URL param + manager default */
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const createParam = searchParams.get('create');
    const patch = {};
    if (statusParam) patch.status = statusParam;
    if (myManagerId) patch.managerId = myManagerId;
    if (Object.keys(patch).length > 0) {
      setFilters(patch);
      if (statusParam) {
        const next = new URLSearchParams(searchParams);
        next.delete('status');
        setSearchParams(next, { replace: true });
      }
    }
    if (createParam === '1') {
      setShowCreate(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeCreateModal = () => {
    setShowCreate(false);
    if (searchParams.get('create') || searchParams.get('clientA') || searchParams.get('clientB')) {
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      next.delete('clientA');
      next.delete('clientB');
      setSearchParams(next, { replace: true });
    }
  };

  /* Load clients for recommended-pairs scoring */
  useEffect(() => {
    if (storeClients.length > 0) {
      setAllClients(storeClients);
    } else {
      clientService.listClients({ limit: 200, approval: 'approved', status: 'active' })
        .then((res) => {
          const list = res.data || res.clients || res;
          if (Array.isArray(list)) setAllClients(list);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeClients.length]);

  /* Debounce search → clientName filter */
  useEffect(() => {
    const h = setTimeout(() => {
      if (filters.clientName !== searchInput) setFilter('clientName', searchInput);
    }, 300);
    return () => clearTimeout(h);
  }, [searchInput, filters.clientName, setFilter]);

  useEffect(() => {
    fetchMatches();
  }, [page, filters, fetchMatches]);

  /* Auto-focus search input when panel opens */
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilter('status', TAB_STATUS_MAP[tab]);
  };

  /* Toggle search panel — close filter if open */
  const toggleSearch = () => {
    setFilterOpen(false);
    setSearchOpen((v) => {
      if (v) {
        // closing — clear input
        setSearchInput('');
        setFilter('clientName', '');
      }
      return !v;
    });
  };

  /* Toggle filter sheet — close search if open */
  const toggleFilter = () => {
    setSearchOpen(false);
    setFilterOpen((v) => !v);
  };

  /* Stable close handler for FilterSheet — prevents effect re-registration on every render */
  const handleFilterSheetClose = useCallback(() => setFilterOpen(false), []);

  /* Is any filter non-default? */
  const hasActiveFilter = Boolean(filters.status) || Boolean(filters.managerId);

  const totalPages = Math.ceil(totalCount / size);

  return (
    <div className={styles.page}>

      {/* ── Title row ── */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>매칭</h1>

        <div className={styles.titleActions}>
          {/* Guide link */}
          <button
            type="button"
            className={styles.guideLink}
            onClick={() => navigate('/dashboard/guide')}
            aria-label="매칭 프로세스 가이드"
          >
            가이드 보기
            <ArrowUpRight size={12} strokeWidth={2.5} />
          </button>

          {/* Search icon button */}
          <button
            type="button"
            className={`${styles.iconBtn} ${searchOpen ? styles.iconBtnActive : ''}`}
            onClick={toggleSearch}
            aria-label="회원 이름 검색"
            aria-pressed={searchOpen}
          >
            <Search size={16} strokeWidth={2} />
          </button>

          {/* Filter icon button */}
          <div className={styles.iconBtnWrap}>
            <button
              type="button"
              className={`${styles.iconBtn} ${filterOpen ? styles.iconBtnActive : ''}`}
              onClick={toggleFilter}
              aria-label="필터"
              aria-pressed={filterOpen}
            >
              <SlidersHorizontal size={16} strokeWidth={2} />
            </button>
            {hasActiveFilter && <span className={styles.filterDot} aria-hidden="true" />}
          </div>

          {/* New match CTA */}
          <button
            className={styles.createBtn}
            onClick={() => setShowCreate(true)}
            type="button"
            aria-label="새 매칭 생성"
          >
            <Plus size={15} strokeWidth={2.5} />
            새 매칭
          </button>
        </div>
      </div>

      {/* ── Inline search panel ── */}
      {searchOpen && (
        <div className={styles.searchPanel}>
          <div className={styles.searchPillBox}>
            <Search size={14} className={styles.searchPillIcon} strokeWidth={2} />
            <input
              ref={searchInputRef}
              className={styles.searchPillInput}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="회원 이름 검색…"
              aria-label="회원 이름으로 검색"
            />
            {searchInput && (
              <button
                className={styles.searchPillClear}
                onClick={() => setSearchInput('')}
                type="button"
                aria-label="검색어 지우기"
              >
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className={styles.tabs} role="tablist" aria-label="매칭 필터 탭">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.k;
          return (
            <button
              key={tab.k}
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab}${isActive ? ` ${styles.tabActive}` : ''}`}
              onClick={() => handleTabChange(tab.k)}
              type="button"
            >
              {tab.label}
              {isActive && totalCount > 0 && (
                <span className={styles.tabBadge}>{totalCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Recommended pairs (below tab strip, always visible) ── */}
      <RecommendedPairsCompact
        clients={allClients}
        onCreateMatch={(aId, bId) => {
          setSearchParams({ create: '1', clientA: aId, clientB: bId });
          setShowCreate(true);
        }}
      />

      {/* ── Error ── */}
      {error && (
        <div className={styles.error} role="alert">
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <SkeletonTable rows={4} columns={3} />
      ) : matches.length === 0 && !error ? (
        <div className={styles.empty}>
          <Heart size={36} strokeWidth={1.2} color="var(--ink-300)" />
          <p>
            {(searchInput || filters.status || filters.managerId)
              ? '검색 결과가 없습니다.'
              : '매칭 내역이 없습니다.'}
          </p>
        </div>
      ) : activeTab === 'todo' ? (
        <>
          <TodoGroups
            matches={matches}
            onMatch={(matchId) => navigate(`/dashboard/matches/${matchId}`)}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      ) : (
        <>
          <div className={styles.cardList}>
            {matches.map((m) => {
              const accessible = m.accessible !== false;
              return (
                <MatchCard
                  key={m.matchId}
                  match={m}
                  onClick={() => {
                    if (!accessible) {
                      toast.info('연결된 매니저의 매칭입니다. 열람 권한이 없습니다.');
                      return;
                    }
                    navigate(`/dashboard/matches/${m.matchId}`);
                  }}
                />
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* ── Filter Bottom Sheet ── */}
      <FilterSheet
        open={filterOpen}
        onClose={handleFilterSheetClose}
        filters={filters}
        setFilter={setFilter}
        myManagerId={myManagerId}
        onlyMine={onlyMine}
        setOnlyMine={setOnlyMine}
        totalCount={totalCount}
      />

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateMatchModal
          onClose={closeCreateModal}
          onCreated={() => { closeCreateModal(); fetchMatches(); }}
          initialClientAId={searchParams.get('clientA')}
          initialClientBId={searchParams.get('clientB')}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CreateMatchModal — 3-step wizard
═══════════════════════════════════════════════ */

/* Gender chip */
function GenderChip({ gender }) {
  const isMale = gender === 'male';
  return (
    <span
      className={styles.wizGenderChip}
      style={{
        background: isMale ? 'var(--male-100)' : 'var(--female-100)',
        color: isMale ? 'var(--male)' : 'var(--female)',
      }}
    >
      {isMale ? '남' : '여'}
    </span>
  );
}

/* Client result row used in both Step 1 and Step 2 */
function ClientResultRow({ client, score, chips, onClick }) {
  const name = client.name || client.nickname || '?';
  const nick = client.nickname && client.name ? client.nickname : null;
  return (
    <button
      type="button"
      className={styles.wizResultRow}
      onClick={onClick}
    >
      <MiniAvatar name={name} gender={client.gender} size={36} />
      <div className={styles.wizResultInfo}>
        <div className={styles.wizResultNameRow}>
          <span className={styles.wizResultName}>{name}</span>
          {nick && <span className={styles.wizResultNick}>{nick}</span>}
          <GenderChip gender={client.gender} />
        </div>
        <div className={styles.wizResultMeta}>
          {client.age && <span>{client.age}세</span>}
          {client.age && client.occupation && <span className={styles.wizMetaDot}>·</span>}
          {client.occupation && <span>{client.occupation}</span>}
        </div>
        {chips && chips.length > 0 && (
          <div className={styles.wizResultChips}>
            {chips.map((c, i) => (
              <span key={i} className={styles.wizResultChip}>{c}</span>
            ))}
          </div>
        )}
      </div>
      {score != null && (
        <div className={styles.wizScoreBadge}>
          <span className={styles.wizScoreNum}>{score}</span>
        </div>
      )}
      <ChevronRight size={14} strokeWidth={2} color="var(--ink-300)" />
    </button>
  );
}

/* Selected client card (shown at top of step when already chosen) */
function SelectedClientCard({ client, label, onClear }) {
  const name = client.name || client.nickname || '?';
  const nick = client.nickname && client.name ? client.nickname : null;
  return (
    <div className={styles.wizSelectedCard}>
      <div className={styles.wizSelectedBadge}>{label}</div>
      <MiniAvatar name={name} gender={client.gender} size={40} />
      <div className={styles.wizSelectedInfo}>
        <div className={styles.wizSelectedNameRow}>
          <span className={styles.wizSelectedName}>{name}</span>
          {nick && <span className={styles.wizSelectedNick}>{nick}</span>}
          <GenderChip gender={client.gender} />
        </div>
        <div className={styles.wizSelectedMeta}>
          {client.age && <span>{client.age}세</span>}
          {client.age && client.occupation && <span className={styles.wizMetaDot}>·</span>}
          {client.occupation && <span>{client.occupation}</span>}
        </div>
      </div>
      <button
        type="button"
        className={styles.wizSelectedChange}
        onClick={onClear}
        aria-label="변경"
      >
        변경
      </button>
    </div>
  );
}

/* Comparison table row */
function CompareRow({ label, valA, valB }) {
  if (!valA && !valB) return null;
  return (
    <div className={styles.compareRow}>
      <span className={styles.compareLabel}>{label}</span>
      <span className={styles.compareValA}>{valA || '-'}</span>
      <span className={styles.compareValB}>{valB || '-'}</span>
    </div>
  );
}

const DEFAULT_PAYMENT_AMOUNT = 19900;

const normalizeAmountInput = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits === '') return '';
  const stripped = digits.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
};

function PaymentAmountField({ label, mode, setMode, custom, setCustom }) {
  const trimmed = (custom || '').trim();
  const parsedNum = trimmed === '' ? null : Number(trimmed);
  const customInvalid = mode === 'custom' && (
    trimmed === '' ||
    !Number.isFinite(parsedNum) ||
    !Number.isInteger(parsedNum) ||
    parsedNum < 0
  );

  return (
    <div className={styles.wizPaymentRow}>
      <span className={styles.wizPaymentRowLabel}>{label}</span>
      <div className={styles.wizPaymentChips}>
        <button
          type="button"
          aria-pressed={mode === 'default'}
          className={`${styles.wizPaymentChip} ${mode === 'default' ? styles.wizPaymentChipActive : ''}`}
          onClick={() => setMode('default')}
        >
          기본 {DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원
        </button>
        <button
          type="button"
          aria-pressed={mode === 'free'}
          className={`${styles.wizPaymentChip} ${mode === 'free' ? styles.wizPaymentChipActive : ''}`}
          onClick={() => setMode('free')}
        >
          무료
        </button>
        <button
          type="button"
          aria-pressed={mode === 'custom'}
          className={`${styles.wizPaymentChip} ${mode === 'custom' ? styles.wizPaymentChipActive : ''}`}
          onClick={() => setMode('custom')}
        >
          직접 입력
        </button>
      </div>
      {mode === 'custom' && (
        <div className={styles.wizPaymentInputWrap}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={custom}
            onChange={(e) => setCustom(normalizeAmountInput(e.target.value))}
            placeholder="예: 30000"
            className={`${styles.wizPaymentInput} ${customInvalid ? styles.wizPaymentInputInvalid : ''}`}
            aria-label={`${label} 결제 금액`}
            aria-invalid={customInvalid || undefined}
          />
          <span className={styles.wizPaymentInputUnit}>원</span>
        </div>
      )}
      {customInvalid && (
        <span className={styles.wizPaymentError}>0 이상의 정수만 입력할 수 있어요.</span>
      )}
    </div>
  );
}

function CreateMatchModal({ onClose, onCreated, initialClientAId, initialClientBId }) {
  const [step,           setStep]           = useState(1);
  const [clientA,        setClientA]        = useState(null);
  const [clientB,        setClientB]        = useState(null);
  const [note,           setNote]           = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [submitting,     setSubmitting]     = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [activeMatches,  setActiveMatches]  = useState({ A: [], B: [], deletedA: [], deletedB: [] });
  const [pairHistory,    setPairHistory]    = useState([]);
  /* 결제 금액: 'default' | 'free' | 'custom' */
  const [paymentModeA,   setPaymentModeA]   = useState('default');
  const [paymentModeB,   setPaymentModeB]   = useState('default');
  const [customAmountA,  setCustomAmountA]  = useState('');
  const [customAmountB,  setCustomAmountB]  = useState('');
  /* prefill resolution tracking (internal only) */
  const prefillResolvedRef = useRef(false);
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  /* ── Prefill from URL params ── */
  useEffect(() => {
    const resolveIds = async () => {
      if (!initialClientAId && !initialClientBId) {
        prefillResolvedRef.current = true;
        return;
      }
      try {
        const [resA, resB] = await Promise.all([
          initialClientAId ? clientService.getClientDetail(initialClientAId).catch(() => null) : Promise.resolve(null),
          initialClientBId ? clientService.getClientDetail(initialClientBId).catch(() => null) : Promise.resolve(null),
        ]);
        const normalise = (res) => {
          if (!res) return null;
          const c = res.data || res;
          if (!c || !c.id) return null;
          return {
            id: c.id || c.clientId,
            name: c.name || c.clientName,
            nickname: c.nickname || c.clientNickname,
            gender: c.gender || c.clientGender,
            age: c.age || c.clientAge,
            occupation: c.occupation,
            status: c.status || 'active',
          };
        };
        const cA = normalise(resA);
        const cB = normalise(resB);
        if (cA) { setClientA(cA); }
        if (cB) { setClientB(cB); }
        // Decide starting step
        if (cA && cB) { setStep(3); }
        else if (cA)  { setStep(2); }
        else          { setStep(1); }
      } catch {
        // ignore
      }
      prefillResolvedRef.current = true;
    };
    resolveIds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Search ── */
  useEffect(() => {
    if (searchQuery.length >= 1) {
      const params = { name: searchQuery, limit: 10, approval: 'approved', status: 'active' };
      if (step === 2 && clientA?.gender) {
        params.gender = clientA.gender === 'female' ? 'male' : 'female';
      }
      clientService.listClients(params).then((res) => {
        const list = res.data || res.clients || res;
        setSearchResults(Array.isArray(list) ? list : []);
      }).catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, step, clientA]);

  /* Auto-focus search on step mount */
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [step]);

  /* ── Duplicate / history / active-match checks ── */
  useEffect(() => {
    if (!clientA && !clientB) {
      setDuplicateMatch(null);
      setActiveMatches({ A: [], B: [], deletedA: [], deletedB: [] });
      setPairHistory([]);
      return;
    }
    let cancelled = false;
    matchService.listMatches({ size: 200 }).then((res) => {
      if (cancelled) return;
      const list = res.data || res.matches || [];
      const activeStatuses = ['draft', 'proposal_sent', 'proposal_accepted', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled'];

      if (clientA && clientB) {
        const dup = list.find((m) => {
          if (m.status === 'cancelled') return false;
          const ids = [m.clientA.clientId, m.clientB.clientId];
          return ids.includes(clientA.id) && ids.includes(clientB.id);
        });
        setDuplicateMatch(dup || null);
      } else {
        setDuplicateMatch(null);
      }

      if (clientA && clientB) {
        const pairMatches = list.filter((m) => {
          const ids = [m.clientA.clientId, m.clientB.clientId];
          return ids.includes(clientA.id) && ids.includes(clientB.id);
        });
        const warnings = [];
        for (const m of pairMatches) {
          if (m.status === 'cancelled') {
            warnings.push({ type: 'cancelled', message: '이전에 매칭이 취소된 이력이 있습니다', matchId: m.matchId });
          }
          const rejectedBy = [];
          if (m.clientA.response === 'rejected') rejectedBy.push(m.clientA.clientName);
          if (m.clientB.response === 'rejected') rejectedBy.push(m.clientB.clientName);
          if (rejectedBy.length > 0) {
            warnings.push({ type: 'rejected', message: `${rejectedBy.join(', ')}이(가) 프로포절을 거절한 이력이 있습니다`, matchId: m.matchId });
          }
          if (m.afterStatus === 'rejected') {
            warnings.push({ type: 'after_rejected', message: '만남 후 애프터가 미성사된 이력이 있습니다', matchId: m.matchId });
          }
        }
        setPairHistory(warnings);
      } else {
        setPairHistory([]);
      }

      const findActive = (clientId) => {
        if (!clientId) return { normal: [], deleted: [] };
        const all = list.filter((m) =>
          activeStatuses.includes(m.status) &&
          (m.clientA.clientId === clientId || m.clientB.clientId === clientId)
        );
        const normal  = all.filter((m) => !m.clientA.deleted && !m.clientB.deleted);
        const deleted = all.filter((m) => m.clientA.deleted || m.clientB.deleted);
        return { normal, deleted };
      };
      const activeA = findActive(clientA?.id);
      const activeB = findActive(clientB?.id);
      setActiveMatches({ A: activeA.normal, B: activeB.normal, deletedA: activeA.deleted, deletedB: activeB.deleted });
    }).catch(() => {
      if (!cancelled) {
        setDuplicateMatch(null);
        setActiveMatches({ A: [], B: [], deletedA: [], deletedB: [] });
        setPairHistory([]);
      }
    });
    return () => { cancelled = true; };
  }, [clientA, clientB]);

  /* ── Select handlers ── */
  const selectA = (client) => {
    setClientA(client);
    setSearchQuery('');
    setSearchResults([]);
    setStep(2);
  };

  const selectB = (client) => {
    setClientB(client);
    setSearchQuery('');
    setSearchResults([]);
    setStep(3);
  };

  /* ── Resolve per-side payment amount based on mode ── */
  const resolvePaymentAmount = (mode, customStr) => {
    if (mode === 'default') return null;          // null → 환경변수 fallback
    if (mode === 'free') return 0;
    const trimmed = (customStr || '').trim();
    if (trimmed === '') return null;              // 빈값이면 default 처리
    const n = Number(trimmed);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return NaN; // invalid
    return n;
  };

  const paymentAmountA = resolvePaymentAmount(paymentModeA, customAmountA);
  const paymentAmountB = resolvePaymentAmount(paymentModeB, customAmountB);
  const paymentInvalid = Number.isNaN(paymentAmountA) || Number.isNaN(paymentAmountB);

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!clientA || !clientB || duplicateMatch) return;
    if ((clientA.status || 'active') !== 'active' || (clientB.status || 'active') !== 'active') {
      toast.error('비활성/휴면 상태 회원은 매칭할 수 없습니다.');
      return;
    }
    if (paymentInvalid) {
      toast.error('결제 금액은 0 이상의 정수여야 합니다.');
      return;
    }
    setSubmitting(true);
    try {
      await matchService.createMatch({
        clientAId: clientA.id,
        clientBId: clientB.id,
        note,
        paymentAmountA,
        paymentAmountB,
      });
      toast.success('매칭이 생성되었습니다.');
      onCreated();
    } catch (err) {
      toast.error(err.message || '매칭 생성에 실패했습니다.');
    }
    setSubmitting(false);
  };

  /* ── Score B-side results ── */
  const scoredResults = useMemo(() => {
    if (step !== 2 || !clientA) return searchResults.map((c) => ({ client: c, score: null, chips: [] }));
    return searchResults.map((c) => {
      try {
        const { total, signals } = scorePair(clientA, c);
        return { client: c, score: total, chips: topChips(signals, 1) };
      } catch {
        return { client: c, score: null, chips: [] };
      }
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [searchResults, step, clientA]);

  /* ── Step titles ── */
  const STEP_TITLES = ['A 회원 선택', 'B 회원 선택', '매칭 확인'];
  const stepTitle = STEP_TITLES[step - 1];

  /* ── Escape key ── */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Body scroll lock (preserve original value) ── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const nameA = clientA ? (clientA.name || clientA.nickname || '?') : null;
  const nameB = clientB ? (clientB.name || clientB.nickname || '?') : null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="새 매칭 생성"
      >
        {/* ── Modal chrome: header ── */}
        <div className={styles.wizHeader}>
          <button
            type="button"
            className={styles.wizNavBtn}
            onClick={step > 1 ? () => { setStep((s) => s - 1); setSearchQuery(''); setSearchResults([]); } : onClose}
            aria-label={step > 1 ? '이전 단계' : '닫기'}
          >
            {step > 1 ? <ChevronLeft size={18} strokeWidth={2} /> : <X size={18} strokeWidth={2} />}
          </button>
          <div className={styles.wizHeaderCenter}>
            <span className={styles.wizHeaderTitle}>새 매칭 · {step}/3</span>
            <span className={styles.wizHeaderSub}>{stepTitle}</span>
          </div>
        </div>

        {/* ── Step content ── */}
        <div className={styles.wizBody} key={step}>

          {/* ════ STEP 1: A 회원 선택 ════ */}
          {step === 1 && (
            <div className={styles.wizStep}>
              <div className={styles.wizKickerGroup}>
                <h3 className={styles.wizKicker}>A 회원을 골라 주세요</h3>
                <p className={styles.wizSub}>매칭을 시작할 첫 회원이에요</p>
              </div>

              {/* If A already selected, show card */}
              {clientA && (
                <SelectedClientCard
                  client={clientA}
                  label="A"
                  onClear={() => { setClientA(null); }}
                />
              )}

              {/* Search */}
              <div className={styles.wizSearchWrap}>
                <Search size={14} className={styles.wizSearchIcon} strokeWidth={2} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.wizSearchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색…"
                  aria-label="A 회원 검색"
                />
                {searchQuery && (
                  <button type="button" className={styles.wizSearchClear} onClick={() => { setSearchQuery(''); setSearchResults([]); }} aria-label="검색어 지우기">
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className={styles.wizResultList}>
                  {searchResults
                    .filter((c) => c.id !== clientB?.id)
                    .map((c) => (
                      <ClientResultRow
                        key={c.id}
                        client={c}
                        score={null}
                        chips={[]}
                        onClick={() => selectA(c)}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 2: B 회원 선택 ════ */}
          {step === 2 && (
            <div className={styles.wizStep}>
              <div className={styles.wizKickerGroup}>
                <h3 className={styles.wizKicker}>B 회원을 골라 주세요</h3>
                <p className={styles.wizSub}>
                  A 회원은 <strong>{nameA}</strong>님이에요. 반대 성별로 자동 필터링돼요.
                </p>
              </div>

              {/* If B already selected, show card */}
              {clientB && (
                <SelectedClientCard
                  client={clientB}
                  label="B"
                  onClear={() => { setClientB(null); }}
                />
              )}

              {/* Search */}
              <div className={styles.wizSearchWrap}>
                <Search size={14} className={styles.wizSearchIcon} strokeWidth={2} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.wizSearchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름으로 검색…"
                  aria-label="B 회원 검색"
                />
                {searchQuery && (
                  <button type="button" className={styles.wizSearchClear} onClick={() => { setSearchQuery(''); setSearchResults([]); }} aria-label="검색어 지우기">
                    <X size={12} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Scored results */}
              {scoredResults.length > 0 && (
                <div className={styles.wizResultList}>
                  {scoredResults
                    .filter((r) => r.client.id !== clientA?.id)
                    .map((r) => (
                      <ClientResultRow
                        key={r.client.id}
                        client={r.client}
                        score={r.score}
                        chips={r.chips}
                        onClick={() => selectB(r.client)}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ════ STEP 3: 확인 ════ */}
          {step === 3 && clientA && clientB && (
            <div className={styles.wizStep}>
              <div className={styles.wizKickerGroup}>
                <h3 className={styles.wizKicker}>이 두 분으로 진행할까요?</h3>
              </div>

              {/* Pair avatars */}
              <div className={styles.wizPairRow}>
                <div className={styles.wizPairPerson}>
                  <MiniAvatar name={nameA} gender={clientA.gender} size={48} />
                  <span className={styles.wizPairName}>{nameA}</span>
                  {clientA.age && <span className={styles.wizPairAge}>{clientA.age}세</span>}
                </div>
                <span className={styles.wizPairHeart}>
                  <Heart size={18} strokeWidth={2} color="var(--tangerine-600)" />
                </span>
                <div className={styles.wizPairPerson}>
                  <MiniAvatar name={nameB} gender={clientB.gender} size={48} />
                  <span className={styles.wizPairName}>{nameB}</span>
                  {clientB.age && <span className={styles.wizPairAge}>{clientB.age}세</span>}
                </div>
              </div>

              {/* ── Warnings ── */}
              {duplicateMatch && (
                <div className={styles.duplicateWarn}>
                  <AlertTriangle size={14} strokeWidth={2} />
                  <span>
                    이미 매칭된 적이 있는 회원입니다 (상태: {STATUS_STEP_LABELS[duplicateMatch.status] || duplicateMatch.status})
                  </span>
                </div>
              )}

              {pairHistory.length > 0 && !duplicateMatch && (
                <div className={styles.historyWarn}>
                  <div className={styles.historyWarnHeader}>
                    <AlertTriangle size={14} strokeWidth={2} />
                    <strong>과거 매칭 이력 주의</strong>
                  </div>
                  <div className={styles.historyWarnList}>
                    {pairHistory.map((w, i) => (
                      <span key={i}>• {w.message}</span>
                    ))}
                  </div>
                </div>
              )}

              {(activeMatches.A.length > 0 || activeMatches.B.length > 0) && !duplicateMatch && (
                <div className={styles.activeMatchWarn}>
                  <div className={styles.activeMatchHeader}>
                    <Info size={14} strokeWidth={2} />
                    <strong>진행 중인 매칭이 있는 회원입니다</strong>
                  </div>
                  <p className={styles.activeMatchDesc}>
                    동시에 매칭을 여러 개 진행하면 혼돈을 줄 수 있으니 주의해주세요.
                  </p>
                  {activeMatches.A.length > 0 && (
                    <div className={styles.activeMatchClient}>
                      <span className={styles.activeMatchLabel}>{nameA}</span>
                      <span className={styles.activeMatchCount}>진행중인 매칭 {activeMatches.A.length}건</span>
                      {activeMatches.A.map((m) => (
                        <button
                          key={m.matchId}
                          className={styles.activeMatchLink}
                          onClick={() => { onClose(); navigate(`/dashboard/matches/${m.matchId}`); }}
                          type="button"
                        >
                          {m.clientA.clientName} ↔ {m.clientB.clientName}
                          <StatusBadge status={m.status} />
                        </button>
                      ))}
                    </div>
                  )}
                  {activeMatches.B.length > 0 && (
                    <div className={styles.activeMatchClient}>
                      <span className={styles.activeMatchLabel}>{nameB}</span>
                      <span className={styles.activeMatchCount}>진행중인 매칭 {activeMatches.B.length}건</span>
                      {activeMatches.B.map((m) => (
                        <button
                          key={m.matchId}
                          className={styles.activeMatchLink}
                          onClick={() => { onClose(); navigate(`/dashboard/matches/${m.matchId}`); }}
                          type="button"
                        >
                          {m.clientA.clientName} ↔ {m.clientB.clientName}
                          <StatusBadge status={m.status} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(activeMatches.deletedA.length > 0 || activeMatches.deletedB.length > 0) && !duplicateMatch && (
                <div className={styles.duplicateWarn}>
                  <AlertTriangle size={14} strokeWidth={2} />
                  <span>
                    삭제된 회원과의 진행 중 매칭 {activeMatches.deletedA.length + activeMatches.deletedB.length}건이 있습니다
                  </span>
                </div>
              )}

              {/* ── Comparison table ── */}
              <div className={styles.compareTable}>
                <div className={styles.compareTableHead}>
                  <span className={styles.compareHeadLabel} />
                  <span className={styles.compareHeadA}>A · {nameA}</span>
                  <span className={styles.compareHeadB}>B · {nameB}</span>
                </div>
                <CompareRow
                  label="나이"
                  valA={clientA.age ? `${clientA.age}세` : null}
                  valB={clientB.age ? `${clientB.age}세` : null}
                />
                <CompareRow
                  label="성별"
                  valA={clientA.gender === 'female' ? '여성' : clientA.gender === 'male' ? '남성' : null}
                  valB={clientB.gender === 'female' ? '여성' : clientB.gender === 'male' ? '남성' : null}
                />
                <CompareRow label="직업" valA={clientA.occupation} valB={clientB.occupation} />
                <CompareRow label="회사" valA={clientA.company} valB={clientB.company} />
                <CompareRow
                  label="지역"
                  valA={clientA.location || clientA.region}
                  valB={clientB.location || clientB.region}
                />
                <CompareRow label="종교" valA={clientA.religion} valB={clientB.religion} />
              </div>

              {/* ── Auto-send info card ── */}
              <div className={styles.wizInfoCard}>
                <Info size={13} strokeWidth={2} color="var(--tangerine-600)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  매칭 생성 후 &lsquo;매칭 시작&rsquo; 버튼을 누르면 {nameA}님께 프로포절 링크가 자동 발송돼요.
                </span>
              </div>

              {/* ── Payment amount (per-side) ── */}
              <div className={styles.wizPaymentSection}>
                <div className={styles.wizPaymentHeader}>
                  <span className={styles.wizPaymentTitle}>결제 금액</span>
                  <span className={styles.wizPaymentSub}>
                    기본 {DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 · A/B 각각 지정 가능
                  </span>
                </div>
                <PaymentAmountField
                  label={`A · ${nameA}`}
                  mode={paymentModeA}
                  setMode={setPaymentModeA}
                  custom={customAmountA}
                  setCustom={setCustomAmountA}
                />
                <PaymentAmountField
                  label={`B · ${nameB}`}
                  mode={paymentModeB}
                  setMode={setPaymentModeB}
                  custom={customAmountB}
                  setCustom={setCustomAmountB}
                />
              </div>

              {/* ── Note ── */}
              <div className={styles.wizNoteWrap}>
                <textarea
                  className={styles.wizNoteInput}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="이 매칭에 대한 메모를 남겨보세요"
                  aria-label="매칭 메모"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div className={styles.wizFooter}>
          {step > 1 && (
            <button
              type="button"
              className={styles.wizPrevBtn}
              onClick={() => { setStep((s) => s - 1); setSearchQuery(''); setSearchResults([]); }}
            >
              이전
            </button>
          )}
          {step < 3 ? (
            <button
              type="button"
              className={styles.wizNextBtn}
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !clientA : step === 2 ? !clientB : false}
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              className={styles.wizSubmitBtn}
              onClick={handleSubmit}
              disabled={!clientA || !clientB || submitting || !!duplicateMatch || paymentInvalid}
            >
              {submitting ? (
                <span className={styles.submitSpinner} />
              ) : (
                <Heart size={14} strokeWidth={2} />
              )}
              {submitting ? '생성 중…' : '매칭 생성'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
