import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Heart, Edit3, Trash2, ShieldCheck, Download, Copy, Link2, MessageSquare } from 'lucide-react';
import PhotoGallery from '../../components/PhotoGallery';
import * as clientService from '../../api/clientService';
import * as matchService from '../../api/matchService';
import useClientListStore from '../../store/clientListStore';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonLine } from '../../components/Skeleton';
import html2pdf from 'html2pdf.js';
import styles from './ClientDetail.module.css';

function parseKeywordsText(str) {
  if (!str) return { keywords: [], text: '' };
  const match = str.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  if (match) {
    return {
      keywords: match[1].split(',').map((k) => k.trim()).filter(Boolean),
      text: match[2].trim(),
    };
  }
  return { keywords: [], text: str };
}

export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchHistory, setMatchHistory] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletionCert, setDeletionCert] = useState(null);
  const certRef = useRef(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (!copiedKey) return;
    const t = setTimeout(() => setCopiedKey(null), 2000);
    return () => clearTimeout(t);
  }, [copiedKey]);

  const handleStatusChange = async (newStatus) => {
    try {
      await clientService.updateClientStatus(clientId, newStatus);
      setClient((c) => ({ ...c, status: newStatus }));
      const labels = { active: '활성', inactive: '비활성', dormant: '휴면' };
      toast.success(`상태가 "${labels[newStatus]}"(으)로 변경되었습니다.`);
    } catch (err) {
      toast.error(err.message || '상태 변경에 실패했습니다.');
    }
  };

  const getProfileEditUrl = () => {
    if (!client?.id) return null;
    return `${window.location.origin}/my-profile?id=${client.id}`;
  };

  const handleCopyProfileLink = async () => {
    const url = getProfileEditUrl();
    if (!url) { toast.error('회원 정보를 불러오는 중입니다.'); return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey('link');
      toast.success('프로필 수정 링크가 복사되었습니다.');
    } catch { /* silent */ }
  };

  const handleCopyProfileMessage = async () => {
    const url = getProfileEditUrl();
    if (!url) { toast.error('회원 정보를 불러오는 중입니다.'); return; }
    const name = client?.nickname || client?.name || '회원';
    const msg = `안녕하세요, ${name}님! Knots & Links 매니저입니다 😊\n\n더 좋은 매칭을 위해 프로필 정보를 최신 상태로 유지해 주시면 좋겠어요.\n아래 링크를 통해 직접 프로필을 확인하고 수정하실 수 있습니다.\n\n👉 ${url}\n\n정보가 정확할수록 더 어울리는 인연을 찾아드릴 수 있어요.\n궁금한 점이 있으시면 언제든 연락 주세요! 💛`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedKey('msg');
      toast.success('메시지가 복사되었습니다.');
    } catch { /* silent */ }
  };

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

      // Fetch match history for this client (clientId 필터로 동명이인·페이지 누락 이슈 없이 조회)
      setMatchLoading(true);
      matchService.listMatches({ clientId, size: 100 })
        .then((res) => {
          const list = res.data || res.matches || [];
          const sorted = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setMatchHistory(sorted);
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
    e.target.value = '';
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

  const handleDeleteClient = async () => {
    setDeleting(true);
    try {
      const clientName = client.name;
      await clientService.deleteClient(clientId);
      toast.success('회원이 삭제되었습니다.');
      setShowDeleteConfirm(false);
      setDeletionCert({
        name: clientName,
        deletedAt: new Date(),
      });
    } catch (err) {
      toast.error(err.message || '삭제에 실패했습니다.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDownloadCert = async () => {
    if (!deletionCert || !certRef.current) return;
    const { name, deletedAt } = deletionCert;

    const actionsEl = certRef.current.querySelector(`.${styles.certActions}`);
    if (actionsEl) actionsEl.style.display = 'none';
    certRef.current.style.animation = 'none';
    certRef.current.querySelectorAll('*').forEach(el => el.style.animation = 'none');

    try {
      await html2pdf()
        .set({
          margin: 0,
          filename: `삭제확인서_${name}_${deletedAt.toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(certRef.current)
        .save();
    } finally {
      if (actionsEl) actionsEl.style.display = '';
      certRef.current.style.animation = '';
      certRef.current.querySelectorAll('*').forEach(el => el.style.animation = '');
    }
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
    { label: '성별', value: <span className={client.gender === 'male' ? styles.genderMaleCircle : styles.genderFemaleCircle}>{client.gender === 'male' ? '남' : '여'}</span> },
    { label: '출생연도', value: client.birthDate ? `${client.birthDate.slice(0, 4)} (${new Date().getFullYear() - parseInt(client.birthDate.slice(0, 4))}세)` : null },
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
            {client.name}
            {client.nickname && <span className={styles.realName}>{client.nickname}</span>}
          </h1>
          <div className={styles.headerMeta}>
            <StatusBadge status={client.approvalStatus || 'pending'} />
            <StatusBadge status={client.status || 'active'} />
            {client.ownerManager && (
              <span className={client.isOwner ? styles.ownerBadgeMe : styles.ownerBadgeOther}>
                {client.isOwner ? '내 회원' : `${client.ownerManager.name}의 회원`}
              </span>
            )}
          </div>
          {client.inviteToken && (
            <div className={styles.inviteTokenBadge}>
              초대 링크: {client.inviteToken.label || '라벨 없음'}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {client.approvalStatus === 'approved' && (client.status || 'active') === 'active' && (
            <MatchButton client={client} />
          )}
          {client.isOwner && (
            <>
              {client.approvalStatus === 'pending' && (
                <>
                  <button className={styles.approveBtn} onClick={() => setModal('approve')}>
                    <Check size={16} /> 승인
                  </button>
                  <button className={styles.rejectBtn} onClick={() => setModal('reject')}>
                    <X size={16} /> 거절
                  </button>
                </>
              )}
              <select
                className={styles.statusSelect}
                value={client.status || 'active'}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="dormant">휴면</option>
              </select>
              <button className={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 size={16} /> 회원 삭제
              </button>
            </>
          )}
        </div>
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
                className={styles.editInfoBtn}
                onClick={startEditing}
              >
                <Edit3 size={13} /> 수정
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
        <h3 className={styles.cardTitle}>사진</h3>
        <PhotoGallery
          photoUrls={client.photoUrls || []}
          canEdit={client.isOwner}
          onAdd={handlePhotoAdd}
          onDelete={handlePhotoDelete}
          uploading={photoUploading}
          deletingPhotoId={deletingPhotoId}
        />
      </div>

      {client.introduction && (() => {
        const { keywords, text } = parseKeywordsText(client.introduction);
        return (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>자기소개</h3>
            {keywords.length > 0 && (
              <div className={styles.narrativeKeywords}>
                {keywords.map((kw) => (
                  <span key={kw} className={`${styles.narrativeTag} ${styles.narrativeTagCoral}`}>{kw}</span>
                ))}
              </div>
            )}
            {text && <p className={styles.text}>{text}</p>}
          </div>
        );
      })()}

      {client.idealType && (() => {
        const { keywords, text } = parseKeywordsText(client.idealType);
        return (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>이상형</h3>
            {keywords.length > 0 && (
              <div className={styles.narrativeKeywords}>
                {keywords.map((kw) => (
                  <span key={kw} className={`${styles.narrativeTag} ${styles.narrativeTagNavy}`}>{kw}</span>
                ))}
              </div>
            )}
            {text && <p className={styles.text}>{text}</p>}
          </div>
        );
      })()}

      {client.isOwner && client.inviteToken && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Link2 size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            프로필 수정 링크 공유
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--charcoal-light)', marginBottom: 12, lineHeight: 1.5 }}>
            아래 버튼으로 회원에게 프로필 수정 링크를 전달할 수 있습니다. 회원이 직접 프로필을 확인하고 수정할 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={copiedKey === 'link' ? styles.approveBtn : styles.matchBtn}
              onClick={handleCopyProfileLink}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              {copiedKey === 'link' ? <Check size={14} /> : <Copy size={14} />}
              {copiedKey === 'link' ? '복사됨' : '링크 복사'}
            </button>
            <button
              className={copiedKey === 'msg' ? styles.approveBtn : styles.matchBtn}
              onClick={handleCopyProfileMessage}
              style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            >
              {copiedKey === 'msg' ? <Check size={14} /> : <MessageSquare size={14} />}
              {copiedKey === 'msg' ? '복사됨' : '메시지와 함께 복사'}
            </button>
          </div>
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
              const partnerResponse = isA ? m.clientB?.response : m.clientA?.response;
              const myName = isA ? (m.clientA?.clientName || '나') : (m.clientB?.clientName || '나');
              const partnerName = partner?.clientName || '상대';
              const myAfter = isA ? m.afterResponses?.A : m.afterResponses?.B;
              const partnerAfter = isA ? m.afterResponses?.B : m.afterResponses?.A;
              const respLabel = (r) => r === 'accepted' ? '수락' : r === 'rejected' ? '거절' : '대기';
              return (
                <button
                  key={m.matchId}
                  className={styles.historyItem}
                  onClick={() => navigate(`/dashboard/matches/${m.matchId}`)}
                >
                  <div className={styles.historyTop}>
                    <span className={styles.historyPartner}>
                      {partnerName}
                    </span>
                    <span className={styles.historyDate}>
                      {new Date(m.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <div className={styles.historyTags}>
                    <StatusBadge status={m.status} />
                    {m.afterStatus && <StatusBadge status={`after_${m.afterStatus}`} />}
                  </div>
                  <div className={styles.historyResponses}>
                    <span className={styles.historyResponseLabel}>프로포절</span>
                    <span className={styles.historyResponseItem}>
                      <span className={styles.historyResponseName}>{myName}</span>
                      <span className={styles[`resp_${myResponse || 'pending'}`]}>
                        {respLabel(myResponse)}
                      </span>
                    </span>
                    <span className={styles.historyResponseDivider}>|</span>
                    <span className={styles.historyResponseItem}>
                      <span className={styles.historyResponseName}>{partnerName}</span>
                      <span className={styles[`resp_${partnerResponse || 'pending'}`]}>
                        {respLabel(partnerResponse)}
                      </span>
                    </span>
                  </div>
                  {m.status === 'completed' && m.afterResponses && (
                    <div className={styles.historyResponses}>
                      <span className={styles.historyResponseLabel}>에프터</span>
                      <span className={styles.historyResponseItem}>
                        <span className={styles.historyResponseName}>{myName}</span>
                        <span className={styles[`resp_${myAfter || 'pending'}`]}>
                          {respLabel(myAfter)}
                        </span>
                      </span>
                      <span className={styles.historyResponseDivider}>|</span>
                      <span className={styles.historyResponseItem}>
                        <span className={styles.historyResponseName}>{partnerName}</span>
                        <span className={styles[`resp_${partnerAfter || 'pending'}`]}>
                          {respLabel(partnerAfter)}
                        </span>
                      </span>
                    </div>
                  )}
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

      {showDeleteConfirm && (
        <ConfirmModal
          title="회원 삭제"
          message="이 회원을 삭제하시겠습니까? 프로필, 사진 등 모든 데이터가 영구 삭제되며, 되돌릴 수 없습니다."
          confirmLabel="삭제"
          cancelLabel="돌아가기"
          danger
          onConfirm={handleDeleteClient}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {deletionCert && (
        <div className={styles.certOverlay}>
          <div className={styles.certModal} ref={certRef}>

            {/* Top accent bar */}
            <div className={styles.certAccentBar} />

            {/* Header */}
            <div className={styles.certHeader}>
              <div className={styles.certIconWrap}>
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div className={styles.certHeaderText}>
                <p className={styles.certOrg}>Knots &amp; Links</p>
                <h2 className={styles.certTitle}>개인정보 삭제 확인서</h2>
                <p className={styles.certDocId}>
                  문서번호&nbsp;·&nbsp;KL-DEL-{deletionCert.deletedAt.getFullYear()}{String(deletionCert.deletedAt.getMonth() + 1).padStart(2, '0')}{String(deletionCert.deletedAt.getDate()).padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className={styles.certDivider} />

            {/* Body rows */}
            <div className={styles.certBody}>
              <div className={styles.certRow}>
                <span className={styles.certLabel}>처리일시</span>
                <span className={styles.certValue}>
                  {deletionCert.deletedAt.toLocaleString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className={styles.certRow}>
                <span className={styles.certLabel}>삭제 대상</span>
                <span className={styles.certValue}>{deletionCert.name}</span>
              </div>
              <div className={styles.certRow}>
                <span className={styles.certLabel}>삭제 항목</span>
                <ul className={styles.certItemList}>
                  <li>프로필 정보 (이름, 연락처, 이메일 등)</li>
                  <li>등록 사진 전체</li>
                  <li>매칭 이력 및 관련 데이터</li>
                  <li>매니저 메모</li>
                </ul>
              </div>
              <div className={styles.certRow}>
                <span className={styles.certLabel}>처리 상태</span>
                <span className={styles.certStatusBadge}>
                  <Check size={11} strokeWidth={2.5} />
                  영구 삭제 완료
                </span>
              </div>
              <div className={styles.certRow}>
                <span className={styles.certLabel}>법적 근거</span>
                <span className={styles.certValue}>개인정보보호법 제36조</span>
              </div>
            </div>

            {/* Footer disclaimer */}
            <div className={styles.certFooterWrap}>
              <p className={styles.certFooter}>
                본 확인서는 개인정보 삭제 처리를 증빙하기 위해 발급되었습니다.
              </p>
            </div>

            {/* Actions */}
            <div className={styles.certActions}>
              <button className={styles.certDownloadBtn} onClick={handleDownloadCert}>
                <Download size={15} strokeWidth={2} />
                확인서 다운로드
              </button>
              <button className={styles.certCloseBtn} onClick={() => navigate('/dashboard/clients')}>
                목록으로 돌아가기
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function MatchButton({ client }) {
  const { selectedForMatch, toggleSelectForMatch } = useClientListStore();
  const isSelected = selectedForMatch.some((c) => c.id === client.clientId || c.id === client.id);

  const handleClick = () => {
    const clientForMatch = {
      id: client.clientId || client.id,
      name: client.name,
      nickname: client.nickname,
      gender: client.gender,
      status: client.status || 'active',
    };
    toggleSelectForMatch(clientForMatch);
  };

  return (
    <button
      className={isSelected ? styles.matchBtnActive : styles.matchBtn}
      onClick={handleClick}
    >
      <Heart size={14} /> {isSelected ? '매칭 선택됨' : '매칭 선택'}
    </button>
  );
}

