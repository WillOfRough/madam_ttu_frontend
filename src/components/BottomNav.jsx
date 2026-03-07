import { NavLink } from 'react-router-dom';
import { Home, Users, Link2, Mail, Settings } from 'lucide-react';
import styles from './BottomNav.module.css';

const TABS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/seekers', icon: Users, label: 'Seeker' },
  { to: '/dashboard/connections', icon: Link2, label: '연결' },
  { to: '/dashboard/invites', icon: Mail, label: '초대' },
  { to: '/dashboard/settings', icon: Settings, label: '설정' },
];

export default function BottomNav() {
  return (
    <nav className={styles.bottomNav}>
      {TABS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.active : ''}`
          }
        >
          <Icon size={20} />
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
