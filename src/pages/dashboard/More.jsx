import { useNavigate } from 'react-router-dom';
import { Link2, Sparkles, Inbox, BookOpen, Settings, Wallet, ChevronRight } from 'lucide-react';
import useConnectionStore from '../../store/connectionStore';
import styles from './More.module.css';

const ROWS = [
  { key: 'connections', to: '/dashboard/connections', icon: Link2,       label: '네트워크',   sub: '매니저 연결 · 요청', badgeKey: 'pendingConnections' },
  { key: 'invites',     to: '/dashboard/invites',     icon: Sparkles,    label: '초대 링크',  sub: '회원 모집 · 이벤트' },
  { key: 'inquiries',   to: '/dashboard/inquiries',   icon: Inbox,       label: '문의',       sub: '회원 질문 수신함',   badgeKey: 'pendingInquiries' },
  { key: 'guide',       to: '/dashboard/guide',       icon: BookOpen,    label: '가이드',     sub: '문자 양식 · 업무 흐름' },
  { key: 'settlement',  to: '/dashboard/settlement',  icon: Wallet,      label: '정산',       sub: '이번달 정산 · 매칭별 내역' },
  { key: 'settings',    to: '/dashboard/settings',    icon: Settings,    label: '설정',       sub: '내 정보 · 보안' },
];

export default function More() {
  const navigate = useNavigate();
  const pendingConnections = useConnectionStore((s) =>
    (s.requests || []).filter((r) => r.status === 'pending').length
  );

  const badges = {
    pendingConnections: pendingConnections || 0,
    pendingInquiries: 0,
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>더보기</h1>

      <div className={styles.list}>
        {ROWS.map(({ key, to, icon: Icon, label, sub, badgeKey, state }) => {
          const badge = badgeKey ? badges[badgeKey] : 0;
          return (
            <button
              key={key}
              className={styles.row}
              onClick={() => navigate(to, state ? { state } : undefined)}
              type="button"
            >
              <div className={styles.iconBox}>
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div className={styles.text}>
                <div className={styles.label}>{label}</div>
                <div className={styles.sub}>{sub}</div>
              </div>
              {badge > 0 && <span className={styles.badge}>{badge}</span>}
              <ChevronRight size={16} className={styles.chevron} strokeWidth={1.8} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
