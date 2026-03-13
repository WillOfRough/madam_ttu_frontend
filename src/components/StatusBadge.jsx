import styles from './StatusBadge.module.css';

const LABELS = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
  active: '활성',
  expired: '만료',
  revoked: '폐기',
  pending_b: 'B 확인중',
  pending_a: 'A 확인중',
  matched: '매칭됨',
  scheduling: '일정조율',
  confirmed: '약속확정',
  completed: '완료',
  cancelled: '취소',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status;
  return (
    <span className={`${styles.badge} ${styles[status] || ''}`}>
      {label}
    </span>
  );
}
