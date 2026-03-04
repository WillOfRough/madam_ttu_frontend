import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles } from 'lucide-react';
import styles from './Landing.module.css';

export default function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0); // 0: nothing, 1: seal, 2: letter, 3: full

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1100);
    const t3 = setTimeout(() => setPhase(3), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className={styles.page}>
      {/* Mesh gradient background */}
      <div className={styles.meshBg} />
      <div className={styles.meshOverlay} />

      {/* Decorative corner flourishes */}
      <div className={`${styles.flourish} ${styles.topLeft}`}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M0 0C0 0 30 10 50 30S80 80 80 120" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          <path d="M0 20C0 20 20 25 35 40S55 70 55 120" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
        </svg>
      </div>
      <div className={`${styles.flourish} ${styles.bottomRight}`}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M120 120C120 120 90 110 70 90S40 40 40 0" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
          <path d="M120 100C120 100 100 95 85 80S65 50 65 0" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
        </svg>
      </div>

      <div className={styles.container}>
        {/* Wax Seal — Phase 1 */}
        <div className={`${styles.sealWrap} ${phase >= 1 ? styles.active : ''}`}>
          <div className={styles.seal}>
            <div className={styles.sealInner}>
              <Heart size={22} strokeWidth={1.5} />
            </div>
          </div>
          <div className={styles.sealGlow} />
        </div>

        {/* Letter content — Phase 2 */}
        <div className={`${styles.letter} ${phase >= 2 ? styles.active : ''}`}>
          <div className={styles.letterLine} />
          <p className={styles.letterFrom}>마담MJ가 보내는 초대장</p>
          <div className={styles.letterLine} />
        </div>

        {/* Main content — Phase 3 */}
        <div className={`${styles.main} ${phase >= 3 ? styles.active : ''}`}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>
              <Sparkles size={13} strokeWidth={1.5} />
              Since 2026
            </span>
            <h1 className={styles.title}>
              마담MJ의<br />
              <em>비밀 서재</em>
            </h1>
            <p className={styles.subtitle}>
              당신만을 위한 인연을,<br />
              한 장의 편지처럼 정성껏 찾아드립니다.
            </p>
          </div>

          <div className={styles.features}>
            <div className={styles.featureDot} />
            <span>프라이빗 매칭</span>
            <div className={styles.featureDot} />
            <span>철저한 비밀 보장</span>
            <div className={styles.featureDot} />
            <span>마담MJ의 큐레이션</span>
          </div>

          <button className={styles.cta} onClick={() => navigate('/form')}>
            <span className={styles.ctaText}>마담MJ에게 인연을 부탁하기</span>
            <span className={styles.ctaShine} />
          </button>

          <p className={styles.privacy}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            개인정보는 마담MJ만 열람합니다
          </p>
        </div>
      </div>
    </div>
  );
}
