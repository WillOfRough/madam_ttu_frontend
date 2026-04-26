import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Phone, Edit3, Save, X,
  MapPin, Briefcase, GraduationCap, Heart, Camera, ShieldCheck,
} from 'lucide-react';
import { getMyProfile, updateMyProfile, addClientPhotos, deleteClientPhoto } from '../../api/clientService';
import PhotoGallery from '../../components/PhotoGallery';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import { toast } from '../../store/toastStore';
import styles from './MyProfile.module.css';

/* ─── helpers ─── */
function calcAge(birthDate) {
  if (!birthDate) return null;
  const y = new Date(birthDate).getFullYear();
  return new Date().getFullYear() - y;
}

function formatPhone(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return raw;
}

const GENDER_LABEL = { male: '남성', female: '여성' };

/* ─── Skeleton ─── */
function ProfileSkeleton() {
  return (
    <div className={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={styles.skeletonGrid}>
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className={styles.skeletonField}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLabel}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonValue}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Field row ─── */
function FieldRow({ label, value, editMode, inputProps }) {
  if (!editMode && !value) return null;
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {editMode ? (
        <input className={styles.fieldInput} {...inputProps} />
      ) : (
        <span className={styles.fieldValue}>{value || '—'}</span>
      )}
    </div>
  );
}

/* ─── Section card ─── */
function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardIconWrap}>
          <Icon size={15} />
        </div>
        <h3 className={styles.cardTitle}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
export default function MyProfile() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('id');

  /* ── verification state ── */
  const [phone, setPhone] = useState('');
  const [verifyError, setVerifyError] = useState('');

  /* ── profile state ── */
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');

  /* ── edit state ── */
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editVerificationId, setEditVerificationId] = useState('');
  const [editPhone, setEditPhone] = useState('');

  /* ── photo state ── */
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);

  /* ─── photo handlers (no /me refresh — verificationId is single-use) ─── */
  const handlePhotoAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !profile?.id) return;
    setPhotoUploading(true);
    try {
      await addClientPhotos(profile.id, files);
      const newUrls = files.map((f) => URL.createObjectURL(f));
      setProfile((p) => ({ ...p, photoUrls: [...(p?.photoUrls || []), ...newUrls] }));
      toast.success('사진이 추가되었습니다.');
    } catch (err) {
      toast.error(err.message || '사진 추가에 실패했습니다.');
    }
    setPhotoUploading(false);
    e.target.value = '';
  };

  const handlePhotoDelete = async (photoUrl) => {
    if (!profile?.id) return;
    const segments = photoUrl.split('/');
    const photoId = segments[segments.length - 1];
    setDeletingPhotoId(photoId);
    try {
      await deleteClientPhoto(profile.id, photoId);
      setProfile((p) => ({
        ...p,
        photoUrls: (p?.photoUrls || []).filter((u) => u !== photoUrl),
      }));
      toast.success('사진이 삭제되었습니다.');
    } catch (err) {
      toast.error(err.message || '사진 삭제에 실패했습니다.');
    }
    setDeletingPhotoId(null);
  };

  /* ─── phone verified handler (initial profile load) ─── */
  const handlePhoneVerified = async (verificationId) => {
    if (!clientId) {
      setVerifyError('유효하지 않은 링크입니다. 매니저에게 문의해주세요.');
      return;
    }
    if (!verificationId) return;
    setLoading(true);
    setVerifyError('');
    try {
      const data = await getMyProfile({ id: clientId, verificationId });
      setProfile(data);
      setVerifiedPhone(phone);
    } catch (err) {
      const msg = err.message || '';
      const code = err.body?.error;
      if (code === '4.002' || msg.includes('전화번호') || err.status === 404) {
        setVerifyError('회원 정보를 찾을 수 없습니다. 매니저에게 문의해주세요.');
      } else if (code === '7.002' || msg.includes('만료')) {
        setVerifyError('인증이 만료되었습니다. 다시 인증해주세요.');
      } else if (code === '7.004' || msg.includes('verificationId')) {
        setVerifyError('인증이 필요합니다. 다시 인증해주세요.');
      } else {
        setVerifyError(msg || '오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ─── edit handlers ─── */
  const startEdit = useCallback(() => {
    if (!profile) return;
    setEditForm({
      name: profile.name || '',
      nickname: profile.nickname || '',
      birthDate: profile.birthDate || '',
      height: profile.height ? String(profile.height) : '',
      occupation: profile.occupation || '',
      company: profile.company || '',
      workLocation: profile.workLocation || '',
      education: profile.education || '',
      location: profile.location || '',
      religion: profile.religion || '',
      mbti: profile.mbti || '',
      hobbies: profile.hobbies || '',
      introduction: profile.introduction || '',
      idealType: profile.idealType || '',
    });
    setEditPhone(verifiedPhone);
    setEditVerificationId('');
    setEditMode(true);
  }, [profile, verifiedPhone]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditForm({});
    setEditVerificationId('');
    setEditPhone('');
  }, []);

  const field = (key) => ({
    value: editForm[key] ?? '',
    onChange: (e) => setEditForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    if (!editVerificationId) {
      toast.error('수정을 위해 본인 인증이 필요합니다.');
      return;
    }
    setSaving(true);
    try {
      const payload = {};
      for (const [key, val] of Object.entries(editForm)) {
        if (val !== '' && val != null) {
          payload[key] = key === 'height' ? Number(val) : val;
        }
      }
      await updateMyProfile(profile.id, editVerificationId, payload);
      setProfile((p) => ({ ...p, ...payload }));
      setEditMode(false);
      setEditVerificationId('');
      setEditPhone('');
      toast.success('프로필이 저장되었습니다.');
    } catch (err) {
      const code = err.body?.error;
      if (code === '7.002') {
        toast.error('인증이 만료되었습니다. 다시 인증해주세요.');
      } else if (code === '7.004') {
        toast.error('인증이 필요합니다. 다시 인증해주세요.');
        setEditVerificationId('');
      } else {
        toast.error(err.message || '저장에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  /* ══ STATE 1: phone verification ══ */
  if (!profile) {
    return (
      <div className={styles.page}>
        {/* ambient blobs */}
        <div className={styles.blobTop} aria-hidden />
        <div className={styles.blobBottom} aria-hidden />

        <div className={styles.verifyWrap}>
          {/* Brand */}
          <div className={styles.brandRow}>
            <div className={styles.brandMark} />
            <span className={styles.brandName}>Knots &amp; Links</span>
          </div>

          <div className={styles.verifyCard}>
            <div className={styles.verifyIconRing}>
              <Phone size={26} strokeWidth={1.8} />
            </div>
            <h1 className={styles.verifyTitle}>내 프로필 조회</h1>
            <p className={styles.verifyDesc}>
              본인 확인을 위해 가입 시 등록한<br />전화번호를 인증해주세요.
            </p>

            <div className={styles.verifyForm}>
              <PhoneVerifyField
                value={phone}
                onChange={setPhone}
                onVerified={handlePhoneVerified}
                disabled={loading}
              />

              {verifyError && (
                <div className={styles.verifyError}>
                  <X size={13} />
                  <span>{verifyError}</span>
                </div>
              )}

              {loading && (
                <div className={styles.loadingRow}>
                  <span className={styles.btnSpinner} />
                  <span>프로필을 불러오는 중...</span>
                </div>
              )}
            </div>

            <div className={styles.verifyFootnote}>
              <ShieldCheck size={13} />
              개인정보는 안전하게 보호됩니다.
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══ STATE 2: profile view / edit ══ */
  const age = calcAge(profile.birthDate);

  return (
    <div className={styles.page}>
      {/* ambient blobs */}
      <div className={styles.blobTop} aria-hidden />
      <div className={styles.blobBottom} aria-hidden />

      <div className={styles.profileWrap}>

        {/* ── brand bar ── */}
        <div className={styles.brandRow}>
          <div className={styles.brandMark} />
          <span className={styles.brandName}>Knots &amp; Links</span>
        </div>

        {/* ── hero identity strip ── */}
        <div className={styles.heroStrip}>
          <div className={styles.heroInfo}>
            <div className={styles.heroName}>
              {profile.nickname || profile.name}
            </div>
            <div className={styles.heroMeta}>
              {profile.name}
              {age ? ` · ${age}세` : ''}
              {profile.occupation ? ` · ${profile.occupation}` : ''}
            </div>
          </div>
          <div className={styles.heroActions}>
            {!editMode ? (
              <button className={styles.editBtn} onClick={startEdit}>
                <Edit3 size={14} />
                프로필 수정
              </button>
            ) : (
              <div className={styles.editActionRow}>
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saving || !editVerificationId}
                >
                  {saving ? <span className={styles.btnSpinnerSm} /> : <Save size={14} />}
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
                  <X size={14} />
                  취소
                </button>
              </div>
            )}
          </div>
        </div>

        {editMode && (
          <div className={styles.editModeBanner}>
            <Edit3 size={13} />
            수정 모드 — 변경 후 저장 버튼을 눌러주세요
          </div>
        )}

        {editMode && !editVerificationId && (
          <div className={styles.card} style={{ padding: 16 }}>
            <div className={styles.cardHeader} style={{ marginBottom: 8 }}>
              <div className={styles.cardIconWrap}>
                <ShieldCheck size={15} />
              </div>
              <h3 className={styles.cardTitle}>본인 인증</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--ink-700, #4a5568)', margin: '4px 0 12px' }}>
              프로필 수정을 위해 전화번호 재인증이 필요합니다.
            </p>
            <PhoneVerifyField
              value={editPhone}
              onChange={setEditPhone}
              onVerified={(verId) => verId && setEditVerificationId(verId)}
            />
          </div>
        )}

        {loading && <ProfileSkeleton />}

        {!loading && (
          <>
            {/* ── photos ── */}
            <SectionCard icon={Camera} title="사진">
              <PhotoGallery
                photoUrls={profile.photoUrls || []}
                canEdit={true}
                onAdd={handlePhotoAdd}
                onDelete={handlePhotoDelete}
                uploading={photoUploading}
                deletingPhotoId={deletingPhotoId}
              />
            </SectionCard>

            {/* ── 기본 정보 ── */}
            <SectionCard icon={User} title="기본 정보">
              <div className={styles.fields}>
                <FieldRow
                  label="이름"
                  value={profile.name}
                  editMode={editMode}
                  inputProps={{ ...field('name'), placeholder: '이름' }}
                />
                <FieldRow
                  label="닉네임"
                  value={profile.nickname}
                  editMode={editMode}
                  inputProps={{ ...field('nickname'), placeholder: '닉네임' }}
                />
                <FieldRow
                  label="성별"
                  value={GENDER_LABEL[profile.gender] || profile.gender}
                  editMode={false}
                />
                <FieldRow
                  label="생년월일"
                  value={profile.birthDate ? `${profile.birthDate}${age ? ` (${age}세)` : ''}` : null}
                  editMode={editMode}
                  inputProps={{ ...field('birthDate'), type: 'date', placeholder: 'YYYY-MM-DD' }}
                />
                <FieldRow
                  label="전화번호"
                  value={formatPhone(profile.phone)}
                  editMode={false}
                />
                <FieldRow
                  label="키"
                  value={profile.height ? `${profile.height}cm` : null}
                  editMode={editMode}
                  inputProps={{ ...field('height'), type: 'number', placeholder: 'cm', min: 100, max: 250 }}
                />
              </div>
            </SectionCard>

            {/* ── 직업/학력 ── */}
            <SectionCard icon={Briefcase} title="직업 / 학력">
              <div className={styles.fields}>
                <FieldRow
                  label="직업"
                  value={profile.occupation}
                  editMode={editMode}
                  inputProps={{ ...field('occupation'), placeholder: '직업' }}
                />
                <FieldRow
                  label="회사"
                  value={profile.company}
                  editMode={editMode}
                  inputProps={{ ...field('company'), placeholder: '회사명' }}
                />
                <FieldRow
                  label="직장 위치"
                  value={profile.workLocation}
                  editMode={editMode}
                  inputProps={{ ...field('workLocation'), placeholder: '직장 위치' }}
                />
                <FieldRow
                  label="학력"
                  value={profile.education}
                  editMode={editMode}
                  inputProps={{ ...field('education'), placeholder: '최종학력' }}
                />
              </div>
            </SectionCard>

            {/* ── 라이프스타일 ── */}
            <SectionCard icon={MapPin} title="라이프스타일">
              <div className={styles.fields}>
                <FieldRow
                  label="거주지"
                  value={profile.location}
                  editMode={editMode}
                  inputProps={{ ...field('location'), placeholder: '거주지역' }}
                />
                <FieldRow
                  label="종교"
                  value={profile.religion}
                  editMode={editMode}
                  inputProps={{ ...field('religion'), placeholder: '종교' }}
                />
                <FieldRow
                  label="MBTI"
                  value={profile.mbti}
                  editMode={editMode}
                  inputProps={{ ...field('mbti'), placeholder: 'MBTI', maxLength: 4, style: { textTransform: 'uppercase' } }}
                />
                <FieldRow
                  label="취미"
                  value={profile.hobbies}
                  editMode={editMode}
                  inputProps={{ ...field('hobbies'), placeholder: '취미 (예: 독서, 요리)' }}
                />
              </div>
            </SectionCard>

            {/* ── 자기소개 ── */}
            <SectionCard icon={GraduationCap} title="자기소개">
              {editMode ? (
                <textarea
                  className={styles.textarea}
                  {...field('introduction')}
                  placeholder="자신을 자유롭게 소개해주세요."
                  rows={4}
                />
              ) : (
                <p className={styles.bioText}>
                  {profile.introduction || <span className={styles.emptyText}>작성된 내용이 없습니다.</span>}
                </p>
              )}
            </SectionCard>

            {/* ── 이상형 ── */}
            <SectionCard icon={Heart} title="이상형">
              {editMode ? (
                <textarea
                  className={styles.textarea}
                  {...field('idealType')}
                  placeholder="원하는 이상형을 자유롭게 써주세요."
                  rows={4}
                />
              ) : (
                <p className={styles.bioText}>
                  {profile.idealType || <span className={styles.emptyText}>작성된 내용이 없습니다.</span>}
                </p>
              )}
            </SectionCard>

          </>
        )}

        {/* ── inquiry ghost button ── */}
        <div className={styles.inquiryBannerWrap}>
          <div className={styles.inquiryBanner}>
            <span>수정이 필요한 사항이 있으신가요?</span>
            <a className={styles.inquiryLink} href={`/inquiry?id=${profile?.id}`}>
              수정 문의하기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
