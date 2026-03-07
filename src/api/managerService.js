import { apiFetch } from './config';

export async function getMyInfo(managerId) {
  return apiFetch(`/api/managers/${managerId}`, { method: 'GET' });
}

export async function getDashboardSummary(managerId) {
  return apiFetch(`/api/managers/${managerId}/dashboard`, { method: 'GET' });
}
