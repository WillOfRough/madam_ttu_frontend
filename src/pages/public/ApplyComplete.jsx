import { CheckCircle } from 'lucide-react';
import styles from './ApplyComplete.module.css';

export default function ApplyComplete() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <CheckCircle size={48} />
        </div>
        <h1 className={styles.title}>프로필 등록 완료!</h1>
        <p className={styles.message}>
          소중한 프로필을 등록해주셔서 감사합니다.
        </p>
        <p className={styles.subMessage}>
          매니저가 프로필을 검토한 후 연락드릴 예정입니다.
          <br />좋은 인연이 찾아올 거예요.
        </p>
      </div>
    </div>
  );
}
