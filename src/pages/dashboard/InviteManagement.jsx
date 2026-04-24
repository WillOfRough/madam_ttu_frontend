import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Sparkles, Copy, Check, Trash2, X, Calendar } from 'lucide-react';
import useInviteStore from '../../store/inviteStore';
import { updateInviteLabel } from '../../api/inviteService';
import { toast } from '../../store/toastStore';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonListItem } from '../../components/Skeleton';
import styles from './InviteManagement.module.css';

// ── Type parser ──────────────────────────────────────────────────────────────
function parseInviteType(label) {
  if (!label) return { type: 'general', partner: null, displayLabel: '' };
  const m = label.match(/^\[EVENT\]\s*([^/]+?)(?:\s*\/\s*(.*))?$/);
  if (m) {
    return {
      type: 'event',
      partner: m[1].trim(),
      displayLabel: m[2]?.trim() || m[1].trim(),
    };
  }
  return { type: 'general', partner: null, displayLabel: label };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

export default function InviteManagement() {
  const navigate = useNavigate();
  const {
    invites,
    isLoading,
    page,
    totalPages,
    fetchInvites,
    createInvite,
    revokeInvite,
    setStatusFilter,
  } = useInviteStore();

  // ── Local state ──────────────────────────────────────────────────────────
  const [filter, setFilter] = useState('all'); // all | general | event | revoked
  const [copiedId, setCopiedId] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);

  // General sheet
  const [showGeneral, setShowGeneral] = useState(false);
  const [generalLabel, setGeneralLabel] = useState('');

  // Event sheet
  const [showEvent, setShowEvent] = useState(false);
  const [eventPartner, setEventPartner] = useState('');
  const [eventLabel, setEventLabel] = useState('');

  // ── Initial fetch (load all, filter client-side) ─────────────────────────
  useEffect(() => {
    fetchInvites({ page: 1, limit: 100 });
    setStatusFilter('');
  }, [fetchInvites, setStatusFilter]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const enriched = invites.map((inv) => ({
    ...inv,
    ...parseInviteType(inv.label),
  }));

  const counts = {
    all: enriched.length,
    general: enriched.filter((l) => l.type === 'general' && l.status === 'active').length,
    event: enriched.filter((l) => l.type === 'event' && l.status === 'active').length,
    revoked: enriched.filter((l) => l.status === 'revoked').length,
  };

  const filtered = enriched.filter((l) => {
    if (filter === 'all') return true;
    if (filter === 'revoked') return l.status === 'revoked';
    return l.type === filter && l.status === 'active';
  });

  // KPI: active this month (naive: count invites created this month)
  const now = new Date();
  const thisMonthJoined = enriched.reduce((sum, inv) => {
    return sum + (inv.useCount ?? 0);
  }, 0);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCopy = useCallback((invite) => {
    const token = invite.token || invite.id;
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    toast.success('링크가 복사되었습니다.');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleEventCopy = useCallback((invite) => {
    const token = invite.token || invite.id;
    const partner = invite.partner || '';
    let url = `${window.location.origin}/event/${token}`;
    if (partner) url += `?partner=${encodeURIComponent(partner)}`;
    navigator.clipboard.writeText(url);
    toast.success('이벤트 링크가 복사되었습니다.');
  }, []);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeInvite(revokeTarget.id);
      toast.success('초대 링크가 폐기되었습니다.');
    } catch (err) {
      toast.error(err.message || '초대 링크 폐기에 실패했습니다.');
    }
    setRevokeTarget(null);
  };

  const closeGeneral = () => {
    setShowGeneral(false);
    setGeneralLabel('');
  };

  const handleCreateGeneral = async () => {
    try {
      await createInvite({ label: generalLabel || undefined });
      fetchInvites({ page: 1, limit: 100 });
      toast.success('초대 링크가 생성되었습니다.');
    } catch (err) {
      toast.error(err.message || '초대 링크 생성에 실패했습니다.');
    }
    closeGeneral();
  };

  const closeEvent = () => {
    setShowEvent(false);
    setEventPartner('');
    setEventLabel('');
  };

  const handleCreateEvent = async () => {
    if (!eventPartner.trim()) {
      toast.error('파트너사명을 입력해주세요.');
      return;
    }
    const labelStr = `[EVENT] ${eventPartner.trim()}${eventLabel.trim() ? ` / ${eventLabel.trim()}` : ''}`;
    try {
      await createInvite({ label: labelStr });
      fetchInvites({ page: 1, limit: 100 });
      toast.success('이벤트 링크가 생성되었습니다.');
    } catch (err) {
      toast.error(err.message || '이벤트 링크 생성에 실패했습니다.');
    }
    closeEvent();
  };

  const eventPreviewUrl = eventPartner.trim()
    ? `${window.location.origin}/event/...?partner=${encodeURIComponent(eventPartner.trim())}`
    : '';

  const TABS = [
    { k: 'all', l: '전체', n: counts.all },
    { k: 'general', l: '일반', n: counts.general },
    { k: 'event', l: '이벤트', n: counts.event },
    { k: 'revoked', l: '폐기', n: counts.revoked },
  ];

  return (
    <div className={styles.page}>
      {/* ── Sticky header ── */}
      <div className={styles.header}>
        <h1 className={styles.title}>초대 관리</h1>
      </div>

      <div className={styles.body}>
        {/* ── 소개 배너 ── */}
        <div className={styles.introBanner}>
          <div className={styles.introKicker}>INVITE · 두 가지 링크</div>
          <div className={styles.introCopy}>
            <span className={styles.introEmphasis}>일반 링크</span>는 내가 직접 회원을 모실 때,<br />
            <span className={styles.introAccent}>이벤트 링크</span>는 파트너사와 공동 개최할 때 쓰세요.
          </div>
        </div>

        {/* ── KPI 3칸 ── */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>이번 달 가입</div>
            <div className={styles.kpiValue}>
              {thisMonthJoined}
              <span className={styles.kpiUnit}>명</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>활성 링크</div>
            <div className={styles.kpiValue}>
              {counts.general + counts.event}
              <span className={styles.kpiUnit}>개</span>
            </div>
          </div>
          <div className={`${styles.kpiCard} ${styles.kpiCardEvent}`}>
            <div className={styles.kpiLabelEvent}>이벤트</div>
            <div className={`${styles.kpiValue} ${styles.kpiValueEvent}`}>
              {counts.event}
              <span className={styles.kpiUnit}>개</span>
            </div>
          </div>
        </div>

        {/* ── 링크 생성 2-버튼 CTA ── */}
        <div className={styles.createGrid}>
          <button className={styles.createGeneral} onClick={() => setShowGeneral(true)}>
            <div className={styles.createHeader}>
              <Link2 size={14} />
              <span>일반 링크</span>
            </div>
            <span className={styles.createSubText}>회원 초대용 기본 링크</span>
          </button>
          <button className={styles.createEvent} onClick={() => setShowEvent(true)}>
            <div className={styles.createEventHeader}>
              <Sparkles size={14} />
              <span>이벤트 링크</span>
            </div>
            <span className={styles.createEventSubText}>파트너사 이벤트 공동개최</span>
          </button>
        </div>

        {/* ── 필터 탭 ── */}
        <div className={styles.filterTabs}>
          {TABS.map((t) => (
            <button
              key={t.k}
              className={`${styles.filterTab} ${filter === t.k ? styles.filterTabActive : ''}`}
              onClick={() => setFilter(t.k)}
            >
              {t.l}
              <span className={`${styles.filterBadge} ${filter === t.k ? styles.filterBadgeActive : ''}`}>
                {t.n}
              </span>
            </button>
          ))}
        </div>

        {/* ── 링크 리스트 ── */}
        <div className={styles.list}>
          {isLoading ? (
            [1, 2, 3].map((i) => <SkeletonListItem key={i} />)
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Link2 size={20} color="var(--ink-300)" />
              <p className={styles.emptyText}>해당하는 링크가 없어요</p>
            </div>
          ) : (
            filtered.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                copiedId={copiedId}
                onCopy={handleCopy}
                onEventCopy={handleEventCopy}
                onRevoke={setRevokeTarget}
                navigate={navigate}
              />
            ))
          )}
        </div>
      </div>

      {/* ── 일반 링크 생성 시트 ── */}
      {showGeneral && (
        <div className={styles.sheetOverlay} onClick={closeGeneral}>
          <div className={styles.sheetPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeaderRow}>
              <Link2 size={18} color="var(--ink-900)" />
              <h2 className={styles.sheetTitle}>일반 초대링크</h2>
            </div>
            <p className={styles.sheetDesc}>라벨을 지정하면 어떤 용도의 링크인지 구분하기 쉬워요.</p>

            <div className={styles.sheetField}>
              <div className={styles.sheetFieldLabel}>라벨 (선택)</div>
              <input
                className={styles.sheetInput}
                value={generalLabel}
                onChange={(e) => setGeneralLabel(e.target.value)}
                placeholder="예: 홍길동 소개용"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateGeneral()}
              />
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.btnGhost} onClick={closeGeneral}>취소</button>
              <button className={styles.btnPrimary} onClick={handleCreateGeneral}>생성</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 이벤트 링크 생성 시트 ── */}
      {showEvent && (
        <div className={styles.sheetOverlay} onClick={closeEvent}>
          <div className={`${styles.sheetPanel} ${styles.sheetPanelEvent}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeaderRow}>
              <div className={styles.sheetEventIcon}>
                <Sparkles size={16} color="var(--tangerine-700)" />
              </div>
              <div>
                <h2 className={styles.sheetTitle}>이벤트 링크 만들기</h2>
                <div className={styles.sheetEventSub}>파트너사 공동개최용</div>
              </div>
            </div>
            <p className={styles.sheetDesc}>
              입점 업체명을 입력하면 업체명이 표시된 <strong style={{ color: 'var(--ink-700)' }}>이벤트 페이지</strong>와 링크가 생성됩니다.
            </p>

            <div className={styles.sheetField}>
              <div className={styles.sheetFieldLabel}>입점 업체명</div>
              <input
                className={styles.sheetInput}
                value={eventPartner}
                onChange={(e) => setEventPartner(e.target.value)}
                placeholder="예: 와인주막차차 여의도"
                autoFocus
              />
              <div className={styles.sheetHint}>이벤트 페이지 배너에 "OOO와 함께하는 특별 이벤트"로 표시돼요</div>
            </div>

            <div className={styles.sheetField}>
              <div className={styles.sheetFieldLabel}>라벨 (선택)</div>
              <input
                className={styles.sheetInput}
                value={eventLabel}
                onChange={(e) => setEventLabel(e.target.value)}
                placeholder="내부용 메모"
              />
            </div>

            {eventPartner.trim() && (
              <div className={styles.previewUrlBox}>
                <div className={styles.previewUrlLabel}>생성 URL</div>
                <div className={styles.previewUrl}>{eventPreviewUrl}</div>
              </div>
            )}

            <div className={styles.sheetActions}>
              <button className={styles.btnGhost} onClick={closeEvent}>취소</button>
              <button
                className={`${styles.btnPrimary} ${styles.btnAccent}`}
                onClick={handleCreateEvent}
                disabled={!eventPartner.trim()}
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke confirm modal ── */}
      {revokeTarget && (
        <ConfirmModal
          title="초대 폐기"
          message="이 초대 링크를 폐기하시겠습니까? 더 이상 사용할 수 없게 됩니다."
          confirmLabel="폐기"
          danger
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}

// ── InviteCard sub-component ─────────────────────────────────────────────────
function InviteCard({ invite, copiedId, onCopy, onEventCopy, onRevoke, navigate }) {
  const { type, partner, displayLabel, status, registeredClients, useCount, createdAt } = invite;
  const isEvent = type === 'event';
  const isActive = status === 'active';
  const isRevoked = status === 'revoked';
  const n = useCount ?? (registeredClients?.length ?? 0);
  const clients = registeredClients || [];

  return (
    <div
      className={`${styles.card} ${isEvent && isActive ? styles.cardEvent : ''} ${isRevoked ? styles.cardRevoked : ''}`}
    >
      {/* Header row: type badge + label + status badge */}
      <div className={styles.cardHeader}>
        {isEvent ? (
          <span className={styles.typeBadgeEvent}>
            <Sparkles size={9} />
            이벤트
          </span>
        ) : (
          <span className={styles.typeBadgeGeneral}>일반</span>
        )}
        <div className={styles.cardLabel}>{displayLabel || '라벨 없음'}</div>
        {isRevoked ? (
          <span className={styles.statusBadgeRevoked}>폐기</span>
        ) : n > 0 ? (
          <span className={styles.statusBadgeMint}>가입 {n}</span>
        ) : (
          <span className={styles.statusBadgeInk}>대기</span>
        )}
      </div>

      {/* Event partner box */}
      {isEvent && partner && (
        <div className={styles.partnerBox}>
          <span className={styles.partnerKey}>파트너</span>
          <span className={styles.partnerValue}>{partner}</span>
        </div>
      )}

      {/* Registered client chips */}
      {clients.length > 0 && (
        <div className={styles.clientChips}>
          <span className={styles.clientsLabel}>등록:</span>
          {clients.slice(0, 4).map((c) => (
            <span
              key={c.id || c.name}
              className={styles.clientChip}
              onClick={() => c.id && navigate(`/dashboard/clients/${c.id}`)}
              style={c.id ? { cursor: 'pointer' } : {}}
            >
              {c.name || c}
            </span>
          ))}
          {clients.length > 4 && (
            <span className={styles.clientOverflow}>+{clients.length - 4}</span>
          )}
        </div>
      )}

      {/* Action row */}
      <div className={styles.cardActions}>
        <button className={styles.btnSoft} onClick={() => onCopy(invite)}>
          {copiedId === invite.id ? <Check size={12} /> : <Copy size={12} />}
          {copiedId === invite.id ? '복사됨!' : '복사'}
        </button>
        {isEvent && isActive && (
          <button className={styles.btnGhostSm} onClick={() => onEventCopy(invite)}>
            미리보기
          </button>
        )}
        {isActive && (
          <button className={styles.btnGhostSm} onClick={() => onRevoke(invite)}>
            폐기
          </button>
        )}
        <div style={{ flex: 1 }} />
        <span className={styles.cardDate}>
          <Calendar size={10} />
          {formatDate(createdAt)}
        </span>
      </div>
    </div>
  );
}
