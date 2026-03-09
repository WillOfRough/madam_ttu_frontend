import { apiFetch } from './config';

export async function getMyInfo() {
  return apiFetch('/api/v1/auth/me', { method: 'GET' });
}

export async function getDashboardSummary() {
  return apiFetch('/api/v1/dashboard/summary', { method: 'GET' });
}
