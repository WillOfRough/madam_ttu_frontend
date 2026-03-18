import styles from './SummaryCard.module.css';

export default function SummaryCard({ icon: Icon, label, value, color = 'navy', onClick }) {
  return (
    <div
      className={`${styles.card} ${styles[color] || ''}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className={styles.iconWrap}>
        <Icon size={20} />
      </div>
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
