import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, CheckCircle2, Clock, Users, ChevronRight, ArrowRight, AlertCircle, ShieldCheck,
} from 'lucide-react';
import * as adminService from '../../../api/adminService';
import Card from '../../../components/Card';
import styles from './AdminDashboard.module.css';

const won = (n) => (n == null ? '0' : Math.abs(n).toLocaleString('ko-KR'));

// 이번 달 / 지난 달 → { year, month }
function resolveMonth(sel) {
  const now = new Date();
  const base = sel === 'last'
    ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
    : now;
  return { year: base.getFullYear(), month: base.getMonth() + 1 };
}

const TOP_MANAGERS = 5; // 대시보드에 노출할 상위 매니저 수

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [monthSel, setMonthSel] = useState('this');
  const { year, month } = useMemo(() => resolveMonth(monthSel), [monthSel]);

  const [overview, setOverview] = useState(null);
  const [ovLoading, setOvLoading] = useState(true);
  const [ovError, setOvError] = useState(null);

  const [managers, setManagers] = useState([]);
  const [mgrTotal, setMgrTotal] = useState(0);
  const [mgrLoading, setMgrLoading] = useState(true);
  const [mgrError, setMgrError] = useState(null);

  // 전 매니저 월 요약(overview) — 월 토글에 따라 재조회
  useEffect(() => {
    let cancelled = false;
    setOvLoading(true);
    setOvError(null);
    adminService
      .getSettlementOverview({ year, month })
      .then((res) => { if (!cancelled) setOverview(res); })
      .catch((err) => {
        if (!cancelled) setOvError(adminService.getAdminErrorMessage(err, '정산 요약을 불러오지 못했습니다.'));
      })
      .finally(() => { if (!cancelled) setOvLoading(false); });
    return () => { cancelled = true; };
  }, [year, month]);

  // 매니저 목록 — 미지급액 많은 순(서버 정렬 미지원 → 로드분 클라이언트 정렬)
  useEffect(() => {
    let cancelled = false;
    setMgrLoading(true);
    setMgrError(null);
    adminService
      .listManagers({ page: 0, size: 20 })
      .then((res) => {
        if (cancelled) return;
        const list = [...(res?.data || [])].sort(
          (a, b) => (b.unsettledAmount || 0) - (a.unsettledAmount || 0),
        );
        setManagers(list);
        setMgrTotal(res?.pagination?.total ?? res?.pagination?.totalElements ?? list.length);
      })
      .catch((err) => {
        if (cancelled) return;
        setMgrError(adminService.getAdminErrorMessage(err, '매니저 목록을 불러오지 못했습니다.'));
      })
      .finally(() => { if (!cancelled) setMgrLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openManager = (m) => {
    const qs = new URLSearchParams({ managerId: m.id, name: m.name || '' });
    navigate(`/dashboard/admin/settlements?${qs.toString()}`);
  };

  const kpis = [
    {
      key: 'expected',
      tone: 'tangerine',
      icon: Wallet,
      label: '정산 예정',
      amount: overview?.expectedTotal ?? 0,
      count: overview?.expectedCount ?? 0,
    },
    {
      key: 'settled',
      tone: 'mint',
      icon: CheckCircle2,
      label: '지급 완료',
      amount: overview?.settledTotal ?? 0,
      count: overview?.settledCount ?? 0,
    },
    {
      key: 'potential',
      tone: 'lilac',
      icon: Clock,
      label: '만남 전 잠재',
      amount: overview?.potentialTotal ?? 0,
      count: overview?.potentialCount ?? 0,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <ShieldCheck size={20} className={styles.titleIcon} />
          <h1 className={styles.title}>관리자 대시보드</h1>
        </div>
        <p className={styles.subtitle}>전 매니저 정산 현황과 지급 우선순위를 한눈에 봅니다.</p>
      </div>

      {/* 월 토글 */}
      <div className={styles.monthToggle} role="tablist" aria-label="기준 월">
        {[{ k: 'this', l: '이번 달' }, { k: 'last', l: '지난 달' }].map((o) => (
          <button
            key={o.k}
            type="button"
            role="tab"
            aria-selected={monthSel === o.k}
            className={`${styles.monthBtn} ${monthSel === o.k ? styles.monthBtnActive : ''}`}
            onClick={() => setMonthSel(o.k)}
          >
            {o.l}
          </button>
        ))}
        <span className={styles.monthLabel}>{year}년 {month}월 · 매칭 종료월 기준</span>
      </div>

      {/* KPI 카드 */}
      {ovError ? (
        <div className={styles.errorBox}>
          <AlertCircle size={18} color="var(--rose-600)" />
          <span>{ovError}</span>
        </div>
      ) : (
        <div className={styles.kpiGrid}>
          {kpis.map((k) => (
            <div key={k.key} className={`${styles.kpiCard} ${styles[k.tone]}`}>
              <div className={styles.kpiIcon}><k.icon size={18} /></div>
              <div className={styles.kpiLabel}>{k.label}</div>
              <div className={styles.kpiAmount}>
                {ovLoading ? <span className={styles.kpiSkeleton} /> : (
                  <>{won(k.amount)}<span className={styles.kpiUnit}>원</span></>
                )}
              </div>
              <div className={styles.kpiCount}>{ovLoading ? ' ' : `${k.count}건`}</div>
            </div>
          ))}
        </div>
      )}

      {/* 매니저 정산 섹션 */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <div className={styles.sectionTitle}>매니저 정산</div>
            <div className={styles.sectionMeta}>미지급액 많은 순{mgrTotal ? ` · 총 ${mgrTotal}명` : ''}</div>
          </div>
          <button className={styles.linkBtn} onClick={() => navigate('/dashboard/admin/managers')}>
            전체 보기 <ArrowRight size={14} />
          </button>
        </div>

        {mgrLoading ? (
          <div className={styles.stateBox}><div className={styles.spinner} /></div>
        ) : mgrError ? (
          <div className={styles.stateBox}>
            <AlertCircle size={18} color="var(--rose-600)" />
            <span style={{ color: 'var(--rose-600)' }}>{mgrError}</span>
          </div>
        ) : managers.length === 0 ? (
          <div className={styles.stateBox}>
            <Users size={20} color="var(--ink-300)" />
            <span>매니저가 없어요</span>
          </div>
        ) : (
          <div className={styles.mgrList}>
            {managers.slice(0, TOP_MANAGERS).map((m) => (
              <Card key={m.id} as="button" interactive className={styles.mgrRow} onClick={() => openManager(m)}>
                <div className={styles.mgrMain}>
                  <div className={styles.mgrNameLine}>
                    <span className={styles.mgrName}>{m.name || '이름 없음'}</span>
                    <span className={`${styles.roleBadge} ${m.role === 'admin' ? styles.roleAdmin : styles.roleManager}`}>
                      {m.role === 'admin' ? '운영자' : '매니저'}
                    </span>
                  </div>
                  <div className={styles.mgrAmounts}>
                    <span className={styles.mgrUnpaid}>미지급 {won(m.unsettledAmount)}원</span>
                    <span className={styles.mgrDot}>·</span>
                    <span className={styles.mgrPaid}>누적지급 {won(m.settledAmount)}원</span>
                  </div>
                </div>
                <ChevronRight size={18} className={styles.mgrChevron} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
