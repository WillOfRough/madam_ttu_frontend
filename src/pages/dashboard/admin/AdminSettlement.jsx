import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Users } from 'lucide-react';
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

const isFutureYM = (y, m) => y > CURRENT_YEAR || (y === CURRENT_YEAR && m > CURRENT_MONTH);

export default function AdminSettlement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const managerId   = searchParams.get('managerId') || '';
  const managerName = searchParams.get('name') || '';

  // 선택된 연·월 (기본 = 이번 달)
  const [selectedYear, setSelectedYear]   = useState(CURRENT_YEAR);
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

  // ── 월별 요약 (선택 연도 전체) ───────────────────────────────────
  const [monthlyData, setMonthlyData] = useState(null);
  const [monthlyLoading, setMonthlyLoading] = useState(true);

  useEffect(() => {
    if (!managerId) return;
    let cancelled = false;
    setMonthlyLoading(true);
    adminService
      .getManagerMonthlySummary({ managerId, year: selectedYear })
      .then((res) => { if (!cancelled) setMonthlyData(res); })
      .catch(() => { /* 조용히 실패 */ })
      .finally(() => { if (!cancelled) setMonthlyLoading(false); });
    return () => { cancelled = true; };
  }, [managerId, selectedYear, refreshKey]);

  // 1~12월 데이터 (없는 달은 0으로 채움)
  const monthItems = useMemo(() => {
    const items = monthlyData?.items || [];
    const map = {};
    items.forEach((it) => { map[it.month] = it; });
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { month: m, ...(map[m] || { count: 0, amount: 0, settledCount: 0, settledAmount: 0 }) };
    });
  }, [monthlyData]);

  const expectedTotal = monthlyData?.expectedTotal ?? 0;

  // ── 월/연도 이동 핸들러 (미래월 차단) ────────────────────────────
  const stepMonth = useCallback((delta) => {
    let y = selectedYear, m = selectedMonth + delta;
    if (m < 1) { y -= 1; m = 12; } else if (m > 12) { y += 1; m = 1; }
    if (isFutureYM(y, m)) return;
    setSelectedYear(y);
    setSelectedMonth(m);
  }, [selectedYear, selectedMonth]);

  const stepYear = useCallback((delta) => {
    const y = selectedYear + delta;
    if (y > CURRENT_YEAR) return;
    setSelectedYear(y);
    // 올해로 돌아오며 선택 월이 미래가 되면 이번 달로 당김
    if (y === CURRENT_YEAR && selectedMonth > CURRENT_MONTH) setSelectedMonth(CURRENT_MONTH);
  }, [selectedYear, selectedMonth]);

  const pickMonth = useCallback((m) => {
    if (isFutureYM(selectedYear, m)) return;
    setSelectedMonth(m);
  }, [selectedYear]);

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
        <BackBar onBack={() => navigate('/dashboard/admin?tab=managers')} label="매니저 목록" />
        <EmptyState
          icon={Users}
          title="매니저를 선택하세요"
          hint="매니저 정보 탭에서 정산을 조회할 매니저를 선택할 수 있어요."
        >
          <button className={styles.linkBtn} onClick={() => navigate('/dashboard/admin?tab=managers')}>
            매니저 목록으로
          </button>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <BackBar onBack={() => navigate(-1)} label="뒤로" />

      {/* 월 선택 + 선택 월 정산 현황 */}
      <MonthStrip
        year={selectedYear}
        month={selectedMonth}
        monthItems={monthItems}
        loading={monthlyLoading}
        expectedTotal={expectedTotal}
        onStepMonth={stepMonth}
        onStepYear={stepYear}
        onPickMonth={pickMonth}
        onSettle={(month, item) =>
          setConfirm({ year: selectedYear, month, summary: item })
        }
      />

      {/* 하단 정산 뷰: 선택 월 기반, 달력 접기, 체크박스 선택 */}
      <div className={styles.detailWrap}>
        <SettlementView
          key={`${managerId}-${refreshKey}`}
          service={service}
          title={managerName ? `${managerName} 정산` : '매니저 정산'}
          showHelp={false}
          onToggleExclude={handleToggleExclude}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          collapsibleCalendar
          selectionEnabled
          onBulkExclude={handleBulkExclude}
        />
      </div>

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

/* === 월 선택 스트립 (스텝퍼 + 달력 팝오버) === */
function MonthStrip({ year, month, monthItems, loading, expectedTotal, onStepMonth, onStepYear, onPickMonth, onSettle }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const sel = monthItems.find((m) => m.month === month) || null;
  const selUnpaid = (sel?.count || 0) > 0;
  const selSettled = (sel?.settledCount || 0) > 0;

  const atCurrent = year === CURRENT_YEAR && month === CURRENT_MONTH;
  const nextYearDisabled = year >= CURRENT_YEAR;

  const handlePick = (m) => { onPickMonth(m); setPickerOpen(false); };

  return (
    <div className={styles.panelWrap}>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          {/* 월 스텝퍼 */}
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={() => onStepMonth(-1)} aria-label="이전 달">
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.navLabelBtn}
              onClick={() => setPickerOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
            >
              {year}년 {month}월
            </button>
            <button
              className={styles.navBtn}
              onClick={() => onStepMonth(1)}
              disabled={atCurrent}
              aria-label="다음 달"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className={styles.balanceBlock}>
            <span className={styles.balanceLabel}>받을 정산 잔고</span>
            <span className={styles.balanceValue}>
              {won(expectedTotal)}<span className={styles.balanceUnit}>원</span>
            </span>
          </div>

          {/* 달력(월 그리드) 팝오버 */}
          {pickerOpen && (
            <>
              <div className={styles.pickerOverlay} onClick={() => setPickerOpen(false)} />
              <div className={styles.pickerPop} role="dialog" aria-label="월 선택">
                <div className={styles.pickerYearRow}>
                  <button className={styles.pickerYearBtn} onClick={() => onStepYear(-1)} aria-label="이전 연도">
                    <ChevronLeft size={16} />
                  </button>
                  <span className={styles.pickerYearLabel}>{year}년</span>
                  <button
                    className={styles.pickerYearBtn}
                    onClick={() => onStepYear(1)}
                    disabled={nextYearDisabled}
                    aria-label="다음 연도"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className={styles.pickerGrid}>
                  {monthItems.map((it) => {
                    const future = isFutureYM(year, it.month);
                    const hasUnpaid = (it.count || 0) > 0;
                    const hasSettled = (it.settledCount || 0) > 0;
                    const isSel = it.month === month;
                    return (
                      <button
                        key={it.month}
                        type="button"
                        className={[
                          styles.pickerCell,
                          isSel ? styles.pickerCellSelected : '',
                          future ? styles.pickerCellFuture : '',
                        ].filter(Boolean).join(' ')}
                        disabled={future}
                        onClick={() => handlePick(it.month)}
                        aria-label={`${it.month}월${hasUnpaid ? ` 미지급 ${it.count}건` : hasSettled ? ' 지급완료' : ''}`}
                      >
                        <span className={styles.pickerCellMonth}>{it.month}월</span>
                        {hasUnpaid ? (
                          <span className={styles.pickerCellDot} aria-hidden="true" />
                        ) : hasSettled ? (
                          <Check size={11} className={styles.pickerCellCheck} aria-hidden="true" />
                        ) : (
                          <span className={styles.pickerCellDotEmpty} aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {loading ? (
          <div className={styles.panelState}><div className={styles.spinner} /></div>
        ) : (
          /* 선택 월 요약 라인 */
          <div className={styles.monthSummaryLine}>
            <div className={styles.monthSummaryMeta}>
              {selUnpaid && (
                <span className={styles.metaUnpaid}>미지급 {sel.count}건 · {won(sel.amount)}원</span>
              )}
              {selSettled && (
                <span className={styles.metaPaid}>지급완료 {sel.settledCount}건 · {won(sel.settledAmount)}원</span>
              )}
              {!selUnpaid && !selSettled && (
                <span className={styles.monthSummaryEmpty}>이 달은 정산 내역이 없어요</span>
              )}
            </div>
            {selUnpaid && (
              <button className={styles.payBtn} onClick={() => onSettle(month, sel)}>
                이 달 지급
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BackBar({ onBack, label = '뒤로' }) {
  return (
    <button className={styles.backBar} onClick={onBack}>
      <ChevronLeft size={18} />
      {label}
    </button>
  );
}
