import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Calendar, MapPin, Clock, AlertTriangle } from 'lucide-react';
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
  { key: 'pending_b', label: 'B확인' },
  { key: 'pending_a', label: 'A확인' },
  { key: 'scheduling', label: '일정조율' },
  { key: 'confirmed', label: '약속확정' },
  { key: 'completed', label: '미팅완료' },
];

function getStepIndex(status) {
  if (status === 'pending_b') return 0;
  if (status === 'pending_a') return 1;
  if (status === 'matched' || status === 'scheduling') return 2;
  if (status === 'confirmed') return 3;
  if (status === 'completed') return 4;
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
    setActionLoading(true);
    try {
      await matchService.confirmSchedule(matchId, { venue, note: '' });
      toast.success('약속이 확정되었습니다.');
      reload();
    } catch (err) {
      toast.error(err.message || '약속 확정에 실패했습니다.');
    }
    setActionLoading(false);
    setShowConfirm(false);
    setVenue('');
  };

  const handleCompleteMatch = async () => {
    setActionLoading(true);
    try {
      await matchService.updateMatchStatus(matchId, 'completed');
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
          {match.seekerA.seekerName} &harr; {match.seekerB.seekerName}
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
          participant={match.seekerA}
          label="Seeker A"
          matchStatus={match.status}
          side="A"
        />
        <ParticipantCard
          participant={match.seekerB}
          label="Seeker B"
          matchStatus={match.status}
          side="B"
        />
      </div>

      {/* Schedule Section */}
      {(match.status === 'matched' || match.status === 'scheduling' || match.status === 'confirmed' || match.status === 'completed') && match.schedule && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Calendar size={16} /> 일정 조율
          </h3>

          {match.schedule.proposedBy && (
            <div className={styles.scheduleInfo}>
              <div className={styles.scheduleField}>
                <span className={styles.fieldLabel}>제안 시간</span>
                <div className={styles.slotTags}>
                  {match.schedule.timeSlots.map((slot) => (
                    <span
                      key={slot.id}
                      className={`${styles.slotTag} ${match.schedule.pickedSlot?.id === slot.id ? styles.slotTagPicked : ''}`}
                    >
                      {formatSlotDisplay(slot)}
                    </span>
                  ))}
                </div>
              </div>

              {match.schedule.pickedSlot && (
                <div className={styles.scheduleField}>
                  <span className={styles.fieldLabel}>선택된 시간</span>
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
          )}

          {match.status === 'matched' && !match.schedule.proposedBy && (
            <p className={styles.waitingText}>일정 조율 링크를 발송해주세요.</p>
          )}

          {match.status === 'scheduling' && !match.schedule.pickedSlot && (
            <p className={styles.waitingText}>상대방의 시간 선택을 기다리고 있습니다.</p>
          )}

          {/* Manager: confirm schedule with venue */}
          {match.status === 'scheduling' && match.schedule.pickedSlot && !match.schedule.confirmedAt && (
            <div className={styles.confirmSection}>
              <p className={styles.confirmHint}>시간이 선택되었습니다. 장소를 입력하고 약속을 확정해주세요.</p>
              <button className={styles.actionBtn} onClick={() => setShowConfirm(true)}>
                약속 확정하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* Refund Status (confirmed) */}
      {match.status === 'confirmed' && refundStatus && (
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
        {match.status === 'confirmed' && (
          <>
            <button className={styles.actionBtn} onClick={handleCompleteMatch} disabled={actionLoading}>
              미팅 완료 처리
            </button>
            <button className={styles.dangerBtn} onClick={() => setShowCancel(true)} disabled={actionLoading}>
              약속 취소
            </button>
          </>
        )}
        {match.status === 'scheduling' && (
          <button className={styles.dangerBtn} onClick={() => setShowCancel(true)} disabled={actionLoading}>
            매칭 취소
          </button>
        )}
      </div>

      {/* Cancelled info */}
      {isCancelled && match.cancelReason && (
        <div className={styles.cancelledBanner}>
          <p className={styles.cancelledTitle}>매칭 종료</p>
          <p className={styles.cancelledReason}>{match.cancelReason}</p>
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
            <p className={styles.modalDesc}>
              선택된 시간: {formatSlotDisplay(match.schedule.pickedSlot)}
            </p>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>장소</label>
              <input
                className={styles.modalInput}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="예: 청담동 르카페"
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelModalBtn} onClick={() => setShowConfirm(false)}>취소</button>
              <button
                className={styles.confirmModalBtn}
                onClick={handleConfirmSchedule}
                disabled={actionLoading}
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

function ParticipantCard({ participant, label, matchStatus, side }) {
  const [copied, setCopied] = useState(false);

  const proposalUrl = `${window.location.origin}/proposal/${participant.proposalToken}`;
  const isLinkActive = side === 'B' || matchStatus !== 'pending_b';

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
  if (matchStatus === 'pending_b') {
    statusText = side === 'B' ? '프로필 확인 대기' : 'B 확인 후 전달 예정';
  } else if (matchStatus === 'pending_a') {
    statusText = side === 'B' ? null : '프로필 확인 대기';
  }

  return (
    <div className={styles.participantCard}>
      <div className={styles.participantHeader}>
        <span className={styles.participantName}>{participant.seekerName}</span>
        <span className={styles.participantLabel}>{label}</span>
        <span className={styles.participantGender}>
          {participant.seekerGender === 'female' ? '여성' : '남성'}
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
          <div className={styles.tokenInactive}>B 수락 후 활성화</div>
        )}
      </div>
    </div>
  );
}
