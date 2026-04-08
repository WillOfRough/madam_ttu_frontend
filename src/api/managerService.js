import { apiFetch } from './config';

export async function getMyInfo() {
  return apiFetch('/api/v1/auth/me', { method: 'GET' });
}

export async function updateMyInfo({ name, nickname, phone, bankName, bankNumber }) {
  return apiFetch('/api/v1/managers/me', {
    method: 'PATCH',
    body: {
      name, nickname, phone,
      ...(bankName !== undefined ? { bankName } : {}),
      ...(bankNumber !== undefined ? { bankNumber } : {}),
    },
  });
}

export async function getDashboardSummary() {
  return apiFetch('/api/v1/dashboard/summary', { method: 'GET' });
}
