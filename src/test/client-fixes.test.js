import { describe, it, expect } from 'vitest';
import { generateNickname } from '../data/constants';
import { NAME_PATTERN } from '../store/clientFormStore';

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
// Bug 2: 가이드 질문 조합 자기소개 검증
// introQ1~Q3 필수, 조합 후 20자 이상
// ──────────────────────────────────────────────

function combineIntro(introQ1, introQ2, introQ3, introQ4, introKeywords = []) {
  const answers = [introQ1, introQ2, introQ3, introQ4]
    .map((a) => a.trim())
    .filter(Boolean)
    .join(' ');
  const prefix = introKeywords.length > 0 ? `[${introKeywords.join(', ')}] ` : '';
  return prefix + answers;
}

function validateGuidedIntro(form) {
  const errors = {};
  if (!form.introQ1.trim()) errors.introQ1 = '답변을 입력해주세요.';
  if (!form.introQ2.trim()) errors.introQ2 = '답변을 입력해주세요.';
  if (!form.introQ3.trim()) errors.introQ3 = '답변을 입력해주세요.';
  const combined = [form.introQ1, form.introQ2, form.introQ3, form.introQ4 || '']
    .map((a) => a.trim()).filter(Boolean).join(' ');
  const keywordsPrefix = (form.introKeywords || []).length > 0 ? `[${form.introKeywords.join(', ')}] ` : '';
  const totalLen = keywordsPrefix.length + combined.length;
  if (combined.length > 0 && totalLen < 20) {
    errors.introLength = `${20 - totalLen}자 더 작성해주세요. (최소 20자)`;
  }
  return errors;
}

describe('Bug 2: 가이드 질문 자기소개 검증', () => {
  it('Q1 비어있으면 에러가 발생해야 한다', () => {
    const errors = validateGuidedIntro({ introQ1: '', introQ2: '답변2', introQ3: '답변3' });
    expect(errors.introQ1).toBeDefined();
  });

  it('Q2 비어있으면 에러가 발생해야 한다', () => {
    const errors = validateGuidedIntro({ introQ1: '답변1', introQ2: '', introQ3: '답변3' });
    expect(errors.introQ2).toBeDefined();
  });

  it('Q3 비어있으면 에러가 발생해야 한다', () => {
    const errors = validateGuidedIntro({ introQ1: '답변1', introQ2: '답변2', introQ3: '' });
    expect(errors.introQ3).toBeDefined();
  });

  it('Q4는 비어있어도 에러가 없어야 한다 (선택)', () => {
    const errors = validateGuidedIntro({
      introQ1: '카페에서 책 읽어요',
      introQ2: '러닝에 빠져있어요',
      introQ3: '유머 있다고 해요',
    });
    expect(errors.introQ4).toBeUndefined();
  });

  it('Q1~Q3 채우면 필수 에러가 없어야 한다', () => {
    const errors = validateGuidedIntro({
      introQ1: '카페에서 책 읽어요',
      introQ2: '러닝에 빠져있어요',
      introQ3: '유머 있다고 해요',
    });
    expect(errors.introQ1).toBeUndefined();
    expect(errors.introQ2).toBeUndefined();
    expect(errors.introQ3).toBeUndefined();
  });

  it('조합 결과가 20자 미만이면 introLength 에러 발생', () => {
    const errors = validateGuidedIntro({
      introQ1: 'ab',
      introQ2: 'cd',
      introQ3: 'ef',
    });
    expect(errors.introLength).toBeDefined();
    expect(errors.introLength).toContain('최소 20자');
  });

  it('조합 결과가 20자 이상이면 introLength 에러 없음', () => {
    const errors = validateGuidedIntro({
      introQ1: '카페에서 책 읽어요',
      introQ2: '러닝에 빠져있어요',
      introQ3: '유머 있다고 해요',
    });
    const combined = combineIntro('카페에서 책 읽어요', '러닝에 빠져있어요', '유머 있다고 해요', '');
    expect(combined.length).toBeGreaterThanOrEqual(20);
    expect(errors.introLength).toBeUndefined();
  });

  it('키워드 prefix 포함하여 20자 이상이면 통과', () => {
    const errors = validateGuidedIntro({
      introQ1: 'ab',
      introQ2: 'cd',
      introQ3: 'ef',
      introKeywords: ['활발한', '따뜻한', '유머러스'],
    });
    expect(errors.introLength).toBeUndefined();
  });

  it('combineIntro가 답변들을 공백으로 조합한다', () => {
    const result = combineIntro('답변1', '답변2', '답변3', '답변4');
    expect(result).toBe('답변1 답변2 답변3 답변4');
  });

  it('combineIntro가 빈 답변을 제외한다', () => {
    const result = combineIntro('답변1', '', '답변3', '');
    expect(result).toBe('답변1 답변3');
  });

  it('combineIntro가 키워드 prefix를 포함한다', () => {
    const result = combineIntro('답변1', '답변2', '답변3', '', ['활발한']);
    expect(result).toBe('[활발한] 답변1 답변2 답변3');
  });
});

// ──────────────────────────────────────────────
// Bug 3: MBTI "잘 모르겠어요" 필터링 검증
// 백엔드: @Size(max = 4)
// ──────────────────────────────────────────────

// clientFormStore.js의 mbti 필터링 로직 재현
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
    const introAnswers = [form.introQ1 || '', form.introQ2 || '', form.introQ3 || '', form.introQ4 || '']
      .map((a) => a.trim())
      .filter(Boolean)
      .join(' ');
    const introText = [
      form.introKeywords && form.introKeywords.length > 0 ? `[${form.introKeywords.join(', ')}] ` : '',
      introAnswers,
    ].join('');
    const idealText = [
      form.idealKeywords && form.idealKeywords.length > 0 ? `[${form.idealKeywords.join(', ')}] ` : '',
      form.idealType,
    ].join('');

    return {
      token: form.token,
      name: form.name,
      nickname: nickname,
      gender: form.gender,
      birthDate: form.birthYear ? `${form.birthYear}-01-01` : '',
      phone: form.phone,
      location: form.location || undefined,
      height: form.height ? Number(form.height) : undefined,
      occupation: form.occupation,
      company: form.company || undefined,
      education: form.education || undefined,
      religion: form.religion || undefined,
      mbti: (form.mbti && form.mbti.length <= 4) ? form.mbti : undefined,
      hobbies: form.hobbies && form.hobbies.length > 0 ? form.hobbies.join(', ') : undefined,
      introduction: introText,
      idealType: idealText || undefined,
    };
  }

  it('실명(name)과 닉네임(nickname)이 독립적으로 전달되어야 한다', () => {
    const suggestedNickname = generateNickname();
    const payload = buildPayload({
      name: '홍길동',
      nickname: '',
      gender: 'male',
      birthYear: '1994',
      phone: '010-1234-5678',
      occupation: '개발자',
      introQ1: '카페에서 책 읽어요',
      introQ2: '러닝에 빠져있어요',
      introQ3: '유머 있다고 해요',
      consentPrivacy: true,
      consentThirdParty: true,
    }, suggestedNickname);

    expect(payload.name).toBe('홍길동');
    expect(payload.nickname).toBe(suggestedNickname);
    expect(payload.name).not.toBe(payload.nickname);
  });

  it('name 필드가 NAME_PATTERN 에 맞아야 한다', () => {
    expect(NAME_PATTERN.test('홍길동')).toBe(true);
    expect(NAME_PATTERN.test('John')).toBe(true);
    expect(NAME_PATTERN.test('홍 길동')).toBe(false); // 공백 불가
    expect(NAME_PATTERN.test('홍길동!')).toBe(false); // 특수문자 불가
    expect(NAME_PATTERN.test('')).toBe(false); // 빈 문자열 불가
  });

  it('MBTI "잘 모르겠어요" 선택 시 payload에 mbti 필드가 없어야 한다', () => {
    const payload = buildPayload({
      name: '테스트',
      nickname: '테스트닉네임',
      gender: 'female',
      birthYear: '1995',
      phone: '010-1111-2222',
      occupation: '디자이너',
      introQ1: '카페에서 책 읽어요',
      introQ2: '러닝에 빠져있어요',
      introQ3: '유머 있다고 해요',
      mbti: '잘 모르겠어요',
      consentPrivacy: true,
      consentThirdParty: true,
    }, '');

    expect(payload.mbti).toBeUndefined();
  });

  it('MBTI "INTJ" 선택 시 payload에 mbti 필드가 포함되어야 한다', () => {
    const payload = buildPayload({
      name: '테스트',
      nickname: '테스트닉네임',
      gender: 'male',
      birthYear: '1990',
      phone: '010-3333-4444',
      occupation: '엔지니어',
      introQ1: '카페에서 책 읽어요',
      introQ2: '러닝에 빠져있어요',
      introQ3: '유머 있다고 해요',
      mbti: 'INTJ',
      consentPrivacy: true,
      consentThirdParty: true,
    }, '');

    expect(payload.mbti).toBe('INTJ');
  });

  it('20자 미만 자기소개는 프론트엔드 검증에서 차단되어야 한다', () => {
    const errors = validateGuidedIntro({ introQ1: 'ab', introQ2: 'cd', introQ3: 'ef' });
    expect(errors.introLength).toBeDefined();
    expect(errors.introLength).toContain('최소 20자');
  });
});
