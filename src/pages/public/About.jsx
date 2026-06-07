import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Smartphone,
  Sparkles,
  Check,
  X,
  ChevronDown,
  Coffee,
  HeartHandshake,
  Heart,
  Users,
  UserCheck,
  Network,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import styles from './About.module.css';

// ─────────────────────────────────────────────────────────
// Content data
// ─────────────────────────────────────────────────────────

const HERO_PILLS = ['가입비 0원', '1시간 만남', '익명 매칭'];

const AUDIENCES = [
  { icon: Heart,     color: 'tangerine', title: '회원',  desc: '부담 없이 좋은 인연을 만나고 싶은 분' },
  { icon: UserCheck, color: 'lilac',     title: '매니저', desc: '진심으로 인연을 잇는 일을 하고 싶은 분' },
  { icon: Users,     color: 'mint',      title: '지인',   desc: '소중한 친구를 안전하게 추천하고 싶은 분' },
];

const COMPARISONS = [
  { topic: '비용 구조',  bad: '월정액 / 가입비',         good: '매칭 성사 시에만 비용 지불' },
  { topic: '연락 방식',  bad: '낯선 상대와 직접 카톡',   good: '매니저가 모든 연락 대행' },
  { topic: '개인정보',   bad: '프로필 즉시 공개',         good: '동의 전까지 100% 익명' },
  { topic: '첫 만남',    bad: '저녁 식사로 부담',         good: '카페에서 딱 1시간' },
  { topic: '사진 노출',  bad: '원본 그대로 공유',         good: '워터마크 보안 적용' },
];

const FLOW_STEPS = [
  { num: '01', emoji: '✍️', title: '회원 등록',       desc: '매니저 초대 링크로 프로필 작성' },
  { num: '02', emoji: '🧩', title: '매칭 생성',       desc: '매니저가 가치관·취향이 맞는 두 분을 선정' },
  { num: '03', emoji: '💌', title: '프로포절',         desc: '익명 프로필 확인 후 양쪽 모두 수락 시 성사' },
  { num: '04', emoji: '☕', title: '만남 확정',       desc: '카페·시간을 매니저가 조율해 안내' },
  { num: '05', emoji: '🤝', title: '애프터',           desc: '두 분 모두 YES일 때만 연락처 전달' },
];

const SETTLEMENTS = [
  { role: '매칭 매니저',   note: '매칭을 만든 사람' },
  { role: '회원 A 매니저', note: '회원 A를 등록한 사람' },
  { role: '회원 B 매니저', note: '회원 B를 등록한 사람' },
];

const MANAGER_VALUES = [
  { icon: Network,     title: '네트워크 초대권 3장',  desc: '믿는 매니저와 회원 풀을 공유' },
  { icon: BookOpen,    title: '가이드 + 문자 양식',   desc: '9단계 매칭 가이드와 17종 검증된 양식' },
  { icon: ShieldCheck, title: '회원 정보 보호 서약',  desc: '개인정보보호법에 따른 법적 책임 서약' },
];

const FAQS = [
  {
    q: '회원 가입은 어떻게 하나요?',
    a: '회원 가입은 매니저가 발송한 초대 링크를 통해서만 진행됩니다. 운영팀에 연락 주시면 가까운 매니저를 안내해 드려요.',
  },
  {
    q: '매칭은 어떻게 만들어지나요?',
    a: '매니저가 회원의 가치관·취향·이상형을 종합해 어울리는 두 분을 직접 매칭합니다. 알고리즘 자동 추천이 아닌, 매니저가 한 건 한 건 정성껏 고른 매칭이에요.',
  },
  {
    q: '환불은 가능한가요?',
    a: '만남 7일 전까지 전액, 3일 전까지 50% 환불 가능합니다. 24시간 전 이내에는 환불 불가하며, 약속 24시간 전까지 일정 1회 변경이 가능해요.',
  },
  {
    q: '매니저가 되려면 어떻게 해야 하나요?',
    a: '매니저 가입은 운영팀(070-8095-3662)으로 문의 주세요. 회원 정보 보호 서약서 작성 후 매니저 가입 절차가 진행됩니다.',
  },
];

// ─────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

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
          <span className={styles.heroEyebrow}>
            <Sparkles size={11} strokeWidth={2.4} />
            프라이빗 매칭 서비스
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

        {/* ════════ Hero 하이라이트 배너 ════════ */}
        {(() => {
          const myIdx = next();
          return (
            <div
              ref={register(myIdx)}
              className={`${styles.highlightBand} ${styles.highlightBandHero} ${visible.has(myIdx) ? styles.revealed : ''}`}
            >
              <div className={styles.highlightIcon}>
                <Coffee size={20} strokeWidth={2.2} />
              </div>
              <div className={styles.highlightText}>
                <span className={styles.highlightTitle}>커피 한 잔의 시간, 딱 1시간</span>
                <span className={styles.highlightDesc}>부담 없이 서로의 느낌을 확인하는 가벼운 첫 만남이에요.</span>
              </div>
            </div>
          );
        })()}

        {/* ════════ Audience ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.sectionNum}>01</span>
                누구를 위한 서비스인가요
              </h2>
            );
          })()}
          <div className={styles.audienceGrid}>
            {AUDIENCES.map((aud, i) => {
              const Icon = aud.icon;
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.audienceCard} ${styles[`audienceCard_${aud.color}`]} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.07}s` }}
                >
                  <div className={`${styles.audienceIcon} ${styles[`audienceIcon_${aud.color}`]}`}>
                    <Icon size={20} strokeWidth={2.2} />
                  </div>
                  <h3 className={styles.audienceTitle}>{aud.title}</h3>
                  <p className={styles.audienceDesc}>{aud.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════ Comparison ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.sectionNum}>02</span>
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

        {/* ════════ Editorial 하이라이트 배너 ════════ */}
        {(() => {
          const myIdx = next();
          return (
            <div
              ref={register(myIdx)}
              className={`${styles.highlightBand} ${styles.highlightBandLilac} ${styles.highlightBandEditorial} ${visible.has(myIdx) ? styles.revealed : ''}`}
            >
              <div className={`${styles.highlightIcon} ${styles.highlightIconLilac}`}>
                <HeartHandshake size={20} strokeWidth={2.2} />
              </div>
              <div className={styles.highlightText}>
                <span className={styles.highlightTitle}>매니저가 잇는 인연</span>
                <span className={styles.highlightDesc}>두 분의 첫 만남을 일정부터 장소까지 섬세하게 조율합니다.</span>
              </div>
            </div>
          );
        })()}

        {/* ════════ Flow ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <h2
                ref={register(myIdx)}
                className={`${styles.sectionHeader} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.sectionNum}>03</span>
                매칭 5단계
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

        {/* ════════ Manager Banner ════════ */}
        <section className={styles.section}>
          {(() => {
            const myIdx = next();
            return (
              <div
                ref={register(myIdx)}
                className={`${styles.managerBanner} ${visible.has(myIdx) ? styles.revealed : ''}`}
              >
                <span className={styles.managerBannerTag}>For Managers</span>
                <h2 className={styles.managerBannerTitle}>
                  매니저로 함께해 주세요
                </h2>
                <p className={styles.managerBannerDesc}>
                  한 건 한 건 정성껏 잇는<br />
                  프라이빗 매칭 매니저를 모십니다.
                </p>
                {/* 매니저 네트워크 한 줄 */}
                {(() => {
                  const innerIdx = next();
                  return (
                    <div
                      ref={register(innerIdx)}
                      className={`${styles.managerNetBand} ${visible.has(innerIdx) ? styles.revealed : ''}`}
                    >
                      <Network size={15} strokeWidth={2.2} className={styles.managerNetBandIcon} />
                      <span className={styles.managerNetBandText}>믿는 매니저끼리 잇는 따뜻한 인연의 네트워크</span>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Settlement visualization */}
          <div className={styles.settlementCard}>
            <div className={styles.settlementHead}>
              <h3 className={styles.settlementTitle}>매칭 1건 정산 분배</h3>
              <span className={styles.settlementSub}>역할별 분배</span>
            </div>
            <p className={styles.settlementLead}>
              매칭 한 건이 성사되면, 참여한 역할에 따라 정해진 비율로 정산이 분배됩니다.
            </p>
            <div className={styles.settlementRoles}>
              {SETTLEMENTS.map((s, i) => {
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
              한 매니저가 매칭 매니저·회원 매니저를 동시에 수행하면 보상이 합산돼요.
            </p>
          </div>

          {/* Other manager values */}
          <div className={styles.managerValueGrid}>
            {MANAGER_VALUES.map((m, i) => {
              const Icon = m.icon;
              const myIdx = next();
              return (
                <div
                  key={i}
                  ref={register(myIdx)}
                  className={`${styles.managerValueCard} ${visible.has(myIdx) ? styles.revealed : ''}`}
                  style={{ transitionDelay: `${i * 0.05}s` }}
                >
                  <div className={styles.managerValueIcon}>
                    <Icon size={16} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h4 className={styles.managerValueTitle}>{m.title}</h4>
                    <p className={styles.managerValueDesc}>{m.desc}</p>
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

        {/* ════════ Official number banner ════════ */}
        <div className={styles.numberBanner}>
          <Smartphone size={18} className={styles.numberBannerIcon} />
          <div>
            <p className={styles.numberBannerLabel}>매칭 알림 공식 발신번호</p>
            <p className={styles.numberBannerNumber}>070-8095-3662</p>
            <p className={styles.numberBannerNote}>스팸 번호가 아니에요. 'Knots &amp; Links'로 저장해 주세요.</p>
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
          <p className={styles.ctaNote}>
            회원 가입은 매니저의 <strong>초대 링크</strong>를 통해서만 진행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
