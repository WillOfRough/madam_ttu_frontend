import { apiFetch, getApiErrorMessage } from './config';

// admin(운영자) 전용 API. 모두 세션의 매니저 role === 'admin' 일 때만 200,
// 비-admin 은 403 { error: '2.001' }, 미인증은 401 을 반환한다.

// admin API 공통 에러 메시지 매핑.
// 401(미인증)은 apiFetch 가 auth:unauthorized 이벤트로 전역 처리(로그인 이동)하므로 여기서 다루지 않는다.
// 403 { error: '2.001' } 은 message 가 없어 statusText('Forbidden') 가 노출되므로 한글 안내로 치환한다.
export function getAdminErrorMessage(err, fallback = '요청을 처리하지 못했습니다.') {
  if (err?.status === 403 || err?.body?.error === '2.001') {
    return '접근 권한이 없습니다.';
  }
  return getApiErrorMessage(err, fallback);
}

// GET /api/v1/admin/managers — 전체 매니저 목록 (정산 대상 선택용)
// search: 이름·닉네임 부분일치(LIKE) + email·phone 정확일치
export async function listManagers({ status, role, search, page = 0, size = 20 } = {}) {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (role) query.set('role', role);
  if (search) query.set('search', search);
  query.set('page', String(page));
  query.set('size', String(size));
  return apiFetch(`/api/v1/admin/managers?${query.toString()}`, { method: 'GET' });
}

// GET /api/v1/admin/settlements — 특정 매니저 정산 목록(페이징). managerId 필수.
export async function listManagerSettlements({ managerId, status, from, to, page = 0, size = 20 }) {
  const query = new URLSearchParams();
  query.set('managerId', managerId);
  if (status) query.set('status', status);
  if (from) query.set('from', from);
  if (to) query.set('to', to);
  query.set('page', String(page));
  query.set('size', String(size));
  return apiFetch(`/api/v1/admin/settlements?${query.toString()}`, { method: 'GET' });
}

// GET /api/v1/admin/settlements/daily — 특정 매니저 일별 요약. managerId 필수.
export async function getManagerDailySummary({ managerId, from, to }) {
  const query = new URLSearchParams({ managerId, from, to });
  return apiFetch(`/api/v1/admin/settlements/daily?${query.toString()}`, { method: 'GET' });
}

// GET /api/v1/admin/settlements/monthly — 특정 매니저 월별 요약. managerId 필수.
// MonthItem: { month, count, amount, settledCount, settledAmount }
export async function getManagerMonthlySummary({ managerId, year, month } = {}) {
  const query = new URLSearchParams();
  query.set('managerId', managerId);
  if (year != null) query.set('year', String(year));
  if (month != null) query.set('month', String(month));
  return apiFetch(`/api/v1/admin/settlements/monthly?${query.toString()}`, { method: 'GET' });
}

// GET /api/v1/admin/settlements/match/:matchId — 매칭별 정산. managerId 필수.
export async function getManagerMatchSettlements(matchId, { managerId }) {
  const query = new URLSearchParams({ managerId });
  return apiFetch(`/api/v1/admin/settlements/match/${matchId}?${query.toString()}`, { method: 'GET' });
}

// POST /api/v1/admin/settlements/settle-month — 해당 매니저의 그 달 정산 대상
// (ready_to_settle, excluded 제외)을 한 번에 지급 완료. 기준월 = 매칭 종료일(endedAt).
export async function settleMonth({ managerId, year, month, memo }) {
  const query = new URLSearchParams();
  query.set('managerId', managerId);
  query.set('year', String(year));
  query.set('month', String(month));
  if (memo) query.set('memo', memo);
  return apiFetch(`/api/v1/admin/settlements/settle-month?${query.toString()}`, { method: 'POST' });
}

// GET /api/v1/admin/settlements/overview — 전 매니저 월 정산 요약(대시보드).
// 응답: { year, month, expectedTotal, expectedCount, settledTotal, settledCount,
//        potentialTotal, potentialCount }
// expected=정산예정(ready_to_settle), settled=지급완료, potential=만남 전 잠재(입금완료·진행중).
export async function getSettlementOverview({ year, month }) {
  const query = new URLSearchParams();
  query.set('year', String(year));
  query.set('month', String(month));
  return apiFetch(`/api/v1/admin/settlements/overview?${query.toString()}`, { method: 'GET' });
}

// PATCH /api/v1/admin/settlements/:id/exclude — 정산 건 제외/복구 토글.
// excluded=true 면 월일괄 지급에서 빠지고, false 면 다시 포함된다.
// 응답: { success, message, data: SettlementResponse(갱신본) }
export async function toggleSettlementExclude(settlementId, { excluded, reason } = {}) {
  return apiFetch(`/api/v1/admin/settlements/${settlementId}/exclude`, {
    method: 'PATCH',
    body: { excluded, ...(reason ? { reason } : {}) },
  });
}
