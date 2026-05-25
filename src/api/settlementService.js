import { apiFetch } from './config';

// GET /api/v1/settlements — 내 정산 내역 페이징
export async function listSettlements({ status, from, to, page = 0, size = 20 } = {}) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  query.set('page', String(page));
  query.set('size', String(size));
  return apiFetch(`/api/v1/settlements?${query.toString()}`, { method: 'GET' });
}

// GET /api/v1/settlements/daily — 일별 요약
export async function getDailySummary({ from, to }) {
  const query = new URLSearchParams({ from, to });
  return apiFetch(`/api/v1/settlements/daily?${query.toString()}`, { method: 'GET' });
}

// GET /api/v1/settlements/monthly — 월별 요약
export async function getMonthlySummary({ year, month } = {}) {
  const query = new URLSearchParams();
  if (year != null) query.set('year', String(year));
  if (month != null) query.set('month', String(month));
  const qs = query.toString();
  return apiFetch(`/api/v1/settlements/monthly${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

// GET /api/v1/settlements/by-role — 역할별(clientOwner/matchmaker) 누적 합계
export async function getByRoleSummary() {
  return apiFetch('/api/v1/settlements/by-role', { method: 'GET' });
}

// GET /api/v1/settlements/match/:matchId — 매칭별 정산
export async function getMatchSettlements(matchId) {
  return apiFetch(`/api/v1/settlements/match/${matchId}`, { method: 'GET' });
}

// POST /api/v1/settlements/:id/settle — 지급 완료 처리 (운영자용)
export async function markSettlementPaid(settlementId, { memo } = {}) {
  const query = new URLSearchParams();
  if (memo) query.set('memo', memo);
  const qs = query.toString();
  return apiFetch(`/api/v1/settlements/${settlementId}/settle${qs ? `?${qs}` : ''}`, {
    method: 'POST',
  });
}
