import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User, Phone, Edit3, Save, X, CheckCircle2,
  MapPin, Briefcase, GraduationCap, Heart, Camera, SlidersHorizontal,
} from 'lucide-react';
import { getMyProfile, updateMyProfile, addMyPhotos, deleteMyPhoto } from '../../api/clientService';
import PhotoGallery from '../../components/PhotoGallery';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import RangeSlider from '../../components/RangeSlider';
import { AGE_BOUNDS, HEIGHT_BOUNDS } from '../../store/clientFormStore';
import { toast } from '../../store/toastStore';
import styles from './MyProfile.module.css';


function formatPhone(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  return raw;
}

const GENDER_LABEL = { male: '남성', female: '여성' };

/* 선호 나이/키 범위 키 — handleSave 의 generic 루프에서 제외하고 별도 처리 */
const PREFERRED_KEYS = new Set([
  'preferredAgeMin', 'preferredAgeMax', 'preferredAgeAny',
  'preferredHeightMin', 'preferredHeightMax', 'preferredHeightAny',
]);

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
// eslint-disable-next-line no-unused-vars
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
  const [verificationId, setVerificationId] = useState('');

  /* ── completion state (저장 성공 후 완료 화면) ── */
  const [completed, setCompleted] = useState(false);

  /* ── edit state ── */
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  /* ── photo state ── */
  const [photoUploading, setPhotoUploading] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState(null);

  /* ─── photo handlers ─── */
  const refreshProfile = async () => {
    try {
      const data = await getMyProfile({ id: clientId, verificationId });
      setProfile(data);
    } catch { /* silent */ }
  };

  const handlePhotoAdd = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !profile?.id) return;
    setPhotoUploading(true);
    try {
      await addMyPhotos(profile.id, verificationId, files);
      await refreshProfile();
      toast.success('사진이 추가되었습니다.');
    } catch (err) {
      toast.error(err.message || '사진 추가에 실패했습니다.');
    }
    setPhotoUploading(false);
    e.target.value = '';
  };

  const handlePhotoDelete = async (photoUrl) => {
    if (!profile?.id) return;
    // photoUrl 예: /api/v1/clients/me/photos/{photoId}?clientId=...&verificationId=...
    // 쿼리스트링을 먼저 떼고 마지막 경로 세그먼트(photoId)를 추출한다.
    const photoId = photoUrl.split('?')[0].split('/').pop();
    setDeletingPhotoId(photoId);
    try {
      await deleteMyPhoto(profile.id, verificationId, photoId);
      await refreshProfile();
      toast.success('사진이 삭제되었습니다.');
    } catch (err) {
      toast.error(err.message || '사진 삭제에 실패했습니다.');
    }
    setDeletingPhotoId(null);
  };

  /* ─── phone verified handler (called after OTP success) ─── */
  const handlePhoneVerified = async (verId) => {
    if (!clientId) {
      setVerifyError('유효하지 않은 링크입니다. 매니저에게 문의해주세요.');
      return;
    }
    if (!verId) return;
    setLoading(true);
    setVerifyError('');
    try {
      const data = await getMyProfile({ id: clientId, verificationId: verId });
      setProfile(data);
      setVerifiedPhone(phone);
      setVerificationId(verId);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('전화번호') || msg.includes('404') || err.status === 404) {
        setVerifyError('전화번호가 일치하지 않습니다. 다시 확인해주세요.');
      } else if (msg.includes('토큰') || msg.includes('초대')) {
        setVerifyError('유효하지 않은 링크입니다. 매니저에게 문의해주세요.');
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
      preferredAgeMin: profile.preferredAgeMin ?? 25,
      preferredAgeMax: profile.preferredAgeMax ?? 40,
      // 신규 필드 — 기존 회원은 범위가 비어 있을 수 있다. 범위가 없으면 '상관없음'으로
      // 시작해, 손대지 않고 저장 시 임의 기본값이 선호값으로 기록되는 것을 막는다.
      preferredAgeAny: profile.preferredAgeMin == null || profile.preferredAgeMax == null,
      preferredHeightMin: profile.preferredHeightMin ?? 160,
      preferredHeightMax: profile.preferredHeightMax ?? 185,
      preferredHeightAny: profile.preferredHeightMin == null || profile.preferredHeightMax == null,
    });
    setEditMode(true);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditForm({});
  }, []);

  const field = (key) => ({
    value: editForm[key] ?? '',
    onChange: (e) => setEditForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    const payload = {};
    for (const [key, val] of Object.entries(editForm)) {
      if (PREFERRED_KEYS.has(key)) continue; // 선호 범위는 아래에서 별도 처리
      if (val !== '' && val != null) {
        payload[key] = key === 'height' ? Number(val) : val;
      }
    }
    // 선호 나이/키 범위 — '상관없음'이면 min/max는 null (clientFormStore 규칙과 동일)
    payload.preferredAgeAny = !!editForm.preferredAgeAny;
    payload.preferredAgeMin = editForm.preferredAgeAny ? null : editForm.preferredAgeMin;
    payload.preferredAgeMax = editForm.preferredAgeAny ? null : editForm.preferredAgeMax;
    payload.preferredHeightAny = !!editForm.preferredHeightAny;
    payload.preferredHeightMin = editForm.preferredHeightAny ? null : editForm.preferredHeightMin;
    payload.preferredHeightMax = editForm.preferredHeightAny ? null : editForm.preferredHeightMax;
    setSaving(true);
    try {
      await updateMyProfile(clientId, verifiedPhone, verificationId, payload);
      setCompleted(true);
    } catch (err) {
      toast.error(err.message || '저장에 실패했습니다. 매니저에게 받은 링크로 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  /* ══ STATE 0: 저장 완료 ══ */
  if (completed) {
    return (
      <div className={styles.page}>
        <div className={styles.verifyWrap}>
          <div className={styles.brandRow}>
            <div className={styles.brandMark} />
            <span className={styles.brandName}>Knots &amp; Links</span>
          </div>

          <div className={styles.verifyCard}>
            <div className={`${styles.verifyIconRing} ${styles.doneIconRing}`}>
              <CheckCircle2 size={28} strokeWidth={1.8} />
            </div>
            <h1 className={styles.verifyTitle}>수정이 완료되었습니다</h1>
            <p className={styles.verifyDesc}>
              프로필 변경사항이 안전하게 저장되었습니다.<br />
              추가로 수정하실 내용이 있다면 매니저에게<br />
              받은 링크로 다시 접속해주세요.
            </p>
            <p className={styles.verifyFootnote}>
              이 창은 안전하게 닫으셔도 됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ══ STATE 1: phone verification ══ */
  if (!profile) {
    return (
      <div className={styles.page}>
        <div className={styles.verifyWrap}>
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
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <span className={styles.btnSpinner} />
                </div>
              )}
            </div>

            <p className={styles.verifyFootnote}>
              개인정보는 안전하게 보호됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ══ STATE 2: profile view / edit ══ */

  /* 선호 조건 표시 텍스트 (ClientDetail 과 동일 규칙) */
  const prefAgeText = profile.preferredAgeAny
    ? '상관없음'
    : (profile.preferredAgeMin != null && profile.preferredAgeMax != null
        ? `${profile.preferredAgeMin}~${profile.preferredAgeMax}세`
        : null);
  const prefHeightText = profile.preferredHeightAny
    ? '상관없음'
    : (profile.preferredHeightMin != null && profile.preferredHeightMax != null
        ? `${profile.preferredHeightMin}~${profile.preferredHeightMax}cm`
        : null);

  return (
    <div className={styles.page}>
      <div className={styles.profileWrap}>

        {/* ── top brand bar ── */}
        <div className={styles.brandRow}>
          <div className={styles.brandMark} />
          <span className={styles.brandName}>Knots &amp; Links</span>
        </div>

        {/* ── action buttons ── */}
        <div className={styles.actionBar}>
          {!editMode ? (
            <>
              <button className={styles.editBtn} onClick={startEdit}>
                <Edit3 size={15} />
                프로필 수정
              </button>
            </>
          ) : (
            <>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? <span className={styles.btnSpinnerSm} /> : <Save size={15} />}
                {saving ? '저장 중...' : '저장'}
              </button>
              <button className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
                <X size={15} />
                취소
              </button>
            </>
          )}
        </div>

        {editMode && (
          <div className={styles.editModeBanner}>
            <Edit3 size={13} />
            수정 모드 — 변경 후 저장 버튼을 눌러주세요
          </div>
        )}

        {loading && <ProfileSkeleton />}

        {!loading && (
          <>
            {/* ── photos ── */}
            <SectionCard icon={Camera} title="사진">
              <PhotoGallery
                photoUrls={profile.photoUrls || []}
                canEdit={editMode}
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
                  label="출생연도"
                  value={profile.birthDate ? `${profile.birthDate.slice(2, 4)}년생` : null}
                  editMode={editMode}
                  inputProps={{
                    value: editForm.birthDate ? editForm.birthDate.slice(0, 4) : '',
                    onChange: (e) => {
                      const year = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setEditForm((f) => ({ ...f, birthDate: year ? `${year}-01-01` : '' }));
                    },
                    type: 'text',
                    inputMode: 'numeric',
                    maxLength: 4,
                    placeholder: 'YYYY (예: 1990)',
                  }}
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

            {/* ── 선호 조건 (선호 나이·키 범위) ── */}
            <SectionCard icon={SlidersHorizontal} title="선호 조건">
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <RangeSlider
                    label="선호 나이"
                    unit="세"
                    min={AGE_BOUNDS.min}
                    max={AGE_BOUNDS.max}
                    valueMin={editForm.preferredAgeMin}
                    valueMax={editForm.preferredAgeMax}
                    onChange={({ min, max }) =>
                      setEditForm((f) => ({ ...f, preferredAgeMin: min, preferredAgeMax: max }))}
                    anyChecked={editForm.preferredAgeAny}
                    onToggleAny={(v) => setEditForm((f) => ({ ...f, preferredAgeAny: v }))}
                    hint="연상·연하·동갑 중 어느 폭이 편한지 알려주세요."
                  />
                  <RangeSlider
                    label="선호 키"
                    unit="cm"
                    min={HEIGHT_BOUNDS.min}
                    max={HEIGHT_BOUNDS.max}
                    valueMin={editForm.preferredHeightMin}
                    valueMax={editForm.preferredHeightMax}
                    onChange={({ min, max }) =>
                      setEditForm((f) => ({ ...f, preferredHeightMin: min, preferredHeightMax: max }))}
                    anyChecked={editForm.preferredHeightAny}
                    onToggleAny={(v) => setEditForm((f) => ({ ...f, preferredHeightAny: v }))}
                    hint="편안하게 마주할 수 있는 키의 범위를 골라주세요."
                  />
                </div>
              ) : (
                <div className={styles.fields}>
                  <FieldRow label="선호 나이" value={prefAgeText || '미설정'} editMode={false} />
                  <FieldRow label="선호 키" value={prefHeightText || '미설정'} editMode={false} />
                </div>
              )}
            </SectionCard>

          </>
        )}
      </div>
    </div>
  );
}
