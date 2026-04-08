import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Link2, Mail, Heart, Settings, LogOut, BookOpen, Bell } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/clients', icon: Users, label: '회원' },
  { to: '/dashboard/matches', icon: Heart, label: '매칭' },
  { to: '/dashboard/connections', icon: Link2, label: '네트워크' },
  { to: '/dashboard/invites', icon: Mail, label: '초대' },
  { to: '/dashboard/notifications', icon: Bell, label: '알림', badge: true },
  { to: '/dashboard/guide', icon: BookOpen, label: '가이드' },
  { to: '/dashboard/settings', icon: Settings, label: '설정' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const name = useAuthStore((s) => s.name);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <span className={styles.logoText}>Knots & Links</span>
      </div>

      {name && (
        <div className={styles.profile}>
          <div className={styles.avatar}>{name.charAt(0)}</div>
          <span className={styles.name}>{name}</span>
        </div>
      )}

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIconWrap}>
              <Icon size={18} />
              {badge && unreadCount > 0 && (
                <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </span>
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
