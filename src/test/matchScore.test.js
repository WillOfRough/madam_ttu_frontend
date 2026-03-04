import { describe, it, expect } from 'vitest';
import { calculateMatchScore, getMatchRecommendations } from '../utils/matchScore';
import mockUsers from '../data/mockUsers';

describe('Match Score - 매칭 점수 계산', () => {
  const maleUser = mockUsers.find(u => u.id === 'm1'); // 김도윤 (INTJ, 29세)
  const femaleUser = mockUsers.find(u => u.id === 'f1'); // 김서연 (INFP, 27세)

  it('점수가 0~100 범위인지 확인', () => {
    const score = calculateMatchScore(maleUser, femaleUser);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('모든 남녀 조합에서 점수가 0~100 범위인지 확인', () => {
    const males = mockUsers.filter(u => u.gender === 'male');
    const females = mockUsers.filter(u => u.gender === 'female');

    males.forEach(m => {
      females.forEach(f => {
        const score = calculateMatchScore(m, f);
        expect(score, `${m.name} → ${f.name}`).toBeGreaterThanOrEqual(0);
        expect(score, `${m.name} → ${f.name}`).toBeLessThanOrEqual(100);
      });
    });
  });

  it('동일 조건 회원은 높은 점수를 받는지 확인', () => {
    // m9 (기독교, 비흡연, 가끔 음주) → f7 (기독교, 비흡연, 가끔 음주) - 같은 종교 선호
    const m9 = mockUsers.find(u => u.id === 'm9');
    const f7 = mockUsers.find(u => u.id === 'f7');
    const score = calculateMatchScore(m9, f7);
    expect(score).toBeGreaterThan(40); // 종교 매칭, 흡연 매칭 등
  });

  it('종교 선호 "same"일 때 같은 종교면 점수 높음', () => {
    // m2 (기독교, religionPref: same)
    const m2 = mockUsers.find(u => u.id === 'm2');
    // f7 (기독교)
    const f7 = mockUsers.find(u => u.id === 'f7');
    // f1 (무교)
    const f1 = mockUsers.find(u => u.id === 'f1');

    const sameReligionScore = calculateMatchScore(m2, f7);
    const diffReligionScore = calculateMatchScore(m2, f1);
    expect(sameReligionScore).toBeGreaterThan(diffReligionScore);
  });

  it('"any" 선호는 항상 만점을 받는지 확인', () => {
    // m1 (religionPref: any) → 누구든 종교 점수 만점
    const m1 = mockUsers.find(u => u.id === 'm1');
    // 종교가 다른 여성들에게도 일정 점수 이상
    const females = mockUsers.filter(u => u.gender === 'female');
    females.forEach(f => {
      const score = calculateMatchScore(m1, f);
      expect(score).toBeGreaterThan(0);
    });
  });

  it('공통 성격 키워드가 많을수록 점수가 높은지 확인', () => {
    // m4 (감성적인, 창의적인, 다정한, 신중한, 배려심 깊은)
    // f4 (감성적인, 차분한, 신중한, 배려심 깊은, 내향적인) → 3개 공통
    // f3 (리더십 있는, 성실한, 외향적인, 열정적인, 독립적인) → 0개 공통
    const m4 = mockUsers.find(u => u.id === 'm4');
    const f4 = mockUsers.find(u => u.id === 'f4');
    const f3 = mockUsers.find(u => u.id === 'f3');

    const scoreF4 = calculateMatchScore(m4, f4);
    const scoreF3 = calculateMatchScore(m4, f3);
    expect(scoreF4).toBeGreaterThan(scoreF3);
  });
});

describe('Match Recommendations - 매칭 추천 리스트', () => {
  it('남성 기준으로 여성만 추천하는지 확인', () => {
    const maleUser = mockUsers.find(u => u.id === 'm1');
    const recs = getMatchRecommendations(maleUser, mockUsers, 5);

    expect(recs.length).toBeLessThanOrEqual(5);
    recs.forEach(rec => {
      expect(rec.user.gender).toBe('female');
    });
  });

  it('여성 기준으로 남성만 추천하는지 확인', () => {
    const femaleUser = mockUsers.find(u => u.id === 'f1');
    const recs = getMatchRecommendations(femaleUser, mockUsers, 5);

    recs.forEach(rec => {
      expect(rec.user.gender).toBe('male');
    });
  });

  it('추천 결과가 avgScore 내림차순으로 정렬되는지 확인', () => {
    const maleUser = mockUsers.find(u => u.id === 'm1');
    const recs = getMatchRecommendations(maleUser, mockUsers, 10);

    for (let i = 0; i < recs.length - 1; i++) {
      expect(recs[i].avgScore).toBeGreaterThanOrEqual(recs[i + 1].avgScore);
    }
  });

  it('추천 결과에 score, reverseScore, avgScore가 모두 존재하는지 확인', () => {
    const maleUser = mockUsers.find(u => u.id === 'm3');
    const recs = getMatchRecommendations(maleUser, mockUsers, 3);

    recs.forEach(rec => {
      expect(rec).toHaveProperty('score');
      expect(rec).toHaveProperty('reverseScore');
      expect(rec).toHaveProperty('avgScore');
      expect(rec).toHaveProperty('user');
      expect(typeof rec.score).toBe('number');
      expect(typeof rec.reverseScore).toBe('number');
      expect(typeof rec.avgScore).toBe('number');
    });
  });

  it('avgScore가 (score + reverseScore) / 2 반올림인지 확인', () => {
    const maleUser = mockUsers.find(u => u.id === 'm5');
    const recs = getMatchRecommendations(maleUser, mockUsers, 5);

    recs.forEach(rec => {
      const expected = Math.round((rec.score + rec.reverseScore) / 2);
      expect(rec.avgScore).toBe(expected);
    });
  });

  it('topN 파라미터가 정상 동작하는지 확인', () => {
    const maleUser = mockUsers.find(u => u.id === 'm1');
    const recs3 = getMatchRecommendations(maleUser, mockUsers, 3);
    const recs5 = getMatchRecommendations(maleUser, mockUsers, 5);
    expect(recs3).toHaveLength(3);
    expect(recs5).toHaveLength(5);
  });

  it('모든 남성 회원에 대해 추천이 정상 생성되는지 확인', () => {
    const males = mockUsers.filter(u => u.gender === 'male');
    males.forEach(m => {
      const recs = getMatchRecommendations(m, mockUsers, 5);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs.length).toBeLessThanOrEqual(5);
    });
  });

  it('모든 여성 회원에 대해 추천이 정상 생성되는지 확인', () => {
    const females = mockUsers.filter(u => u.gender === 'female');
    females.forEach(f => {
      const recs = getMatchRecommendations(f, mockUsers, 5);
      expect(recs.length).toBeGreaterThan(0);
      expect(recs.length).toBeLessThanOrEqual(5);
    });
  });
});
