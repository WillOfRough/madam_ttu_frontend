import styles from './StatusBadge.module.css';

const LABELS = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
  active: '활성',
  inactive: '비활성',
  dormant: '휴면',
  expired: '만료',
  revoked: '폐기',
  proposal_sent: '제안발송',
  proposal_accepted: '상대수락',
  scheduling: '일정조율',
  arranging: '조율확정',
  scheduled: '약속확정',
  completed: '만남',
  cancelled: '취소',
  after_pending: '에프터 대기',
  after_accepted: '에프터 성사',
  after_rejected: '에프터 미성사',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status;
  return (
    <span className={`${styles.badge} ${styles[status] || ''}`}>
      {label}
    </span>
  );
}
