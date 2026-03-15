import { apiFetch } from './config';

export async function createConnectionInvite({ expiresInHours = 24, label } = {}) {
  return apiFetch('/api/v1/connections/invite', {
    method: 'POST',
    body: { expiresInHours, label },
  });
}

export async function joinConnection(token) {
  return apiFetch('/api/v1/connections/join', {
    method: 'POST',
    body: { token },
  });
}

export async function getConnections() {
  return apiFetch('/api/v1/connections', { method: 'GET' });
}

export async function disconnect(managerId) {
  return apiFetch(`/api/v1/connections/${managerId}`, {
    method: 'DELETE',
  });
}

export async function searchManager(email) {
  return apiFetch(`/api/v1/connections/search?email=${encodeURIComponent(email)}`, {
    method: 'GET',
  });
}

export async function sendRequest({ email, message }) {
  return apiFetch('/api/v1/connections/requests', {
    method: 'POST',
    body: { email, message: message || undefined },
  });
}

export async function getRequests() {
  return apiFetch('/api/v1/connections/requests', { method: 'GET' });
}

export async function acceptRequest(requestId) {
  return apiFetch(`/api/v1/connections/requests/${requestId}/accept`, {
    method: 'POST',
  });
}

export async function rejectRequest(requestId) {
  return apiFetch(`/api/v1/connections/requests/${requestId}/reject`, {
    method: 'POST',
  });
}
