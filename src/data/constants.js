/* 마담MJ의 비밀 서재 — 상수 정의 */

export const GENDER_OPTIONS = [
  { value: 'male', label: '멋진 신사' },
  { value: 'female', label: '아름다운 숙녀' },
];

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
  { value: 'none', label: '자유로운 영혼 (무교)' },
  { value: 'christian', label: '기독교' },
  { value: 'catholic', label: '천주교' },
  { value: 'buddhist', label: '불교' },
  { value: 'other', label: '기타' },
];

export const DRINKING_OPTIONS = [
  { value: 'none', label: '전혀 안 해요' },
  { value: 'rarely', label: '가끔 (월 1~2회)' },
  { value: 'sometimes', label: '종종 (주 1~2회)' },
  { value: 'often', label: '자주 즐겨요' },
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
  '#다정한_츤데레', '#프로직장인', '#유머_담당', '#집순이_꿈나무', '#러닝_홀릭',
  '#댕댕이파', '#카페투어_전문가', '#책냄새_애호가', '#요리하는_매력', '#리액션_장인',
  '#워커홀릭_반전매력', '#감성_충만', '#운동_덕후', '#여행_중독', '#차분한_리더',
  '#낙천적_에너자이저', '#섬세한_배려왕', '#호기심_대마왕', '#음악_없인_못살아', '#와인한잔_어때요',
];

export const HOBBY_OPTIONS = [
  '운동/헬스', '독서', '영화/넷플릭스', '여행', '요리',
  '카페 탐방', '음악 감상', '게임', '등산', '사진/영상',
  '반려동물', '미술/전시', '와인/위스키', '캠핑', '자기개발',
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
  { value: 'same', label: '서로 같은 믿음을 가진 분과 함께하고 싶어요' },
  { value: 'no_religion', label: '무교인 분이 좋아요' },
  { value: 'any', label: '사랑만 있다면 상관없어요' },
];

export const DRINKING_PREFERENCE_OPTIONS = [
  { value: 'none', label: '안 마시는 분이 좋아요' },
  { value: 'moderate', label: '가끔 한 잔 정도 함께할 수 있는 분이면 좋겠어요' },
  { value: 'together', label: '시원한 맥주든 향긋한 와인이든, 함께 즐기고 싶어요' },
  { value: 'any', label: '상관없어요' },
];

export const SMOKING_PREFERENCE_OPTIONS = [
  { value: 'no', label: '비흡연자만' },
  { value: 'any', label: '상관없어요' },
];

export const MADAM_QUOTES = {
  welcome: '어서 오세요! 당신의 인연을 소중히 여기는 마담MJ예요.',
  step1_intro: '어서 오세요! 당신의 인연을 소중히 여기는 마담MJ예요. 편안한 마음으로 당신의 이야기를 하나씩 들려주실래요? 제가 예쁘게 기록해둘게요.',
  step1_personality: '당신만의 특별한 매력을 5가지 키워드로 뽐내볼까요?',
  step1_photo: '당신의 가장 빛나는 미소를 보여주세요!',
  step2_intro: '이제, 당신이 꿈꾸는 인연은 어떤 모습인지 들려주세요.',
  step2_priority: '상대방을 생각할 때, 당신의 마음이 가장 먼저 향하는 곳은 어디인가요?',
  complete: '마담MJ가 당신의 소개서를 정성스럽게 읽고, 가장 어울리는 인연을 찾아볼게요.',
  privacy: '당신의 소중한 정보와 사진은 마담MJ의 비밀 금고에 안전하게 보관됩니다. 얼굴이 함부로 공개되는 일은 절대 없으니 안심하세요!',
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
