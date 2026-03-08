import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link2, Mail, Clock } from 'lucide-react';
import useManagerStore from '../../store/managerStore';
import SummaryCard from '../../components/SummaryCard';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';
import styles from './DashboardHome.module.css';

export default function DashboardHome() {
  const summary = useManagerStore((s) => s.summary);
  const isLoading = useManagerStore((s) => s.isLoading);
  const fetchSummary = useManagerStore((s) => s.fetchSummary);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const cards = [
    { icon: Users, label: '내 Seeker', value: summary?.mySeekerCount ?? '-', color: 'navy' },
    { icon: Clock, label: '승인 대기', value: summary?.pendingCount ?? '-', color: 'pending' },
    { icon: Link2, label: '연결된 매니저', value: summary?.connectionCount ?? '-', color: 'success' },
    { icon: Mail, label: '활성 초대링크', value: summary?.activeInviteCount ?? '-', color: 'coral' },
  ];

  const pendingSeekers = summary?.recentPendingSeekers || [];

  if (isLoading && !summary) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>대시보드</h1>
        <div className={styles.grid}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={3} columns={4} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>대시보드</h1>

      <div className={styles.grid}>
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>최근 승인 대기</h2>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/seekers')}>
            전체보기
          </button>
        </div>

        {pendingSeekers.length === 0 ? (
          <div className={styles.empty}>승인 대기중인 Seeker가 없습니다.</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>이름</span>
              <span>성별</span>
              <span>직업</span>
              <span>상태</span>
            </div>
            {pendingSeekers.map((seeker) => (
              <div
                key={seeker.id}
                className={styles.tableRow}
                onClick={() => navigate(`/dashboard/seekers/${seeker.id}`)}
              >
                <span className={styles.name}>{seeker.name}</span>
                <span>{seeker.gender === 'male' ? '남성' : '여성'}</span>
                <span>{seeker.occupation}</span>
                <span><StatusBadge status={seeker.approval || 'pending'} /></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
