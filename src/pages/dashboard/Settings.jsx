import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Pencil, Save, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useManagerStore from '../../store/managerStore';
import { toast } from '../../store/toastStore';
import styles from './Settings.module.css';

export default function Settings() {
  const email = useAuthStore((s) => s.email);
  const name = useAuthStore((s) => s.name);
  const logout = useAuthStore((s) => s.logout);
  const info = useManagerStore((s) => s.info);
  const fetchInfo = useManagerStore((s) => s.fetchInfo);
  const updateInfo = useManagerStore((s) => s.updateInfo);
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', nickname: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleStartEdit = () => {
    setForm({
      name: info?.name || name || '',
      nickname: info?.nickname || '',
      phone: info?.phone || '',
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
    setSaving(true);
    try {
      await updateInfo({
        name: form.name.trim(),
        nickname: form.nickname.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      toast.success('정보가 수정되었습니다.');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || '정보 수정에 실패했습니다.');
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
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
              <input
                className={styles.formInput}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="010-0000-0000"
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
            {info?.phone && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>연락처</span>
                <span className={styles.fieldValue}>{info.phone}</span>
              </div>
            )}
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
