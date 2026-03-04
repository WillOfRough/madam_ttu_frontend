import styles from './ProgressBar.module.css';

export default function ProgressBar({ current, total, label, progressText }) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className={styles.wrapper}>
      {label && <p className={styles.label}>{label}</p>}
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.meta}>
        <span className={styles.step}>
          {current} / {total}
        </span>
        {progressText && <span className={styles.progressText}>{progressText}</span>}
      </div>
    </div>
  );
}
