import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Search, X, ChevronDown,
  AlertTriangle, UserRound, Info, ArrowRight, ChevronRight,
  SlidersHorizontal, ArrowUpRight, ChevronLeft,
} from 'lucide-react';
import useMatchStore from '../../store/matchStore';
import useAuthStore from '../../store/authStore';
import * as matchService from '../../api/matchService';
import * as clientService from '../../api/clientService';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import { toast } from '../../store/toastStore';
import { scorePair, topChips } from './matchScore';
import EmptyState from '../../components/EmptyState';
import { birthYearLabelFromDate } from '../../utils/age';
import TextField from '../../components/TextField';
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

/* ─── TodoGroups ─── */
/* ─── Tab bar ─── 매칭 상태의 단일 축. 전체/대기/진행중/완료/취소 5구분. */
const TABS = [
  { k: 'all',       label: '전체' },
  { k: 'draft',     label: '대기' },
  { k: 'progress',  label: '진행 중' },
  { k: 'done',      label: '완료' },
  { k: 'cancelled', label: '취소' },
];

/* ─── Status filter map for tabs → store filter ─── */
const TAB_STATUS_MAP = {
  all:       null,
  draft:     'draft',
  progress:  'active',
  done:      'completed',
  cancelled: 'cancelled',
};

/* 탭 하이라이트는 filters.status 한 곳에서 파생한다(단일 소스). */
function tabFromStatus(status) {
  if (!status) return 'all';
  if (status === 'draft') return 'draft';
  if (status === 'active') return 'progress';
  if (status === 'completed') return 'done';
  if (status === 'cancelled') return 'cancelled';
  return null;
}

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
function FilterSheet({ open, onClose, setFilter, myManagerId, onlyMine, setOnlyMine, totalCount }) {
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

  const handleOnlyMineToggle = (checked) => {
    setOnlyMine(checked);
    setFilter('managerId', checked && myManagerId ? myManagerId : '');
  };

  const handleReset = () => {
    setFilter('managerId', '');
    setOnlyMine(false);
  };

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

        {/* 담당자 — 매칭 상태는 상단 탭에서 고른다(전체/대기/진행중/완료/취소) */}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate,   setShowCreate]   = useState(false);
  const [searchInput,  setSearchInput]  = useState('');
  const [onlyMine,     setOnlyMine]     = useState(Boolean(myManagerId));
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const searchInputRef = useRef(null);

  /* URL param + manager default */
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const createParam = searchParams.get('create');
    // 검색어는 세션에 남기지 않는다 — 매칭탭 재진입/새로고침 시 항상 빈 검색으로 시작.
    const patch = {};
    if (statusParam) patch.status = statusParam;
    if (myManagerId) patch.managerId = myManagerId;
    if (filters.clientName) patch.clientName = '';
    if (Object.keys(patch).length > 0) {
      setFilters(patch);
      if (statusParam) {
        const next = new URLSearchParams(searchParams);
        next.delete('status');
        setSearchParams(next, { replace: true });
      }
    }
    setSearchInput('');
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

  /* Debounce search → clientName filter (URL 동기화 안 함: 검색은 세션 내에서만 유지) */
  useEffect(() => {
    const h = setTimeout(() => {
      if (filters.clientName !== searchInput) setFilter('clientName', searchInput);
    }, 300);
    return () => clearTimeout(h);
  }, [searchInput, filters.clientName, setFilter]);

  useEffect(() => {
    fetchMatches();
  }, [page, filters, fetchMatches]);

  /* 매칭탭을 벗어나면 검색어 초기화 — 다른 메뉴 진입/복귀 시 검색이 리셋되도록 */
  useEffect(() => () => {
    if (useMatchStore.getState().filters.clientName) {
      useMatchStore.getState().setFilter('clientName', '');
    }
  }, []);

  /* Auto-focus search input when panel opens */
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  /* 탭은 주 상태축 — status 한 곳만 갱신하면 하이라이트는 파생으로 따라온다. */
  const activeTab = tabFromStatus(filters.status);
  const handleTabChange = (tab) => {
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

  /* Is any sheet filter non-default? (매칭 상태는 탭이 담당하므로 제외) */
  const hasActiveFilter = Boolean(filters.managerId);

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
            aria-label="매칭 만들기"
          >
            매칭 만들기
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
        <EmptyState
          icon={Heart}
          title={
            (searchInput || filters.status || filters.managerId)
              ? '검색 결과가 없습니다.'
              : '매칭 내역이 없습니다.'
          }
        />
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
          onCreated={(matchId) => {
            closeCreateModal();
            if (matchId) {
              navigate(`/dashboard/matches/${matchId}`);
            } else {
              fetchMatches();
            }
          }}
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
          {client.birthDate && <span>{birthYearLabelFromDate(client.birthDate)}</span>}
          {client.birthDate && client.occupation && <span className={styles.wizMetaDot}>·</span>}
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
          {client.birthDate && <span>{birthYearLabelFromDate(client.birthDate)}</span>}
          {client.birthDate && client.occupation && <span className={styles.wizMetaDot}>·</span>}
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

const DEFAULT_PAYMENT_AMOUNT = 29900;

const normalizeAmountInput = (raw) => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits === '') return '';
  const stripped = digits.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
};

function PaymentAmountField({ label, mode, setMode, custom, setCustom }) {
  const [expanded, setExpanded] = useState(mode !== 'default');
  const [pendingFree, setPendingFree] = useState(false);

  const isCollapsed = !expanded && mode === 'default';
  const effectiveMode = pendingFree ? 'free' : mode;
  const customDisplay = custom === '' ? '' : Number(custom).toLocaleString('ko-KR');
  const customNum = custom === '' ? null : Number(custom);
  const customExceedsCap = customNum !== null && customNum >= DEFAULT_PAYMENT_AMOUNT;

  const handleSelectFree = () => {
    if (mode === 'free') return;
    setPendingFree(true);
  };

  const confirmFree = () => {
    setMode('free');
    setPendingFree(false);
  };

  const resetToDefault = () => {
    setMode('default');
    setCustom('');
    setPendingFree(false);
    setExpanded(false);
  };

  return (
    <div className={styles.wizPaymentRow}>
      <span className={styles.wizPaymentRowLabel}>{label}</span>

      {isCollapsed ? (
        <div className={styles.wizPaymentCollapsed}>
          <span
            className={`${styles.wizPaymentChip} ${styles.wizPaymentChipActive} ${styles.wizPaymentChipStatic}`}
            aria-label={`${label} 기본 ${DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 적용 중`}
          >
            기본 {DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원
          </span>
          <button
            type="button"
            className={styles.wizPaymentMoreLink}
            onClick={() => setExpanded(true)}
          >
            다른 금액
            <ChevronDown size={13} strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <>
          <div className={styles.wizPaymentChips}>
            <button
              type="button"
              aria-pressed={effectiveMode === 'default'}
              className={`${styles.wizPaymentChip} ${effectiveMode === 'default' ? styles.wizPaymentChipActive : ''}`}
              onClick={() => { setMode('default'); setPendingFree(false); }}
            >
              기본 {DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원
            </button>
            <button
              type="button"
              aria-pressed={effectiveMode === 'free'}
              className={`${styles.wizPaymentChip} ${effectiveMode === 'free' ? styles.wizPaymentChipActive : ''}`}
              onClick={handleSelectFree}
            >
              무료
            </button>
            <button
              type="button"
              aria-pressed={effectiveMode === 'custom'}
              className={`${styles.wizPaymentChip} ${effectiveMode === 'custom' ? styles.wizPaymentChipActive : ''}`}
              onClick={() => { setMode('custom'); setPendingFree(false); }}
            >
              직접 입력
            </button>
          </div>
          {pendingFree && (
            <div className={styles.wizPaymentConfirm} role="alertdialog" aria-label="무료 진행 확인">
              <span className={styles.wizPaymentConfirmText}>
                지인 등 특별한 사유가 있는 경우에만 무료로 진행해주세요.
              </span>
              <div className={styles.wizPaymentConfirmActions}>
                <button
                  type="button"
                  className={styles.wizPaymentConfirmCancel}
                  onClick={() => setPendingFree(false)}
                >
                  취소
                </button>
                <button
                  type="button"
                  className={styles.wizPaymentConfirmOk}
                  onClick={confirmFree}
                >
                  무료로 진행
                </button>
              </div>
            </div>
          )}
          {mode !== 'default' && !pendingFree && (
            <button
              type="button"
              className={styles.wizPaymentResetLink}
              onClick={resetToDefault}
            >
              기본 {DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원으로 되돌리기
            </button>
          )}
        </>
      )}

      {effectiveMode === 'custom' && (
        <>
          <div
            className={`${styles.wizPaymentInputWrap} ${customExceedsCap ? styles.wizPaymentInputInvalid : ''}`}
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9,]*"
              value={customDisplay}
              onChange={(e) => setCustom(normalizeAmountInput(e.target.value))}
              placeholder="예: 9,900"
              className={styles.wizPaymentInput}
              aria-label={`${label} 결제 금액`}
              aria-invalid={customExceedsCap || undefined}
            />
            <span className={styles.wizPaymentInputUnit}>원</span>
          </div>
          <span
            className={`${styles.wizPaymentHint} ${customExceedsCap ? styles.wizPaymentHintError : ''}`}
          >
            {customExceedsCap
              ? `기본 ${DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 미만으로 입력해주세요.`
              : `기본 ${DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 미만으로 설정할 수 있어요.`}
          </span>
        </>
      )}
    </div>
  );
}

function CreateMatchModal({ onClose, onCreated, initialClientAId, initialClientBId }) {
  const [step,           setStep]           = useState(1);
  const [clientA,        setClientA]        = useState(null);
  const [clientB,        setClientB]        = useState(null);
  const [note,           setNote]           = useState('');
  const [proposerMessage, setProposerMessage] = useState('');
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
            birthDate: c.birthDate || c.clientBirthDate,
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

  /* ── Duplicate / history / active-match checks ──
     전체 매칭을 한 페이지(size 200)만 받아 검사하면, 운영처럼 매칭이 200건을 넘게
     쌓인 순간 그 윈도우 밖의 과거 매칭이 누락돼 중복/이력 경고가 안 뜬다(게다가
     clientId 없이 호출하면 본인이 만든 매칭으로만 스코프돼 타 매니저 매칭은 못 봄).
     → 선택한 회원이 낀 매칭만 clientId 필터로 "전 페이지 끝까지" 조회한다. size
        상한에 기대지 않고 pagination.totalPages 만큼 순회하므로 한 회원의 매칭이
        아무리 많아도 누락이 없고(=200 cap 재발 방지), clientId 필터는 매니저
        스코프도 무시해 어떤 매니저가 만든 매칭이든 중복으로 잡힌다. */
  useEffect(() => {
    if (!clientA && !clientB) {
      setDuplicateMatch(null);
      setActiveMatches({ A: [], B: [], deletedA: [], deletedB: [] });
      setPairHistory([]);
      return;
    }
    let cancelled = false;
    const activeStatuses = ['draft', 'proposal_sent', 'proposal_accepted', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled'];
    // clientId로 좁힌 매칭을 전 페이지 끝까지 모은다(silent cap 없음).
    const fetchSide = async (id) => {
      if (!id) return [];
      const PAGE_SIZE = 200;
      const acc = [];
      for (let page = 0; !cancelled; page += 1) {
        const res = await matchService.listMatches({ clientId: id, size: PAGE_SIZE, page });
        const chunk = res.data || res.matches || [];
        acc.push(...chunk);
        const totalPages = res.pagination?.totalPages;
        // pagination 메타가 있으면 그걸로, 없으면 "가득 찬 페이지였는지"로 다음 페이지 유무 판단.
        const hasMore = totalPages != null ? page + 1 < totalPages : chunk.length === PAGE_SIZE;
        if (!hasMore) break;
      }
      return acc;
    };

    Promise.all([fetchSide(clientA?.id), fetchSide(clientB?.id)]).then(([aMatches, bMatches]) => {
      if (cancelled) return;

      if (clientA && clientB) {
        // A의 매칭 전체를 받았으므로 그 안에서 A·B 둘 다 낀 건이 이 쌍의 과거 이력 전부.
        const pairMatches = aMatches.filter((m) => {
          const ids = [m.clientA.clientId, m.clientB.clientId];
          return ids.includes(clientA.id) && ids.includes(clientB.id);
        });
        // 진행 중·완료 매칭은 기존대로 차단. cancelled 는 '거절로 인한 취소'만 차단하고
        // (한쪽이라도 프로포절을 거절한 이력) 매니저 수동 취소는 차단하지 않는다(아래 경고만).
        const isRejected = (m) => m.clientA.response === 'rejected' || m.clientB.response === 'rejected';
        const dup = pairMatches.find((m) => m.status !== 'cancelled' || isRejected(m));
        setDuplicateMatch(dup || null);

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
        setDuplicateMatch(null);
        setPairHistory([]);
      }

      const findActive = (matches, clientId) => {
        if (!clientId) return { normal: [], deleted: [] };
        const all = matches.filter((m) =>
          activeStatuses.includes(m.status) &&
          (m.clientA.clientId === clientId || m.clientB.clientId === clientId)
        );
        const normal  = all.filter((m) => !m.clientA.deleted && !m.clientB.deleted);
        const deleted = all.filter((m) => m.clientA.deleted || m.clientB.deleted);
        return { normal, deleted };
      };
      const activeA = findActive(aMatches, clientA?.id);
      const activeB = findActive(bMatches, clientB?.id);
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
    if (n >= DEFAULT_PAYMENT_AMOUNT) return NaN;  // 직접입력은 기본 금액 미만만 허용
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
      toast.error(`직접입력 결제 금액은 0 이상 ${DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 미만이어야 합니다.`);
      return;
    }
    setSubmitting(true);
    try {
      const created = await matchService.createMatch({
        clientAId: clientA.id,
        clientBId: clientB.id,
        note,
        proposerMessage,
        paymentAmountA,
        paymentAmountB,
      });
      toast.success('매칭이 생성되었습니다.');
      onCreated(created?.matchId);
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
          {step > 1 ? (
            <button
              type="button"
              className={styles.wizNavBtn}
              onClick={() => { setStep((s) => s - 1); setSearchQuery(''); setSearchResults([]); }}
              aria-label="이전 단계"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>
          ) : (
            <span className={styles.wizNavBtnPlaceholder} aria-hidden="true" />
          )}
          <div className={styles.wizHeaderCenter}>
            <span className={styles.wizHeaderTitle}>새 매칭 · {step}/3</span>
            <span className={styles.wizHeaderSub}>{stepTitle}</span>
          </div>
          <button
            type="button"
            className={styles.wizNavBtn}
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={18} strokeWidth={2} />
          </button>
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
                  {clientA.birthDate && <span className={styles.wizPairAge}>{birthYearLabelFromDate(clientA.birthDate)}</span>}
                </div>
                <span className={styles.wizPairHeart}>
                  <Heart size={18} strokeWidth={2} color="var(--tangerine-600)" />
                </span>
                <div className={styles.wizPairPerson}>
                  <MiniAvatar name={nameB} gender={clientB.gender} size={48} />
                  <span className={styles.wizPairName}>{nameB}</span>
                  {clientB.birthDate && <span className={styles.wizPairAge}>{birthYearLabelFromDate(clientB.birthDate)}</span>}
                </div>
              </div>

              {/* ── Warnings ── */}
              {duplicateMatch && (
                <div className={styles.duplicateWarn}>
                  <AlertTriangle size={14} strokeWidth={2} />
                  <span>
                    {duplicateMatch.status === 'cancelled'
                      ? '이전에 거절된 매칭 이력이 있어 다시 매칭할 수 없습니다'
                      : `이미 매칭된 적이 있는 회원입니다 (상태: ${STATUS_STEP_LABELS[duplicateMatch.status] || duplicateMatch.status})`}
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
                      <div className={styles.activeMatchClientHead}>
                        <span className={styles.activeMatchLabel}>{nameA}</span>
                        <span className={styles.activeMatchCount}>진행중인 매칭 {activeMatches.A.length}건</span>
                      </div>
                      <div className={styles.activeMatchLinks}>
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
                    </div>
                  )}
                  {activeMatches.B.length > 0 && (
                    <div className={styles.activeMatchClient}>
                      <div className={styles.activeMatchClientHead}>
                        <span className={styles.activeMatchLabel}>{nameB}</span>
                        <span className={styles.activeMatchCount}>진행중인 매칭 {activeMatches.B.length}건</span>
                      </div>
                      <div className={styles.activeMatchLinks}>
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
                  label="출생연도"
                  valA={birthYearLabelFromDate(clientA.birthDate)}
                  valB={birthYearLabelFromDate(clientB.birthDate)}
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
                    기본 {DEFAULT_PAYMENT_AMOUNT.toLocaleString('ko-KR')}원 권장
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

              {/* ── Proposer message (회원에게 노출) ── */}
              <div className={styles.wizNoteWrap}>
                <TextField
                  label={`${nameA}님께 보낼 한마디`}
                  required={false}
                  hint={`매칭 성사율을 높이고 싶다면 한마디를 남겨보세요. 제안 문자와 프로필 확인 화면 상단에 표시돼요. (${nameB}님에게는 보이지 않아요)`}
                  multiline
                  maxLength={100}
                  value={proposerMessage}
                  onChange={setProposerMessage}
                  placeholder="예) 오래 기다리셨죠? 꼭 맞을 분을 찾았어요. 한번 확인해보세요!"
                />
              </div>

              {/* ── Note (내부 메모 — 회원에게 안 보임) ── */}
              <div className={styles.wizNoteWrap}>
                <textarea
                  className={styles.wizNoteInput}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="내부 메모 (회원에게 보이지 않아요)"
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
