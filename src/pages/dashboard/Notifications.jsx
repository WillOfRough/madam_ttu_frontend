import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import Pagination from '../../components/Pagination';
import styles from './Notifications.module.css';

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function getNotificationUrl(referenceType, referenceId) {
  switch (referenceType) {
    case 'match': return `/dashboard/matches/${referenceId}`;
    case 'client': return `/dashboard/clients/${referenceId}`;
    case 'connection_request': return '/dashboard/connections';
    default: return '/dashboard/notifications';
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const pagination = useNotificationStore((s) => s.pagination);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNotifications({ page: page - 1, size: 20 });
  }, [page, fetchNotifications]);

  const totalPages = pagination ? Math.ceil(pagination.totalCount / 20) : 1;

  const handleItemClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    const url = getNotificationUrl(notification.referenceType, notification.referenceId);
    navigate(url);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Bell size={20} className={styles.headerIcon} />
          <h1 className={styles.title}>알림</h1>
        </div>
        {hasUnread && (
          <button className={styles.readAllBtn} onClick={handleMarkAllAsRead}>
            <CheckCheck size={15} />
            전체 읽음
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonMessage} />
              <div className={styles.skeletonTime} />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <Bell size={36} className={styles.emptyIcon} />
          <p>알림이 없습니다.</p>
        </div>
      ) : (
        <>
          <ul className={styles.list} role="list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`${styles.item} ${!notification.read ? styles.itemUnread : ''}`}
                onClick={() => handleItemClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleItemClick(notification)}
                aria-label={`${notification.title}: ${notification.message}`}
              >
                {!notification.read && (
                  <span className={styles.unreadDot} aria-hidden="true" />
                )}
                <div className={styles.itemContent}>
                  <span className={styles.itemTitle}>{notification.title}</span>
                  <span className={styles.itemMessage}>{notification.message}</span>
                  <span className={styles.itemTime}>
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>
                <ChevronRight size={16} className={styles.itemChevron} />
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
