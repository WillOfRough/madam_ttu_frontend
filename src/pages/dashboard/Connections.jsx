import { useEffect, useState } from 'react';
import { Link2, Plus, Copy, Unlink, X, Search, UserPlus, Check, XCircle, Send, Clock } from 'lucide-react';
import useConnectionStore from '../../store/connectionStore';
import { searchManager } from '../../api/connectionService';
import { toast } from '../../store/toastStore';
import ConfirmModal from '../../components/ConfirmModal';
import StatusBadge from '../../components/StatusBadge';
import { SkeletonListItem } from '../../components/Skeleton';
import styles from './Connections.module.css';

export default function Connections() {
  const {
    connections, receivedRequests, sentRequests, isLoading,
    fetchConnections, fetchRequests, createInvite, disconnect,
    sendRequest, acceptRequest, rejectRequest,
  } = useConnectionStore();
  const [inviteUrl, setInviteUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [showDesc, setShowDesc] = useState(() => localStorage.getItem('hideConnectionDesc') !== '1');

  // Search state
  const [searchNickname, setSearchNickname] = useState('');
  const [searchResult, setSearchResult] = useState(null); // { id, nickname } or null
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    fetchConnections();
    fetchRequests();
  }, [fetchConnections, fetchRequests]);

  const handleCreateInvite = async () => {
    try {
      const result = await createInvite({ expiresInHours: 48 });
      const token = result.token || result.id;
      setInviteUrl(`${window.location.origin}/connect/${token}`);
      setCopied(false);
      toast.success('연결 초대 링크가 생성되었습니다.');
    } catch (err) {
      toast.error(err.message || '초대 링크 생성에 실패했습니다.');
    }
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await disconnect(disconnectTarget.managerId || disconnectTarget.id);
      toast.success('연결이 해제되었습니다.');
    } catch (err) {
      toast.error(err.message || '연결 해제에 실패했습니다.');
    }
    setDisconnectTarget(null);
  };

  const handleSearch = async () => {
    if (!searchNickname.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const result = await searchManager(searchNickname.trim());
      setSearchResult(result);
    } catch (err) {
      setSearchError(err.message || '해당 매니저를 찾을 수 없습니다.');
    }
    setSearching(false);
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setSendingRequest(true);
    try {
      await sendRequest({ nickname: searchResult.nickname, message: requestMessage });
      toast.success(`'${searchResult.nickname}' 님에게 연결 요청을 보냈습니다.`);
      setSearchResult(null);
      setSearchNickname('');
      setRequestMessage('');
    } catch (err) {
      toast.error(err.message || '연결 요청에 실패했습니다.');
    }
    setSendingRequest(false);
  };

  const handleAccept = async (req) => {
    try {
      const result = await acceptRequest(req.id);
      toast.success(result.message || `'${req.managerName}' 님과 연결되었습니다.`);
    } catch (err) {
      toast.error(err.message || '수락에 실패했습니다.');
    }
  };

  const handleReject = async (req) => {
    try {
      await rejectRequest(req.id);
      toast.success('연결 요청을 거절했습니다.');
    } catch (err) {
      toast.error(err.message || '거절에 실패했습니다.');
    }
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

      {/* Search + Request Section */}
      <div className={styles.searchSection}>
        <h2 className={styles.sectionTitle}>매니저 검색</h2>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            value={searchNickname}
            onChange={(e) => setSearchNickname(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="매니저 별명을 정확히 입력하세요"
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={searching || !searchNickname.trim()}>
            <Search size={14} /> {searching ? '검색 중...' : '검색'}
          </button>
        </div>

        {searchError && <p className={styles.searchError}>{searchError}</p>}

        {searchResult && (
          <div className={styles.searchResultCard}>
            <div className={styles.searchResultInfo}>
              <div className={styles.avatar}>{searchResult.nickname.charAt(0)}</div>
              <span className={styles.searchResultName}>{searchResult.nickname}</span>
            </div>
            <div className={styles.requestForm}>
              <input
                className={styles.messageInput}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value.slice(0, 500))}
                placeholder="메시지 (선택, 최대 500자)"
              />
              <button
                className={styles.sendBtn}
                onClick={handleSendRequest}
                disabled={sendingRequest}
              >
                <UserPlus size={14} /> {sendingRequest ? '전송 중...' : '연결 요청'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <div className={styles.requestSection}>
          <h2 className={styles.sectionTitle}>받은 요청</h2>
          <div className={styles.list}>
            {receivedRequests.map((req) => (
              <div key={req.id} className={styles.requestCard}>
                <div className={styles.requestInfo}>
                  <div className={styles.avatar}>{(req.managerName || '?').charAt(0)}</div>
                  <div>
                    <span className={styles.connName}>{req.managerName}</span>
                    {req.message && <span className={styles.requestMessage}>{req.message}</span>}
                    <span className={styles.connMeta}>
                      {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <div className={styles.requestActions}>
                  <button className={styles.acceptBtn} onClick={() => handleAccept(req)}>
                    <Check size={14} /> 수락
                  </button>
                  <button className={styles.rejectBtn} onClick={() => handleReject(req)}>
                    <XCircle size={14} /> 거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <div className={styles.requestSection}>
          <h2 className={styles.sectionTitle}>보낸 요청</h2>
          <div className={styles.list}>
            {sentRequests.map((req) => (
              <div key={req.id} className={styles.sentCard}>
                <div className={styles.cardInfo}>
                  <div className={styles.avatar}>{(req.managerName || '?').charAt(0)}</div>
                  <div>
                    <span className={styles.connName}>{req.managerName}</span>
                    {req.message && <span className={styles.requestMessage}>{req.message}</span>}
                    <span className={styles.connMeta}>
                      {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <div className={styles.sentStatus}>
                  {req.status === 'pending' && <span className={styles.pendingBadge}><Clock size={12} /> 대기 중</span>}
                  {req.status === 'accepted' && <StatusBadge status="approved" />}
                  {req.status === 'rejected' && <StatusBadge status="rejected" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Connections */}
      <div className={styles.connectionSection}>
        <h2 className={styles.sectionTitle}>연결된 매니저</h2>
        {isLoading ? (
          <div className={styles.list}>{[1, 2, 3].map((i) => <SkeletonListItem key={i} />)}</div>
        ) : connections.length === 0 ? (
          <div className={styles.empty}>
            <Link2 size={40} strokeWidth={1} />
            <p>연결된 매니저가 없습니다.</p>
            <p className={styles.emptyHint}>초대 링크를 생성하거나 이름으로 검색하여 연결하세요.</p>
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
                      Seeker {conn.clientCount ?? 0}명
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
      </div>

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
