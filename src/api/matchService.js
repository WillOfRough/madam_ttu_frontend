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
