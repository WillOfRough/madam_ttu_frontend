import { useEffect, useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import * as settlementService from '../../api/settlementService';
import styles from './Settlement.module.css';

const STATUS_LABELS = {
  pending: '입금대기',
  confirmed: '입금완료',
  ready_to_settle: '정산대상',
  settled: '정산완료',
  paid: '정산완료',
  cancelled: '취소',
  refunded: '환불',
};

const FILTER_OPTIONS = ['', 'ready_to_settle', 'settled', 'confirmed', 'pending', 'cancelled'];
const ROLE_LABELS = { client_owner: '매물', matchmaker: '매칭', both: '매물+매칭' };

function formatCurrency(amount) {
  return (amount ?? 0).toLocaleString('ko-KR');
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toYmd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 월 전체 기간에 0으로 채운 일별 배열 생성
function fillDailyRange(rawDaily, fromDate, toDate) {
  const byDate = Object.fromEntries((rawDaily || []).map((d) => [d.date, d]));
  const out = [];
  const cursor = new Date(fromDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = toYmd(cursor);
    out.push(byDate[key] || { date: key, count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export default function Settlement() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 최근 30일 범위
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - 29);

  const [monthly, setMonthly] = useState(null);
  const [daily, setDaily] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalElements: 0 });
  const [statusFilter, setStatusFilter] = useState('ready_to_settle');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      settlementService.getMonthlySummary({ year }),
      settlementService.getDailySummary({ from: toYmd(from), to: toYmd(to) }),
      settlementService.listSettlements({
        status: statusFilter || undefined,
        page,
        size: 20,
      }),
    ])
      .then(([monthlyRes, dailyRes, listRes]) => {
        if (cancelled) return;
        setMonthly(monthlyRes);
        setDaily(fillDailyRange(dailyRes, from, to));
        setSettlements(listRes?.data || []);
        setPagination(listRes?.pagination || { page: 0, totalPages: 1, totalElements: 0 });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || '정산 정보를 불러오지 못했습니다.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, statusFilter, page]);

  const thisMonth = useMemo(() => {
    const item = (monthly?.items || []).find((i) => i.month === month);
    return item || { month, count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
  }, [monthly, month]);

  const maxDaily = useMemo(
    () => Math.max(1, ...daily.map((d) => d.totalAmount)),
    [daily],
  );

  return (
    <div className={styles.page}>
      <h2 className={styles.title}><DollarSign size={18} /> 정산 대시보드</h2>

      {/* 이번달 요약 카드 */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}><TrendingUp size={14} /> 이번 달 총 정산</div>
          <div className={styles.summaryValue}>{formatCurrency(thisMonth.totalAmount)}<span className={styles.unit}>원</span></div>
          <div className={styles.summarySub}>{year}.{String(month).padStart(2, '0')} · {thisMonth.count}건</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPaid}`}>
          <div className={styles.summaryLabel}><CheckCircle2 size={14} /> 지급 완료</div>
          <div className={styles.summaryValue}>{formatCurrency(thisMonth.paidAmount)}<span className={styles.unit}>원</span></div>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardPending}`}>
          <div className={styles.summaryLabel}><Clock size={14} /> 지급 대기</div>
          <div className={styles.summaryValue}>{formatCurrency(thisMonth.pendingAmount)}<span className={styles.unit}>원</span></div>
        </div>
      </div>

      {/* 최근 30일 일별 추이 차트 */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>최근 30일 일별 정산 추이</span>
          <span className={styles.chartLegend}>
            <span className={styles.legendPaid} /> 지급 완료
            <span className={styles.legendPending} /> 대기
          </span>
        </div>
        <div className={styles.chart}>
          {daily.length === 0 ? (
            <div className={styles.chartEmpty}>기간 내 정산 내역이 없습니다.</div>
          ) : (
            daily.map((d) => {
              const paidPct = Math.round((d.paidAmount / maxDaily) * 100);
              const pendingPct = Math.round((d.pendingAmount / maxDaily) * 100);
              const day = Number(d.date.slice(-2));
              return (
                <div key={d.date} className={styles.chartCol} title={`${d.date}\n총 ${formatCurrency(d.totalAmount)}원\n지급 ${formatCurrency(d.paidAmount)}원\n대기 ${formatCurrency(d.pendingAmount)}원`}>
                  <div className={styles.chartBarStack}>
                    <div className={styles.chartBarPaid} style={{ height: `${paidPct}%` }} />
                    <div className={styles.chartBarPending} style={{ height: `${pendingPct}%` }} />
                  </div>
                  <div className={styles.chartXLabel}>{day}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 정산 목록 */}
      <div className={styles.listCard}>
        <div className={styles.listHeader}>
          <span className={styles.listTitle}>정산 내역 {pagination.totalElements > 0 && `(${pagination.totalElements}건)`}</span>
          <div className={styles.filterBar}>
            {FILTER_OPTIONS.map((s) => (
              <button
                key={s || 'all'}
                className={`${styles.filterChip} ${statusFilter === s ? styles.filterChipActive : ''}`}
                onClick={() => { setStatusFilter(s); setPage(0); }}
              >
                {s === '' ? '전체' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingRow}>불러오는 중...</div>
        ) : error ? (
          <div className={styles.errorRow}>{error}</div>
        ) : settlements.length === 0 ? (
          <div className={styles.emptyRow}>정산 내역이 없습니다.</div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>생성일</th>
                  <th>매칭 종료일</th>
                  <th>역할</th>
                  <th className={styles.shareCol}>비율</th>
                  <th className={styles.amountCol}>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td>{formatDate(s.createdAt)}</td>
                    <td className={styles.endedAtCol}>{formatDate(s.matchEndedAt)}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[`role_${s.role}`] || ''}`}>
                        {ROLE_LABELS[s.role] || s.role}
                      </span>
                    </td>
                    <td className={styles.shareCol}>{s.share}/10</td>
                    <td className={styles.amountCol}>{formatCurrency(s.amount)}원</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${s.status}`] || ''}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div className={styles.pager}>
                <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>이전</button>
                <span>{page + 1} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages - 1} onClick={() => setPage((p) => p + 1)}>다음</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
