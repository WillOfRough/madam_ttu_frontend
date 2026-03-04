import { describe, it, expect } from 'vitest';
import mockUsers from '../data/mockUsers';
import {
  PERSONALITY_KEYWORDS,
  HOBBY_OPTIONS,
  PREFERENCE_PRIORITIES,
} from '../data/constants';

describe('Mock Users - 테스트 데이터 무결성', () => {
  it('총 20명의 회원 데이터가 있는지 확인', () => {
    expect(mockUsers).toHaveLength(20);
  });

  it('남성 10명, 여성 10명인지 확인', () => {
    const males = mockUsers.filter(u => u.gender === 'male');
    const females = mockUsers.filter(u => u.gender === 'female');
    expect(males).toHaveLength(10);
    expect(females).toHaveLength(10);
  });

  it('모든 회원의 ID가 유일한지 확인', () => {
    const ids = mockUsers.map(u => u.id);
    expect(new Set(ids).size).toBe(20);
  });

  it('남성 ID는 m으로, 여성 ID는 f로 시작하는지 확인', () => {
    mockUsers.forEach(u => {
      if (u.gender === 'male') expect(u.id).toMatch(/^m\d+$/);
      if (u.gender === 'female') expect(u.id).toMatch(/^f\d+$/);
    });
  });

  describe('각 회원의 필수 필드 존재 여부', () => {
    const requiredFields = [
      'id', 'gender', 'nickname', 'name', 'age', 'height',
      'location', 'education', 'job', 'religion', 'drinking',
      'smoking', 'mbti', 'personality', 'hobbies', 'intro',
      'photos', 'preferences', 'createdAt',
    ];

    mockUsers.forEach(user => {
      it(`${user.name} (${user.id}): 모든 필수 필드 존재`, () => {
        requiredFields.forEach(field => {
          expect(user[field], `Missing field: ${field}`).toBeDefined();
        });
      });
    });
  });

  describe('각 회원의 데이터 유효성', () => {
    mockUsers.forEach(user => {
      describe(`${user.name} (${user.id})`, () => {
        it('나이가 23~40 사이', () => {
          expect(user.age).toBeGreaterThanOrEqual(23);
          expect(user.age).toBeLessThanOrEqual(40);
        });

        it('키가 150~200 사이', () => {
          expect(user.height).toBeGreaterThanOrEqual(150);
          expect(user.height).toBeLessThanOrEqual(200);
        });

        it('성격 키워드가 1~5개이고 유효한 값인지 확인', () => {
          expect(user.personality.length).toBeGreaterThanOrEqual(1);
          expect(user.personality.length).toBeLessThanOrEqual(5);
          user.personality.forEach(p => {
            expect(PERSONALITY_KEYWORDS).toContain(p);
          });
        });

        it('취미가 1~5개이고 유효한 값인지 확인', () => {
          expect(user.hobbies.length).toBeGreaterThanOrEqual(1);
          expect(user.hobbies.length).toBeLessThanOrEqual(5);
          user.hobbies.forEach(h => {
            expect(HOBBY_OPTIONS).toContain(h);
          });
        });

        it('사진이 3장 이상인지 확인', () => {
          expect(user.photos.length).toBeGreaterThanOrEqual(3);
        });

        it('자기소개가 비어있지 않은지 확인', () => {
          expect(user.intro.length).toBeGreaterThan(0);
        });

        it('MBTI가 유효한 4자리 타입인지 확인', () => {
          expect(user.mbti).toMatch(/^[EI][SN][TF][JP]$/);
        });

        it('가입일이 유효한 날짜 형식인지 확인', () => {
          expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(new Date(user.createdAt).toString()).not.toBe('Invalid Date');
        });
      });
    });
  });

  describe('선호 조건 (preferences) 유효성', () => {
    const validPriorityIds = PREFERENCE_PRIORITIES.map(p => p.id);

    mockUsers.forEach(user => {
      describe(`${user.name} (${user.id}) preferences`, () => {
        it('우선순위가 6개이고 유효한 ID인지 확인', () => {
          expect(user.preferences.priorities).toHaveLength(6);
          user.preferences.priorities.forEach(p => {
            expect(validPriorityIds).toContain(p);
          });
        });

        it('우선순위에 중복이 없는지 확인', () => {
          const unique = new Set(user.preferences.priorities);
          expect(unique.size).toBe(6);
        });

        it('나이 선호 범위가 [min, max] 형태인지 확인', () => {
          const [min, max] = user.preferences.ageRange;
          expect(min).toBeLessThanOrEqual(max);
          expect(min).toBeGreaterThanOrEqual(20);
          expect(max).toBeLessThanOrEqual(50);
        });

        it('종교 선호가 유효한 값인지 확인', () => {
          expect(['same', 'no_religion', 'any']).toContain(user.preferences.religionPref);
        });

        it('음주 선호가 유효한 값인지 확인', () => {
          expect(['none', 'moderate', 'together', 'any']).toContain(user.preferences.drinkingPref);
        });

        it('흡연 선호가 유효한 값인지 확인', () => {
          expect(['no', 'any']).toContain(user.preferences.smokingPref);
        });
      });
    });
  });
});
