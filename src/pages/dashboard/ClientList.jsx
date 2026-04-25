import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, ChevronRight, Users, List, Grid2X2,
  X, Heart, AlertTriangle, SlidersHorizontal,
} from 'lucide-react';
import useClientListStore from '../../store/clientListStore';
import useConnectionStore from '../../store/connectionStore';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import styles from './ClientList.module.css';

// ── Avatar ──────────────────────────────────────────────
function ClientAvatar({ client, size = 36 }) {
  const isMale = client.gender === 'male';
  const bg = isMale ? 'var(--male-100)' : 'var(--female-100)';
  const fg = isMale ? '#2A5CC7' : '#B73673';
  const initial = client.name ? client.name.slice(1) : '?';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, color: fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 700,
        letterSpacing: '-0.02em', flexShrink: 0,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {initial}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────
function MatchStatusBadge({ client }) {
  if (client.approvalStatus === 'pending') {
    return <span className={`${styles.statusBadge} ${styles.statusPending}`}>승인대기</span>;
  }
  if (client.approvalStatus === 'rejected') {
    return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>승인거절</span>;
  }
  if ((client.status || 'active') !== 'active') {
    return <span className={`${styles.statusBadge} ${styles.statusInactive}`}>매칭불가</span>;
  }
  if (client.activeMatchCount > 0) {
    return <span className={`${styles.statusBadge} ${styles.statusMatching}`}>매칭중</span>;
  }
  return <span className={`${styles.statusBadge} ${styles.statusAvailable}`}>매칭가능</span>;
}

// ── Row (normal density) ──────────────────────────────────
function ClientRow({ client, onClick, isLast, selected, onToggleSelect }) {
  return (
    <div
      className={`${styles.row} ${isLast ? styles.rowLast : ''} ${selected ? styles.rowSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <ClientAvatar client={client} size={36} />

      <div className={styles.rowInfo}>
        {/* Line 1: name · gender badge · age · height */}
        <div className={styles.rowLine1}>
          <span className={styles.rowName}>{client.name}</span>
          {client.nickname && <span className={styles.rowNickname}>{client.nickname}</span>}
          <span
            className={styles.genderBadge}
            style={{
              background: client.gender === 'male' ? '#DCE8FF' : '#FFD9EA',
              color: client.gender === 'male' ? '#2A5CC7' : '#B73673',
            }}
          >
            {client.gender === 'male' ? '남' : '여'}
          </span>
          {client.age && (
            <span className={styles.rowAge}>{client.age}세</span>
          )}
          {client.height && (
            <>
              <span className={styles.rowDot}>·</span>
              <span className={styles.rowHeight}>{client.height}cm</span>
            </>
          )}
        </div>

        {/* Line 2: occupation · company */}
        {(client.occupation || client.company) && (
          <div className={styles.rowLine2}>
            <span className={styles.rowJob}>
              {client.occupation}
            </span>
            {client.occupation && client.company && (
              <span className={styles.rowSep}>·</span>
            )}
            <span className={styles.rowCompany}>{client.company}</span>
          </div>
        )}

        {/* Line 3: location · MBTI · religion */}
        <div className={styles.rowLine3}>
          {client.location && (
            <span className={styles.tagNeutral}>{client.location}</span>
          )}
          {client.mbti && (
            <span className={styles.tagMbti}>{client.mbti}</span>
          )}
          {client.religion && (
            <span className={styles.tagNeutral}>{client.religion}</span>
          )}
        </div>
      </div>

      <div className={styles.rowRight}>
        <MatchStatusBadge client={client} />
        <button
          className={`${styles.selectCheck} ${selected ? styles.selectCheckOn : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(client); }}
          aria-label={selected ? '선택 해제' : '매칭 선택'}
          aria-pressed={selected}
          type="button"
        >
          {selected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
              <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <ChevronRight size={15} className={styles.chevron} />
      </div>
    </div>
  );
}

// ── Card (grid thumbnail) ─────────────────────────────────
function ClientCard({ client, onClick, selected, onToggleSelect }) {
  return (
    <div
      className={`${styles.cardItem} ${selected ? styles.cardItemSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Card header: avatar left, status + checkbox right */}
      <div className={styles.cardHeader}>
        <ClientAvatar client={client} size={48} />
        <div className={styles.cardHeaderRight}>
          <MatchStatusBadge client={client} />
          <button
            className={`${styles.selectCheck} ${styles.cardCheck} ${selected ? styles.selectCheckOn : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(client); }}
            aria-label={selected ? '선택 해제' : '매칭 선택'}
            aria-pressed={selected}
            type="button"
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Name + gender chip + age */}
      <div className={styles.cardName}>
        <span className={styles.rowName}>{client.name}</span>
        <span
          className={styles.genderBadge}
          style={{
            background: client.gender === 'male' ? '#DCE8FF' : '#FFD9EA',
            color: client.gender === 'male' ? '#2A5CC7' : '#B73673',
          }}
        >
          {client.gender === 'male' ? '남' : '여'}
        </span>
        {client.age && <span className={styles.rowAge}>{client.age}세</span>}
      </div>

      {/* Job (truncated) */}
      {client.occupation && (
        <div className={styles.cardJob}>{client.occupation}</div>
      )}

      {/* Bottom chips: region · MBTI */}
      <div className={styles.cardChips}>
        {client.location && (
          <span className={styles.tagNeutral}>{client.location}</span>
        )}
        {client.mbti && (
          <span className={styles.tagMbti}>{client.mbti}</span>
        )}
      </div>
    </div>
  );
}

// ── Floating selection bar (portaled) ─────────────────────
function SelectionBar({ selectedClients, onClear, onCreateMatch }) {
  const [a, b] = selectedClients;
  const sameGender = a && b && a.gender === b.gender;
  const canMatch = a && b && !sameGender;

  return createPortal(
    <div className={styles.selectionBar} role="status" aria-live="polite">
      {sameGender && (
        <div className={styles.selectionSameGender}>
          <AlertTriangle size={11} strokeWidth={2.5} />
          같은 성별입니다
        </div>
      )}
      <div className={styles.selectionBarRow}>
        {/* Overlapping avatars */}
        <div className={styles.selectionAvatars}>
          {a && (
            <div
              className={styles.selectionAvatar}
              style={{
                background: a.gender === 'male' ? 'var(--male-100)' : 'var(--female-100)',
                color: a.gender === 'male' ? '#2A5CC7' : '#B73673',
              }}
            >
              {a.name ? a.name.slice(1) : '?'}
            </div>
          )}
          {b && (
            <div
              className={`${styles.selectionAvatar} ${styles.selectionAvatarB}`}
              style={{
                background: b.gender === 'male' ? 'var(--male-100)' : 'var(--female-100)',
                color: b.gender === 'male' ? '#2A5CC7' : '#B73673',
              }}
            >
              {b.name ? b.name.slice(1) : '?'}
            </div>
          )}
        </div>

        {/* Names */}
        <div className={styles.selectionNames}>
          <span className={styles.selectionNameText}>
            {a ? a.name : '?'}
            {b
              ? <><span className={styles.selectionArrow}>↔</span>{b.name}</>
              : <span className={styles.selectionMore}> · 한 명 더</span>}
          </span>
          {a && b && (
            <span className={styles.selectionMeta}>
              {a.age ? `${a.age}세` : ''}{a.occupation ? ` · ${a.occupation}` : ''}
              {' ↔ '}
              {b.age ? `${b.age}세` : ''}{b.occupation ? ` · ${b.occupation}` : ''}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          className={styles.selectionMatchBtn}
          onClick={onCreateMatch}
          disabled={!canMatch}
          type="button"
          aria-label="매칭 생성"
        >
          <Heart size={13} strokeWidth={2} />
          매칭 선택
        </button>

        {/* Clear */}
        <button
          className={styles.selectionClearBtn}
          onClick={onClear}
          type="button"
          aria-label="선택 초기화"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>,
    document.body
  );
}

// ── Filter Bottom Sheet (portaled) ────────────────────────
function FilterSheet({ open, onClose, filters, setFilter, connections }) {
  // Escape key
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Body scroll lock (preserve original value)
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Chips apply live directly to filters — no draft state needed.
  // Active state is read from filters prop, which re-renders the sheet immediately.
  const applyField = useCallback((key, value) => {
    setFilter(key, value === 'all' || value === '' ? (key === 'owner' ? 'all' : null) : value);
  }, [setFilter]);

  const handleReset = () => {
    setFilter('owner', 'all');
    setFilter('gender', null);
    setFilter('status', null);
    setFilter('approval', null);
  };

  // Derive current values from filters prop
  const currentOwner    = filters.owner    || 'all';
  const currentGender   = filters.gender   || '';
  const currentStatus   = filters.status   || '';
  const currentApproval = filters.approval || '';

  if (!open) return null;

  // Chip rows
  const ownerChips = [
    { value: 'all', label: '전체' },
    { value: 'me', label: '내 회원' },
    ...(connections.length <= 5
      ? connections.map((c) => ({ value: String(c.managerId || c.id), label: c.name || c.email }))
      : []),
  ];
  const useSelectForOwner = connections.length > 5;

  const genderChips = [
    { value: '', label: '전체' },
    { value: 'male', label: '남성' },
    { value: 'female', label: '여성' },
  ];

  const statusChips = [
    { value: '', label: '전체' },
    { value: 'active', label: '활성' },
    { value: 'inactive', label: '비활성' },
    { value: 'dormant', label: '휴면' },
  ];

  const approvalChips = [
    { value: '', label: '전체' },
    { value: 'pending', label: '승인대기' },
    { value: 'approved', label: '승인됨' },
    { value: 'rejected', label: '거절됨' },
  ];

  return createPortal(
    <div
      className={styles.sheetOverlay}
      onClick={onClose}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-filter-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className={styles.sheetHandle} />

        {/* Title */}
        <h2 id="client-filter-sheet-title" className={styles.sheetTitle}>필터</h2>

        {/* Section: 담당자 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>담당자</span>
          {useSelectForOwner ? (
            <select
              className={styles.sheetSelect}
              value={currentOwner}
              onChange={(e) => applyField('owner', e.target.value)}
              aria-label="담당자 필터"
            >
              <option value="all">전체</option>
              <option value="me">내 회원</option>
              {connections.map((c) => (
                <option key={c.managerId || c.id} value={String(c.managerId || c.id)}>
                  {c.name || c.email}
                </option>
              ))}
            </select>
          ) : (
            <div className={styles.chipRow}>
              {ownerChips.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={currentOwner === chip.value}
                  className={`${styles.filterChip} ${currentOwner === chip.value ? styles.filterChipActive : ''}`}
                  onClick={() => applyField('owner', chip.value)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section: 성별 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>성별</span>
          <div className={styles.chipRow}>
            {genderChips.map((chip) => (
              <button
                key={chip.value || 'all'}
                type="button"
                aria-pressed={currentGender === chip.value}
                className={`${styles.filterChip} ${currentGender === chip.value ? styles.filterChipActive : ''}`}
                onClick={() => applyField('gender', chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section: 상태 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>상태</span>
          <div className={styles.chipRow}>
            {statusChips.map((chip) => (
              <button
                key={chip.value || 'all'}
                type="button"
                aria-pressed={currentStatus === chip.value}
                className={`${styles.filterChip} ${currentStatus === chip.value ? styles.filterChipActive : ''}`}
                onClick={() => applyField('status', chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section: 승인 */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>승인</span>
          <div className={styles.chipRow}>
            {approvalChips.map((chip) => (
              <button
                key={chip.value || 'all'}
                type="button"
                aria-pressed={currentApproval === chip.value}
                className={`${styles.filterChip} ${currentApproval === chip.value ? styles.filterChipActive : ''}`}
                onClick={() => applyField('approval', chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

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
            적용
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main component ────────────────────────────────────────
export default function ClientList() {
  const {
    clients, totalCount, filteredCount, genderCounts,
    page, limit, filters, isLoading, error,
    setFilter, setPage, fetchClients,
  } = useClientListStore();
  const { connections, fetchConnections } = useConnectionStore();
  const navigate = useNavigate();

  // All hooks before any early return
  const [density, setDensity] = useState('list'); // list | card
  const [nameInput, setNameInput] = useState(filters.name || '');
  const [selectedIds, setSelectedIds] = useState([]); // max 2
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  const debouncedSetFilter = useCallback((key, value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setFilter(key, value), 300);
  }, [setFilter]);

  const handleNameChange = (e) => {
    const v = e.target.value;
    setNameInput(v);
    debouncedSetFilter('name', v);
  };

  const handleRowClick = (client) => {
    navigate(`/dashboard/clients/${client.id}`);
  };

  const handleToggleSelect = (client) => {
    setSelectedIds((prev) => {
      if (prev.includes(client.id)) return prev.filter((id) => id !== client.id);
      if (prev.length >= 2) return [prev[1], client.id];
      return [...prev, client.id];
    });
  };

  // Prune stale selections when the visible client list changes (page/filter)
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.length === 0) return prev;
      const visibleIds = new Set(clients.map((c) => c.id));
      const next = prev.filter((id) => visibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [clients]);

  const selectedClients = selectedIds
    .map((id) => clients.find((c) => c.id === id))
    .filter(Boolean);

  const handleCreateMatchFromSelection = () => {
    const [a, b] = selectedClients;
    if (!a || !b) return;
    navigate(`/dashboard/matches?create=1&clientA=${a.id}&clientB=${b.id}`);
  };

  // Toggle search panel — close filter if open
  const toggleSearch = () => {
    setFilterOpen(false);
    setSearchOpen((v) => {
      if (v) {
        setNameInput('');
        setFilter('name', null);
      }
      return !v;
    });
  };

  // Toggle filter sheet — close search if open
  const toggleFilter = () => {
    setSearchOpen(false);
    setFilterOpen((v) => !v);
  };

  const handleFilterSheetClose = useCallback(() => setFilterOpen(false), []);

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    fetchClients();
    fetchConnections();
  }, [page, filters, fetchClients, fetchConnections]);

  const totalPages = Math.ceil(filteredCount / limit);

  // Is any non-default filter applied?
  const hasActiveFilter = Boolean(
    (filters.owner && filters.owner !== 'all') ||
    filters.gender ||
    filters.status ||
    filters.approval
  );

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>회원</h1>
          {!isLoading && totalCount > 0 && (
            <div className={styles.titleSub}>
              총 {totalCount}명
              <span className={styles.dotSep}>·</span>
              남 {genderCounts.male}
              <span className={styles.dotSep}>·</span>
              여 {genderCounts.female}
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          {/* Search icon button */}
          <button
            type="button"
            className={`${styles.iconBtn} ${searchOpen ? styles.iconBtnActive : ''}`}
            onClick={toggleSearch}
            aria-label="이름 검색"
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

          {/* 회원 등록 — ink-900 */}
          <button
            className={styles.addBtn}
            aria-label="회원 등록"
            title="회원 등록"
            type="button"
          >
            <Plus size={18} />
            <span>회원 등록</span>
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      {!isLoading && totalCount > 0 && (
        <div className={styles.kpiStrip}>
          <button
            className={`${styles.kpiCard} ${!filters.gender ? styles.kpiCardActive : ''}`}
            onClick={() => setFilter('gender', null)}
            type="button"
          >
            <span className={styles.kpiNum}>{totalCount}</span>
            <span className={styles.kpiLabel}>전체</span>
          </button>
          <button
            className={`${styles.kpiCard} ${filters.gender === 'male' ? styles.kpiCardActive : ''}`}
            onClick={() => setFilter('gender', filters.gender === 'male' ? null : 'male')}
            type="button"
          >
            <span className={`${styles.kpiNum} ${styles.kpiNumMale}`}>{genderCounts.male}</span>
            <span className={styles.kpiLabel}>남성</span>
          </button>
          <button
            className={`${styles.kpiCard} ${filters.gender === 'female' ? styles.kpiCardActive : ''}`}
            onClick={() => setFilter('gender', filters.gender === 'female' ? null : 'female')}
            type="button"
          >
            <span className={`${styles.kpiNum} ${styles.kpiNumFemale}`}>{genderCounts.female}</span>
            <span className={styles.kpiLabel}>여성</span>
          </button>
        </div>
      )}

      {/* ── Inline search panel (slide-down) ── */}
      {searchOpen && (
        <div className={styles.searchPanel}>
          <div className={styles.searchPillBox}>
            <Search size={14} className={styles.searchPillIcon} strokeWidth={2} aria-hidden="true" />
            <input
              ref={searchInputRef}
              className={styles.searchPillInput}
              type="text"
              value={nameInput}
              onChange={handleNameChange}
              placeholder="이름 / 별명 검색…"
              aria-label="회원 검색"
            />
            {nameInput && (
              <button
                className={styles.searchPillClear}
                onClick={() => { setNameInput(''); setFilter('name', null); }}
                type="button"
                aria-label="검색어 지우기"
              >
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Sort + density ── */}
      <div className={styles.sortRow}>
        <div className={styles.sortBtns}>
          {[
            { value: 'createdAt:desc', label: '최근' },
            { value: 'birthDate:asc',  label: '나이순' },
            { value: 'name:asc',       label: '이름순' },
          ].map((s) => (
            <button
              key={s.value}
              className={`${styles.sortBtn} ${filters.sort === s.value ? styles.sortBtnActive : ''}`}
              onClick={() => setFilter('sort', s.value)}
              type="button"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className={styles.densityToggle} role="group" aria-label="목록 보기 방식">
          <button
            className={`${styles.densityBtn} ${density === 'list' ? styles.densityBtnActive : ''}`}
            onClick={() => setDensity('list')}
            aria-label="리스트 보기"
            aria-pressed={density === 'list'}
            title="리스트"
          >
            <List size={13} />
          </button>
          <button
            className={`${styles.densityBtn} ${density === 'card' ? styles.densityBtnActive : ''}`}
            onClick={() => setDensity('card')}
            aria-label="카드 보기"
            aria-pressed={density === 'card'}
            title="카드"
          >
            <Grid2X2 size={13} />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {error && (
        <div className={styles.errorMsg}>
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      )}

      {isLoading && clients.length === 0 ? (
        <SkeletonTable rows={6} columns={4} />
      ) : clients.length === 0 && !isLoading && !error ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Users size={28} strokeWidth={1.5} />
          </div>
          <p className={styles.emptyTitle}>등록된 회원이 없습니다</p>
          <p className={styles.emptyDesc}>
            {filters.name || filters.gender || filters.status || filters.approval
              ? '검색 조건을 바꿔 다시 시도해보세요.'
              : '회원 등록 버튼을 눌러 첫 번째 회원을 추가하세요.'}
          </p>
        </div>
      ) : (
        <>
          {density === 'card' ? (
            <div className={styles.cardGrid}>
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => handleRowClick(client)}
                  selected={selectedIds.includes(client.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          ) : (
            <div className={styles.listWrap}>
              {clients.map((client, i) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onClick={() => handleRowClick(client)}
                  isLast={i === clients.length - 1}
                  selected={selectedIds.includes(client.id)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* ── Filter Bottom Sheet (portaled) ── */}
      <FilterSheet
        open={filterOpen}
        onClose={handleFilterSheetClose}
        filters={filters}
        setFilter={setFilter}
        connections={connections}
      />

      {/* ── Floating selection bar (portaled) ── */}
      {selectedIds.length > 0 && (
        <SelectionBar
          selectedClients={selectedClients}
          onClear={() => setSelectedIds([])}
          onCreateMatch={handleCreateMatchFromSelection}
        />
      )}
    </div>
  );
}
