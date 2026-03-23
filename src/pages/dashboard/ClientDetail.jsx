import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Heart, Edit3, Plus, Trash2 } from 'lucide-react';
import * as clientService from '../../api/clientService';
import * as matchService from '../../api/matchService';
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
  const [matchHistory, setMatchHistory] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const photoInputRef = useRef(null);

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

      // Fetch match history for this client
      setMatchLoading(true);
      matchService.listMatches({ size: 100 })
        .then((res) => {
          const matches = (res.data || []).filter(
            (m) => m.clientA?.clientId === clientId || m.clientB?.clientId === clientId
          );
          matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setMatchHistory(matches);
        })
        .catch(() => {})
        .finally(() => setMatchLoading(false));
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

  const startEditing = () => {
    setEditForm({
      name: client.name || '',
      nickname: client.nickname || '',
      birthDate: client.birthDate || '',
      phone: client.phone || '',
      height: client.height || '',
      occupation: client.occupation || '',
      company: client.company || '',
      workLocation: client.workLocation || '',
      education: client.education || '',
      location: client.location || '',
      religion: client.religion || '',
      mbti: client.mbti || '',
      hobbies: client.hobbies || '',
      introduction: client.introduction || '',
      idealType: client.idealType || '',
    });
    setEditing(true);
  };

  const handleEditSave = async () => {
    setEditSaving(true);
    try {
      const payload = {};
      for (const [key, value] of Object.entries(editForm)) {
        if (value !== '' && value != null) {
          payload[key] = key === 'height' ? Number(value) : value;
        }
      }
      await clientService.updateClient(clientId, payload);
      toast.success('프로필이 수정되었습니다.');
      const updated = await clientService.getClientDetail(clientId);
      setClient(updated);
      setEditing(false);
    } catch (err) {
      toast.error(err.message || '프로필 수정에 실패했습니다.');
    }
    setEditSaving(false);
  };

  const handlePhotoAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPhotoUploading(true);
    try {
      await clientService.addClientPhotos(clientId, files);
      toast.success('사진이 추가되었습니다.');
      const updated = await clientService.getClientDetail(clientId);
      setClient(updated);
    } catch (err) {
      toast.error(err.message || '사진 추가에 실패했습니다.');
    }
    setPhotoUploading(false);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handlePhotoDelete = async (photoUrl) => {
    const segments = photoUrl.split('/');
    const photoId = segments[segments.length - 1];
    setDeletingPhotoId(photoId);
    try {
      await clientService.deleteClientPhoto(clientId, photoId);
      toast.success('사진이 삭제되었습니다.');
      const updated = await clientService.getClientDetail(clientId);
      setClient(updated);
    } catch (err) {
      toast.error(err.message || '사진 삭제에 실패했습니다.');
    }
    setDeletingPhotoId(null);
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
    { label: '출생연도', value: client.birthDate ? client.birthDate.slice(0, 4) : null },
    { label: '연락처', value: client.phone },
    { label: '이메일', value: client.email },
    { label: '거주지역', value: client.location },
    { label: '키', value: client.height ? `${client.height}cm` : null },
    { label: '직업', value: client.occupation },
    { label: '회사', value: client.company },
    { label: '회사 위치', value: client.workLocation },
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
                {client.isOwner ? '내 회원' : `${client.ownerManager.name}의 회원`}
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
          이 회원은 {client.ownerManager?.name || '다른 매니저'}님이 관리하는 프로필입니다. 열람만 가능합니다.
        </div>
      )}

      {editing ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>프로필 수정</h3>
          <div className={styles.fields}>
            {[
              { key: 'name', label: '이름' },
              { key: 'nickname', label: '닉네임' },
              { key: 'birthDate', label: '생년월일', placeholder: 'yyyy-MM-dd' },
              { key: 'phone', label: '연락처', placeholder: '010-XXXX-XXXX' },
              { key: 'height', label: '키', type: 'number' },
              { key: 'occupation', label: '직업' },
              { key: 'company', label: '회사' },
              { key: 'workLocation', label: '회사 위치' },
              { key: 'education', label: '학력' },
              { key: 'location', label: '거주지' },
              { key: 'religion', label: '종교' },
              { key: 'mbti', label: 'MBTI', placeholder: 'INTJ' },
              { key: 'hobbies', label: '취미' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key} className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                <input
                  className={styles.noteInput}
                  style={{ padding: '6px 8px', minHeight: 'auto' }}
                  type={type || 'text'}
                  value={editForm[key] || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div className={styles.field} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <span className={styles.fieldLabel}>자기소개</span>
              <textarea
                className={styles.noteInput}
                rows={3}
                value={editForm.introduction || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, introduction: e.target.value }))}
                maxLength={1000}
              />
            </div>
            <div className={styles.field} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <span className={styles.fieldLabel}>이상형</span>
              <textarea
                className={styles.noteInput}
                rows={3}
                value={editForm.idealType || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, idealType: e.target.value }))}
                maxLength={500}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className={styles.saveBtn} onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? '저장 중...' : '저장'}
            </button>
            <button className={styles.saveBtn} style={{ background: '#666' }} onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            기본 정보
            {client.isOwner && (
              <button
                onClick={startEditing}
                style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary, #6366f1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                <Edit3 size={14} /> 수정
              </button>
            )}
          </h3>
          <div className={styles.fields}>
            {fields.map(({ label, value }) => (
              <div key={label} className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          사진
          {client.isOwner && (client.photoUrls?.length || 0) < 5 && (
            <>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary, #6366f1)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13 }}
              >
                <Plus size={14} /> {photoUploading ? '업로드 중...' : '추가'}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoAdd}
                style={{ display: 'none' }}
              />
            </>
          )}
        </h3>
        {client.photoUrls?.length > 0 ? (
          <div className={styles.photoGallery}>
            {client.photoUrls.map((url, idx) => {
              const segments = url.split('/');
              const photoId = segments[segments.length - 1];
              return (
                <div key={idx} style={{ position: 'relative' }}>
                  <PhotoThumb
                    src={url}
                    alt={`사진 ${idx + 1}`}
                    onClick={(src) => setLightboxUrl(src)}
                  />
                  {client.isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePhotoDelete(url); }}
                      disabled={deletingPhotoId === photoId}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: '#888', fontSize: 14 }}>등록된 사진이 없습니다.</p>
        )}
      </div>

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

      {/* Match History */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>
          <Heart size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          매칭 히스토리
        </h3>
        {matchLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SkeletonLine width="100%" height="48px" />
            <SkeletonLine width="100%" height="48px" />
          </div>
        ) : matchHistory.length === 0 ? (
          <p className={styles.emptyHistory}>매칭 이력이 없습니다.</p>
        ) : (
          <div className={styles.historyList}>
            {matchHistory.map((m) => {
              const isA = m.clientA?.clientId === clientId;
              const partner = isA ? m.clientB : m.clientA;
              const myResponse = isA ? m.clientA?.response : m.clientB?.response;
              return (
                <button
                  key={m.matchId}
                  className={styles.historyItem}
                  onClick={() => navigate(`/dashboard/matches/${m.matchId}`)}
                >
                  <div className={styles.historyTop}>
                    <span className={styles.historyPartner}>
                      {partner?.clientName || '알 수 없음'}
                    </span>
                    <span className={styles.historyDate}>
                      {new Date(m.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className={styles.historyTags}>
                    <span className={styles.historyTagLabel}>매칭</span>
                    <StatusBadge status={m.status} />
                    {myResponse && myResponse !== 'pending' && (
                      <>
                        <span className={styles.historyTagLabel}>응답</span>
                        <span className={styles[`historyResp_${myResponse}`]}>
                          {myResponse === 'accepted' ? '수락' : '거절'}
                        </span>
                      </>
                    )}
                    {m.afterStatus && (
                      <>
                        <span className={styles.historyTagLabel}>에프터</span>
                        <StatusBadge status={`after_${m.afterStatus}`} />
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {modal === 'approve' && (
        <ConfirmModal
          title="회원 승인"
          message={`${client.name}님을 승인하시겠습니까?`}
          confirmLabel="승인"
          onConfirm={() => handleApproval('approved')}
          onCancel={() => setModal(null)}
        />
      )}

      {modal === 'reject' && (
        <ConfirmModal
          title="회원 거절"
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
