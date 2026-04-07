import { useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import styles from '../Proposal.module.css';

export default function AfterChoice({ onAccept, onReject, submitting }) {
  const [modal, setModal] = useState(null); // 'accept' | 'reject' | null

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
              onClick={() => setModal('accept')}
              disabled={submitting}
            >
              {submitting ? '처리 중...' : '더 만나고 싶어요!'}
            </button>
            <button
              className={styles.rejectBtn}
              onClick={() => setModal('reject')}
              disabled={submitting}
            >
              괜찮아요
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={modal === 'accept'}
        variant="accept"
        title="에프터를 신청하시겠어요?"
        message="상대방도 수락하면 서로의 연락처가 공개됩니다."
        confirmLabel="네, 다시 만나고 싶어요!"
        onConfirm={() => { setModal(null); onAccept(); }}
        onCancel={() => setModal(null)}
      />
      <ConfirmModal
        open={modal === 'reject'}
        variant="reject"
        title="정말 괜찮으신가요?"
        message="거절하시면 이번 매칭의 에프터는 성사되지 않습니다."
        confirmLabel="네, 괜찮아요"
        onConfirm={() => { setModal(null); onReject(); }}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
