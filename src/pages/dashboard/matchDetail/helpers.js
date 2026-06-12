/* MatchDetail 순수 헬퍼/상수 — 메시지 생성기, 단계/히어로 설정, 포매터, 리마인드·자동발송 계산.
   MatchDetail.jsx 에서 분리(렌더/상태 없음, 순수 함수). */
import { loadTemplates } from '../ManagerGuide';

/* ─── message helpers ─────────────────────────────── */
export function generateProposalMessage(clientName, proposalUrl, inquiryUrl) {
  const templates = loadTemplates();
  return templates.proposalIntro
    .replace(/OO\(별명\)/, clientName)
    .replace('[프로포절 링크 첨부]', proposalUrl)
    .replace('[문의 링크 첨부]', inquiryUrl);
}

export function generateReminderMessage(clientName, partnerName, proposalUrl) {
  const templates = loadTemplates();
  return templates.proposalReminder
    .replace(/OO님/g, `${clientName}님`)
    .replace(/\[매칭 상대\]/g, partnerName)
    .replace('[프로포절 링크 첨부]', proposalUrl);
}

export function generateAfterSuccessMessage(clientName) {
  const templates = loadTemplates();
  return templates.afterSuccess.replace(/OO님/g, `${clientName}님`);
}

export function generateAfterCompleteMessage(afterUrl) {
  const templates = loadTemplates();
  return templates.afterComplete.replace('[애프터 확인 링크]', afterUrl);
}

export function generateSchedulingMessage(clientName, scheduleUrl) {
  const templates = loadTemplates();
  return templates.schedulingGuide
    .replace('[일정 등록 링크 첨부]', scheduleUrl);
}

export function generateAfterResultMessage(clientName, resultUrl, afterStatus) {
  const templates = loadTemplates();
  const template = afterStatus === 'rejected' ? templates.afterResultRejected : templates.afterResult;
  return template
    .replace(/OO님/g, `${clientName}님`)
    .replace(/\[결과 확인 링크\]/g, resultUrl);
}

export function generateMeetingMessage(clientName, schedule) {
  const templates = loadTemplates();
  let msg = templates.meeting.replace(/OO님/g, `${clientName}님`);
  if (schedule) {
    if (schedule.date && schedule.startTime) {
      const d = new Date(schedule.date + 'T00:00:00');
      const startHHMM = schedule.startTime.slice(0, 5);
      const [h, m] = startHHMM.split(':').map(Number);
      const endH = h + 1;
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const dateStr = `${d.getMonth() + 1}월 ${d.getDate()}일 / ${startHHMM} ~ ${endTime}`;
      msg = msg.replace('○월 ○일 / X시 ~ X시', dateStr);
    }
    if (schedule.location) {
      msg = msg.replace('○○카페 (주소: ○○○○)', schedule.location);
    }
  }
  return msg;
}

/* ─── constants ──────────────────────────────────── */
export const RESPONSE_MAP = {
  accepted: { label: '수락', className: 'responseAccepted' },
  rejected: { label: '거절', className: 'responseRejected' },
};

export const STEPS = [
  { key: 'draft',             label: '대기' },
  { key: 'proposal_sent',     label: 'A확인' },
  { key: 'proposal_accepted', label: 'B확인' },
  { key: 'awaiting_payment',  label: '입금' },
  { key: 'scheduling',        label: '조율' },
  { key: 'arranging',         label: '확정' },
  { key: 'scheduled',         label: '약속' },
  { key: 'completed',         label: '완료' },
];

export function getStepIndex(status) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? -1 : idx;
}

/* hero card stage config */
export function getStageHero(match) {
  const status = match?.status;
  const A = match?.clientA || {};
  const B = match?.clientB || {};
  const proposer = A.role === 'proposer' ? A : B.role === 'proposer' ? B : null;
  const receiver = A.role === 'receiver' ? A : B.role === 'receiver' ? B : null;
  const proposerName = proposer?.clientName || 'A';
  const receiverName = receiver?.clientName || 'B';
  const completedHero =
    match?.afterStatus === 'accepted'
      ? { color: 'mint',  icon: 'heart', title: '에프터가 성사되었어요',   sub: '아래 결과 링크로 두 분께 안내해 주세요.' }
      : match?.afterStatus === 'rejected'
      ? { color: 'rose',  icon: 'heart', title: '에프터가 미성사되었어요', sub: '정책에 따라 결과는 회원에게 공유하지 않습니다.' }
      : { color: 'lilac', icon: 'heart', title: '미팅이 완료되었어요',     sub: '에프터 응답을 기다리고 있어요.' };
  const map = {
    draft:            { color: 'lilac',     icon: 'send',     title: '매칭을 시작할 준비가 되었어요', sub: `시작하면 ${proposerName}님께 프로필 링크 문자가 자동 발송돼요.` },
    proposal_sent:    { color: 'lilac',     icon: 'clock',    title: `${proposerName}님의 응답을 기다리고 있어요`,  sub: '프로필 링크 전달 후 응답 대기 중입니다.' },
    proposal_accepted:{ color: 'lilac',     icon: 'check',    title: `${receiverName}님의 응답을 기다리고 있어요`,  sub: `${proposerName}님이 수락했습니다.` },
    awaiting_payment: { color: 'amber',     icon: 'money',    title: '두 분 모두 입금이 확인 되면 다음 단계로 넘어갑니다', sub: '운영자가 입금 확인을 할 때까지 잠시 기다려주세요.' },
    scheduling:       { color: 'tangerine', icon: 'calendar', title: '양쪽 가용시간을 기다리고 있어요', sub: '둘 다 제출하면 공통 시간으로 자동 확정돼요.' },
    arranging:        { color: 'tangerine', icon: 'calendar', title: '공통 시간이 확정되었어요',        sub: '아래에서 약속 일시를 확인하고 확정하세요.' },
    scheduled:        { color: 'mint',      icon: 'mapPin',   title: '약속이 확정되었어요',             sub: '미팅 당일 두 분이 잘 만날 수 있도록 챙겨주세요.' },
    completed:        completedHero,
    cancelled:        { color: 'rose',      icon: 'x',        title: '매칭이 취소되었어요',             sub: '' },
  };
  return map[status] || map.draft;
}

export function getHeroGradient(color) {
  const g = {
    amber:     'linear-gradient(135deg, #FBE7C7 0%, #FFF2DB 100%)',
    mint:      'linear-gradient(135deg, #D4F1E2 0%, #E8F8EE 100%)',
    tangerine: 'linear-gradient(135deg, #FFE5DA 0%, #FFF2EB 100%)',
    lilac:     'linear-gradient(135deg, #E3DBF8 0%, #EEE7FB 100%)',
    rose:      'linear-gradient(135deg, #FBDDE3 0%, #FDEBEF 100%)',
  };
  return g[color] || 'linear-gradient(135deg, #EFF1F7 0%, #F6F7FB 100%)';
}

export function getHeroIconColor(color) {
  const m = {
    amber:     'var(--amber-600)',
    mint:      'var(--mint-600)',
    tangerine: 'var(--tangerine-600)',
    lilac:     'var(--lilac-600)',
    rose:      'var(--rose-600)',
  };
  return m[color] || 'var(--ink-500)';
}

/* ─── format helpers ────────────────────────────── */
export function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatSlotDisplay(slot) {
  if (!slot) return '-';
  const d = new Date(slot.date + 'T00:00:00');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const time = slot.startTime ? slot.startTime.slice(0, 5) : slot.time;
  return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]}) ${time}`;
}

export function formatTimeOnly(startTime) {
  if (!startTime) return '-';
  return startTime.slice(0, 5);
}

export function formatDateHeader(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;
}

export function formatCreatedAt(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function addHour(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const nh = h + 1;
  if (nh >= 24) return '23:30';
  return `${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTimeOptions(fromTime) {
  const options = [];
  const startMinutes = fromTime ? (() => {
    const [h, m] = fromTime.split(':').map(Number);
    return h * 60 + m + 30;
  })() : 0;
  for (let mins = startMinutes; mins < 24 * 60; mins += 30) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    options.push(`${h}:${m}`);
  }
  return options;
}

export const REMIND_STATUS_LABEL = {
  proposal_sent:     '프로필 제안 발송 · 응답 대기',
  proposal_accepted: '프로필 제안 단계 · 상대방 응답 대기',
  awaiting_payment:  '입금 대기',
  scheduling:        '일정 조율 중',
  scheduled:         '약속 확정',
  completed:         '만남 완료 · 에프터 응답 대기',
};

export const REMIND_ACTION_LABEL = {
  proposal_sent:     '프로필 제안 안내',
  proposal_accepted: '프로필 제안 안내',
  awaiting_payment:  '입금 안내',
  scheduling:        '일정 등록 안내',
  scheduled:         '만남 확정 안내',
  completed:         '에프터 응답 안내',
};

export function getRemindPreview(match, payments) {
  const empty = { statusLabel: '-', actionLabel: '진행 안내', recipients: [] };
  if (!match) return empty;
  const A = match.clientA || {};
  const B = match.clientB || {};
  const st = match.status;
  const recipients = [];
  if (st === 'proposal_sent') {
    const p = A.role === 'proposer' ? A : B.role === 'proposer' ? B : null;
    if (p?.clientName) recipients.push({ name: p.clientName, reason: '프로필 제안 응답 전' });
  } else if (st === 'proposal_accepted') {
    const r = A.role === 'receiver' ? A : B.role === 'receiver' ? B : null;
    if (r?.clientName) recipients.push({ name: r.clientName, reason: '프로필 제안 응답 전' });
  } else if (st === 'awaiting_payment') {
    const pA = (payments || []).find((p) => p.clientId === A.clientId)
      || match.paymentSummary?.clientA;
    const pB = (payments || []).find((p) => p.clientId === B.clientId)
      || match.paymentSummary?.clientB;
    const isUnpaid = (p) => {
      if (!p) return true;
      // 입금 완료(paid) 또는 환불/부분환불은 "재안내 대상 아님"
      return p.status !== 'paid'
        && p.status !== 'partial_refunded'
        && p.status !== 'refunded';
    };
    if (isUnpaid(pA) && A.clientName) recipients.push({ name: A.clientName, reason: '입금 미확인' });
    if (isUnpaid(pB) && B.clientName) recipients.push({ name: B.clientName, reason: '입금 미확인' });
  } else if (st === 'scheduling') {
    const pendingA = A.clientName && !A.availableTimesSubmitted;
    const pendingB = B.clientName && !B.availableTimesSubmitted;
    if (pendingA) recipients.push({ name: A.clientName, reason: '가용시간 미제출' });
    if (pendingB) recipients.push({ name: B.clientName, reason: '가용시간 미제출' });
    if (recipients.length === 0) {
      if (A.clientName) recipients.push({ name: A.clientName, reason: '일정 등록 재안내' });
      if (B.clientName) recipients.push({ name: B.clientName, reason: '일정 등록 재안내' });
    }
  } else if (st === 'scheduled') {
    if (A.clientName) recipients.push({ name: A.clientName, reason: '확정 일정 재안내' });
    if (B.clientName) recipients.push({ name: B.clientName, reason: '확정 일정 재안내' });
  } else if (st === 'completed') {
    if (A.clientName && (A.afterResponse || 'pending') === 'pending') recipients.push({ name: A.clientName, reason: '에프터 응답 대기' });
    if (B.clientName && (B.afterResponse || 'pending') === 'pending') recipients.push({ name: B.clientName, reason: '에프터 응답 대기' });
  }
  return {
    statusLabel: REMIND_STATUS_LABEL[st] || '-',
    actionLabel: REMIND_ACTION_LABEL[st] || '진행 안내',
    recipients,
  };
}

/* ─── auto-send history ──────────────────────────
   각 단계에 진입할 때 시스템이 자동으로 발송한 안내 문자를
   매치 데이터(타임스탬프) 로부터 파생하여 보여준다.
─────────────────────────────────────────────────── */
export function formatAutoSendTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${mi}`;
}

export function buildAutoSendHistory(match) {
  if (!match) return [];
  const A = match.clientA || {};
  const B = match.clientB || {};
  const nameA = A.clientNickname || A.clientName || '회원A';
  const nameB = B.clientNickname || B.clientName || '회원B';
  const proposer = A.role === 'proposer' ? A : B.role === 'proposer' ? B : A;
  const receiver = A.role === 'receiver' ? A : B.role === 'receiver' ? B : B;
  const proposerName = proposer?.clientNickname || proposer?.clientName || nameA;
  const receiverName = receiver?.clientNickname || receiver?.clientName || nameB;

  const stepIdx = getStepIndex(match.status);

  const entries = [
    {
      stepKey: 'proposal_sent',
      label: '프로필 제안 안내',
      recipients: [proposerName],
      sentAt: match.startedAt || match.createdAt,
    },
    {
      stepKey: 'proposal_accepted',
      label: '프로필 제안 안내',
      recipients: [receiverName],
      sentAt: proposer?.respondedAt || null,
    },
    {
      stepKey: 'awaiting_payment',
      label: '입금 확인 안내',
      recipients: [nameA, nameB],
      sentAt: receiver?.respondedAt || null,
    },
    {
      stepKey: 'scheduling',
      label: '가용시간 등록 요청',
      recipients: [nameA, nameB],
      sentAt: match.paymentConfirmedAt || match.schedulingStartedAt || null,
    },
    {
      stepKey: 'scheduled',
      label: '만남 확정 안내',
      recipients: [nameA, nameB],
      sentAt: match.confirmedSchedule?.confirmedAt || match.scheduledAt || null,
    },
    {
      stepKey: 'completed',
      label: '에프터 응답 안내',
      recipients: [nameA, nameB],
      sentAt: match.completedAt || null,
    },
  ];

  return entries.map((e) => ({
    ...e,
    stepIdx: getStepIndex(e.stepKey),
    sent: getStepIndex(e.stepKey) <= stepIdx,
  }));
}

export function getRefundStatus(meetingDate) {
  if (!meetingDate) return null;
  const hours = (new Date(meetingDate) - new Date()) / (1000 * 60 * 60);
  if (hours >= 168) return { label: '전액 환불 가능', type: 'safe', hours: Math.floor(hours) };
  if (hours >= 72)  return { label: '80% 환불 가능',  type: 'safe', hours: Math.floor(hours) };
  if (hours >= 24)  return { label: '환불 불가 · 일정 변경 가능', type: 'warn',   hours: Math.floor(hours) };
  if (hours > 0)    return { label: '환불 불가',       type: 'danger', hours: Math.floor(hours) };
  return { label: '미팅 시간 경과', type: 'past', hours: 0 };
}
