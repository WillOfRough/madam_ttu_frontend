import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronRight, AlertCircle, Wallet, CheckCircle2, Clock } from 'lucide-react';
import * as adminService from '../../../api/adminService';
import Card from '../../../components/Card';
import SummaryCard from '../../../components/SummaryCard';
import EmptyState from '../../../components/EmptyState';
import Pagination from '../../../components/Pagination';
import styles from './AdminManagers.module.css';

const STATUS_OPTIONS = [
  { value: '', label: '상태 전체' },
  { value: 'active', label: '활성' },
  { value: 'deleted', label: '삭제' },
];

// 정렬 — 서버 정렬 파라미터가 없어 현재 로드된 페이지 내에서만 클라이언트 정렬.
const SORT_OPTIONS = [
  { value: 'unsettled', label: '미지급액 많은 순' },
  { value: 'settled', label: '누적지급 많은 순' },
  { value: 'name', label: '이름순' },
];

const PAGE_SIZE = 20;

const won = (n) => (n == null ? '0' : Math.abs(n).toLocaleString('ko-KR'));

export default function AdminManagers() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('unsettled');
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [page, setPage] = useState(0); // 0-based

  // 요약 대시보드 (전 매니저 월 정산 요약) — 이번 달/지난 달
  const [overviewMonth, setOverviewMonth] = useState('this'); // 'this' | 'last'
  const [overview, setOverview] = useState(null);

  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 검색 입력 300ms 디바운스
  const debounceRef = useRef(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // 필터 변경 시 첫 페이지로
  useEffect(() => { setPage(0); }, [search, status]);

  // 요약: 이번 달/지난 달의 연·월 계산
  const overviewYM = useMemo(() => {
    const base = new Date();
    const d = new Date(base.getFullYear(), base.getMonth() - (overviewMonth === 'last' ? 1 : 0), 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [overviewMonth]);

  const overviewLabel = `${overviewYM.year}년 ${overviewYM.month}월`;

  useEffect(() => {
    let cancelled = false;
    adminService
      .getSettlementOverview(overviewYM)
      .then((res) => { if (!cancelled) setOverview(res); })
      .catch(() => { if (!cancelled) setOverview(null); });
    return () => { cancelled = true; };
  }, [overviewYM]);

  // 매니저 목록 — 운영자는 다루지 않으므로 role=manager 고정 (역할 필터 제거)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .listManagers({ search: search || undefined, role: 'manager', status: status || undefined, page, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setManagers(res?.data || []);
        setPagination(res?.pagination || { page: 0, total: 0, totalPages: 1 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(adminService.getAdminErrorMessage(err, '매니저 목록을 불러오지 못했습니다.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, status, page]);

  const totalPages = pagination.totalPages || 1;

  // 현재 페이지 클라이언트 정렬 (서버 정렬 미지원)
  const sortedManagers = useMemo(() => {
    const list = [...managers];
    if (sort === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
    } else if (sort === 'settled') {
      list.sort((a, b) => (b.settledAmount || 0) - (a.settledAmount || 0));
    } else {
      list.sort((a, b) => (b.unsettledAmount || 0) - (a.unsettledAmount || 0));
    }
    return list;
  }, [managers, sort]);

  // '정산 대기만' — 미지급액 있는 매니저만 (현재 페이지 한정 클라이언트 필터)
  const visibleManagers = useMemo(
    () => (onlyUnpaid ? sortedManagers.filter((m) => (m.unsettledAmount || 0) > 0) : sortedManagers),
    [sortedManagers, onlyUnpaid],
  );

  const openSettlement = (m) => {
    const qs = new URLSearchParams({ managerId: m.id, name: m.name || '' });
    navigate(`/dashboard/admin/settlements?${qs.toString()}`);
  };

  const renderBody = () => {
    if (loading) {
      return <div className={styles.stateBox}><div className={styles.spinner} /></div>;
    }
    if (error) {
      return (
        <div className={styles.stateBox}>
          <AlertCircle size={20} color="var(--rose-600)" />
          <span style={{ color: 'var(--rose-600)' }}>{error}</span>
        </div>
      );
    }
    if (!visibleManagers.length) {
      return (
        <EmptyState
          icon={Users}
          title={onlyUnpaid ? '정산 대기 중인 매니저가 없어요' : '매니저가 없어요'}
          hint={onlyUnpaid ? '필터를 해제하면 전체 매니저를 볼 수 있어요.' : '검색·필터 조건을 바꿔보세요.'}
        />
      );
    }
    return (
      <div className={styles.list}>
        {visibleManagers.map((m) => {
          const unpaid = (m.unsettledAmount || 0) > 0;
          return (
            <Card
              key={m.id}
              as="button"
              interactive
              className={`${styles.row} ${unpaid ? styles.rowUnpaid : ''}`}
              onClick={() => openSettlement(m)}
            >
              <div className={styles.rowMain}>
                <div className={styles.rowTopLine}>
                  <span className={styles.rowName}>{m.name || '이름 없음'}</span>
                  {m.nickname && <span className={styles.rowNickname}>@{m.nickname}</span>}
                  {unpaid && <span className={styles.unpaidBadge}>미지급</span>}
                  {m.status && m.status !== 'active' && (
                    <span className={styles.statusBadge}>{m.status === 'deleted' ? '삭제' : m.status}</span>
                  )}
                </div>
                <div className={styles.rowSub}>
                  {m.email || '-'}{m.phone ? ` · ${m.phone}` : ''}
                </div>
                <div className={styles.rowAmounts}>
                  <span className={`${styles.amtUnpaid} ${unpaid ? styles.amtUnpaidOn : ''}`}>
                    미지급 <strong>{won(m.unsettledAmount)}</strong>원
                  </span>
                  <span className={styles.amtDot}>·</span>
                  <span className={styles.amtPaid}>누적지급 {won(m.settledAmount)}원</span>
                </div>
              </div>
              <ChevronRight size={18} className={styles.rowChevron} />
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>매니저 정산 관리</h1>
        <p className={styles.subtitle}>정산할 매니저를 선택하세요{pagination.total ? ` · 총 ${pagination.total}명` : ''}</p>
      </div>

      {/* === 요약 대시보드 === */}
      <div className={styles.summarySection}>
        <div className={styles.summaryHead}>
          <span className={styles.summaryTitle}>{overviewLabel} 정산 현황</span>
          <div className={styles.monthToggle}>
            {[{ k: 'this', l: '이번 달' }, { k: 'last', l: '지난 달' }].map((o) => (
              <button
                key={o.k}
                type="button"
                className={`${styles.monthToggleBtn} ${overviewMonth === o.k ? styles.monthToggleBtnActive : ''}`}
                onClick={() => setOverviewMonth(o.k)}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.summaryRow}>
          <SummaryCard
            icon={Wallet}
            color="coral"
            value={`${won(overview?.expectedTotal)}원`}
            label={`미지급(정산 예정) · ${overview?.expectedCount ?? 0}건`}
          />
          <SummaryCard
            icon={CheckCircle2}
            color="success"
            value={`${won(overview?.settledTotal)}원`}
            label={`지급 완료 · ${overview?.settledCount ?? 0}건`}
          />
          <SummaryCard
            icon={Clock}
            color="pending"
            value={`${won(overview?.potentialTotal)}원`}
            label={`만남 전 잠재 · ${overview?.potentialCount ?? 0}건`}
          />
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름·닉네임 검색 / 이메일·전화 정확히 입력"
          />
        </div>
        <div className={styles.selects}>
          <button
            type="button"
            className={`${styles.unpaidFilterBtn} ${onlyUnpaid ? styles.unpaidFilterBtnActive : ''}`}
            onClick={() => setOnlyUnpaid((v) => !v)}
            aria-pressed={onlyUnpaid}
          >
            정산 대기만
          </button>
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {renderBody()}

      <Pagination
        page={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />
    </div>
  );
}
