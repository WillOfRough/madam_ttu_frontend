import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronDown, Smartphone, ArrowRight } from 'lucide-react';
import useReveal from '../../hooks/useReveal';
import styles from './About.module.css';

// ─────────────────────────────────────────────────────────
// 매니저 홍보 페이지 — 이모지·아이콘 중심, 가격 표현 최소화
// ─────────────────────────────────────────────────────────

const HERO_PILLS = ['따뜻한 네트워크', '검증된 가이드', '함께 성장'];

const TASKS = [
  { emoji: '🧩', title: '어울리는 두 분을 매칭', desc: '회원의 가치관·취향·이상형을 살펴 직접 어울리는 짝을 골라요.' },
  { emoji: '💬', title: '모든 연락을 대신', desc: '회원이 낯선 사람과 직접 연락할 필요 없게, 매니저가 다리를 놓아요.' },
  { emoji: '📅', title: '일정·장소 조율', desc: '약속 시간과 만남 장소까지 세심하게 정해 안내해요.' },
  { emoji: '🛡️', title: '회원 정보 보호', desc: '동의 전까진 익명을 지키고, 사진은 워터마크로 안전하게 보호해요.' },
];

const REWARD_ROLES = [
  { role: '매칭 매니저',   note: '두 분을 이어 매칭을 만든 사람' },
  { role: '회원 A 매니저', note: '회원 A를 등록·관리하는 사람' },
  { role: '회원 B 매니저', note: '회원 B를 등록·관리하는 사람' },
];

const MANAGER_VALUES = [
  { emoji: '🔗', title: '매니저 네트워크', desc: '믿는 매니저들과 회원 풀을 함께 나눠요.' },
  { emoji: '📘', title: '검증된 가이드와 양식', desc: '매칭 단계별 가이드와 바로 쓰는 문자 양식을 드려요.' },
  { emoji: '🤝', title: '회원 정보 보호 서약', desc: '개인정보보호법에 따라 회원 정보를 안전하게 지켜요.' },
];

const FAQS = [
  {
    q: '매니저가 되려면 어떻게 하나요?',
    a: '운영팀(070-8095-3662)으로 문의 주세요. 회원 정보 보호 서약서를 작성하면 매니저 가입 절차가 진행돼요.',
  },
  {
    q: '무엇을 준비해야 하나요?',
    a: '특별한 자격은 필요 없어요. 사람과 인연을 소중히 여기는 마음, 그리고 회원 정보를 지키겠다는 약속이면 충분해요.',
  },
  {
    q: '회원은 어떻게 모으나요?',
    a: '나만의 초대 링크로 회원을 모실 수 있어요. 믿는 매니저들과 네트워크를 통해 함께 회원 풀을 넓혀가요.',
  },
];

export default function AboutManager() {
  const navigate = useNavigate();
  const { register, visible } = useReveal();
  const [openFaq, setOpenFaq] = useState(0);
  let idx = 0;
  const next = () => idx++;

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ════════ Hero ════════ */}
        <div className={styles.hero}>
          <div className={`${styles.heroEmoji} ${styles.heroEmojiLilac}`}>🤝</div>
          <span className={`${styles.heroEyebrow} ${styles.heroEyebrowLilac}`}>
            <Sparkles size={11} strokeWidth={2.4} />
            For Managers
          </span>
          <h1 className={styles.heroBrand}>매니저로 함께해요</h1>
          <p className={styles.heroTagline}>
            한 건 한 건 정성껏 잇는,<br />
            프라이빗 매칭 매니저를 모십니다.
          </p>
          <div className={styles.heroPills}>
            {HERO_PILLS.map((p) => (
              <span key={p} className={`${styles.heroPill} ${styles.heroPillLilac}`}>{p}</span>
            ))}
          </div>
        </div>

        {/* ════════ 매니저가 하는 일 ════════ */}
        <section className={`${styles.section} ${styles.sectionTop}`}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={`${styles.sectionNum} ${styles.sectionNumLilac}`}>01</span>
                매니저가 하는 일
              </h2>
            );
          })()}
          <div className={styles.valueGrid}>
            {TASKS.map((t, i) => {
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.valueCard} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  <div className={`${styles.valueEmoji} ${styles.valueEmojiLilac}`}>{t.emoji}</div>
                  <div className={styles.valueText}>
                    <h3 className={styles.valueTitle}>{t.title}</h3>
                    <p className={styles.valueDesc}>{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ 함께 성장하는 보상 ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={`${styles.sectionNum} ${styles.sectionNumLilac}`}>02</span>
                함께 성장하는 보상
              </h2>
            );
          })()}
          <div className={styles.settlementCard}>
            <p className={styles.settlementLead}>
              매칭 한 건이 성사되면, 그 만남에 참여한 역할만큼 보상이 따라와요.
            </p>
            <div className={styles.settlementRoles}>
              {REWARD_ROLES.map((s, i) => {
                const myIdx = next();
                return (
                  <div
                    key={i}
                    ref={register(myIdx)}
                    className={`${styles.settlementRoleRow} ${visible.has(myIdx) ? styles.revealed : ''}`}
                    style={{ transitionDelay: `${i * 0.08}s` }}
                  >
                    <span className={styles.settlementRoleDot} />
                    <div className={styles.settlementRoleText}>
                      <span className={styles.settlementRole}>{s.role}</span>
                      <span className={styles.settlementNote}>{s.note}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={styles.settlementFoot}>
              한 분이 여러 역할을 함께 맡으면, 그만큼 더 크게 성장할 수 있어요.
            </p>
          </div>
        </section>

        {/* ════════ 매니저 혜택 ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={`${styles.sectionNum} ${styles.sectionNumLilac}`}>03</span>
                매니저 혜택
              </h2>
            );
          })()}
          <div className={styles.valueGrid}>
            {MANAGER_VALUES.map((m, i) => {
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.valueCard} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  <div className={`${styles.valueEmoji} ${styles.valueEmojiLilac}`}>{m.emoji}</div>
                  <div className={styles.valueText}>
                    <h3 className={styles.valueTitle}>{m.title}</h3>
                    <p className={styles.valueDesc}>{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ FAQ ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={`${styles.sectionNum} ${styles.sectionNumLilac}`}>04</span>
                자주 묻는 질문
              </h2>
            );
          })()}
          <div className={styles.faqList}>
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <button
                  key={i}
                  type="button"
                  className={`${styles.faqItem} ${open ? styles.faqItemOpen : ''}`}
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  aria-expanded={open}
                >
                  <div className={styles.faqQ}>
                    <span className={styles.faqQMark}>Q.</span>
                    <span className={styles.faqQText}>{f.q}</span>
                    <ChevronDown
                      size={16}
                      className={`${styles.faqChevron} ${open ? styles.faqChevronOpen : ''}`}
                    />
                  </div>
                  <div className={`${styles.faqA} ${open ? styles.faqAOpen : ''}`}>
                    <p>{f.a}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ════════ 공식 발신번호 ════════ */}
        <div className={styles.numberBanner}>
          <Smartphone size={18} className={styles.numberBannerIcon} />
          <div>
            <p className={styles.numberBannerLabel}>매니저 가입 문의</p>
            <p className={styles.numberBannerNumber}>070-8095-3662</p>
            <p className={styles.numberBannerNote}>운영팀으로 연락 주시면 매니저 가입을 안내해 드려요.</p>
          </div>
        </div>

        {/* ════════ CTA ════════ */}
        <div className={styles.ctaWrap}>
          <button
            type="button"
            className={styles.ctaPrimary}
            onClick={() => navigate('/login')}
          >
            매니저로 로그인
            <ArrowRight size={15} />
          </button>
          <button
            type="button"
            className={styles.crossLink}
            onClick={() => navigate('/about')}
          >
            회원 서비스가 궁금하다면
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
