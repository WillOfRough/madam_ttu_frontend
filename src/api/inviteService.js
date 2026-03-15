import { apiFetch } from './config';

export async function createInvite({ label } = {}) {
  return apiFetch('/api/v1/invites', {
    method: 'POST',
    body: { label },
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
