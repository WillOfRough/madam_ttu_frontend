import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, MapPin, Clock, AlertTriangle, Link2, ChevronDown, ChevronUp, User, Briefcase, RefreshCw, Trash2, Heart, MessageSquare, FileText, Phone } from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import { loadTemplates } from './ManagerGuide';
import styles from './MatchDetail.module.css';

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

function generateOpenChatMessage(clientName) {
  const templates = loadTemplates();
  return templates.openChatGuide.replace(/OO님/g, `${clientName}님`);
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

const RESPONSE_MAP = {
  accepted: { label: '수락', className: 'responseAccepted' },
  rejected: { label: '거절', className: 'responseRejected' },
};

const STEPS = [
  { key: 'proposal_sent', label: 'A확인' },
  { key: 'proposal_accepted', label: 'B확인' },
  { key: 'awaiting_payment', label: '입금대기' },
  { key: 'scheduling', label: '일정조율' },
  { key: 'arranging', label: '매니저확정' },
  { key: 'scheduled', label: '약속확정' },
  { key: 'completed', label: '미팅완료' },
];

function getStepIndex(status) {
  if (status === 'proposal_sent') return 0;
  if (status === 'proposal_accepted') return 1;
  if (status === 'awaiting_payment') return 2;
  if (status === 'scheduling') return 3;
  if (status === 'arranging') return 4;
  if (status === 'scheduled') return 5;
  if (status === 'completed') return 6;
  return -1; // cancelled
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

function getRefundStatus(meetingDate) {
  if (!meetingDate) return null;
  const hours = (new Date(meetingDate) - new Date()) / (1000 * 60 * 60);
  if (hours >= 168) return { label: '전액 환불 가능', type: 'safe', hours: Math.floor(hours) };
  if (hours >= 72) return { label: '80% 환불 가능', type: 'safe', hours: Math.floor(hours) };
  if (hours >= 24) return { label: '환불 불가 · 일정 변경 가능', type: 'warn', hours: Math.floor(hours) };
  if (hours > 0) return { label: '환불 불가', type: 'danger', hours: Math.floor(hours) };
  return { label: '미팅 시간 경과', type: 'past', hours: 0 };
}

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
  const [cancelReason, setCancelReason] = useState('');

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

  if (loading)
    return (
      <div className={styles.page}>
        <SkeletonLine width="100px" height="16px" />
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SkeletonLine width="40%" height="28px" />
          <SkeletonLine width="100%" height="200px" />
        </div>
      </div>
    );

  if (!match) return null;

  // 삭제된 회원 안전 처리: clientA/clientB가 null이면 기본값
  const safeClient = { clientId: null, clientName: '삭제된 회원', clientNickname: null, clientPhone: null, clientGender: null, clientAge: 0, clientLocation: null, clientCompany: null, clientWorkLocation: null, clientOccupation: null, clientEducation: null, clientPhotoUrls: [], proposalToken: null, response: null, afterResponse: null, deleted: true, availableTimesSubmitted: false, managerName: null, respondedAt: null, feedbackAt: null, feedbackRating: null, feedbackComment: null };
  if (!match.clientA) match.clientA = { ...safeClient };
  if (!match.clientB) match.clientB = { ...safeClient };

  const stepIndex = getStepIndex(match.status);
  const isCancelled = match.status === 'cancelled';
  const refundStatus = getRefundStatus(match.meetingDate);

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
    const participantId = match.paymentSummary?.[`client${side}`]?.matchParticipantId || client.clientId;
    if (!participantId) {
      toast.error('참가자 정보를 찾을 수 없습니다.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await matchService.confirmParticipantPayment(matchId, participantId);
      toast.success(res?.message || '입금이 확인되었습니다.');
      reload();
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
      await matchService.confirmMatch(matchId, { timeId: selectedTimeId, location: venue, locationLink: locationLinkInput || null, endTime: endTimeInput || null });
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

  // Compute available times and groupings for arranging
  const allTimes = match.availableTimes || [];
  const timesA = allTimes.filter((t) => t.clientId === match.clientA.clientId);
  const timesB = allTimes.filter((t) => t.clientId === match.clientB.clientId);

  // Find common date+startTime combinations
  const commonKeys = new Set();
  timesA.forEach((a) => {
    timesB.forEach((b) => {
      if (a.date === b.date && formatTimeOnly(a.startTime) === formatTimeOnly(b.startTime)) {
        commonKeys.add(`${a.date}_${formatTimeOnly(a.startTime)}`);
      }
    });
  });

  // All unique dates sorted
  const allDates = [...new Set(allTimes.map((t) => t.date))].sort();

  // Selected time for modal display
  const selectedSlot = allTimes.find((t) => t.timeId === selectedTimeId);

  const openConfirmModal = () => {
    if (selectedSlot) {
      const startHHMM = formatTimeOnly(selectedSlot.startTime);
      setEndTimeInput(addHour(startHHMM));
    }
    setShowConfirm(true);
  };

  // confirmedSchedule (new format) with fallback
  const confirmedSchedule = match.confirmedSchedule || null;

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/dashboard/matches')}>
        <ArrowLeft size={18} /> 목록으로
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>
          {match.clientA.clientName} &harr; {match.clientB.clientName}
        </h1>
        <StatusBadge status={match.status} />
      </div>

      {/* Step Indicator */}
      {!isCancelled && (
        <div className={styles.stepIndicator}>
          {STEPS.map((step, idx) => (
            <div key={step.key} className={styles.stepItem}>
              {idx > 0 && (
                <div className={`${styles.stepLine} ${idx <= stepIndex ? styles.stepLineDone : ''}`} />
              )}
              <div className={styles.stepDotWrap}>
                <div
                  className={`${styles.stepDot} ${idx < stepIndex ? styles.stepDone : ''} ${idx === stepIndex ? styles.stepCurrent : ''}`}
                >
                  {idx < stepIndex ? <Check size={11} /> : idx + 1}
                </div>
                <span className={`${styles.stepLabel} ${idx === stepIndex ? styles.stepLabelCurrent : ''}`}>
                  {step.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Draft 안내 */}
      {match.status === 'draft' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <AlertTriangle size={16} /> 매칭 시작 전 (대기중)
          </h3>
          <p className={styles.waitingText}>
            아직 회원에게 제안이 발송되지 않았습니다.<br />
            내용을 확인한 후 아래 <strong>매칭 시작</strong> 버튼을 눌러주세요.
          </p>
        </div>
      )}

      {/* Participants */}
      <div className={styles.participants}>
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

      {/* 양식 3: 만남 성사(입금) 안내 메시지 복사 — 입금 확인 전에 먼저 표시 */}
      {match.status === 'awaiting_payment' && (
        <GuideMessageCard
          title="만남 성사 안내 (입금 요청)"
          hint="양쪽 모두 수락했습니다. 아래 입금 안내 메시지를 각 회원에게 보내주세요"
          badge="양식 3"
          participants={[match.clientA, match.clientB]}
          generateMsg={(p) => generateAfterSuccessMessage(p.clientNickname || p.clientName)}
        />
      )}

      {/* 입금확인 게이트 — 참가자별 개별 확인 */}
      {match.status === 'awaiting_payment' && (
        <div className={styles.paymentCard}>
          <h3 className={styles.cardTitle}>
            <Check size={16} /> 입금 확인
          </h3>
          <p className={styles.paymentHint}>양쪽 회원에게 입금 안내 메시지를 보낸 후, 입금이 확인된 회원부터 개별 확인해 주세요.</p>
          <div className={styles.paymentRows}>
            {['A', 'B'].map((side) => {
              const client = side === 'A' ? match.clientA : match.clientB;
              const payment = match.paymentSummary?.[`client${side}`];
              const isPaid = payment?.status === 'paid';
              return (
                <div key={side} className={styles.paymentRow}>
                  <div className={styles.paymentRowLabel}>
                    <span className={styles.paymentRowSide}>{side}</span>
                    <span className={styles.paymentRowName}>{client.clientNickname || client.clientName}</span>
                    <span className={`${styles.paymentRowStatus} ${isPaid ? styles.paymentRowStatusPaid : styles.paymentRowStatusPending}`}>
                      {isPaid ? '입금 완료' : '입금 대기'}
                    </span>
                  </div>
                  <button
                    className={styles.paymentBtn}
                    onClick={() => handleParticipantPaymentConfirm(side)}
                    disabled={actionLoading || isPaid}
                  >
                    {isPaid ? <><Check size={14} /> 확인됨</> : actionLoading ? '처리 중...' : `${side} 입금 확인`}
                  </button>
                </div>
              );
            })}
          </div>
          <button
            className={styles.paymentFallbackBtn}
            onClick={handlePaymentConfirm}
            disabled={actionLoading}
          >
            양쪽 한 번에 확인 (fallback)
          </button>
        </div>
      )}

      {/* Scheduling Link Card */}
      {match.status === 'scheduling' && (
        <SchedulingLinkCard match={match} />
      )}

      {/* Arranging: Manager confirms time + venue */}
      {match.status === 'arranging' && allTimes.length > 0 && (
        <div className={styles.arrangingContainer}>
          {/* Section 1: Common Available Times */}
          <div className={styles.commonTimesCard}>
            <h3 className={styles.cardTitle}>
              <Calendar size={16} /> 공통 가용시간
            </h3>
            {commonKeys.size > 0 ? (
              <>
                <p className={styles.commonTimesHint}>양쪽 회원이 모두 가능한 시간입니다</p>
                <div className={styles.slotTags}>
                  {[...commonKeys].sort().map((key) => {
                    const [date, time] = key.split('_');
                    const matchingSlots = allTimes.filter((t) => t.date === date && formatTimeOnly(t.startTime) === time);
                    const firstSlot = matchingSlots[0];
                    const isSelected = matchingSlots.some((s) => s.timeId === selectedTimeId);
                    return (
                      <label
                        key={key}
                        className={`${styles.slotTag} ${styles.slotTagCommon} ${isSelected ? styles.slotTagPicked : ''}`}
                        style={{ cursor: 'pointer' }}
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
                <div className={styles.confirmSection}>
                  <button className={styles.actionBtn} onClick={openConfirmModal} disabled={!selectedTimeId}>
                    약속 확정하기
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.noCommonInline}>
                <AlertTriangle size={16} />
                <p>겹치는 가용시간이 없습니다. 아래 각 회원의 시간을 확인해주세요.</p>
                <button
                  className={styles.rescheduleBtn}
                  onClick={() => setShowReschedule(true)}
                  disabled={actionLoading}
                >
                  <RefreshCw size={14} />
                  일정 재조율 요청
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Client A Times */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={styles.schedulingRoleBadge}>A</span> {match.clientA.clientName} 가용시간
            </h3>
            {timesA.length > 0 ? (
              <div className={styles.slotTags}>
                {timesA.map((slot) => {
                  const isCommon = commonKeys.has(`${slot.date}_${formatTimeOnly(slot.startTime)}`);
                  return (
                    <span
                      key={slot.timeId}
                      className={`${styles.slotTag} ${isCommon ? styles.slotTagCommon : ''}`}
                    >
                      {isCommon && <span className={styles.commonDot} />}
                      {formatDateHeader(slot.date)} {formatTimeOnly(slot.startTime)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className={styles.waitingText}>아직 등록된 시간이 없습니다.</p>
            )}
          </div>

          {/* Section 3: Client B Times */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={styles.schedulingRoleBadge}>B</span> {match.clientB.clientName} 가용시간
            </h3>
            {timesB.length > 0 ? (
              <div className={styles.slotTags}>
                {timesB.map((slot) => {
                  const isCommon = commonKeys.has(`${slot.date}_${formatTimeOnly(slot.startTime)}`);
                  return (
                    <span
                      key={slot.timeId}
                      className={`${styles.slotTag} ${isCommon ? styles.slotTagCommon : ''}`}
                    >
                      {isCommon && <span className={styles.commonDot} />}
                      {formatDateHeader(slot.date)} {formatTimeOnly(slot.startTime)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className={styles.waitingText}>아직 등록된 시간이 없습니다.</p>
            )}
          </div>

          {/* Location Comparison */}
          {(match.clientA.clientLocation || match.clientB.clientLocation) && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <MapPin size={16} /> 위치 정보
              </h3>
              <div className={styles.locationCompare}>
                <div className={styles.locationCol}>
                  <div className={styles.locationColHeader}>
                    <span className={styles.schedulingRoleBadge}>A</span>
                    <span>{match.clientA.clientName}</span>
                  </div>
                  {match.clientA.clientLocation && (
                    <div className={styles.locationItem}>
                      <span className={styles.locationLabel}>거주지</span>
                      <span>{match.clientA.clientLocation}</span>
                      <MapLinks address={match.clientA.clientLocation} />
                    </div>
                  )}
                  {match.clientA.clientCompany && (
                    <div className={styles.locationItem}>
                      <span className={styles.locationLabel}>회사</span>
                      <span>{match.clientA.clientCompany}</span>
                    </div>
                  )}
                  {match.clientA.clientWorkLocation && (
                    <div className={styles.locationItem}>
                      <span className={styles.locationLabel}>회사 위치</span>
                      <span>{match.clientA.clientWorkLocation}</span>
                    </div>
                  )}
                </div>
                <div className={styles.locationDivider} />
                <div className={styles.locationCol}>
                  <div className={styles.locationColHeader}>
                    <span className={styles.schedulingRoleBadge}>B</span>
                    <span>{match.clientB.clientName}</span>
                  </div>
                  {match.clientB.clientLocation && (
                    <div className={styles.locationItem}>
                      <span className={styles.locationLabel}>거주지</span>
                      <span>{match.clientB.clientLocation}</span>
                      <MapLinks address={match.clientB.clientLocation} />
                    </div>
                  )}
                  {match.clientB.clientCompany && (
                    <div className={styles.locationItem}>
                      <span className={styles.locationLabel}>회사</span>
                      <span>{match.clientB.clientCompany}</span>
                    </div>
                  )}
                  {match.clientB.clientWorkLocation && (
                    <div className={styles.locationItem}>
                      <span className={styles.locationLabel}>회사 위치</span>
                      <span>{match.clientB.clientWorkLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Section (scheduled / completed) */}
      {(match.status === 'scheduled' || match.status === 'completed') && confirmedSchedule && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Calendar size={16} /> 일정 정보
          </h3>
          <div className={styles.scheduleInfo}>
            {confirmedSchedule.date && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>확정된 시간</span>
                <span className={styles.fieldValue}>
                  <Clock size={14} /> {formatSlotDisplay(confirmedSchedule)}
                </span>
              </div>
            )}
            {confirmedSchedule.location && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>장소</span>
                <span className={styles.fieldValue}>
                  <MapPin size={14} /> {confirmedSchedule.location}
                </span>
              </div>
            )}
            {confirmedSchedule.locationLink && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>장소 링크</span>
                <span className={styles.fieldValue}>
                  <Link2 size={14} />
                  <a href={confirmedSchedule.locationLink} target="_blank" rel="noopener noreferrer" className={styles.locationLinkAnchor}>
                    {confirmedSchedule.locationLink}
                  </a>
                </span>
              </div>
            )}
            {confirmedSchedule.confirmedAt && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>확정일</span>
                <span className={styles.fieldValue}>{formatDate(confirmedSchedule.confirmedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 양식 4: 만남 장소 확정 안내 메시지 복사 */}
      {match.status === 'scheduled' && confirmedSchedule && (
        <GuideMessageCard
          title="만남 장소 확정 안내"
          hint="확정된 일정과 장소가 반영된 안내 메시지를 복사하세요"
          badge="양식 4"
          participants={[match.clientA, match.clientB]}
          generateMsg={(p) => generateMeetingMessage(p.clientNickname || p.clientName, confirmedSchedule)}
        />
      )}

      {/* Scheduling: waiting for available times */}
      {match.status === 'scheduling' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Calendar size={16} /> 일정 조율
          </h3>
          <p className={styles.waitingText}>양쪽 회원의 가용시간 등록을 기다리고 있습니다.</p>
        </div>
      )}

      {/* Refund Status (scheduled) */}
      {match.status === 'scheduled' && refundStatus && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <AlertTriangle size={16} /> 취소/환불 규정
          </h3>
          <div className={styles.refundInfo}>
            <span className={`${styles.refundBadge} ${styles[`refund_${refundStatus.type}`]}`}>
              {refundStatus.label}
            </span>
            <span className={styles.refundHours}>
              약속까지 {refundStatus.hours}시간 남음
            </span>
          </div>
          <ul className={styles.policyList}>
            <li>만남 7일 전까지: 전액 환불 가능</li>
            <li>만남 3일 전까지: 80% 환불 가능</li>
            <li>만남 24시간 전까지: 환불 불가</li>
            <li>약속 24시간 전까지: 일정 1회 변경 가능</li>
          </ul>
        </div>
      )}

      {/* After Link Card (completed only) */}
      {match.status === 'completed' && (
        <AfterLinkCard match={match} />
      )}

      {/* After Status Card (completed only) */}
      {match.status === 'completed' && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Heart size={16} /> 에프터 현황
          </h3>
          {match.afterStatus ? (
            <>
              <div className={styles.afterStatusRow}>
                <span className={styles.fieldLabel}>에프터 상태</span>
                <StatusBadge status={`after_${match.afterStatus}`} />
              </div>
              <div className={styles.afterResponses}>
                <div className={styles.afterTableHeader}>
                  <span className={styles.afterTableCol} />
                  <span className={styles.afterTableCol}>회원</span>
                  <span className={styles.afterTableCol}>매칭 응답</span>
                  <span className={styles.afterTableCol}>에프터 응답</span>
                </div>
                <div className={styles.afterResponseItem}>
                  <span className={styles.schedulingRoleBadge}>A</span>
                  <span className={styles.afterName}>{match.clientA.clientName}</span>
                  <span className={styles[RESPONSE_MAP[match.clientA.response]?.className || 'responseWaiting']}>
                    {RESPONSE_MAP[match.clientA.response]?.label || '대기'}
                  </span>
                  <span className={styles[`afterResp_${match.clientA.afterResponse || 'pending'}`]}>
                    {match.clientA.afterResponse === 'accepted' ? '만나볼래요' : match.clientA.afterResponse === 'rejected' ? '괜찮아요' : '대기 중'}
                  </span>
                </div>
                <div className={styles.afterResponseItem}>
                  <span className={styles.schedulingRoleBadge}>B</span>
                  <span className={styles.afterName}>{match.clientB.clientName}</span>
                  <span className={styles[RESPONSE_MAP[match.clientB.response]?.className || 'responseWaiting']}>
                    {RESPONSE_MAP[match.clientB.response]?.label || '대기'}
                  </span>
                  <span className={styles[`afterResp_${match.clientB.afterResponse || 'pending'}`]}>
                    {match.clientB.afterResponse === 'accepted' ? '만나볼래요' : match.clientB.afterResponse === 'rejected' ? '괜찮아요' : '대기 중'}
                  </span>
                </div>
              </div>
              {/* Feedback Section - afterStatus rejected일 때 */}
              {match.afterStatus === 'rejected' && (match.clientA.feedbackAt || match.clientB.feedbackAt) && (
                <div className={styles.feedbackSection}>
                  <h4 className={styles.feedbackSectionTitle}>
                    <MessageSquare size={14} /> 만남 피드백
                  </h4>
                  {[
                    { side: 'A', participant: match.clientA },
                    { side: 'B', participant: match.clientB },
                  ].filter((p) => p.participant.feedbackAt).map(({ side, participant }) => (
                    <div key={side} className={styles.feedbackItem}>
                      <div className={styles.feedbackItemHeader}>
                        <span className={styles.schedulingRoleBadge}>{side}</span>
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

      {/* After Result Link Card (양쪽 에프터 응답 완료 시에만 표시) */}
      {match.status === 'completed' && (match.afterStatus === 'accepted' || match.afterStatus === 'rejected') && (
        <AfterResultLinkCard match={match} />
      )}

      {match.note && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>매니저 메모</h3>
          <p className={styles.text}>{match.note}</p>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>매칭 정보</h3>
        <p className={styles.meta}>생성일: {formatDate(match.createdAt)}</p>
        {match.meetingDate && <p className={styles.meta}>미팅일: {formatDate(match.meetingDate)}</p>}
      </div>

      {/* Manager Action Buttons */}
      <div className={styles.actionBar}>
        <button className={styles.dangerBtn} onClick={() => setShowDelete(true)} disabled={actionLoading}>
          <Trash2 size={14} /> 매칭 삭제
        </button>
        {match.status === 'scheduled' && (
          <>
            <button className={styles.actionBtn} onClick={handleCompleteClick} disabled={actionLoading}>
              미팅 완료 처리
            </button>
            <button className={styles.actionBtn} onClick={() => setShowReschedule(true)} disabled={actionLoading}>
              <RefreshCw size={14} /> 일정 재조율
            </button>
            <button className={styles.dangerBtn} onClick={() => setShowCancel(true)} disabled={actionLoading}>
              약속 취소
            </button>
          </>
        )}
        {match.status === 'draft' && (
          <button className={styles.actionBtn} onClick={handleStartMatch} disabled={actionLoading}>
            {actionLoading ? '시작 중...' : '▶ 매칭 시작'}
          </button>
        )}
        {(match.status === 'awaiting_payment' || match.status === 'scheduling' || match.status === 'arranging') && (
          <button className={styles.dangerBtn} onClick={() => setShowCancel(true)} disabled={actionLoading}>
            매칭 취소
          </button>
        )}
      </div>

      {/* Cancelled info */}
      {isCancelled && (match.cancelReason || match.cancelledByName) && (
        <div className={styles.cancelledBanner}>
          <p className={styles.cancelledTitle}>매칭 종료</p>
          {match.cancelledByName && (
            <p className={styles.cancelledReason}>취소자: {match.cancelledByName}</p>
          )}
          {match.cancelledAt && (
            <p className={styles.cancelledReason}>취소일: {formatDate(match.cancelledAt)}</p>
          )}
          {match.cancelReason && (
            <p className={styles.cancelledReason}>{match.cancelReason}</p>
          )}
        </div>
      )}

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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>매칭 취소</h3>
            {refundStatus && (
              <p className={styles.modalDesc}>현재 {refundStatus.label} 상태입니다.</p>
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
            <div className={styles.modalActions}>
              <button className={styles.cancelModalBtn} onClick={() => { setShowCancel(false); setCancelReason(''); }}>
                돌아가기
              </button>
              <button
                className={styles.dangerBtn}
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason.trim()}
              >
                취소 진행
              </button>
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

      {/* Confirm Schedule Modal */}
      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>약속 확정</h3>
            {selectedSlot && (
              <p className={styles.modalDesc}>
                선택된 시간: {formatSlotDisplay(selectedSlot)}
              </p>
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
              <button className={styles.cancelModalBtn} onClick={() => setShowConfirm(false)}>취소</button>
              <button
                className={styles.confirmModalBtn}
                onClick={handleConfirmSchedule}
                disabled={actionLoading || !selectedTimeId}
              >
                {actionLoading ? '확정 중...' : '약속 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <h3 className={styles.schedulingLinkTitle}>
        <Heart size={16} /> 에프터 링크
      </h3>
      <p className={styles.schedulingLinkHint}>미팅 후 아래 링크를 각 회원에게 전달해주세요</p>
      <div className={styles.schedulingLinkRows}>
        <div className={styles.schedulingLinkRow}>
          <div className={styles.schedulingLinkLabel}>
            <span className={styles.schedulingRoleBadge}>A</span>
            <span>{match.clientA.clientName} — 에프터 응답</span>
            {match.clientA.afterResponse === 'accepted' && <span className={styles.submittedBadge}>만나볼래요</span>}
            {match.clientA.afterResponse === 'rejected' && <span className={styles.rejectedSubmitBadge}>괜찮아요</span>}
            {(!match.clientA.afterResponse || match.clientA.afterResponse === 'pending') && <span className={styles.pendingSubmitBadge}>미응답</span>}
          </div>
          <div className={styles.schedulingLinkUrl}>
            <span className={styles.schedulingLinkValue}>{urlA}</span>
            <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(urlA, 'A')}>
              {copiedKey === 'A' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'A' ? '복사됨' : '링크 복사'}
            </button>
            <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(urlA, 'A')}>
              {msgCopiedKey === 'A' ? <Check size={13} /> : <FileText size={13} />}
              {msgCopiedKey === 'A' ? '복사됨' : '안내 메시지 복사'}
            </button>
          </div>
        </div>
        <div className={styles.schedulingLinkRow}>
          <div className={styles.schedulingLinkLabel}>
            <span className={styles.schedulingRoleBadge}>B</span>
            <span>{match.clientB.clientName} — 에프터 응답</span>
            {match.clientB.afterResponse === 'accepted' && <span className={styles.submittedBadge}>만나볼래요</span>}
            {match.clientB.afterResponse === 'rejected' && <span className={styles.rejectedSubmitBadge}>괜찮아요</span>}
            {(!match.clientB.afterResponse || match.clientB.afterResponse === 'pending') && <span className={styles.pendingSubmitBadge}>미응답</span>}
          </div>
          <div className={styles.schedulingLinkUrl}>
            <span className={styles.schedulingLinkValue}>{urlB}</span>
            <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(urlB, 'B')}>
              {copiedKey === 'B' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'B' ? '복사됨' : '링크 복사'}
            </button>
            <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(urlB, 'B')}>
              {msgCopiedKey === 'B' ? <Check size={13} /> : <FileText size={13} />}
              {msgCopiedKey === 'B' ? '복사됨' : '안내 메시지 복사'}
            </button>
          </div>
        </div>
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
      <h3 className={styles.schedulingLinkTitle}>
        <Heart size={16} /> 만남 성사 결과 링크
      </h3>
      <p className={styles.schedulingLinkHint}>
        {bothResponded
          ? '에프터 응답이 완료되었습니다. 아래 링크로 결과를 전달해주세요'
          : '양쪽 에프터 응답 완료 후 결과 링크를 전달해주세요'}
      </p>
      <div className={styles.schedulingLinkRows}>
        <div className={styles.schedulingLinkRow}>
          <div className={styles.schedulingLinkLabel}>
            <span className={styles.schedulingRoleBadge}>A</span>
            <span>{match.clientA.clientName} — 결과 확인</span>
          </div>
          <div className={styles.schedulingLinkUrl}>
            <span className={styles.schedulingLinkValue}>{urlA}</span>
            <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(urlA, 'A')} disabled={!bothResponded}>
              {copiedKey === 'A' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'A' ? '복사됨' : '링크 복사'}
            </button>
            <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(urlA, match.clientA.clientNickname || match.clientA.clientName, 'A')} disabled={!bothResponded}>
              {msgCopiedKey === 'A' ? <Check size={13} /> : <FileText size={13} />}
              {msgCopiedKey === 'A' ? '복사됨' : '안내 메시지 복사'}
            </button>
          </div>
        </div>
        <div className={styles.schedulingLinkRow}>
          <div className={styles.schedulingLinkLabel}>
            <span className={styles.schedulingRoleBadge}>B</span>
            <span>{match.clientB.clientName} — 결과 확인</span>
          </div>
          <div className={styles.schedulingLinkUrl}>
            <span className={styles.schedulingLinkValue}>{urlB}</span>
            <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(urlB, 'B')} disabled={!bothResponded}>
              {copiedKey === 'B' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'B' ? '복사됨' : '링크 복사'}
            </button>
            <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(urlB, match.clientB.clientNickname || match.clientB.clientName, 'B')} disabled={!bothResponded}>
              {msgCopiedKey === 'B' ? <Check size={13} /> : <FileText size={13} />}
              {msgCopiedKey === 'B' ? '복사됨' : '안내 메시지 복사'}
            </button>
          </div>
        </div>
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
      <h3 className={styles.schedulingLinkTitle}>
        <Link2 size={16} /> 일정 조율 링크
      </h3>
      <p className={styles.schedulingLinkHint}>아래 링크를 각 회원에게 전달해주세요</p>
      <div className={styles.schedulingLinkRows}>
        <div className={styles.schedulingLinkRow}>
          <div className={styles.schedulingLinkLabel}>
            <span className={styles.schedulingRoleBadge}>A</span>
            <span>{match.clientA.clientName} — 가용시간 등록</span>
            {match.clientA.availableTimesSubmitted && <span className={styles.submittedBadge}>등록 완료</span>}
            {match.clientA.availableTimesSubmitted === false && <span className={styles.pendingSubmitBadge}>미완료</span>}
          </div>
          <div className={styles.schedulingLinkUrl}>
            <span className={styles.schedulingLinkValue}>{urlA}</span>
            <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(urlA, 'A')}>
              {copiedKey === 'A' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'A' ? '복사됨' : '링크 복사'}
            </button>
            <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(urlA, match.clientA.clientNickname || match.clientA.clientName, 'A')}>
              {msgCopiedKey === 'A' ? <Check size={13} /> : <FileText size={13} />}
              {msgCopiedKey === 'A' ? '복사됨' : '안내 메시지 복사'}
            </button>
          </div>
        </div>
        <div className={styles.schedulingLinkRow}>
          <div className={styles.schedulingLinkLabel}>
            <span className={styles.schedulingRoleBadge}>B</span>
            <span>{match.clientB.clientName} — 가용시간 등록</span>
            {match.clientB.availableTimesSubmitted && <span className={styles.submittedBadge}>등록 완료</span>}
            {match.clientB.availableTimesSubmitted === false && <span className={styles.pendingSubmitBadge}>미완료</span>}
          </div>
          <div className={styles.schedulingLinkUrl}>
            <span className={styles.schedulingLinkValue}>{urlB}</span>
            <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(urlB, 'B')}>
              {copiedKey === 'B' ? <Check size={13} /> : <Copy size={13} />}
              {copiedKey === 'B' ? '복사됨' : '링크 복사'}
            </button>
            <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(urlB, match.clientB.clientNickname || match.clientB.clientName, 'B')}>
              {msgCopiedKey === 'B' ? <Check size={13} /> : <FileText size={13} />}
              {msgCopiedKey === 'B' ? '복사됨' : '안내 메시지 복사'}
            </button>
          </div>
        </div>
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

  // Sequential status text
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
          <div className={styles.deletedNotice}>
            이 회원의 정보는 삭제되었습니다.
          </div>
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

      {/* Phone Quick Copy */}
      {participant.clientPhone && (
        <div className={styles.phoneQuickRow}>
          <Phone size={13} />
          <span className={styles.phoneQuickValue}>{participant.clientPhone}</span>
          <button
            className={styles.phoneQuickCopyBtn}
            onClick={handlePhoneCopy}
          >
            {phoneCopied ? <Check size={12} /> : <Copy size={12} />}
            {phoneCopied ? '복사됨' : '복사'}
          </button>
        </div>
      )}

      {/* Profile Toggle */}
      {hasProfile && (
        <>
          <button className={styles.profileToggle} onClick={() => setProfileOpen(!profileOpen)}>
            <User size={14} />
            {profileOpen ? '프로필 접기' : '프로필 상세 보기'}
            {profileOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {profileOpen && (
            <div className={styles.profileDetail}>
              {/* Photos */}
              {photos.length > 0 && (
                <div className={styles.profilePhotos}>
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="" className={styles.profilePhoto} />
                  ))}
                </div>
              )}

              {/* Fields Grid */}
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

              {/* Phone */}
              {participant.clientPhone && (
                <div className={styles.phoneSection}>
                  <span className={styles.profileFieldLabel}>
                    <Phone size={12} /> 연락처
                  </span>
                  <div className={styles.phoneRow}>
                    <span className={styles.phoneValue}>{participant.clientPhone}</span>
                    <button
                      className={styles.phoneCopyBtn}
                      onClick={handlePhoneCopy}
                    >
                      {phoneCopied ? <Check size={12} /> : <Copy size={12} />}
                      {phoneCopied ? '복사됨' : '번호 복사'}
                    </button>
                  </div>
                </div>
              )}

              {/* Introduction */}
              {participant.clientIntroduction && (
                <div className={styles.profileTextSection}>
                  <span className={styles.profileTextLabel}>자기소개</span>
                  <p className={styles.profileTextContent}>{participant.clientIntroduction}</p>
                </div>
              )}

              {/* Ideal Type */}
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
        <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: 'var(--bg-warm)', color: 'var(--charcoal-pale)' }}>
          {badge}
        </span>
      </h3>
      <p className={styles.guideMessageHint}>{hint}</p>
      <div className={styles.guideMessageRows}>
        {participants.map((p, idx) => {
          const side = idx === 0 ? 'A' : 'B';
          const isCopied = copiedKey === side;
          return (
            <div key={side} className={styles.guideMessageRow}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--charcoal)' }}>
                {p.clientName}
              </span>
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

