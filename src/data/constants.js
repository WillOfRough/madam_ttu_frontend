/* 마담MJ의 비밀 서재 — 상수 정의 */

export const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
];

export const AGE_OPTIONS = Array.from({ length: 18 }, (_, i) => ({
  value: String(23 + i),
  label: `${23 + i}세`,
}));

export const HEIGHT_OPTIONS = Array.from({ length: 36 }, (_, i) => ({
  value: String(150 + i),
  label: `${150 + i}cm`,
}));

export const EDUCATION_OPTIONS = [
  { value: 'high_school', label: '고등학교 졸업' },
  { value: 'associate', label: '전문대 졸업' },
  { value: 'bachelor', label: '대학교 졸업' },
  { value: 'master', label: '석사' },
  { value: 'doctorate', label: '박사' },
];

export const RELIGION_OPTIONS = [
  { value: 'none', label: '무교' },
  { value: 'christian', label: '기독교' },
  { value: 'catholic', label: '천주교' },
  { value: 'buddhist', label: '불교' },
  { value: 'other', label: '기타' },
];

export const DRINKING_OPTIONS = [
  { value: 'none', label: '전혀 안 함' },
  { value: 'rarely', label: '가끔 (월 1~2회)' },
  { value: 'sometimes', label: '종종 (주 1~2회)' },
  { value: 'often', label: '자주' },
];

export const SMOKING_OPTIONS = [
  { value: 'no', label: '비흡연' },
  { value: 'yes', label: '흡연' },
  { value: 'quit', label: '금연 중' },
];

export const MBTI_OPTIONS = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
].map(v => ({ value: v, label: v }));

export const PERSONALITY_KEYWORDS = [
  '활발한', '차분한', '유머러스', '진지한', '다정한',
  '독립적인', '감성적인', '이성적인', '모험적인', '안정적인',
  '외향적인', '내향적인', '낙천적인', '신중한', '열정적인',
  '배려심 깊은', '호기심 많은', '성실한', '창의적인', '리더십 있는',
];

export const HOBBY_OPTIONS = [
  '운동/헬스', '독서', '영화/넷플릭스', '여행', '요리',
  '카페 탐방', '음악 감상', '게임', '등산', '사진/영상',
  '반려동물', '미술/전시', '와인/위스키', '캠핑', '자기개발',
];

export const LOCATION_OPTIONS = [
  { value: 'seoul_gangnam', label: '서울 강남/서초' },
  { value: 'seoul_songpa', label: '서울 송파/강동' },
  { value: 'seoul_mapo', label: '서울 마포/용산' },
  { value: 'seoul_jongno', label: '서울 종로/중구' },
  { value: 'seoul_gangbuk', label: '서울 강북/성북' },
  { value: 'seoul_other', label: '서울 기타' },
  { value: 'gyeonggi', label: '경기도' },
  { value: 'incheon', label: '인천' },
  { value: 'other', label: '기타 지역' },
];

export const PREFERENCE_PRIORITIES = [
  { id: 'appearance', label: '외모', icon: '✨' },
  { id: 'personality', label: '성격', icon: '💜' },
  { id: 'job', label: '직업/경제력', icon: '💼' },
  { id: 'values', label: '가치관', icon: '🌿' },
  { id: 'humor', label: '유머/대화', icon: '😄' },
  { id: 'lifestyle', label: '라이프스타일', icon: '🏡' },
];

export const RELIGION_PREFERENCE_OPTIONS = [
  { value: 'same', label: '같은 종교였으면 좋겠어요' },
  { value: 'no_religion', label: '무교인 분이 좋아요' },
  { value: 'any', label: '상관없어요' },
];

export const DRINKING_PREFERENCE_OPTIONS = [
  { value: 'none', label: '안 마시는 분이 좋아요' },
  { value: 'moderate', label: '적당히 마시는 분이 좋아요' },
  { value: 'together', label: '함께 즐길 수 있는 분이 좋아요' },
  { value: 'any', label: '상관없어요' },
];

export const SMOKING_PREFERENCE_OPTIONS = [
  { value: 'no', label: '비흡연자만' },
  { value: 'any', label: '상관없어요' },
];

export const MADAM_QUOTES = {
  welcome: '어서 오세요, 마담MJ의 비밀 서재에 오신 것을 환영합니다.',
  step1_intro: '먼저, 당신이 어떤 사람인지 마담MJ에게 알려주세요.',
  step1_personality: '당신을 가장 잘 표현하는 키워드는 무엇인가요?',
  step1_photo: '당신의 매력을 보여줄 사진을 올려주세요.',
  step2_intro: '이제, 어떤 인연을 꿈꾸는지 들려주세요.',
  step2_priority: '당신에게 가장 중요한 것부터 순서대로 놓아주세요.',
  complete: '마담MJ가 정성껏 읽어볼게요. 좋은 인연을 기대해 주세요.',
};

/* ── 닉네임 자동 추천 풀 ── */
const NICKNAME_PREFIXES_MALE = [
  '달빛 속의', '서재의', '골목길', '새벽녘', '오래된 서점의',
  '가을빛', '한강의', '조용한', '별을 세는', '노을빛',
  '바람 부는', '지붕 위의', '잉크빛', '담장 너머', '차 한잔의',
];

const NICKNAME_PREFIXES_FEMALE = [
  '봄날의', '찻잔 속의', '달빛 아래', '라벤더', '오래된 편지의',
  '벚꽃길', '하늘빛', '새벽이슬', '수채화', '장미 정원의',
  '안개 속의', '꽃잎 위의', '보랏빛', '포근한', '달콤한 오후의',
];

const NICKNAME_NOUNS_MALE = [
  '신사', '여행자', '피아니스트', '탐험가', '독서가',
  '음유시인', '바리스타', '철학자', '사색가', '조타수',
  '나그네', '수호자', '이야기꾼', '정원사', '건축가',
];

const NICKNAME_NOUNS_FEMALE = [
  '소녀', '뮤즈', '이야기꾼', '여행자', '피아니스트',
  '서재지기', '화가', '몽상가', '연금술사', '무용수',
  '시인', '요정', '마녀', '사서', '플로리스트',
];

export function generateNickname(gender = 'male') {
  const prefixes = gender === 'female' ? NICKNAME_PREFIXES_FEMALE : NICKNAME_PREFIXES_MALE;
  const nouns = gender === 'female' ? NICKNAME_NOUNS_FEMALE : NICKNAME_NOUNS_MALE;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${prefix} ${noun}`;
}
