import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import useClientListStore from '../../store/clientListStore';
import useConnectionStore from '../../store/connectionStore';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import styles from './ClientList.module.css';

export default function ClientList() {
  const { clients, totalCount, filteredCount, genderCounts, page, limit, filters, isLoading, error, setFilter, setPage, fetchClients } =
    useClientListStore();
  const { connections, fetchConnections } = useConnectionStore();
  const navigate = useNavigate();

  const handleRowClick = (client) => {
    navigate(`/dashboard/clients/${client.id}`);
  };

  // Debounced search: local input state separate from store filters
  const [nameInput, setNameInput] = useState(filters.name);
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
          value={filters.status || ''}
          onChange={(e) => setFilter('status', e.target.value || null)}
        >
          <option value="">상태 전체</option>
          <option value="active">활성</option>
          <option value="inactive">비활성</option>
          <option value="dormant">휴면</option>
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
        <SkeletonTable rows={6} columns={5} />
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
              <span>매칭</span>
            </div>
            {clients.map((client) => (
                <div
                  key={client.id}
                  className={styles.tableRow}
                  onClick={() => handleRowClick(client)}
                >
                  <span className={styles.name}>
                    {client.name}
                    {client.nickname && <span className={styles.realName}>{client.nickname}</span>}
                  </span>
                  <span className={client.gender === 'female' ? styles.genderFemaleCell : styles.genderMaleCell}>{client.gender === 'male' ? '남' : '여'}</span>
                  <span>{client.age ? `${client.age}세` : '-'}</span>
                  <span>{client.occupation || '-'}</span>
                  <span>
                    {client.activeMatchCount > 0 ? (
                      <span className={styles.matchingActive}>매칭 진행중</span>
                    ) : (
                      <span className={styles.matchingAvailable}>매칭 가능</span>
                    )}
                  </span>
                </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
