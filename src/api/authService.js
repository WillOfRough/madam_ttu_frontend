import { apiFetch } from './config';

export async function login({ email, password }) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedEvent: true,
  });
}

export async function signup({ email, password, name }) {
  return apiFetch('/api/v1/managers/signup', {
    method: 'POST',
    body: { email, password, name },
  });
}

export async function register({ token, email, password, name }) {
  return apiFetch('/api/v1/managers/register', {
    method: 'POST',
    body: { token, email, password, name },
  });
}

export async function checkSession() {
  return apiFetch('/api/v1/auth/me', {
    method: 'GET',
    skipUnauthorizedEvent: true,
  });
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  return apiFetch('/api/v1/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword, confirmPassword },
  });
}
