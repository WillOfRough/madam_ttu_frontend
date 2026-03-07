import { useEffect, useState } from 'react';
import { Link2, Plus, Copy, Unlink, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useConnectionStore from '../../store/connectionStore';
import ConfirmModal from '../../components/ConfirmModal';
import styles from './Connections.module.css';

export default function Connections() {
  const managerId = useAuthStore((s) => s.managerId);
  const { connections, isLoading, fetchConnections, createInvite, disconnect } = useConnectionStore();
  const [inviteUrl, setInviteUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [showDesc, setShowDesc] = useState(() => localStorage.getItem('hideConnectionDesc') !== '1');

  useEffect(() => {
    if (managerId) fetchConnections(managerId);
  }, [managerId, fetchConnections]);

  const handleCreateInvite = async () => {
    try {
      const result = await createInvite(managerId, { expiresInHours: 48 });
      const token = result.token || result.id;
      setInviteUrl(`${window.location.origin}/connect/${token}`);
      setCopied(false);
    } catch { /* ignore */ }
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await disconnect(managerId, disconnectTarget.managerId || disconnectTarget.id);
    } catch { /* ignore */ }
    setDisconnectTarget(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>연결 관리</h1>
        <button className={styles.createBtn} onClick={handleCreateInvite}>
          <Plus size={16} /> 연결 초대
        </button>
      </div>

      {showDesc && (
        <div className={styles.descBox}>
          <div className={styles.descHeader}>
            <p className={styles.descTitle}>연결이란?</p>
            <button
              className={styles.descClose}
              onClick={() => { setShowDesc(false); localStorage.setItem('hideConnectionDesc', '1'); }}
            >
              <X size={14} />
            </button>
          </div>
          <p className={styles.descText}>
            다른 매니저와 연결하면 서로의 Seeker 풀을 공유할 수 있습니다.
            연결된 매니저가 등록한 Seeker를 열람할 수 있고, 상대방도 나의 Seeker를 볼 수 있어 더 좋은 매칭 기회를 만들 수 있습니다.
          </p>
        </div>
      )}

      {inviteUrl && (
        <div className={styles.inviteBox}>
          <p className={styles.inviteLabel}>연결 초대 링크가 생성되었습니다:</p>
          <div className={styles.inviteUrlRow}>
            <input className={styles.inviteInput} value={inviteUrl} readOnly />
            <button className={styles.copyBtn} onClick={handleCopy}>
              <Copy size={14} /> {copied ? '복사됨!' : '복사'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>불러오는 중...</div>
      ) : connections.length === 0 ? (
        <div className={styles.empty}>
          <Link2 size={40} strokeWidth={1} />
          <p>연결된 매니저가 없습니다.</p>
          <p className={styles.emptyHint}>초대 링크를 생성하여 다른 매니저와 연결하세요.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {connections.map((conn) => (
            <div key={conn.id || conn.managerId} className={styles.card}>
              <div className={styles.cardInfo}>
                <div className={styles.avatar}>
                  {(conn.name || conn.email || '?').charAt(0)}
                </div>
                <div>
                  <span className={styles.connName}>{conn.name || conn.email}</span>
                  <span className={styles.connMeta}>
                    Seeker {conn.seekerCount ?? 0}명
                  </span>
                </div>
              </div>
              <button
                className={styles.disconnectBtn}
                onClick={() => setDisconnectTarget(conn)}
              >
                <Unlink size={14} /> 해제
              </button>
            </div>
          ))}
        </div>
      )}

      {disconnectTarget && (
        <ConfirmModal
          title="연결 해제"
          message={`${disconnectTarget.name || disconnectTarget.email}님과의 연결을 해제하시겠습니까? 서로의 Seeker를 더 이상 공유하지 않게 됩니다.`}
          confirmLabel="해제"
          danger
          onConfirm={handleDisconnect}
          onCancel={() => setDisconnectTarget(null)}
        />
      )}
    </div>
  );
}
