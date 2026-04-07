import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './Proposal.module.css';

export default function ConfirmModal({ open, title, message, confirmLabel, cancelLabel = '돌아가기', variant = 'accept', onConfirm, onCancel }) {
  const overlayRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      confirmRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onCancel();
  };

  return (
    <div className={styles.confirmOverlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.confirmModal}>
        <div className={`${styles.confirmIcon} ${variant === 'accept' ? styles.confirmIconAccept : styles.confirmIconReject}`}>
          <AlertTriangle size={24} />
        </div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmMessage}>{message}</p>
        <p className={styles.confirmWarning}>선택 후에는 변경할 수 없습니다</p>
        <div className={styles.confirmActions}>
          <button
            className={`${styles.confirmBtn} ${variant === 'accept' ? styles.confirmBtnAccept : styles.confirmBtnReject}`}
            onClick={onConfirm}
            ref={confirmRef}
          >
            {confirmLabel}
          </button>
          <button className={styles.confirmBtnCancel} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
