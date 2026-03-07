import { apiFetch } from './config';

export async function createConnectionInvite({ expiresInHours = 24, label } = {}) {
  return apiFetch('/api/connections/invite', {
    method: 'POST',
    body: { expiresInHours, label },
  });
}

export async function joinConnection(token) {
  return apiFetch('/api/connections/join', {
    method: 'POST',
    body: { token },
  });
}

export async function getConnections() {
  return apiFetch('/api/connections', { method: 'GET' });
}

export async function disconnect(managerId) {
  return apiFetch(`/api/connections/${managerId}`, {
    method: 'DELETE',
  });
}
