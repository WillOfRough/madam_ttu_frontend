import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit3, Trash2, X,
  ShieldCheck, Download, Copy, Link2, ChevronDown, Plus, Shield, Check,
} from 'lucide-react';
import * as clientService from '../../api/clientService';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import { SkeletonLine } from '../../components/Skeleton';
import html2pdf from 'html2pdf.js';
import styles from './ClientDetail.module.css';

// ── helpers ──────────────────────────────────────────────
function parseKeywordsText(str) {
  if (!str) return { keywords: [], text: '' };
  const m = str.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
  if (m) return { keywords: m[1].split(',').map((k) => k.trim()).filter(Boolean), text: m[2].trim() };
  return { keywords: [], text: str };
}

const STATUS_LABELS = {
  active: '활동', inactive: '휴면', dormant: '휴면', suspended: '일시중지', withdrawn: '탈퇴',
};
const STATUS_OPTIONS = [
  { value: 'active',    label: '활동' },
  { value: 'inactive',  label: '휴면' },
  { value: 'suspended', label: '일시중지' },
  { value: 'withdrawn', label: '탈퇴' },
];

// ── KeyChip ──────────────────────────────────────────────
const KEY_CHIP_TONES = {
  tangerine: { bg: 'var(--tangerine-50)',        fg: 'var(--tangerine-700)' },
  ink:       { bg: 'var(--ink-50)',               fg: 'var(--ink-900)' },
  lilac:     { bg: 'rgba(122,95,214,.1)',         fg: 'var(--lilac-600)' },
  mint:      { bg: 'var(--mint-100)',             fg: '#1A7A50' },
  rose:      { bg: '#FDE2E7',                     fg: 'var(--rose-600)' },
};
const TONE_CYCLE = ['tangerine', 'ink', 'lilac', 'mint', 'rose'];

function KeyChip({ tone = 'tangerine', children }) {
  const { bg, fg } = KEY_CHIP_TONES[tone] || KEY_CHIP_TONES.tangerine;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 999, background: bg, color: fg,
      fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em',
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

// ── SectionHeader ─────────────────────────────────────────
function SectionHeader({ title, sub, right }) {
  return (
    <div className={styles.sectionHeaderRow}>
      <div className={styles.sectionHeaderLeft}>
        <span className={styles.sectionTitle}>{title}</span>
        {sub && <span className={styles.sectionSub}>{sub}</span>}
      </div>
      {right}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();

  const [client, setClient]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [matchHistory, setMatchHistory] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);

  // status dropdown
  const [statusOpen, setStatusOpen]   = useState(false);
  const statusWrapRef                 = useRef(null);

  // note / memo
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);

  // copy link
  const [copiedKind, setCopiedKind]   = useState(null); // 'raw' | 'mask'

  // withdraw bottom sheet
  const [sheetOpen, setSheetOpen]     = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [deletionCert, setDeletionCert] = useState(null);
  const certRef                       = useRef(null);

  // approval modal state
  const [modal, setModal]             = useState(null); // 'approve' | 'reject'

  // inline edit
  const [editing, setEditing]         = useState(false);
  const [editForm, setEditForm]       = useState({});
  const [editSaving, setEditSaving]   = useState(false);

  // photo upload
  const photoInputRef                 = useRef(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // ── copy timeout ──
  useEffect(() => {
    if (!copiedKind) return;
    const t = setTimeout(() => setCopiedKind(null), 1600);
    return () => clearTimeout(t);
  }, [copiedKind]);

  // ── close status dropdown on outside click ──
  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e) => {
      if (statusWrapRef.current && !statusWrapRef.current.contains(e.target)) {
        setStatusOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  // ── load client + match history ──
  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    clientService.getClientDetail(clientId)
      .then((data) => {
        setClient(data);
        setNote(data.managerNote || '');
      })
      .catch(() => navigate('/dashboard/clients'))
      .finally(() => setLoading(false));

    setMatchLoading(true);
    matchService.listMatches({ clientId, size: 100 })
      .then((res) => {
        const list = res.data || res.matches || [];
        setMatchHistory([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      })
      .catch(() => {})
      .finally(() => setMatchLoading(false));
  }, [clientId, navigate]);

  // ── derived ──
  const isMale     = client?.gender === 'male';
  const birthYear  = client?.birthDate ? parseInt(client.birthDate.slice(0, 4)) : null;
  const age        = birthYear ? new Date().getFullYear() - birthYear : client?.age;
  const introData  = parseKeywordsText(client?.introduction);
  const idealData  = parseKeywordsText(client?.idealType);
  const hobbiesList = (() => {
    if (!client?.hobbies) return [];
    if (Array.isArray(client.hobbies)) return client.hobbies;
    return client.hobbies.split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
  })();
  const photoUrls  = client?.photoUrls || [];
  const matchCount = matchHistory.length;

  // ── status change ──
  const handleStatusChange = async (newStatus) => {
    setStatusOpen(false);
    try {
      await clientService.updateClientStatus(clientId, newStatus);
      setClient((c) => ({ ...c, status: newStatus }));
      toast.success(`상태가 "${STATUS_LABELS[newStatus] || newStatus}"(으)로 변경되었습니다.`);
    } catch (err) {
      toast.error(err.message || '상태 변경에 실패했습니다.');
    }
  };

  // ── profile link ──
  const getProfileEditUrl = () => {
    if (!client?.id) return null;
    return `${window.location.origin}/my-profile?id=${client.id}`;
  };

  const handleCopyRaw = async () => {
    const url = getProfileEditUrl();
    if (!url) { toast.error('초대 토큰 정보가 없습니다.'); return; }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKind('raw');
    } catch { /* silent */ }
  };

  const handleCopyMask = async () => {
    const url = getProfileEditUrl();
    if (!url) { toast.error('초대 토큰 정보가 없습니다.'); return; }
    const name = client?.nickname || client?.name || '회원';
    const msg = `안녕하세요, ${name}님! Knots & Links 매니저입니다.\n\n더 좋은 매칭을 위해 프로필 정보를 최신 상태로 유지해 주시면 좋겠어요.\n아래 링크를 통해 직접 프로필을 확인하고 수정하실 수 있습니다.\n\n${url}\n\n정보가 정확할수록 더 어울리는 인연을 찾아드릴 수 있어요.\n궁금한 점이 있으시면 언제든 연락 주세요!`;
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedKind('mask');
    } catch { /* silent */ }
  };

  // ── memo save ──
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

  // ── approval ──
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

  // ── inline edit ──
  const startEditing = () => {
    setEditForm({
      name:         client.name || '',
      nickname:     client.nickname || '',
      birthDate:    client.birthDate || '',
      phone:        client.phone || '',
      height:       client.height || '',
      occupation:   client.occupation || '',
      company:      client.company || '',
      workLocation: client.workLocation || '',
      education:    client.education || '',
      location:     client.location || '',
      religion:     client.religion || '',
      mbti:         client.mbti || '',
      hobbies:      Array.isArray(client.hobbies) ? client.hobbies.join(', ') : (client.hobbies || ''),
      introduction: client.introduction || '',
      idealType:    client.idealType || '',
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

  // ── photo ──
  const handlePhotoAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
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
    const seg = photoUrl.split('/');
    const photoId = seg[seg.length - 1];
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

  // ── delete / withdraw ──
  const handleDeleteClient = async () => {
    setDeleting(true);
    try {
      const clientName = client.name;
      await clientService.deleteClient(clientId);
      toast.success('회원이 삭제되었습니다.');
      setSheetOpen(false);
      setDeletionCert({ name: clientName, deletedAt: new Date() });
    } catch (err) {
      toast.error(err.message || '삭제에 실패했습니다.');
      setDeleting(false);
      setSheetOpen(false);
    }
  };

  const handleDownloadCert = async () => {
    if (!deletionCert || !certRef.current) return;
    const { name, deletedAt } = deletionCert;
    const actionsEl = certRef.current.querySelector(`.${styles.certActions}`);
    if (actionsEl) actionsEl.style.display = 'none';
    certRef.current.style.animation = 'none';
    certRef.current.querySelectorAll('*').forEach((el) => { el.style.animation = 'none'; });
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
      certRef.current.querySelectorAll('*').forEach((el) => { el.style.animation = ''; });
    }
  };

  // ── invite info ──
  const inviteManagerName = client?.inviteToken?.managerName
    || client?.createdBy?.name
    || client?.ownerManager?.name
    || null;
  const inviteLabel = client?.inviteToken?.label || client?.inviteToken?.name || '링크 가입';

  // ── timeline dot class ──
  const timelineDotClass = (status) => {
    if (!status) return styles.dotInk;
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('success') || s.includes('accepted')) return styles.dotMint;
    if (s.includes('progress') || s.includes('pending') || s.includes('payment') || s.includes('proposal')) return styles.dotAmber;
    return styles.dotInk;
  };

  const timelineLabel = (m) => {
    const isA = m.clientA?.clientId === clientId;
    const partnerName = isA ? (m.clientB?.clientName || '상대') : (m.clientA?.clientName || '상대');
    const statusMap = {
      draft: '대기', proposal_sent: '제안 발송', proposal_accepted: '상대 수락',
      awaiting_payment: '입금 대기', scheduling: '일정 조율', arranging: '조율 확정',
      scheduled: '약속 확정', completed: '완료', cancelled: '취소',
    };
    const statusLabel = statusMap[m.status] || m.status || '';
    return { title: `${partnerName}님과 매칭 · ${statusLabel}`, sub: new Date(m.createdAt).toLocaleDateString('ko-KR') };
  };

  // ── LOADING ──
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <SkeletonLine width="100px" height="16px" />
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SkeletonLine width="40%" height="28px" />
            <SkeletonLine width="100%" height="200px" />
            <SkeletonLine width="100%" height="120px" />
          </div>
        </div>
      </div>
    );
  }

  if (!client) return null;

  const currentStatus = client.status || 'active';
  const currentStatusLabel = STATUS_LABELS[currentStatus] || '활동';

  return (
    <div className={styles.page}>

      {/* ══ 1. Sticky Top Nav ══ */}
      <div className={styles.topNav}>
        <button
          className={styles.backBtn}
          onClick={() => navigate('/dashboard/clients')}
          aria-label="목록으로"
        >
          <ChevronLeft size={22} />
        </button>
        <span className={styles.topNavTitle}>회원 상세</span>
      </div>

      {/* ══ 2. Hero Card ══ */}
      <div className={styles.hero}>
        <div className={styles.heroCard}>
          <div className={styles.heroLayout}>
            {/* Left: Identity */}
            <div className={styles.heroIdentity}>
              <div className={`${styles.avatar} ${isMale ? styles.avatarMale : styles.avatarFemale}`}>
                {client.name ? client.name.slice(1) : '?'}
              </div>

              <div className={styles.heroInfo}>
                <div className={styles.heroNameRow}>
                  <span className={styles.heroName}>{client.name}</span>
                  <span className={`${styles.genderBadge} ${isMale ? styles.genderBadgeMale : styles.genderBadgeFemale}`}>
                    {isMale ? '남' : '여'}
                  </span>
                  {age && (
                    <span className={styles.heroAge}>{age}</span>
                  )}
                  {age && client.height && <span className={styles.heroDot}>·</span>}
                  {client.height && (
                    <span className={styles.heroHeight}>{client.height}cm</span>
                  )}
                </div>

                {client.nickname && (
                  <div className={styles.heroNickname}>"{client.nickname}"</div>
                )}

                <div className={styles.heroBadges}>
                  <span className={styles.badgeMint}>
                    <span className={styles.badgeMintDot} />
                    활성
                  </span>
                  {client.isOwner && (
                    <span className={styles.badgeInk}>내 회원</span>
                  )}
                  {!client.isOwner && client.ownerManager && (
                    <span className={styles.badgeInk}>{client.ownerManager.name}의 회원</span>
                  )}
                  <span className={styles.badgeOutline}>매칭 {matchCount}건</span>
                </div>
              </div>
            </div>

            {/* Right: Approval cluster (only when pending) */}
            {client.isOwner && client.approvalStatus === 'pending' && (
              <div className={styles.actionCluster}>
                <button className={styles.approveBtn} onClick={() => handleApproval('approved')}>
                  <Check size={13} /> 승인
                </button>
                <button className={styles.rejectBtn} onClick={() => handleApproval('rejected')}>
                  거절
                </button>
              </div>
            )}
          </div>

          {/* Footer: invite info (left) + status dropdown (right) */}
          {client.isOwner && (
            <div className={styles.heroFooter}>
              <div className={styles.inviteChip}>
                <Link2 size={11} color="var(--ink-400)" style={{ flexShrink: 0 }} />
                <span className={styles.inviteChipText}>
                  {inviteManagerName
                    ? <><span className={styles.inviteChipManager}>{inviteManagerName}</span><span className={styles.inviteDot}>·</span>{inviteLabel}</>
                    : <span style={{ color: 'var(--ink-400)' }}>가입 경로 없음</span>
                  }
                </span>
              </div>

              <div className={styles.statusWrap} ref={statusWrapRef}>
                <button className={styles.statusBtn} onClick={() => setStatusOpen((o) => !o)}>
                  {currentStatusLabel}
                  <ChevronDown size={13} color="var(--ink-400)" />
                </button>
                {statusOpen && (
                  <div className={styles.statusDropdown}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.statusOption} ${currentStatus === opt.value ? styles.statusOptionActive : ''}`}
                        onClick={() => handleStatusChange(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Read-only notice */}
        {!client.isOwner && (
          <div className={styles.readonlyNotice}>
            이 회원은 {client.ownerManager?.name || '다른 매니저'}님이 관리하는 프로필입니다. 열람만 가능합니다.
          </div>
        )}
      </div>

      {/* ══ Sections ══ */}
      <div className={styles.sections}>

        {/* ── Inline Edit Form (replaces all content) ── */}
        {editing ? (
          <>
            <SectionHeader title="프로필 수정" />
            <div className={styles.editCard}>
              <div className={styles.editFields}>
                {[
                  { key: 'name',         label: '이름' },
                  { key: 'nickname',     label: '닉네임' },
                  { key: 'birthDate',    label: '생년월일', placeholder: 'yyyy-MM-dd' },
                  { key: 'phone',        label: '연락처', placeholder: '010-XXXX-XXXX' },
                  { key: 'height',       label: '키', type: 'number' },
                  { key: 'occupation',   label: '직업' },
                  { key: 'company',      label: '회사' },
                  { key: 'workLocation', label: '회사 위치' },
                  { key: 'education',    label: '학력' },
                  { key: 'location',     label: '거주지역' },
                  { key: 'religion',     label: '종교' },
                  { key: 'mbti',         label: 'MBTI', placeholder: 'INTJ' },
                  { key: 'hobbies',      label: '취미 (쉼표 구분)' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key} className={styles.editFieldItem}>
                    <span className={styles.editFieldLabel}>{label}</span>
                    <input
                      className={styles.editInput}
                      type={type || 'text'}
                      value={editForm[key] || ''}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
                <div className={styles.editFieldItem}>
                  <span className={styles.editFieldLabel}>자기소개</span>
                  <textarea
                    className={styles.editTextarea}
                    rows={3}
                    value={editForm.introduction || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, introduction: e.target.value }))}
                    maxLength={1000}
                  />
                </div>
                <div className={styles.editFieldItem}>
                  <span className={styles.editFieldLabel}>이상형</span>
                  <textarea
                    className={styles.editTextarea}
                    rows={3}
                    value={editForm.idealType || ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, idealType: e.target.value }))}
                    maxLength={500}
                  />
                </div>
              </div>
              <div className={styles.editActions}>
                <button className={styles.editSaveBtn} onClick={handleEditSave} disabled={editSaving}>
                  {editSaving ? '저장 중...' : '저장'}
                </button>
                <button className={styles.editCancelBtn} onClick={() => setEditing(false)}>취소</button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── 5. 기본 정보 ── */}
            <SectionHeader
              title="기본 정보"
              right={
                client.isOwner && (
                  <button className={styles.sectionEditBtn} onClick={startEditing}>
                    <Edit3 size={13} /> 편집
                  </button>
                )
              }
            />
            <div className={styles.card}>
              <div className={styles.infoGrid}>
                {[
                  ['별명',     client.nickname || '-'],
                  ['성별',     isMale ? '남성' : '여성'],
                  ['출생연도', birthYear ? `${birthYear}년 (${age}세)` : (age ? `${age}세` : '-')],
                  ['연락처',   client.phone || '-'],
                  ['거주지역', client.location || '-'],
                  ['키',       client.height ? `${client.height}cm` : '-'],
                  ['직업',     client.occupation || '-'],
                  ['회사',     client.company || '-'],
                  ['학력',     client.education || '-'],
                  ['회사 장소', client.workLocation || '-'],
                  ['종교',     client.religion || '-'],
                  ['MBTI',     client.mbti || '-'],
                ].map(([label, value]) => (
                  <span key={label} style={{ display: 'contents' }}>
                    <span className={styles.infoLabel}>{label}</span>
                    <span className={styles.infoValue}>{value}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* ── 6. 사진 ── */}
            <SectionHeader title="사진" sub={`${photoUrls.length}장 등록`} />
            <div className={styles.card}>
              <div className={styles.photosRow}>
                {photoUrls.map((url, i) => (
                  <div
                    key={url}
                    className={styles.photoThumb}
                    onClick={() => setLightboxUrl(url)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={url}
                      alt={i === 0 ? '대표 사진' : `사진 ${i + 1}`}
                      className={styles.photoImg}
                    />
                    <span className={styles.photoLabel}>{i === 0 ? '대표' : `#${i + 1}`}</span>
                    {deletingPhotoId && url.endsWith(deletingPhotoId) && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 8,
                      }}>
                        <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>삭제 중...</span>
                      </div>
                    )}
                  </div>
                ))}
                {client.isOwner && (
                  <>
                    <button
                      className={styles.photoAddBtn}
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                    >
                      <Plus size={16} />
                      {photoUploading ? '업로드 중' : '사진 추가'}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handlePhotoAdd}
                    />
                  </>
                )}
              </div>
              <div className={styles.photoHint}>
                워터마크 자동 적용 · 상대에게 전달 시에만 공개돼요.
              </div>
            </div>

            {/* ── 7a. 자기소개 ── */}
            {(introData.keywords.length > 0 || introData.text) && (
              <>
                <SectionHeader title="자기소개" />
                <div className={styles.card}>
                  {introData.keywords.length > 0 && (
                    <div className={styles.keyChips}>
                      {introData.keywords.map((kw, i) => (
                        <KeyChip key={kw} tone={TONE_CYCLE[i % TONE_CYCLE.length]}>{kw}</KeyChip>
                      ))}
                    </div>
                  )}
                  {introData.text && (
                    <p className={styles.narrativeText}>{introData.text}</p>
                  )}
                </div>
              </>
            )}

            {/* ── 7b. 이상형 ── */}
            {(idealData.keywords.length > 0 || idealData.text) && (
              <>
                <SectionHeader title="이상형" />
                <div className={styles.card}>
                  {idealData.keywords.length > 0 && (
                    <div className={styles.keyChips}>
                      {idealData.keywords.map((kw, i) => (
                        <KeyChip key={kw} tone={TONE_CYCLE[(i + 2) % TONE_CYCLE.length]}>{kw}</KeyChip>
                      ))}
                    </div>
                  )}
                  {idealData.text && (
                    <p className={styles.narrativeText}>{idealData.text}</p>
                  )}
                </div>
              </>
            )}

            {/* ── 8. 취미·관심사 ── */}
            {hobbiesList.length > 0 && (
              <>
                <SectionHeader title="취미·관심사" />
                <div className={styles.hobbiesRow}>
                  {hobbiesList.map((h) => (
                    <span key={h} className={styles.hobbyChip}>{h}</span>
                  ))}
                </div>
              </>
            )}

            {/* ── 9. 프로필 수정 링크 공유 ── */}
            {client.isOwner && client.inviteToken && (
              <>
                <SectionHeader title="프로필 수정 링크 공유" />
                <div className={styles.card}>
                  <p className={styles.profileLinkDesc}>
                    회원에게 보내어 프로필 수정 페이지에 진입할 수 있도록 할 수 있어요.
                    아래의 마스킹 복사는 회원에게 보낼 수 있는 내용으로 복사돼요.
                  </p>
                  <div className={styles.copyBtnRow}>
                    <button
                      className={`${styles.copyBtnRaw} ${copiedKind === 'raw' ? styles.copyBtnRawDone : ''}`}
                      onClick={handleCopyRaw}
                    >
                      {copiedKind === 'raw' ? <Check size={13} /> : <Copy size={13} />}
                      {copiedKind === 'raw' ? '복사됨!' : '원본 복사'}
                    </button>
                    <button
                      className={`${styles.copyBtnMask} ${copiedKind === 'mask' ? styles.copyBtnMaskDone : ''}`}
                      onClick={handleCopyMask}
                    >
                      {copiedKind === 'mask' ? <Check size={13} /> : <Shield size={13} />}
                      {copiedKind === 'mask' ? '복사됨!' : '마스킹 복사'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── 10. 매니저 메모 ── */}
            {(client.isOwner || client.managerNote) && (
              <>
                <SectionHeader title="매니저 메모" />
                <div className={styles.card}>
                  {client.isOwner ? (
                    <>
                      <textarea
                        className={styles.memoTextarea}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="메모를 입력하세요..."
                      />
                      <div className={styles.memoFooter}>
                        <button
                          className={styles.memoSaveBtn}
                          onClick={handleSaveNote}
                          disabled={saving}
                        >
                          {saving ? '저장 중...' : '메모 저장'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className={styles.narrativeText}>{client.managerNote}</p>
                  )}
                </div>
              </>
            )}

            {/* ── 11. 매칭 히스토리 ── */}
            <SectionHeader title="매칭 히스토리" sub={`${matchCount}건의 인연 기록`} />
            <div className={styles.card}>
              {matchLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <SkeletonLine width="100%" height="44px" />
                  <SkeletonLine width="100%" height="44px" />
                </div>
              ) : matchHistory.length === 0 ? (
                <p className={styles.emptyHistory}>매칭 이력이 없습니다.</p>
              ) : (
                <div className={styles.timeline}>
                  <div className={styles.timelineTrack} />
                  {matchHistory.map((m) => {
                    const { title, sub } = timelineLabel(m);
                    const accessible = m.accessible !== false;
                    const handleOpen = () => {
                      if (!accessible) {
                        toast.info('연결된 매니저의 매칭입니다. 열람 권한이 없습니다.');
                        return;
                      }
                      navigate(`/dashboard/matches/${m.matchId}`);
                    };
                    return (
                      <div
                        key={m.matchId}
                        className={`${styles.timelineItem} ${accessible ? '' : styles.timelineItemDisabled}`}
                        onClick={handleOpen}
                        role="button"
                        tabIndex={0}
                        aria-disabled={!accessible}
                        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
                      >
                        <div className={`${styles.timelineDot} ${timelineDotClass(m.status)}`} />
                        <div className={styles.timelineContent}>
                          <div className={styles.timelineTitleRow}>
                            <div className={styles.timelineTitle}>{title}</div>
                            {!accessible && (
                              <span className={styles.timelineReadOnlyBadge}>열람 불가</span>
                            )}
                          </div>
                          <div className={styles.timelineSub}>{sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ Danger Zone — 회원 삭제 (bottom-right corner) ══ */}
      {client.isOwner && !editing && (
        <div className={styles.dangerZone}>
          <button className={styles.deleteMemberBtn} onClick={() => setSheetOpen(true)}>
            <Trash2 size={13} /> 회원 삭제
          </button>
        </div>
      )}

      {/* ══ 12. Delete Bottom Sheet ══ */}
      {sheetOpen && createPortal(
        <div className={styles.sheetOverlay} onClick={() => !deleting && setSheetOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetTitle}>{client.name}님을 삭제할까요?</div>
            <p className={styles.sheetDesc}>
              개인정보는 즉시 파기되며, 삭제 후 회원 삭제 확인서가 발급돼요. 이 동작은 되돌릴 수 없어요.
            </p>
            <div className={styles.sheetBtns}>
              <button
                className={styles.sheetCancelBtn}
                onClick={() => setSheetOpen(false)}
                disabled={deleting}
              >
                취소
              </button>
              <button
                className={styles.sheetDangerBtn}
                onClick={handleDeleteClient}
                disabled={deleting}
              >
                {deleting ? '처리 중...' : '회원 삭제'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Photo Lightbox ── */}
      {lightboxUrl && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxUrl(null)}
        >
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxUrl(null)}
              aria-label="닫기"
            >
              <X size={20} />
            </button>
            <img src={lightboxUrl} alt="사진 미리보기" className={styles.lightboxImg} />
            {client.isOwner && (
              <button
                className={styles.lightboxDeleteBtn}
                onClick={() => { handlePhotoDelete(lightboxUrl); setLightboxUrl(null); }}
                disabled={!!deletingPhotoId}
              >
                <Trash2 size={14} />
                {deletingPhotoId ? '삭제 중...' : '이 사진 삭제'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Deletion Certificate Overlay ── */}
      {deletionCert && createPortal(
        <div className={styles.certOverlay}>
          <div className={styles.certModal} ref={certRef}>
            <div className={styles.certAccentBar} />
            <div className={styles.certHeader}>
              <div className={styles.certIconWrap}>
                <ShieldCheck size={22} strokeWidth={2} />
              </div>
              <div className={styles.certHeaderText}>
                <p className={styles.certOrg}>Knots &amp; Links</p>
                <h2 className={styles.certTitle}>개인정보 삭제 확인서</h2>
                <p className={styles.certDocId}>
                  문서번호 · KL-DEL-{deletionCert.deletedAt.getFullYear()}{String(deletionCert.deletedAt.getMonth() + 1).padStart(2, '0')}{String(deletionCert.deletedAt.getDate()).padStart(2, '0')}
                </p>
              </div>
            </div>
            <div className={styles.certDivider} />
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
            <div className={styles.certFooterWrap}>
              <p className={styles.certFooter}>
                본 확인서는 개인정보 삭제 처리를 증빙하기 위해 발급되었습니다.
              </p>
            </div>
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
        </div>,
        document.body
      )}
    </div>
  );
}
