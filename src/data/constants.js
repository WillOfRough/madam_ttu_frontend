/* Knots & Links — 상수 정의 */

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

export const SCHOOL_OPTIONS = [
  // 서울 주요 대학
  { value: '서울대학교', label: '서울대학교' },
  { value: '연세대학교', label: '연세대학교' },
  { value: '고려대학교', label: '고려대학교' },
  { value: '성균관대학교', label: '성균관대학교' },
  { value: '한양대학교', label: '한양대학교' },
  { value: '서강대학교', label: '서강대학교' },
  { value: '중앙대학교', label: '중앙대학교' },
  { value: '경희대학교', label: '경희대학교' },
  { value: '한국외국어대학교', label: '한국외국어대학교' },
  { value: '서울시립대학교', label: '서울시립대학교' },
  { value: '건국대학교', label: '건국대학교' },
  { value: '동국대학교', label: '동국대학교' },
  { value: '홍익대학교', label: '홍익대학교' },
  { value: '국민대학교', label: '국민대학교' },
  { value: '숭실대학교', label: '숭실대학교' },
  { value: '세종대학교', label: '세종대학교' },
  { value: '광운대학교', label: '광운대학교' },
  { value: '명지대학교', label: '명지대학교' },
  { value: '상명대학교', label: '상명대학교' },
  // 여대
  { value: '이화여자대학교', label: '이화여자대학교' },
  { value: '숙명여자대학교', label: '숙명여자대학교' },
  { value: '덕성여자대학교', label: '덕성여자대학교' },
  { value: '서울여자대학교', label: '서울여자대학교' },
  // 과학기술 특성화
  { value: 'KAIST', label: 'KAIST' },
  { value: 'POSTECH', label: 'POSTECH' },
  { value: 'GIST', label: 'GIST' },
  { value: 'UNIST', label: 'UNIST' },
  { value: '한국과학기술원', label: '한국과학기술원' },
  // 수도권
  { value: '인하대학교', label: '인하대학교' },
  { value: '아주대학교', label: '아주대학교' },
  { value: '가천대학교', label: '가천대학교' },
  { value: '단국대학교', label: '단국대학교' },
  { value: '경기대학교', label: '경기대학교' },
  { value: '한국항공대학교', label: '한국항공대학교' },
  { value: '한국산업기술대학교', label: '한국산업기술대학교' },
  // 지방 거점 국립대
  { value: '부산대학교', label: '부산대학교' },
  { value: '경북대학교', label: '경북대학교' },
  { value: '전남대학교', label: '전남대학교' },
  { value: '전북대학교', label: '전북대학교' },
  { value: '충남대학교', label: '충남대학교' },
  { value: '충북대학교', label: '충북대학교' },
  { value: '강원대학교', label: '강원대학교' },
  { value: '제주대학교', label: '제주대학교' },
  // 기타 주요 사립대
  { value: '한림대학교', label: '한림대학교' },
  { value: '울산대학교', label: '울산대학교' },
  { value: '동아대학교', label: '동아대학교' },
  { value: '영남대학교', label: '영남대학교' },
  { value: '계명대학교', label: '계명대학교' },
  { value: '조선대학교', label: '조선대학교' },
  { value: '원광대학교', label: '원광대학교' },
  // 직접 입력
  { value: '__other__', label: '기타 (직접 입력)' },
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
  '유머감각', '솔직함', '다정함', '자기관리', '활동적인',
  '차분한', '리더십', '배려심', '긍정적인', '취미공유',
  '독립적인', '야망있는', '나와 종교가 같은', '감성적인', '지적인',
];
