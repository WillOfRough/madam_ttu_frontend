import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, MapPin, Clock, AlertTriangle, Link2, ChevronDown, ChevronUp, User, Briefcase, RefreshCw, Trash2, Heart, MessageSquare } from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import styles from './MatchDetail.module.css';

const RESPONSE_MAP = {
  accepted: { label: '수락', className: 'responseAccepted' },
  rejected: { label: '거절', className: 'responseRejected' },
};

const STEPS = [
  { key: 'proposal_sent', label: 'A확인' },
  { key: 'proposal_accepted', label: 'B확인' },
  { key: 'scheduling', label: '일정조율' },
  { key: 'arranging', label: '매니저확정' },
  { key: 'scheduled', label: '약속확정' },
  { key: 'completed', label: '미팅완료' },
];

function getStepIndex(status) {
  if (status === 'proposal_sent') return 0;
  if (status === 'proposal_accepted') return 1;
  if (status === 'scheduling') return 2;
  if (status === 'arranging') return 3;
  if (status === 'scheduled') return 4;
  if (status === 'completed') return 5;
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
  const [showAfterOverride, setShowAfterOverride] = useState(false);
  const [afterOverrideValue, setAfterOverrideValue] = useState('');
  const [showRescheduleLinks, setShowRescheduleLinks] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);

  const reload = () => {
    matchService.getMatchDetail(matchId).then(setMatch).catch(() => {});
  };

  useEffect(() => {
    if (matchId) {
      setLoading(true);
      matchService
        .getMatchDetail(matchId)
        .then(setMatch)
        .catch(() => navigate('/dashboard/matches'))
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

  const stepIndex = getStepIndex(match.status);
  const isCancelled = match.status === 'cancelled';
  const refundStatus = getRefundStatus(match.meetingDate);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await matchService.cancelMatch(matchId, { reason: '매니저가 취소' });
      toast.success('매칭이 취소되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '취소에 실패했습니다.');
    }
    setActionLoading(false);
    setShowCancel(false);
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

  const handleAfterOverride = async () => {
    if (!afterOverrideValue) return;
    setActionLoading(true);
    try {
      const participants = [
        { clientId: match.clientA.clientId, afterResponse: afterOverrideValue },
        { clientId: match.clientB.clientId, afterResponse: afterOverrideValue },
      ];
      await matchService.overrideAfter(matchId, participants);
      toast.success('에프터 상태가 변경되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '에프터 상태 변경에 실패했습니다.');
    }
    setActionLoading(false);
    setShowAfterOverride(false);
    setAfterOverrideValue('');
  };

  const handleCompleteMatch = async () => {
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
              <div
                className={`${styles.stepDot} ${idx < stepIndex ? styles.stepDone : ''} ${idx === stepIndex ? styles.stepCurrent : ''}`}
              >
                {idx < stepIndex ? <Check size={12} /> : idx + 1}
              </div>
              <span className={`${styles.stepLabel} ${idx === stepIndex ? styles.stepLabelCurrent : ''}`}>
                {step.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className={`${styles.stepLine} ${idx < stepIndex ? styles.stepLineDone : ''}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Participants */}
      <div className={styles.participants}>
        <ParticipantCard
          participant={match.clientA}
          label="회원 A"
          matchStatus={match.status}
          side="A"
        />
        <ParticipantCard
          participant={match.clientB}
          label="회원 B"
          matchStatus={match.status}
          side="B"
        />
      </div>

      {/* Scheduling Link Card */}
      {match.status === 'scheduling' && (
        <SchedulingLinkCard match={match} />
      )}

      {/* Arranging: Manager confirms time + venue */}
      {match.status === 'arranging' && allTimes.length > 0 && (
        <div className={styles.arrangingContainer}>
          {/* No Common Times Warning */}
          {commonKeys.size === 0 && (
            <div className={styles.noCommonBanner}>
              <div className={styles.noCommonContent}>
                <AlertTriangle size={18} />
                <div>
                  <p className={styles.noCommonTitle}>겹치는 가용시간이 없습니다</p>
                  <p className={styles.noCommonDesc}>양쪽 회원에게 가용시간을 다시 등록하도록 요청할 수 있습니다.</p>
                </div>
              </div>
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

          {/* Section A: Common Available Times */}
          {commonKeys.size > 0 && (
            <div className={styles.commonTimesCard}>
              <h3 className={styles.cardTitle}>
                <Calendar size={16} /> 공통 가용시간
              </h3>
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
                        style={{ display: 'none' }}
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
            </div>
          )}

          {/* Section B: Location Comparison */}
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

          {/* Section C: Date-by-Date Comparison (공통 시간 없을 때만) */}
          {commonKeys.size === 0 && <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <Clock size={16} /> 날짜별 가용시간
            </h3>
            <div className={styles.dateCompareHeader}>
              <span className={styles.dateCompareLabel} />
              <span className={styles.dateCompareSide}>{match.clientA.clientName} (A)</span>
              <span className={styles.dateCompareSide}>{match.clientB.clientName} (B)</span>
            </div>
            {allDates.map((date) => {
              const aTimes = timesA.filter((t) => t.date === date);
              const bTimes = timesB.filter((t) => t.date === date);
              return (
                <div key={date} className={styles.dateRow}>
                  <div className={styles.dateLabel}>{formatDateHeader(date)}</div>
                  <div className={styles.dateSlotsCompare}>
                    <div className={styles.dateSlotsCol}>
                      {aTimes.length > 0
                        ? aTimes.map((slot) => {
                            const isCommon = commonKeys.has(`${slot.date}_${formatTimeOnly(slot.startTime)}`);
                            return (
                              <label
                                key={slot.timeId}
                                className={`${styles.slotTag} ${isCommon ? styles.slotTagCommon : ''} ${selectedTimeId === slot.timeId ? styles.slotTagPicked : ''}`}
                                style={{ cursor: 'pointer' }}
                              >
                                <input
                                  type="radio"
                                  name="confirmTime"
                                  value={slot.timeId}
                                  checked={selectedTimeId === slot.timeId}
                                  onChange={() => setSelectedTimeId(slot.timeId)}
                                  style={{ display: 'none' }}
                                />
                                {isCommon && <span className={styles.commonDot} />}
                                {formatTimeOnly(slot.startTime)}
                              </label>
                            );
                          })
                        : <span className={styles.noSlot}>-</span>}
                    </div>
                    <div className={styles.dateSlotsCol}>
                      {bTimes.length > 0
                        ? bTimes.map((slot) => {
                            const isCommon = commonKeys.has(`${slot.date}_${formatTimeOnly(slot.startTime)}`);
                            return (
                              <label
                                key={slot.timeId}
                                className={`${styles.slotTag} ${isCommon ? styles.slotTagCommon : ''} ${selectedTimeId === slot.timeId ? styles.slotTagPicked : ''}`}
                                style={{ cursor: 'pointer' }}
                              >
                                <input
                                  type="radio"
                                  name="confirmTime"
                                  value={slot.timeId}
                                  checked={selectedTimeId === slot.timeId}
                                  onChange={() => setSelectedTimeId(slot.timeId)}
                                  style={{ display: 'none' }}
                                />
                                {isCommon && <span className={styles.commonDot} />}
                                {formatTimeOnly(slot.startTime)}
                              </label>
                            );
                          })
                        : <span className={styles.noSlot}>-</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className={styles.confirmSection}>
              <button className={styles.actionBtn} onClick={openConfirmModal} disabled={!selectedTimeId}>
                약속 확정하기
              </button>
            </div>
          </div>}
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

      {/* After Result Link Card (completed only) */}
      {match.status === 'completed' && (
        <AfterResultLinkCard match={match} />
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
              <button
                className={styles.actionBtn}
                onClick={() => { setAfterOverrideValue(match.afterStatus || 'pending'); setShowAfterOverride(true); }}
                style={{ marginTop: 12 }}
              >
                에프터 상태 변경
              </button>

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
        {match.status === 'proposal_sent' && (
          <button className={styles.dangerBtn} onClick={() => setShowDelete(true)} disabled={actionLoading}>
            <Trash2 size={14} /> 매칭 삭제
          </button>
        )}
        {match.status === 'scheduled' && (
          <>
            <button className={styles.actionBtn} onClick={handleCompleteMatch} disabled={actionLoading}>
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
        {(match.status === 'scheduling' || match.status === 'arranging') && (
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
        <ConfirmModal
          title="매칭 취소"
          message={
            refundStatus
              ? `현재 ${refundStatus.label} 상태입니다. 정말 취소하시겠습니까?`
              : '정말 이 매칭을 취소하시겠습니까?'
          }
          confirmLabel="취소 진행"
          cancelLabel="돌아가기"
          danger
          onConfirm={handleCancel}
          onCancel={() => setShowCancel(false)}
        />
      )}

      {/* After Override Modal */}
      {showAfterOverride && (
        <div className={styles.overlay} onClick={() => setShowAfterOverride(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>에프터 상태 변경</h3>
            <p className={styles.modalDesc}>이 매칭의 에프터 상태를 변경합니다.</p>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>상태</label>
              <select
                className={styles.modalInput}
                value={afterOverrideValue}
                onChange={(e) => setAfterOverrideValue(e.target.value)}
              >
                <option value="pending">대기</option>
                <option value="accepted">성사</option>
                <option value="rejected">미성사</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelModalBtn} onClick={() => setShowAfterOverride(false)}>취소</button>
              <button
                className={styles.confirmModalBtn}
                onClick={handleAfterOverride}
                disabled={actionLoading || !afterOverrideValue}
              >
                {actionLoading ? '변경 중...' : '상태 변경'}
              </button>
            </div>
          </div>
        </div>
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
              {copiedKey === 'A' ? '복사됨' : '복사'}
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
              {copiedKey === 'B' ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AfterResultLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);

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
              {copiedKey === 'A' ? '복사됨' : '복사'}
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
              {copiedKey === 'B' ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SchedulingLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);

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
              {copiedKey === 'A' ? '복사됨' : '복사'}
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
              {copiedKey === 'B' ? '복사됨' : '복사'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function ParticipantCard({ participant, label, matchStatus, side }) {
  const [copied, setCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const proposalUrl = `${window.location.origin}/proposal/${participant.proposalToken}`;
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

  return (
    <div className={styles.participantCard}>
      <div className={styles.participantHeader}>
        <span className={styles.participantName}>{participant.clientName}</span>
        <span className={styles.participantLabel}>{label}</span>
        <span className={styles.participantGender}>
          {participant.clientGender === 'female' ? '여성' : '남성'}
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

      <div className={styles.tokenSection}>
        <div className={styles.tokenLabel}>프로포절 링크</div>
        {isLinkActive ? (
          <div className={styles.tokenRow}>
            <span className={styles.tokenValue}>{proposalUrl}</span>
            <button className={styles.copyBtn} onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        ) : (
          <div className={styles.tokenInactive}>A 수락 후 활성화</div>
        )}
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

