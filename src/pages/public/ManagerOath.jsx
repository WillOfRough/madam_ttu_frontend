import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import styles from './ClientOath.module.css';

const OATH_ITEMS = [
  '매칭 과정에서 취득한 회원의 개인정보(이름, 연락처, 사진 등)를 제3자에게 무단으로 제공하거나 유출하지 않겠습니다.',
  '수집된 개인정보는 매칭 목적 이외의 용도로 사용하지 않겠습니다.',
  '매칭이 종료되거나 회원이 탈퇴를 요청한 경우, 관련 정보를 지체 없이 삭제하겠습니다.',
  '위 사항을 위반할 경우 서비스 이용 제한 및 법적 책임을 질 수 있음을 이해합니다.',
];

export default function ManagerOath() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);

  const handleProceed = () => {
    if (agreed) {
      navigate('/signup', { state: { oathAgreed: true } });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <ShieldCheck size={36} />
        </div>
        <h1 className={styles.title}>회원 정보 보호 서약</h1>
        <h2 className={styles.subtitle}>매니저로서 꼭 지켜주세요</h2>

        <div className={styles.items}>
          {OATH_ITEMS.map((text, idx) => (
            <div key={idx} className={styles.item}>
              <span className={styles.itemNum}>{idx + 1}.</span>
              <span className={styles.itemText}>{text}</span>
            </div>
          ))}
        </div>

        <label className={styles.agreeAllLabel}>
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
          서약하고 회원가입 진행하기
        </button>
      </div>
    </div>
  );
}
