import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonLine } from '../../components/Skeleton';
import styles from './MatchDetail.module.css';

const STATUS_LABELS = {
  PENDING: 'pending',
  CONFIRMED: 'approved',
  CANCELLED: 'rejected',
  COMPLETED: 'active',
};

const RESPONSE_MAP = {
  accepted: { label: '수락', className: 'responseAccepted' },
  rejected: { label: '거절', className: 'responseRejected' },
};

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

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/dashboard/matches')}>
        <ArrowLeft size={18} /> 목록으로
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>
          {match.seekerA.seekerName} &harr; {match.seekerB.seekerName}
        </h1>
        <StatusBadge status={STATUS_LABELS[match.status] || match.status} />
      </div>

      <div className={styles.participants}>
        <ParticipantCard participant={match.seekerA} label="Seeker A" />
        <ParticipantCard participant={match.seekerB} label="Seeker B" />
      </div>

      {match.note && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>매니저 메모</h3>
          <p className={styles.text}>{match.note}</p>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>매칭 정보</h3>
        <p className={styles.meta}>생성일: {formatDate(match.createdAt)}</p>
      </div>
    </div>
  );
}

function ParticipantCard({ participant, label }) {
  const [copied, setCopied] = useState(false);

  const proposalUrl = `${window.location.origin}/proposal/${participant.proposalToken}`;

  const handleCopy = async () => {
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

  return (
    <div className={styles.participantCard}>
      <div className={styles.participantHeader}>
        <span className={styles.participantName}>{participant.seekerName}</span>
        <span className={styles.participantGender}>
          {participant.seekerGender === 'female' ? '여성' : '남성'}
        </span>
      </div>

      <div className={styles.participantFields}>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>담당 매니저</span>
          <span className={styles.fieldValue}>{participant.managerName}</span>
        </div>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>응답 상태</span>
          {responseInfo ? (
            <span className={styles[responseInfo.className]}>{responseInfo.label}</span>
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
        <div className={styles.tokenRow}>
          <span className={styles.tokenValue}>{proposalUrl}</span>
          <button className={styles.copyBtn} onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>
    </div>
  );
}
