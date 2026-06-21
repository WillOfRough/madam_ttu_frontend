import { Link2, Copy, Check, Share2 } from 'lucide-react';
import styles from './ShareCard.module.css';

/**
 * 소개 페이지 공유 카드 (다크 카드 + URL + 링크복사/공유)
 * - 초대 탭(회원 소개), 네트워크 탭(매니저 소개) 공용
 */
export default function ShareCard({ icon, title, desc, url, copied, onCopy, onShare }) {
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.headText}>
          <div className={styles.title}>{title}</div>
          <div className={styles.desc}>{desc}</div>
        </div>
      </div>
      <div className={styles.urlBox}>
        <Link2 size={13} className={styles.urlIcon} />
        <span className={styles.urlText}>{url}</span>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${copied ? styles.btnCopied : styles.btnCopy}`}
          onClick={onCopy}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? '복사됨' : '링크 복사'}
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnShare}`}
          onClick={onShare}
        >
          <Share2 size={13} />
          공유하기
        </button>
      </div>
    </div>
  );
}
