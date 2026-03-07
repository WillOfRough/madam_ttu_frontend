import { apiFetch } from './config';

export async function login({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function signup({ email, password, name }) {
  return apiFetch('/api/managers/signup', {
    method: 'POST',
    body: { email, password, name },
  });
}

export async function register({ token, email, password, name }) {
  return apiFetch('/api/managers/register', {
    method: 'POST',
    body: { token, email, password, name },
  });
}

export async function checkSession() {
  return apiFetch('/api/auth/me', {
    method: 'GET',
  });
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  return apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword, confirmPassword },
  });
}
