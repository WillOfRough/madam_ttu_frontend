import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MatchFloatingBar from './MatchFloatingBar';
import useNotificationStore from '../store/notificationStore';
import styles from './DashboardLayout.module.css';

const DESKTOP_QUERY = '(min-width: 769px)';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(DESKTOP_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
    mq.addListener(handler);
    return () => mq.removeListener(handler);
  }, []);

  return isDesktop;
}

function MobileHeader() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  return (
    <header className={styles.mobileHeader}>
      <NavLink to="/dashboard" className={styles.mobileHeaderLogo} aria-label="홈으로">
        <div className={styles.mobileHeaderLogoMark}>K</div>
        <div className={styles.mobileHeaderLogoText}>
          <span className={styles.mobileHeaderLogoTitle}>Knots &amp; Links</span>
          <span className={styles.mobileHeaderLogoSub}>매니저 워크스페이스</span>
        </div>
      </NavLink>
      <div className={styles.mobileHeaderActions}>
        <NavLink to="/dashboard/notifications" className={styles.mobileHeaderIcon} aria-label="알림">
          <Bell size={20} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span className={styles.mobileHeaderBadge} aria-label={`읽지 않은 알림 ${unreadCount}개`} />
          )}
        </NavLink>
        <NavLink to="/dashboard/settings" className={styles.mobileHeaderIcon} aria-label="설정">
          <Settings size={20} strokeWidth={1.8} />
        </NavLink>
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const startPolling = useNotificationStore((s) => s.startPolling);
  const stopPolling = useNotificationStore((s) => s.stopPolling);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    startPolling(30000);
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.container}>
        {!isDesktop && <MobileHeader />}
        <main className={styles.main}>
          <Outlet />
        </main>
        <MatchFloatingBar />
      </div>
      {!isDesktop && <BottomNav />}
    </div>
  );
}
