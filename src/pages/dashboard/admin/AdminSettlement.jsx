import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Users } from 'lucide-react';
import * as adminService from '../../../api/adminService';
import { toast } from '../../../store/toastStore';
import ConfirmModal from '../../../components/ConfirmModal';
import EmptyState from '../../../components/EmptyState';
import SettlementView from '../SettlementView';
import styles from './AdminSettlement.module.css';

const won = (n) => (n == null ? '0' : Math.abs(n).toLocaleString('ko-KR'));

export default function AdminSettlement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const managerId = searchParams.get('managerId') || '';
  const managerName = searchParams.get('name') || '';

  // 일괄지급 확인 모달 상태 — { year, month, summary } 보관
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // 지급 성공 시 월별 패널 + 하단 SettlementView 를 함께 재조회하기 위한 키
  const [refreshKey, setRefreshKey] = useState(0);

  // SettlementView 의 useEffect 의존성이므로 managerId 기준으로 반드시 메모이즈.
  // (매 렌더 새 객체를 주면 effect 가 무한 재실행됨)
  // getByRoleSummary 는 admin endpoint 에 없으므로 제공하지 않는다 → 역할별 패널 자동 숨김.
  const service = useMemo(() => ({
    getMonthlySummary: ({ year, month } = {}) => adminService.getManagerMonthlySummary({ managerId, year, month }),
    getDailySummary: ({ from, to }) => adminService.getManagerDailySummary({ managerId, from, to }),
    listSettlements: (args) => adminService.listManagerSettlements({ managerId, ...args }),
  }), [managerId]);

  // 정산 건 제외/복구 토글. 병합된 매칭매니저 행은 _ids 가 여러 건이므로 모두 토글.
  // 성공 시 refreshKey 를 올려 월 패널 + 하단 SettlementView 를 함께 재조회한다.
  const handleToggleExclude = async (s) => {
    const ids = (s._ids && s._ids.length) ? s._ids : (s.id ? [s.id] : []);
    if (!ids.length) return false;
    const next = !s.excluded;
    try {
      await Promise.all(ids.map((id) =>
        adminService.toggleSettlementExclude(id, { excluded: next, reason: next ? 'manual_confirm' : undefined }),
      ));
      toast.success(next ? '정산에서 제외했습니다.' : '정산에 다시 포함했습니다.');
      setRefreshKey((k) => k + 1);
      return true;
    } catch (err) {
      toast.error(adminService.getAdminErrorMessage(err, '정산 제외 처리에 실패했습니다.'));
      return false;
    }
  };

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
        // settledCount: 0 → 대상 없음 정상 응답
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
        <EmptyState icon={Users} title="매니저를 선택하세요" hint="매니저 관리에서 정산을 조회할 매니저를 선택할 수 있어요.">
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

      {/* 월별 정산 현황 — amount>0 인 달(과거 포함)마다 일괄 지급 버튼 노출 */}
      <MonthlyPanel
        managerId={managerId}
        refreshKey={refreshKey}
        onSettle={(payload) => setConfirm(payload)}
      />

      {/* 하단: 기존 정산 뷰(Hero·달력·건별 내역) — 정보 조회용. refreshKey 로 재마운트 재조회 */}
      <SettlementView
        key={`${managerId}-${refreshKey}`}
        service={service}
        title={managerName ? `${managerName} 정산` : '매니저 정산'}
        showHelp={false}
        onToggleExclude={handleToggleExclude}
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

/* === 월별 정산 현황 패널 === */
// 종료월(endedAt) 기준 월별 미지급/지급완료를 나란히 보여주고, 미지급(amount>0) 이
// 있는 달마다 [이 달 지급] 버튼을 노출한다. 연도 스텝퍼로 과거 달도 조회·지급 가능.
function MonthlyPanel({ managerId, refreshKey, onSettle }) {
  const nowYear = new Date().getFullYear();
  const [year, setYear] = useState(nowYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    adminService
      .getManagerMonthlySummary({ managerId, year })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => {
        if (!cancelled) setError(adminService.getAdminErrorMessage(err, '월별 정산 현황을 불러오지 못했습니다.'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [managerId, year, refreshKey]);

  const expectedTotal = data?.expectedTotal ?? 0;
  // 활동(미지급 또는 지급완료)이 있는 달만, 최신월 우선
  const rows = useMemo(
    () => (data?.items || [])
      .filter((it) => (it.count || 0) > 0 || (it.settledCount || 0) > 0)
      .sort((a, b) => b.month - a.month),
    [data],
  );

  return (
    <div className={styles.panelWrap}>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <div className={styles.yearStepper}>
            <button className={styles.yearBtn} onClick={() => setYear((y) => y - 1)} aria-label="이전 연도">
              <ChevronLeft size={16} />
            </button>
            <span className={styles.yearLabel}>{year}년</span>
            <button
              className={styles.yearBtn}
              onClick={() => setYear((y) => Math.min(nowYear, y + 1))}
              disabled={year >= nowYear}
              aria-label="다음 연도"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={styles.balanceBlock}>
            <span className={styles.balanceLabel}>받을 정산 잔고</span>
            <span className={styles.balanceValue}>
              {won(expectedTotal)}<span className={styles.balanceUnit}>원</span>
            </span>
          </div>
        </div>
        <div className={styles.panelCaption}>월별 정산 현황 · 매칭 종료월 기준</div>

        {loading ? (
          <div className={styles.panelState}><div className={styles.spinner} /></div>
        ) : error ? (
          <div className={styles.panelState} style={{ color: 'var(--rose-600)' }}>{error}</div>
        ) : rows.length === 0 ? (
          <div className={styles.panelState}>{year}년 정산 내역이 없어요</div>
        ) : (
          <div className={styles.monthList}>
            {rows.map((it) => {
              const payableCount = it.count || 0;
              const settledCount = it.settledCount || 0;
              return (
                <div key={it.month} className={styles.monthRow}>
                  <span className={styles.monthLabel}>{it.month}월</span>
                  <div className={styles.monthMeta}>
                    {payableCount > 0 && (
                      <span className={styles.metaUnpaid}>미지급 {payableCount}건 · {won(it.amount)}원</span>
                    )}
                    {settledCount > 0 && (
                      <span className={styles.metaPaid}>지급완료 {settledCount}건 · {won(it.settledAmount)}원</span>
                    )}
                  </div>
                  {payableCount > 0 ? (
                    <button
                      className={styles.payBtn}
                      onClick={() => onSettle({ year, month: it.month, summary: it })}
                    >
                      이 달 지급
                    </button>
                  ) : settledCount > 0 ? (
                    <span className={styles.doneChip}><Check size={13} /> 완료</span>
                  ) : null}
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
