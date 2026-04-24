import styles from '../Proposal.module.css';

function PageHeader() {
  return (
    <div className={styles.brandHeader}>
      <div className={styles.brandMark}>
        <div className={styles.brandMarkDot} />
      </div>
      <span className={styles.brandName}>Knots &amp; Links</span>
    </div>
  );
}

export default function AfterWaiting() {
  return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.container}>
        <div className={styles.afterWaitingCard}>
          <div className={styles.afterWaitingIcon}>
            <span className={styles.afterWaitingDot} />
            <span className={styles.afterWaitingDot} />
            <span className={styles.afterWaitingDot} />
          </div>
          <p className={styles.afterWaitingTitle}>응답이 전달되었습니다</p>
          <p className={styles.afterWaitingDesc}>
            아직 상대방의 선택이 완료되지 않았어요.
            <br />결과는 매니저가 별도로 안내드릴 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
