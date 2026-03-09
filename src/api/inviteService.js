import { apiFetch } from './config';

export async function createInvite({ expiresInHours = 24, label } = {}) {
  return apiFetch('/api/v1/invites', {
    method: 'POST',
    body: { expiresInHours, label },
  });
}

export async function getMyInvites() {
  return apiFetch('/api/v1/invites', { method: 'GET' });
}

export async function validateToken(token) {
  return apiFetch(`/api/v1/invites/${token}/validate`, { method: 'GET' });
}

export async function revokeInvite(inviteId) {
  return apiFetch(`/api/v1/invites/${inviteId}`, {
    method: 'DELETE',
  });
}
