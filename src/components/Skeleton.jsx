import styles from './Skeleton.module.css';

export function SkeletonLine({ width = '100%', height = '16px' }) {
  return <div className={styles.line} style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <SkeletonLine width="40%" height="14px" />
      <SkeletonLine width="60%" height="28px" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }) {
  return (
    <div className={styles.tableRow}>
      {Array.from({ length: columns }, (_, i) => (
        <SkeletonLine key={i} width={`${60 + Math.random() * 30}%`} height="14px" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }) {
  return (
    <div className={styles.table}>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className={styles.listItem}>
      <div className={styles.listItemAvatar} />
      <div className={styles.listItemContent}>
        <SkeletonLine width="50%" height="14px" />
        <SkeletonLine width="30%" height="12px" />
      </div>
    </div>
  );
}
