import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Users, ChevronRight, AlertCircle,
  Mail, Phone, Landmark,
} from 'lucide-react';
import * as adminService from '../../../api/adminService';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import Pagination from '../../../components/Pagination';
import styles from './AdminManagers.module.css';

const PAGE_SIZE = 20;

const won = (n) => (n == null ? '0' : n.toLocaleString('ko-KR'));

// 정산 대기 여부 필터 칩
const FILTER_CHIPS = [
  { value: 'all', label: '전체' },
  { value: 'unpaid', label: '정산 대기' },
];

// 매니저 정보 조회 패널 — 관리자 대시보드 '매니저 정보' 탭과 단독 라우트에서 재사용.
// 조회 위주: 검색 + 이름·연락처·계좌·정산상태. 행 클릭 시 매니저별 정산 상세로 이동.
export function ManagerInfoList() {
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unpaid'
  const [page, setPage] = useState(0); // 0-based

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

  // 매니저 목록 — 활성 매니저만
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .listManagers({ search: search || undefined, status: 'active', page, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        // role 구분 없이 전체(관리자·매니저) 표시
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

  const openManager = (m) => {
    const qs = new URLSearchParams({ managerId: m.id, name: m.name || '' });
    // 계좌·누적 금액은 state 로 전달(계좌=PII → URL 미사용). month 미전달 → 상세는 미지급 최근 달로 진입.
    navigate(`/dashboard/admin/settlements?${qs.toString()}`, {
      state: {
        bankName: m.bankName,
        bankNumber: m.bankNumber,
        unsettledAmount: m.unsettledAmount,
        settledAmount: m.settledAmount,
      },
    });
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
              onClick={() => openManager(m)}
            >
              <div className={styles.rowMain}>
                <div className={styles.rowTopLine}>
                  <span className={styles.rowName}>{m.name || '이름 없음'}</span>
                  {m.nickname && <span className={styles.rowNickname}>@{m.nickname}</span>}
                </div>

                {/* 연락처·계좌 나열 */}
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

                {/* 정산 상태: 미지급(주) + 누적지급(부) */}
                <div className={styles.amountBlock}>
                  <span className={`${styles.amtUnpaid} ${unpaid ? styles.amtUnpaidOn : ''}`}>
                    총 미지급 <strong>{won(m.unsettledAmount)}</strong>원
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
    <div>
      <div className={styles.infoMeta}>
        매니저 정보 조회{pagination.total ? ` · 총 ${pagination.total}명` : ''}
      </div>

      {/* 검색 + 칩 필터 */}
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

// 단독 라우트(/dashboard/admin/managers) 직접 진입 시 폴백.
// 보통은 /dashboard/admin?tab=managers 로 리다이렉트되어 AdminDashboard 탭에서 렌더된다.
export default function AdminManagers() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>매니저 정보</h1>
        <p className={styles.subtitle}>매니저 정보를 조회하고 정산 상세로 이동할 수 있어요.</p>
      </div>
      <ManagerInfoList />
    </div>
  );
}
