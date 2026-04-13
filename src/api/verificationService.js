import { apiFetch } from './config';

export async function sendCode(phone) {
  return apiFetch('/api/v1/verification/send', {
    method: 'POST',
    body: { phone },
  });
}

export async function verifyCode(phone, code) {
  return apiFetch('/api/v1/verification/verify', {
    method: 'POST',
    body: { phone, code },
  });
}
