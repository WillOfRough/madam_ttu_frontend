import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Users } from 'lucide-react';
import * as adminService from '../../../api/adminService';
import { toast } from '../../../store/toastStore';
import ConfirmModal from '../../../components/ConfirmModal';
import EmptyState from '../../../components/EmptyState';
import SettlementView from '../SettlementView';
import styles from './AdminSettlement.module.css';

const won = (n) => (n == null ? '0' : Math.abs(n).toLocaleString('ko-KR'));

const NOW = new Date();
const CURRENT_YEAR  = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;

export default function AdminSettlement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const managerId   = searchParams.get('managerId') || '';
  const managerName = searchParams.get('name') || '';

  // 선택된 월 (현재 연도 기준, 기본 = 이번 달)
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

  // 일괄지급 확인 모달 상태
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 지급 성공 / 제외 처리 후 SettlementView 재조회 키
  const [refreshKey, setRefreshKey] = useState(0);

  // service 메모이즈 (매 렌더 새 객체 → effect 무한 재실행 방지)
  const service = useMemo(() => ({
    getMonthlySummary: ({ year } = {}) =>
      adminService.getManagerMonthlySummary({ managerId, year }),
    getDailySummary: ({ from, to }) =>
      adminService.getManagerDailySummary({ managerId, from, to }),
    listSettlements: (args) =>
      adminService.listManagerSettlements({ managerId, ...args }),
  }), [managerId]);

  // ── 월별 요약 (올해 전체) ─────────────────────────────────────────
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  useEffect(() => {
    if (!managerId) return;
    let cancelled = false;
    setMonthlyLoading(true);
    adminService
      .getManagerMonthlySummary({ managerId, year: CURRENT_YEAR })
      .then((res) => { if (!cancelled) setMonthlyData(res); })
      .catch(() => { /* 조용히 실패 */ })
      .finally(() => { if (!cancelled) setMonthlyLoading(false); });
    return () => { cancelled = true; };
  }, [managerId, refreshKey]);

  // 1~현재월 칩 데이터
  const monthItems = useMemo(() => {
    const items = monthlyData?.items || [];
    const map = {};
    items.forEach((it) => { map[it.month] = it; });
    return Array.from({ length: CURRENT_MONTH }, (_, i) => {
      const m = i + 1;
      return { month: m, ...(map[m] || { count: 0, amount: 0, settledCount: 0, settledAmount: 0 }) };
    });
  }, [monthlyData]);

  const expectedTotal = monthlyData?.expectedTotal ?? 0;

  // ── 정산 제외/복구 핵심 로직 (id 배열 기반) ──────────────────────
  const excludeByIds = useCallback(async (ids, excluded) => {
    if (!ids || ids.length === 0) return false;
    try {
      await Promise.all(
        ids.map((id) =>
          adminService.toggleSettlementExclude(id, {
            excluded,
            reason: excluded ? 'manual_confirm' : undefined,
          }),
        ),
      );
      toast.success(excluded ? '정산에서 제외했습니다.' : '정산에 다시 포함했습니다.');
      setRefreshKey((k) => k + 1);
      return true;
    } catch (err) {
      toast.error(adminService.getAdminErrorMessage(err, '정산 제외 처리에 실패했습니다.'));
      return false;
    }
  }, []);

  // 단건 (영수증 시트에서 호출) — settlement 객체 받음
  const handleToggleExclude = useCallback(async (s) => {
    const ids = (s._ids && s._ids.length) ? s._ids : (s.id ? [s.id] : []);
    return excludeByIds(ids, !s.excluded);
  }, [excludeByIds]);

  // 벌크 (체크박스 액션 바에서 호출) — id 배열 + excluded bool
  const handleBulkExclude = useCallback(async (ids, excluded) => {
    await excludeByIds(ids, excluded);
  }, [excludeByIds]);

  // ── 월단위 일괄 지급 ─────────────────────────────────────────────
  const handleSettleMonth = async () => {
    if (!confirm) return;
    const { year, month } = confirm;
    setSubmitting(true);
    try {
      const res = await adminService.settleMonth({ managerId, year, month });
      const data = res?.data || {};
      if (data.settledCount > 0) {
        toast.success(`${month}월 정산 ${data.settledCount}건 (${won(data.settledAmount)}원) 지급 완료`);
      } else {
        toast.info('지급할 정산 대상이 없습니다.');
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(adminService.getAdminErrorMessage(err, '월단위 정산에 실패했습니다.'));
    } finally {
      setSubmitting(false);
      setConfirm(null);
    }
  };

  if (!managerId) {
    return (
      <div className={styles.page}>
        <BackBar onBack={() => navigate('/dashboard/admin/managers')} />
        <EmptyState
          icon={Users}
          title="매니저를 선택하세요"
          hint="매니저 관리에서 정산을 조회할 매니저를 선택할 수 있어요."
        >
          <button className={styles.linkBtn} onClick={() => navigate('/dashboard/admin/managers')}>
            매니저 목록으로
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <BackBar onBack={() => navigate('/dashboard/admin/managers')} />

      {/* 올해 월별 정산 현황 스트립 */}
      <MonthStrip
        monthItems={monthItems}
        loading={monthlyLoading}
        selectedMonth={selectedMonth}
        expectedTotal={expectedTotal}
        onSelectMonth={setSelectedMonth}
        onSettle={(month, item) =>
          setConfirm({ year: CURRENT_YEAR, month, summary: item })
        }
      />

      {/* 하단 정산 뷰: 선택 월 기반, 달력 접기, 체크박스 선택 */}
      <SettlementView
        key={`${managerId}-${refreshKey}`}
        service={service}
        title={managerName ? `${managerName} 정산` : '매니저 정산'}
        showHelp={false}
        onToggleExclude={handleToggleExclude}
        selectedYear={CURRENT_YEAR}
        selectedMonth={selectedMonth}
        collapsibleCalendar
        selectionEnabled
        onBulkExclude={handleBulkExclude}
      />

      {confirm && (
        <ConfirmModal
          title="월단위 일괄 지급"
          message={`${managerName || '이 매니저'}의 ${confirm.year}년 ${confirm.month}월 미정산 ${confirm.summary?.count || 0}건(${won(confirm.summary?.amount || 0)}원)을 모두 지급 완료 처리할까요? 되돌릴 수 없습니다.`}
          confirmLabel={submitting ? '처리 중…' : '지급 처리'}
          cancelLabel="취소"
          onConfirm={handleSettleMonth}
          onCancel={() => !submitting && setConfirm(null)}
        />
      )}
    </div>
  );
}

/* === 올해 월별 정산 현황 스트립 === */
function MonthStrip({ monthItems, loading, selectedMonth, expectedTotal, onSelectMonth, onSettle }) {
  return (
    <div className={styles.panelWrap}>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.panelHeadTitle}>
            {CURRENT_YEAR}년 올해 월별 정산 현황
          </div>
          <div className={styles.balanceBlock}>
            <span className={styles.balanceLabel}>받을 정산 잔고</span>
            <span className={styles.balanceValue}>
              {won(expectedTotal)}<span className={styles.balanceUnit}>원</span>
            </span>
          </div>
        </div>
        <div className={styles.panelCaption}>매칭 종료월 기준 · 월을 선택하면 하단 내역이 바뀝니다</div>

        {loading ? (
          <div className={styles.panelState}><div className={styles.spinner} /></div>
        ) : (
          <div className={styles.monthChipList}>
            {monthItems.map((it) => {
              const payableCount  = it.count        || 0;
              const settledCount  = it.settledCount  || 0;
              const isSelected    = it.month === selectedMonth;
              const hasUnpaid     = payableCount > 0;
              const hasActivity   = payableCount > 0 || settledCount > 0;

              return (
                <div
                  key={it.month}
                  className={[
                    styles.monthChip,
                    isSelected    ? styles.monthChipSelected  : '',
                    hasUnpaid     ? styles.monthChipUnpaid    : '',
                    !hasActivity  ? styles.monthChipInactive  : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onSelectMonth(it.month)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectMonth(it.month); }}
                  aria-pressed={isSelected}
                  aria-label={`${it.month}월${hasUnpaid ? ` 미지급 ${payableCount}건` : ''}${settledCount > 0 ? ` 지급완료 ${settledCount}건` : ''}`}
                >
                  <span className={styles.monthChipLabel}>{it.month}월</span>

                  {hasUnpaid && (
                    <span className={styles.monthChipUnpaidBadge}>
                      미지급 {payableCount}건
                    </span>
                  )}
                  {settledCount > 0 && (
                    <span className={styles.monthChipDoneBadge}>
                      <Check size={9} /> 완료 {settledCount}건
                    </span>
                  )}

                  {/* 금액 요약 (선택 시만 상세 표시) */}
                  {isSelected && hasActivity && (
                    <div className={styles.monthChipDetail}>
                      {hasUnpaid && (
                        <span className={styles.monthChipDetailUnpaid}>
                          미지급 {won(it.amount)}원
                        </span>
                      )}
                      {settledCount > 0 && (
                        <span className={styles.monthChipDetailDone}>
                          지급완료 {won(it.settledAmount)}원
                        </span>
                      )}
                    </div>
                  )}

                  {/* 이 달 지급 버튼 — 미지급 있을 때 */}
                  {hasUnpaid && (
                    <button
                      className={styles.payBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSettle(it.month, it);
                      }}
                      aria-label={`${it.month}월 일괄 지급`}
                    >
                      이 달 지급
                    </button>
                  )}

                  {/* 완료만 있는 달 */}
                  {!hasUnpaid && settledCount > 0 && (
                    <span className={styles.doneChip}>
                      <Check size={11} /> 완료
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BackBar({ onBack }) {
  return (
    <button className={styles.backBar} onClick={onBack}>
      <ChevronLeft size={18} />
      매니저 목록
    </button>
  );
}
