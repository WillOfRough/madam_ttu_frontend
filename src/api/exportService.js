import { apiFetch } from './config';

export async function getExportLogs(managerId) {
  return apiFetch(`/api/exports?managerId=${managerId}`, { method: 'GET' });
}
