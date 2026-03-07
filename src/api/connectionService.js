import { apiFetch } from './config';

export async function createConnectionInvite(managerId, { expiresInHours = 24, label } = {}) {
  return apiFetch('/api/connections/invite', {
    method: 'POST',
    body: { managerId, expiresInHours, label },
  });
}

export async function joinConnection(managerId, token) {
  return apiFetch('/api/connections/join', {
    method: 'POST',
    body: { managerId, token },
  });
}

export async function getConnections(managerId) {
  return apiFetch(`/api/connections?managerId=${managerId}`, { method: 'GET' });
}

export async function disconnect(managerId, targetManagerId) {
  return apiFetch('/api/connections/disconnect', {
    method: 'POST',
    body: { managerId, targetManagerId },
  });
}
