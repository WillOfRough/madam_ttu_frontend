import { apiFetch } from './config';

export async function login({ email, password }) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedEvent: true,
  });
}

export async function signup({ email, password, name, nickname, phone, verificationId, inviteCode, bankName, bankNumber }) {
  return apiFetch('/api/v1/managers/signup', {
    method: 'POST',
    body: {
      email, password, name, nickname, phone, verificationId,
      ...(inviteCode ? { inviteCode } : {}),
      ...(bankName !== undefined ? { bankName } : {}),
      ...(bankNumber !== undefined ? { bankNumber } : {}),
    },
  });
}

export async function register({ token, email, password, name, nickname, phone, verificationId, bankName, bankNumber }) {
  return apiFetch('/api/v1/managers/register', {
    method: 'POST',
    body: {
      token, email, password, name, nickname, phone, verificationId,
      ...(bankName !== undefined ? { bankName } : {}),
      ...(bankNumber !== undefined ? { bankNumber } : {}),
    },
  });
}

export async function checkSession() {
  return apiFetch('/api/v1/auth/me', {
    method: 'GET',
    skipUnauthorizedEvent: true,
  });
}

export async function logout() {
  return apiFetch('/api/v1/auth/logout', {
    method: 'POST',
  });
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  return apiFetch('/api/v1/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword, confirmPassword },
    // 현재 비밀번호 오류 시 401(1.001)이 오는데, 전역 auth:unauthorized(세션 재검증/로그아웃)
    // 흐름을 건드리면 안 되므로 로컬에서 직접 처리한다.
    skipUnauthorizedEvent: true,
  });
}

// 이메일 OTP 인증(verificationId) 기반 비밀번호 재설정 (공개 API / 세션 불필요).
// 성공 시 비밀번호 변경 + 로그인 실패 잠금 자동 해제. verificationId 는 1회 소모형.
export async function resetPassword({ email, verificationId, newPassword, confirmPassword }) {
  return apiFetch('/api/v1/auth/password-reset', {
    method: 'POST',
    body: { email, verificationId, newPassword, confirmPassword },
    skipUnauthorizedEvent: true,
  });
}
