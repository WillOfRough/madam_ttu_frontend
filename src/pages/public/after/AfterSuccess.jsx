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

export default function AfterSuccess({ onViewProfile, submitting }) {
  return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.container}>
        <div className={styles.afterSuccessBanner}>
          {/* Celebration dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 14 }}>
            <span className={styles.celebrationDot} />
            <span className={styles.celebrationDot} />
            <span className={styles.celebrationDot} />
          </div>
          <p className={styles.respondedLabel} style={{ color: 'var(--mint-600)', fontFamily: 'var(--font-serif)', fontSize: 20 }}>
            에프터가 성사되었습니다!
          </p>
          <p className={styles.respondedStatus} style={{ marginTop: 8 }}>
            양쪽 모두 다시 만나고 싶어합니다.
            <br />상대방의 연락처를 확인해보세요.
          </p>
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
