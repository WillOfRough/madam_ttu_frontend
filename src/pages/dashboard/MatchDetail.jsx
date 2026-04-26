import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Copy, Check, Calendar, MapPin, Clock, AlertTriangle,
  Link2, ChevronDown, ChevronUp, User, RefreshCw, Trash2,
  Heart, MessageSquare, FileText, Phone, Send,
  ArrowRight, Bell, Info, X, Wallet, Pencil, CheckCircle2,
} from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import { loadTemplates } from './ManagerGuide';
import styles from './MatchDetail.module.css';

/* ─── message helpers ─────────────────────────────── */
function generateProposalMessage(clientName, proposalUrl, inquiryUrl) {
  const templates = loadTemplates();
  return templates.proposalIntro
    .replace(/OO\(별명\)/, clientName)
    .replace('[프로포절 링크 첨부]', proposalUrl)
    .replace('[문의 링크 첨부]', inquiryUrl);
}

function generateReminderMessage(clientName, partnerName, proposalUrl) {
  const templates = loadTemplates();
  return templates.proposalReminder
    .replace(/OO님/g, `${clientName}님`)
    .replace(/\[매칭 상대\]/g, partnerName)
    .replace('[프로포절 링크 첨부]', proposalUrl);
}

function generateAfterSuccessMessage(clientName) {
  const templates = loadTemplates();
  return templates.afterSuccess.replace(/OO님/g, `${clientName}님`);
}

function generateAfterCompleteMessage(afterUrl) {
  const templates = loadTemplates();
  return templates.afterComplete.replace('[애프터 확인 링크]', afterUrl);
}

function generateSchedulingMessage(clientName, scheduleUrl) {
  const templates = loadTemplates();
  return templates.schedulingGuide
    .replace('[일정 등록 링크 첨부]', scheduleUrl);
}

function generateAfterResultMessage(clientName, resultUrl, afterStatus) {
  const templates = loadTemplates();
  const template = afterStatus === 'rejected' ? templates.afterResultRejected : templates.afterResult;
  return template
    .replace(/OO님/g, `${clientName}님`)
    .replace(/\[결과 확인 링크\]/g, resultUrl);
}

function generateMeetingMessage(clientName, schedule) {
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
const RESPONSE_MAP = {
  accepted: { label: '수락', className: 'responseAccepted' },
  rejected: { label: '거절', className: 'responseRejected' },
};

const STEPS = [
  { key: 'draft',             label: '대기' },
  { key: 'proposal_sent',     label: 'A확인' },
  { key: 'proposal_accepted', label: 'B확인' },
  { key: 'awaiting_payment',  label: '입금' },
  { key: 'scheduling',        label: '조율' },
  { key: 'arranging',         label: '확정' },
  { key: 'scheduled',         label: '약속' },
  { key: 'completed',         label: '완료' },
];

function getStepIndex(status) {
  const idx = STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? -1 : idx;
}

/* hero card stage config */
function getStageHero(match) {
  const status = match?.status;
  const A = match?.clientA || {};
  const B = match?.clientB || {};
  const proposer = A.role === 'proposer' ? A : B.role === 'proposer' ? B : null;
  const receiver = A.role === 'receiver' ? A : B.role === 'receiver' ? B : null;
  const proposerName = proposer?.clientName || 'A';
  const receiverName = receiver?.clientName || 'B';
  const map = {
    draft:            { color: 'lilac',     icon: 'send',     title: '매칭을 시작할 준비가 되었어요', sub: `시작하면 ${proposerName}님께 프로필 링크 문자가 자동 발송돼요.` },
    proposal_sent:    { color: 'lilac',     icon: 'clock',    title: `${proposerName}님의 응답을 기다리고 있어요`,  sub: '프로필 링크 전달 후 응답 대기 중입니다.' },
    proposal_accepted:{ color: 'lilac',     icon: 'check',    title: `${receiverName}님의 응답을 기다리고 있어요`,  sub: `${proposerName}님이 수락했습니다.` },
    awaiting_payment: { color: 'amber',     icon: 'money',    title: '두 분 모두 입금을 확인해 주세요', sub: `${proposerName} · ${receiverName} 모두 입금이 완료되면 처리 버튼을 눌러주세요.` },
    scheduling:       { color: 'tangerine', icon: 'calendar', title: '양쪽 가용시간을 기다리고 있어요', sub: '둘 다 제출하면 공통 시간으로 자동 확정돼요.' },
    arranging:        { color: 'tangerine', icon: 'calendar', title: '공통 시간이 확정되었어요',        sub: '아래에서 약속 일시를 확인하고 확정하세요.' },
    scheduled:        { color: 'mint',      icon: 'mapPin',   title: '약속이 확정되었어요',             sub: '미팅 당일 두 분이 잘 만날 수 있도록 챙겨주세요.' },
    completed:        { color: 'lilac',     icon: 'heart',    title: '미팅이 완료되었어요',             sub: '에프터 응답을 기다리고 있어요.' },
    cancelled:        { color: 'rose',      icon: 'x',        title: '매칭이 취소되었어요',             sub: '' },
  };
  return map[status] || map.draft;
}

function getHeroGradient(color) {
  const g = {
    amber:     'linear-gradient(135deg, #FBE7C7 0%, #FFF2DB 100%)',
    mint:      'linear-gradient(135deg, #D4F1E2 0%, #E8F8EE 100%)',
    tangerine: 'linear-gradient(135deg, #FFE5DA 0%, #FFF2EB 100%)',
    lilac:     'linear-gradient(135deg, #E3DBF8 0%, #EEE7FB 100%)',
    rose:      'linear-gradient(135deg, #FBDDE3 0%, #FDEBEF 100%)',
  };
  return g[color] || 'linear-gradient(135deg, #EFF1F7 0%, #F6F7FB 100%)';
}

function getHeroIconColor(color) {
  const m = {
    amber:     'var(--amber-600)',
    mint:      'var(--mint-600)',
    tangerine: 'var(--tangerine-600)',
    lilac:     'var(--lilac-600)',
    rose:      'var(--rose-600)',
  };
  return m[color] || 'var(--ink-500)';
}

function getHeroKickerColor(color) {
  const m = {
    amber:     '#9A5E0E',
    mint:      '#1A7A50',
    tangerine: 'var(--tangerine-700)',
    lilac:     '#4F3DA0',
    rose:      '#B13149',
  };
  return m[color] || 'var(--ink-500)';
}

/* ─── format helpers ────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatSlotDisplay(slot) {
  if (!slot) return '-';
  const d = new Date(slot.date + 'T00:00:00');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const time = slot.startTime ? slot.startTime.slice(0, 5) : slot.time;
  return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]}) ${time}`;
}

function formatTimeOnly(startTime) {
  if (!startTime) return '-';
  return startTime.slice(0, 5);
}

function formatDateHeader(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;
}

function formatCreatedAt(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function addHour(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const nh = h + 1;
  if (nh >= 24) return '23:30';
  return `${String(nh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateTimeOptions(fromTime) {
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

const REMIND_STATUS_LABEL = {
  proposal_sent:     '프로필 제안 발송 · 응답 대기',
  proposal_accepted: '프로필 제안 단계 · 상대방 응답 대기',
  awaiting_payment:  '입금 대기',
  scheduling:        '일정 조율 중',
  scheduled:         '약속 확정',
  completed:         '만남 완료 · 에프터 응답 대기',
};

const REMIND_ACTION_LABEL = {
  proposal_sent:     '프로필 제안 안내',
  proposal_accepted: '프로필 제안 안내',
  awaiting_payment:  '입금 안내',
  scheduling:        '일정 등록 안내',
  scheduled:         '만남 확정 안내',
  completed:         '에프터 응답 안내',
};

function getRemindPreview(match, payments) {
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
    const pA = (payments || []).find((p) => p.clientId === A.clientId);
    const pB = (payments || []).find((p) => p.clientId === B.clientId);
    const unpaidA = pA ? pA.status !== 'confirmed' : true;
    const unpaidB = pB ? pB.status !== 'confirmed' : true;
    if (unpaidA && A.clientName) recipients.push({ name: A.clientName, reason: '입금 미확인' });
    if (unpaidB && B.clientName) recipients.push({ name: B.clientName, reason: '입금 미확인' });
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

function getRefundStatus(meetingDate) {
  if (!meetingDate) return null;
  const hours = (new Date(meetingDate) - new Date()) / (1000 * 60 * 60);
  if (hours >= 168) return { label: '전액 환불 가능', type: 'safe', hours: Math.floor(hours) };
  if (hours >= 72)  return { label: '80% 환불 가능',  type: 'safe', hours: Math.floor(hours) };
  if (hours >= 24)  return { label: '환불 불가 · 일정 변경 가능', type: 'warn',   hours: Math.floor(hours) };
  if (hours > 0)    return { label: '환불 불가',       type: 'danger', hours: Math.floor(hours) };
  return { label: '미팅 시간 경과', type: 'past', hours: 0 };
}

/* ═══════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════ */
export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [venue, setVenue] = useState('');
  const [locationLinkInput, setLocationLinkInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [selectedTimeId, setSelectedTimeId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRescheduleLinks, setShowRescheduleLinks] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCompleteWarning, setShowCompleteWarning] = useState(false);
  const [paymentConfirmTarget, setPaymentConfirmTarget] = useState(null); // null | 'all' | 'A' | 'B'
  const [cancelReason, setCancelReason] = useState('');
  const [payments, setPayments] = useState(null);
  const [showEditSchedule, setShowEditSchedule] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editLocationLink, setEditLocationLink] = useState('');
  const [submittedTimes, setSubmittedTimes] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [showRemindConfirm, setShowRemindConfirm] = useState(false);
  const [participantTab, setParticipantTab] = useState('profile');

  const reload = () => {
    matchService.getMatchDetail(matchId).then(setMatch).catch((err) => {
      toast.error(err.message || '데이터를 불러오지 못했습니다.');
    });
  };

  useEffect(() => {
    if (matchId) {
      setLoading(true);
      matchService
        .getMatchDetail(matchId)
        .then(setMatch)
        .catch((err) => {
          toast.error(err.message || '매칭 정보를 불러올 수 없습니다.');
          navigate('/dashboard/matches');
        })
        .finally(() => setLoading(false));
    }
  }, [matchId, navigate]);

  useEffect(() => {
    if (!matchId || match?.status !== 'awaiting_payment') {
      setPayments(null);
      return;
    }
    let cancelled = false;
    matchService.getMatchPayments(matchId)
      .then((res) => { if (!cancelled) setPayments(Array.isArray(res) ? res : []); })
      .catch(() => { if (!cancelled) setPayments([]); });
    return () => { cancelled = true; };
  }, [matchId, match?.status]);

  if (loading)
    return (
      <div className={styles.page}>
        <div className={styles.skeletonWrap}>
          <SkeletonLine width="100px" height="16px" />
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonLine width="40%" height="28px" />
            <SkeletonLine width="100%" height="200px" />
          </div>
        </div>
      </div>
    );

  if (!match) return null;

  const safeClient = {
    clientId: null, clientName: '삭제된 회원', clientNickname: null, clientPhone: null,
    clientGender: null, clientAge: 0, clientLocation: null, clientCompany: null,
    clientWorkLocation: null, clientOccupation: null, clientEducation: null,
    clientPhotoUrls: [], proposalToken: null, response: null, afterResponse: null,
    deleted: true, availableTimesSubmitted: false, managerName: null,
    respondedAt: null, feedbackAt: null, feedbackRating: null, feedbackComment: null,
  };
  if (!match.clientA) match.clientA = { ...safeClient };
  if (!match.clientB) match.clientB = { ...safeClient };

  const stepIndex = getStepIndex(match.status);
  const isCancelled = match.status === 'cancelled';
  const refundStatus = getRefundStatus(match.meetingDate);
  const heroConfig = getStageHero(match);

  /* ── handlers ── */
  const handlePaymentConfirm = async () => {
    setActionLoading(true);
    try {
      await matchService.confirmPayment(matchId);
      toast.success('입금 확인이 완료되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '입금 확인에 실패했습니다.');
    }
    setActionLoading(false);
  };

  const handleParticipantPaymentConfirm = async (side) => {
    const client = side === 'A' ? match.clientA : match.clientB;
    const payment = (payments || []).find((p) => p.clientId === client.clientId);
    const participantId = payment?.matchParticipantId;
    if (!participantId) {
      toast.error('결제 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await matchService.confirmParticipantPayment(matchId, participantId);
      const msg = res?.message || res?.data || '입금이 확인되었습니다.';
      toast.success(typeof msg === 'string' ? msg : '입금이 확인되었습니다.');
      reload();
      matchService.getMatchPayments(matchId).then((r) => setPayments(Array.isArray(r) ? r : []));
    } catch (err) {
      toast.error(err.message || '입금 확인에 실패했습니다.');
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('취소 사유를 입력해주세요.');
      return;
    }
    setActionLoading(true);
    try {
      await matchService.cancelMatch(matchId, { reason: cancelReason.trim() });
      toast.success('매칭이 취소되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '취소에 실패했습니다.');
    }
    setActionLoading(false);
    setShowCancel(false);
    setCancelReason('');
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await matchService.deleteMatch(matchId);
      toast.success('매칭이 삭제되었습니다.');
      navigate('/dashboard/matches');
    } catch (err) {
      toast.error(err.message || '삭제에 실패했습니다.');
    }
    setActionLoading(false);
    setShowDelete(false);
  };

  const handleConfirmSchedule = async () => {
    if (!selectedTimeId) return;
    setActionLoading(true);
    try {
      await matchService.confirmMatch(matchId, {
        timeId: selectedTimeId, location: venue,
        locationLink: locationLinkInput || null, endTime: endTimeInput || null,
      });
      toast.success('약속이 확정되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '약속 확정에 실패했습니다.');
    }
    setActionLoading(false);
    setShowConfirm(false);
    setVenue('');
    setLocationLinkInput('');
    setEndTimeInput('');
    setSelectedTimeId(null);
  };

  const handleReschedule = async () => {
    setActionLoading(true);
    try {
      await matchService.rescheduleMatch(matchId);
      toast.success('가용시간이 초기화되었습니다. 양쪽 회원이 다시 등록할 수 있습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '일정 재조율에 실패했습니다.');
    }
    setActionLoading(false);
  };

  const openEditScheduleModal = async () => {
    const cs = match.confirmedSchedule || {};
    setEditDate(cs.date || '');
    setEditStartTime(cs.startTime ? cs.startTime.slice(0, 5) : '');
    setEditEndTime(cs.endTime ? cs.endTime.slice(0, 5) : '');
    setEditVenue(cs.location || '');
    setEditLocationLink(cs.locationLink || '');
    setShowEditSchedule(true);
    setLoadingTimes(true);
    try {
      const res = await matchService.getMatchAvailableTimes(matchId);
      setSubmittedTimes(res?.times || []);
    } catch {
      setSubmittedTimes([]);
    }
    setLoadingTimes(false);
  };

  const closeEditScheduleModal = () => {
    setShowEditSchedule(false);
    setEditDate('');
    setEditStartTime('');
    setEditEndTime('');
    setEditVenue('');
    setEditLocationLink('');
    setSubmittedTimes([]);
  };

  const applyTimeSlotToEdit = (slot) => {
    setEditDate(slot.date);
    setEditStartTime(slot.startTime ? slot.startTime.slice(0, 5) : '');
    if (slot.startTime) {
      const hhmm = slot.startTime.slice(0, 5);
      setEditEndTime(addHour(hhmm));
    }
  };

  const handleRemindClick = () => {
    setShowRemindConfirm(true);
  };

  const handleRemind = async () => {
    setShowRemindConfirm(false);
    setActionLoading(true);
    try {
      const res = await matchService.remindMatch(matchId);
      const action = res?.action;
      const sent = res?.sentToParticipantIds || [];
      if (sent.length === 0) {
        toast.success('재발송할 대상이 없어요.');
      } else {
        const actionLabel = {
          proposal: '프로필 제안 안내',
          payment: '입금 안내',
          scheduling: '일정 등록 안내',
          meeting: '만남 확정 안내',
          after: '에프터 응답 안내',
        }[action] || '진행 안내';
        toast.success(`${actionLabel}를 재발송했어요.`);
      }
    } catch (err) {
      const code = err?.body?.errorCode;
      if (code === '9.007') {
        toast.error('현재 상태에서는 재발송할 수 없어요.');
      } else {
        toast.error(err.message || '재발송에 실패했습니다.');
      }
    }
    setActionLoading(false);
  };

  const handleUpdateScheduleClick = () => {
    if (!editDate || !editStartTime || !editVenue.trim()) {
      toast.error('날짜 / 시작 시간 / 장소는 필수입니다.');
      return;
    }
    setShowEditConfirm(true);
  };

  const handleUpdateSchedule = async () => {
    setShowEditConfirm(false);
    setActionLoading(true);
    try {
      await matchService.updateMatchSchedule(matchId, {
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime || null,
        location: editVenue.trim(),
        locationLink: editLocationLink.trim() || null,
      });
      toast.success('약속 일정이 변경되었습니다.');
      closeEditScheduleModal();
      reload();
    } catch (err) {
      const code = err?.body?.errorCode;
      if (code === '9.007') {
        toast.error('scheduled 상태에서만 수정 가능합니다.');
      } else {
        toast.error(err.message || '일정 수정에 실패했습니다.');
      }
    }
    setActionLoading(false);
  };

  const isMeetingTimeReached = () => {
    const schedule = match?.confirmedSchedule;
    if (!schedule?.date || !schedule?.startTime) return true;
    const startHHMM = schedule.startTime.slice(0, 5);
    const [h, m] = startHHMM.split(':').map(Number);
    const meetingEnd = new Date(schedule.date + 'T00:00:00');
    meetingEnd.setHours(h + 1, m, 0, 0);
    return Date.now() >= meetingEnd.getTime();
  };

  const handleStartMatch = async () => {
    setActionLoading(true);
    try {
      await matchService.startMatch(matchId);
      toast.success('매칭이 시작되었습니다. A에게 프로필 제안 메시지를 보내주세요.');
      reload();
    } catch (err) {
      toast.error(err.message || '매칭 시작에 실패했습니다.');
    }
    setActionLoading(false);
  };

  const handleCompleteClick = () => {
    if (!isMeetingTimeReached()) {
      setShowCompleteWarning(true);
    } else {
      handleCompleteMatch();
    }
  };

  const handleCompleteMatch = async () => {
    setShowCompleteWarning(false);
    setActionLoading(true);
    try {
      await matchService.completeMatch(matchId);
      toast.success('미팅 완료 처리되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '처리에 실패했습니다.');
    }
    setActionLoading(false);
  };

  /* ── derived data ── */
  const allTimes = match.availableTimes || [];
  const timesA = allTimes.filter((t) => t.clientId === match.clientA.clientId);
  const timesB = allTimes.filter((t) => t.clientId === match.clientB.clientId);

  const commonKeys = new Set();
  timesA.forEach((a) => {
    timesB.forEach((b) => {
      if (a.date === b.date && formatTimeOnly(a.startTime) === formatTimeOnly(b.startTime)) {
        commonKeys.add(`${a.date}_${formatTimeOnly(a.startTime)}`);
      }
    });
  });

  const selectedSlot = allTimes.find((t) => t.timeId === selectedTimeId);

  const openConfirmModal = () => {
    if (selectedSlot) {
      const startHHMM = formatTimeOnly(selectedSlot.startTime);
      setEndTimeInput(addHour(startHHMM));
    }
    setShowConfirm(true);
  };

  const confirmedSchedule = match.confirmedSchedule || null;

  /* ── hero icon render ── */
  const HeroIcon = () => {
    const iconMap = {
      send:     <Send size={18} />,
      clock:    <Clock size={18} />,
      check:    <Check size={18} />,
      money:    <Wallet size={18} />,
      calendar: <Calendar size={18} />,
      mapPin:   <MapPin size={18} />,
      heart:    <Heart size={18} />,
      x:        <X size={18} />,
    };
    return iconMap[heroConfig.icon] || <CheckCircle2 size={18} />;
  };

  /* ════════════════════ JSX ════════════════════ */
  return (
    <div className={styles.page}>

      {/* ── Sticky Top Nav ── */}
      <div className={styles.topNav}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/dashboard/matches')}
          aria-label="뒤로 가기"
        >
          <ChevronLeft size={22} />
        </button>
        <div className={styles.topNavMeta}>
          <div className={styles.topNavKicker}>매칭 · {formatCreatedAt(match.createdAt)}</div>
          <div className={styles.topNavTitle}>
            {match.clientA.clientName} ↔ {match.clientB.clientName}
          </div>
        </div>
      </div>

      <div className={styles.content}>

        {/* ── 8-Stage Stepper ── */}
        {!isCancelled && (
          <div className={styles.stepperCard}>
            <div className={styles.stepperHeader}>
              <div className={styles.stepperKicker}>현재 단계 {Math.max(stepIndex + 1, 1)}/8</div>
              <StatusBadge status={match.status} />
            </div>
            <div className={styles.stepperNodes}>
              {STEPS.map((step, i) => {
                const done = i < stepIndex;
                const now  = i === stepIndex;
                return (
                  <div key={step.key} className={styles.stepperNodeWrap}>
                    {i > 0 && (
                      <div className={`${styles.stepperLine} ${i <= stepIndex ? styles.stepperLineDone : ''}`} />
                    )}
                    <div className={`${styles.stepperNode} ${done ? styles.stepperNodeDone : ''} ${now ? styles.stepperNodeCurrent : ''}`}>
                      {done && <Check size={10} strokeWidth={3} />}
                      {now  && <span className={styles.stepperNodeDot} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.stepperLabels}>
              {STEPS.map((step, i) => (
                <div key={step.key} className={`${styles.stepperLabel} ${i === stepIndex ? styles.stepperLabelCurrent : ''}`}>
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Hero Action Card ── */}
        <div
          className={styles.heroCard}
          style={{ background: getHeroGradient(heroConfig.color) }}
        >
          <div className={styles.heroTop}>
            <div
              className={styles.heroIconBlock}
              style={{ background: getHeroIconColor(heroConfig.color) }}
            >
              <HeroIcon />
            </div>
            <div
              className={styles.heroKicker}
              style={{ color: getHeroKickerColor(heroConfig.color) }}
            >
              지금 할 일
            </div>
          </div>
          <div className={styles.heroTitle}>{heroConfig.title}</div>
          <div className={styles.heroSub}>{heroConfig.sub}</div>

          {/* awaiting_payment: payment slots */}
          {match.status === 'awaiting_payment' && (
            <>
              <div className={styles.paymentSlots}>
                {['A', 'B'].map((side) => {
                  const client = side === 'A' ? match.clientA : match.clientB;
                  const paymentDetail = (payments || []).find((p) => p.clientId === client.clientId);
                  const paymentSummary = match.paymentSummary?.[`client${side}`];
                  const status = paymentDetail?.status || paymentSummary?.status || 'pending';
                  const amount = paymentDetail?.amount ?? paymentSummary?.amount ?? 19900;
                  const amountLabel = `${(amount || 0).toLocaleString('ko-KR')}원`;
                  const isFree = amount === 0;
                  const isPaid = status === 'paid';
                  const isPartialRefunded = status === 'partial_refunded';
                  const isRefunded = status === 'refunded';
                  const hasParticipantId = Boolean(paymentDetail?.matchParticipantId);
                  const refundAmount = paymentDetail?.refundAmount ?? paymentSummary?.refundAmount ?? 0;
                  const slotClass = isFree
                    ? styles.paymentSlotPaid
                    : isPartialRefunded
                    ? styles.paymentSlotPartialRefunded
                    : isRefunded
                    ? styles.paymentSlotRefunded
                    : isPaid
                    ? styles.paymentSlotPaid
                    : styles.paymentSlotPending;
                  return (
                    <div key={side} className={`${styles.paymentSlot} ${slotClass}`}>
                      <div className={styles.paymentSlotHeader}>
                        <span className={styles.paymentSlotAvatar} style={{
                          background: client.clientGender === 'female' ? 'var(--female-100)' : 'var(--male-100)',
                          color: client.clientGender === 'female' ? 'var(--female)' : 'var(--male)',
                        }}>
                          {client.clientName?.slice(1) || side}
                        </span>
                        <span className={styles.paymentSlotName}>{client.clientNickname || client.clientName}</span>
                        {isFree && <span className={styles.paymentSlotFreeBadge}>무료 매칭</span>}
                      </div>
                      {isFree ? (
                        <div className={styles.paymentSlotAmount}>0원</div>
                      ) : isRefunded ? (
                        <div className={`${styles.paymentSlotAmount} ${styles.paymentSlotAmountStruck}`}>{amountLabel}</div>
                      ) : isPartialRefunded ? (
                        <div className={styles.paymentSlotAmount}>
                          {amountLabel}
                          <span className={styles.paymentSlotAmountRemaining}> → 남은 {(amount - refundAmount).toLocaleString('ko-KR')}원</span>
                        </div>
                      ) : (
                        <div className={styles.paymentSlotAmount}>{amountLabel}</div>
                      )}
                      <div className={`${styles.paymentSlotStatus} ${
                        isFree ? styles.paymentSlotStatusPaid
                        : isPartialRefunded ? styles.paymentSlotStatusPartialRefunded
                        : isRefunded ? styles.paymentSlotStatusRefunded
                        : isPaid ? styles.paymentSlotStatusPaid
                        : styles.paymentSlotStatusPending
                      }`}>
                        {isFree && <><Check size={12} strokeWidth={2.5} /> 입금 불필요</>}
                        {!isFree && isPaid && <><Check size={12} strokeWidth={2.5} /> 입금 완료</>}
                        {!isFree && isPartialRefunded && <>● 부분환불 ({refundAmount.toLocaleString('ko-KR')}원)</>}
                        {!isFree && isRefunded && <>● 환불완료</>}
                        {!isFree && !isPaid && !isPartialRefunded && !isRefunded && <>● 입금 대기</>}
                      </div>
                      {!isFree && !isPaid && !isPartialRefunded && !isRefunded && (
                        <button
                          className={styles.paymentSlotBtn}
                          onClick={() => setPaymentConfirmTarget(side)}
                          disabled={actionLoading || !hasParticipantId}
                          title={!hasParticipantId ? '결제 정보 로딩 중...' : ''}
                        >
                          {actionLoading ? '확인 중...' : `${side} 입금 확인`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.paymentNote}>
                <Info size={11} style={{ color: 'var(--amber-600)', flexShrink: 0 }} />
                {(() => {
                  const amtA = (payments || []).find((p) => p.clientId === match.clientA?.clientId)?.amount
                    ?? match.paymentSummary?.clientA?.amount
                    ?? 19900;
                  const amtB = (payments || []).find((p) => p.clientId === match.clientB?.clientId)?.amount
                    ?? match.paymentSummary?.clientB?.amount
                    ?? 19900;
                  if (amtA === 0 && amtB === 0) return '양쪽 모두 무료 매칭이에요. 입금 확인 없이 바로 진행됩니다.';
                  if (amtA === amtB) {
                    return `계좌 내역에서 두 분 입금을 직접 확인해주세요 · ${amtA.toLocaleString('ko-KR')}원 × 2`;
                  }
                  return `계좌 내역에서 두 분 입금을 직접 확인해주세요 · A ${amtA.toLocaleString('ko-KR')}원 / B ${amtB.toLocaleString('ko-KR')}원`;
                })()}
              </div>
              <button
                className={styles.heroCtaBtn}
                onClick={() => setPaymentConfirmTarget('all')}
                disabled={actionLoading}
              >
                두 분 모두 입금 확인 완료
                <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* draft: start CTA */}
          {match.status === 'draft' && (
            <button
              className={styles.heroCtaBtn}
              onClick={handleStartMatch}
              disabled={actionLoading}
            >
              {actionLoading ? '시작 중...' : '매칭 시작하기'}
              <ArrowRight size={16} />
            </button>
          )}

          {/* scheduled: complete CTA */}
          {match.status === 'scheduled' && (
            <button
              className={styles.heroCtaBtn}
              onClick={handleCompleteClick}
              disabled={actionLoading}
            >
              {actionLoading ? '처리 중...' : '미팅 완료 처리'}
              <ArrowRight size={16} />
            </button>
          )}


        </div>

        {/* ── Cancelled Banner ── */}
        {isCancelled && (match.cancelReason || match.cancelledByName) && (
          <div className={styles.cancelledBanner}>
            <div className={styles.cancelledBannerTitle}>매칭 종료</div>
            {match.cancelledByName && (
              <div className={styles.cancelledBannerRow}>취소자: {match.cancelledByName}</div>
            )}
            {match.cancelledAt && (
              <div className={styles.cancelledBannerRow}>취소일: {formatDate(match.cancelledAt)}</div>
            )}
            {match.cancelReason && (
              <div className={styles.cancelledBannerRow}>{match.cancelReason}</div>
            )}
          </div>
        )}

        {/* ── Participants Section ── */}
        <div className={styles.participantsCard}>
          {/* Tab header */}
          <div className={styles.participantsTabs}>
            {[
              { k: 'profile',  label: '프로필' },
              { k: 'response', label: '응답' },
              { k: 'links',    label: '링크' },
            ].map((t) => (
              <button
                key={t.k}
                className={`${styles.participantsTab} ${participantTab === t.k ? styles.participantsTabActive : ''}`}
                onClick={() => setParticipantTab(t.k)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className={styles.participantsBody}>
            {participantTab === 'profile' && (
              <div className={styles.participantsList}>
                <ParticipantCard
                  participant={match.clientA}
                  partner={match.clientB}
                  label="회원 A"
                  matchStatus={match.status}
                  side="A"
                />
                <ParticipantCard
                  participant={match.clientB}
                  partner={match.clientA}
                  label="회원 B"
                  matchStatus={match.status}
                  side="B"
                />
              </div>
            )}

            {participantTab === 'response' && (
              <div className={styles.responsePanel}>
                {[
                  { client: match.clientA, side: 'A' },
                  { client: match.clientB, side: 'B' },
                ].map(({ client, side }) => {
                  const resp = client.response;
                  const after = client.afterResponse;
                  return (
                    <div key={side} className={styles.responseRow}>
                      <span className={styles.responseSideBadge}>{side}</span>
                      <span className={styles.responseClientName}>{client.clientName}</span>
                      <span className={`${styles.responseBadge} ${resp === 'accepted' ? styles.responseBadgeAccepted : resp === 'rejected' ? styles.responseBadgeRejected : styles.responseBadgePending}`}>
                        {resp === 'accepted' ? '수락' : resp === 'rejected' ? '거절' : '대기'}
                      </span>
                      {match.status === 'completed' && (
                        <span className={`${styles.responseBadge} ${after === 'accepted' ? styles.responseBadgeAccepted : after === 'rejected' ? styles.responseBadgeRejected : styles.responseBadgePending}`}>
                          에프터 {after === 'accepted' ? '수락' : after === 'rejected' ? '거절' : '대기'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {participantTab === 'links' && (
              <div className={styles.linksPanel}>
                {/* proposal sent — show proposal links */}
                {['proposal_sent', 'proposal_accepted'].includes(match.status) && (
                  <div className={styles.linksPanelSection}>
                    <div className={styles.linksPanelLabel}>프로포절 링크</div>
                    {[
                      { side: 'A', client: match.clientA },
                      { side: 'B', client: match.clientB },
                    ].map(({ side, client }) => {
                      const url = `${window.location.origin}/proposal/${client.proposalToken}`;
                      return (
                        <div key={side} className={styles.linkRow}>
                          <span className={styles.responseSideBadge}>{side}</span>
                          <span className={styles.linkValue}>{url}</span>
                          <button className={styles.linkCopyBtn} onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(url);
                              toast.success('링크가 복사되었습니다.');
                            } catch { toast.error('복사에 실패했습니다.'); }
                          }}>
                            <Copy size={12} /> 복사
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* scheduling */}
                {match.status === 'scheduling' && (
                  <SchedulingLinkCard match={match} />
                )}
                {/* after */}
                {match.status === 'completed' && (
                  <AfterLinkCard match={match} />
                )}
                {/* after result */}
                {match.status === 'completed' && (match.afterStatus === 'accepted' || match.afterStatus === 'rejected') && (
                  <AfterResultLinkCard match={match} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Guide Message (awaiting_payment) ── */}
        {match.status === 'awaiting_payment' && (
          <GuideMessageCard
            title="만남 성사 안내 (입금 요청)"
            hint="양쪽 모두 수락했습니다. 아래 입금 안내 메시지를 각 회원에게 보내주세요"
            badge="양식 3"
            participants={[match.clientA, match.clientB]}
            generateMsg={(p) => generateAfterSuccessMessage(p.clientNickname || p.clientName)}
          />
        )}

        {/* ── Confirmed Schedule Section ── */}
        {(match.status === 'scheduled' || match.status === 'completed') && confirmedSchedule && (
          <div className={styles.scheduleCard}>
            <div className={styles.scheduleCardHeader}>
              <div className={styles.scheduleCardTitle}>확정된 일정</div>
            </div>
            <div className={styles.scheduleRows}>
              {confirmedSchedule.date && (
                <div className={styles.scheduleRow}>
                  <div className={styles.scheduleRowIcon}><Calendar size={14} /></div>
                  <div className={styles.scheduleRowLabel}>날짜</div>
                  <div className={styles.scheduleRowValue}>{formatSlotDisplay(confirmedSchedule)}</div>
                </div>
              )}
              {confirmedSchedule.location && (
                <div className={styles.scheduleRow}>
                  <div className={styles.scheduleRowIcon}><MapPin size={14} /></div>
                  <div className={styles.scheduleRowLabel}>장소</div>
                  <div className={styles.scheduleRowValue}>{confirmedSchedule.location}</div>
                </div>
              )}
              {confirmedSchedule.locationLink && (
                <div className={styles.scheduleRow}>
                  <div className={styles.scheduleRowIcon}><Link2 size={14} /></div>
                  <div className={styles.scheduleRowLabel}>링크</div>
                  <div className={styles.scheduleRowValue}>
                    <a href={confirmedSchedule.locationLink} target="_blank" rel="noopener noreferrer" className={styles.locationLinkAnchor}>
                      {confirmedSchedule.locationLink}
                    </a>
                  </div>
                </div>
              )}
            </div>
            {match.status === 'scheduled' && (
              <div className={styles.scheduleActions}>
                <button className={styles.scheduleGhostBtn} onClick={openEditScheduleModal} disabled={actionLoading}>
                  <Pencil size={13} /> 일정 수정
                </button>
                <button className={styles.scheduleGhostBtn} onClick={() => setShowReschedule(true)} disabled={actionLoading}>
                  <RefreshCw size={13} /> 일정 재조율
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Guide Message (scheduled) ── */}
        {match.status === 'scheduled' && confirmedSchedule && (
          <GuideMessageCard
            title="만남 장소 확정 안내"
            hint="확정된 일정과 장소가 반영된 안내 메시지를 복사하세요"
            badge="양식 4"
            participants={[match.clientA, match.clientB]}
            generateMsg={(p) => generateMeetingMessage(p.clientNickname || p.clientName, confirmedSchedule)}
          />
        )}

        {/* ── Arranging: Common Times + Confirm ── */}
        {match.status === 'arranging' && allTimes.length > 0 && (
          <div className={styles.arrangingSection}>
            <div className={styles.sectionLabel}>공통 가용시간</div>
            <div className={styles.arrangingCard}>
              {commonKeys.size > 0 ? (
                <>
                  <div className={styles.slotGrid}>
                    {[...commonKeys].sort().map((key) => {
                      const [date, time] = key.split('_');
                      const matchingSlots = allTimes.filter((t) => t.date === date && formatTimeOnly(t.startTime) === time);
                      const firstSlot = matchingSlots[0];
                      const isSelected = matchingSlots.some((s) => s.timeId === selectedTimeId);
                      return (
                        <label
                          key={key}
                          className={`${styles.slotTag} ${styles.slotTagCommon} ${isSelected ? styles.slotTagPicked : ''}`}
                        >
                          <input
                            type="radio"
                            name="confirmTime"
                            value={firstSlot.timeId}
                            checked={isSelected}
                            onChange={() => setSelectedTimeId(firstSlot.timeId)}
                            style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}
                          />
                          {formatDateHeader(date)} {time}
                        </label>
                      );
                    })}
                  </div>
                  <button className={styles.confirmScheduleBtn} onClick={openConfirmModal} disabled={!selectedTimeId}>
                    약속 확정하기
                  </button>
                </>
              ) : (
                <div className={styles.noCommon}>
                  <AlertTriangle size={16} />
                  <span>겹치는 가용시간이 없습니다.</span>
                  <button className={styles.rescheduleInlineBtn} onClick={() => setShowReschedule(true)} disabled={actionLoading}>
                    <RefreshCw size={14} /> 일정 재조율
                  </button>
                </div>
              )}
            </div>

            <div className={styles.sectionLabel}>각자 가용시간</div>
            <div className={styles.availTimesGrid}>
              {[
                { side: 'A', client: match.clientA, times: timesA },
                { side: 'B', client: match.clientB, times: timesB },
              ].map(({ side, client, times }) => (
                <div key={side} className={styles.availTimesSide}>
                  <div className={styles.availTimesSideHeader}>
                    <span className={styles.responseSideBadge}>{side}</span>
                    <span className={styles.availTimesSideName}>{client.clientName}</span>
                  </div>
                  {times.length > 0 ? (
                    <div className={styles.slotGrid}>
                      {times.map((slot) => {
                        const isCommon = commonKeys.has(`${slot.date}_${formatTimeOnly(slot.startTime)}`);
                        return (
                          <span key={slot.timeId} className={`${styles.slotTag} ${isCommon ? styles.slotTagCommon : ''}`}>
                            {formatDateHeader(slot.date)} {formatTimeOnly(slot.startTime)}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={styles.waitingText}>아직 등록 없음</p>
                  )}
                </div>
              ))}
            </div>

            {/* Location Compare */}
            {(match.clientA.clientLocation || match.clientB.clientLocation) && (
              <div className={styles.locationCard}>
                <div className={styles.sectionLabel}>위치 정보</div>
                <div className={styles.locationCompare}>
                  {[
                    { side: 'A', client: match.clientA },
                    { side: 'B', client: match.clientB },
                  ].map(({ side, client }) => (
                    <div key={side} className={styles.locationCol}>
                      <div className={styles.locationColHeader}>
                        <span className={styles.responseSideBadge}>{side}</span>
                        <span>{client.clientName}</span>
                      </div>
                      {client.clientLocation && (
                        <div className={styles.locationItem}>
                          <span className={styles.locationLabel}>거주지</span>
                          <span>{client.clientLocation}</span>
                          <MapLinks address={client.clientLocation} />
                        </div>
                      )}
                      {client.clientCompany && (
                        <div className={styles.locationItem}>
                          <span className={styles.locationLabel}>회사</span>
                          <span>{client.clientCompany}</span>
                        </div>
                      )}
                      {client.clientWorkLocation && (
                        <div className={styles.locationItem}>
                          <span className={styles.locationLabel}>회사 위치</span>
                          <span>{client.clientWorkLocation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Scheduling: Waiting ── */}
        {match.status === 'scheduling' && (
          <div className={styles.infoCard}>
            <div className={styles.infoCardIcon}><Calendar size={16} /></div>
            <div className={styles.infoCardText}>
              <div className={styles.infoCardTitle}>일정 조율 중</div>
              <div className={styles.infoCardSub}>양쪽 회원의 가용시간 등록을 기다리고 있습니다.</div>
            </div>
          </div>
        )}

        {/* ── Refund Status ── */}
        {match.status === 'scheduled' && refundStatus && (
          <div className={styles.refundCard}>
            <div className={styles.refundHeader}>
              <AlertTriangle size={14} />
              <span>취소/환불 규정</span>
            </div>
            <div className={styles.refundBody}>
              <span className={`${styles.refundBadge} ${styles[`refund_${refundStatus.type}`]}`}>
                {refundStatus.label}
              </span>
              <span className={styles.refundHours}>약속까지 {refundStatus.hours}시간 남음</span>
            </div>
          </div>
        )}

        {/* ── After Status (completed) ── */}
        {match.status === 'completed' && (
          <div className={styles.afterCard}>
            <div className={styles.afterCardTitle}><Heart size={14} /> 에프터 현황</div>
            {match.afterStatus ? (
              <>
                <div className={styles.afterStatusRow}>
                  <span className={styles.afterStatusLabel}>에프터 상태</span>
                  <StatusBadge status={`after_${match.afterStatus}`} />
                </div>
                <div className={styles.afterResponses}>
                  {[
                    { side: 'A', participant: match.clientA },
                    { side: 'B', participant: match.clientB },
                  ].map(({ side, participant }) => (
                    <div key={side} className={styles.afterResponseItem}>
                      <span className={styles.responseSideBadge}>{side}</span>
                      <span className={styles.afterName}>{participant.clientName}</span>
                      <span className={styles[RESPONSE_MAP[participant.response]?.className || 'responseWaiting']}>
                        {RESPONSE_MAP[participant.response]?.label || '대기'}
                      </span>
                      <span className={styles[`afterResp_${participant.afterResponse || 'pending'}`]}>
                        {participant.afterResponse === 'accepted' ? '만나볼래요' : participant.afterResponse === 'rejected' ? '괜찮아요' : '대기 중'}
                      </span>
                    </div>
                  ))}
                </div>
                {match.afterStatus === 'rejected' && (match.clientA.feedbackAt || match.clientB.feedbackAt) && (
                  <div className={styles.feedbackSection}>
                    <div className={styles.feedbackSectionTitle}><MessageSquare size={14} /> 만남 피드백</div>
                    {[
                      { side: 'A', participant: match.clientA },
                      { side: 'B', participant: match.clientB },
                    ].filter((p) => p.participant.feedbackAt).map(({ side, participant }) => (
                      <div key={side} className={styles.feedbackItem}>
                        <div className={styles.feedbackItemHeader}>
                          <span className={styles.responseSideBadge}>{side}</span>
                          <span className={styles.feedbackItemName}>{participant.clientName}</span>
                          {participant.feedbackRating != null && (
                            <span className={styles.feedbackRatingBadge}>{participant.feedbackRating}/10</span>
                          )}
                        </div>
                        {participant.feedbackComment && (
                          <p className={styles.feedbackCommentText}>&ldquo;{participant.feedbackComment}&rdquo;</p>
                        )}
                        <p className={styles.feedbackDateText}>{formatDate(participant.feedbackAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className={styles.waitingText}>에프터 응답 대기 중입니다.</p>
            )}
          </div>
        )}

        {/* ── Remind Card ── */}
        {match.status !== 'cancelled' && match.afterStatus !== 'accepted' && match.afterStatus !== 'rejected' && (
          <div className={styles.remindCard}>
            <div className={styles.remindCardHeader}>
              <div className={styles.remindCardIcon}><Bell size={14} /></div>
              <div className={styles.remindCardMeta}>
                <div className={styles.remindCardKicker}>진행 안내 재발송</div>
                <div className={styles.remindCardTitle}>{REMIND_ACTION_LABEL[match.status] || '진행 안내'}</div>
              </div>
            </div>
            <div className={styles.remindCardBody}>
              <div className={styles.remindStatusLine}>
                현재 단계: <strong>{REMIND_STATUS_LABEL[match.status] || '-'}</strong>
              </div>
            </div>
            <div className={styles.remindCardFoot}>
              <button
                className={styles.remindSendBtn}
                onClick={handleRemindClick}
                disabled={actionLoading || match.status === 'draft' || match.status === 'arranging'}
              >
                <Send size={14} /> 진행 안내 재발송
              </button>
            </div>
          </div>
        )}

        {/* ── Match Info ── */}
        {match.note && (
          <div className={styles.infoCard}>
            <div className={styles.infoCardIcon}><FileText size={16} /></div>
            <div className={styles.infoCardText}>
              <div className={styles.infoCardTitle}>매니저 메모</div>
              <div className={styles.infoCardSub}>{match.note}</div>
            </div>
          </div>
        )}

        <div className={styles.matchMeta}>
          <span>생성일: {formatDate(match.createdAt)}</span>
          {match.meetingDate && <span>미팅일: {formatDate(match.meetingDate)}</span>}
        </div>

        {/* ── Destructive Actions ── */}
        <div className={styles.destructiveSection}>
          {(match.status === 'scheduled' || match.status === 'awaiting_payment' ||
            match.status === 'scheduling' || match.status === 'arranging' ||
            match.status === 'proposal_sent' || match.status === 'proposal_accepted') && (
            <button className={styles.destructiveBtn} onClick={() => setShowCancel(true)} disabled={actionLoading}>
              매칭 취소
            </button>
          )}
          <button className={styles.destructiveBtn} onClick={() => setShowDelete(true)} disabled={actionLoading}>
            <Trash2 size={14} /> 매칭 삭제
          </button>
        </div>

      </div>{/* /content */}

      {/* ════════════ Modals ════════════ */}

      {/* Delete Modal */}
      {showDelete && (
        <ConfirmModal
          title="매칭 삭제"
          message="이 매칭을 삭제하시겠습니까? 삭제된 매칭은 복구할 수 없습니다."
          confirmLabel="삭제"
          cancelLabel="돌아가기"
          danger
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {/* Cancel Modal */}
      {showCancel && (
        <div className={styles.overlay} onClick={() => { setShowCancel(false); setCancelReason(''); }}>
          <div className={styles.sheetModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetContent}>
              <h3 className={styles.sheetTitle}>매칭 취소</h3>
              {refundStatus && (
                <p className={styles.sheetDesc}>현재 {refundStatus.label} 상태입니다.</p>
              )}
              <div className={styles.cancelReasonSection}>
                <label className={styles.cancelReasonLabel}>취소 사유</label>
                <div className={styles.cancelReasonPresets}>
                  {['노쇼 (약속 불이행)', '회원 요청으로 취소', '일정 조율 실패', '상대방 거절'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.cancelReasonChip} ${cancelReason === preset ? styles.cancelReasonChipActive : ''}`}
                      onClick={() => setCancelReason(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <textarea
                  className={styles.cancelReasonInput}
                  placeholder="취소 사유를 입력하거나 위에서 선택해주세요"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.sheetActions}>
                <button className={styles.sheetCancelBtn} onClick={() => { setShowCancel(false); setCancelReason(''); }}>
                  돌아가기
                </button>
                <button
                  className={styles.sheetConfirmBtn}
                  onClick={handleCancel}
                  disabled={actionLoading || !cancelReason.trim()}
                >
                  취소 진행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Match Warning Modal */}
      {showCompleteWarning && (
        <ConfirmModal
          title="미팅 완료 처리"
          message="아직 미팅 시간 전입니다. 정말 완료 처리하시겠습니까?"
          confirmLabel="완료 처리"
          cancelLabel="돌아가기"
          danger
          onConfirm={handleCompleteMatch}
          onCancel={() => setShowCompleteWarning(false)}
        />
      )}

      {/* Reschedule Confirm Modal */}
      {showReschedule && (
        <ConfirmModal
          title="일정 재조율"
          message="양쪽 회원의 가용시간을 초기화하고 다시 등록을 요청합니다. 진행하시겠습니까?"
          confirmLabel="재조율 진행"
          cancelLabel="돌아가기"
          onConfirm={() => { setShowReschedule(false); handleReschedule(); }}
          onCancel={() => setShowReschedule(false)}
        />
      )}

      {/* Payment Confirm Warning Modal */}
      {paymentConfirmTarget && (
        <ConfirmModal
          title={paymentConfirmTarget === 'all' ? '두 분 입금 확인 처리' : `${paymentConfirmTarget} 입금 확인 처리`}
          message={(
            <>
              계좌에 실제로 입금된 것을 반드시 먼저 확인해 주세요.
              <br /><br />
              ⚠️ 입금 확인 처리하면 해당 건은 <b>정산 집계에 포함되지 않습니다.</b> 처리는 되돌릴 수 없어요.
              <br /><br />
              그래도 입금 처리하시겠습니까?
            </>
          )}
          confirmLabel="입금 처리"
          cancelLabel="돌아가기"
          danger
          onConfirm={() => {
            const target = paymentConfirmTarget;
            setPaymentConfirmTarget(null);
            if (target === 'all') handlePaymentConfirm();
            else handleParticipantPaymentConfirm(target);
          }}
          onCancel={() => setPaymentConfirmTarget(null)}
        />
      )}

      {/* Confirm Schedule Modal */}
      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.centeredModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>약속 확정</h3>
            {selectedSlot && (
              <p className={styles.modalDesc}>선택된 시간: {formatSlotDisplay(selectedSlot)}</p>
            )}
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>장소</label>
              <input
                className={styles.modalInput}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="예: 청담동 르카페"
              />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>장소 링크 (선택)</label>
              <input
                className={styles.modalInput}
                value={locationLinkInput}
                onChange={(e) => setLocationLinkInput(e.target.value)}
                placeholder="예: https://naver.me/abc123"
              />
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>종료 시간 (선택)</label>
              <select
                className={styles.modalInput}
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
              >
                <option value="">선택 안 함</option>
                {generateTimeOptions(selectedSlot ? formatTimeOnly(selectedSlot.startTime) : null).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.sheetCancelBtn} onClick={() => setShowConfirm(false)}>취소</button>
              <button
                className={styles.sheetConfirmBtn}
                onClick={handleConfirmSchedule}
                disabled={actionLoading || !selectedTimeId}
              >
                {actionLoading ? '확정 중...' : '약속 확정'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditSchedule && (
        <div className={styles.overlay} onClick={closeEditScheduleModal}>
          <div
            className={`${styles.sheetModal} ${styles.editScheduleModal}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sheetHandle} />
            <div className={styles.sheetContent}>
              <h3 className={styles.sheetTitle}>약속 일정 수정</h3>
              <p className={styles.sheetDesc}>
                확정된 일정을 즉시 덮어쓰고, 양쪽 회원에게 새 일정 안내가 재발송됩니다. 먼저 양쪽 회원과 합의 후 진행해주세요.
              </p>
              <div className={styles.editScheduleLayout}>
                <div className={styles.editScheduleLeft}>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>날짜</label>
                    <input type="date" className={styles.modalInput} value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                  </div>
                  <div className={styles.editTimeRow}>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>시작 시간</label>
                      <input type="time" className={styles.modalInput} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                    </div>
                    <div className={styles.modalField}>
                      <label className={styles.modalLabel}>종료 시간 (선택)</label>
                      <input type="time" className={styles.modalInput} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>장소</label>
                    <input type="text" className={styles.modalInput} value={editVenue} onChange={(e) => setEditVenue(e.target.value)} placeholder="예: 청담동 르카페" />
                  </div>
                  <div className={styles.modalField}>
                    <label className={styles.modalLabel}>장소 링크 (선택)</label>
                    <input type="url" className={styles.modalInput} value={editLocationLink} onChange={(e) => setEditLocationLink(e.target.value)} placeholder="예: https://naver.me/abc123" />
                  </div>
                  {!loadingTimes && submittedTimes.length === 0 && (
                    <p className={styles.editTimesEmpty}>제출된 가용시간이 없어요. 날짜·시간을 직접 입력해주세요.</p>
                  )}
                </div>
                {(loadingTimes || submittedTimes.length > 0) && (
                  <div className={styles.editTimesPanel}>
                    <p className={styles.editTimesPanelTitle}>회원 제출 가용시간</p>
                    {loadingTimes ? (
                      <p className={styles.editTimesEmpty}>불러오는 중...</p>
                    ) : (
                      submittedTimes.map((slot) => {
                        const isActive = slot.date === editDate && slot.startTime && slot.startTime.slice(0, 5) === editStartTime;
                        return (
                          <button
                            key={slot.timeId}
                            type="button"
                            className={`${styles.editTimeChip} ${isActive ? styles.editTimeChipActive : ''}`}
                            onClick={() => applyTimeSlotToEdit(slot)}
                          >
                            <span className={styles.editTimeChipName}>{slot.clientName}</span>
                            <span className={styles.editTimeChipDate}>{formatSlotDisplay(slot)}</span>
                            {slot.selected && <span className={styles.editTimeChipCurrent}>현재</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <div className={styles.modalActions}>
                <button className={styles.sheetCancelBtn} onClick={closeEditScheduleModal}>취소</button>
                <button
                  className={styles.sheetConfirmBtn}
                  onClick={handleUpdateScheduleClick}
                  disabled={actionLoading || !editDate || !editStartTime || !editVenue.trim()}
                >
                  {actionLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Confirm */}
      {showEditConfirm && (
        <ConfirmModal
          title="약속 일정 수정"
          message="양쪽 회원과 변경 사항을 합의하셨나요? 저장하면 새 일정이 즉시 적용되고, 양쪽 회원에게 변경 안내 메시지가 재발송됩니다."
          confirmLabel="네, 저장합니다"
          cancelLabel="돌아가기"
          danger
          onConfirm={handleUpdateSchedule}
          onCancel={() => setShowEditConfirm(false)}
        />
      )}

      {/* Remind Preview Modal */}
      {showRemindConfirm && (() => {
        const preview = getRemindPreview(match, payments);
        const empty = preview.recipients.length === 0;
        return (
          <div className={styles.overlay} onClick={() => setShowRemindConfirm(false)}>
            <div className={styles.sheetModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetContent}>
                <h3 className={styles.sheetTitle}>진행 안내 재발송</h3>
                <p className={styles.remindStatusLine}>
                  현재 단계: <strong>{preview.statusLabel}</strong>
                </p>
                {empty ? (
                  <p className={styles.remindEmptyMsg}>
                    현재 재발송이 필요한 회원이 없어요. 모두 응답 완료 상태입니다.
                  </p>
                ) : (
                  <>
                    <p className={styles.remindDescLine}>
                      아래 회원에게 <strong>{preview.actionLabel}</strong> LMS를 재발송합니다.
                    </p>
                    <ul className={styles.remindRecipientList}>
                      {preview.recipients.map((r) => (
                        <li key={r.name} className={styles.remindRecipientItem}>
                          <span className={styles.remindRecipientName}>{r.name}</span>
                          <span className={styles.remindRecipientReason}>{r.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <div className={styles.modalActions}>
                  <button className={styles.sheetCancelBtn} onClick={() => setShowRemindConfirm(false)}>
                    {empty ? '확인' : '취소'}
                  </button>
                  {!empty && (
                    <button className={styles.sheetConfirmBtn} onClick={handleRemind} disabled={actionLoading}>
                      {actionLoading ? '재발송 중...' : '재발송'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Sub-components
═══════════════════════════════════════════════════ */

function AfterLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [msgCopiedKey, setMsgCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/after`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/after`;

  const handleCopy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleMsgCopy = async (url, key) => {
    try {
      const msg = generateAfterCompleteMessage(url);
      await navigator.clipboard.writeText(msg);
      setMsgCopiedKey(key);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setMsgCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.schedulingLinkCard}>
      <h3 className={styles.schedulingLinkTitle}><Heart size={16} /> 에프터 링크</h3>
      <p className={styles.schedulingLinkHint}>미팅 후 아래 링크를 각 회원에게 전달해주세요</p>
      <div className={styles.schedulingLinkRows}>
        {[
          { side: 'A', client: match.clientA, url: urlA },
          { side: 'B', client: match.clientB, url: urlB },
        ].map(({ side, client, url }) => (
          <div key={side} className={styles.schedulingLinkRow}>
            <div className={styles.schedulingLinkLabel}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span>{client.clientName} — 에프터 응답</span>
              {client.afterResponse === 'accepted' && <span className={styles.submittedBadge}>만나볼래요</span>}
              {client.afterResponse === 'rejected' && <span className={styles.rejectedSubmitBadge}>괜찮아요</span>}
              {(!client.afterResponse || client.afterResponse === 'pending') && <span className={styles.pendingSubmitBadge}>미응답</span>}
            </div>
            <div className={styles.schedulingLinkUrl}>
              <span className={styles.schedulingLinkValue}>{url}</span>
              <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(url, side)}>
                {copiedKey === side ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === side ? '복사됨' : '링크 복사'}
              </button>
              <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(url, side)}>
                {msgCopiedKey === side ? <Check size={13} /> : <FileText size={13} />}
                {msgCopiedKey === side ? '복사됨' : '안내 메시지 복사'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AfterResultLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [msgCopiedKey, setMsgCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/after/result`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/after/result`;
  const bothResponded = match.afterStatus === 'accepted' || match.afterStatus === 'rejected';

  const handleCopy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleMsgCopy = async (url, clientName, key) => {
    try {
      const msg = generateAfterResultMessage(clientName, url, match.afterStatus);
      await navigator.clipboard.writeText(msg);
      setMsgCopiedKey(key);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setMsgCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.schedulingLinkCard}>
      <h3 className={styles.schedulingLinkTitle}><Heart size={16} /> 만남 성사 결과 링크</h3>
      <p className={styles.schedulingLinkHint}>
        {bothResponded ? '에프터 응답이 완료되었습니다. 아래 링크로 결과를 전달해주세요' : '양쪽 에프터 응답 완료 후 결과 링크를 전달해주세요'}
      </p>
      <div className={styles.schedulingLinkRows}>
        {[
          { side: 'A', client: match.clientA, url: urlA },
          { side: 'B', client: match.clientB, url: urlB },
        ].map(({ side, client, url }) => (
          <div key={side} className={styles.schedulingLinkRow}>
            <div className={styles.schedulingLinkLabel}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span>{client.clientName} — 결과 확인</span>
            </div>
            <div className={styles.schedulingLinkUrl}>
              <span className={styles.schedulingLinkValue}>{url}</span>
              <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(url, side)} disabled={!bothResponded}>
                {copiedKey === side ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === side ? '복사됨' : '링크 복사'}
              </button>
              <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(url, client.clientNickname || client.clientName, side)} disabled={!bothResponded}>
                {msgCopiedKey === side ? <Check size={13} /> : <FileText size={13} />}
                {msgCopiedKey === side ? '복사됨' : '안내 메시지 복사'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SchedulingLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [msgCopiedKey, setMsgCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/schedule`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/schedule`;

  const handleCopy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleMsgCopy = async (url, clientName, key) => {
    try {
      const msg = generateSchedulingMessage(clientName, url);
      await navigator.clipboard.writeText(msg);
      setMsgCopiedKey(key);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setMsgCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.schedulingLinkCard}>
      <h3 className={styles.schedulingLinkTitle}><Link2 size={16} /> 일정 조율 링크</h3>
      <p className={styles.schedulingLinkHint}>아래 링크를 각 회원에게 전달해주세요</p>
      <div className={styles.schedulingLinkRows}>
        {[
          { side: 'A', client: match.clientA, url: urlA },
          { side: 'B', client: match.clientB, url: urlB },
        ].map(({ side, client, url }) => (
          <div key={side} className={styles.schedulingLinkRow}>
            <div className={styles.schedulingLinkLabel}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span>{client.clientName} — 가용시간 등록</span>
              {client.availableTimesSubmitted && <span className={styles.submittedBadge}>등록 완료</span>}
              {client.availableTimesSubmitted === false && <span className={styles.pendingSubmitBadge}>미완료</span>}
            </div>
            <div className={styles.schedulingLinkUrl}>
              <span className={styles.schedulingLinkValue}>{url}</span>
              <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(url, side)}>
                {copiedKey === side ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === side ? '복사됨' : '링크 복사'}
              </button>
              <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(url, client.clientNickname || client.clientName, side)}>
                {msgCopiedKey === side ? <Check size={13} /> : <FileText size={13} />}
                {msgCopiedKey === side ? '복사됨' : '안내 메시지 복사'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantCard({ participant, partner, label, matchStatus, side }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isProposalPhase = matchStatus === 'proposal_sent' || matchStatus === 'proposal_accepted';
  const [tokenOpen, setTokenOpen] = useState(isProposalPhase);

  const proposalUrl = `${window.location.origin}/proposal/${participant.proposalToken}`;
  const inquiryUrl = `${window.location.origin}/inquiry?id=${participant.clientId}`;
  const isLinkActive = side === 'A' || matchStatus !== 'proposal_sent';

  const handleCopy = async () => {
    if (!isLinkActive) return;
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleMsgCopy = async () => {
    if (!isLinkActive) return;
    try {
      const msg = generateProposalMessage(participant.clientNickname || participant.clientName, proposalUrl, inquiryUrl);
      await navigator.clipboard.writeText(msg);
      setMsgCopied(true);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setMsgCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleReminderCopy = async () => {
    if (!isLinkActive) return;
    try {
      const clientName = participant.clientNickname || participant.clientName;
      const partnerName = partner.clientNickname || partner.clientName;
      const msg = generateReminderMessage(clientName, partnerName, proposalUrl);
      await navigator.clipboard.writeText(msg);
      setReminderCopied(true);
      toast.success('리마인드 메시지가 복사되었습니다.');
      setTimeout(() => setReminderCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handlePhoneCopy = async () => {
    const phone = participant.clientPhone;
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setPhoneCopied(true);
      toast.success('번호가 복사되었습니다.');
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const responseInfo = participant.response && participant.response !== 'pending'
    ? RESPONSE_MAP[participant.response] || { label: participant.response, className: '' }
    : null;

  let statusText = null;
  if (matchStatus === 'proposal_sent') {
    statusText = side === 'A' ? '프로필 확인 대기' : 'A 확인 후 전달 예정';
  } else if (matchStatus === 'proposal_accepted') {
    statusText = side === 'A' ? null : '프로필 확인 대기';
  }

  const hasProfile = participant.clientAge || participant.clientOccupation || participant.clientLocation;
  const photos = participant.clientPhotoUrls || [];

  if (participant.deleted) {
    return (
      <div className={styles.participantCard}>
        <div className={styles.participantHeader}>
          <span className={styles.participantNameDeleted}>삭제된 회원</span>
          <span className={styles.participantLabel}>{label}</span>
        </div>
        <div className={styles.participantBody}>
          <div className={styles.deletedNotice}>이 회원의 정보는 삭제되었습니다.</div>
          {participant.response && participant.response !== 'pending' && (
            <div className={styles.participantField}>
              <span className={styles.fieldLabel}>응답 상태</span>
              <span className={styles[RESPONSE_MAP[participant.response]?.className || '']}>
                {RESPONSE_MAP[participant.response]?.label || participant.response}
              </span>
            </div>
          )}
          {participant.respondedAt && (
            <div className={styles.participantField}>
              <span className={styles.fieldLabel}>응답 시각</span>
              <span className={styles.fieldValue}>{formatDate(participant.respondedAt)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.participantCard}>
      <div className={styles.participantHeader}>
        <span
          className={styles.participantName}
          onClick={() => navigate(`/dashboard/clients/${participant.clientId}`)}
          style={{ cursor: 'pointer' }}
        >
          {participant.clientName}
          {participant.clientNickname && <span className={styles.participantNickname}>{participant.clientNickname}</span>}
        </span>
        <span className={styles.participantLabel}>{label}</span>
        <span className={participant.clientGender === 'female' ? styles.participantGenderFemale : styles.participantGenderMale}>
          {participant.clientGender === 'female' ? '여' : '남'}
        </span>
      </div>

      <div className={styles.participantBody}>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>담당 매니저</span>
          <span className={styles.fieldValue}>{participant.managerName}</span>
        </div>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>응답 상태</span>
          {responseInfo ? (
            <span className={styles[responseInfo.className]}>{responseInfo.label}</span>
          ) : statusText ? (
            <span className={styles.responseWaiting}>{statusText}</span>
          ) : (
            <span className={styles.responseWaiting}>대기 중</span>
          )}
        </div>
        {participant.respondedAt && (
          <div className={styles.participantField}>
            <span className={styles.fieldLabel}>응답 시각</span>
            <span className={styles.fieldValue}>{formatDate(participant.respondedAt)}</span>
          </div>
        )}
      </div>

      {participant.clientPhone && (
        <div className={styles.phoneQuickRow}>
          <Phone size={13} />
          <span className={styles.phoneQuickValue}>{participant.clientPhone}</span>
          <button className={styles.phoneQuickCopyBtn} onClick={handlePhoneCopy}>
            {phoneCopied ? <Check size={12} /> : <Copy size={12} />}
            {phoneCopied ? '복사됨' : '복사'}
          </button>
        </div>
      )}

      {hasProfile && (
        <>
          <button className={styles.profileToggle} onClick={() => setProfileOpen(!profileOpen)}>
            <User size={14} />
            {profileOpen ? '프로필 접기' : '프로필 상세 보기'}
            {profileOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {profileOpen && (
            <div className={styles.profileDetail}>
              {photos.length > 0 && (
                <div className={styles.profilePhotos}>
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="" className={styles.profilePhoto} />
                  ))}
                </div>
              )}
              <div className={styles.profileFields}>
                {participant.clientAge && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>나이</span>
                    <span className={styles.profileFieldValue}>{participant.clientAge}세</span>
                  </div>
                )}
                {participant.clientHeight && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>키</span>
                    <span className={styles.profileFieldValue}>{participant.clientHeight}cm</span>
                  </div>
                )}
                {participant.clientOccupation && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>직업</span>
                    <span className={styles.profileFieldValue}>{participant.clientOccupation}</span>
                  </div>
                )}
                {participant.clientCompany && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>회사</span>
                    <span className={styles.profileFieldValue}>{participant.clientCompany}</span>
                  </div>
                )}
                {participant.clientEducation && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>학력</span>
                    <span className={styles.profileFieldValue}>{participant.clientEducation}</span>
                  </div>
                )}
                {participant.clientLocation && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>거주지</span>
                    <span className={styles.profileFieldValue}>{participant.clientLocation}</span>
                  </div>
                )}
                {participant.clientMbti && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>MBTI</span>
                    <span className={styles.profileFieldValue}>{participant.clientMbti}</span>
                  </div>
                )}
                {participant.clientHobbies && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>취미</span>
                    <span className={styles.profileFieldValue}>{participant.clientHobbies}</span>
                  </div>
                )}
                {participant.clientReligion && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>종교</span>
                    <span className={styles.profileFieldValue}>{participant.clientReligion}</span>
                  </div>
                )}
              </div>
              {participant.clientPhone && (
                <div className={styles.phoneSection}>
                  <span className={styles.profileFieldLabel}><Phone size={12} /> 연락처</span>
                  <div className={styles.phoneRow}>
                    <span className={styles.phoneValue}>{participant.clientPhone}</span>
                    <button className={styles.phoneCopyBtn} onClick={handlePhoneCopy}>
                      {phoneCopied ? <Check size={12} /> : <Copy size={12} />}
                      {phoneCopied ? '복사됨' : '번호 복사'}
                    </button>
                  </div>
                </div>
              )}
              {participant.clientIntroduction && (
                <div className={styles.profileTextSection}>
                  <span className={styles.profileTextLabel}>자기소개</span>
                  <p className={styles.profileTextContent}>{participant.clientIntroduction}</p>
                </div>
              )}
              {participant.clientIdealType && (
                <div className={styles.profileTextSection}>
                  <span className={styles.profileTextLabel}>이상형</span>
                  <p className={styles.profileTextContent}>{participant.clientIdealType}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {matchStatus !== 'draft' && (
        <div className={styles.tokenSection}>
          <button className={styles.tokenToggle} onClick={() => setTokenOpen(!tokenOpen)}>
            <Link2 size={13} />
            <span>프로포절 링크</span>
            {tokenOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {tokenOpen && (
            isLinkActive ? (
              <>
                <div className={styles.tokenRow}>
                  <span className={styles.tokenValue}>{proposalUrl}</span>
                  <button className={styles.copyBtn} onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className={styles.msgCopyBtnRow}>
                  <button className={styles.msgCopyBtn} onClick={handleMsgCopy}>
                    <FileText size={13} />
                    {msgCopied ? '복사됨' : '안내 메시지 복사'}
                  </button>
                  <button className={styles.msgCopyBtn} onClick={handleReminderCopy}>
                    <RefreshCw size={13} />
                    {reminderCopied ? '복사됨' : '리마인드 복사'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.tokenInactive}>A 수락 후 활성화</div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function GuideMessageCard({ title, hint, badge, participants, generateMsg }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = async (participant, key) => {
    try {
      const msg = generateMsg(participant);
      await navigator.clipboard.writeText(msg);
      setCopiedKey(key);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.guideMessageCard}>
      <h3 className={styles.guideMessageTitle}>
        <FileText size={16} /> {title}
        <span className={styles.guideBadge}>{badge}</span>
      </h3>
      <p className={styles.guideMessageHint}>{hint}</p>
      <div className={styles.guideMessageRows}>
        {participants.map((p, idx) => {
          const side = idx === 0 ? 'A' : 'B';
          const isCopied = copiedKey === side;
          return (
            <div key={side} className={styles.guideMessageRow}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span className={styles.guideMessageClientName}>{p.clientName}</span>
              <button className={styles.msgCopyBtn} onClick={() => handleCopy(p, side)}>
                {isCopied ? <Check size={13} /> : <FileText size={13} />}
                {isCopied ? '복사됨' : '안내 메시지 복사'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapLinks({ address }) {
  const encoded = encodeURIComponent(address);
  const naverUrl = `https://map.naver.com/v5/search/${encoded}`;
  const kakaoUrl = `https://map.kakao.com/?q=${encoded}`;
  return (
    <span className={styles.mapLinks}>
      <a href={naverUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>N</a>
      <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>K</a>
    </span>
  );
}
