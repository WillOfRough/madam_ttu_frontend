import { apiFetch } from './config';

export async function getExportLogs() {
  return apiFetch('/api/export/logs', { method: 'GET' });
}

export async function exportExcel({ password, filter } = {}) {
  return apiFetch('/api/export/excel', {
    method: 'POST',
    body: { password, filter },
  });
}
