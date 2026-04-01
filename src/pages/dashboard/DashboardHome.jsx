import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link2, Mail, Clock, Heart, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import useManagerStore from '../../store/managerStore';
import useAuthStore from '../../store/authStore';
import * as matchService from '../../api/matchService';
import SummaryCard from '../../components/SummaryCard';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';
import styles from './DashboardHome.module.css';

export default function DashboardHome() {
  const summary = useManagerStore((s) => s.summary);
  const isLoading = useManagerStore((s) => s.isLoading);
  const fetchSummary = useManagerStore((s) => s.fetchSummary);
  const myName = useAuthStore((s) => s.name);
  const navigate = useNavigate();
  const [matchStats, setMatchStats] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // 백엔드 summary에 매칭 통계가 없으면 match list에서 직접 계산 (자신의 매칭만)
  useEffect(() => {
    if (summary && summary.totalMatches == null) {
      matchService.listMatches({ page: 0, size: 9999 }).then((res) => {
        const raw = res.data || res.matches || [];
        const list = myName
          ? raw.filter((m) => m.createdByManagerName === myName)
          : raw;
        const completed = list.filter((m) => m.status === 'completed');
        setMatchStats({
          totalMatches: list.length,
          activeMatches: list.filter((m) => !['completed', 'cancelled'].includes(m.status)).length,
          completedMatches: completed.length,
          cancelledMatches: list.filter((m) => m.status === 'cancelled').length,
          afterSuccessCount: completed.filter((m) => m.afterStatus === 'accepted').length,
        });
      }).catch(() => {});
    }
  }, [summary, myName]);

  const ms = summary?.totalMatches != null ? summary : matchStats;

  const cards = [
    { icon: Users, label: '내 회원', value: summary?.myClientCount ?? '-', color: 'navy', onClick: () => navigate('/dashboard/clients') },
    { icon: Clock, label: '승인 대기', value: summary?.pendingCount ?? '-', color: 'pending' },
    { icon: Link2, label: '네트워크', value: summary?.connectedManagerCount ?? '-', color: 'success', onClick: () => navigate('/dashboard/connections') },
    { icon: Mail, label: '활성 초대링크', value: summary?.activeInviteCount ?? '-', color: 'coral', onClick: () => navigate('/dashboard/invites') },
  ];

  const matchCards = [
    { icon: Heart, label: '전체 매칭', value: ms?.totalMatches ?? '-', color: 'navy', onClick: () => navigate('/dashboard/matches') },
    { icon: TrendingUp, label: '진행 중', value: ms?.activeMatches ?? '-', color: 'pending', onClick: () => navigate('/dashboard/matches?status=active') },
    { icon: CheckCircle, label: '완료', value: ms?.completedMatches ?? '-', color: 'success', onClick: () => navigate('/dashboard/matches?status=completed') },
    { icon: XCircle, label: '취소', value: ms?.cancelledMatches ?? '-', color: 'coral', onClick: () => navigate('/dashboard/matches?status=cancelled') },
  ];

  const successRate = ms?.completedMatches > 0
    ? Math.round((ms.afterSuccessCount / ms.completedMatches) * 100)
    : 0;

  const pendingClients = summary?.recentPendingClients || [];

  if (isLoading && !summary) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>대시보드</h1>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
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

      <h2 className={styles.statsTitle}>매칭 현황</h2>
      <div className={styles.grid}>
        {matchCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className={styles.successRateBar}>
        <div className={styles.successRateHeader}>
          <span className={styles.successRateLabel}>에프터 성사율</span>
          <span className={styles.successRateValue}>{successRate}%</span>
        </div>
        <div className={styles.successRateTrack}>
          <div className={styles.successRateFill} style={{ width: `${successRate}%` }} />
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>최근 접수 회원</h2>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/clients')}>
            전체보기
          </button>
        </div>

        {pendingClients.length === 0 ? (
          <div className={styles.empty}>접수된 회원이 없습니다.</div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <span>이름</span>
              <span>성별</span>
              <span>직업</span>
              <span>상태</span>
            </div>
            {pendingClients.map((client) => (
              <div
                key={client.id}
                className={styles.tableRow}
                onClick={() => navigate(`/dashboard/clients/${client.id}`)}
              >
                <span className={styles.name}>{client.nickname || client.name}</span>
                <span>{client.gender === 'male' ? '남성' : '여성'}</span>
                <span>{client.occupation}</span>
                <span><StatusBadge status={client.approvalStatus || 'pending'} /></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
