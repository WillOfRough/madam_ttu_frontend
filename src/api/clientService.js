import { apiFetch } from './config';

export async function createClient(data, photos = []) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value != null && value !== '') {
      formData.append(key, String(value));
    }
  }
  photos.forEach((file) => formData.append('photos', file));
  return apiFetch('/api/v1/seekers', {
    method: 'POST',
    body: formData,
  });
}

export async function listClients(params = {}) {
  const query = new URLSearchParams();
  if (params.name) query.set('name', params.name);
  if (params.phone) query.set('phone', params.phone);
  if (params.gender) query.set('gender', params.gender);
  if (params.approval) query.set('approval', params.approval);
  if (params.owner) query.set('owner', params.owner);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiFetch(`/api/v1/seekers${qs ? `?${qs}` : ''}`, { method: 'GET' });
}

export async function getClientDetail(clientId) {
  return apiFetch(`/api/v1/seekers/${clientId}`, { method: 'GET' });
}

export async function updateApproval(clientId, status) {
  return apiFetch(`/api/v1/seekers/${clientId}/approval`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function updateNote(clientId, note) {
  return apiFetch(`/api/v1/seekers/${clientId}/note`, {
    method: 'PATCH',
    body: { note },
  });
}
