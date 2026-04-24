import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Heart, Plus, Search, X, ChevronDown, ChevronUp,
  AlertTriangle, UserRound, Info, ArrowRight, ChevronRight,
} from 'lucide-react';
import useMatchStore from '../../store/matchStore';
import useAuthStore from '../../store/authStore';
import * as matchService from '../../api/matchService';
import * as clientService from '../../api/clientService';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import { toast } from '../../store/toastStore';
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
  const [searchInput,  setSearchInput]  = useState(filters.clientName || '');
  const [onlyMine,     setOnlyMine]     = useState(Boolean(myManagerId));
  const [showGuide,    setShowGuide]    = useState(false);
  const [activeTab,    setActiveTab]    = useState('all');

  /* URL param + manager default */
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const patch = {};
    if (statusParam) patch.status = statusParam;
    if (myManagerId) patch.managerId = myManagerId;
    if (Object.keys(patch).length > 0) {
      setFilters(patch);
      if (statusParam) setSearchParams({}, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleOnlyMineToggle = (e) => {
    const checked = e.target.checked;
    setOnlyMine(checked);
    setFilter('managerId', checked && myManagerId ? myManagerId : '');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilter('status', TAB_STATUS_MAP[tab]);
  };

  const totalPages = Math.ceil(totalCount / size);

  return (
    <div className={styles.page}>

      {/* ── Title row ── */}
      <div className={styles.titleRow}>
        <h1 className={styles.title}>매칭</h1>
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

      {/* ── Tabs ── */}
      <div className={styles.tabs} role="tablist" aria-label="매칭 필터 탭">
        {TABS.map((tab) => (
          <button
            key={tab.k}
            role="tab"
            aria-selected={activeTab === tab.k}
            className={`${styles.tab}${activeTab === tab.k ? ` ${styles.tabActive}` : ''}`}
            onClick={() => handleTabChange(tab.k)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search + filters ── */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} strokeWidth={2} />
          <input
            className={styles.searchInput}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="회원 이름 검색…"
            aria-label="회원 이름으로 검색"
          />
          {searchInput && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchInput('')}
              type="button"
              aria-label="검색어 지우기"
            >
              <X size={13} strokeWidth={2} />
            </button>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value || null)}
          aria-label="상태 필터"
        >
          <option value="">상태 전체</option>
          <option value="todo">매니저 할일</option>
          <option value="active">진행중 전체</option>
          <option value="draft">대기중</option>
          <option value="proposal_sent">제안발송</option>
          <option value="proposal_accepted">상대수락</option>
          <option value="awaiting_payment">입금대기</option>
          <option value="scheduling">일정조율</option>
          <option value="arranging">조율확정</option>
          <option value="scheduled">약속확정</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소</option>
          <option value="has_deleted_member">삭제 회원 포함</option>
          <optgroup label="에프터">
            <option value="pending">에프터 응답 대기</option>
            <option value="accepted">에프터 성사</option>
            <option value="rejected">에프터 미성사</option>
          </optgroup>
        </select>

        {myManagerId && (
          <label className={styles.myMatchCheckbox}>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={handleOnlyMineToggle}
              aria-label="내 매칭만 보기"
            />
            내 매칭만
          </label>
        )}
      </div>

      {/* ── Process guide (collapsible) ── */}
      <div className={styles.guideSection}>
        <button
          className={styles.guideToggle}
          onClick={() => setShowGuide((v) => !v)}
          type="button"
          aria-expanded={showGuide}
        >
          <span>매칭 프로세스 안내</span>
          {showGuide ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
        </button>
        {showGuide && (
          <div className={styles.guideContent}>
            <div className={styles.guideSteps}>
              {[
                { title: '매칭 생성',   desc: '회원 A, B를 선택하여 매칭을 만듭니다.' },
                { title: 'A 프로필 확인', desc: 'A에게 프로포절 링크를 전달합니다. A가 수락해야 B에게 전달됩니다.' },
                { title: 'B 프로필 확인', desc: 'A 수락 후 B에게 프로포절 링크를 전달합니다. B도 수락하면 매칭 성사.' },
                { title: '입금 확인',   desc: '양쪽 수락 후 입금을 안내하고, 확인되면 입금 확인 버튼을 눌러주세요.' },
                { title: '일정 조율',   desc: '양쪽에 가용시간 등록 링크를 전달합니다.' },
                { title: '매니저 확정', desc: '양쪽 가용시간 등록 완료 후 공통 시간을 선택합니다.' },
                { title: '약속 확정',   desc: '장소를 입력하면 약속이 확정됩니다. 양측에 안내합니다.' },
                { title: '미팅 완료',   desc: '만남 후 매니저가 완료 처리합니다.' },
                { title: '에프터',      desc: '에프터 링크를 전달하여 "다시 만나고 싶은지" 응답을 받습니다.' },
                { title: '성사 결과',   desc: '양쪽 OK이면 연락처 공개, 한쪽 거절이면 미성사 안내.' },
              ].map((step, idx) => (
                <div key={step.title} className={styles.guideStep}>
                  <span className={styles.guideNum}>{idx + 1}</span>
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
        <div className={styles.empty}>
          <Heart size={36} strokeWidth={1.2} color="var(--ink-300)" />
          <p>
            {(searchInput || filters.status || filters.managerId)
              ? '검색 결과가 없습니다.'
              : '매칭 내역이 없습니다.'}
          </p>
        </div>
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

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateMatchModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchMatches(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ClientSlot — search + selected state
═══════════════════════════════════════════════ */
function ClientSlot({ client, side, onRemove, searchQuery, onSearchChange, onFocus, searchResults, onSelect, excludeId }) {
  const sideLabel = side === 'A' ? 'A' : 'B';
  return (
    <div className={`${styles.clientSlot} ${client ? styles.clientSlotFilled : ''}`}>
      <div className={styles.slotHeader}>
        <span className={styles.slotBadge}>{sideLabel}</span>
        {client && (
          <button className={styles.slotRemove} onClick={onRemove} type="button" aria-label="제거">
            <X size={14} strokeWidth={2} />
          </button>
        )}
      </div>
      {client ? (
        <div className={styles.slotBody}>
          <span className={styles.slotName}>
            {client.name || client.nickname}
            {client.nickname && client.name && (
              <span className={styles.slotNickname}>{client.nickname}</span>
            )}
          </span>
          <div className={styles.slotMeta}>
            <span className={client.gender === 'female' ? styles.slotGenderFemale : styles.slotGenderMale}>
              {client.gender === 'female' ? '여' : '남'}
            </span>
            {client.occupation && <span className={styles.slotOccupation}>{client.occupation}</span>}
          </div>
        </div>
      ) : (
        <div className={styles.slotBody}>
          <div className={styles.slotSearchWrap}>
            {!searchQuery && (
              <Search className={styles.slotSearchIcon} size={15} strokeWidth={1.8} />
            )}
            <input
              className={styles.slotSearchInput}
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={onFocus}
              placeholder=""
              aria-label={`${sideLabel} 회원 검색`}
            />
            {searchResults.length > 0 && (
              <div className={styles.slotDropdown}>
                {searchResults.filter((c) => c.id !== excludeId).map((c) => (
                  <div key={c.id} className={styles.slotDropdownItem} onClick={() => onSelect(c)}>
                    <div className={styles.dropdownInfo}>
                      <span className={styles.dropdownName}>
                        {c.name || c.nickname}
                        {c.nickname && c.name && (
                          <span className={styles.dropdownNickname}>{c.nickname}</span>
                        )}
                      </span>
                      <span className={styles.dropdownMeta}>
                        {c.gender === 'female' ? '여' : '남'} · {c.occupation || '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CreateMatchModal — all existing logic preserved
═══════════════════════════════════════════════ */
function CreateMatchModal({ onClose, onCreated }) {
  const [clientA,        setClientA]        = useState(null);
  const [clientB,        setClientB]        = useState(null);
  const [note,           setNote]           = useState('');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [selectingFor,   setSelectingFor]   = useState('A');
  const [submitting,     setSubmitting]     = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [activeMatches,  setActiveMatches]  = useState({ A: [], B: [], deletedA: [], deletedB: [] });
  const [pairHistory,    setPairHistory]    = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.length >= 1) {
      const params = { name: searchQuery, limit: 10, approval: 'approved', status: 'active' };
      const selectedClient = selectingFor === 'B' ? clientA : clientB;
      if (selectedClient?.gender) {
        params.gender = selectedClient.gender === 'female' ? 'male' : 'female';
      }
      clientService.listClients(params).then((res) => {
        const list = res.data || res.clients || res;
        setSearchResults(list);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectingFor, clientA, clientB]);

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

  const handleSelect = (client) => {
    if (selectingFor === 'A') {
      setClientA(client);
      setSelectingFor('B');
    } else {
      setClientB(client);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!clientA || !clientB || duplicateMatch) return;
    if ((clientA.status || 'active') !== 'active' || (clientB.status || 'active') !== 'active') {
      toast.error('비활성/휴면 상태 회원은 매칭할 수 없습니다.');
      return;
    }
    setSubmitting(true);
    try {
      await matchService.createMatch({ clientAId: clientA.id, clientBId: clientB.id, note });
      toast.success('매칭이 생성되었습니다.');
      onCreated();
    } catch (err) {
      toast.error(err.message || '매칭 생성에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const bothSelected = clientA && clientB;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderIcon}>
            <Heart size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className={styles.modalTitle}>새 매칭 생성</h3>
            <p className={styles.modalSubtitle}>두 회원을 선택하여 매칭을 만들어보세요</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} type="button" aria-label="닫기">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Pairing Area */}
        <div className={styles.pairingArea}>
          <ClientSlot
            client={clientA}
            side="A"
            onRemove={() => setClientA(null)}
            searchQuery={selectingFor === 'A' ? searchQuery : ''}
            onSearchChange={(e) => { setSelectingFor('A'); setSearchQuery(e.target.value); }}
            onFocus={() => setSelectingFor('A')}
            searchResults={selectingFor === 'A' ? searchResults : []}
            onSelect={handleSelect}
            excludeId={clientB?.id}
          />
          <div className={styles.pairingConnector}>
            <div className={`${styles.connectorLine} ${bothSelected ? styles.connectorLineActive : ''}`} />
            <div className={`${styles.connectorHeart} ${bothSelected ? styles.connectorHeartActive : ''}`}>
              <Heart size={14} strokeWidth={2} />
            </div>
            <div className={`${styles.connectorLine} ${bothSelected ? styles.connectorLineActive : ''}`} />
          </div>
          <ClientSlot
            client={clientB}
            side="B"
            onRemove={() => setClientB(null)}
            searchQuery={selectingFor === 'B' ? searchQuery : ''}
            onSearchChange={(e) => { setSelectingFor('B'); setSearchQuery(e.target.value); }}
            onFocus={() => setSelectingFor('B')}
            searchResults={selectingFor === 'B' ? searchResults : []}
            onSelect={handleSelect}
            excludeId={clientA?.id}
          />
        </div>

        {/* Duplicate Warning */}
        {duplicateMatch && (
          <div className={styles.duplicateWarn}>
            <AlertTriangle size={15} strokeWidth={2} />
            <span>
              이미 매칭된 적이 있는 회원입니다 (상태: {STATUS_STEP_LABELS[duplicateMatch.status] || duplicateMatch.status})
            </span>
          </div>
        )}

        {/* Pair History Warning */}
        {pairHistory.length > 0 && !duplicateMatch && (
          <div className={styles.historyWarn}>
            <div className={styles.historyWarnHeader}>
              <AlertTriangle size={15} strokeWidth={2} />
              <strong>과거 매칭 이력 주의</strong>
            </div>
            <ul className={styles.historyWarnList}>
              {pairHistory.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Active Match Warning */}
        {(activeMatches.A.length > 0 || activeMatches.B.length > 0) && !duplicateMatch && (
          <div className={styles.activeMatchWarn}>
            <div className={styles.activeMatchHeader}>
              <Info size={15} strokeWidth={2} />
              <strong>진행 중인 매칭이 있는 회원입니다</strong>
            </div>
            <p className={styles.activeMatchDesc}>
              동시에 여러 매칭을 진행하면 회원이 부담을 느껴 이탈할 수 있습니다. 한 분의 인연에 집중할 수 있도록, 기존 매칭 현황을 먼저 확인해 주세요.
            </p>
            {activeMatches.A.length > 0 && clientA && (
              <div className={styles.activeMatchClient}>
                <span className={styles.activeMatchLabel}>{clientA.name || clientA.nickname}</span>
                <span className={styles.activeMatchCount}>진행 중 {activeMatches.A.length}건</span>
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
            {activeMatches.B.length > 0 && clientB && (
              <div className={styles.activeMatchClient}>
                <span className={styles.activeMatchLabel}>{clientB.name || clientB.nickname}</span>
                <span className={styles.activeMatchCount}>진행 중 {activeMatches.B.length}건</span>
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

        {/* Deleted Member Warning */}
        {(activeMatches.deletedA.length > 0 || activeMatches.deletedB.length > 0) && !duplicateMatch && (
          <div className={styles.duplicateWarn}>
            <AlertTriangle size={15} strokeWidth={2} />
            <span>
              삭제된 회원과의 진행 중 매칭 {activeMatches.deletedA.length + activeMatches.deletedB.length}건이 있습니다 (매칭 상세에서 취소 가능)
            </span>
          </div>
        )}

        {/* Note */}
        <div className={styles.noteSection}>
          <label className={styles.noteLabel} htmlFor="matchNote">메모 (선택)</label>
          <textarea
            id="matchNote"
            className={styles.noteInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="이 매칭에 대한 메모를 남겨보세요…"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">취소</button>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={!clientA || !clientB || submitting || !!duplicateMatch}
            type="button"
          >
            {submitting ? (
              <span className={styles.submitSpinner} />
            ) : (
              <Heart size={15} strokeWidth={2} />
            )}
            {submitting ? '생성 중…' : '매칭 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
