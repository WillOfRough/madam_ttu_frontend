import styles from '../Proposal.module.css';

export default function AfterChoice({ onAccept, onReject, submitting }) {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.afterCard}>
          <h2 className={styles.afterTitle}>미팅은 어떠셨나요?</h2>
          <p className={styles.afterDesc}>
            상대방을 다시 만나고 싶으시다면 에프터를 신청해주세요.
            <br />양쪽 모두 수락하면 연락처가 공개됩니다.
          </p>
          <div className={styles.afterActions}>
            <button
              className={styles.acceptBtn}
              onClick={onAccept}
              disabled={submitting}
            >
              {submitting ? '처리 중...' : '더 만나고 싶어요!'}
            </button>
            <button
              className={styles.rejectBtn}
              onClick={onReject}
              disabled={submitting}
            >
              괜찮아요
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
