import styles from '../Proposal.module.css';

export default function AfterSuccess({ onViewProfile, submitting }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.afterSuccessBanner}>
          <p className={styles.respondedLabel}>에프터가 성사되었습니다!</p>
          <p className={styles.respondedStatus}>양쪽 모두 다시 만나고 싶어합니다.</p>
          <button
            className={styles.afterProfileBtn}
            onClick={onViewProfile}
            disabled={submitting}
          >
            {submitting ? '조회 중...' : '상대 연락처 보기'}
          </button>
        </div>
      </div>
    </div>
  );
}
