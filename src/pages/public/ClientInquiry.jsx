import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Phone, MessageCircle, Check, Send, AlertCircle, X } from 'lucide-react';
import { getMyProfile } from '../../api/clientService';
import { submitInquiry } from '../../api/clientService';
import { toast } from '../../store/toastStore';
import styles from './ClientInquiry.module.css';

/* ─── helpers ─── */
function formatPhoneInput(val) {
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/* ─── category constants ─── */
const CATEGORIES = [
  { value: 'matching', label: '매칭 관련' },
  { value: 'profile', label: '프로필 관련' },
  { value: 'payment', label: '결제 관련' },
  { value: 'other', label: '기타' },
];

const MAX_CONTENT = 1000;
const MIN_CONTENT = 10;

/* ══════════════════════════════════════════════ */
export default function ClientInquiry() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  /* ── verification state ── */
  const [phone, setPhone] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');

  /* ── form state ── */
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ── step: 'verify' | 'form' | 'done' ── */
  const [step, setStep] = useState('verify');

  /* ─── verify handler ─── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!token) {
      setVerifyError('유효하지 않은 링크입니다. 매니저에게 문의해주세요.');
      return;
    }
    const rawPhone = phone.replace(/-/g, '');
    if (rawPhone.length < 10) {
      setVerifyError('올바른 전화번호를 입력해주세요.');
      return;
    }
    setVerifying(true);
    setVerifyError('');
    try {
      await getMyProfile(token, rawPhone);
      setVerifiedPhone(rawPhone);
      setStep('form');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('전화번호') || msg.includes('404') || err.status === 404) {
        setVerifyError('전화번호가 일치하지 않습니다. 다시 확인해주세요.');
      } else if (msg.includes('토큰') || msg.includes('초대')) {
        setVerifyError('유효하지 않은 링크입니다. 매니저에게 문의해주세요.');
      } else {
        setVerifyError(msg || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setVerifying(false);
    }
  };

  /* ─── submit handler ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || content.length < MIN_CONTENT) return;
    setSubmitting(true);
    try {
      await submitInquiry(token, verifiedPhone, { category, content });
      toast.success('문의가 등록되었습니다.');
      setStep('done');
    } catch (err) {
      toast.error(err.message || '문의 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── reset for additional inquiry ─── */
  const handleAdditional = () => {
    setCategory('');
    setContent('');
    setStep('form');
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
              <Phone size={26} strokeWidth={1.8} />
            </div>
            <h1 className={styles.verifyTitle}>본인 확인이 필요합니다</h1>
            <p className={styles.verifyDesc}>
              문의 등록을 위해 가입 시 등록한<br />전화번호를 입력해주세요.
            </p>

            <form onSubmit={handleVerify} className={styles.verifyForm}>
              <div className={`${styles.inputWrap} ${verifyError ? styles.inputWrapError : ''}`}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => {
                    setVerifyError('');
                    setPhone(formatPhoneInput(e.target.value));
                  }}
                  maxLength={13}
                  className={styles.phoneInput}
                  autoComplete="tel"
                  autoFocus
                />
              </div>

              {verifyError && (
                <div className={styles.verifyError}>
                  <AlertCircle size={13} />
                  <span>{verifyError}</span>
                </div>
              )}

              <button
                type="submit"
                className={styles.verifyBtn}
                disabled={verifying || phone.replace(/-/g, '').length < 10}
              >
                {verifying ? (
                  <span className={styles.btnSpinner} />
                ) : (
                  <>
                    <Check size={16} />
                    확인
                  </>
                )}
              </button>
            </form>

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
  const isSubmittable = category && content.length >= MIN_CONTENT;

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
