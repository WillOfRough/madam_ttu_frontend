import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Pencil, Save, X, Lock, Eye, EyeOff, DollarSign } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useManagerStore from '../../store/managerStore';
import { changePassword } from '../../api/authService';
import { toast } from '../../store/toastStore';
import { BANK_OPTIONS } from '../../data/constants';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import Settlement from './Settlement';
import styles from './Settings.module.css';

const SETTLEMENT_EMAIL = 'minting118@naver.com';

export default function Settings() {
  const email = useAuthStore((s) => s.email);
  const name = useAuthStore((s) => s.name);
  const logout = useAuthStore((s) => s.logout);
  const info = useManagerStore((s) => s.info);
  const fetchInfo = useManagerStore((s) => s.fetchInfo);
  const updateInfo = useManagerStore((s) => s.updateInfo);
  const navigate = useNavigate();

  const canSeeSettlement = email === SETTLEMENT_EMAIL;
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

  if (canSeeSettlement && settingsTab === 'settlement') {
    return (
      <div className={styles.page} style={{ maxWidth: 720 }}>
        <div className={styles.settingsTabWrap}>
          <button
            className={`${styles.settingsTabBtn} ${styles.settingsTabBtnInactive}`}
            onClick={() => setSettingsTab('settings')}
          >
            <User size={15} /> 설정
          </button>
          <button className={`${styles.settingsTabBtn} ${styles.settingsTabBtnActive}`}>
            <DollarSign size={15} /> 정산
          </button>
        </div>
        <Settlement />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {canSeeSettlement && (
        <div className={styles.settingsTabWrap}>
          <button className={`${styles.settingsTabBtn} ${styles.settingsTabBtnActive}`}>
            <User size={15} /> 설정
          </button>
          <button
            className={`${styles.settingsTabBtn} ${styles.settingsTabBtnInactive}`}
            onClick={() => setSettingsTab('settlement')}
          >
            <DollarSign size={15} /> 정산
          </button>
        </div>
      )}
      <h1 className={styles.title}>설정</h1>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <User size={18} />
            <h3>내 정보</h3>
          </div>
          {!editing && (
            <button className={styles.editBtn} onClick={handleStartEdit}>
              <Pencil size={14} /> 수정
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
                <Save size={14} /> {saving ? '저장 중...' : '저장'}
              </button>
              <button className={styles.cancelBtn} onClick={handleCancel} disabled={saving}>
                <X size={14} /> 취소
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.fields}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>이름</span>
              <span className={styles.fieldValue}>{info?.name || name || '-'}</span>
            </div>
            {info?.nickname && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>닉네임</span>
                <span className={styles.fieldValue}>{info.nickname}</span>
              </div>
            )}
            <div className={styles.field}>
              <span className={styles.fieldLabel}>이메일</span>
              <span className={styles.fieldValue}>{info?.email || email || '-'}</span>
            </div>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>연락처</span>
              <span className={styles.fieldValue}>{info?.phone || '-'}</span>
            </div>
            {info?.connections != null && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>네트워크</span>
                <span className={styles.fieldValue}>{info.connections.length}명</span>
              </div>
            )}
            {info?.myClientCount != null && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>내 회원</span>
                <span className={styles.fieldValue}>{info.myClientCount}명</span>
              </div>
            )}
            {(info?.bankName && info?.bankNumber) && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>정산 계좌</span>
                <span className={styles.fieldValue}>{info.bankName} {info.bankNumber}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderLeft}>
            <Lock size={18} />
            <h3>비밀번호 변경</h3>
          </div>
          {!pwOpen && (
            <button className={styles.editBtn} onClick={() => setPwOpen(true)}>
              <Pencil size={14} /> 변경
            </button>
          )}
        </div>
        {pwOpen && (
          <div className={styles.editForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>현재 비밀번호</label>
              <div className={styles.pwInputWrap}>
                <input
                  className={styles.formInput}
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  placeholder="현재 비밀번호"
                />
                <button type="button" className={styles.pwToggle} onClick={() => setShowCurrent((v) => !v)}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>새 비밀번호</label>
              <div className={styles.pwInputWrap}>
                <input
                  className={styles.formInput}
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPw}
                  onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                  placeholder="6자 이상"
                />
                <button type="button" className={styles.pwToggle} onClick={() => setShowNew((v) => !v)}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>새 비밀번호 확인</label>
              <div className={styles.pwInputWrap}>
                <input
                  className={styles.formInput}
                  type={showConfirm ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="새 비밀번호 재입력"
                />
                <button type="button" className={styles.pwToggle} onClick={() => setShowConfirm((v) => !v)}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handlePasswordChange} disabled={pwSaving}>
                <Save size={14} /> {pwSaving ? '변경 중...' : '비밀번호 변경'}
              </button>
              <button className={styles.cancelBtn} onClick={() => { setPwOpen(false); setPwForm({ current: '', newPw: '', confirm: '' }); }} disabled={pwSaving}>
                <X size={14} /> 취소
              </button>
            </div>
          </div>
        )}
      </div>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} />
        로그아웃
      </button>
    </div>
  );
}
