import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Plus, Search, X } from 'lucide-react';
import useMatchStore from '../../store/matchStore';
import * as matchService from '../../api/matchService';
import * as clientService from '../../api/clientService';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import { toast } from '../../store/toastStore';
import styles from './MatchList.module.css';

const STATUS_STEP_LABELS = {
  proposal_sent: 'B 프로필 확인 대기',
  proposal_accepted: 'A 프로필 확인 대기',
  scheduling: '일정 조율 중',
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

  useEffect(() => {
    fetchMatches();
  }, [page, filters, fetchMatches]);

  const totalPages = Math.ceil(totalCount / size);

  const filteredMatches = searchQuery.trim()
    ? matches.filter((m) => {
        const q = searchQuery.trim().toLowerCase();
        return (
          m.seekerA.seekerName?.toLowerCase().includes(q) ||
          m.seekerB.seekerName?.toLowerCase().includes(q) ||
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
                      {m.seekerA.seekerName}
                      <span className={styles.genderTag}>
                        {m.seekerA.seekerGender === 'female' ? '여' : '남'}
                      </span>
                    </span>
                    <span className={styles.arrow}><ArrowRight size={16} /></span>
                    <span>
                      {m.seekerB.seekerName}
                      <span className={styles.genderTag}>
                        {m.seekerB.seekerGender === 'female' ? '여' : '남'}
                      </span>
                    </span>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
                <div className={styles.cardMeta}>
                  <span>{formatDate(m.createdAt)}</span>
                  <span className={styles.stepInfo}>{STATUS_STEP_LABELS[m.status] || ''}</span>
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

function SeekerSlot({ seeker, side, onRemove, searchQuery, onSearchChange, onFocus, searchResults, onSelect, excludeId }) {
  const sideLabel = side === 'A' ? 'A' : 'B';

  return (
    <div className={`${styles.seekerSlot} ${seeker ? styles.seekerSlotFilled : ''}`}>
      <div className={styles.slotHeader}>
        <span className={styles.slotBadge}>{sideLabel}</span>
        {seeker && (
          <button className={styles.slotRemove} onClick={onRemove} type="button" aria-label="제거">
            <X size={14} />
          </button>
        )}
      </div>

      {seeker ? (
        <div className={styles.slotBody}>
          <div className={styles.slotAvatar}>
            {(seeker.nickname || seeker.name || '?').charAt(0)}
          </div>
          <span className={styles.slotName}>{seeker.nickname || seeker.name}</span>
          <div className={styles.slotMeta}>
            <span className={styles.slotGender}>
              {seeker.gender === 'female' ? '여성' : '남성'}
            </span>
            {seeker.occupation && <span className={styles.slotOccupation}>{seeker.occupation}</span>}
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
                      {(c.nickname || c.name || '?').charAt(0)}
                    </div>
                    <div className={styles.dropdownInfo}>
                      <span className={styles.dropdownName}>{c.nickname || c.name}</span>
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
  const [seekerA, setSeekerA] = useState(null);
  const [seekerB, setSeekerB] = useState(null);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectingFor, setSelectingFor] = useState('A');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 1) {
      clientService.listClients({ name: searchQuery, limit: 10 }).then((res) => {
        const list = res.data || res.clients || res;
        setSearchResults(list);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleSelect = (client) => {
    if (selectingFor === 'A') {
      setSeekerA(client);
      setSelectingFor('B');
    } else {
      setSeekerB(client);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!seekerA || !seekerB) return;
    setSubmitting(true);
    try {
      await matchService.createMatch({ seekerAId: seekerA.id, seekerBId: seekerB.id, note });
      toast.success('매칭이 생성되었습니다.');
      onCreated();
    } catch (err) {
      toast.error(err.message || '매칭 생성에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const bothSelected = seekerA && seekerB;

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
            <p className={styles.modalSubtitle}>두 Seeker를 선택하여 매칭을 만들어보세요</p>
          </div>
          <button className={styles.modalClose} onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {/* Pairing Area */}
        <div className={styles.pairingArea}>
          <SeekerSlot
            seeker={seekerA}
            side="A"
            onRemove={() => setSeekerA(null)}
            searchQuery={selectingFor === 'A' ? searchQuery : ''}
            onSearchChange={(e) => { setSelectingFor('A'); setSearchQuery(e.target.value); }}
            onFocus={() => setSelectingFor('A')}
            searchResults={selectingFor === 'A' ? searchResults : []}
            onSelect={handleSelect}
            excludeId={seekerB?.id}
          />

          <div className={styles.pairingConnector}>
            <div className={`${styles.connectorLine} ${bothSelected ? styles.connectorLineActive : ''}`} />
            <div className={`${styles.connectorHeart} ${bothSelected ? styles.connectorHeartActive : ''}`}>
              <Heart size={14} />
            </div>
            <div className={`${styles.connectorLine} ${bothSelected ? styles.connectorLineActive : ''}`} />
          </div>

          <SeekerSlot
            seeker={seekerB}
            side="B"
            onRemove={() => setSeekerB(null)}
            searchQuery={selectingFor === 'B' ? searchQuery : ''}
            onSearchChange={(e) => { setSelectingFor('B'); setSearchQuery(e.target.value); }}
            onFocus={() => setSelectingFor('B')}
            searchResults={selectingFor === 'B' ? searchResults : []}
            onSelect={handleSelect}
            excludeId={seekerA?.id}
          />
        </div>

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
            disabled={!seekerA || !seekerB || submitting}
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
