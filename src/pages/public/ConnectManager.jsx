import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Link2, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import styles from './ConnectManager.module.css';

export default function ConnectManager() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to={`/register/${token}`} replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>
            <div className={styles.brandDot} />
          </div>
          <span className={styles.brandName}>Knots &amp; Links</span>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrap}>
            <Link2 size={28} />
          </div>
          <h1 className={styles.title}>이미 가입된 계정입니다</h1>
          <p className={styles.message}>
            이 초대 링크는 미가입자 전용입니다. 이미 매니저로 가입되어 있으므로 사용할 수 없습니다.
            매니저 간 네트워크는 네트워크 관리에서 이메일 검색을 통해 요청할 수 있습니다.
          </p>
          <button className={styles.btn} onClick={() => navigate('/dashboard/connections')}>
            네트워크 관리로 이동
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
