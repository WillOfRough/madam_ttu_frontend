import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Users, Heart } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import UserTable from './UserTable';
import ProfileCard from './ProfileCard';
import MatchSimulation from './MatchSimulation';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, selectedUserId, matchSourceId } = useAdminStore();

  useEffect(() => {
    if (!isAuthenticated) navigate('/admin');
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/admin');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Users size={22} />
            마담MJ의 회원 관리
          </h2>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          로그아웃
        </button>
      </div>

      <div className={styles.content}>
        {/* Main Table */}
        <UserTable />

        {/* Side Panel: Profile or Match */}
        {(selectedUserId || matchSourceId) && (
          <div className={styles.sidePanel}>
            {matchSourceId ? <MatchSimulation /> : <ProfileCard />}
          </div>
        )}
      </div>
    </div>
  );
}
