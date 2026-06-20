import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, ChevronRight, AlertCircle } from 'lucide-react';
import * as adminService from '../../../api/adminService';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import Pagination from '../../../components/Pagination';
import styles from './AdminManagers.module.css';

const ROLE_OPTIONS = [
  { value: '', label: '역할 전체' },
  { value: 'manager', label: '매니저' },
  { value: 'admin', label: '운영자' },
];

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
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('unsettled');
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

  // 필터 변경 시 첫 페이지로
  useEffect(() => { setPage(0); }, [search, role, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .listManagers({ search: search || undefined, role: role || undefined, status: status || undefined, page, size: PAGE_SIZE })
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
  }, [search, role, status, page]);

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

  const openSettlement = (m) => {
    const qs = new URLSearchParams({ managerId: m.id, name: m.name || '' });
    navigate(`/dashboard/admin/settlements?${qs.toString()}`);
  };

  const body = useMemo(() => {
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
    if (!managers.length) {
      return <EmptyState icon={Users} title="매니저가 없어요" hint="검색·필터 조건을 바꿔보세요." />;
    }
    return (
      <div className={styles.list}>
        {sortedManagers.map((m) => (
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
                <span className={`${styles.roleBadge} ${m.role === 'admin' ? styles.roleAdmin : styles.roleManager}`}>
                  {m.role === 'admin' ? '운영자' : '매니저'}
                </span>
                {m.status && m.status !== 'active' && (
                  <span className={styles.statusBadge}>{m.status === 'deleted' ? '삭제' : m.status}</span>
                )}
              </div>
              <div className={styles.rowSub}>
                {m.email || '-'}{m.phone ? ` · ${m.phone}` : ''}
              </div>
              <div className={styles.rowAmounts}>
                <span className={styles.amtUnpaid}>미지급 {won(m.unsettledAmount)}원</span>
                <span className={styles.amtDot}>·</span>
                <span className={styles.amtPaid}>누적지급 {won(m.settledAmount)}원</span>
              </div>
            </div>
            <ChevronRight size={18} className={styles.rowChevron} />
          </Card>
        ))}
      </div>
    );
  }, [loading, error, sortedManagers]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>매니저 관리</h1>
        <p className={styles.subtitle}>정산을 조회할 매니저를 선택하세요{pagination.total ? ` · 총 ${pagination.total}명` : ''}</p>
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
          <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={styles.select} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {body}

      <Pagination
        page={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />
    </div>
  );
}
