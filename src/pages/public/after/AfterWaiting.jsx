import styles from '../Proposal.module.css';

export default function AfterWaiting() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.respondedBanner}>
          <p className={styles.respondedLabel}>응답이 완료되었습니다</p>
          <p className={styles.respondedStatus}>
            결과를 위해 잠시만 기다려주세요.
            <br />매니저가 결과 링크를 보내드릴 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
