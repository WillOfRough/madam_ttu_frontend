import { PREFERENCE_PRIORITIES } from '../data/constants';

/**
 * 두 회원 간 매칭 점수 계산 (0~100)
 * source: 기준 회원 (남성), target: 비교 대상 (여성)
 */
export function calculateMatchScore(source, target) {
  let score = 0;
  let maxScore = 0;

  // 1. 나이 선호 매칭 (20점)
  maxScore += 20;
  const targetAge = target.age;
  const [minAge, maxAge] = source.preferences.ageRange;
  if (targetAge >= minAge && targetAge <= maxAge) {
    score += 20;
  } else {
    const diff = targetAge < minAge ? minAge - targetAge : targetAge - maxAge;
    score += Math.max(0, 20 - diff * 4);
  }

  // 2. 종교 선호 매칭 (15점)
  maxScore += 15;
  if (source.preferences.religionPref === 'any') {
    score += 15;
  } else if (source.preferences.religionPref === 'same' && source.religion === target.religion) {
    score += 15;
  } else if (source.preferences.religionPref === 'no_religion' && target.religion === 'none') {
    score += 15;
  }

  // 3. 흡연 선호 매칭 (10점)
  maxScore += 10;
  if (source.preferences.smokingPref === 'any') {
    score += 10;
  } else if (source.preferences.smokingPref === 'no' && target.smoking === 'no') {
    score += 10;
  }

  // 4. 음주 선호 매칭 (10점)
  maxScore += 10;
  if (source.preferences.drinkingPref === 'any') {
    score += 10;
  } else if (source.preferences.drinkingPref === 'none' && target.drinking === 'none') {
    score += 10;
  } else if (source.preferences.drinkingPref === 'moderate' && ['rarely', 'sometimes'].includes(target.drinking)) {
    score += 10;
  } else if (source.preferences.drinkingPref === 'together' && ['sometimes', 'often'].includes(target.drinking)) {
    score += 10;
  }

  // 5. 성격 키워드 겹침 (25점)
  maxScore += 25;
  const commonPersonality = source.personality.filter((p) => target.personality.includes(p));
  score += Math.min(25, commonPersonality.length * 8);

  // 6. 취미 겹침 (10점)
  maxScore += 10;
  const commonHobbies = source.hobbies.filter((h) => target.hobbies.includes(h));
  score += Math.min(10, commonHobbies.length * 5);

  // 7. MBTI 궁합 (10점)
  maxScore += 10;
  score += calculateMBTIScore(source.mbti, target.mbti);

  return Math.round((score / maxScore) * 100);
}

function calculateMBTIScore(mbti1, mbti2) {
  if (!mbti1 || !mbti2) return 5;

  // 좋은 궁합 쌍
  const goodPairs = {
    INTJ: ['ENFP', 'ENTP'],
    INTP: ['ENFJ', 'ENTJ'],
    ENTJ: ['INFP', 'INTP'],
    ENTP: ['INFJ', 'INTJ'],
    INFJ: ['ENFP', 'ENTP'],
    INFP: ['ENFJ', 'ENTJ'],
    ENFJ: ['INFP', 'INTP'],
    ENFP: ['INFJ', 'INTJ'],
    ISTJ: ['ESFP', 'ESTP'],
    ISFJ: ['ESFP', 'ESTP'],
    ESTJ: ['ISFP', 'ISTP'],
    ESFJ: ['ISFP', 'ISTP'],
    ISTP: ['ESFJ', 'ESTJ'],
    ISFP: ['ESTJ', 'ESFJ'],
    ESTP: ['ISTJ', 'ISFJ'],
    ESFP: ['ISTJ', 'ISFJ'],
  };

  if (goodPairs[mbti1]?.includes(mbti2)) return 10;

  // E/I 보완
  let compatibility = 5;
  if (mbti1[0] !== mbti2[0]) compatibility += 2;
  if (mbti1[1] === mbti2[1]) compatibility += 1;

  return Math.min(10, compatibility);
}

/**
 * 회원의 추천 매칭 리스트 반환
 */
export function getMatchRecommendations(sourceUser, allUsers, topN = 5) {
  const oppositeGender = sourceUser.gender === 'male' ? 'female' : 'male';
  const candidates = allUsers.filter((u) => u.gender === oppositeGender);

  const scored = candidates.map((target) => ({
    user: target,
    score: calculateMatchScore(sourceUser, target),
    reverseScore: calculateMatchScore(target, sourceUser),
  }));

  // 양방향 점수의 평균으로 정렬
  scored.sort((a, b) => {
    const avgA = (a.score + a.reverseScore) / 2;
    const avgB = (b.score + b.reverseScore) / 2;
    return avgB - avgA;
  });

  return scored.slice(0, topN).map((item) => ({
    ...item,
    avgScore: Math.round((item.score + item.reverseScore) / 2),
  }));
}
