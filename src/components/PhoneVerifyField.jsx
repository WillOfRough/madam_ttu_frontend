import { useState, useRef, useEffect, useCallback } from 'react';
import * as verificationService from '../api/verificationService';
import styles from './PhoneVerifyField.module.css';

const PHONE_REGEX = /^010-\d{4}-\d{4}$/;
const TIMER_SECONDS = 180; // 3분

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatTimer(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PhoneVerifyField({ value, onChange, onVerified, inputClassName, disabled, initialVerified = false, phoneReadOnly = false }) {
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(initialVerified);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const codeInputRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startTimer = () => {
    clearTimer();
    setTimer(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value);
    onChange(formatted);
    if (verified) {
      setVerified(false);
      setCodeSent(false);
      setCode('');
      setError('');
      clearTimer();
      onVerified?.(null);
    }
  };

  const handleSendCode = async () => {
    if (!PHONE_REGEX.test(value)) {
      setError('올바른 전화번호를 입력해주세요. (010-XXXX-XXXX)');
      return;
    }
    setSending(true);
    setError('');
    try {
      await verificationService.sendCode(value);
      setCodeSent(true);
      setCode('');
      startTimer();
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } catch (err) {
      if (err.status === 429) {
        setError('인증번호 발송 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError(err.message || '인증번호 발송에 실패했습니다.');
      }
    }
    setSending(false);
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('인증번호 6자리를 입력해주세요.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const result = await verificationService.verifyCode(value, code);
      setVerified(true);
      clearTimer();
      onVerified?.(result.verificationId);
    } catch (err) {
      if (err.message?.includes('만료')) {
        setError('인증번호가 만료되었습니다. 다시 발송해주세요.');
      } else if (err.message?.includes('일치')) {
        setError('인증번호가 일치하지 않습니다.');
      } else {
        setError(err.message || '인증 확인에 실패했습니다.');
      }
    }
    setVerifying(false);
  };

  const phoneValid = PHONE_REGEX.test(value);

  return (
    <div className={styles.wrap}>
      <div className={styles.phoneRow}>
        <input
          className={`${inputClassName || styles.input} ${verified ? styles.inputVerified : ''}`}
          value={value}
          onChange={handlePhoneChange}
          placeholder="010-0000-0000"
          maxLength={13}
          disabled={disabled || verified || phoneReadOnly}
        />
        {!verified && (
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSendCode}
            disabled={!phoneValid || sending || disabled}
          >
            {sending ? '발송 중...' : codeSent ? '재발송' : '인증번호 발송'}
          </button>
        )}
        {verified && (
          <span className={styles.verifiedBadge}>인증 완료</span>
        )}
      </div>

      {codeSent && !verified && (
        <div className={styles.codeRow}>
          <div className={styles.codeInputWrap}>
            <input
              ref={codeInputRef}
              className={inputClassName || styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="인증번호 6자리"
              maxLength={6}
              inputMode="numeric"
            />
            {timer > 0 && (
              <span className={`${styles.timer} ${timer <= 30 ? styles.timerUrgent : ''}`}>
                {formatTimer(timer)}
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.verifyBtn}
            onClick={handleVerifyCode}
            disabled={code.length !== 6 || verifying || timer === 0}
          >
            {verifying ? '확인 중...' : '인증 확인'}
          </button>
        </div>
      )}

      {codeSent && !verified && timer === 0 && (
        <p className={styles.expired}>인증번호가 만료되었습니다. 다시 발송해주세요.</p>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
