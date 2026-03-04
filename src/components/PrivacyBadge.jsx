import { ShieldCheck } from 'lucide-react';
import { MADAM_QUOTES } from '../data/constants';
import styles from './PrivacyBadge.module.css';

export default function PrivacyBadge() {
  return (
    <div className={styles.badge}>
      <ShieldCheck size={16} className={styles.icon} />
      <span>{MADAM_QUOTES.privacy}</span>
    </div>
  );
}
