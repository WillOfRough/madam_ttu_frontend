import { describe, it, expect } from 'vitest';
import {
  GENDER_OPTIONS,
  HEIGHT_OPTIONS,
  EDUCATION_OPTIONS,
  RELIGION_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  MBTI_OPTIONS,
  PERSONALITY_KEYWORDS,
  HOBBY_OPTIONS,
  PREFERENCE_PRIORITIES,
  RELIGION_PREFERENCE_OPTIONS,
  DRINKING_PREFERENCE_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS,
  MADAM_QUOTES,
} from '../data/constants';

describe('Constants - 상수 데이터 무결성', () => {
  it('성별 옵션이 male/female 2개인지 확인', () => {
    expect(GENDER_OPTIONS).toHaveLength(2);
    expect(GENDER_OPTIONS.map(o => o.value)).toEqual(['male', 'female']);
  });

  it('키 옵션이 150~185cm 범위인지 확인', () => {
    expect(HEIGHT_OPTIONS.length).toBe(36);
    expect(HEIGHT_OPTIONS[0].value).toBe('150');
    expect(HEIGHT_OPTIONS[HEIGHT_OPTIONS.length - 1].value).toBe('185');
  });

  it('학력 옵션이 5개인지 확인', () => {
    expect(EDUCATION_OPTIONS).toHaveLength(5);
    const values = EDUCATION_OPTIONS.map(o => o.value);
    expect(values).toContain('bachelor');
    expect(values).toContain('master');
  });

  it('종교 옵션에 무교 포함', () => {
    expect(RELIGION_OPTIONS.find(o => o.value === 'none')).toBeDefined();
  });

  it('음주 옵션 4개', () => {
    expect(DRINKING_OPTIONS).toHaveLength(4);
  });

  it('흡연 옵션 3개', () => {
    expect(SMOKING_OPTIONS).toHaveLength(3);
  });

  it('MBTI 16가지 타입 모두 존재', () => {
    expect(MBTI_OPTIONS).toHaveLength(16);
    expect(MBTI_OPTIONS.find(o => o.value === 'INTJ')).toBeDefined();
    expect(MBTI_OPTIONS.find(o => o.value === 'ENFP')).toBeDefined();
  });

  it('성격 키워드가 20개인지 확인', () => {
    expect(PERSONALITY_KEYWORDS).toHaveLength(20);
    expect(PERSONALITY_KEYWORDS).toContain('#다정한_츤데레');
    expect(PERSONALITY_KEYWORDS).toContain('#프로직장인');
  });

  it('성격 키워드에 중복이 없는지 확인', () => {
    const unique = new Set(PERSONALITY_KEYWORDS);
    expect(unique.size).toBe(PERSONALITY_KEYWORDS.length);
  });

  it('취미 옵션이 15개인지 확인', () => {
    expect(HOBBY_OPTIONS).toHaveLength(15);
  });

  it('우선순위 항목이 6개이고 id가 유일한지 확인', () => {
    expect(PREFERENCE_PRIORITIES).toHaveLength(6);
    const ids = PREFERENCE_PRIORITIES.map(p => p.id);
    expect(new Set(ids).size).toBe(6);
  });

  it('모든 우선순위 항목에 label과 icon이 있는지 확인', () => {
    PREFERENCE_PRIORITIES.forEach(p => {
      expect(p.label).toBeTruthy();
      expect(p.icon).toBeTruthy();
    });
  });

  it('종교 선호 옵션 3개', () => {
    expect(RELIGION_PREFERENCE_OPTIONS).toHaveLength(3);
  });

  it('음주 선호 옵션 4개', () => {
    expect(DRINKING_PREFERENCE_OPTIONS).toHaveLength(4);
  });

  it('흡연 선호 옵션 2개', () => {
    expect(SMOKING_PREFERENCE_OPTIONS).toHaveLength(2);
  });

  it('마담MJ 멘트가 모두 존재하는지 확인', () => {
    expect(MADAM_QUOTES.welcome).toBeTruthy();
    expect(MADAM_QUOTES.step1_intro).toBeTruthy();
    expect(MADAM_QUOTES.step2_intro).toBeTruthy();
    expect(MADAM_QUOTES.complete).toBeTruthy();
    expect(MADAM_QUOTES.privacy).toBeTruthy();
  });
});
