import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useManagerStore from '../../store/managerStore';
import styles from './Settings.module.css';

export default function Settings() {
  const email = useAuthStore((s) => s.email);
  const name = useAuthStore((s) => s.name);
  const logout = useAuthStore((s) => s.logout);
  const info = useManagerStore((s) => s.info);
  const fetchInfo = useManagerStore((s) => s.fetchInfo);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>설정</h1>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <User size={18} />
          <h3>내 정보</h3>
        </div>
        <div className={styles.fields}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>이름</span>
            <span className={styles.fieldValue}>{info?.name || name || '-'}</span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>이메일</span>
            <span className={styles.fieldValue}>{info?.email || email || '-'}</span>
          </div>
          {info?.connections != null && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>연결된 매니저</span>
              <span className={styles.fieldValue}>{info.connections.length}명</span>
            </div>
          )}
          {info?.myClientCount != null && (
            <div className={styles.field}>
              <span className={styles.fieldLabel}>내 Seeker</span>
              <span className={styles.fieldValue}>{info.myClientCount}명</span>
            </div>
          )}
        </div>
      </div>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} />
        로그아웃
      </button>
    </div>
  );
}
