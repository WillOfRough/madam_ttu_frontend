import { apiFetch } from './config';

export async function createMatch({ clientAId, clientBId, type, note, paymentAmountA, paymentAmountB }) {
  const body = { clientAId, clientBId, type, note };
  if (paymentAmountA !== undefined && paymentAmountA !== null) body.paymentAmountA = paymentAmountA;
  if (paymentAmountB !== undefined && paymentAmountB !== null) body.paymentAmountB = paymentAmountB;
  return apiFetch('/api/v1/matches', {
    method: 'POST',
    body,
  });
}

export async function listMatches(params = {}) {
  const query = new URLSearchParams();
  if (params.page != null) query.set('page', String(params.page));
  if (params.size != null) query.set('size', String(params.size));
  if (params.clientId) query.set('clientId', params.clientId);
  if (params.clientName) query.set('clientName', params.clientName);
  if (params.managerId) query.set('managerId', params.managerId);
  if (params.status) query.set('status', params.status);
  if (params.afterStatus) query.set('afterStatus', params.afterStatus);
  if (params.note) query.set('note', params.note);

  const qs = query.toString();
  return apiFetch(`/api/v1/matches${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export async function getMatchDetail(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}`, { method: 'GET' });
}

// ── Proposal APIs (공개) ──

export async function getProposal(token) {
  return apiFetch(`/api/v1/proposals/${token}`, { method: 'GET' });
}

export async function respondProposal(token, response) {
  return apiFetch(`/api/v1/proposals/${token}/respond`, {
    method: 'POST',
    body: { response },
  });
}

export async function getAvailableTimes(token) {
  return apiFetch(`/api/v1/proposals/${token}/available-times`, { method: 'GET' });
}

export async function registerAvailableTimes(token, { times }) {
  return apiFetch(`/api/v1/proposals/${token}/available-times`, {
    method: 'POST',
    body: { times },
  });
}

// ── Manager APIs (인증 필요) ──

export async function confirmMatch(matchId, { timeId, location, locationLink, endTime }) {
  return apiFetch(`/api/v1/matches/${matchId}/confirm`, {
    method: 'POST',
    body: { timeId, location, locationLink, endTime },
  });
}

export async function cancelMatch(matchId, { reason }) {
  return apiFetch(`/api/v1/matches/${matchId}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}

export async function completeMatch(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/complete`, {
    method: 'POST',
  });
}

export async function confirmPayment(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/confirm-payment`, {
    method: 'POST',
  });
}

export async function getMatchPayments(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/payments`, { method: 'GET' });
}

export async function confirmParticipantPayment(matchId, participantId) {
  return apiFetch(`/api/v1/matches/${matchId}/payments/${participantId}/confirm`, {
    method: 'POST',
  });
}

export async function rescheduleMatch(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/reschedule`, {
    method: 'POST',
  });
}

export async function updateMatchSchedule(matchId, { date, startTime, endTime, location, locationLink }) {
  return apiFetch(`/api/v1/matches/${matchId}/schedule`, {
    method: 'PATCH',
    body: { date, startTime, endTime, location, locationLink },
  });
}

export async function getMatchAvailableTimes(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/available-times`, { method: 'GET' });
}

export async function remindMatch(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/remind`, { method: 'POST' });
}

export async function deleteMatch(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}`, {
    method: 'DELETE',
  });
}

export async function startMatch(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/start`, {
    method: 'POST',
  });
}

// ── After APIs ──

export async function getAfterStatus(token) {
  return apiFetch(`/api/v1/proposals/${token}/after`, { method: 'GET' });
}

export async function respondAfter(token, response) {
  return apiFetch(`/api/v1/proposals/${token}/after`, {
    method: 'POST',
    body: { response },
  });
}

export async function getAfterProfile(token) {
  return apiFetch(`/api/v1/proposals/${token}/after/profile`, { method: 'GET' });
}

export async function getAfterResult(token) {
  return apiFetch(`/api/v1/proposals/${token}/after/result`, { method: 'GET' });
}

// ── Feedback APIs (공개) ──

export async function getFeedback(token) {
  return apiFetch(`/api/v1/proposals/${token}/feedback`, { method: 'GET' });
}

export async function submitFeedback(token, { rating, comment }) {
  return apiFetch(`/api/v1/proposals/${token}/feedback`, {
    method: 'POST',
    body: { rating, comment },
  });
}

export async function overrideAfter(matchId, participants) {
  return apiFetch(`/api/v1/matches/${matchId}/after`, {
    method: 'POST',
    body: { participants },
  });
}
