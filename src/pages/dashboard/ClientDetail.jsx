import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import * as clientService from '../../api/clientService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import styles from './ClientDetail.module.css';

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  useEffect(() => {
    if (clientId) {
      setLoading(true);
      clientService.getClientDetail(clientId)
        .then((data) => {
          setClient(data);
          setNote(data.managerNote || '');
        })
        .catch(() => navigate('/dashboard/clients'))
        .finally(() => setLoading(false));
    }
  }, [clientId, navigate]);

  const handleApproval = async (status) => {
    try {
      await clientService.updateApproval(clientId, status);
      setClient((c) => ({ ...c, approvalStatus: status }));
      toast.success(status === 'approved' ? '승인되었습니다.' : '거절되었습니다.');
    } catch (err) {
      toast.error(err.message || '상태 변경에 실패했습니다.');
    }
    setModal(null);
  };

  const handleSaveNote = async () => {
    setSaving(true);
    try {
      await clientService.updateNote(clientId, note);
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
  if (!client) return null;

  const fields = [
    { label: '닉네임', value: client.nickname },
    { label: '성별', value: client.gender === 'male' ? '남성' : '여성' },
    { label: '생년월일', value: client.birthDate },
    { label: '연락처', value: client.phone },
    { label: '이메일', value: client.email },
    { label: '거주지역', value: client.location },
    { label: '키', value: client.height ? `${client.height}cm` : null },
    { label: '직업', value: client.occupation },
    { label: '회사', value: client.company },
    { label: '회사 위치', value: client.companyLocation },
    { label: '학력', value: client.education },
    { label: '학교', value: client.school },
    { label: '종교', value: client.religion },
    { label: 'MBTI', value: client.mbti },
    { label: '취미', value: client.hobbies },
  ].filter((f) => f.value);

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate('/dashboard/clients')}>
        <ArrowLeft size={18} /> 목록으로
      </button>

      <div className={styles.header}>
        <div>
          <h1 className={styles.name}>
            {client.nickname || client.name}
            {client.nickname && <span className={styles.realName}>{client.name}</span>}
          </h1>
          <div className={styles.headerMeta}>
            <StatusBadge status={client.approvalStatus || 'pending'} />
            {client.ownerManager && (
              <span className={client.isOwner ? styles.ownerBadgeMe : styles.ownerBadgeOther}>
                {client.isOwner ? '내 Client' : `${client.ownerManager.name}의 Client`}
              </span>
            )}
          </div>
        </div>

        {client.isOwner && client.approvalStatus === 'pending' && (
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

      {!client.isOwner && (
        <div className={styles.readonlyNotice}>
          이 Client는 {client.ownerManager?.name || '다른 매니저'}님이 관리하는 프로필입니다. 열람만 가능합니다.
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

      {client.photoUrls?.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>사진</h3>
          <div className={styles.photoGallery}>
            {client.photoUrls.map((url, idx) => (
              <PhotoThumb
                key={idx}
                src={url}
                alt={`사진 ${idx + 1}`}
                onClick={(src) => setLightboxUrl(src)}
              />
            ))}
          </div>
        </div>
      )}

      {client.introduction && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>자기소개</h3>
          <p className={styles.text}>{client.introduction}</p>
        </div>
      )}

      {client.idealType && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>이상형</h3>
          <p className={styles.text}>{client.idealType}</p>
        </div>
      )}

      {client.isOwner ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>매니저 메모</h3>
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
      ) : client.managerNote ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>매니저 메모</h3>
          <p className={styles.text}>{client.managerNote}</p>
        </div>
      ) : null}

      {modal === 'approve' && (
        <ConfirmModal
          title="Client 승인"
          message={`${client.name}님을 승인하시겠습니까?`}
          confirmLabel="승인"
          onConfirm={() => handleApproval('approved')}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'reject' && (
        <ConfirmModal
          title="Client 거절"
          message={`${client.name}님을 거절하시겠습니까?`}
          confirmLabel="거절"
          danger
          onConfirm={() => handleApproval('rejected')}
          onCancel={() => setModal(null)}
        />
      )}

      {lightboxUrl && (
        <div className={styles.lightbox} onClick={closeLightbox}>
          <img src={lightboxUrl} alt="확대 보기" onClick={(e) => e.stopPropagation()} />
          <button className={styles.lightboxClose} onClick={closeLightbox}>×</button>
        </div>
      )}
    </div>
  );
}

function PhotoThumb({ src, alt, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  if (error) {
    return (
      <div className={styles.photoThumb}>
        <div className={styles.photoError}>불러올 수 없음</div>
      </div>
    );
  }

  return (
    <button
      className={styles.photoThumb}
      onClick={() => onClick(src)}
      type="button"
    >
      {!loaded && <div className={styles.photoSkeleton} />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={loaded ? styles.photoLoaded : styles.photoHidden}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </button>
  );
}
