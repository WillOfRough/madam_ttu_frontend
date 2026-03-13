import { apiFetch } from './config';

export async function createMatch({ seekerAId, seekerBId, note }) {
  return apiFetch('/api/v1/matches', {
    method: 'POST',
    body: { seekerAId, seekerBId, note },
  });
}

export async function listMatches(params = {}) {
  const query = new URLSearchParams();
  if (params.page != null) query.set('page', String(params.page));
  if (params.size != null) query.set('size', String(params.size));

  const qs = query.toString();
  return apiFetch(`/api/v1/matches${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export async function getMatchDetail(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}`, { method: 'GET' });
}

export async function getProposal(token) {
  return apiFetch(`/api/v1/proposals/${token}`, { method: 'GET' });
}

export async function respondProposal(token, response) {
  return apiFetch(`/api/v1/proposals/${token}/respond`, {
    method: 'POST',
    body: { response },
  });
}

// ── New: sequential matching + scheduling APIs ──

export async function updateMatchStatus(matchId, status) {
  return apiFetch(`/api/v1/matches/${matchId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function getSchedule(matchId) {
  return apiFetch(`/api/v1/matches/${matchId}/schedule`, { method: 'GET' });
}

export async function proposeSchedule(matchId, { timeSlots }) {
  return apiFetch(`/api/v1/matches/${matchId}/schedule/propose`, {
    method: 'POST',
    body: { timeSlots },
  });
}

export async function pickSchedule(matchId, { slotId }) {
  return apiFetch(`/api/v1/matches/${matchId}/schedule/pick`, {
    method: 'POST',
    body: { slotId },
  });
}

export async function confirmSchedule(matchId, { venue, note }) {
  return apiFetch(`/api/v1/matches/${matchId}/schedule/confirm`, {
    method: 'POST',
    body: { venue, note },
  });
}

export async function cancelMatch(matchId, { reason }) {
  return apiFetch(`/api/v1/matches/${matchId}/cancel`, {
    method: 'POST',
    body: { reason },
  });
}
