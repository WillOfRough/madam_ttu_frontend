import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Plus, Search, X, ChevronDown, ChevronUp, AlertTriangle, UserRound } from 'lucide-react';
import useMatchStore from '../../store/matchStore';
import * as matchService from '../../api/matchService';
import * as clientService from '../../api/clientService';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import { toast } from '../../store/toastStore';
import styles from './MatchList.module.css';

const STATUS_STEP_LABELS = {
  proposal_sent: 'A 프로필 확인 대기',
  proposal_accepted: 'B 프로필 확인 대기',
  scheduling: '일정 조율 중',
  arranging: '매니저 확정 대기',
  scheduled: '약속 확정됨',
  completed: '미팅 완료',
  cancelled: '매칭 종료',
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MatchList() {
  const { matches, totalCount, page, size, filters, isLoading, error, setFilter, setPage, fetchMatches } =
    useMatchStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [page, filters, fetchMatches]);

  const totalPages = Math.ceil(totalCount / size);

  const filteredMatches = searchQuery.trim()
    ? matches.filter((m) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          m.clientA.clientName?.toLowerCase().includes(q) ||
          m.clientB.clientName?.toLowerCase().includes(q) ||
          m.note?.toLowerCase().includes(q) ||
          (STATUS_STEP_LABELS[m.status] || '').includes(q)
        );
      })
    : matches;

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>매칭 관리</h1>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <Plus size={16} /> 새 매칭
        </button>
      </div>

      <div className={styles.guideSection}>
        <button
          className={styles.guideToggle}
          onClick={() => setShowGuide((v) => !v)}
          type="button"
        >
          <span>매칭 프로세스 안내</span>
          {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showGuide && (
          <div className={styles.guideContent}>
            <div className={styles.guideSteps}>
              <div className={styles.guideStep}>
                <span className={styles.guideNum}>1</span>
                <div>
                  <strong>매칭 생성</strong>
                  <p>회원 A, B를 선택하여 매칭을 만듭니다.</p>
                </div>
              </div>
              <div className={styles.guideStep}>
                <span className={styles.guideNum}>2</span>
                <div>
                  <strong>제안 발송</strong>
                  <p>B에게 프로포절 링크가 전달됩니다. B가 상대 프로필을 확인하고 수락/거절합니다.</p>
                </div>
              </div>
              <div className={styles.guideStep}>
                <span className={styles.guideNum}>3</span>
                <div>
                  <strong>상대 수락</strong>
                  <p>B가 수락하면 A에게도 프로포절 링크가 전달됩니다. A가 확인 후 수락/거절합니다.</p>
                </div>
              </div>
              <div className={styles.guideStep}>
                <span className={styles.guideNum}>4</span>
                <div>
                  <strong>일정 조율</strong>
                  <p>양쪽 모두 수락 시 A, B 각각에게 가용시간 등록 링크가 전달됩니다. 양쪽 모두 등록하면 매니저가 시간을 확정합니다.</p>
                </div>
              </div>
              <div className={styles.guideStep}>
                <span className={styles.guideNum}>5</span>
                <div>
                  <strong>약속 확정</strong>
                  <p>매니저가 장소를 입력하면 약속이 확정됩니다. 양측에 안내가 전달됩니다.</p>
                </div>
              </div>
              <div className={styles.guideStep}>
                <span className={styles.guideNum}>6</span>
                <div>
                  <strong>미팅 완료</strong>
                  <p>만남 후 매니저가 완료 처리합니다.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="이름, 메모로 검색..."
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value || null)}
        >
          <option value="">상태 전체</option>
          <option value="proposal_sent">제안발송</option>
          <option value="proposal_accepted">상대수락</option>
          <option value="scheduling">일정조율</option>
          <option value="arranging">조율확정</option>
          <option value="scheduled">약속확정</option>
          <option value="completed">완료</option>
          <option value="cancelled">취소</option>
        </select>
      </div>

      {error && (
        <div className={styles.error}>
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      )}

      {isLoading ? (
        <SkeletonTable rows={4} columns={3} />
      ) : filteredMatches.length === 0 && !error ? (
        <div className={styles.empty}>
          <Heart size={40} strokeWidth={1} />
          <p>{searchQuery ? '검색 결과가 없습니다.' : '매칭 내역이 없습니다.'}</p>
        </div>
      ) : (
        <>
          <div className={styles.cardGrid}>
            {filteredMatches.map((m) => (
              <div
                key={m.matchId}
                className={styles.matchCard}
                onClick={() => navigate(`/dashboard/matches/${m.matchId}`)}
              >
                <div className={styles.cardTop}>
                  <div className={styles.matchPair}>
                    <span>
                      {m.clientA.clientName}
                      <span className={styles.genderTag}>
                        {m.clientA.clientGender === 'female' ? '여' : '남'}
                      </span>
                    </span>
                    <span className={styles.arrow}><ArrowRight size={16} /></span>
                    <span>
                      {m.clientB.clientName}
                      <span className={styles.genderTag}>
                        {m.clientB.clientGender === 'female' ? '여' : '남'}
                      </span>
                    </span>
                  </div>
                  <div className={styles.badgeGroup}>
                    <StatusBadge status={m.status} />
                    {m.status === 'completed' && m.afterStatus && (
                      <StatusBadge status={`after_${m.afterStatus}`} />
                    )}
                  </div>
                </div>
                <div className={styles.cardMeta}>
                  <span>{formatDate(m.createdAt)}</span>
                  <span className={styles.stepInfo}>{STATUS_STEP_LABELS[m.status] || ''}</span>
                  {m.createdByManagerName && (
                    <span className={styles.createdBy}>
                      <UserRound size={12} />
                      {m.createdByManagerName}
                    </span>
                  )}
                </div>
                {m.note && <div className={styles.cardNote}>{m.note}</div>}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {showCreate && (
        <CreateMatchModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchMatches(); }} />
      )}
    </div>
  );
}

function ClientSlot({ client, side, onRemove, searchQuery, onSearchChange, onFocus, searchResults, onSelect, excludeId }) {
  const sideLabel = side === 'A' ? 'A' : 'B';

  return (
    <div className={`${styles.clientSlot} ${client ? styles.clientSlotFilled : ''}`}>
      <div className={styles.slotHeader}>
        <span className={styles.slotBadge}>{sideLabel}</span>
        {client && (
          <button className={styles.slotRemove} onClick={onRemove} type="button" aria-label="제거">
            <X size={14} />
          </button>
        )}
      </div>

      {client ? (
        <div className={styles.slotBody}>
          <div className={styles.slotAvatar}>
            {(client.name || client.nickname || '?').charAt(0)}
          </div>
          <span className={styles.slotName}>
            {client.name || client.nickname}
            {client.nickname && client.name && <span className={styles.slotNickname}>{client.nickname}</span>}
          </span>
          <div className={styles.slotMeta}>
            <span className={styles.slotGender}>
              {client.gender === 'female' ? '여성' : '남성'}
            </span>
            {client.occupation && <span className={styles.slotOccupation}>{client.occupation}</span>}
          </div>
        </div>
      ) : (
        <div className={styles.slotBody}>
          <div className={styles.slotAvatarEmpty}>
            <Search size={18} />
          </div>
          <div className={styles.slotSearchWrap}>
            <input
              className={styles.slotSearchInput}
              value={searchQuery}
              onChange={onSearchChange}
              onFocus={onFocus}
              placeholder="이름으로 검색..."
            />
            {searchResults.length > 0 && (
              <div className={styles.slotDropdown}>
                {searchResults.filter((c) => c.id !== excludeId).map((c) => (
                  <div key={c.id} className={styles.slotDropdownItem} onClick={() => onSelect(c)}>
                    <div className={styles.dropdownAvatar}>
                      {(c.name || c.nickname || '?').charAt(0)}
                    </div>
                    <div className={styles.dropdownInfo}>
                      <span className={styles.dropdownName}>
                        {c.name || c.nickname}
                        {c.nickname && c.name && <span className={styles.dropdownNickname}>{c.nickname}</span>}
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

function CreateMatchModal({ onClose, onCreated }) {
  const [clientA, setClientA] = useState(null);
  const [clientB, setClientB] = useState(null);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectingFor, setSelectingFor] = useState('A');
  const [submitting, setSubmitting] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  useEffect(() => {
    if (searchQuery.length >= 1) {
      clientService.listClients({ name: searchQuery, limit: 10, approval: 'approved' }).then((res) => {
        const list = res.data || res.clients || res;
        setSearchResults(list);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Check for duplicate match when both clients are selected
  useEffect(() => {
    if (!clientA || !clientB) {
      setDuplicateMatch(null);
      return;
    }
    let cancelled = false;
    matchService.listMatches({ size: 200 }).then((res) => {
      if (cancelled) return;
      const list = res.data || res.matches || [];
      const dup = list.find((m) => {
        if (m.status === 'cancelled') return false;
        const ids = [m.clientA.clientId, m.clientB.clientId];
        return (
          (ids.includes(clientA.id) && ids.includes(clientB.id))
        );
      });
      setDuplicateMatch(dup || null);
    }).catch(() => {
      if (!cancelled) setDuplicateMatch(null);
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
            <Heart size={18} />
          </div>
          <div>
            <h3 className={styles.modalTitle}>새 매칭 생성</h3>
            <p className={styles.modalSubtitle}>두 회원을 선택하여 매칭을 만들어보세요</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} type="button">
            <X size={18} />
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
              <Heart size={14} />
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
            <AlertTriangle size={15} />
            <span>
              이미 매칭된 적이 있는 회원입니다 (상태: {STATUS_STEP_LABELS[duplicateMatch.status] || duplicateMatch.status})
            </span>
          </div>
        )}

        {/* Note */}
        <div className={styles.noteSection}>
          <label className={styles.noteLabel}>메모 (선택)</label>
          <textarea
            className={styles.noteInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="이 매칭에 대한 메모를 남겨보세요..."
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
              <Heart size={15} />
            )}
            {submitting ? '생성 중...' : '매칭 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
