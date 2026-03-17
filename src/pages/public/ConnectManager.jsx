import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import styles from './ConnectManager.module.css';

export default function ConnectManager() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // 미로그인 시 바로 회원가입 페이지로 이동
  if (!isLoggedIn) {
    return <Navigate to={`/register/${token}`} replace />;
  }

  // 이미 로그인한 사용자: 초대 토큰은 미가입자 전용이므로 안내 메시지 표시
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <Link2 size={32} />
        </div>
        <h1 className={styles.title}>이미 가입된 계정입니다</h1>
        <p className={styles.message}>
          이 초대 링크는 미가입자 전용입니다. 이미 매니저로 가입되어 있으므로 사용할 수 없습니다.
          매니저 간 네트워크는 네트워크 관리에서 이메일 검색을 통해 요청할 수 있습니다.
        </p>
        <button className={styles.btn} onClick={() => navigate('/dashboard/connections')}>
          네트워크 관리로 이동
        </button>
      </div>
    </div>
  );
}
