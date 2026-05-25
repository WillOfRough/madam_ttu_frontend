import { mockFetch } from './mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const DEV = import.meta.env.DEV;
const USE_MOCK = DEV && !API_BASE && !import.meta.env.VITE_NO_MOCK;

export function getPhotoUrl(photoId) {
  if (USE_MOCK) {
    return `https://picsum.photos/seed/${photoId}/400/400`;
  }
  return `${API_BASE}/api/v1/clients/photos/${photoId}`;
}

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch(path, options = {}) {
  const { body, headers, skipUnauthorizedEvent, ...rest } = options;

  // DEV 모드: 백엔드 없이 목 데이터 사용
  if (USE_MOCK) {
    return mockFetch(path, { ...rest, body });
  }

  const fetchOptions = {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined && !(body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...headers,
    },
  };

  if (body !== undefined) {
    fetchOptions.body =
      body instanceof FormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (res.status === 401) {
    if (!skipUnauthorizedEvent) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new ApiError(errBody.message || res.statusText, res.status, errBody);
  }

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}
