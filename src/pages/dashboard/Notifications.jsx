import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Heart, Calendar, User, Link2, MessageSquare, Check, Bell,
} from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
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

// type → tone + icon
function getTypeStyle(type) {
  if (!type) return { tone: 'ink', Icon: Bell };

  if (
    type === 'match_matched' ||
    type === 'after_accepted' ||
    type.startsWith('match_matched')
  ) {
    return { tone: 'mint', Icon: Heart };
  }

  if (type === 'match_scheduled' || type.includes('calendar') || type.includes('schedule')) {
    return { tone: 'mint', Icon: Calendar };
  }

  if (type === 'after_responded' || type.startsWith('after_')) {
    return { tone: 'lilac', Icon: MessageSquare };
  }

  if (type.startsWith('proposal_')) {
    return { tone: 'tangerine', Icon: Check };
  }

  if (type === 'client_registered') {
    return { tone: 'tangerine', Icon: User };
  }

  if (type.startsWith('connection_')) {
    return { tone: 'lilac', Icon: Link2 };
  }

  if (type.startsWith('inquiry_')) {
    return { tone: 'lilac', Icon: MessageSquare };
  }

  return { tone: 'ink', Icon: Bell };
}

const TILE_CLASS = {
  mint:      styles.iconTileMint,
  tangerine: styles.iconTileTangerine,
  lilac:     styles.iconTileLilac,
  ink:       styles.iconTileInk,
};

// Group into 오늘 / 이전
function groupNotifications(notifications) {
  const now = Date.now();
  const DAY = 86400000;
  const today = [];
  const older = [];

  notifications.forEach((n) => {
    const diff = now - new Date(n.createdAt).getTime();
    if (diff < DAY) today.push(n);
    else older.push(n);
  });

  return { today, older };
}

export default function Notifications() {
  const navigate = useNavigate();
  const notifications = useNotificationStore((s) => s.notifications);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    fetchNotifications({ page: 0, size: 100 });
  }, [fetchNotifications]);

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
  const { today, older } = groupNotifications(notifications);

  const renderItem = (notification) => {
    const { tone, Icon: TypeIcon } = getTypeStyle(notification.type);
    const unread = !notification.read;
    return (
      <li
        key={notification.id}
        className={`${styles.item} ${unread ? styles.itemUnread : ''}`}
        onClick={() => handleItemClick(notification)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleItemClick(notification)}
        aria-label={`${notification.title}: ${notification.message}`}
      >
        {/* Icon tile */}
        <div className={`${styles.iconTile} ${TILE_CLASS[tone] || styles.iconTileInk}`}>
          <TypeIcon size={20} strokeWidth={1.8} />
          {unread && <span className={styles.unreadDot} aria-hidden="true" />}
        </div>

        {/* Content */}
        <div className={styles.itemContent}>
          <span className={styles.itemTitle}>{notification.title}</span>
          <span className={styles.itemMessage}>{notification.message}</span>
          <span className={styles.itemTime}>{formatRelativeTime(notification.createdAt)}</span>
        </div>

        {unread && (
          <ChevronRight size={16} strokeWidth={1.5} className={styles.itemChevron} />
        )}
      </li>
    );
  };

  const renderSection = (label, items) => {
    if (!items.length) return null;
    return (
      <div className={styles.sectionGroup} key={label}>
        <div className={styles.sectionLabel}>{label}</div>
        <ul className={styles.list} role="list">
          {items.map(renderItem)}
        </ul>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      {/* Sticky header — title only, no back button */}
      <div className={styles.header}>
        <h1 className={styles.title}>알림</h1>
        {hasUnread && (
          <button className={styles.readAllBtn} onClick={handleMarkAllAsRead}>
            모두 읽음
          </button>
        )}
      </div>

      {isLoading ? (
        <div className={styles.loadingList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonIconTile} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonMessage} />
                <div className={styles.skeletonTime} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Bell size={28} strokeWidth={1.3} />
          </div>
          <p className={styles.emptyTitle}>새 알림이 없습니다</p>
          <p className={styles.emptyHint}>매칭·네트워크 활동이 생기면 여기에 표시돼요.</p>
        </div>
      ) : (
        <>
          {renderSection('오늘', today)}
          {renderSection('이전', older)}

          {/* fallback: no group split */}
          {today.length === 0 && older.length === 0 && (
            <div className={styles.sectionGroup}>
              <ul className={styles.list} role="list">
                {notifications.map(renderItem)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
