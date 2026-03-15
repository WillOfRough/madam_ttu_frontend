import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, MapPin, Clock, AlertTriangle, Link2 } from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import styles from './MatchDetail.module.css';

const RESPONSE_MAP = {
  pending: { label: '대기', className: 'responsePending' },
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
  return `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]}) ${slot.time}`;
}

function getRefundStatus(meetingDate) {
  if (!meetingDate) return null;
  const hours = (new Date(meetingDate) - new Date()) / (1000 * 60 * 60);
  if (hours >= 72) return { label: '환불 가능', type: 'safe', hours: Math.floor(hours) };
  if (hours >= 24) return { label: '변경만 가능', type: 'warn', hours: Math.floor(hours) };
  if (hours > 0) return { label: '환불 불가', type: 'danger', hours: Math.floor(hours) };
  return { label: '미팅 시간 경과', type: 'past', hours: 0 };
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [venue, setVenue] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [selectedTimeId, setSelectedTimeId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleConfirmSchedule = async () => {
    if (!selectedTimeId) return;
    setActionLoading(true);
    try {
      await matchService.confirmMatch(matchId, { timeId: selectedTimeId, location: venue, endTime: endTimeInput || null });
      toast.success('약속이 확정되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '약속 확정에 실패했습니다.');
    }
    setActionLoading(false);
    setShowConfirm(false);
    setVenue('');
    setEndTimeInput('');
    setSelectedTimeId(null);
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
          label="Client A"
          matchStatus={match.status}
          side="A"
        />
        <ParticipantCard
          participant={match.clientB}
          label="Client B"
          matchStatus={match.status}
          side="B"
        />
      </div>

      {/* Scheduling Link Card */}
      {match.status === 'scheduling' && (
        <SchedulingLinkCard match={match} />
      )}

      {/* Arranging: Manager confirms time + venue */}
      {match.status === 'arranging' && match.schedule && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Calendar size={16} /> 가용시간 목록
          </h3>
          {(() => {
            // Group by clientName
            const grouped = {};
            (match.schedule.timeSlots || []).forEach((slot) => {
              const name = slot.clientName || '알 수 없음';
              if (!grouped[name]) grouped[name] = [];
              grouped[name].push(slot);
            });
            return Object.entries(grouped).map(([name, slots]) => (
              <div key={name} style={{ marginBottom: 16 }}>
                <p className={styles.fieldLabel} style={{ marginBottom: 6 }}>{name}</p>
                <div className={styles.slotTags}>
                  {slots.map((slot) => (
                    <label
                      key={slot.id}
                      className={`${styles.slotTag} ${selectedTimeId === slot.id ? styles.slotTagPicked : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="radio"
                        name="confirmTime"
                        value={slot.id}
                        checked={selectedTimeId === slot.id}
                        onChange={() => setSelectedTimeId(slot.id)}
                        style={{ display: 'none' }}
                      />
                      {formatSlotDisplay(slot)}
                    </label>
                  ))}
                </div>
              </div>
            ));
          })()}
          <div className={styles.confirmSection}>
            <button className={styles.actionBtn} onClick={() => setShowConfirm(true)} disabled={!selectedTimeId}>
              약속 확정하기
            </button>
          </div>
        </div>
      )}

      {/* Schedule Section (scheduled / completed) */}
      {(match.status === 'scheduled' || match.status === 'completed') && match.schedule && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Calendar size={16} /> 일정 정보
          </h3>
          <div className={styles.scheduleInfo}>
            {match.schedule.pickedSlot && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>확정된 시간</span>
                <span className={styles.fieldValue}>
                  <Clock size={14} /> {formatSlotDisplay(match.schedule.pickedSlot)}
                </span>
              </div>
            )}
            {match.schedule.venue && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>장소</span>
                <span className={styles.fieldValue}>
                  <MapPin size={14} /> {match.schedule.venue}
                </span>
              </div>
            )}
            {match.schedule.confirmedAt && (
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>확정일</span>
                <span className={styles.fieldValue}>{formatDate(match.schedule.confirmedAt)}</span>
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
          <p className={styles.waitingText}>양쪽 Client의 가용시간 등록을 기다리고 있습니다.</p>
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
            <li>약속일 3일 전까지: 전액 환불 가능</li>
            <li>약속 24시간 전까지: 일정 변경 가능</li>
            <li>24시간 미만: 취소 시 환불 불가</li>
          </ul>
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
        {match.status === 'scheduled' && (
          <>
            <button className={styles.actionBtn} onClick={handleCompleteMatch} disabled={actionLoading}>
              미팅 완료 처리
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

      {/* Confirm Schedule Modal */}
      {showConfirm && (
        <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>약속 확정</h3>
            {selectedTimeId && match.schedule?.timeSlots && (
              <p className={styles.modalDesc}>
                선택된 시간: {formatSlotDisplay(match.schedule.timeSlots.find((s) => s.id === selectedTimeId))}
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
              <label className={styles.modalLabel}>종료 시간 (선택)</label>
              <input
                className={styles.modalInput}
                value={endTimeInput}
                onChange={(e) => setEndTimeInput(e.target.value)}
                placeholder="예: 21:00"
              />
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

function SchedulingLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/available-times`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/available-times`;

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
      <p className={styles.schedulingLinkHint}>아래 링크를 각 Client에게 전달해주세요</p>
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

  const responseInfo = participant.response
    ? RESPONSE_MAP[participant.response] || { label: participant.response, className: '' }
    : null;

  // Sequential status text
  let statusText = null;
  if (matchStatus === 'proposal_sent') {
    statusText = side === 'A' ? '프로필 확인 대기' : 'A 확인 후 전달 예정';
  } else if (matchStatus === 'proposal_accepted') {
    statusText = side === 'A' ? null : '프로필 확인 대기';
  }

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
