import { apiFetch } from './config';

export async function getExportLogs() {
  return apiFetch('/api/v1/export/logs', { method: 'GET' });
}

export async function exportExcel({ password, filter } = {}) {
  return apiFetch('/api/v1/export/excel', {
    method: 'POST',
    body: { password, filter },
  });
}
