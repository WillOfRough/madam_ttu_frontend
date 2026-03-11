import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Link2, Mail, Download, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/clients', icon: Users, label: 'Seeker' },
  { to: '/dashboard/connections', icon: Link2, label: '연결' },
  { to: '/dashboard/invites', icon: Mail, label: '초대' },
  { to: '/dashboard/export', icon: Download, label: '내보내기' },
  { to: '/dashboard/settings', icon: Settings, label: '설정' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const name = useAuthStore((s) => s.name);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoText}>findmyone</span>
      </div>

      {name && (
        <div className={styles.profile}>
          <div className={styles.avatar}>{name.charAt(0)}</div>
          <span className={styles.name}>{name}</span>
        </div>
      )}

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={18} />
        <span>로그아웃</span>
      </button>
    </aside>
  );
}
