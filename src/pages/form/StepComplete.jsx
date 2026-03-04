import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, CheckCircle } from 'lucide-react';
import useFormStore from '../../store/formStore';
import { MADAM_QUOTES } from '../../data/constants';
import styles from './StepComplete.module.css';

export default function StepComplete() {
  const navigate = useNavigate();
  const resetForm = useFormStore((s) => s.resetForm);
  const [showSeal, setShowSeal] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowSeal(true), 400);
    const t2 = setTimeout(() => setShowMessage(true), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleHome = () => {
    resetForm();
    navigate('/');
  };

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
        <p className={styles.madamWords}>"{MADAM_QUOTES.complete}"</p>
        <p className={styles.sub}>
          마담MJ가 당신의 소개서를 정성스럽게 읽고,<br />
          가장 어울리는 인연을 찾아볼게요.
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
