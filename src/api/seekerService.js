import { apiFetch } from './config';

export async function createSeeker(data) {
  return apiFetch('/api/v1/seekers', {
    method: 'POST',
    body: data,
  });
}

export async function listSeekers(params = {}) {
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

export async function getSeekerDetail(seekerId) {
  return apiFetch(`/api/v1/seekers/${seekerId}`, { method: 'GET' });
}

export async function updateApproval(seekerId, status) {
  return apiFetch(`/api/v1/seekers/${seekerId}/approval`, {
    method: 'PATCH',
    body: { status },
  });
}

export async function updateNote(seekerId, note) {
  return apiFetch(`/api/v1/seekers/${seekerId}/note`, {
    method: 'PATCH',
    body: { note },
  });
}
