import { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MatchFloatingBar from './MatchFloatingBar';
import useNotificationStore from '../store/notificationStore';
import styles from './DashboardLayout.module.css';

function MobileHeader() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <header className={styles.mobileHeader}>
      <span className={styles.mobileHeaderLogo}>Knots &amp; Links</span>
      <div className={styles.mobileHeaderActions}>
        <NavLink to="/dashboard/notifications" className={styles.mobileHeaderIcon}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={styles.mobileHeaderBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>
        <NavLink to="/dashboard/settings" className={styles.mobileHeaderIcon}>
          <Settings size={20} />
        </NavLink>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const startPolling = useNotificationStore((s) => s.startPolling);
  const stopPolling = useNotificationStore((s) => s.stopPolling);

  useEffect(() => {
    startPolling(30000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <MobileHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
      <MatchFloatingBar />
      <BottomNav />
    </div>
  );
}
