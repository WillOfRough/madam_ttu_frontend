import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import styles from './EventIntro.module.css';

const SERVICE_HIGHLIGHTS = [
  { emoji: '💳', title: '가입비 0원, 매칭될 때만!', desc: '실제로 매칭이 성사되었을 때만 딱 29,900원. 가입비·월정액 부담 없이 시작하세요.' },
  { emoji: '🔒', title: '만나기 전까지 당신은 익명', desc: '동의 없이는 어떠한 개인정보도 상대방에게 노출되지 않도록 철저히 익명을 유지합니다.' },
  { emoji: '📅', title: '번거로운 연락은 저희가 할게요', desc: '매니저가 약속 일정부터 장소까지 모두 세심하게 조율해 드립니다.' },
];

function useReveal() {
  const [visible, setVisible] = useState(new Set());
  const refs = useRef([]);

  const register = useCallback((idx) => (el) => {
    refs.current[idx] = el;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = refs.current.indexOf(entry.target);
            if (idx !== -1) {
              setVisible((prev) => new Set([...prev, idx]));
              observer.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    refs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  return { register, visible };
}

export default function EventIntro() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, visible } = useReveal();
  const partner = searchParams.get('partner');
  let itemIdx = 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Special Banner (Knots & Links 특별 혜택) ── */}
        <div className={`${styles.specialBanner} ${styles.specialBannerTop}`}>
          <div className={styles.specialBannerTag}>Knots &amp; Links 특별 혜택</div>
          <p className={styles.specialBannerTitle}>
            {partner ? `${partner}와 함께하는` : null}
            {partner ? <br /> : null}
            특별 이벤트!
          </p>
          <p className={styles.specialBannerHighlight}>
            Knots &amp; Links를 통해 가입하시면<br />
            <strong>첫 1회 매칭 무료!</strong>
          </p>
          <p className={styles.specialBannerDesc}>
            가입비 0원은 물론, 첫 매칭 성사 시 매칭비(29,900원)도<br />무료로 진행됩니다.
          </p>
        </div>

        {/* ── Section: 서비스 하이라이트 ── */}
        <div className={styles.section}>
          {(() => {
            const hIdx = itemIdx++;
            return (
              <h2
                ref={register(hIdx)}
                className={`${styles.sectionHeader} ${visible.has(hIdx) ? styles.revealed : ''}`}
              >
                Knots &amp; Links 서비스
              </h2>
            );
          })()}
          {SERVICE_HIGHLIGHTS.map((card, i) => {
            const idx = itemIdx++;
            return (
              <div
                key={i}
                ref={register(idx)}
                className={`${styles.card} ${visible.has(idx) ? styles.revealed : ''}`}
                style={{ transitionDelay: `${i * 0.08}s` }}
              >
                <div className={styles.cardEmoji}>{card.emoji}</div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardDesc}>{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <div className={styles.ctaWrap}>
          <button
            className={styles.ctaBtn}
            onClick={() => navigate(`/apply/oath/${token}`)}
          >
            지금 바로 신청하기
            <ArrowRight size={15} />
          </button>
          <p className={styles.footerNote}>
            ※ 노쇼 방지를 위해 참가비는 최종 선정 이후에 입금안내드리고
            이후 환불 불가 및 정예 인원으로 운영됩니다.
          </p>
        </div>

      </div>
    </div>
  );
}
