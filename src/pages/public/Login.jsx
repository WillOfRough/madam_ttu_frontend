import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
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
    case 400:
      return '이메일과 비밀번호를 올바르게 입력해주세요.';
    case 401:
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 429:
      return '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.';
    case 500:
    case 502:
    case 503:
    case 504:
      return '일시적인 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    default:
      break;
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
  const [error, setError] = useState(null);

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

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <p className={styles.subtitle}>매니저 로그인</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              required
              enterKeyHint="go"
            />
          </div>

          <label className={styles.remember}>
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
            />
            <span>이메일 기억하기</span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={isLoading}
            onMouseDown={(e) => e.preventDefault()}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
