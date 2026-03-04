import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import useFormStore from '../../store/formStore';
import useAuthStore from '../../store/authStore';
import { createProfile } from '../../api/profileService';
import { mapFormToProfileJson } from '../../utils/profileMapper';
import { MADAM_QUOTES } from '../../data/constants';
import styles from './StepComplete.module.css';

export default function StepComplete() {
  const navigate = useNavigate();
  const resetForm = useFormStore((s) => s.resetForm);
  const formData = useFormStore((s) => s.formData);
  const accountId = useAuthStore((s) => s.accountId);
  const email = useAuthStore((s) => s.email);

  const [showSeal, setShowSeal] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [submitState, setSubmitState] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const submitted = useRef(false);

  const submitProfile = async () => {
    setSubmitState('loading');
    setErrorMsg('');
    try {
      const profileJson = mapFormToProfileJson(formData, email);
      await createProfile(accountId, profileJson);
      setSubmitState('success');
    } catch (err) {
      setSubmitState('error');
      setErrorMsg(err.message || '프로필 제출에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (!submitted.current) {
      submitted.current = true;
      submitProfile();
    }
  }, []);

  useEffect(() => {
    if (submitState === 'success') {
      const t1 = setTimeout(() => setShowSeal(true), 400);
      const t2 = setTimeout(() => setShowMessage(true), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [submitState]);

  const handleHome = () => {
    resetForm();
    navigate('/');
  };

  const handleRetry = () => {
    submitProfile();
  };

  // Loading state
  if (submitState === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.sealWrap + ' ' + styles.visible}>
          <div className={styles.seal}>
            <Heart size={32} />
          </div>
        </div>
        <div className={styles.message + ' ' + styles.visible}>
          <h2>마담MJ에게 전달하고 있어요...</h2>
          <p className={styles.sub}>잠시만 기다려 주세요</p>
        </div>
      </div>
    );
  }

  // Error state
  if (submitState === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.errorIcon}>
          <AlertCircle size={48} />
        </div>
        <div className={styles.message + ' ' + styles.visible}>
          <h2>전달에 실패했습니다</h2>
          <p className={styles.sub}>{errorMsg}</p>
        </div>
        <div className={styles.actions + ' ' + styles.visible}>
          <button className={styles.homeBtn} onClick={handleRetry}>
            <RefreshCw size={16} />
            다시 시도하기
          </button>
          <button
            className={styles.homeBtn}
            onClick={handleHome}
            style={{ marginTop: '8px' }}
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className={styles.page}>
      {/* Wax Seal */}
      <div className={`${styles.sealWrap} ${showSeal ? styles.visible : ''}`}>
        <div className={styles.seal}>
          <Heart size={32} />
        </div>
      </div>

      {/* Checkmark */}
      <div className={`${styles.check} ${showSeal ? styles.visible : ''}`}>
        <CheckCircle size={48} />
      </div>

      {/* Message */}
      <div className={`${styles.message} ${showMessage ? styles.visible : ''}`}>
        <h2>전달이 완료되었습니다</h2>
        <p className={styles.madamWords}>&ldquo;{MADAM_QUOTES.complete}&rdquo;</p>
        <p className={styles.sub}>
          좋은 인연을 기대해 주세요!
        </p>
      </div>

      {/* Action */}
      <div className={`${styles.actions} ${showMessage ? styles.visible : ''}`}>
        <button className={styles.homeBtn} onClick={handleHome}>
          처음으로 돌아가기
        </button>
      </div>
    </div>
  );
}
