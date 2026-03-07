import { apiFetch } from './config';

export async function createSeeker(data) {
  return apiFetch('/api/seekers', {
    method: 'POST',
    body: data,
  });
}

export async function listSeekers(managerId, params = {}) {
  const query = new URLSearchParams();
  query.set('managerId', managerId);
  if (params.owner) query.set('owner', params.owner);
  if (params.gender) query.set('gender', params.gender);
  if (params.approval) query.set('approval', params.approval);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  return apiFetch(`/api/seekers?${query.toString()}`, { method: 'GET' });
}

export async function getSeekerDetail(managerId, seekerId) {
  return apiFetch(`/api/seekers/${seekerId}?managerId=${managerId}`, { method: 'GET' });
}

export async function updateApproval(managerId, seekerId, status) {
  return apiFetch(`/api/seekers/${seekerId}/approval`, {
    method: 'PATCH',
    body: { managerId, status },
  });
}

export async function updateNote(managerId, seekerId, note) {
  return apiFetch(`/api/seekers/${seekerId}/note`, {
    method: 'PATCH',
    body: { managerId, note },
  });
}
