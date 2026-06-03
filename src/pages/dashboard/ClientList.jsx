import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, ChevronRight, Users, List, Grid2X2,
  X, Heart, AlertTriangle, SlidersHorizontal, Sparkles,
  Briefcase, Building2, MapPin, Clock, Star, ChevronDown, ChevronUp,
} from 'lucide-react';
import useClientListStore from '../../store/clientListStore';
import useConnectionStore from '../../store/connectionStore';
import { toast } from '../../store/toastStore';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import styles from './ClientList.module.css';

// ── 매칭 통계 헬퍼 ─────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
// 이 일수 이상 제안이 없으면 '방치'로 본다
const NEGLECT_DAYS = 7;

// 마지막 제안일(없으면 가입일) 기준 경과 일수
function getNeglectDays(client, stat) {
  const base = stat?.lastProposalAt || client.createdAt;
  if (!base) return null;
  const days = Math.floor((Date.now() - new Date(base).getTime()) / DAY_MS);
  return days >= 0 ? days : 0;
}

// 성사율 % — 매칭 2건 이상 + 성사율 50% 이상일 때만 배지로 노출
function getSuccessRate(stat) {
  if (!stat || stat.total < 2) return null;
  const pct = Math.round((stat.completed / stat.total) * 100);
  return pct >= 50 ? pct : null;
}

// 통계 배지 대상 여부 — 승인 완료 + 활동 중인 회원만
function isStatEligible(client) {
  return client.approvalStatus === 'approved' && (client.status || 'active') === 'active';
}

// ── 프로필 열람 기록 ────────────────────────────────────────
// 매니저가 어떤 회원 프로필을 열어봤는지 localStorage 에 기록해,
// '오늘의 회원' 선정 시 아직 안 본 회원을 우대하는 데 쓴다. (화면 노출 없음)
// (기기 단위 MVP — 매니저 계정 단위로 정확히 하려면 백엔드 열람 로그가 필요)
const VIEWS_KEY = 'clientList.viewedAt';
// 이 일수 이상 안 열어봤으면 다시 '미확인'으로 되돌린다
const VIEW_STALE_DAYS = 30;

function loadViews() {
  try {
    return JSON.parse(localStorage.getItem(VIEWS_KEY)) || {};
  } catch {
    return {};
  }
}

function recordView(clientId) {
  const views = loadViews();
  views[clientId] = Date.now();
  try {
    localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
  } catch { /* 저장 실패해도 동작에는 지장 없음 */ }
}

function isUnviewed(clientId, views) {
  const t = views[clientId];
  return !t || (Date.now() - t) > VIEW_STALE_DAYS * DAY_MS;
}

// ── 통계 배지 (방치일수 / 성사율) ───────────────────────────
function StatBadges({ client, stat, matchesLoaded }) {
  if (!matchesLoaded || !isStatEligible(client)) return null;

  const days = getNeglectDays(client, stat);
  const isServing = (stat?.active ?? client.activeMatchCount ?? 0) > 0;
  const showNeglect = !isServing && days != null && days >= NEGLECT_DAYS;
  const successPct = getSuccessRate(stat);

  if (!showNeglect && successPct == null) return null;

  return (
    <div className={styles.statBadgeRow}>
      {showNeglect && (
        <span className={`${styles.statBadge} ${styles.statNeglect}`}>
          <Clock size={10} strokeWidth={2.5} aria-hidden="true" />
          {days}일째 제안 없음
        </span>
      )}
      {successPct != null && (
        <span className={`${styles.statBadge} ${styles.statSuccess}`}>
          <Star size={10} strokeWidth={2.5} aria-hidden="true" />
          성사율 {successPct}%
        </span>
      )}
    </div>
  );
}

// ── '오늘의 회원' 로테이션 섹션 ─────────────────────────────
// 뒤 페이지에 묻혀 잘 안 보이는 회원에게 노출 기회를 주는 게 목적.
// 날짜 기반 시드라 하루 동안은 고정, 자정이 지나면 새 조합으로 바뀐다.

// 문자열 시드 → 0~1 의사난수 (FNV-1a)
function dailyRand(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function SpotlightSection({ pool, stats, views, genderFilter, matchesLoaded, onClientClick }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('clientList.spotlightCollapsed') === '1';
    } catch {
      return false;
    }
  });

  if (!matchesLoaded || !pool?.length) return null;

  const today = new Date().toISOString().slice(0, 10);
  const picks = pool
    .filter((c) => isStatEligible(c))
    .filter((c) => !genderFilter || c.gender === genderFilter)
    .filter((c) => (stats[c.id]?.active ?? 0) === 0) // 매칭 진행 중인 회원은 제외
    .map((c) => {
      const total = stats[c.id]?.total ?? 0;
      // 노출 가중 샘플링 (Efraimidis–Spirakis): 제안 이력이 적을수록 뽑힐 확률이 높지만
      // 순수 랜덤성이 섞여 있어 특정 회원만 반복 노출되지 않는다.
      // 매니저가 아직 열어보지 않은(미확인) 회원은 확률 2배 부스트.
      const weight = (1 / (1 + total)) * (isUnviewed(c.id, views) ? 2 : 1);
      return { client: c, total, key: dailyRand(`${today}:${c.id}`) ** (1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .slice(0, 10);

  if (picks.length === 0) return null;

  const toggle = () => {
    setCollapsed((v) => {
      try {
        localStorage.setItem('clientList.spotlightCollapsed', v ? '0' : '1');
      } catch { /* 저장 실패해도 동작에는 지장 없음 */ }
      return !v;
    });
  };

  return (
    <div className={styles.spotlightSection}>
      <button className={styles.spotlightHeader} onClick={toggle} type="button" aria-expanded={!collapsed}>
        <Sparkles size={13} strokeWidth={2.5} className={styles.spotlightHeaderIcon} aria-hidden="true" />
        <span className={styles.spotlightTitle}>오늘의 회원</span>
        <span className={styles.spotlightHint}>매일 새로 뽑아요</span>
        <span className={styles.spotlightToggle}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {!collapsed && (
        <div className={styles.spotlightScroll} role="list">
          {picks.map(({ client, total }) => (
            <div
              key={client.id}
              className={styles.spotlightCard}
              role="listitem"
              tabIndex={0}
              onClick={() => onClientClick(client)}
              onKeyDown={(e) => e.key === 'Enter' && onClientClick(client)}
            >
              <div className={styles.spotlightCardName}>
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
              </div>
              <div className={styles.spotlightCardMeta}>
                {client.age ? `${client.age}세` : ''}
                {client.age && client.occupation ? ' · ' : ''}
                {client.occupation || ''}
              </div>
              <span className={styles.spotlightChip}>
                {total === 0 ? '첫 제안 대기' : `제안 ${total}회`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────
function MatchStatusBadge({ client, matchesLoaded }) {
  if (client.approvalStatus === 'pending') {
    return <span className={`${styles.statusBadge} ${styles.statusPending}`}>승인대기</span>;
  }
  if (client.approvalStatus === 'rejected') {
    return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>승인거절</span>;
  }
  if ((client.status || 'active') !== 'active') {
    return <span className={`${styles.statusBadge} ${styles.statusInactive}`}>매칭불가</span>;
  }
  // 매칭 데이터 도착 전엔 중립 자리표시자 — '매칭가능'을 미리 보였다가 '매칭중'으로 뒤집히는 깜빡임 방지
  if (!matchesLoaded) {
    return <span className={`${styles.statusBadge} ${styles.statusLoading}`} aria-label="매칭 상태 확인 중" />;
  }
  if (client.activeMatchCount > 0) {
    return <span className={`${styles.statusBadge} ${styles.statusMatching}`}>매칭중</span>;
  }
  return <span className={`${styles.statusBadge} ${styles.statusAvailable}`}>매칭가능</span>;
}

// ── Row (normal density) ──────────────────────────────────
function ClientRow({ client, stat, onClick, isLast, selected, disabled, onToggleSelect, matchesLoaded }) {
  return (
    <div
      className={`${styles.row} ${isLast ? styles.rowLast : ''} ${selected ? styles.rowSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
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

        {/* Line 2: 💼 occupation · 🏢 company */}
        {(client.occupation || client.company) && (
          <div className={styles.rowLine2}>
            {client.occupation && (
              <span className={styles.rowJob}>
                <Briefcase size={11} strokeWidth={2} className={styles.rowFieldIcon} aria-hidden="true" />
                {client.occupation}
              </span>
            )}
            {client.occupation && client.company && (
              <span className={styles.rowSep}>·</span>
            )}
            {client.company && (
              <span className={styles.rowCompany}>{client.company}</span>
            )}
          </div>
        )}

        {/* Line 3: 🏢 근무지역 / 📍 거주지역 */}
        {(client.workLocation || client.location) && (
          <div className={styles.rowLine3}>
            {client.workLocation && (
              <span className={styles.rowRegion} title={`근무 지역: ${client.workLocation}`}>
                <Building2 size={12} strokeWidth={2} className={styles.rowFieldIcon} aria-hidden="true" />
                {client.workLocation}
              </span>
            )}
            {client.workLocation && client.location && (
              <span className={styles.rowSep}>/</span>
            )}
            {client.location && (
              <span className={styles.rowRegion} title={`거주 지역: ${client.location}`}>
                <MapPin size={12} strokeWidth={2} className={styles.rowFieldIcon} aria-hidden="true" />
                {client.location}
              </span>
            )}
          </div>
        )}

        {/* Line 4: 통계 배지 (방치일수 / 성사율) */}
        <StatBadges client={client} stat={stat} matchesLoaded={matchesLoaded} />
      </div>

      <div className={styles.rowRight}>
        <MatchStatusBadge client={client} matchesLoaded={matchesLoaded} />
        <button
          className={`${styles.selectCheck} ${selected ? styles.selectCheckOn : ''} ${disabled && !selected ? styles.selectCheckDisabled : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(client); }}
          aria-label={selected ? '선택 해제' : (disabled ? '같은 성별은 선택 불가' : '매칭 선택')}
          aria-pressed={selected}
          aria-disabled={disabled && !selected}
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
function ClientCard({ client, stat, onClick, selected, disabled, onToggleSelect, matchesLoaded }) {
  return (
    <div
      className={`${styles.cardItem} ${selected ? styles.cardItemSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Card header: 이름 블록(좌) · 상태배지 + 체크박스(우상단) */}
      <div className={styles.cardHeader}>
        <div className={styles.cardName}>
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
          {client.age && <span className={styles.rowAge}>{client.age}세</span>}
          {client.height && (
            <>
              <span className={styles.rowDot}>·</span>
              <span className={styles.rowHeight}>{client.height}cm</span>
            </>
          )}
        </div>
        <div className={styles.cardHeaderRight}>
          <MatchStatusBadge client={client} matchesLoaded={matchesLoaded} />
          <button
            className={`${styles.selectCheck} ${styles.cardCheck} ${selected ? styles.selectCheckOn : ''} ${disabled && !selected ? styles.selectCheckDisabled : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggleSelect(client); }}
            aria-label={selected ? '선택 해제' : (disabled ? '같은 성별은 선택 불가' : '매칭 선택')}
            aria-pressed={selected}
            aria-disabled={disabled && !selected}
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

      {/* Line 2: 💼 직업 */}
      {client.occupation && (
        <div className={styles.cardJob}>
          <Briefcase size={12} strokeWidth={2} className={styles.rowFieldIcon} aria-hidden="true" />
          {client.occupation}
        </div>
      )}

      {/* Line 3: 🏢 근무지역 / 📍 거주지역 */}
      {(client.workLocation || client.location) && (
        <div className={styles.cardChips}>
          {client.workLocation && (
            <span className={styles.rowRegion} title={`근무 지역: ${client.workLocation}`}>
              <Building2 size={12} strokeWidth={2} className={styles.rowFieldIcon} aria-hidden="true" />
              {client.workLocation}
            </span>
          )}
          {client.workLocation && client.location && (
            <span className={styles.rowSep}>/</span>
          )}
          {client.location && (
            <span className={styles.rowRegion} title={`거주 지역: ${client.location}`}>
              <MapPin size={12} strokeWidth={2} className={styles.rowFieldIcon} aria-hidden="true" />
              {client.location}
            </span>
          )}
        </div>
      )}

      {/* 통계 배지 (방치일수 / 성사율) */}
      <StatBadges client={client} stat={stat} matchesLoaded={matchesLoaded} />
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

  // '상태'와 '승인'은 매니저 머릿속에선 한 축이라 단일 상태 축으로 합친다.
  // 각 칩이 어떤 백엔드 파라미터(status / approval)를 거는지 함께 들고 있다.
  const stateChips = [
    { key: 'all',      label: '전체',    status: null,       approval: null },
    { key: 'pending',  label: '승인대기', status: null,       approval: 'pending' },
    { key: 'active',   label: '활성',    status: 'active',   approval: null },
    { key: 'inactive', label: '비활성',   status: 'inactive', approval: null },
    { key: 'dormant',  label: '휴면',    status: 'dormant',  approval: null },
    { key: 'rejected', label: '거절',    status: null,       approval: 'rejected' },
  ];

  // 현재 필터 → 활성 칩 key 역산 (승인 축이 status 축보다 우선)
  const activeStateKey =
    currentApproval === 'pending'  ? 'pending'  :
    currentApproval === 'rejected' ? 'rejected' :
    currentStatus   === 'active'   ? 'active'   :
    currentStatus   === 'inactive' ? 'inactive' :
    currentStatus   === 'dormant'  ? 'dormant'  : 'all';

  const applyState = (chip) => {
    // 활성 칩을 다시 누르면 해제(=전체)
    const turnOff = activeStateKey === chip.key && chip.key !== 'all';
    setFilter('status',   turnOff ? null : chip.status);
    setFilter('approval', turnOff ? null : chip.approval);
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

        {/* Section: 상태 (승인+활성/비활성 단일 축) */}
        <div className={styles.sheetSection}>
          <span className={styles.sheetKicker}>상태</span>
          <div className={styles.chipRow}>
            {stateChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                aria-pressed={activeStateKey === chip.key}
                className={`${styles.filterChip} ${activeStateKey === chip.key ? styles.filterChipActive : ''}`}
                onClick={() => applyState(chip)}
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
    page, limit, filters, isLoading, error, matchesLoaded,
    matchStats, statsPool,
    setFilter, setPage, fetchClients,
  } = useClientListStore();
  const { connections, fetchConnections } = useConnectionStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // All hooks before any early return
  const [density, setDensity] = useState('list'); // list | card
  const [nameInput, setNameInput] = useState(filters.name || '');
  // 선택된 회원(최대 2명) — 페이지 이동 시에도 유지되도록 ID가 아닌 객체 전체를 보관한다.
  const [selectedClients, setSelectedClients] = useState([]);
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
    // 검색어를 URL(?name=)에 반영 → 상세를 다녀와도(뒤로가기) 검색이 복원되고,
    // 새로고침·링크공유에도 검색 상태가 유지된다.
    const next = new URLSearchParams(searchParams);
    if (v) next.set('name', v); else next.delete('name');
    setSearchParams(next, { replace: true });
  };

  // 프로필 열람 기록 (방문 도장) — 컴포넌트 마운트 시 localStorage 에서 1회 로드.
  // 상세를 다녀오면 목록이 리마운트되므로 초기화 함수가 최신 기록을 다시 읽는다.
  const [views] = useState(loadViews);

  const handleRowClick = (client) => {
    recordView(client.id); // 방문 도장 — 다음 진입부터 '미확인' 배지 해제
    navigate(`/dashboard/clients/${client.id}`);
  };

  const handleToggleSelect = (client) => {
    setSelectedClients((prev) => {
      if (prev.some((c) => c.id === client.id)) {
        return prev.filter((c) => c.id !== client.id);
      }
      // 같은 성별 2명은 매칭할 수 없으므로 선택 자체를 차단한다.
      if (prev.length === 1 && prev[0].gender === client.gender) {
        toast.warning('성별이 다른 회원만 매칭할 수 있어요.');
        return prev;
      }
      if (prev.length >= 2) return [prev[1], client];
      return [...prev, client];
    });
  };

  const selectedIdSet = new Set(selectedClients.map((c) => c.id));
  const lockedGender = selectedClients.length === 1 ? selectedClients[0].gender : null;

  const handleCreateMatchFromSelection = () => {
    const [a, b] = selectedClients;
    if (!a || !b) return;
    if (a.gender === b.gender) {
      toast.warning('성별이 다른 회원만 매칭할 수 있어요.');
      return;
    }
    navigate(`/dashboard/matches?create=1&clientA=${a.id}&clientB=${b.id}`);
  };

  // Toggle search panel — close filter if open
  const toggleSearch = () => {
    setFilterOpen(false);
    setSearchOpen((v) => {
      if (v) {
        setNameInput('');
        setFilter('name', null);
        const next = new URLSearchParams(searchParams);
        next.delete('name');
        setSearchParams(next, { replace: true });
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

  // 진입 시 검색어는 URL(?name=) 을 기준으로 맞춘다.
  //  · 상세에서 뒤로가기로 오면 ?name= 이 살아있어 검색이 복원된다.
  //  · 다른 탭에서 새로 들어오면 쿼리가 없어(=깨끗한 경로) store 에 남아있던 검색어를 비운다.
  useEffect(() => {
    const urlName = searchParams.get('name') || '';
    setNameInput(urlName);
    if ((filters.name || '') !== urlName) setFilter('name', urlName || null);
    if (urlName) setSearchOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {totalCount > 0 && (
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

          {/* 초대 링크 — ink-900 */}
          <button
            className={styles.addBtn}
            aria-label="초대 링크"
            title="초대 링크"
            type="button"
            onClick={() => navigate('/dashboard/invites')}
          >
            <Sparkles size={18} />
            <span>초대 링크</span>
          </button>
        </div>
      </div>

      {/* ── KPI strip ── */}
      {totalCount > 0 && (
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

      {/* ── '오늘의 회원' 로테이션 ── */}
      <SpotlightSection
        pool={statsPool}
        stats={matchStats}
        views={views}
        genderFilter={filters.gender}
        matchesLoaded={matchesLoaded}
        onClientClick={handleRowClick}
      />

      {/* ── Sort + density ── */}
      <div className={styles.sortRow}>
        <div className={styles.sortBtns}>
          {[
            { value: 'createdAt:desc', label: '최근' },
            { value: 'neglect:desc',   label: '미제안순' },
            { value: 'success:desc',   label: '성사율' },
            { value: 'birthDate:asc',  label: '나이순' },
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
        <EmptyState
          icon={Users}
          title="등록된 회원이 없습니다"
          hint={
            filters.name || filters.gender || filters.status || filters.approval
              ? '검색 조건을 바꿔 다시 시도해보세요.'
              : '초대 링크를 발송해 회원을 추가하세요.'
          }
        />
      ) : (
        <>
          {density === 'card' ? (
            <div className={styles.cardGrid}>
              {clients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  stat={matchStats[client.id]}
                  onClick={() => handleRowClick(client)}
                  selected={selectedIdSet.has(client.id)}
                  disabled={lockedGender !== null && client.gender === lockedGender && !selectedIdSet.has(client.id)}
                  onToggleSelect={handleToggleSelect}
                  matchesLoaded={matchesLoaded}
                />
              ))}
            </div>
          ) : (
            <div className={styles.listWrap}>
              {clients.map((client, i) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  stat={matchStats[client.id]}
                  onClick={() => handleRowClick(client)}
                  isLast={i === clients.length - 1}
                  selected={selectedIdSet.has(client.id)}
                  disabled={lockedGender !== null && client.gender === lockedGender && !selectedIdSet.has(client.id)}
                  onToggleSelect={handleToggleSelect}
                  matchesLoaded={matchesLoaded}
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
      {selectedClients.length > 0 && (
        <SelectionBar
          selectedClients={selectedClients}
          onClear={() => setSelectedClients([])}
          onCreateMatch={handleCreateMatchFromSelection}
        />
      )}
    </div>
  );
}
