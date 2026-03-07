import { apiFetch } from './config';

export async function getMyInfo() {
  return apiFetch('/api/auth/me', { method: 'GET' });
}

export async function getDashboardSummary() {
  return apiFetch('/api/dashboard/summary', { method: 'GET' });
}
