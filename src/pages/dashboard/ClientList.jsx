import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ChevronRight, Users, AlignJustify, Grid2X2 } from 'lucide-react';
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
function ClientRow({ client, onClick, isLast }) {
  return (
    <div
      className={`${styles.row} ${isLast ? styles.rowLast : ''}`}
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
        <ChevronRight size={15} className={styles.chevron} />
      </div>
    </div>
  );
}

// ── Compact row ───────────────────────────────────────────
function ClientRowCompact({ client, onClick, isLast }) {
  return (
    <div
      className={`${styles.rowCompact} ${isLast ? styles.rowLast : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <ClientAvatar client={client} size={28} />
      <span className={styles.rowCompactName}>{client.name}</span>
      {client.age && <span className={styles.rowCompactMeta}>{client.age}세</span>}
      {client.location && <span className={styles.rowCompactMeta}>{client.location}</span>}
      {client.occupation && <span className={styles.rowCompactJob}>{client.occupation}</span>}
      <MatchStatusBadge client={client} />
    </div>
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

  // Local UI state (not stored)
  const [density, setDensity] = useState('normal'); // normal | compact
  const [nameInput, setNameInput] = useState(filters.name);
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

  useEffect(() => {
    fetchClients();
    fetchConnections();
  }, [page, filters, fetchClients, fetchConnections]);

  const totalPages = Math.ceil(filteredCount / limit);

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
        <button
          className={styles.addBtn}
          aria-label="회원 등록"
          title="회원 등록"
        >
          <Plus size={18} />
          <span>회원 등록</span>
        </button>
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

      {/* ── Search ── */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} aria-hidden="true" />
          <input
            className={styles.searchInput}
            value={nameInput}
            onChange={handleNameChange}
            placeholder="이름 / 별명 검색"
            aria-label="회원 검색"
          />
        </div>
      </div>

      {/* ── Filter chips ── */}
      <div className={styles.filterChips}>
        <select
          className={`${styles.chip} ${filters.owner !== 'all' ? styles.chipActive : ''}`}
          value={filters.owner}
          onChange={(e) => setFilter('owner', e.target.value)}
          aria-label="담당자 필터"
        >
          <option value="all">담당자 전체</option>
          <option value="me">내 회원</option>
          {connections.map((conn) => (
            <option key={conn.managerId || conn.id} value={conn.managerId || conn.id}>
              {conn.name || conn.email}
            </option>
          ))}
        </select>

        <select
          className={`${styles.chip} ${filters.gender ? styles.chipActive : ''}`}
          value={filters.gender || ''}
          onChange={(e) => setFilter('gender', e.target.value || null)}
          aria-label="성별 필터"
        >
          <option value="">성별 전체</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>

        <select
          className={`${styles.chip} ${filters.status ? styles.chipActive : ''}`}
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value || null)}
          aria-label="상태 필터"
        >
          <option value="">상태 전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="dormant">휴면</option>
        </select>

        <select
          className={`${styles.chip} ${filters.approval ? styles.chipActive : ''}`}
          value={filters.approval || ''}
          onChange={(e) => setFilter('approval', e.target.value || null)}
          aria-label="승인 상태 필터"
        >
          <option value="">승인 전체</option>
          <option value="pending">승인대기</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거절됨</option>
        </select>
      </div>

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

        <div className={styles.densityToggle} role="group" aria-label="목록 밀도">
          <button
            className={`${styles.densityBtn} ${density === 'normal' ? styles.densityBtnActive : ''}`}
            onClick={() => setDensity('normal')}
            aria-label="보통 밀도"
            title="보통"
          >
            <AlignJustify size={13} />
          </button>
          <button
            className={`${styles.densityBtn} ${density === 'compact' ? styles.densityBtnActive : ''}`}
            onClick={() => setDensity('compact')}
            aria-label="컴팩트 밀도"
            title="컴팩트"
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
          <div className={styles.listWrap}>
            {clients.map((client, i) =>
              density === 'compact' ? (
                <ClientRowCompact
                  key={client.id}
                  client={client}
                  onClick={() => handleRowClick(client)}
                  isLast={i === clients.length - 1}
                />
              ) : (
                <ClientRow
                  key={client.id}
                  client={client}
                  onClick={() => handleRowClick(client)}
                  isLast={i === clients.length - 1}
                />
              )
            )}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
