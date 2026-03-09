/* findmyone — 상수 정의 */

export const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
];

export const EDUCATION_OPTIONS = [
  { value: '고등학교 졸업', label: '고등학교 졸업' },
  { value: '전문대 졸업', label: '전문대 졸업' },
  { value: '대학교 졸업', label: '대학교 졸업' },
  { value: '석사', label: '석사' },
  { value: '박사', label: '박사' },
];

export const RELIGION_OPTIONS = [
  { value: '무교', label: '무교' },
  { value: '기독교', label: '기독교' },
  { value: '천주교', label: '천주교' },
  { value: '불교', label: '불교' },
  { value: '기타', label: '기타' },
];

export const MBTI_OPTIONS = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
].map(v => ({ value: v, label: v }));

/* ── 별명 자동 생성 ── */
const NICKNAME_ADJ = [
  '행복한', '따뜻한', '밝은', '귀여운', '씩씩한',
  '다정한', '용감한', '솔직한', '느긋한', '재밌는',
  '엉뚱한', '상냥한', '센스있는', '활발한', '차분한',
  '기분좋은', '웃긴', '수줍은', '낙천적인', '성실한',
  '자유로운', '호기심많은', '쿨한', '긍정적인', '매력적인',
];

const NICKNAME_NOUN = [
  '수달', '고양이', '강아지', '토끼', '판다',
  '펭귄', '여우', '다람쥐', '코알라', '사슴',
  '곰돌이', '햄스터', '돌고래', '부엉이', '나무늘보',
  '비버', '라쿤', '알파카', '치타', '레서판다',
  '미어캣', '오리', '수달이', '쿼카', '카피바라',
];

export function generateNickname() {
  const adj = NICKNAME_ADJ[Math.floor(Math.random() * NICKNAME_ADJ.length)];
  const noun = NICKNAME_NOUN[Math.floor(Math.random() * NICKNAME_NOUN.length)];
  return `${adj}${noun}`;
}

/* ── 취미 키워드 ── */
export const HOBBY_KEYWORDS = [
  '운동/헬스', '러닝/마라톤', '등산/하이킹', '자전거', '수영',
  '요가/필라테스', '골프', '테니스/배드민턴', '축구/풋살', '농구',
  '여행', '캠핑', '맛집탐방', '카페투어', '요리/베이킹',
  '독서', '영화/넷플릭스', '음악감상', '악기연주', '노래/보컬',
  '사진/영상', '그림/일러스트', '게임', '보드게임', '반려동물',
  '식물키우기', '명상', '봉사활동', '와인/위스키', '공예/DIY',
];

/* ── 자기소개 키워드 추천 ── */
export const INTRO_KEYWORDS = [
  '활발한', '차분한', '유머러스', '감성적', '논리적',
  '계획적', '즉흥적', '외향적', '내향적', '책벌레',
  '운동광', '미식가', '여행러', '집순이/집돌이', '워커홀릭',
  '낭만적', '현실적', '리더형', '서포터형', '호기심쟁이',
];

/* ── 이상형 키워드 추천 ── */
export const IDEAL_KEYWORDS = [
  '유머감각', '다정함', '솔직함', '자기관리', '지적인',
  '활동적', '차분한', '리더십', '배려심', '긍정적',
  '대화잘통하는', '취미공유', '독립적인', '가정적인', '야망있는',
  '감성적인', '성실한', '자유로운', '건강한', '예의바른',
];
