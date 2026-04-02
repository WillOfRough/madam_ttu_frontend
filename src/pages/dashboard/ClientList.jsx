import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Heart, X, CheckSquare } from 'lucide-react';
import useClientListStore from '../../store/clientListStore';
import useConnectionStore from '../../store/connectionStore';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import styles from './ClientList.module.css';

export default function ClientList() {
  const { clients, totalCount, filteredCount, genderCounts, page, limit, filters, isLoading, error, setFilter, setPage, fetchClients, selectedForMatch: selected, toggleSelectForMatch, setSelectedForMatch: setSelected, clearSelectedForMatch } =
    useClientListStore();
  const { connections, fetchConnections } = useConnectionStore();
  const navigate = useNavigate();
  const [showMatchConfirm, setShowMatchConfirm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pairWarnings, setPairWarnings] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const longPressRef = useRef(null);

  // 선택 모드: 선택이 모두 해제되면 자동 종료
  useEffect(() => {
    if (selectMode && selected.length === 0) setSelectMode(false);
  }, [selected, selectMode]);

  const toggleSelect = (client, e) => {
    if (e) e.stopPropagation();
    if (client.approvalStatus !== 'approved') return;
    toggleSelectForMatch(client);
  };

  const handleLongPressStart = (client) => {
    longPressRef.current = setTimeout(() => {
      if (client.approvalStatus !== 'approved') return;
      setSelectMode(true);
      if (!selected.find((c) => c.id === client.id)) {
        toggleSelectForMatch(client);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    clearTimeout(longPressRef.current);
  };

  const handleRowClick = (client) => {
    navigate(`/dashboard/clients/${client.id}`);
  };

  // 성별 검증: 남녀 쌍만 가능
  const genderValid = selected.length === 2 && selected[0].gender !== selected[1].gender;

  // 2명 선택 시 이력 체크
  useEffect(() => {
    if (selected.length !== 2) { setPairWarnings([]); return; }
    const [a, b] = selected;
    matchService.listMatches({ size: 200 }).then((res) => {
      const list = res.data || res.matches || [];
      const pairMatches = list.filter((m) => {
        const ids = [m.clientA.clientId, m.clientB.clientId];
        return ids.includes(a.id) && ids.includes(b.id);
      });
      const warnings = [];
      for (const m of pairMatches) {
        const activeStatuses = ['proposal_sent', 'proposal_accepted', 'scheduling', 'arranging', 'scheduled'];
        if (activeStatuses.includes(m.status)) {
          warnings.push({ type: 'active', message: `현재 진행 중인 매칭이 있습니다 (${m.status})` });
        } else if (m.status === 'cancelled') {
          warnings.push({ type: 'cancelled', message: '이전에 매칭이 취소된 이력이 있습니다' });
        }
        if (m.clientA.response === 'rejected' || m.clientB.response === 'rejected') {
          warnings.push({ type: 'rejected', message: '프로포절을 거절한 이력이 있습니다' });
        }
        if (m.afterStatus === 'rejected') {
          warnings.push({ type: 'after_rejected', message: '애프터가 미성사된 이력이 있습니다' });
        }
      }
      setPairWarnings(warnings);
    }).catch(() => setPairWarnings([]));
  }, [selected]);

  const handleCreateMatch = async () => {
    if (selected.length !== 2 || !genderValid) return;
    setCreating(true);
    try {
      const [a, b] = selected;
      await matchService.createMatch({ clientAId: a.id, clientBId: b.id });
      toast.success(`${a.nickname || a.name} ↔ ${b.nickname || b.name} 매칭이 생성되었습니다.`);
      clearSelectedForMatch();
      setShowMatchConfirm(false);
      navigate('/dashboard/matches');
    } catch (err) {
      toast.error(err.message || '매칭 생성에 실패했습니다.');
    }
    setCreating(false);
  };

  // Debounced search: local input state separate from store filters
  const [nameInput, setNameInput] = useState(filters.name);
  const [phoneInput, setPhoneInput] = useState(filters.phone);
  const debounceRef = useRef(null);

  const debouncedSetFilter = useCallback((key, value) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter(key, value);
    }, 300);
  }, [setFilter]);

  const handleNameChange = (e) => {
    const v = e.target.value;
    setNameInput(v);
    debouncedSetFilter('name', v);
  };

  const handlePhoneChange = (e) => {
    const v = e.target.value;
    setPhoneInput(v);
    debouncedSetFilter('phone', v);
  };

  useEffect(() => {
    fetchClients();
    fetchConnections();
  }, [page, filters, fetchClients, fetchConnections]);

  const totalPages = Math.ceil(filteredCount / limit);

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>회원 관리</h1>
        {!isLoading && totalCount > 0 && (
          <div className={styles.statsGroup}>
            <button
              className={`${styles.totalCount} ${!filters.gender ? styles.statsActive : ''}`}
              onClick={() => setFilter('gender', null)}
              type="button"
            >
              <Users size={14} />
              총 <strong>{totalCount.toLocaleString()}</strong>명
            </button>
            <span className={styles.genderCount}>
              <button
                className={`${styles.genderMale} ${filters.gender === 'male' ? styles.statsActive : ''}`}
                onClick={() => setFilter('gender', filters.gender === 'male' ? null : 'male')}
                type="button"
              >
                남 <strong>{genderCounts.male}</strong>
              </button>
              <span className={styles.genderDivider} />
              <button
                className={`${styles.genderFemale} ${filters.gender === 'female' ? styles.statsActive : ''}`}
                onClick={() => setFilter('gender', filters.gender === 'female' ? null : 'female')}
                type="button"
              >
                여 <strong>{genderCounts.female}</strong>
              </button>
            </span>
          </div>
        )}
      </div>

      <div className={styles.searchRow}>
        <input
          className={styles.searchInput}
          value={nameInput}
          onChange={handleNameChange}
          placeholder="이름 / 별명 검색"
        />
        <input
          className={styles.searchInput}
          value={phoneInput}
          onChange={handlePhoneChange}
          placeholder="전화번호 검색 (정확 일치)"
        />
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filters.owner}
          onChange={(e) => setFilter('owner', e.target.value)}
        >
          <option value="all">전체</option>
          <option value="me">내 회원</option>
          {connections.map((conn) => (
            <option key={conn.managerId || conn.id} value={conn.managerId || conn.id}>
              {conn.name || conn.email}
            </option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filters.gender || ''}
          onChange={(e) => setFilter('gender', e.target.value || null)}
        >
          <option value="">성별 전체</option>
          <option value="male">남성</option>
          <option value="female">여성</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filters.approval || ''}
          onChange={(e) => setFilter('approval', e.target.value || null)}
        >
          <option value="">상태 전체</option>
          <option value="pending">대기</option>
          <option value="approved">승인</option>
          <option value="rejected">거절</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filters.sort}
          onChange={(e) => setFilter('sort', e.target.value)}
        >
          <option value="createdAt:desc">최신순</option>
          <option value="createdAt:asc">오래된순</option>
          <option value="name:asc">이름순</option>
          <option value="birthDate:asc">나이 많은순</option>
          <option value="birthDate:desc">나이 적은순</option>
        </select>
      </div>

      {error && (
        <div className={styles.error}>
          <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
        </div>
      )}

      {isLoading && clients.length === 0 ? (
        <SkeletonTable rows={6} columns={6} />
      ) : clients.length === 0 && !isLoading && !error ? (
        <div className={styles.empty}>
          <Search size={40} strokeWidth={1} />
          <p>등록된 회원이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>이름</span>
              <span>성별</span>
              <span>나이</span>
              <span>직업</span>
              <span>소속</span>
              <span>매칭</span>
              <span>상태</span>
            </div>
            {clients.map((client) => {
              const isSelected = selected.some((c) => c.id === client.id);
              return (
                <div
                  key={client.id}
                  className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ''}`}
                  onClick={() => handleRowClick(client)}
                  onTouchStart={() => handleLongPressStart(client)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchCancel={handleLongPressEnd}
                  onMouseDown={() => handleLongPressStart(client)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                >
                  {selectMode && client.approvalStatus === 'approved' && (
                    <button
                      className={`${styles.selectBtn} ${isSelected ? styles.selectBtnActive : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleSelect(client, e); }}
                    >
                      {isSelected ? '해제' : '선택'}
                    </button>
                  )}
                  <span className={styles.name}>
                    {client.nickname || client.name}
                    {client.nickname && <span className={styles.realName}>{client.name}</span>}
                  </span>
                  <span>{client.gender === 'male' ? '남성' : '여성'}</span>
                  <span>{client.age ? `${client.age}세` : '-'}</span>
                  <span>{client.occupation || '-'}</span>
                  <span className={client.isOwner ? styles.ownerMe : styles.ownerOther}>
                    {client.ownerManager
                      ? <><span>{client.ownerManager.name}</span>{client.ownerManager.email && <span className={styles.ownerEmail}>{client.ownerManager.email}</span>}</>
                      : (client.isOwner ? '나' : '-')}
                  </span>
                  <span>
                    {client.activeMatchCount > 0 ? (
                      <span className={styles.matchingActive}>매칭 진행중</span>
                    ) : (
                      <span className={styles.matchingAvailable}>매칭 가능</span>
                    )}
                  </span>
                  <span><StatusBadge status={client.approvalStatus || 'pending'} /></span>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
      {/* 매칭 생성 플로팅 바 */}
      {selected.length > 0 && (
        <div className={styles.matchFloatingBar}>
          <div className={styles.matchFloatingContent}>
            <div className={styles.matchFloatingLeft}>
              <div className={styles.matchSelectedNames}>
                {selected.map((c) => (
                  <span key={c.id} className={styles.matchSelectedChip}>
                    {c.nickname || c.name}
                    <span className={c.gender === 'female' ? styles.chipGenderF : styles.chipGenderM}>
                      {c.gender === 'female' ? '여' : '남'}
                    </span>
                    <button className={styles.chipRemove} onClick={() => toggleSelectForMatch(c)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {selected.length === 1 && <span className={styles.matchSelectHint}>1명 더 선택하세요</span>}
              </div>
              {selected.length === 2 && !genderValid && (
                <div className={styles.matchWarning}>같은 성별은 매칭할 수 없습니다</div>
              )}
              {pairWarnings.length > 0 && (
                <div className={styles.matchWarning}>
                  {pairWarnings.map((w, i) => <span key={i}>{w.message}</span>)}
                </div>
              )}
            </div>
            <button
              className={styles.matchCreateBtn}
              disabled={selected.length !== 2 || !genderValid || creating}
              onClick={() => setShowMatchConfirm(true)}
            >
              <Heart size={14} /> 매칭 만들기
            </button>
          </div>
        </div>
      )}

      {showMatchConfirm && selected.length === 2 && (
        <ConfirmModal
          title="매칭 생성"
          message={`${selected[0].nickname || selected[0].name}(${selected[0].gender === 'female' ? '여' : '남'}) ↔ ${selected[1].nickname || selected[1].name}(${selected[1].gender === 'female' ? '여' : '남'}) 매칭을 생성하시겠습니까?`}
          confirmLabel="매칭 생성"
          cancelLabel="돌아가기"
          onConfirm={handleCreateMatch}
          onCancel={() => setShowMatchConfirm(false)}
        />
      )}
    </div>
  );
}
