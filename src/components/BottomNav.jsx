import { NavLink } from 'react-router-dom';
import { Home, Heart, Users } from 'lucide-react';
import styles from './BottomNav.module.css';

const TABS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/matches', icon: Heart, label: '매칭' },
  { to: '/dashboard/clients', icon: Users, label: '회원' },
];

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav} aria-label="하단 탭 내비게이션">
      {TABS.map(({ to, icon: Icon, label, end }) => (
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
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
