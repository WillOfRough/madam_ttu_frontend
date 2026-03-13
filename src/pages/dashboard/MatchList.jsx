import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight, Plus } from 'lucide-react';
import useMatchStore from '../../store/matchStore';
import * as matchService from '../../api/matchService';
import * as clientService from '../../api/clientService';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import { toast } from '../../store/toastStore';
import styles from './MatchList.module.css';

const STATUS_STEP_LABELS = {
  pending_b: 'B 프로필 확인 대기',
  pending_a: 'A 프로필 확인 대기',
  matched: '매칭 성사',
  scheduling: '일정 조율 중',
  confirmed: '약속 확정됨',
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

  useEffect(() => {
    fetchMatches();
  }, [page, filters, fetchMatches]);

  const totalPages = Math.ceil(totalCount / size);

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>매칭 관리</h1>
        <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <Plus size={16} /> 새 매칭
        </button>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value || null)}
        >
          <option value="">상태 전체</option>
          <option value="pending_b">B 확인중</option>
          <option value="pending_a">A 확인중</option>
          <option value="matched">매칭됨</option>
          <option value="scheduling">일정조율</option>
          <option value="confirmed">약속확정</option>
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
      ) : matches.length === 0 && !error ? (
        <div className={styles.empty}>
          <Heart size={40} strokeWidth={1} />
          <p>매칭 내역이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className={styles.cardGrid}>
            {matches.map((m) => (
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

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>새 매칭 생성</h3>

        <div className={styles.modalField}>
          <span className={styles.modalLabel}>Seeker A</span>
          {seekerA ? (
            <div className={styles.selectedSeeker}>
              {seekerA.nickname || seekerA.name} ({seekerA.gender === 'female' ? '여' : '남'})
              <span className={styles.removeSeeker} onClick={() => setSeekerA(null)}>&times;</span>
            </div>
          ) : (
            <>
              <input
                className={styles.seekerInput}
                value={selectingFor === 'A' ? searchQuery : ''}
                onChange={(e) => { setSelectingFor('A'); setSearchQuery(e.target.value); }}
                onFocus={() => setSelectingFor('A')}
                placeholder="이름으로 검색..."
              />
              {selectingFor === 'A' && searchResults.length > 0 && (
                <div className={styles.seekerResults}>
                  {searchResults.filter((c) => c.id !== seekerB?.id).map((c) => (
                    <div key={c.id} className={styles.seekerOption} onClick={() => handleSelect(c)}>
                      <span>{c.nickname || c.name}</span>
                      <span className={styles.seekerOptionMeta}>
                        {c.gender === 'female' ? '여' : '남'} · {c.occupation || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalField}>
          <span className={styles.modalLabel}>Seeker B</span>
          {seekerB ? (
            <div className={styles.selectedSeeker}>
              {seekerB.nickname || seekerB.name} ({seekerB.gender === 'female' ? '여' : '남'})
              <span className={styles.removeSeeker} onClick={() => setSeekerB(null)}>&times;</span>
            </div>
          ) : (
            <>
              <input
                className={styles.seekerInput}
                value={selectingFor === 'B' ? searchQuery : ''}
                onChange={(e) => { setSelectingFor('B'); setSearchQuery(e.target.value); }}
                onFocus={() => setSelectingFor('B')}
                placeholder="이름으로 검색..."
              />
              {selectingFor === 'B' && searchResults.length > 0 && (
                <div className={styles.seekerResults}>
                  {searchResults.filter((c) => c.id !== seekerA?.id).map((c) => (
                    <div key={c.id} className={styles.seekerOption} onClick={() => handleSelect(c)}>
                      <span>{c.nickname || c.name}</span>
                      <span className={styles.seekerOptionMeta}>
                        {c.gender === 'female' ? '여' : '남'} · {c.occupation || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.modalField}>
          <span className={styles.modalLabel}>메모 (선택)</span>
          <textarea
            className={styles.noteInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="매칭 메모를 입력하세요..."
            rows={3}
          />
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>취소</button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={!seekerA || !seekerB || submitting}>
            {submitting ? '생성 중...' : '매칭 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
