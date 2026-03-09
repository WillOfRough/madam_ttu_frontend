import styles from './StatusBadge.module.css';

const LABELS = {
  pending: '대기',
  approved: '승인',
  rejected: '거절',
  active: '활성',
  expired: '만료',
  revoked: '폐기',
};

export default function StatusBadge({ status }) {
  const label = LABELS[status] || status;
  return (
    <span className={`${styles.badge} ${styles[status] || ''}`}>
      {label}
    </span>
  );
}
