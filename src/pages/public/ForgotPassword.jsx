import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { sendEmailCode, verifyEmailCode } from '../../api/verificationService';
import { resetPassword } from '../../api/authService';
import { getApiErrorMessage } from '../../api/config';
import BrandLogo from '../../components/BrandLogo';
import styles from './ForgotPassword.module.css';

const RESEND_COOLDOWN = 180; // 재발송 쿨다운 3분(초)

// 백엔드 에러 코드 → 사용자 메시지. { error, message } 형식 응답을 err.body.error 로 받는다.
const ERROR_MESSAGES = {
  '4.001': '가입되지 않은 이메일입니다.',
  '7.001': '인증번호를 방금 발송했어요. 잠시 후 다시 시도해주세요.',
  '7.002': '인증 시간이 만료되었습니다. 인증번호를 다시 받아주세요.',
  '7.003': '인증번호가 일치하지 않습니다. 다시 확인해주세요.',
  '7.004': '인증 정보가 만료되었습니다. 처음부터 다시 진행해주세요.',
  '7.005': '인증 시도 횟수를 초과했습니다. 3분 후 다시 시도해주세요.',
  '3.001': '비밀번호가 일치하지 않습니다.',
};

function resolveError(err, fallback) {
  const code = err?.body?.error;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (code === 'VALIDATION_ERROR') return getApiErrorMessage(err, fallback);
  const raw = err?.message;
  if (raw && /[가-힣]/.test(raw)) return raw;
  return fallback;
}

// 7.002(만료)/7.004(누락·소모) 는 인증 자체를 다시 받아야 하므로 ① 발송 단계로 되돌린다.
function isReauthError(err) {
  const code = err?.body?.error;
  return code === '7.002' || code === '7.004' || code === '4.001';
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'password' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const codeInputRef = useRef(null);

  // 재발송 쿨다운 카운트다운
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const codeValid = /^\d{6}$/.test(code);
  const pwValid = newPassword.length >= 8 && newPassword === confirmPassword;

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!emailValid || loading || cooldown > 0) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await sendEmailCode(email.trim());
      setCooldown(RESEND_COOLDOWN);
      setStep('code');
      setNotice('인증번호를 메일로 보냈어요. 메일이 안 보이면 스팸함도 확인해주세요.');
      setTimeout(() => codeInputRef.current?.focus(), 50);
    } catch (err) {
      const errCode = err?.body?.error;
      // 7.001(쿨다운: 이미 최근 발송됨) / 7.005(시도 초과) 면 재발송 버튼을 잠가 중복 호출을 막는다.
      if (errCode === '7.001' || errCode === '7.005') setCooldown(RESEND_COOLDOWN);
      // 이미 발송된 코드가 있으므로(7.001), 이메일 단계라면 코드 입력 단계로 넘겨 입력을 받는다.
      if (errCode === '7.001' && step === 'email') {
        setStep('code');
        setTimeout(() => codeInputRef.current?.focus(), 50);
      }
      setError(resolveError(err, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!codeValid || loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await verifyEmailCode(email.trim(), code);
      setVerificationId(res?.verificationId || '');
      setStep('password');
      setNotice(null);
    } catch (err) {
      if (isReauthError(err)) {
        setStep('email');
        setCode('');
        setVerificationId('');
      }
      setError(resolveError(err, '인증번호 확인에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError(null);
    if (newPassword.length < 8) {
      setError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: email.trim(), verificationId, newPassword, confirmPassword });
      setStep('done');
    } catch (err) {
      if (isReauthError(err)) {
        // 인증 만료/소모 → 처음부터 다시
        setStep('email');
        setCode('');
        setVerificationId('');
        setNewPassword('');
        setConfirmPassword('');
      }
      setError(resolveError(err, '비밀번호 재설정에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => navigate('/login', { replace: true });

  const stepNum = step === 'email' ? 1 : step === 'code' ? 2 : 3;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Brand row */}
        <div className={styles.brandRow}>
          <BrandLogo size={30} />
          <span className={styles.brandBadge}>MANAGER</span>
        </div>

        {step === 'done' ? (
          <div className={styles.doneCard}>
            <div className={styles.doneIcon}>
              <CheckCircle2 size={30} color="var(--mint-600)" />
            </div>
            <h1 className={styles.doneTitle}>비밀번호가 변경됐어요</h1>
            <p className={styles.doneSub}>
              새 비밀번호로 다시 로그인해주세요.<br />
              로그인 실패 잠금도 함께 해제됐어요.
            </p>
            <button type="button" className={styles.submitBtn} onClick={goLogin}>
              로그인하러 가기
            </button>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className={styles.hero}>
              <p className={styles.heroEyebrow}>비밀번호 재설정</p>
              <h1 className={styles.heroTitle}>
                {step === 'email' && <>비밀번호를<br /><em>잊으셨나요?</em></>}
                {step === 'code' && <>메일로 받은<br /><em>인증번호</em>를 입력해주세요</>}
                {step === 'password' && <>새 비밀번호를<br /><em>설정</em>해주세요</>}
              </h1>
              <p className={styles.heroSub}>
                {step === 'email' && '가입한 이메일로 6자리 인증번호를 보내드려요.'}
                {step === 'code' && '인증번호는 3분 30초 동안 유효해요.'}
                {step === 'password' && '8자 이상으로 안전한 비밀번호를 입력해주세요.'}
              </p>
            </div>

            {/* Step indicator */}
            <div className={styles.steps}>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`${styles.stepDot} ${n === stepNum ? styles.stepActive : ''} ${n < stepNum ? styles.stepDone : ''}`}
                />
              ))}
            </div>

            {/* ① 이메일 입력 */}
            {step === 'email' && (
              <form onSubmit={handleSend}>
                <div className={styles.formCard}>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>이메일</div>
                    <div className={styles.fieldInner}>
                      <Mail size={15} color="var(--ink-300)" />
                      <input
                        className={styles.fieldInput}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="manager@knotsandlinks.com"
                        autoFocus
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button className={styles.submitBtn} type="submit" disabled={loading || !emailValid}>
                  {loading ? '발송 중...' : '인증번호 받기'}
                </button>
              </form>
            )}

            {/* ② 인증번호 확인 */}
            {step === 'code' && (
              <form onSubmit={handleVerify}>
                <div className={styles.formCard}>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>인증번호 (6자리)</div>
                    <div className={styles.fieldInner}>
                      <KeyRound size={15} color="var(--ink-300)" />
                      <input
                        ref={codeInputRef}
                        className={`${styles.fieldInput} ${styles.codeInput}`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.resendRow}>
                  <span className={styles.resendTo}>{email} 으로 발송</span>
                  <button
                    type="button"
                    className={styles.resendBtn}
                    onClick={handleSend}
                    disabled={loading || cooldown > 0}
                  >
                    {cooldown > 0 ? `재발송 (${cooldown}초)` : '재발송'}
                  </button>
                </div>

                {notice && <p className={styles.notice}>{notice}</p>}
                {error && <p className={styles.error}>{error}</p>}

                <button className={styles.submitBtn} type="submit" disabled={loading || !codeValid}>
                  {loading ? '확인 중...' : '인증번호 확인'}
                </button>
                <button
                  type="button"
                  className={styles.backLink}
                  onClick={() => { setStep('email'); setCode(''); setError(null); setNotice(null); }}
                >
                  <ArrowLeft size={13} /> 다른 이메일로 받기
                </button>
              </form>
            )}

            {/* ③ 새 비밀번호 */}
            {step === 'password' && (
              <form onSubmit={handleReset}>
                <div className={styles.formCard}>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>새 비밀번호</div>
                    <div className={styles.fieldInner}>
                      <Lock size={15} color="var(--ink-300)" />
                      <input
                        className={styles.fieldInput}
                        type={showPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="8자 이상"
                        autoComplete="new-password"
                        autoFocus
                        required
                      />
                      <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                        {showPw ? '숨기기' : '보기'}
                      </button>
                    </div>
                  </div>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldLabel}>새 비밀번호 확인</div>
                    <div className={styles.fieldInner}>
                      <Lock size={15} color="var(--ink-300)" />
                      <input
                        className={styles.fieldInput}
                        type={showPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="한 번 더 입력"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                </div>

                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className={styles.hintWarn}>비밀번호가 일치하지 않아요.</p>
                )}
                {error && <p className={styles.error}>{error}</p>}

                <button className={styles.submitBtn} type="submit" disabled={loading || !pwValid}>
                  {loading ? '변경 중...' : '비밀번호 재설정'}
                </button>
              </form>
            )}

            {/* Trust band */}
            <div className={styles.trustBand}>
              <div className={styles.trustIcon}>
                <ShieldCheck size={14} color="var(--tangerine-700)" />
              </div>
              <div className={styles.trustText}>
                <strong>인증번호는 메일로만 전달돼요</strong>
                <span>인증번호와 비밀번호는 안전하게 처리됩니다</span>
              </div>
            </div>

            <p className={styles.footer}>
              비밀번호가 기억나셨나요?{' '}
              <button type="button" className={styles.footerLink} onClick={goLogin}>
                로그인으로 돌아가기
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
