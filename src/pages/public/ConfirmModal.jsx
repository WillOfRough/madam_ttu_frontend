import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './Proposal.module.css';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = '돌아가기',
  variant = 'accept',
  onConfirm,
  onCancel,
  warningText = '선택 후에는 변경할 수 없습니다',
  // 선택 코멘트 필드 — commentValue 가 정의돼 있으면(빈 문자열 포함) textarea 노출
  commentValue,
  onCommentChange,
  commentLabel,
  commentPlaceholder,
  commentNote,
  commentMaxLength = 1000,
}) {
  const overlayRef = useRef(null);
  const confirmRef = useRef(null);
  const showComment = commentValue !== undefined;

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
        {showComment && (
          <div className={styles.confirmCommentField}>
            {commentLabel && <div className={styles.confirmCommentGuide}>{commentLabel}</div>}
            <textarea
              className={styles.feedbackTextarea}
              value={commentValue}
              onChange={(e) => onCommentChange?.(e.target.value)}
              placeholder={commentPlaceholder}
              rows={4}
              maxLength={commentMaxLength}
            />
            <p className={styles.feedbackCount}>{commentValue.length}/{commentMaxLength}</p>
            {commentNote && <p className={styles.confirmCommentNote}>{commentNote}</p>}
          </div>
        )}
        <p className={styles.confirmWarning}>{warningText}</p>
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
