import { useState } from 'react';
import styles from '../Proposal.module.css';

export default function AfterFeedback({ submitted, onSubmit, submitting }) {
  const [feedback, setFeedback] = useState('');

  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.afterCard}>
            <h2 className={styles.afterTitle}>소중한 피드백 감사합니다</h2>
            <p className={styles.afterDesc}>
              다음에 더 잘 맞는 분을 소개해 드리겠습니다.
              <br />좋은 인연이 곧 찾아올 거예요!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.afterCard}>
          <h2 className={styles.afterTitle}>솔직한 피드백을 들려주세요</h2>
          <p className={styles.afterDesc}>
            어떤 부분이 맞지 않으셨나요?
            <br />피드백을 남겨주시면 다음 매칭에 반영하여 더 잘 맞는 분을 소개해 드리겠습니다.
          </p>
          <textarea
            className={styles.feedbackTextarea}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="예) 대화 스타일이 맞지 않았어요, 관심사가 달랐어요 등 편하게 적어주세요."
            rows={4}
            maxLength={500}
          />
          <p className={styles.feedbackCount}>{feedback.length}/500</p>
          <div className={styles.afterActions}>
            <button
              className={styles.acceptBtn}
              onClick={() => onSubmit(feedback)}
              disabled={submitting}
            >
              {submitting ? '처리 중...' : '피드백 제출하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
