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

// ── 이메일 OTP (매니저 비밀번호 재설정 흐름 전용 / 공개 API) ──
// 흐름: sendEmailCode → verifyEmailCode(verificationId 발급) → authService.resetPassword

export async function sendEmailCode(email) {
  return apiFetch('/api/v1/verification/email/send', {
    method: 'POST',
    body: { email },
    skipUnauthorizedEvent: true,
  });
}

// 성공 시 공통 envelope 가 아닌 { verificationId } 객체를 그대로 반환한다.
export async function verifyEmailCode(email, code) {
  return apiFetch('/api/v1/verification/email/verify', {
    method: 'POST',
    body: { email, code },
    skipUnauthorizedEvent: true,
  });
}
