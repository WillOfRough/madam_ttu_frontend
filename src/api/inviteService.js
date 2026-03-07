import { apiFetch } from './config';

export async function createInvite(managerId, { expiresInHours = 24, label } = {}) {
  return apiFetch('/api/invites', {
    method: 'POST',
    body: { managerId, expiresInHours, label },
  });
}

export async function getMyInvites(managerId) {
  return apiFetch(`/api/invites?managerId=${managerId}`, { method: 'GET' });
}

export async function validateToken(token) {
  return apiFetch(`/api/invites/${token}/validate`, { method: 'GET' });
}

export async function revokeInvite(managerId, inviteId) {
  return apiFetch(`/api/invites/${inviteId}`, {
    method: 'DELETE',
  });
}
