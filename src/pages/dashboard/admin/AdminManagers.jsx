import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Users, ChevronRight, ChevronLeft, AlertCircle,
  Mail, Phone, Landmark,
} from 'lucide-react';
import * as adminService from '../../../api/adminService';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import Pagination from '../../../components/Pagination';
import styles from './AdminManagers.module.css';

const PAGE_SIZE = 20;

const won = (n) => (n == null ? '0' : n.toLocaleString('ko-KR'));

// 정산 대기 여부 필터 칩 (점5: 정렬 드롭다운 대신 칩 UI 로 필터 제공)
const FILTER_CHIPS = [
  { value: 'all', label: '전체' },
  { value: 'unpaid', label: '정산 대기' },
];

export default function AdminManagers() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unpaid'
  const [page, setPage] = useState(0); // 0-based

  // 월 선택 (점6: 이번달/지난달 토글 대신 월 스텝퍼로 임의의 달 조회)
  // NOTE: now 는 마운트 시점에 캡처된다. 자정을 넘기면 isCurrentMonth 가
  // 한 달 뒤처질 수 있지만, 관리자 세션 타임아웃(30분)으로 실사용 영향은 없다.
  const now = useMemo(() => new Date(), []);
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(false);

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

  // 검색 변경 시 첫 페이지로
  useEffect(() => { setPage(0); }, [search]);

  const isCurrentMonth = ym.year === now.getFullYear() && ym.month === now.getMonth() + 1;
  const stepMonth = (delta) => setYm((prev) => {
    const d = new Date(prev.year, prev.month - 1 + delta, 1);
    const next = { year: d.getFullYear(), month: d.getMonth() + 1 };
    // 미래 달은 막기
    if (next.year > now.getFullYear() || (next.year === now.getFullYear() && next.month > now.getMonth() + 1)) {
      return prev;
    }
    return next;
  });

  // 선택 월의 전체 매니저 정산 요약
  useEffect(() => {
    let cancelled = false;
    setOverviewError(false);
    adminService
      .getSettlementOverview(ym)
      .then((res) => { if (!cancelled) setOverview(res); })
      .catch(() => { if (!cancelled) { setOverview(null); setOverviewError(true); } });
    return () => { cancelled = true; };
  }, [ym]);

  // 매니저 목록 — 활성 매니저만 (점4: 활성/삭제 필터 불필요 → status=active 고정)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .listManagers({ search: search || undefined, role: 'manager', status: 'active', page, size: PAGE_SIZE })
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
  }, [search, page]);

  const totalPages = pagination.totalPages || 1;

  // 미지급액 많은 순 정렬(현재 페이지 한정) — 줘야 할 매니저가 위로.
  const sortedManagers = useMemo(
    () => [...managers].sort((a, b) => (b.unsettledAmount || 0) - (a.unsettledAmount || 0)),
    [managers],
  );

  // '정산 대기' 칩 — 미지급액 있는 매니저만 (현재 페이지 한정 클라이언트 필터)
  const visibleManagers = useMemo(
    () => (filter === 'unpaid' ? sortedManagers.filter((m) => (m.unsettledAmount || 0) > 0) : sortedManagers),
    [sortedManagers, filter],
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
          <AlertCircle size={20} color="var(--ink-400)" />
          <span>{error}</span>
        </div>
      );
    }
    if (!visibleManagers.length) {
      return (
        <EmptyState
          icon={Users}
          title={filter === 'unpaid' ? '정산 대기 중인 매니저가 없어요' : '매니저가 없어요'}
          hint={filter === 'unpaid' ? '필터를 해제하면 전체 매니저를 볼 수 있어요.' : '검색 조건을 바꿔보세요.'}
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
              className={styles.row}
              onClick={() => openSettlement(m)}
            >
              <div className={styles.rowMain}>
                <div className={styles.rowTopLine}>
                  <span className={styles.rowName}>{m.name || '이름 없음'}</span>
                  {m.nickname && <span className={styles.rowNickname}>@{m.nickname}</span>}
                </div>

                {/* 점2: 이메일·전화번호·계좌번호 나열 */}
                <div className={styles.contact}>
                  <span className={styles.contactItem}>
                    <Mail size={13} /> {m.email || '-'}
                  </span>
                  <span className={styles.contactItem}>
                    <Phone size={13} /> {m.phone || '-'}
                  </span>
                  {(m.bankName || m.bankNumber) && (
                    <span className={styles.contactItem}>
                      <Landmark size={13} /> {[m.bankName, m.bankNumber].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>

                {/* 점3: '줘야 할 돈(미지급)'이 주, 누적지급은 분리해 작게 */}
                <div className={styles.amountBlock}>
                  <span className={`${styles.amtUnpaid} ${unpaid ? styles.amtUnpaidOn : ''}`}>
                    미지급 <strong>{won(m.unsettledAmount)}</strong>원
                  </span>
                  <span className={styles.amtPaid}>누적 지급 {won(m.settledAmount)}원</span>
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

      {/* === 월별 정산 현황 (점6: 월 선택, 점3: 이 달 줘야 할 금액 강조, 점7: 색 단순화) === */}
      <div className={styles.overviewCard}>
        <div className={styles.monthStepper}>
          <button className={styles.monthBtn} onClick={() => stepMonth(-1)} aria-label="이전 달">
            <ChevronLeft size={18} />
          </button>
          <span className={styles.monthLabel}>{ym.year}년 {ym.month}월</span>
          <button
            className={styles.monthBtn}
            onClick={() => stepMonth(1)}
            disabled={isCurrentMonth}
            aria-label="다음 달"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {overviewError ? (
          <div className={styles.overviewError}>
            <AlertCircle size={14} />
            <span>정산 현황을 불러오지 못했습니다</span>
          </div>
        ) : (
          <>
            <div className={styles.overviewMain}>
              <span className={styles.overviewLabel}>이 달 지급 예정</span>
              <span className={styles.overviewValue}>
                {won(overview?.expectedTotal)}<span className={styles.overviewUnit}>원</span>
              </span>
              <span className={styles.overviewCount}>미지급 {overview?.expectedCount ?? 0}건</span>
            </div>

            <div className={styles.overviewPaid}>
              지급 완료 <strong>{won(overview?.settledTotal)}원</strong> · {overview?.settledCount ?? 0}건
            </div>
          </>
        )}
      </div>

      {/* === 검색 + 칩 필터 (점5) === */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="이름·닉네임 검색 / 이메일·전화 정확히 입력"
            aria-label="매니저 검색"
          />
        </div>
        <div className={styles.chips} role="group" aria-label="필터">
          {FILTER_CHIPS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={`${styles.chip} ${filter === c.value ? styles.chipActive : ''}`}
              onClick={() => setFilter(c.value)}
              aria-pressed={filter === c.value}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {renderBody()}

      {/* 칩 필터 활성 시 클라이언트 필터라 서버 페이징과 불일치 → 숨김 */}
      {filter === 'all' && (
        <Pagination
          page={page + 1}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p - 1)}
        />
      )}
    </div>
  );
}
