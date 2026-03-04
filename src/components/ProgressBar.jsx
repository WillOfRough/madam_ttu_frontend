import styles from './ProgressBar.module.css';

export default function ProgressBar({ current, total, label }) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className={styles.wrapper}>
      {label && <p className={styles.label}>{label}</p>}
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.step}>
        {current} / {total}
      </span>
    </div>
  );
}
