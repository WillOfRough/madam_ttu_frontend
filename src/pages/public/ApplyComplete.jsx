import { CheckCircle } from 'lucide-react';
import styles from './ApplyComplete.module.css';

const NEXT_STEPS = [
  { label: '매니저 검토', desc: '매니저가 프로필을 꼼꼼하게 검토합니다.' },
  { label: '매칭 제안', desc: '어울리는 상대를 찾으면 제안 문자를 드려요.' },
  { label: '만남 조율', desc: '수락하시면 일정과 장소를 함께 조율해 드립니다.' },
];

export default function ApplyComplete() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <CheckCircle size={36} />
        </div>
        <h1 className={styles.title}>프로필 등록 완료!</h1>
        <p className={styles.message}>
          소중한 프로필을 등록해주셔서 감사합니다.
        </p>
        <p className={styles.subMessage}>
          매니저가 프로필을 검토한 후 연락드릴 예정입니다.
          <br />좋은 인연이 찾아올 거예요.
        </p>

        <div className={styles.steps}>
          {NEXT_STEPS.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum}>{i + 1}</div>
              <div className={styles.stepBody}>
                <p className={styles.stepLabel}>{s.label}</p>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
