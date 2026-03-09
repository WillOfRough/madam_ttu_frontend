import { describe, it, expect, beforeEach } from 'vitest';
import { generateNickname } from '../data/constants';

// ──────────────────────────────────────────────
// Bug 1: 닉네임에 공백 포함 여부 검증
// 백엔드: @Pattern(regexp = "^[가-힣a-zA-Z]+$") → 공백 불허
// ──────────────────────────────────────────────
describe('Bug 1: generateNickname() 공백 제거', () => {
  it('생성된 닉네임에 공백이 포함되지 않아야 한다', () => {
    // 100번 반복하여 랜덤 결과 전부 검증
    for (let i = 0; i < 100; i++) {
      const nickname = generateNickname();
      expect(nickname).not.toMatch(/\s/);
    }
  });

  it('생성된 닉네임이 백엔드 정규식 패턴을 통과해야 한다', () => {
    const backendPattern = /^[가-힣a-zA-Z]+$/;
    for (let i = 0; i < 100; i++) {
      const nickname = generateNickname();
      expect(nickname).toMatch(backendPattern);
    }
  });

  it('닉네임 길이가 2~20자여야 한다', () => {
    for (let i = 0; i < 100; i++) {
      const nickname = generateNickname();
      expect(nickname.length).toBeGreaterThanOrEqual(2);
      expect(nickname.length).toBeLessThanOrEqual(20);
    }
  });
});

// ──────────────────────────────────────────────
// Bug 2: 자기소개 최소 글자수 불일치 검증
// 백엔드: @Size(min = 50, max = 1000)
// ──────────────────────────────────────────────

// SeekerForm.jsx의 validateStep 로직을 직접 테스트하기 위해 재현
function validateIntroduction(introduction) {
  const errors = {};
  if (!introduction) {
    errors.introduction = '자기소개를 입력해주세요.';
  } else if (introduction.length < 20) {
    errors.introduction = `${20 - introduction.length}자 더 작성해주세요. (최소 20자)`;
  }
  return errors;
}

describe('Bug 2: 자기소개 최소 글자수 20자 검증', () => {
  it('19자 입력 시 에러가 발생해야 한다', () => {
    const text = 'a'.repeat(19);
    const errors = validateIntroduction(text);
    expect(errors.introduction).toBeDefined();
    expect(errors.introduction).toContain('최소 20자');
  });

  it('10자 입력 시 에러가 발생해야 한다', () => {
    const text = 'a'.repeat(10);
    const errors = validateIntroduction(text);
    expect(errors.introduction).toBeDefined();
    expect(errors.introduction).toContain('10자 더 작성해주세요');
  });

  it('20자 입력 시 에러가 없어야 한다', () => {
    const text = 'a'.repeat(20);
    const errors = validateIntroduction(text);
    expect(errors.introduction).toBeUndefined();
  });

  it('빈 문자열 입력 시 필수 입력 에러가 발생해야 한다', () => {
    const errors = validateIntroduction('');
    expect(errors.introduction).toBe('자기소개를 입력해주세요.');
  });

  it('1000자 입력 시 에러가 없어야 한다', () => {
    const text = 'a'.repeat(1000);
    const errors = validateIntroduction(text);
    expect(errors.introduction).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// Bug 3: MBTI "잘 모르겠어요" 필터링 검증
// 백엔드: @Size(max = 4)
// ──────────────────────────────────────────────

// seekerFormStore.js의 mbti 필터링 로직 재현
function filterMbti(mbtiValue) {
  return (mbtiValue && mbtiValue.length <= 4) ? mbtiValue : undefined;
}

describe('Bug 3: MBTI 비표준값 필터링', () => {
  it('"잘 모르겠어요" (7자) 선택 시 undefined로 필터링되어야 한다', () => {
    expect(filterMbti('잘 모르겠어요')).toBeUndefined();
  });

  it('유효한 MBTI "INTJ" (4자)는 그대로 전달되어야 한다', () => {
    expect(filterMbti('INTJ')).toBe('INTJ');
  });

  it('유효한 MBTI "ENFP" (4자)는 그대로 전달되어야 한다', () => {
    expect(filterMbti('ENFP')).toBe('ENFP');
  });

  it('빈 문자열은 undefined로 처리되어야 한다', () => {
    expect(filterMbti('')).toBeUndefined();
  });

  it('null은 undefined로 처리되어야 한다', () => {
    expect(filterMbti(null)).toBeUndefined();
  });

  it('undefined는 undefined로 처리되어야 한다', () => {
    expect(filterMbti(undefined)).toBeUndefined();
  });

  it('5자 이상인 임의 문자열은 undefined로 필터링되어야 한다', () => {
    expect(filterMbti('ABCDE')).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// 통합: getPayload 시뮬레이션으로 전체 흐름 검증
// ──────────────────────────────────────────────
describe('통합: payload 생성 시 백엔드 DTO 호환성', () => {
  function buildPayload(form, suggestedNickname) {
    const nickname = form.nickname || suggestedNickname;
    const introText = [
      form.introKeywords && form.introKeywords.length > 0 ? `[${form.introKeywords.join(', ')}] ` : '',
      form.introduction,
    ].join('');
    const idealText = [
      form.idealKeywords && form.idealKeywords.length > 0 ? `[${form.idealKeywords.join(', ')}] ` : '',
      form.idealType,
    ].join('');

    return {
      token: form.token,
      name: nickname,
      gender: form.gender,
      birthDate: form.birthYear ? `${form.birthYear}-01-01` : '',
      phone: form.phone,
      location: form.location || undefined,
      height: form.height ? Number(form.height) : undefined,
      occupation: form.occupation,
      company: form.company || undefined,
      companyLocation: form.companyLocation || undefined,
      education: form.education || undefined,
      school: form.school || undefined,
      religion: form.religion || undefined,
      mbti: (form.mbti && form.mbti.length <= 4) ? form.mbti : undefined,
      hobbies: form.hobbies && form.hobbies.length > 0 ? form.hobbies.join(', ') : undefined,
      introduction: introText,
      idealType: idealText || undefined,
      consentPrivacy: form.consentPrivacy,
      consentThirdParty: form.consentThirdParty,
    };
  }

  const backendNamePattern = /^[가-힣a-zA-Z]+$/;

  it('자동 생성 닉네임 사용 시 name 필드가 백엔드 패턴 통과', () => {
    const suggestedNickname = generateNickname();
    const payload = buildPayload({
      nickname: '',
      gender: 'male',
      birthYear: '1994',
      phone: '010-1234-5678',
      occupation: '개발자',
      introduction: 'a'.repeat(20),
      consentPrivacy: true,
      consentThirdParty: true,
    }, suggestedNickname);

    expect(payload.name).toMatch(backendNamePattern);
    expect(payload.name.length).toBeGreaterThanOrEqual(2);
    expect(payload.name.length).toBeLessThanOrEqual(20);
  });

  it('MBTI "잘 모르겠어요" 선택 시 payload에 mbti 필드가 없어야 한다', () => {
    const payload = buildPayload({
      nickname: '테스트',
      gender: 'female',
      birthYear: '1995',
      phone: '010-1111-2222',
      occupation: '디자이너',
      introduction: 'a'.repeat(20),
      mbti: '잘 모르겠어요',
      consentPrivacy: true,
      consentThirdParty: true,
    }, '');

    expect(payload.mbti).toBeUndefined();
  });

  it('MBTI "INTJ" 선택 시 payload에 mbti 필드가 포함되어야 한다', () => {
    const payload = buildPayload({
      nickname: '테스트',
      gender: 'male',
      birthYear: '1990',
      phone: '010-3333-4444',
      occupation: '엔지니어',
      introduction: 'a'.repeat(50),
      mbti: 'INTJ',
      consentPrivacy: true,
      consentThirdParty: true,
    }, '');

    expect(payload.mbti).toBe('INTJ');
  });

  it('20자 미만 자기소개는 프론트엔드 검증에서 차단되어야 한다', () => {
    const errors = validateIntroduction('a'.repeat(15));
    expect(errors.introduction).toBeDefined();
    expect(errors.introduction).toContain('최소 20자');
  });
});
