import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Link2, Mail, Clock, Heart, CheckCircle, XCircle, TrendingUp, ClipboardList } from 'lucide-react';
import useManagerStore from '../../store/managerStore';
import useAuthStore from '../../store/authStore';
import * as matchService from '../../api/matchService';
import SummaryCard from '../../components/SummaryCard';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonCard } from '../../components/Skeleton';
import styles from './DashboardHome.module.css';

const TODO_ACTION_LABELS = {
  draft: '프로포절 발송 필요',
  awaiting_payment: '입금 확인 필요',
  arranging: '일정 확정 필요',
  scheduled: '미팅 완료 처리 필요',
};

export default function DashboardHome() {
  const summary = useManagerStore((s) => s.summary);
  const isLoading = useManagerStore((s) => s.isLoading);
  const fetchSummary = useManagerStore((s) => s.fetchSummary);
  const myName = useAuthStore((s) => s.name);
  const myManagerId = useAuthStore((s) => s.managerId);
  const navigate = useNavigate();
  const [matchStats, setMatchStats] = useState(null);
  const [todoMatches, setTodoMatches] = useState(null); // null = loading

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // 매니저 할일 목록 (status=todo 서버 필터)
  useEffect(() => {
    const params = { size: 5, status: 'todo' };
    if (myManagerId) params.managerId = myManagerId;
    matchService.listMatches(params)
      .then((res) => setTodoMatches(res.data || res.matches || []))
      .catch(() => setTodoMatches([]));
  }, [myManagerId]);

  // 백엔드 summary에 매칭 통계가 없으면 match list에서 직접 계산 (자신의 매칭만)
  useEffect(() => {
    if (summary && summary.totalMatches == null) {
      matchService.listMatches({ page: 0, size: 9999 }).then((res) => {
        const raw = res.data || res.matches || [];
        const list = myName
          ? raw.filter((m) => m.createdByManagerName === myName)
          : raw;
        setMatchStats({
          totalMatches: list.length,
          activeMatches: list.filter((m) => !['completed', 'cancelled'].includes(m.status)).length,
          completedMatches: list.filter((m) => m.status === 'completed').length,
          cancelledMatches: list.filter((m) => m.status === 'cancelled').length,
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

  if (isLoading && !summary) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>대시보드</h1>
        <div className={styles.grid}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
        </div>
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

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <ClipboardList size={15} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--coral)' }} />
            매니저 할일
            {todoMatches && todoMatches.length > 0 && (
              <span className={styles.todoCount}>{todoMatches.length}</span>
            )}
          </h2>
          <button className={styles.viewAll} onClick={() => navigate('/dashboard/matches?status=todo')}>
            전체보기
          </button>
        </div>

        {todoMatches == null ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : todoMatches.length === 0 ? (
          <div className={styles.empty}>처리할 매칭이 없습니다 ✨</div>
        ) : (
          todoMatches.map((m) => (
            <div
              key={m.matchId}
              className={styles.todoItem}
              onClick={() => navigate(`/dashboard/matches/${m.matchId}`)}
            >
              <StatusBadge status={m.status} />
              <div className={styles.todoContent}>
                <div className={styles.todoNames}>
                  {m.clientA?.clientName} ↔ {m.clientB?.clientName}
                </div>
                <div className={styles.todoAction}>
                  {TODO_ACTION_LABELS[m.status] || ''}
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
