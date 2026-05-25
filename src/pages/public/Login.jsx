import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import ConfirmModal from '../../components/ConfirmModal';
import BrandLogo from '../../components/BrandLogo';
import styles from './Login.module.css';

const REMEMBER_KEY = 'knl_remember_email';

const LOGIN_ERROR_MESSAGES = {
  '1.001': '이메일 또는 비밀번호가 올바르지 않습니다.',
  '1.002': '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.',
  VALIDATION_ERROR: '이메일과 비밀번호를 올바르게 입력해주세요.',
};

function resolveLoginErrorMessage(err) {
  const code = err?.body?.error;
  if (code && LOGIN_ERROR_MESSAGES[code]) return LOGIN_ERROR_MESSAGES[code];

  switch (err?.status) {
    case 400: return '이메일과 비밀번호를 올바르게 입력해주세요.';
    case 401: return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 429: return '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.';
    case 500: case 502: case 503: case 504:
      return '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    default: break;
  }

  const raw = err?.message;
  if (raw && /[가-힣]/.test(raw)) return raw;
  return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const savedEmail = localStorage.getItem(REMEMBER_KEY) || '';
  const [email, setEmail] = useState(savedEmail);
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(!!savedEmail);
  const [showPw, setShowPw] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const [error, setError] = useState(null);
  const [inviteRequestOpen, setInviteRequestOpen] = useState(false);

  const canSubmit = email.includes('@') && password.length >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (rememberEmail) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(resolveLoginErrorMessage(err));
    }
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Brand row */}
        <div className={styles.brandRow}>
          <BrandLogo size={30} />
          <span className={styles.brandBadge}>MANAGER</span>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <p className={styles.heroEyebrow}>{greeting}</p>
          <h1 className={styles.heroTitle}>
            다시 오셨군요,<br />
            <em>매니저</em>님.
          </h1>
          <p className={styles.heroSub}>
            오늘도 누군가의 인연이 당신의 손길을 기다리고 있어요.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className={styles.formCard}>
            {/* Email */}
            <div className={styles.fieldRow}>
              <div className={`${styles.fieldLabel} ${focusField === 'email' ? styles.focused : ''}`}>
                이메일
              </div>
              <div className={styles.fieldInner}>
                <Mail size={15} color={focusField === 'email' ? 'var(--tangerine-700)' : 'var(--ink-300)'} />
                <input
                  className={styles.fieldInput}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                  placeholder="manager@knotsandlinks.com"
                  required
                  autoFocus
                />
                {email.includes('@') && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--mint-600)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4.5 4.5L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Password */}
            <div className={styles.fieldRow}>
              <div className={`${styles.fieldLabel} ${focusField === 'pw' ? styles.focused : ''}`}>
                비밀번호
              </div>
              <div className={styles.fieldInner}>
                <Lock size={15} color={focusField === 'pw' ? 'var(--tangerine-700)' : 'var(--ink-300)'} />
                <input
                  className={styles.fieldInput}
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('pw')}
                  onBlur={() => setFocusField(null)}
                  placeholder="••••••••"
                  required
                  enterKeyHint="go"
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(!showPw)}>
                  {showPw ? '숨기기' : '보기'}
                </button>
              </div>
            </div>
          </div>

          {/* Remember */}
          <div className={styles.metaRow}>
            <label className={styles.rememberLabel}>
              <input
                type="checkbox"
                className={styles.rememberInput}
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              <div className={`${styles.customCheckbox} ${rememberEmail ? '' : styles.unchecked}`}>
                {rememberEmail && <div className={styles.checkmark} />}
              </div>
              <span className={styles.rememberText}>이메일 기억하기</span>
            </label>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={isLoading || !canSubmit}
            onMouseDown={(e) => e.preventDefault()}
          >
            {isLoading ? '로그인 중...' : '로그인'}
            {!isLoading && canSubmit && (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </form>

        {/* Trust band */}
        <div className={styles.trustBand}>
          <div className={styles.trustIcon}>
            <ShieldCheck size={14} color="var(--tangerine-700)" />
          </div>
          <div className={styles.trustText}>
            <strong>회원 정보는 암호화되어 보관돼요</strong>
            <span>매니저 서약에 따라 안전하게 관리됩니다</span>
          </div>
        </div>

        {/* Footer */}
        <p className={styles.footer}>
          아직 매니저가 아니세요?{' '}
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => setInviteRequestOpen(true)}
          >
            기존 매니저에게 초대 요청하기
          </button>
        </p>
      </div>

      {inviteRequestOpen && (
        <ConfirmModal
          title="기존 매니저에게 초대 요청"
          message="현재 활동 중인 매니저에게 직접 연락하여 초대 링크를 요청해주세요. 매니저는 [대시보드 > 매니저 연결] 메뉴에서 초대 링크를 생성할 수 있습니다."
          confirmLabel="확인"
          cancelLabel="닫기"
          onConfirm={() => setInviteRequestOpen(false)}
          onCancel={() => setInviteRequestOpen(false)}
        />
      )}
    </div>
  );
}
