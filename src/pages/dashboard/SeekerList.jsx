import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import useSeekerListStore from '../../store/seekerListStore';
import useConnectionStore from '../../store/connectionStore';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonTable } from '../../components/Skeleton';
import styles from './SeekerList.module.css';

export default function SeekerList() {
  const { seekers, totalCount, page, limit, filters, isLoading, setFilter, setPage, fetchSeekers } =
    useSeekerListStore();
  const { connections, fetchConnections } = useConnectionStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSeekers();
    fetchConnections();
  }, [page, filters, fetchSeekers, fetchConnections]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Seeker 관리</h1>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filters.owner}
          onChange={(e) => setFilter('owner', e.target.value)}
        >
          <option value="all">전체</option>
          <option value="me">내 Seeker</option>
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
        </select>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} columns={5} />
      ) : seekers.length === 0 ? (
        <div className={styles.empty}>
          <Search size={40} strokeWidth={1} />
          <p>등록된 Seeker가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>이름</span>
              <span>성별</span>
              <span>직업</span>
              <span>소속</span>
              <span>상태</span>
            </div>
            {seekers.map((seeker) => (
              <div
                key={seeker.id}
                className={styles.tableRow}
                onClick={() => navigate(`/dashboard/seekers/${seeker.id}`)}
              >
                <span className={styles.name}>{seeker.name}</span>
                <span>{seeker.gender === 'male' ? '남성' : '여성'}</span>
                <span>{seeker.occupation || '-'}</span>
                <span className={seeker.isOwner ? styles.ownerMe : styles.ownerOther}>
                  {seeker.ownerManager?.name || (seeker.isOwner ? '나' : '-')}
                </span>
                <span><StatusBadge status={seeker.approval || 'pending'} /></span>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
