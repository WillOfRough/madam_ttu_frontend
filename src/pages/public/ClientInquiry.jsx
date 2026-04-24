import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircle, Check, Send, AlertCircle, X, ShieldCheck,
         RefreshCw, Layers, Calendar, CreditCard, HelpCircle } from 'lucide-react';
import { getMyProfile, submitInquiry } from '../../api/clientService';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import { toast } from '../../store/toastStore';
import styles from './ClientInquiry.module.css';

/* ─── category constants ─── */
const CATEGORIES = [
  { value: 'matching',      label: '매칭 관련',   Icon: Layers },
  { value: 'profile_edit',  label: '프로필 수정',  Icon: RefreshCw },
  { value: 'schedule',      label: '일정',        Icon: Calendar },
  { value: 'payment',       label: '입금/결제',    Icon: CreditCard },
  { value: 'other',         label: '기타',        Icon: HelpCircle },
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

  /* ─── reset for additional inquiry ─── */
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
        <div className={styles.blobTop} aria-hidden />
        <div className={styles.blobBottom} aria-hidden />

        <div className={styles.verifyWrap}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} />
            <span className={styles.brandName}>Knots &amp; Links</span>
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
                <div className={styles.loadingRow}>
                  <span className={styles.btnSpinner} />
                  <span>프로필을 확인하는 중입니다...</span>
                </div>
              )}

              {verifyError && (
                <div className={styles.verifyError}>
                  <AlertCircle size={13} />
                  <span>{verifyError}</span>
                </div>
              )}
            </div>

            <div className={styles.verifyFootnote}>
              <ShieldCheck size={13} />
              개인정보는 안전하게 보호됩니다.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ STATE 3: done ══ */
  if (step === 'done') {
    return (
      <div className={styles.page}>
        <div className={styles.blobTop} aria-hidden />
        <div className={styles.blobBottom} aria-hidden />

        <div className={styles.doneWrap}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} />
            <span className={styles.brandName}>Knots &amp; Links</span>
          </div>

          <div className={styles.doneCard}>
            <div className={styles.doneIconRing}>
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h1 className={styles.doneTitle}>문의가 접수되었습니다</h1>
            <p className={styles.doneDesc}>
              담당 매니저가 확인 후 연락드리겠습니다.
            </p>

            {/* Next steps */}
            <div className={styles.doneSteps}>
              {[
                { n: '1', t: '문의 접수 완료', sub: '방금 전' },
                { n: '2', t: '매니저 확인', sub: '보통 1 영업일 이내' },
                { n: '3', t: '답변 안내', sub: '문자 또는 전화로 연락드려요' },
              ].map((s, i, arr) => (
                <div key={i} className={styles.doneStep}>
                  <div className={[styles.doneStepDot, i === 0 ? styles.doneStepDotActive : ''].join(' ')}>
                    {s.n}
                  </div>
                  {i < arr.length - 1 && <div className={styles.doneStepLine} />}
                  <div className={styles.doneStepText}>
                    <div className={styles.doneStepTitle}>{s.t}</div>
                    <div className={styles.doneStepSub}>{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>

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
      <div className={styles.blobTop} aria-hidden />
      <div className={styles.blobBottom} aria-hidden />

      <div className={styles.formWrap}>
        <div className={styles.brandRow}>
          <div className={styles.brandMark} />
          <span className={styles.brandName}>Knots &amp; Links</span>
        </div>

        {/* Hero header */}
        <div className={styles.formHero}>
          <div className={styles.formHeroIcon}>
            <MessageCircle size={22} strokeWidth={1.8} />
          </div>
          <h1 className={styles.formTitle}>문의하기</h1>
          <p className={styles.formDesc}>
            궁금하신 사항을 남겨주시면<br />담당 매니저가 빠르게 답변드릴게요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.inquiryForm}>
          {/* ── category grid ── */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <span className={styles.fieldLabel}>문의 유형</span>
              <span className={styles.fieldReq}>필수</span>
            </div>
            <div className={styles.categoryGrid}>
              {CATEGORIES.map(({ value, label, Icon: CatIcon }) => (
                <button
                  key={value}
                  type="button"
                  className={[styles.categoryCard, category === value ? styles.categoryCardActive : ''].join(' ')}
                  onClick={() => setCategory(value)}
                >
                  <CatIcon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── title input ── */}
          <div className={styles.fieldGroup}>
            <div className={styles.textareaHeader}>
              <div className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>제목</span>
                <span className={styles.fieldReq}>필수</span>
              </div>
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
              <div className={styles.fieldLabelRow}>
                <span className={styles.fieldLabel}>내용</span>
                <span className={styles.fieldReq}>필수</span>
              </div>
              <span className={`${styles.charCount} ${content.length < MIN_CONTENT && content.length > 0 ? styles.charCountWarn : ''}`}>
                {content.length} / {MAX_CONTENT}
              </span>
            </div>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
              placeholder="문의 내용을 자세히 적어주시면 더 빠르게 답변드릴 수 있어요."
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
                문의 보내기
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
