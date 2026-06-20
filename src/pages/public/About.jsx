import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, X, ChevronDown, Smartphone, ArrowRight } from 'lucide-react';
import useReveal from '../../hooks/useReveal';
import styles from './About.module.css';

// ─────────────────────────────────────────────────────────
// 회원 홍보 페이지 — 이모지·아이콘 중심, 가격 표현 최소화
// ─────────────────────────────────────────────────────────

const HERO_PILLS = ['부담 없는 시작', '1시간 만남', '익명 매칭'];

const VALUES = [
  { emoji: '☕', title: '커피 한 잔, 딱 1시간', desc: '부담스러운 저녁 식사 대신, 카페에서 가볍게 서로의 느낌만 확인해요.' },
  { emoji: '🔒', title: '만나기 전까진 익명', desc: '동의 전엔 이름도 연락처도 비공개. 사진은 워터마크로 안전하게 보호돼요.' },
  { emoji: '💌', title: '매니저가 다 챙겨요', desc: '낯선 사람과 직접 연락할 필요 없이, 약속 일정과 장소까지 매니저가 조율해요.' },
];

const FLOW_STEPS = [
  { num: '01', emoji: '✍️', title: '회원 등록',  desc: '매니저 초대 링크로 프로필을 작성해요' },
  { num: '02', emoji: '🧩', title: '매칭 생성',  desc: '매니저가 가치관·취향이 맞는 두 분을 골라요' },
  { num: '03', emoji: '💌', title: '프로포절',   desc: '익명 프로필을 보고 양쪽 모두 좋으면 성사돼요' },
  { num: '04', emoji: '☕', title: '만남 확정',  desc: '카페와 시간을 매니저가 조율해 안내해요' },
  { num: '05', emoji: '🤝', title: '애프터',     desc: '두 분 모두 YES일 때만 연락처를 전달해요' },
];

const COMPARISONS = [
  { topic: '비용 부담',  bad: '가입만 해도 매달 빠져나가는 요금', good: '마음이 통했을 때만' },
  { topic: '연락 방식',  bad: '낯선 상대와 직접 카톡',           good: '매니저가 모든 연락 대행' },
  { topic: '개인정보',   bad: '프로필 즉시 공개',                good: '동의 전까지 익명' },
  { topic: '첫 만남',    bad: '저녁 식사로 부담',                good: '카페에서 가볍게 한 시간' },
  { topic: '사진 노출',  bad: '원본 그대로 공유',                good: '워터마크 보안 적용' },
];

const FAQS = [
  {
    q: '회원 가입은 어떻게 하나요?',
    a: '회원 가입은 매니저가 보내드린 초대 링크를 통해서만 진행돼요. 이 페이지를 보내주신 매니저에게 문의해 주세요.',
  },
  {
    q: '매칭은 어떻게 만들어지나요?',
    a: '알고리즘 자동 추천이 아니라, 매니저가 두 분의 가치관·취향·이상형을 살펴 한 분 한 분 직접 어울리는 상대를 골라드려요.',
  },
  {
    q: '일정 변경이나 환불도 되나요?',
    a: '약속 일정 변경과 환불은 매니저를 통해 편하게 안내받으실 수 있어요. 궁금한 점은 매니저에게 말씀해 주세요.',
  },
];

export default function About() {
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
          <div className={styles.heroEmoji}>💛</div>
          <span className={styles.heroEyebrow}>
            <Sparkles size={11} strokeWidth={2.4} />
            회원 안내
          </span>
          <h1 className={styles.heroBrand}>Knots &amp; Links</h1>
          <p className={styles.heroTagline}>
            진심이 닿는 만남을,<br />
            매니저와 함께 잇습니다.
          </p>
          <div className={styles.heroPills}>
            {HERO_PILLS.map((p) => (
              <span key={p} className={styles.heroPill}>{p}</span>
            ))}
          </div>
        </div>

        {/* ════════ 핵심 가치 ════════ */}
        <section className={`${styles.section} ${styles.sectionTop}`}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.sectionNum}>01</span>
                이런 점이 좋아요
              </h2>
            );
          })()}
          <div className={styles.valueGrid}>
            {VALUES.map((v, i) => {
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.valueCard} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.07}s` }}
                >
                  <div className={styles.valueEmoji}>{v.emoji}</div>
                  <div className={styles.valueText}>
                    <h3 className={styles.valueTitle}>{v.title}</h3>
                    <p className={styles.valueDesc}>{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ 매칭 흐름 ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.sectionNum}>02</span>
                만남은 이렇게 진행돼요
              </h2>
            );
          })()}
          <div className={styles.flow}>
            {FLOW_STEPS.map((step, i) => {
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.flowItem} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.06}s` }}
                >
                  <div className={styles.flowNumWrap}>
                    <div className={styles.flowNum}>{step.num}</div>
                    {i < FLOW_STEPS.length - 1 && <div className={styles.flowConnector} />}
                  </div>
                  <div className={styles.flowBody}>
                    <div className={styles.flowEmoji}>{step.emoji}</div>
                    <div className={styles.flowText}>
                      <h3 className={styles.flowTitle}>{step.title}</h3>
                      <p className={styles.flowDesc}>{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ 무엇이 다른가요 ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.sectionNum}>03</span>
                무엇이 다른가요
              </h2>
            );
          })()}
          <div className={styles.compareWrap}>
            <div className={styles.compareHead}>
              <div className={`${styles.compareCol} ${styles.compareCol_bad}`}>
                <X size={14} strokeWidth={2.6} />
                <span>다른 매칭 서비스</span>
              </div>
              <div className={`${styles.compareCol} ${styles.compareCol_good}`}>
                <Check size={14} strokeWidth={2.6} />
                <span>Knots &amp; Links</span>
              </div>
            </div>
            {COMPARISONS.map((row, i) => {
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.compareRow} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.04}s` }}
                >
                  <div className={styles.compareTopic}>{row.topic}</div>
                  <div className={styles.compareCells}>
                    <div className={styles.compareBad}>{row.bad}</div>
                    <div className={styles.compareGood}>{row.good}</div>
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
                <span className={styles.sectionNum}>04</span>
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
            <p className={styles.numberBannerLabel}>매칭 알림 공식 발신번호</p>
            <p className={styles.numberBannerNumber}>070-8095-3662</p>
            <p className={styles.numberBannerNote}>스팸 번호가 아니에요. 'Knots &amp; Links'로 저장해 주세요.</p>
          </div>
        </div>

        {/* ════════ Outro ════════ */}
        <div className={styles.ctaWrap}>
          <p className={styles.ctaNote}>
            회원 가입은 매니저의 <strong>초대 링크</strong>를 통해 진행돼요.<br />
            이 페이지를 보내주신 매니저에게 편하게 문의해 주세요.
          </p>
          <button
            type="button"
            className={styles.crossLink}
            onClick={() => navigate('/about/manager')}
          >
            매니저로 활동하고 싶다면
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
