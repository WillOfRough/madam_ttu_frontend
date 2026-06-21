import { useEffect, useState } from 'react';
import {
  Link2, Plus, Copy, Unlink, X, Search, UserPlus,
  Check, XCircle, Clock, ChevronRight, ChevronLeft, Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useConnectionStore from '../../store/connectionStore';
import useManagerInviteStore from '../../store/managerInviteStore';
import { searchManager } from '../../api/connectionService';
import { revokeInvite } from '../../api/inviteService';
import { toast } from '../../store/toastStore';
import ConfirmModal from '../../components/ConfirmModal';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { SkeletonListItem } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import ShareCard from '../../components/ShareCard';
import styles from './Connections.module.css';

/* ── Avatar color hash ── */
const AVATAR_COLORS = [
  styles.avatarMint,
  styles.avatarLilac,
  styles.avatarTangerine,
  styles.avatarRose,
  styles.avatarInk,
];

function getAvatarClass(name) {
  if (!name) return styles.avatarInk;
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

/* ── Relative time ── */
function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

function formatConnectedDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export default function Connections() {
  const navigate = useNavigate();
  const managerInviteQuota = useAuthStore((s) => s.managerInviteQuota);
  const {
    connections, receivedRequests, sentRequests, isLoading,
    fetchConnections, fetchRequests, createInvite, disconnect,
    sendRequest, acceptRequest, rejectRequest,
  } = useConnectionStore();
  const {
    invites: managerInvites,
    quota,
    pagination,
    statusFilter,
    isLoading: invitesLoading,
    fetchInvites,
    setStatusFilter,
  } = useManagerInviteStore();

  const [tab, setTab] = useState('connections');
  const [inviteUrl, setInviteUrl] = useState(null);
  const [copied, setCopied] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState(null);
  const [showDesc, setShowDesc] = useState(() => localStorage.getItem('hideConnectionDesc') !== '1');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteLabel, setInviteLabel] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [aboutCopied, setAboutCopied] = useState(false);

  const managerAboutUrl = `${window.location.origin}/about/manager`;

  /* Search state */
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  /* Network list sort */
  const [sortKey, setSortKey] = useState('recent');

  /* Name filter for connections tab */
  const [nameFilter, setNameFilter] = useState('');

  useEffect(() => {
    fetchConnections();
    fetchRequests();
  }, [fetchConnections, fetchRequests]);

  useEffect(() => {
    if (tab === 'manager-invites') {
      fetchInvites({ status: statusFilter || undefined });
    }
  }, [tab, statusFilter, fetchInvites]);

  const handleCreateInvite = async () => {
    setCreatingInvite(true);
    try {
      const result = await createInvite({ expiresInHours: 48, label: inviteLabel.trim() || undefined });
      const token = result.token || result.id;
      setInviteUrl(`${window.location.origin}/connect/${token}`);
      setCopied(false);
      setShowInviteForm(false);
      setInviteLabel('');
      toast.success('네트워크 초대 링크가 생성되었습니다.');
    } catch (err) {
      toast.error(err.message || '초대 링크 생성에 실패했습니다.');
    }
    setCreatingInvite(false);
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAboutCopy = () => {
    navigator.clipboard.writeText(managerAboutUrl);
    setAboutCopied(true);
    toast.success('소개 페이지 링크가 복사되었습니다.');
    setTimeout(() => setAboutCopied(false), 2000);
  };

  const handleAboutShare = async () => {
    const shareData = {
      title: 'Knots & Links',
      text: '한 건 한 건 정성껏 잇는 매칭 매니저를 모십니다. Knots & Links 매니저 소개 페이지를 확인해 보세요.',
      url: managerAboutUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(managerAboutUrl);
          toast.success('링크가 복사되었습니다.');
        }
      }
    } else {
      navigator.clipboard.writeText(managerAboutUrl);
      toast.success('링크가 복사되었습니다.');
    }
  };

  const handleDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await disconnect(disconnectTarget.managerId || disconnectTarget.id);
      toast.success('네트워크가 해제되었습니다.');
    } catch (err) {
      toast.error(err.message || '네트워크 해제에 실패했습니다.');
    }
    setDisconnectTarget(null);
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const result = await searchManager(searchEmail.trim());
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
      const targetEmail = searchResult.email || searchEmail;
      await sendRequest({ email: targetEmail, message: requestMessage });
      toast.success(`'${targetEmail}' 님에게 네트워크 요청을 보냈습니다.`);
      setSearchResult(null);
      setSearchEmail('');
      setRequestMessage('');
    } catch (err) {
      toast.error(err.message || '네트워크 요청에 실패했습니다.');
    }
    setSendingRequest(false);
  };

  const handleAccept = async (req) => {
    try {
      const result = await acceptRequest(req.id);
      toast.success(result.message || `'${req.managerName}' 님과 네트워크가 연결되었습니다.`);
    } catch (err) {
      toast.error(err.message || '수락에 실패했습니다.');
    }
  };

  const handleReject = async (req) => {
    try {
      await rejectRequest(req.id);
      toast.success('네트워크 요청을 거절했습니다.');
    } catch (err) {
      toast.error(err.message || '거절에 실패했습니다.');
    }
  };

  const handleCopyInviteLink = (invite) => {
    const url = `${window.location.origin}/connect/${invite.token}`;
    navigator.clipboard.writeText(url);
    setCopiedInviteId(invite.id);
    toast.success('링크가 복사되었습니다.');
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handleRevokeInvite = async () => {
    if (!revokeTarget) return;
    try {
      await revokeInvite(revokeTarget.id);
      toast.success('초대 링크가 폐기되었습니다.');
      fetchInvites({ status: statusFilter || undefined });
    } catch (err) {
      toast.error(err.message || '폐기에 실패했습니다.');
    }
    setRevokeTarget(null);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const handlePageChange = (page) => {
    fetchInvites({ status: statusFilter || undefined, page });
  };

  const displayQuota = quota || managerInviteQuota;

  /* KPI counts */
  const connectedCount = connections.length;
  const pendingCount = receivedRequests.length;
  const sharedMatchTotal = connections.reduce((s, c) => s + (c.sharedMatchCount ?? 0), 0);

  /* Sorted + filtered connections */
  const sortedConnections = [...connections]
    .filter((c) => {
      if (!nameFilter.trim()) return true;
      const name = (c.name || c.email || '').toLowerCase();
      return name.includes(nameFilter.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (sortKey === 'sharedMatches') return (b.sharedMatchCount ?? 0) - (a.sharedMatchCount ?? 0);
      if (sortKey === 'sharedClients') return (b.clientCount ?? 0) - (a.clientCount ?? 0);
      /* recent: use connectedAt or fall back to id order */
      const ta = a.connectedAt ? new Date(a.connectedAt).getTime() : 0;
      const tb = b.connectedAt ? new Date(b.connectedAt).getTime() : 0;
      return tb - ta;
    });

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.headerBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)} aria-label="뒤로">
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>
        <span className={styles.titleText}>네트워크</span>
        <button
          className={styles.headerCta}
          onClick={() => { setTab('connections'); setShowInviteForm((v) => !v); }}
        >
          <Plus size={13} strokeWidth={2.5} />
          초대링크
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>연결 매니저</div>
          <div className={styles.kpiValue}>
            {connectedCount}<span className={styles.kpiUnit}>명</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>함께 매칭</div>
          <div className={styles.kpiValue}>
            {sharedMatchTotal}<span className={styles.kpiUnit}>건</span>
          </div>
        </div>
        <div className={`${styles.kpiCard} ${pendingCount > 0 ? styles.kpiCardWaiting : ''}`}>
          <div className={`${styles.kpiLabel} ${pendingCount > 0 ? styles.kpiLabelWaiting : ''}`}>대기</div>
          <div className={`${styles.kpiValue} ${pendingCount > 0 ? styles.kpiValueWaiting : ''}`}>
            {pendingCount}
            <span className={pendingCount > 0 ? styles.kpiUnitWaiting : styles.kpiUnit}>건</span>
          </div>
        </div>
      </div>

      {/* ── Segmented tabs ── */}
      <div className={styles.segmentedTabs}>
        <button
          className={`${styles.segmentBtn} ${tab === 'connections' ? styles.segmentActive : ''}`}
          onClick={() => setTab('connections')}
        >
          <Link2 size={12} strokeWidth={2.2} />
          네트워크 목록
        </button>
        <button
          className={`${styles.segmentBtn} ${tab === 'manager-invites' ? styles.segmentActive : ''}`}
          onClick={() => setTab('manager-invites')}
        >
          <UserPlus size={12} strokeWidth={2.2} />
          매니저 영입
        </button>
      </div>

      {/* ════════════════════════════════
          TAB: 네트워크 목록
      ════════════════════════════════ */}
      {tab === 'connections' && (
        <>
          {/* Invite form (triggered from header CTA) */}
          {showInviteForm && (
            <div className={styles.inviteFormBox}>
              <p className={styles.inviteFormTitle}>초대 링크 생성</p>
              <div className={styles.inviteFormRow}>
                <input
                  className={styles.inviteFormInput}
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value.slice(0, 50))}
                  placeholder="라벨 (선택, 예: 홍길동 소개용)"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateInvite()}
                />
                <button
                  className={styles.createBtn}
                  onClick={handleCreateInvite}
                  disabled={creatingInvite}
                >
                  {creatingInvite ? '생성 중…' : '생성'}
                </button>
              </div>
            </div>
          )}

          {/* Generated invite URL */}
          {inviteUrl && (
            <div className={styles.inviteBox}>
              <p className={styles.inviteBoxLabel}>초대 링크가 생성되었습니다</p>
              <div className={styles.inviteUrlRow}>
                <input className={styles.inviteInput} value={inviteUrl} readOnly />
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
            </div>
          )}

          {/* Name search */}
          <div className={styles.nameSearchWrap}>
            <Search size={14} className={styles.nameSearchIcon} />
            <input
              className={styles.nameSearchInput}
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="매니저 이름으로 찾기"
            />
          </div>

          {/* Sort chips */}
          <div className={styles.sortChipRow}>
            {[
              { k: 'recent', l: '최근 활동순' },
              { k: 'sharedMatches', l: '함께한 매칭 많은순' },
              { k: 'sharedClients', l: '회원 많은순' },
            ].map((s) => (
              <button
                key={s.k}
                className={`${styles.sortChip} ${sortKey === s.k ? styles.sortChipActive : ''}`}
                onClick={() => setSortKey(s.k)}
              >
                {s.l}
              </button>
            ))}
          </div>

          {/* ── 받은 요청 ── */}
          {receivedRequests.length > 0 && (
            <div className={styles.requestSection}>
              <div className={styles.requestSectionHeader}>
                <span className={styles.requestSectionTitle}>받은 요청</span>
                <span className={styles.requestSectionSub}>{receivedRequests.length}건이 매니저님을 기다려요</span>
              </div>
              {receivedRequests.map((req) => (
                <div key={req.id} className={styles.requestCardWaiting}>
                  <div className={styles.requestCardTop}>
                    <div className={`${styles.avatar} ${getAvatarClass(req.managerName)}`}>
                      {(req.managerName || '?').charAt(0)}
                    </div>
                    <div className={styles.requestCardInfo}>
                      <span className={styles.connName}>{req.managerName}</span>
                      <span className={styles.connMeta}>{req.managerEmail || ''}</span>
                    </div>
                    <span className={styles.requestTime}>{relativeTime(req.createdAt)}</span>
                  </div>
                  {req.message && (
                    <div className={styles.messageBubble}>
                      {req.message}
                    </div>
                  )}
                  <div className={styles.requestActions}>
                    <button className={styles.acceptBtn} onClick={() => handleAccept(req)}>
                      <Check size={13} /> 수락
                    </button>
                    <button className={styles.rejectBtn} onClick={() => handleReject(req)}>
                      <XCircle size={13} /> 거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── 연결된 매니저 ── */}
          <div className={styles.connectionSection}>
            <div className={styles.connectionSectionHeader}>
              <span className={styles.connectionSectionTitle}>
                연결된 매니저 {connections.length > 0 ? connections.length : ''}
              </span>
              {connections.length > 0 && (
                <span className={styles.connectionSectionHint}>탭해서 상세보기</span>
              )}
            </div>

            {isLoading ? (
              <div className={styles.list}>
                {[1, 2, 3].map((i) => <SkeletonListItem key={i} />)}
              </div>
            ) : sortedConnections.length === 0 ? (
              <EmptyState
                icon={Users}
                title={nameFilter ? '검색 결과가 없습니다' : '네트워크 매니저가 없습니다'}
                hint={!nameFilter ? '초대 링크를 생성하거나 이메일로 검색하여 네트워크를 만드세요.' : undefined}
              />
            ) : (
              <div className={styles.list}>
                {sortedConnections.map((conn) => (
                  <div key={conn.id || conn.managerId} className={styles.connectionItem}>
                    <div className={`${styles.avatar} ${getAvatarClass(conn.name || conn.email)}`}>
                      {(conn.name || conn.email || '?').charAt(0)}
                    </div>
                    <div className={styles.connectionItemBody}>
                      <div className={styles.connectionItemNameRow}>
                        <span className={styles.connName}>{conn.name || conn.email}</span>
                        {(conn.sharedMatchCount ?? 0) > 0 && (
                          <span className={styles.successBadge}>성사 {conn.sharedMatchCount}</span>
                        )}
                      </div>
                      {conn.email && conn.name && conn.name !== conn.email && (
                        <span className={styles.connEmail}>{conn.email}</span>
                      )}
                      <span className={styles.connMeta}>
                        공유회원 {conn.clientCount ?? 0}
                        {(conn.sharedMatchCount ?? 0) > 0 && ` · 함께 매칭 ${conn.sharedMatchCount}`}
                        {conn.lastActivityAt && ` · 활동 ${relativeTime(conn.lastActivityAt)}`}
                        {conn.connectedAt && ` · 연결 ${formatConnectedDate(conn.connectedAt)}`}
                      </span>
                    </div>
                    <div className={styles.connectionItemRight}>
                      <button
                        className={styles.disconnectBtn}
                        onClick={(e) => { e.stopPropagation(); setDisconnectTarget(conn); }}
                        aria-label="네트워크 해제"
                      >
                        <Unlink size={12} />
                      </button>
                      <ChevronRight size={14} className={styles.chevron} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════════════════════════════
          TAB: 매니저 영입
      ════════════════════════════════ */}
      {tab === 'manager-invites' && (
        <>
          {/* Info desc box (preserved) */}
          {showDesc && (
            <div className={styles.descBox}>
              <div className={styles.descHeader}>
                <p className={styles.descTitle}>매니저 네트워크란?</p>
                <button
                  className={styles.descClose}
                  onClick={() => { setShowDesc(false); localStorage.setItem('hideConnectionDesc', '1'); }}
                  aria-label="닫기"
                >
                  <X size={13} />
                </button>
              </div>
              <p className={styles.descText}>
                다른 매니저와 네트워크를 맺으면 서로의 회원 풀을 공유할 수 있습니다.
                네트워크 매니저가 등록한 회원을 열람할 수 있고, 상대방도 나의 회원을 볼 수 있어 더 좋은 매칭 기회를 만들 수 있습니다.
              </p>
            </div>
          )}

          {/* Quota hero — 행동 전에 잔여 수량 인지 (scarcity emphasis) */}
          {displayQuota && displayQuota.limit !== null && (
            <div
              className={`${styles.quotaHero} ${displayQuota.remaining <= 1 ? styles.quotaHeroScarce : ''}`}
            >
              <div className={styles.quotaHeroHead}>
                <span className={styles.quotaHeroTag}>INVITATION TICKETS</span>
                <span className={styles.quotaHeroRemaining}>
                  잔여 <strong>{displayQuota.remaining}</strong>장
                </span>
              </div>
              <div className={styles.quotaHeroNumbers}>
                <span className={styles.quotaHeroUsed}>{displayQuota.used}</span>
                <span className={styles.quotaHeroSlash}>/</span>
                <span className={styles.quotaHeroLimit}>{displayQuota.limit}</span>
                <span className={styles.quotaHeroSuffix}>장 사용</span>
              </div>
              <div className={styles.quotaHeroBar}>
                <div
                  className={styles.quotaHeroFill}
                  style={{ width: `${Math.min(100, (displayQuota.used / displayQuota.limit) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {displayQuota && displayQuota.limit === null && (
            <div className={styles.quotaHero}>
              <div className={styles.quotaHeroHead}>
                <span className={styles.quotaHeroTag}>INVITATION TICKETS</span>
                <span className={styles.quotaHeroRemaining}>무제한</span>
              </div>
              <div className={styles.quotaHeroNumbers}>
                <span className={styles.quotaHeroUsed}>{displayQuota.used}</span>
                <span className={styles.quotaHeroSuffix}>장 사용</span>
              </div>
            </div>
          )}

          {/* Warning callout — 신중한 공유 안내 */}
          {displayQuota && displayQuota.limit !== null && (
            <div className={styles.warningCallout} role="note">
              <span className={styles.warningIcon} aria-hidden="true">⚠️</span>
              <p className={styles.warningText}>
                초대권은 계정당 총 <strong>{displayQuota.limit}장</strong>만 제공됩니다.
                무분별한 링크 생성은 초대권 낭비로 이어질 수 있으니,
                반드시 신뢰할 수 있는 매니저에게만 신중하게 공유해 주세요.
              </p>
            </div>
          )}

          {/* 매니저 소개 페이지 공유 */}
          <ShareCard
            icon={<Users size={16} strokeWidth={2.2} />}
            title="매니저 소개 페이지"
            desc="매니저로 함께할 분께 먼저 보내 소개해 주세요"
            url={managerAboutUrl}
            copied={aboutCopied}
            onCopy={handleAboutCopy}
            onShare={handleAboutShare}
          />

          {/* Dark hero invite card */}
          <div className={styles.heroInviteCard}>
            <p className={styles.heroInviteCaption}>INVITE · 링크 한 번이면 충분해요</p>
            <h2 className={styles.heroInviteTitle}>매니저를 네트워크에<br />초대하기</h2>
            <p className={styles.heroInviteDesc}>
              링크를 전달받은 매니저가 수락하면 자동으로 연결됩니다. 라벨로 용도를 구분해보세요.
            </p>
            <button
              className={styles.heroInviteCta}
              onClick={() => setShowInviteForm((v) => !v)}
            >
              <Link2 size={14} strokeWidth={2} />
              초대링크 생성
            </button>
          </div>

          {/* Invite form (within manager-invites tab) */}
          {showInviteForm && (
            <div className={styles.inviteFormBox}>
              <p className={styles.inviteFormTitle}>초대 링크 생성</p>
              <div className={styles.inviteFormRow}>
                <input
                  className={styles.inviteFormInput}
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value.slice(0, 50))}
                  placeholder="라벨 (선택, 예: 홍길동 소개용)"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateInvite()}
                />
                <button
                  className={styles.createBtn}
                  onClick={handleCreateInvite}
                  disabled={creatingInvite}
                >
                  {creatingInvite ? '생성 중…' : '생성'}
                </button>
              </div>
            </div>
          )}

          {inviteUrl && (
            <div className={styles.inviteBox}>
              <p className={styles.inviteBoxLabel}>초대 링크가 생성되었습니다</p>
              <div className={styles.inviteUrlRow}>
                <input className={styles.inviteInput} value={inviteUrl} readOnly />
                <button className={styles.copyBtn} onClick={handleCopy}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? '복사됨!' : '복사'}
                </button>
              </div>
            </div>
          )}

          {/* Email search section */}
          <div className={styles.emailSearchSection}>
            <div className={styles.emailSearchHeader}>
              <span className={styles.emailSearchTitle}>이메일로 매니저 찾기</span>
              <span className={styles.emailSearchSub}>정확한 이메일 주소로만 검색됩니다</span>
            </div>
            <div className={styles.emailSearchRow}>
              <input
                className={styles.emailSearchInput}
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="name@example.com"
              />
              <button
                className={styles.emailSearchBtn}
                onClick={handleSearch}
                disabled={searching || !searchEmail.trim()}
              >
                <Search size={13} />
                {searching ? '검색 중…' : '검색'}
              </button>
            </div>
            <p className={styles.emailSearchHint}>개인정보 보호를 위해 부분 검색은 지원하지 않아요.</p>

            {searchError && <p className={styles.searchError}>{searchError}</p>}

            {searchResult && (
              <div className={styles.searchResultCard}>
                <div className={styles.searchResultInfo}>
                  <div className={`${styles.avatar} ${getAvatarClass(searchResult.name || searchEmail)}`}>
                    {(searchResult.name || searchResult.nickname || searchEmail).charAt(0)}
                  </div>
                  <div className={styles.searchResultText}>
                    <span className={styles.searchResultName}>
                      {searchResult.name || searchResult.nickname || '이름 없음'}
                    </span>
                    <span className={styles.connMeta}>{searchResult.email || searchEmail}</span>
                  </div>
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
                    <UserPlus size={13} />
                    {sendingRequest ? '전송 중…' : '요청'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── 보낸 요청 ── */}
          {sentRequests.length > 0 && (
            <div className={styles.sentSection}>
              <div className={styles.sentSectionHeader}>보낸 요청</div>
              <div className={styles.list}>
                {sentRequests.map((req) => (
                  <div key={req.id} className={styles.sentCard}>
                    <div className={styles.cardInfo}>
                      <div className={`${styles.avatar} ${getAvatarClass(req.managerName)}`}>
                        {(req.managerName || '?').charAt(0)}
                      </div>
                      <div className={styles.cardInfoText}>
                        <span className={styles.connName}>{req.managerName}</span>
                        {req.message && (
                          <span className={styles.connMeta}>{req.message}</span>
                        )}
                        <span className={styles.connMeta}>
                          {new Date(req.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className={styles.sentStatus}>
                      {req.status === 'pending' && (
                        <span className={styles.pendingBadge}>
                          <Clock size={11} /> 대기 중
                        </span>
                      )}
                      {req.status === 'accepted' && <StatusBadge status="approved" />}
                      {req.status === 'rejected' && <StatusBadge status="rejected" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status filter chips */}
          <div className={styles.filterRow}>
            {[
              { k: '', l: '전체' },
              { k: 'active', l: '활성' },
              { k: 'used', l: '사용됨' },
              { k: 'expired', l: '만료' },
              { k: 'revoked', l: '폐기' },
            ].map((s) => (
              <button
                key={s.k}
                className={`${styles.filterBtn} ${statusFilter === s.k ? styles.filterActive : ''}`}
                onClick={() => handleStatusFilter(s.k)}
              >
                {s.l}
              </button>
            ))}
          </div>

          <div className={styles.inviteListSection}>
            {invitesLoading ? (
              <div className={styles.list}>
                {[1, 2, 3].map((i) => <SkeletonListItem key={i} />)}
              </div>
            ) : managerInvites.length === 0 ? (
              <EmptyState icon={UserPlus} title="매니저 초대 내역이 없습니다" />
            ) : (
              <>
                <div className={styles.list}>
                  {managerInvites.map((invite) => (
                    <div key={invite.id} className={styles.card}>
                      <div className={`${styles.cardInfo} ${styles.cardInfoColumn}`}>
                        <div className={styles.inviteCardHeader}>
                          <span className={styles.connName}>
                            {invite.label || '라벨 없음'}
                          </span>
                          <StatusBadge status={invite.status} />
                        </div>
                        {invite.usedBy && (
                          <span className={styles.connMeta}>
                            사용: {invite.usedBy.name} ({invite.usedBy.nickname})
                          </span>
                        )}
                        <span className={styles.connMeta}>
                          생성: {new Date(invite.createdAt).toLocaleDateString('ko-KR')}
                          {invite.expiresAt && ` · 만료: ${new Date(invite.expiresAt).toLocaleDateString('ko-KR')}`}
                          {invite.usedAt && ` · 사용일: ${new Date(invite.usedAt).toLocaleDateString('ko-KR')}`}
                        </span>
                      </div>
                      {invite.status === 'active' && (
                        <div className={styles.cardActions}>
                          <button className={styles.iconBtn} onClick={() => handleCopyInviteLink(invite)}>
                            <Copy size={13} />
                            {copiedInviteId === invite.id ? '복사됨!' : '복사'}
                          </button>
                          <button
                            className={`${styles.iconBtn} ${styles.dangerBtn}`}
                            onClick={() => setRevokeTarget(invite)}
                          >
                            폐기
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {pagination && (
                  <Pagination
                    page={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ── Modals ── */}
      {disconnectTarget && (
        <ConfirmModal
          title="네트워크 해제"
          message={`${disconnectTarget.name || disconnectTarget.email}님과의 네트워크를 해제하시겠습니까? 서로의 회원을 더 이상 공유하지 않게 됩니다.`}
          confirmLabel="해제"
          danger
          onConfirm={handleDisconnect}
          onCancel={() => setDisconnectTarget(null)}
        />
      )}

      {revokeTarget && (
        <ConfirmModal
          title="초대 폐기"
          message="이 초대 링크를 폐기하시겠습니까? 더 이상 사용할 수 없게 됩니다."
          confirmLabel="폐기"
          danger
          onConfirm={handleRevokeInvite}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
