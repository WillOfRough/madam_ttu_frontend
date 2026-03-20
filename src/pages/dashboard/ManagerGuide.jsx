import { useState, useEffect } from 'react';
import { BookOpen, Copy, Check, Pencil, RotateCcw, Save, X, Lightbulb, FileText } from 'lucide-react';
import styles from './ManagerGuide.module.css';

const WORKFLOW_STEPS = [
  {
    title: '매칭 생성',
    desc: '승인된 회원 중 어울리는 두 사람을 골라 매칭을 생성합니다.',
    tip: '매칭탭 → "새 매칭" 버튼',
  },
  {
    title: '프로필 전달',
    desc: 'A 회원에게 먼저 프로필 링크를 전달하고, 수락하면 B 회원에게 전달합니다.',
    tip: '"0고백 1차임" 방지 — 상대가 수락한 뒤에 프로필을 보게 됩니다. 양식 2번으로 입금 요청 후 운영자를 통해 확인합니다.',
  },
  {
    title: '일정 조율 및 만남 장소',
    desc: '일정조율 링크를 각 회원에게 전달합니다. 양쪽 일정이 등록되면 매니저가 시간을 확정하고, 거주지·회사 위치를 고려해 장소를 정해 안내합니다.',
    tip: '양식 3번 "만남 장소 확정"을 활용해 주세요.',
  },
  {
    title: '미팅 완료 처리',
    desc: '만남이 끝나면 "미팅 완료" 버튼을 눌러 완료 처리합니다.',
    tip: '미팅 완료 시간 전에 완료 버튼을 누르면 경고가 표시됩니다.',
  },
  {
    title: '에프터 링크 전달',
    desc: '미팅 완료 처리 후 에프터 링크가 생성됩니다. 각 회원에게 전달하여 "다시 만나고 싶은지" 응답을 받습니다.',
  },
  {
    title: '만남 성사 결과 링크 전달',
    desc: '양쪽 회원이 모두 에프터 응답을 완료하면 "만남 성사 결과 링크"가 자동으로 생성됩니다. 이 링크를 각 회원에게 전달해 주세요. 양쪽 OK이면 상대 연락처가 공개되고, 한쪽이라도 거절이면 미성사 안내가 표시됩니다.',
    tip: '에프터 현황 아래에 링크가 나타납니다. 양쪽 응답 완료 전에는 표시되지 않습니다.',
  },
  {
    title: '정산',
    desc: '매칭 내역은 월 1회 정산됩니다. 문의: 010-5025-5505',
  },
];

export const DEFAULT_TEMPLATES = {
  proposalIntro: `[Knots & Links]
새로운 인연의 연결이 도착했습니다.

OO(별명)님의 가치관과 취향을 고려해 정성스럽게 매칭한 상대방의 프로필이 도착했습니다.

소중한 인연의 시작이 될 수 있도록 아래 링크를 통해 상대방의 프로필을 확인한 후 만나보고 싶은 마음이 드신다면 만나볼래요!를 눌러주세요.

[프로포절 링크 첨부]`,

  promotion: `[속보] 내 주변 솔로들 다 모여라! ! 💌
여러분, 제 정말 믿음직한 지인이 야심 차게 준비한 프라이빗 매칭 서비스를 드디어 런칭했습니다! 가벼운 만남 앱에 지치셨거나, 지인에게 소개팅 부탁하기는 왠지 미안했던 분들을 위해 제가 발 벗고 홍보하러 왔어요. 😊

✨ 무엇이 다른가요?
• 1:1 프라이빗 & 철저한 내 정보 보호
모든 매칭 과정은 전문 매니저가 익명으로 대행합니다. 내 개인정보가 불특정 다수에게 노출될 걱정 없이 안전하게 진행돼요.

• 딱 1시간의 설렘, '가벼운 첫 만남'
서로 수락할 때만 만남이 성사되며, 첫 만남은 부담 없이 1시간만 진행하는 규칙이 있어요. 매너 있는 만남을 지향합니다.

• 안전한 번호 공개
만나본 뒤, 두 분 모두 "한 번 더 보고 싶다"고 동의할 때만 연락처가 공개됩니다.

💰 투명하고 합리적인 비용 안내
가입비나 매칭 신청비는 0원입니다!
• 매칭 성사 시에만 결제: 서로의 프로필을 확인하고 "만나보겠다"는 의사가 일치했을 때만 최소한의 운영비(19,900원)가 발생합니다. 매니저의 꼼꼼한 세팅은 물론, 노쇼 방지와 진정성 있는 분들만을 모시기 위한 장치이니 안심하세요!

인연은 예기치 않게 찾아오는 법이죠. 소중한 친구를 소개하는 마음으로 정성껏 준비한 서비스이니, 올봄 새로운 설렘을 찾고 있다면 지금 바로 아래 링크로 문을 두드려보세요! 💛

[매니저가 만든 회원 초대 링크 첨부]`,

  meeting: `드디어 만남이 확정되었습니다! ✨

안녕하세요, OO님. Knots & Links를 통해 소중한 인연의 발걸음을 떼신 것을 진심으로 환영합니다.
두 분의 첫 만남이 더욱 기분 좋고 설레는 기억으로 남을 수 있도록, 확정된 정보와 이용 수칙을 안내해 드릴게요. 😊

📅 [Meeting Info]
일정: ○월 ○일 / X시 ~ X시
장소: ○○카페 (주소: ○○○○)
체크포인트: 카페 정문 왼쪽에서 대기해 주세요! 서로를 훨씬 쉽고 반갑게 찾으실 수 있습니다.

💬 [Open Chat Rules]
만남 직전 생성되는 오픈카톡방은 오직 '현장 매칭 보조'를 위한 비상 연락망입니다.
첫 만남의 신비로운 설렘을 위해, 현장 도착 전까지 대화는 조금만 참아주세요! 🙏
제한적 사용 (긴급 상황 시에만!):
1) 인상착의 공유: "정문 왼쪽, 베이지색 코트 입고 있습니다." (도착 시)
2) 지각/길 찾기: "주차 문제로 5분 정도 늦어질 것 같습니다."
금지 대화: 사전 통성명, 개인 정보 질문, 일상 대화 등
※ 카톡 대화가 많아지면 현장에서의 반가움이 줄어들 수 있어요. 깊은 이야기는 현장에서 서로의 눈을 맞추며 직접 나눠보시길 권장합니다. ✨

🤝 [Manner & Etiquette]
약속은 소중하게: 시간 준수는 상대방에 대한 가장 예의 있는 첫인상입니다. 늦지 않게 도착하는 센스를 보여주세요!
따뜻한 대화: 상호 존중을 바탕으로 정중하고 부드럽게 대화해 주세요. 무례한 언행은 엄격히 금지됩니다.

💵 [Payment & Policy]
커피 비용: 첫 만남의 차 한 잔은 남성분 결제 원칙입니다. (단, 지각자가 발생할 경우 지각하신 분이 기분 좋게 전액 결제합니다! ☕)
운영 정책: 만남 D-7 이후에는 환불이 불가하며, 일정 변경은 만남 48시간 전까지만 가능합니다.

📩 [Contact Exchange]
만남이 종료되면 피드백 링크를 보내드려요. 두 분 모두 "한 번 더 보고 싶어요"라고 응답하셨을 때만, 소중한 연락처가 안전하게 전달됩니다.

OO님의 빛나는 만남을 위해 모든 준비를 마쳤습니다.
진심이 닿는 매너 있는 만남으로 좋은 결실 보시길 Knots & Links가 온 마음 다해 응원합니다. 곧 뵙겠습니다! 💌`,

  afterSuccess: `두근두근, 기분 좋은 소식을 전해드려요! 😊

안녕하세요, OO님! 매칭 상대방분께서도 OO님과의 만남을 간절히 기다리고 계시네요. 두 분의 마음이 예쁘게 맞닿아 드디어 '매칭 확정' 단계에 진입했습니다! ✨

마지막 설레는 한 걸음, 안내해 드릴게요.

두 분의 소중한 약속을 확정하기 위해, 아래 계좌로 매칭 지원금(19,900원) 입금을 부탁드립니다. 이 정성은 서로의 소중한 시간을 존중한다는 약속이기도 합니다.

🔸 입금 계좌: 카카오뱅크 79423051984 (고**)
🔸 입금 금액: 19,900원

이후 진행은 저희가 도와드려요!

입금이 확인되면, 두 분이 가장 편안하게 대화 나누실 수 있는 장소와 세부 일정을 조율해 드릴게요. 1시간의 만남 동안 충분히 서로를 알아보세요. 만남 후 두 분 모두 "한 번 더 보고 싶어요"라고 응답하시면, 그때 소중한 연락처가 공개됩니다.

⚠️ 꼭 확인해 주세요!
이 설렘이 식기 전, 24시간 이내에 입금이 완료되어야 매칭이 최종 성사됩니다. 조금만 서둘러 주시면 감사하겠습니다.

[환불 정책]
만남 7일 전까지 : 전액 환불 가능
만남 3일 전까지 : 80% 환불 가능
만남 24시간 전까지 : 환불 불가
약속 24시간 전까지 : 일정 1회 변경 가능

두 분의 첫 만남이 마법 같은 시간이 될 수 있도록 최선을 다하겠습니다. 입금 확인 후 바로 다음 안내 드릴게요! 💌`,
};

const TEMPLATE_META = [
  { key: 'proposalIntro', label: '프로포절 안내', badge: '양식 1' },
  { key: 'promotion', label: '홍보 문구', badge: '양식 2' },
  { key: 'afterSuccess', label: '만남 성사 안내', badge: '양식 3' },
  { key: 'meeting', label: '만남 장소 확정', badge: '양식 4' },
];

const LS_KEY = 'knl_manager_templates';

export function loadTemplates() {
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_TEMPLATES, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_TEMPLATES };
}

function saveTemplates(templates) {
  localStorage.setItem(LS_KEY, JSON.stringify(templates));
}

export default function ManagerGuide() {
  const [templates, setTemplates] = useState(loadTemplates);
  const [editing, setEditing] = useState(null); // 'promotion' | 'meeting' | 'afterSuccess' | null
  const [editDraft, setEditDraft] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Clear copied state after 2s
  useEffect(() => {
    if (!copiedKey) return;
    const t = setTimeout(() => setCopiedKey(null), 2000);
    return () => clearTimeout(t);
  }, [copiedKey]);

  const handleEdit = (key) => {
    setEditing(key);
    setEditDraft(templates[key]);
  };

  const handleSave = () => {
    if (!editing) return;
    const next = { ...templates, [editing]: editDraft };
    setTemplates(next);
    saveTemplates(next);
    setEditing(null);
    setEditDraft('');
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditDraft('');
  };

  const handleReset = (key) => {
    if (!window.confirm('이 양식을 초기 상태로 되돌리시겠습니까?')) return;
    const next = { ...templates, [key]: DEFAULT_TEMPLATES[key] };
    setTemplates(next);
    saveTemplates(next);
    if (editing === key) {
      setEditDraft(DEFAULT_TEMPLATES[key]);
    }
  };

  const handleCopy = async (key) => {
    try {
      await navigator.clipboard.writeText(templates[key]);
      setCopiedKey(key);
    } catch {
      // Clipboard API unavailable (non-HTTPS/old browser); silent fail
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>매니저 가이드</h1>

      {/* ── Workflow Steps ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`${styles.sectionIcon} ${styles.sectionIconNavy}`}>
            <BookOpen size={15} />
          </span>
          매칭 업무 흐름
        </h2>
        <div className={styles.stepsTimeline}>
          {WORKFLOW_STEPS.map((step, idx) => (
            <div key={step.title} className={styles.stepItem}>
              <div className={styles.stepNum}>{idx + 1}</div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{step.title}</div>
                <p className={styles.stepDesc}>{step.desc}</p>
                {step.tip && (
                  <div className={styles.stepTip}>
                    <Lightbulb size={14} className={styles.stepTipIcon} />
                    <span>{step.tip}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Templates ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={`${styles.sectionIcon} ${styles.sectionIconCoral}`}>
            <FileText size={15} />
          </span>
          글 양식
        </h2>

        {TEMPLATE_META.map(({ key, label, badge }) => {
          const isEditing = editing === key;
          const isCopied = copiedKey === key;

          return (
            <div key={key} className={styles.templateCard}>
              <div className={styles.templateHeader}>
                <span className={styles.templateTitle}>
                  {label}
                  <span className={styles.templateBadge}>{badge}</span>
                </span>
                <div className={styles.templateActions}>
                  {isEditing ? (
                    <>
                      <button
                        className={`${styles.templateBtn} ${styles.saveBtn}`}
                        onClick={handleSave}
                      >
                        <Save size={13} />
                        저장
                      </button>
                      <button
                        className={`${styles.templateBtn} ${styles.cancelEditBtn}`}
                        onClick={handleCancelEdit}
                      >
                        <X size={13} />
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`${styles.templateBtn} ${isCopied ? styles.copiedBtn : styles.copyBtn}`}
                        onClick={() => handleCopy(key)}
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        {isCopied ? '복사됨' : '복사'}
                      </button>
                      <button
                        className={`${styles.templateBtn} ${styles.editBtn}`}
                        onClick={() => handleEdit(key)}
                      >
                        <Pencil size={13} />
                        수정
                      </button>
                      <button
                        className={`${styles.templateBtn} ${styles.resetBtn}`}
                        onClick={() => handleReset(key)}
                      >
                        <RotateCcw size={13} />
                        초기화
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.templateBody}>
                {isEditing ? (
                  <textarea
                    className={styles.templateTextarea}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <div className={styles.templatePreview}>{templates[key]}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
