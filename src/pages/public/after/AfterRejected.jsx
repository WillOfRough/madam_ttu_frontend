import styles from '../Proposal.module.css';

export default function AfterRejected() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.respondedBanner}>
          <p className={styles.respondedLabel}>수고하셨습니다</p>
          <p className={styles.respondedStatus}>
            아쉽지만 이번에는 인연이 닿지 않았어요.
            <br />다음에 더 좋은 인연을 찾아드리겠습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
