import { NavLink } from 'react-router-dom';
import { Home, Users, Heart, Link2, Mail, BookOpen, MessageSquare } from 'lucide-react';
import styles from './BottomNav.module.css';

const TABS = [
  { to: '/dashboard', icon: Home, label: '홈', end: true },
  { to: '/dashboard/clients', icon: Users, label: '회원' },
  { to: '/dashboard/matches', icon: Heart, label: '매칭' },
  { to: '/dashboard/connections', icon: Link2, label: '네트워크' },
  { to: '/dashboard/invites', icon: Mail, label: '초대' },
  { to: '/dashboard/inquiries', icon: MessageSquare, label: '문의' },
  { to: '/dashboard/guide', icon: BookOpen, label: '가이드' },
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
