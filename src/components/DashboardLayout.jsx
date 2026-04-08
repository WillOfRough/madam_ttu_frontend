import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import MatchFloatingBar from './MatchFloatingBar';
import useNotificationStore from '../store/notificationStore';
import styles from './DashboardLayout.module.css';

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
      <main className={styles.main}>
        <Outlet />
      </main>
      <MatchFloatingBar />
      <BottomNav />
    </div>
  );
}
