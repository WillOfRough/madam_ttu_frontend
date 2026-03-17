import { apiFetch } from './config';

export async function createInvite({ label, expiresInHours } = {}) {
  return apiFetch('/api/v1/invites', {
    method: 'POST',
    body: { label, expiresInHours },
  });
}

export async function getMyInvites({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  return apiFetch(`/api/v1/invites?${params}`, { method: 'GET' });
}

export async function validateToken(token) {
  return apiFetch(`/api/v1/invites/${token}/validate`, { method: 'GET' });
}

export async function revokeInvite(inviteId) {
  return apiFetch(`/api/v1/invites/${inviteId}`, {
    method: 'DELETE',
  });
}

export async function getManagerInvites({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('limit', String(limit));
  return apiFetch(`/api/v1/invites/manager?${params}`, { method: 'GET' });
}

export async function updateInviteLabel(inviteId, label) {
  return apiFetch(`/api/v1/invites/${inviteId}/label`, {
    method: 'PATCH',
    body: { label },
  });
}
