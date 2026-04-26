import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, Link2, Mail, Heart, Settings, LogOut, BookOpen, Bell, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/clients', icon: Users, label: '회원 관리' },
  { to: '/dashboard/matches', icon: Heart, label: '매칭' },
  { to: '/dashboard/connections', icon: Link2, label: '네트워크' },
  { to: '/dashboard/invites', icon: Mail, label: '초대' },
  { to: '/dashboard/notifications', icon: Bell, label: '알림', badge: true },
  { to: '/dashboard/inquiries', icon: MessageSquare, label: '문의' },
  { to: '/dashboard/guide', icon: BookOpen, label: '가이드' },
];

const FOOTER_ITEMS = [
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

  const firstName = name ? name.replace(/매니저$/, '').trim() : '';
  const initial = firstName ? firstName.charAt(firstName.length > 1 ? 1 : 0) : '?';

  const renderNavItem = ({ to, icon: Icon, label, end, badge }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.navIconWrap}>
        <Icon size={18} strokeWidth={1.8} />
        {badge && unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </span>
      <span className={styles.navLabel}>{label}</span>
    </NavLink>
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand} onClick={() => navigate('/dashboard')}>
        <div className={styles.brandMark}>K</div>
        <div className={styles.brandText}>
          <div className={styles.brandTitle}>Knots & Links</div>
          <div className={styles.brandSub}>매니저 워크스페이스</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(renderNavItem)}
        <div className={styles.navDivider} />
        {FOOTER_ITEMS.map(renderNavItem)}
      </nav>

      {name && (
        <div className={styles.profileFooter}>
          <div className={styles.profileAvatar}>{initial}</div>
          <div className={styles.profileMeta}>
            <div className={styles.profileName}>{firstName || name}</div>
            <div className={styles.profileSub}>매니저</div>
          </div>
          <button className={styles.profileLogout} onClick={handleLogout} aria-label="로그아웃">
            <LogOut size={15} strokeWidth={1.8} />
          </button>
        </div>
      )}
    </aside>
  );
}
