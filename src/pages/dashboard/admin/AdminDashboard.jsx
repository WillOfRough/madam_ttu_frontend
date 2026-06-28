import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, Wallet, CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, ArrowLeft, Users,
} from 'lucide-react';
import * as adminService from '../../../api/adminService';
import Card from '../../../components/Card';
import EmptyState from '../../../components/EmptyState';
import ConfirmModal from '../../../components/ConfirmModal';
import { toast } from '../../../store/toastStore';
import { ManagerInfoList } from './AdminManagers';
import styles from './AdminDashboard.module.css';

const won = (n) => (n == null ? '0' : Math.abs(n).toLocaleString('ko-KR'));

const TABS = [
  { k: 'settlement', l: '정산·지급' },
  { k: 'managers', l: '매니저 정보' },
];

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'managers' ? 'managers' : 'settlement';
  const setTab = (k) => setSearchParams(k === 'managers' ? { tab: 'managers' } : {});

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <ShieldCheck size={20} className={styles.titleIcon} />
          <h1 className={styles.title}>관리자</h1>
        </div>
        <p className={styles.subtitle}>매니저 정보와 매칭 정산·지급을 관리합니다.</p>
      </div>

      {/* 탭: 정산·지급 / 매니저 정보 */}
      <div className={styles.tabBar} role="tablist" aria-label="관리자 메뉴">
        {TABS.map((t) => (
          <button
            key={t.k}
            type="button"
            role="tab"
            aria-selected={tab === t.k}
            className={`${styles.tabBtn} ${tab === t.k ? styles.tabBtnActive : ''}`}
            onClick={() => setTab(t.k)}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === 'managers' ? <ManagerInfoList /> : <SettlementBoard />}
    </div>
  );
}

/* === 정산·지급 보드 (전 매니저 월별) === */
// 매칭 종료월 기준으로, 현재월을 제외한 과거 달들을 월별로 보여준다.
// (예: 6월이면 5월 종료 매칭이 정산 대상 → 1~5월 노출, 6월 제외)
// expectedTotal/Count = 정산예정(ready_to_settle), settledTotal/Count = 지급완료.
function SettlementBoard() {
  const now = useMemo(() => new Date(), []);
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const [year, setYear] = useState(curYear);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // 표시 월 상한: 현재 연도는 (현재월-1)까지(현재월 제외), 과거 연도는 12월까지.
  const lastMonth = year < curYear ? 12 : curMonth - 1;

  // 연도 변경 시 드릴다운 해제
  useEffect(() => { setSelectedMonth(null); }, [year]);

  // 월별 overview 일괄 조회 (월 수만큼, allSettled 로 부분 실패 허용)
  useEffect(() => {
    let cancelled = false;
    if (lastMonth < 1) {
      setMonths([]);
      setError(null);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setError(null);
    const list = [];
    for (let m = 1; m <= lastMonth; m += 1) list.push(m);
    Promise.allSettled(list.map((m) => adminService.getSettlementOverview({ year, month: m })))
      .then((results) => {
        if (cancelled) return;
        if (results.every((r) => r.status === 'rejected')) {
          setError(adminService.getAdminErrorMessage(results[0]?.reason, '정산 현황을 불러오지 못했습니다.'));
          setMonths([]);
          return;
        }
        setMonths(results.map((r, i) => {
          const month = list[i];
          const o = r.status === 'fulfilled' ? (r.value || {}) : {};
          return {
            month,
            expectedTotal: o.expectedTotal || 0,
            expectedCount: o.expectedCount || 0,
            settledTotal: o.settledTotal || 0,
            settledCount: o.settledCount || 0,
          };
        }));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, lastMonth]);

  const totals = useMemo(() => months.reduce(
    (acc, m) => ({
      expectedTotal: acc.expectedTotal + (m.expectedTotal || 0),
      expectedCount: acc.expectedCount + (m.expectedCount || 0),
      settledTotal: acc.settledTotal + (m.settledTotal || 0),
      settledCount: acc.settledCount + (m.settledCount || 0),
    }),
    { expectedTotal: 0, expectedCount: 0, settledTotal: 0, settledCount: 0 },
  ), [months]);

  const rowsDesc = useMemo(() => [...months].sort((a, b) => b.month - a.month), [months]);

  if (selectedMonth != null) {
    return <MonthManagerList year={year} month={selectedMonth} onBack={() => setSelectedMonth(null)} />;
  }

  return (
    <div className={styles.board}>
      {/* 연도 스텝퍼 */}
      <div className={styles.boardHead}>
        <div className={styles.yearStepper}>
          <button className={styles.yearBtn} onClick={() => setYear((y) => y - 1)} aria-label="이전 연도">
            <ChevronLeft size={16} />
          </button>
          <span className={styles.yearLabel}>{year}년</span>
          <button
            className={styles.yearBtn}
            onClick={() => setYear((y) => Math.min(curYear, y + 1))}
            disabled={year >= curYear}
            aria-label="다음 연도"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <span className={styles.boardCaption}>매칭 종료월 기준 · 현재월 제외</span>
      </div>

      {/* 요약 2값: 정산예정 / 지급완료 */}
      <div className={styles.summaryRow}>
        <div className={`${styles.summaryCard} ${styles.summaryExpected}`}>
          <div className={styles.summaryIcon}><Wallet size={16} /></div>
          <div className={styles.summaryLabel}>정산 예정</div>
          <div className={styles.summaryValue}>
            {won(totals.expectedTotal)}<span className={styles.summaryUnit}>원</span>
          </div>
          <div className={styles.summaryCount}>{loading ? ' ' : `${totals.expectedCount}건`}</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summarySettled}`}>
          <div className={styles.summaryIcon}><CheckCircle2 size={16} /></div>
          <div className={styles.summaryLabel}>지급 완료</div>
          <div className={styles.summaryValue}>
            {won(totals.settledTotal)}<span className={styles.summaryUnit}>원</span>
          </div>
          <div className={styles.summaryCount}>{loading ? ' ' : `${totals.settledCount}건`}</div>
        </div>
      </div>

      {/* 월별 리스트 */}
      <div className={styles.monthCard}>
        <div className={styles.monthCardTitle}>월별 정산 현황</div>
        {loading ? (
          <div className={styles.stateBox}><div className={styles.spinner} /></div>
        ) : error ? (
          <div className={styles.stateBox}>
            <AlertCircle size={18} color="var(--rose-600)" />
            <span style={{ color: 'var(--rose-600)' }}>{error}</span>
          </div>
        ) : rowsDesc.length === 0 ? (
          <div className={styles.stateBox}><span>{year}년은 아직 정산할 달이 없어요</span></div>
        ) : (
          <div className={styles.monthList}>
            {rowsDesc.map((m) => {
              const hasUnpaid = m.expectedCount > 0;
              const hasSettled = m.settledCount > 0;
              const active = hasUnpaid || hasSettled;
              return (
                <button
                  key={m.month}
                  type="button"
                  className={`${styles.monthRow} ${active ? '' : styles.monthRowEmpty}`}
                  onClick={() => active && setSelectedMonth(m.month)}
                  disabled={!active}
                >
                  <span className={styles.monthRowLabel}>{m.month}월</span>
                  <div className={styles.monthRowMeta}>
                    {hasUnpaid ? (
                      <span className={styles.monthRowUnpaid}>
                        정산예정 {won(m.expectedTotal)}원 · 정산 {m.expectedCount}건
                      </span>
                    ) : (
                      <span className={styles.monthRowNone}>정산예정 없음</span>
                    )}
                    {hasSettled && (
                      <span className={styles.monthRowPaid}>
                        지급완료 {won(m.settledTotal)}원 · 정산 {m.settledCount}건
                      </span>
                    )}
                  </div>
                  {hasUnpaid && <span className={styles.unpaidBadge}>미지급</span>}
                  {active && <ChevronRight size={16} className={styles.monthRowChevron} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* === 드릴다운: 특정 달의 정산 대상 매니저 목록 === */
// 전체 매니저를 모아 각자의 월별 요약을 조회한 뒤, 해당 월에 활동(미지급 또는
// 지급완료)이 있는 매니저만 미지급액 순으로 보여준다. (매니저 수만큼 호출, 8개씩 청크)
function MonthManagerList({ year, month, onBack }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        // role 구분 없이 전체 계정 — 정산-지급 보드 합계(overview)와 모집단을 일치시켜
        // '정산-지급엔 미지급 있는데 목록엔 0' 같은 불일치를 막는다.
        const all = await adminService.listAllManagers();
        const collected = [];
        const CHUNK = 8;
        for (let i = 0; i < all.length; i += CHUNK) {
          if (cancelled) return;
          const slice = all.slice(i, i + CHUNK);
          const summaries = await Promise.allSettled(
            slice.map((mgr) => adminService.getManagerMonthlySummary({ managerId: mgr.id, year })),
          );
          summaries.forEach((r, j) => {
            if (r.status !== 'fulfilled') return;
            const mgr = slice[j];
            const item = (r.value?.items || []).find((it) => it.month === month);
            if (!item) return;
            const count = item.count || 0;
            const settledCount = item.settledCount || 0;
            if (count === 0 && settledCount === 0) return;
            collected.push({
              id: mgr.id,
              name: mgr.name,
              count,
              amount: item.amount || 0,
              settledCount,
              settledAmount: item.settledAmount || 0,
              // 매니저 계좌·전기간 누적(상세 PayoutSummaryCard·라벨 정합용)
              bankName: mgr.bankName || '',
              bankNumber: mgr.bankNumber || '',
              unsettledTotal: mgr.unsettledAmount || 0,
              settledTotal: mgr.settledAmount || 0,
            });
          });
        }
        if (cancelled) return;
        collected.sort((a, b) => (b.amount || 0) - (a.amount || 0));
        setRows(collected);
      } catch (err) {
        if (!cancelled) setError(adminService.getAdminErrorMessage(err, '월별 매니저 정산을 불러오지 못했습니다.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [year, month, refreshKey]);

  const unpaid = useMemo(() => rows.filter((m) => (m.count || 0) > 0), [rows]);
  const unpaidTotal = useMemo(() => unpaid.reduce((a, m) => a + (m.amount || 0), 0), [unpaid]);

  // 이 달 미지급 매니저 전체에 settle-month 반복 호출(FE 일괄지급, 5개씩). 부분 실패 허용.
  const handleBulkSettle = async () => {
    setSubmitting(true);
    let okCount = 0; let okSettled = 0; let okAmount = 0; let fail = 0;
    const CHUNK = 5;
    for (let i = 0; i < unpaid.length; i += CHUNK) {
      const slice = unpaid.slice(i, i + CHUNK);
      const results = await Promise.allSettled(
        slice.map((m) => adminService.settleMonth({ managerId: m.id, year, month })),
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled') {
          const d = r.value?.data || {};
          okCount += 1; okSettled += d.settledCount || 0; okAmount += d.settledAmount || 0;
        } else { fail += 1; }
      });
    }
    setSubmitting(false);
    setConfirm(false);
    if (okCount > 0) {
      toast.success(`${okCount}명 지급 완료 (${okSettled}건 · ${won(okAmount)}원)${fail ? ` · ${fail}명 실패` : ''}`);
    } else if (fail > 0) {
      toast.error(`지급 처리에 실패했어요 (${fail}명)`);
    } else {
      toast.info('지급할 대상이 없습니다.');
    }
    setRefreshKey((k) => k + 1);
  };

  const openManager = (m) => {
    // 선택한 달(year/month)은 쿼리로, 계좌·누적 금액(계좌=PII)은 state 로 전달.
    const qs = new URLSearchParams({
      managerId: m.id,
      name: m.name || '',
      year: String(year),
      month: String(month),
    });
    navigate(`/dashboard/admin/settlements?${qs.toString()}`, {
      state: {
        bankName: m.bankName,
        bankNumber: m.bankNumber,
        unsettledAmount: m.unsettledTotal,
        settledAmount: m.settledTotal,
      },
    });
  };

  return (
    <div className={styles.board}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        <ArrowLeft size={16} /> 월별 현황
      </button>
      <div className={styles.drillHead}>
        <div className={styles.drillHeadText}>
          <span className={styles.drillTitle}>{year}년 {month}월 정산 대상</span>
          <span className={styles.drillCaption}>매칭 종료월 기준 · 미지급액 순</span>
        </div>
        {!loading && unpaid.length > 0 && (
          <button
            type="button"
            className={styles.bulkPayBtn}
            onClick={() => setConfirm(true)}
            disabled={submitting}
          >
            이 달 전체 지급 · {unpaid.length}명
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.stateBox}><div className={styles.spinner} /></div>
      ) : error ? (
        <div className={styles.stateBox}>
          <AlertCircle size={18} color="var(--rose-600)" />
          <span style={{ color: 'var(--rose-600)' }}>{error}</span>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="해당 월 정산 내역이 없어요" hint="다른 달을 선택해 보세요." />
      ) : (
        <div className={styles.mgrList}>
          {rows.map((m) => (
            <Card key={m.id} as="button" interactive className={styles.mgrRow} onClick={() => openManager(m)}>
              <div className={styles.mgrMain}>
                <div className={styles.mgrName}>{m.name || '이름 없음'}</div>
                <div className={styles.mgrAmounts}>
                  {m.count > 0 && (
                    <span className={styles.mgrUnpaid}>이 달 미지급 {won(m.amount)}원 · 정산 {m.count}건</span>
                  )}
                  {m.settledCount > 0 && (
                    <>
                      {m.count > 0 && <span className={styles.mgrDot}>·</span>}
                      <span className={styles.mgrPaid}>이 달 지급완료 {won(m.settledAmount)}원 · 정산 {m.settledCount}건</span>
                    </>
                  )}
                </div>
                {m.unsettledTotal > 0 && (
                  <div className={styles.mgrTotalUnpaid}>전체 미지급 {won(m.unsettledTotal)}원</div>
                )}
              </div>
              <ChevronRight size={18} className={styles.mgrChevron} />
            </Card>
          ))}
        </div>
      )}

      {confirm && (
        <ConfirmModal
          title="이 달 전체 지급"
          message={`${year}년 ${month}월 미지급 ${unpaid.length}명 · ${won(unpaidTotal)}원을 모두 지급 완료 처리할까요? 되돌릴 수 없습니다.`}
          confirmLabel={submitting ? '처리 중…' : '전체 지급'}
          cancelLabel="취소"
          onConfirm={handleBulkSettle}
          onCancel={() => !submitting && setConfirm(false)}
        />
      )}
    </div>
  );
}
