import { AlertTriangle } from 'lucide-react';
import styles from './ExpiredLink.module.css';

export default function ExpiredLink() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <AlertTriangle size={48} />
        </div>
        <h1 className={styles.title}>링크가 만료되었습니다</h1>
        <p className={styles.message}>
          이 초대 링크는 만료되었거나 더 이상 유효하지 않습니다.
          <br />매니저에게 새로운 초대 링크를 요청해주세요.
        </p>
      </div>
    </div>
  );
}
