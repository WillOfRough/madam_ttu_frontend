import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  User,
  Pencil,
  Save,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Shield,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useManagerStore from '../../store/managerStore';
import useManagerInviteStore from '../../store/managerInviteStore';
import { changePassword } from '../../api/authService';
import { getApiErrorMessage } from '../../api/config';
import { toast } from '../../store/toastStore';
import { BANK_OPTIONS } from '../../data/constants';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import styles from './Settings.module.css';

// change-password 에러 매핑 (API 스펙 기준)
//  401(1.001) 현재 비밀번호 틀림 / 400 3.001 새 비번 불일치 / 400 3.002 최근 비번 재사용
function resolvePasswordChangeError(err) {
  if (err?.status === 401) return '현재 비밀번호가 올바르지 않습니다.';
  const code = err?.body?.error;
  if (code === '3.001') return '새 비밀번호가 일치하지 않습니다.';
  if (code === '3.002') return '최근에 사용한 비밀번호는 다시 사용할 수 없어요.';
  return getApiErrorMessage(err, '비밀번호 변경에 실패했습니다.');
}

export default function Settings() {
  const email = useAuthStore((s) => s.email);
  const name = useAuthStore((s) => s.name);
  const logout = useAuthStore((s) => s.logout);
  const info = useManagerStore((s) => s.info);
  const fetchInfo = useManagerStore((s) => s.fetchInfo);
  const updateInfo = useManagerStore((s) => s.updateInfo);
  const quota = useManagerInviteStore((s) => s.quota);
  const fetchInvites = useManagerInviteStore((s) => s.fetchInvites);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', phone: '', bankName: '', bankNumber: '' });
  const [saving, setSaving] = useState(false);
  const [phoneVerificationId, setPhoneVerificationId] = useState(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchInfo();
    fetchInvites({ page: 1, limit: 1 });
  }, [fetchInfo, fetchInvites]);

  const handleStartEdit = () => {
    setForm({
      name: info?.name || name || '',
      nickname: info?.nickname || '',
      phone: info?.phone || '',
      bankName: info?.bankName || '',
      bankNumber: info?.bankNumber || '',
    });
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    const phoneChanged = (form.phone.trim() || '') !== (info?.phone || '');
    if (phoneChanged && !phoneVerificationId) {
      toast.error('전화번호 변경은 본인인증이 필요합니다.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        nickname: form.nickname.trim() || undefined,
        ...(phoneChanged ? { phone: form.phone.trim(), verificationId: phoneVerificationId } : {}),
        bankName: form.bankName || undefined,
        bankNumber: form.bankNumber.trim() || undefined,
      };
      await updateInfo(payload);
      toast.success('정보가 수정되었습니다.');
      setEditing(false);
      setPhoneVerificationId(null);
    } catch (err) {
      toast.error(err.message || '정보 수정에 실패했습니다.');
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!pwForm.current) { toast.error('현재 비밀번호를 입력해주세요.'); return; }
    if (pwForm.newPw.length < 8) { toast.error('새 비밀번호는 8자 이상이어야 합니다.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast.error('새 비밀번호가 일치하지 않습니다.'); return; }
    setPwSaving(true);
    try {
      await changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
        confirmPassword: pwForm.confirm,
      });
      toast.success('비밀번호가 변경되었습니다.');
      setPwOpen(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(resolvePasswordChangeError(err));
    }
    setPwSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ── Display values ──
  const displayName = info?.name || name || '';
  const initial = displayName ? displayName[0] : '?';
  const isUnlimited = quota?.limit === null;
  const quotaLimit = isUnlimited ? null : (quota?.limit ?? 3);
  const quotaRemaining = quota?.remaining ?? (isUnlimited ? null : 1);
  const quotaUsed = quota?.used ?? (isUnlimited ? 0 : (quotaLimit - (quotaRemaining ?? 0)));
  const usedRatio = !isUnlimited && quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0;
  const isScarce = !isUnlimited && (quotaRemaining ?? 0) <= 1;

  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <header className={styles.pageHeader}>
        <span className={styles.pageEyebrow}>
          <Sparkles size={11} /> Account · Knots &amp; Links
        </span>
        <h1 className={styles.pageTitle}>설정</h1>
        <p className={styles.pageSubtitle}>내 정보·보안·초대 권한을 한눈에 관리하세요.</p>
      </header>

      {/* ── Bento grid ── */}
      <div className={styles.bento}>
        {/* Profile hero ────────────────────────────────────────────── */}
        <section className={`${styles.card} ${styles.heroCard}`}>
          <div className={styles.heroRow}>
            <div className={styles.heroAvatar}>{initial}</div>
            <div className={styles.heroMeta}>
              <div className={styles.heroName}>{displayName || '-'} 매니저</div>
              <div className={styles.heroEmail}>{info?.email || email || '-'}</div>
              <div className={styles.heroStats}>
                {info?.myClientCount != null && (
                  <span className={styles.heroStat}>
                    회원 <strong>{info.myClientCount}</strong>명
                  </span>
                )}
                {info?.connections != null && (
                  <span className={styles.heroStat}>
                    네트워크 <strong>{info.connections.length}</strong>명
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Scarcity / invite quota ─────────────────────────────────── */}
        <section className={`${styles.card} ${styles.scarcityCard}`}>
          <div className={styles.scarcityHeader}>
            <span className={styles.scarcityLabel}>나의 초대 권한</span>
            <span className={styles.scarcityIconWrap} aria-hidden="true">
              {isUnlimited ? <Sparkles size={13} strokeWidth={2.5} /> : <AlertTriangle size={13} strokeWidth={2.5} />}
            </span>
          </div>
          <div className={styles.scarcityCount}>
            {isUnlimited ? (
              <span className={styles.scarcityCountNum}>무제한</span>
            ) : (
              <>
                <span className={styles.scarcityCountNum}>{quotaRemaining}</span>
                <span className={styles.scarcityCountDenom}>/ {quotaLimit} 장</span>
              </>
            )}
          </div>
          <p className={styles.scarcityCaption}>
            {isUnlimited ? (
              <>
                관리자 계정은 초대권을 <strong>무제한</strong>으로 사용할 수 있습니다.
              </>
            ) : isScarce ? (
              <>
                현재 사용 가능한 초대권이 <strong>{quotaRemaining}장</strong>뿐입니다. 신중하게 사용하세요.
              </>
            ) : (
              <>
                남은 초대권 <strong>{quotaRemaining}장</strong>. 적절한 시점에 사용하세요.
              </>
            )}
          </p>
          {!isUnlimited && (
            <div className={styles.scarcityBar}>
              <div
                className={styles.scarcityBarFill}
                style={{ width: `${usedRatio}%` }}
              />
            </div>
          )}
          <div className={styles.scarcityFooter}>
            <span>
              {isUnlimited ? `사용 ${quotaUsed} · 잔여 무제한` : `사용 ${quotaUsed} · 잔여 ${quotaRemaining}`}
            </span>
            <button
              type="button"
              className={styles.scarcityLink}
              onClick={() => navigate('/dashboard/invites')}
            >
              초대 관리 <ArrowUpRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </section>

        {/* Account info ────────────────────────────────────────────── */}
        <section className={`${styles.card} ${styles.accountCard}`}>
          <div className={styles.cardHead}>
            <div className={styles.cardHeadLeft}>
              <span className={styles.cardIconWrap}><User size={15} /></span>
              <div>
                <div className={styles.cardTitle}>계정 정보</div>
                <div className={styles.cardSubtitle}>표시 이름과 연락처, 정산 계좌를 관리합니다.</div>
              </div>
            </div>
            {!editing && (
              <button className={styles.cardEditBtn} onClick={handleStartEdit}>
                <Pencil size={11} /> 수정
              </button>
            )}
          </div>

          {editing ? (
            <div className={styles.editForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>이름</label>
                <input
                  className={styles.formInput}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="이름"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>닉네임</label>
                <input
                  className={styles.formInput}
                  value={form.nickname}
                  onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                  placeholder="닉네임 (선택)"
                />
              </div>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.formLabel}>연락처</label>
                <PhoneVerifyField
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  onVerified={setPhoneVerificationId}
                  inputClassName={styles.formInput}
                  initialVerified={!!info?.phone && form.phone === info.phone}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>은행명</label>
                <select
                  className={styles.formSelect}
                  value={form.bankName}
                  onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                >
                  <option value="">은행 선택</option>
                  {BANK_OPTIONS.map((bank) => (
                    <option key={bank.value} value={bank.value}>{bank.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>계좌번호</label>
                <input
                  className={styles.formInput}
                  value={form.bankNumber}
                  onChange={(e) => setForm((f) => ({ ...f, bankNumber: e.target.value }))}
                  placeholder="계좌번호 (-없이 입력)"
                />
              </div>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label className={styles.formLabel}>이메일</label>
                <span className={styles.formReadonly}>{info?.email || email || '-'}</span>
              </div>
              <div className={styles.formActions}>
                <button className={styles.primaryBtn} onClick={handleSave} disabled={saving}>
                  <Save size={13} /> {saving ? '저장 중...' : '변경 사항 저장'}
                </button>
                <button className={styles.ghostBtn} onClick={handleCancel} disabled={saving}>
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.rowList}>
              {[
                { label: '이름', value: info?.name || name || '-' },
                ...(info?.nickname ? [{ label: '닉네임', value: info.nickname }] : []),
                { label: '이메일', value: info?.email || email || '-' },
                { label: '연락처', value: info?.phone || '-' },
                ...((info?.bankName && info?.bankNumber)
                  ? [{ label: '정산 계좌', value: `${info.bankName} ${info.bankNumber}` }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className={styles.row}>
                  <span className={styles.rowLabel}>{label}</span>
                  <span className={styles.rowValue}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Security ────────────────────────────────────────────────── */}
        <section className={`${styles.card} ${styles.securityCard}`}>
          <div className={styles.cardHead}>
            <div className={styles.cardHeadLeft}>
              <span className={styles.cardIconWrap}><Shield size={15} /></span>
              <div>
                <div className={styles.cardTitle}>보안</div>
                <div className={styles.cardSubtitle}>비밀번호와 인증을 관리합니다.</div>
              </div>
            </div>
          </div>

          {pwOpen ? (
            <div className={styles.editForm}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>현재 비밀번호</label>
                <div className={styles.pwWrap}>
                  <input
                    className={styles.formInput}
                    type={showCurrent ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                    placeholder="현재 비밀번호"
                  />
                  <button type="button" className={styles.pwToggle} onClick={() => setShowCurrent((v) => !v)}>
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>새 비밀번호</label>
                <div className={styles.pwWrap}>
                  <input
                    className={styles.formInput}
                    type={showNew ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                    placeholder="8자 이상"
                  />
                  <button type="button" className={styles.pwToggle} onClick={() => setShowNew((v) => !v)}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>새 비밀번호 확인</label>
                <div className={styles.pwWrap}>
                  <input
                    className={styles.formInput}
                    type={showConfirm ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    placeholder="새 비밀번호 재입력"
                  />
                  <button type="button" className={styles.pwToggle} onClick={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className={styles.formActions}>
                <button className={styles.primaryBtn} onClick={handlePasswordChange} disabled={pwSaving}>
                  <Save size={13} /> {pwSaving ? '변경 중...' : '비밀번호 변경'}
                </button>
                <button
                  className={styles.ghostBtn}
                  onClick={() => { setPwOpen(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
                  disabled={pwSaving}
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className={styles.rowBtn} onClick={() => setPwOpen(true)}>
                <span className={styles.rowBtnIcon}><Lock size={16} /></span>
                <span className={styles.rowBtnText}>
                  <span className={styles.rowBtnLabel}>비밀번호 변경</span>
                  <span className={styles.rowBtnHint}>최소 8자 · 영문·숫자 권장</span>
                </span>
                <ChevronRight size={16} className={styles.rowBtnChevron} />
              </button>
              <div className={styles.securityMeta}>
                <span className={styles.securityDot} />
                계정이 안전하게 보호되고 있습니다.
              </div>
            </>
          )}
        </section>
      </div>

      {/* ── Footer: subtle logout ── */}
      <div className={styles.footer}>
        <span className={styles.footerText}>이 기기에서 안전하게 로그아웃합니다.</span>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={14} /> 로그아웃
        </button>
      </div>
    </div>
  );
}
