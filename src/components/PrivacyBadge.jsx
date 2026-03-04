import { ShieldCheck } from 'lucide-react';
import styles from './PrivacyBadge.module.css';

export default function PrivacyBadge() {
  return (
    <div className={styles.badge}>
      <ShieldCheck size={16} className={styles.icon} />
      <span>개인정보는 마담MJ만 열람합니다</span>
    </div>
  );
}
