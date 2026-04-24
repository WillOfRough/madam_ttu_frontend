import { NavLink } from 'react-router-dom';
import { Home, Heart, Users, Bell, MoreHorizontal } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import styles from './BottomNav.module.css';

const TABS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/matches', icon: Heart, label: '매칭' },
  { to: '/dashboard/clients', icon: Users, label: '회원' },
  { to: '/dashboard/notifications', icon: Bell, label: '알림', hasBadge: true },
  { to: '/dashboard/more', icon: MoreHorizontal, label: '더보기' },
];

export default function BottomNav() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <nav className={styles.bottomNav} aria-label="하단 탭 내비게이션">
      {TABS.map(({ to, icon: Icon, label, end, hasBadge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${styles.tab}${isActive ? ` ${styles.active}` : ''}`
          }
          aria-label={label}
        >
          <span className={styles.iconWrap}>
            <Icon size={22} strokeWidth={2} />
            {hasBadge && unreadCount > 0 && (
              <span className={styles.badge} aria-label={`읽지 않은 알림 ${unreadCount}개`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
