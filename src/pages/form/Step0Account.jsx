import { useState } from 'react';
import { Mail, Lock, AlertCircle, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useFormStore from '../../store/formStore';
import { MADAM_QUOTES } from '../../data/constants';
import styles from './Step0Account.module.css';

export default function Step0Account() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const { signup, login, isLoading, error, clearError } = useAuthStore();
  const nextStep = useFormStore((s) => s.nextStep);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password === confirmPassword;
  const canSubmit =
    isValidEmail &&
    password.length >= 8 &&
    (mode === 'login' || (passwordsMatch && name.trim().length > 0)) &&
    !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    try {
      if (mode === 'signup') {
        await signup({ email, password, name: name.trim() });
      } else {
        await login({ email, password });
      }
      nextStep();
    } catch {
      // error is set in store
    }
  };

  return (
    <div className={styles.step}>
      {/* Madam Quote */}
      <div className={styles.madamQuote}>
        <div className={styles.quoteMark}>&ldquo;</div>
        <p>{MADAM_QUOTES.welcome}</p>
        <div className={styles.quoteBar} />
      </div>

      {/* Account Form */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          {mode === 'signup'
            ? '마담MJ의 서재에 등록하기'
            : '이미 등록하셨나요?'}
        </h3>
        <p className={styles.cardSub}>
          {mode === 'signup'
            ? '소중한 인연을 위해 간단한 계정을 만들어 주세요'
            : '등록하신 이메일로 로그인해 주세요'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                placeholder="이름"
                autoFocus
                autoComplete="name"
              />
            </div>
          )}

          <div className={styles.inputWrap}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="이메일 주소"
              autoFocus={mode === 'login'}
              autoComplete="email"
            />
          </div>

          <div className={styles.inputWrap}>
            <Lock size={16} className={styles.inputIcon} />
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              placeholder="비밀번호 (8자 이상)"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'signup' && (
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                placeholder="비밀번호 확인"
                autoComplete="new-password"
              />
              {confirmPassword && !passwordsMatch && (
                <p className={styles.fieldError}>비밀번호가 일치하지 않습니다</p>
              )}
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.btn}
            disabled={!canSubmit}
          >
            {isLoading
              ? '잠시만 기다려 주세요...'
              : mode === 'signup'
                ? '등록하고 시작하기'
                : '로그인하기'}
          </button>
        </form>

        <button
          className={styles.toggleLink}
          onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); clearError(); }}
          type="button"
        >
          {mode === 'signup'
            ? '이미 계정이 있으신가요? 로그인'
            : '처음이신가요? 새로 등록하기'}
        </button>
      </div>
    </div>
  );
}
