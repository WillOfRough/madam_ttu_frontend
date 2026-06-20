import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Smartphone, ArrowRight } from 'lucide-react';
import styles from './ServiceIntro.module.css';

const SECTIONS = [
  {
    header: '부담은 줄이고 실속은 챙기고',
    cards: [
      {
        emoji: '\u{1F4B3}',
        title: '가입비 0원, 매칭될 때만!',
        desc: '가입비도, 매달 빠져나가는 구독료도 0원이에요. 마음이 통하는 분과 진짜로 만나게 됐을 때만 딱 29,900원 — 외로운 주말을 \'해지\'하는 가장 가벼운 방법이니까요.',
      },
      {
        emoji: '\u23F3',
        title: '딱 1시간, 설레기에 충분한 시간',
        desc: '첫 만남이 너무 길어질까 봐 걱정되시나요? 서로의 느낌을 확인하기 가장 좋은 \'골든타임 1시간\' 약속 시스템으로, 심리적 부담 없이 가벼운 마음으로 나오실 수 있어요.',
      },
      {
        emoji: '\u{1F4C5}',
        title: '번거로운 연락은 저희가 할게요',
        desc: '모르는 사람과 카톡하며 에너지를 쓰지 마세요. 매니저가 두 분의 소중한 약속 일정부터 장소까지 모두 세심하게 조율해 드립니다.',
      },
    ],
  },
  {
    header: '당신의 일상을 철저하게 보호',
    cards: [
      {
        emoji: '\u2615',
        title: '대화가 즐거운 아늑한 카페',
        desc: '부담스러운 식사 메뉴 고민은 이제 끝! 매니저가 두 분을 고려해 선정한 카페에서 차 한 잔과 함께 산뜻한 첫 대화를 시작해 보세요.',
      },
      {
        emoji: '\u{1F512}',
        title: '만나기 전까지 당신은 \'비밀\'',
        desc: '만남 후에도 상대방에게 번호를 공개해도 된다는 동의 없이는 어떠한 개인정보도 상대방에게 노출되지 않도록 철저히 익명을 유지합니다.',
      },
      {
        emoji: '\u{1F6E1}\uFE0F',
        title: '사진 한 장도 안전하게 보호',
        desc: '프로필 사진 유출이 걱정되시나요? 모든 사진에 적용된 워터마크 보안 시스템이 당신의 신뢰와 얼굴을 보이지 않는 곳까지 철저히 지켜드립니다.',
      },
    ],
  },
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
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return { register, visible };
}

export default function ServiceIntro() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, visible } = useReveal();

  let itemIdx = 0;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Hero */}
        <div className={styles.hero}>
          <span className={styles.brand}>Knots & Links</span>
          <div className={styles.divider} />
          <p className={styles.tagline}>
            진심이 닿는 만남을 위해,<br />
            저희가 준비했습니다.
          </p>
        </div>

        {/* Sections */}
        {SECTIONS.map((section, sIdx) => {
          const headerIdx = itemIdx++;
          return (
            <div key={sIdx} className={styles.section}>
              <h2
                ref={register(headerIdx)}
                className={`${styles.sectionHeader} ${visible.has(headerIdx) ? styles.revealed : ''}`}
              >
                {section.header}
              </h2>
              {section.cards.map((card, cIdx) => {
                const cardIdx = itemIdx++;
                return (
                  <div
                    key={cIdx}
                    ref={register(cardIdx)}
                    className={`${styles.card} ${visible.has(cardIdx) ? styles.revealed : ''}`}
                    style={{ transitionDelay: `${cIdx * 0.08}s` }}
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
          );
        })}

        {/* SMS Notice */}
        <div className={styles.smsBanner}>
          <Smartphone size={18} className={styles.smsBannerIcon} />
          <p className={styles.smsBannerText}>
            매칭 알림은 <strong>070-8095-3662</strong> 번호로 발송됩니다.
            스팸 번호가 아니니, 문자를 받으실 수 있도록 수신 차단을 해제해 주세요.
          </p>
        </div>

        {/* CTA */}
        <div className={styles.ctaWrap}>
          <button
            className={styles.ctaBtn}
            onClick={() => navigate(`/apply/oath/${token}`)}
          >
            시작하기
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
