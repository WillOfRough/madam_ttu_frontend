import { apiFetch } from './config';

export async function login({ email, password }) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function register({ token, email, password, name }) {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    body: { token, email, password, name },
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST',
  });
}

export async function checkSession() {
  return apiFetch('/api/auth/me', {
    method: 'GET',
  });
}
