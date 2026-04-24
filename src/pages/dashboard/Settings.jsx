import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Pencil, Save, X, Lock, Eye, EyeOff, DollarSign, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useManagerStore from '../../store/managerStore';
import { changePassword } from '../../api/authService';
import { toast } from '../../store/toastStore';
import { BANK_OPTIONS } from '../../data/constants';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import Settlement from './Settlement';
import styles from './Settings.module.css';

export default function Settings() {
  const email = useAuthStore((s) => s.email);
  const name = useAuthStore((s) => s.name);
  const logout = useAuthStore((s) => s.logout);
  const info = useManagerStore((s) => s.info);
  const fetchInfo = useManagerStore((s) => s.fetchInfo);
  const updateInfo = useManagerStore((s) => s.updateInfo);
  const navigate = useNavigate();

  // dev 환경에서는 모든 매니저가 정산 탭을 볼 수 있도록 개방
  const canSeeSettlement = true;
  const [settingsTab, setSettingsTab] = useState('settings');

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
  }, [fetchInfo]);

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
    if (pwForm.newPw.length < 6) { toast.error('새 비밀번호는 6자 이상이어야 합니다.'); return; }
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
      toast.error(err.message || '비밀번호 변경에 실패했습니다.');
    }
    setPwSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // ── Settlement tab view ──
  if (canSeeSettlement && settingsTab === 'settlement') {
    return (
      <div className={styles.page} style={{ maxWidth: 720 }}>
        <div className={styles.tabWrap}>
          <button
            className={`${styles.tabBtn} ${styles.tabBtnInactive}`}
            onClick={() => setSettingsTab('settings')}
          >
            <User size={14} /> 설정
          </button>
          <button className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
            <DollarSign size={14} /> 정산
          </button>
        </div>
        <Settlement />
      </div>
    );
  }

  // ── Display name for avatar initial ──
  const displayName = info?.name || name || '';
  const initial = displayName ? displayName[0] : '?';

  return (
    <div className={styles.page}>
      {/* ── Tab row ── */}
      {canSeeSettlement && (
        <div className={styles.tabWrap}>
          <button className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
            <User size={14} /> 설정
          </button>
          <button
            className={`${styles.tabBtn} ${styles.tabBtnInactive}`}
            onClick={() => setSettingsTab('settlement')}
          >
            <DollarSign size={14} /> 정산
          </button>
        </div>
      )}

      {/* ── Page title ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>설정</h1>
        <p className={styles.pageSubtitle}>내 정보와 보안 설정을 관리합니다</p>
      </div>

      {/* ── Profile hero card ── */}
      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>{initial}</div>
        <div className={styles.profileMeta}>
          <div className={styles.profileName}>{displayName || '-'} 매니저</div>
          <div className={styles.profileEmail}>{info?.email || email || '-'}</div>
          {info?.myClientCount != null && (
            <div className={styles.profileStats}>
              <span>회원 <strong>{info.myClientCount}</strong>명</span>
              {info?.connections != null && (
                <span>네트워크 <strong>{info.connections.length}</strong>명</span>
              )}
            </div>
          )}
        </div>
        {!editing && (
          <button className={styles.profileEditBtn} onClick={handleStartEdit}>
            <Pencil size={13} /> 수정
          </button>
        )}
      </div>

      {/* ── Section: 계정 정보 ── */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeader}>
          <User size={13} />
          계정 정보
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
            <div className={styles.formField}>
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
            <div className={styles.formField}>
              <label className={styles.formLabel}>이메일</label>
              <span className={styles.formReadonly}>{info?.email || email || '-'}</span>
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                <Save size={13} /> {saving ? '저장 중...' : '저장'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                <X size={13} /> 취소
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
      </div>

      {/* ── Section: 보안 ── */}
      <div className={styles.sectionGroup}>
        <div className={styles.sectionHeader}>
          <Lock size={13} />
          보안
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
                  placeholder="6자 이상"
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
              <button className={styles.saveBtn} onClick={handlePasswordChange} disabled={pwSaving}>
                <Save size={13} /> {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => { setPwOpen(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
                disabled={pwSaving}
              >
                <X size={13} /> 취소
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.rowList}>
            <button
              className={styles.rowBtn}
              onClick={() => setPwOpen(true)}
            >
              <Lock size={16} className={styles.rowBtnIcon} />
              <span className={styles.rowBtnLabel}>비밀번호 변경</span>
              <ChevronRight size={15} className={styles.rowBtnChevron} />
            </button>
          </div>
        )}
      </div>

      {/* ── Destructive: logout ── */}
      <div className={styles.logoutWrap}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </div>
  );
}
