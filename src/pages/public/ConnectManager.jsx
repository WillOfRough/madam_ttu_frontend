import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import * as connectionService from '../../api/connectionService';
import styles from './ConnectManager.module.css';

export default function ConnectManager() {
  const { token } = useParams();
  const navigate = useNavigate();
  const managerId = useAuthStore((s) => s.managerId);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      await connectionService.joinConnection(token);
      setStatus('success');
    } catch (err) {
      setError(err.message || '연결에 실패했습니다.');
      setStatus('error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.iconWrap}>
          <Link2 size={32} />
        </div>

        {status === 'success' ? (
          <>
            <h1 className={styles.title}>연결 완료!</h1>
            <p className={styles.message}>매니저와 성공적으로 연결되었습니다.</p>
            <button className={styles.btn} onClick={() => navigate('/dashboard/connections')}>
              연결 관리로 이동
            </button>
          </>
        ) : (
          <>
            <h1 className={styles.title}>매니저 연결 초대</h1>
            <p className={styles.message}>
              {isLoggedIn
                ? '이 초대를 수락하면 상대 매니저와 Seeker 풀을 공유하게 됩니다.'
                : '연결을 수락하려면 먼저 로그인이 필요합니다.'}
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.btn}
              onClick={handleConnect}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '연결 중...' : isLoggedIn ? '연결 수락' : '로그인하러 가기'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
