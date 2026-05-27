import { CheckCircle2 } from 'lucide-react';
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

export default function AfterWaiting() {
  return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.container}>
        <div className={styles.afterWaitingCard}>
          <div className={styles.afterWaitingDoneIcon}>
            <CheckCircle2 size={48} strokeWidth={2} />
          </div>
          <p className={styles.afterWaitingTitle}>응답이 완료되었습니다</p>
          <p className={styles.afterWaitingDesc}>
            서로 애프터를 수락한 경우에만, 상대방의 이름과
            <br />연락처가 담긴 프로필 링크를 보내드려요.
          </p>
        </div>
      </div>
    </div>
  );
}
