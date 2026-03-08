import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import * as seekerService from '../../api/seekerService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import styles from './SeekerDetail.module.css';

export default function SeekerDetail() {
  const { seekerId } = useParams();
  const navigate = useNavigate();
  const [seeker, setSeeker] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seekerId) {
      setLoading(true);
      seekerService.getSeekerDetail(seekerId)
        .then((data) => {
          setSeeker(data);
          setNote(data.managerNote || '');
        })
        .catch(() => navigate('/dashboard/seekers'))
        .finally(() => setLoading(false));
    }
  }, [seekerId, navigate]);

  const handleApproval = async (status) => {
    try {
      await seekerService.updateApproval(seekerId, status);
      setSeeker((s) => ({ ...s, approval: status }));
      toast.success(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.');
    } catch (err) {
      toast.error(err.message || '상태 변경에 실패했습니다.');
    }
    setModal(null);
  };

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      await seekerService.updateNote(seekerId, note);
      toast.success('메모가 저장되었습니다.');
    } catch (err) {
      toast.error(err.message || '메모 저장에 실패했습니다.');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className={styles.page}>
      <SkeletonLine width="100px" height="16px" />
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonLine width="40%" height="28px" />
        <SkeletonLine width="100%" height="200px" />
        <SkeletonLine width="100%" height="120px" />
      </div>
    </div>
  );
  if (!seeker) return null;

  const fields = [
    { label: '성별', value: seeker.gender === 'male' ? '남성' : '여성' },
    { label: '생년월일', value: seeker.birthDate },
    { label: '연락처', value: seeker.phone },
    { label: '이메일', value: seeker.email },
    { label: '거주지역', value: seeker.location },
    { label: '키', value: seeker.height ? `${seeker.height}cm` : null },
    { label: '직업', value: seeker.occupation },
    { label: '회사', value: seeker.company },
    { label: '회사 위치', value: seeker.companyLocation },
    { label: '학력', value: seeker.education },
    { label: '학교', value: seeker.school },
    { label: '종교', value: seeker.religion },
    { label: 'MBTI', value: seeker.mbti },
    { label: '취미', value: seeker.hobbies },
  ].filter((f) => f.value);

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/dashboard/seekers')}>
        <ArrowLeft size={18} /> 목록으로
      </button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>{seeker.name}</h1>
          <div className={styles.headerMeta}>
            <StatusBadge status={seeker.approval || 'pending'} />
            {seeker.ownerManager && (
              <span className={seeker.isOwner ? styles.ownerBadgeMe : styles.ownerBadgeOther}>
                {seeker.isOwner ? '내 Seeker' : `${seeker.ownerManager.name}의 Seeker`}
              </span>
            )}
          </div>
        </div>

        {seeker.isOwner && seeker.approval === 'pending' && (
          <div className={styles.actions}>
            <button
              className={styles.approveBtn}
              onClick={() => setModal('approve')}
            >
              <Check size={16} /> 승인
            </button>
            <button
              className={styles.rejectBtn}
              onClick={() => setModal('reject')}
            >
              <X size={16} /> 거절
            </button>
          </div>
        )}
      </div>

      {!seeker.isOwner && (
        <div className={styles.readonlyNotice}>
          이 Seeker는 {seeker.ownerManager?.name || '다른 매니저'}님이 관리하는 프로필입니다. 열람만 가능합니다.
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>기본 정보</h3>
        <div className={styles.fields}>
          {fields.map(({ label, value }) => (
            <div key={label} className={styles.field}>
              <span className={styles.fieldLabel}>{label}</span>
              <span className={styles.fieldValue}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {seeker.introduction && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>자기소개</h3>
          <p className={styles.text}>{seeker.introduction}</p>
        </div>
      )}

      {seeker.idealType && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>이상형</h3>
          <p className={styles.text}>{seeker.idealType}</p>
        </div>
      )}

      {seeker.isOwner ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>관리자 메모</h3>
          <textarea
            className={styles.noteInput}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="메모를 입력하세요..."
            rows={4}
          />
          <button
            className={styles.saveBtn}
            onClick={handleSaveNote}
            disabled={saving}
          >
            {saving ? '저장 중...' : '메모 저장'}
          </button>
        </div>
      ) : seeker.managerNote ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>관리자 메모</h3>
          <p className={styles.text}>{seeker.managerNote}</p>
        </div>
      ) : null}

      {modal === 'approve' && (
        <ConfirmModal
          title="Seeker 승인"
          message={`${seeker.name}님을 승인하시겠습니까?`}
          confirmLabel="승인"
          onConfirm={() => handleApproval('approved')}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'reject' && (
        <ConfirmModal
          title="Seeker 거절"
          message={`${seeker.name}님을 거절하시겠습니까?`}
          confirmLabel="거절"
          danger
          onConfirm={() => handleApproval('rejected')}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
