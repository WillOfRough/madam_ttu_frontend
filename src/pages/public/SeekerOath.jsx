import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import styles from './SeekerOath.module.css';

const OATH_ITEMS = [
  '기혼자 및 교제 중인 분은 가입이 불가합니다.',
  '허위 정보 기재 시 법적/도의적 책임을 질 수 있습니다.',
  '본인의 양심에 따라 정직하게 작성해주세요.',
];

export default function SeekerOath() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleProceed = () => {
    if (agreed) {
      navigate(`/apply/${token}`);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <AlertTriangle size={36} />
        </div>
        <h1 className={styles.title}>진지한 만남을 위해</h1>
        <h2 className={styles.subtitle}>꼭 읽어주세요</h2>

        <div className={styles.items}>
          {OATH_ITEMS.map((text, idx) => (
            <div key={idx} className={styles.item}>
              <span className={styles.itemNum}>{idx + 1}.</span>
              <span className={styles.itemText}>{text}</span>
            </div>
          ))}
        </div>

        <label className={styles.agreeLabel}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className={styles.checkbox}
          />
          <span>위 내용을 숙지했으며 서약합니다.</span>
        </label>

        <button
          className={styles.proceedBtn}
          onClick={handleProceed}
          disabled={!agreed}
        >
          서약하고 시작하기
        </button>
      </div>
    </div>
  );
}
