import { mockFetch } from './mockData';

const DEV = import.meta.env.DEV;
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
// DEV: vite proxy(/api)가 dev 백엔드로 포워딩 + 쿠키 도메인 localhost 리라이트.
// 절대주소로 직접 fetch 하면 CORS/쿠키 문제로 세션이 안 잡히므로 상대경로 사용.
const API_BASE = DEV ? '' : RAW_API_BASE;
const USE_MOCK = DEV && !RAW_API_BASE && !import.meta.env.VITE_NO_MOCK;

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

/**
 * ApiError에서 사용자에게 보여줄 메시지를 추출한다.
 * 백엔드 VALIDATION_ERROR는 details에 필드별 구체 메시지(예: { location: "장소는 필수입니다." })를
 * 담아주는데, 상위 message는 "입력값을 확인해주세요." 처럼 일반적이라 details를 우선 사용한다.
 */
export function getApiErrorMessage(err, fallback = '요청을 처리하지 못했습니다.') {
  const details = err?.body?.details;
  if (details && typeof details === 'object') {
    const msgs = Object.values(details).filter((v) => typeof v === 'string' && v.trim());
    if (msgs.length) return msgs.join('\n');
  }
  return err?.message || fallback;
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
