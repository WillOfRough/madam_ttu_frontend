import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Check, Send, AlertCircle, X } from 'lucide-react';
import { getMyProfile, submitInquiry } from '../../api/clientService';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import { toast } from '../../store/toastStore';
import styles from './ClientInquiry.module.css';

/* ─── category constants ─── */
const CATEGORIES = [
  { value: 'matching', label: '매칭 관련' },
  { value: 'profile_edit', label: '프로필 수정' },
  { value: 'schedule', label: '일정' },
  { value: 'payment', label: '입금/결제' },
  { value: 'other', label: '기타' },
];

const MAX_CONTENT = 1000;
const MIN_CONTENT = 10;
const MAX_TITLE = 100;

/* ══════════════════════════════════════════════ */
export default function ClientInquiry() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');

  /* ── verification state ── */
  const [phone, setPhone] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verificationId, setVerificationId] = useState('');

  /* ── form state ── */
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── step: 'verify' | 'form' | 'done' ── */
  const [step, setStep] = useState('verify');

  /* ─── OTP 인증 완료 후 프로필 조회 ─── */
  const handlePhoneVerified = async (verId) => {
    if (!clientId) {
      setVerifyError('유효하지 않은 링크입니다. 매니저에게 문의해주세요.');
      return;
    }
    if (!verId) return;
    setVerifyLoading(true);
    setVerifyError('');
    try {
      await getMyProfile({ id: clientId, phone });
      setVerifiedPhone(phone);
      setVerificationId(verId);
      setStep('form');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('전화번호') || msg.includes('404') || err.status === 404) {
        setVerifyError('전화번호가 일치하지 않습니다. 다시 확인해주세요.');
      } else {
        setVerifyError(msg || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  /* ─── submit handler ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !title.trim() || content.length < MIN_CONTENT) return;
    setSubmitting(true);
    try {
      await submitInquiry(clientId, verifiedPhone, verificationId, { category, title: title.trim(), content });
      toast.success('문의가 등록되었습니다.');
      setStep('done');
    } catch (err) {
      toast.error(err.message || '문의 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── reset for additional inquiry (verificationId는 1회성이므로 재인증 필요) ─── */
  const handleAdditional = () => {
    setCategory('');
    setTitle('');
    setContent('');
    setPhone('');
    setVerifiedPhone('');
    setVerificationId('');
    setVerifyError('');
    setStep('verify');
  };

  /* ══ STATE 1: phone verification ══ */
  if (step === 'verify') {
    return (
      <div className={styles.page}>
        <div className={styles.verifyWrap}>
          <div className={styles.brandMark}>
            <span className={styles.brandDot} />
            <span className={styles.brandName}>Knots &amp; Links</span>
            <span className={styles.brandDot} />
          </div>

          <div className={styles.verifyCard}>
            <div className={styles.verifyIconRing}>
              <MessageCircle size={26} strokeWidth={1.8} />
            </div>
            <h1 className={styles.verifyTitle}>본인 확인이 필요합니다</h1>
            <p className={styles.verifyDesc}>
              문의 등록을 위해 가입 시 등록한<br />전화번호로 인증을 진행해주세요.
            </p>

            <div className={styles.verifyForm}>
              <PhoneVerifyField
                value={phone}
                onChange={(v) => { setPhone(v); setVerifyError(''); }}
                onVerified={handlePhoneVerified}
                disabled={verifyLoading}
              />

              {verifyLoading && (
                <p className={styles.verifyLoadingMsg}>프로필을 확인하는 중입니다...</p>
              )}

              {verifyError && (
                <div className={styles.verifyError}>
                  <AlertCircle size={13} />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>

            <p className={styles.verifyFootnote}>
              개인정보는 안전하게 보호됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ══ STATE 3: done ══ */
  if (step === 'done') {
    return (
      <div className={styles.page}>
        <div className={styles.doneWrap}>
          <div className={styles.brandMark}>
            <span className={styles.brandDot} />
            <span className={styles.brandName}>Knots &amp; Links</span>
            <span className={styles.brandDot} />
          </div>

          <div className={styles.doneCard}>
            <div className={styles.doneIconRing}>
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h1 className={styles.doneTitle}>문의가 접수되었습니다</h1>
            <p className={styles.doneDesc}>
              담당 매니저가 확인 후 연락드리겠습니다.
            </p>
            <button className={styles.additionalBtn} onClick={handleAdditional}>
              <MessageCircle size={15} />
              추가 문의하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ══ STATE 2: inquiry form ══ */
  const isSubmittable = category && title.trim().length > 0 && content.length >= MIN_CONTENT;

  return (
    <div className={styles.page}>
      <div className={styles.formWrap}>
        <div className={styles.brandMark}>
          <span className={styles.brandDot} />
          <span className={styles.brandName}>Knots &amp; Links</span>
          <span className={styles.brandDot} />
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div className={styles.formIconWrap}>
              <MessageCircle size={15} />
            </div>
            <h1 className={styles.formTitle}>문의사항 등록</h1>
          </div>
          <p className={styles.formDesc}>
            문의사항이 있으시면 아래에 등록해주세요.<br />
            담당 매니저에게 전달됩니다.
          </p>

          <form onSubmit={handleSubmit} className={styles.inquiryForm}>
            {/* ── category chips ── */}
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>카테고리</span>
              <div className={styles.chipRow}>
                {CATEGORIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.chip} ${category === value ? styles.chipActive : ''}`}
                    onClick={() => setCategory(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── title input ── */}
            <div className={styles.fieldGroup}>
              <div className={styles.textareaHeader}>
                <span className={styles.fieldLabel}>제목</span>
                <span className={styles.charCount}>{title.length} / {MAX_TITLE}</span>
              </div>
              <input
                type="text"
                className={styles.titleInput}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE))}
                placeholder="문의 제목을 입력해주세요."
                maxLength={MAX_TITLE}
              />
            </div>

            {/* ── content textarea ── */}
            <div className={styles.fieldGroup}>
              <div className={styles.textareaHeader}>
                <span className={styles.fieldLabel}>내용</span>
                <span className={`${styles.charCount} ${content.length < MIN_CONTENT && content.length > 0 ? styles.charCountWarn : ''}`}>
                  {content.length} / {MAX_CONTENT}
                </span>
              </div>
              <textarea
                className={styles.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
                placeholder="문의 내용을 입력해주세요."
                rows={6}
              />
              {content.length > 0 && content.length < MIN_CONTENT && (
                <div className={styles.textareaHint}>
                  <X size={11} />
                  최소 {MIN_CONTENT}자 이상 입력해주세요. ({MIN_CONTENT - content.length}자 부족)
                </div>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!isSubmittable || submitting}
            >
              {submitting ? (
                <span className={styles.btnSpinner} />
              ) : (
                <>
                  <Send size={15} />
                  등록하기
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
