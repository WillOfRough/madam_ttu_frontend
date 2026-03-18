import styles from '../Proposal.module.css';

export default function AfterWaiting() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.respondedBanner}>
          <p className={styles.respondedLabel}>응답이 접수되었습니다</p>
          <p className={styles.respondedStatus}>
            상대방의 응답을 기다리고 있습니다.
            <br />이 페이지에 결과가 업데이트되니
            <br />잠시 후 다시 확인해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
