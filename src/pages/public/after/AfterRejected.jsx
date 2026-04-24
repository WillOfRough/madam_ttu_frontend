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

export default function AfterRejected() {
  return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.container}>
        <div className={styles.respondedBanner}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🌿</div>
          <p className={styles.respondedLabel}>수고하셨습니다</p>
          <p className={styles.respondedStatus}>
            아쉽지만 이번에는 인연이 닿지 않았어요.
            <br />다음에 더 좋은 인연을 찾아드리겠습니다.
          </p>
        </div>

        <div style={{
          marginTop: 12,
          padding: '14px 16px',
          background: 'var(--paper-warm)',
          borderRadius: 'var(--r-md)',
          fontSize: 12.5,
          color: 'var(--ink-700)',
          lineHeight: 1.65,
          borderLeft: '3px solid var(--tangerine-200)',
        }}>
          인연에도 &lsquo;결&rsquo;이 있다고 합니다. 이번 만남은 두 분의 결이 잠시 어긋났을 뿐이에요.
          저희가 꼭 맞는 분을 찾아드릴게요.
        </div>
      </div>
    </div>
  );
}
