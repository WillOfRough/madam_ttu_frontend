import { useState } from 'react';
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

export default function AfterFeedback({ submitted, onSubmit, submitting }) {
  const [feedback, setFeedback] = useState('');

  if (submitted) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.afterCard}>
            <div style={{ fontSize: 32, marginBottom: 14, textAlign: 'center' }}>🌱</div>
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
      <PageHeader />
      <div className={styles.container}>
        {/* Title block */}
        <div className={styles.pageTitleBlock}>
          <div className={`${styles.progressBadge} ${styles.lilac}`}>
            <span className={styles.progressBadgeDot} />
            피드백
          </div>
          <h1 className={styles.pageTitle}>솔직한 피드백을<br />들려주세요</h1>
          <p className={styles.pageSubtitle}>
            어떤 부분이 맞지 않으셨나요? 피드백을 남겨주시면 다음 매칭에 반영하여
            더 잘 맞는 분을 소개해 드리겠습니다.
          </p>
        </div>

        <div className={styles.card}>
          <textarea
            className={styles.feedbackTextarea}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="예) 대화 스타일이 맞지 않았어요, 관심사가 달랐어요 등 편하게 적어주세요."
            rows={5}
            maxLength={500}
          />
          <p className={styles.feedbackCount}>{feedback.length}/500</p>
          <button
            className={styles.acceptBtn}
            onClick={() => onSubmit(feedback)}
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? '처리 중...' : '피드백 제출하기'}
          </button>
        </div>

        {/* Reassurance */}
        <div style={{
          marginTop: 12,
          padding: '12px 14px',
          background: 'var(--paper-warm)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <span style={{ color: 'var(--tangerine-600)', fontSize: 13, flexShrink: 0 }}>🔒</span>
          <p style={{ fontSize: 11.5, color: 'var(--ink-700)', lineHeight: 1.6 }}>
            피드백은 <strong style={{ color: 'var(--ink-900)' }}>담당 매니저만 확인</strong>하며,
            상대방에게는 공개되지 않아요.
          </p>
        </div>
      </div>
    </div>
  );
}
