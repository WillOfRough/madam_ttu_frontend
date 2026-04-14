/**
 * DEV 모드 전용 목 데이터
 */

const MANAGER_ID = '00000000-0000-0000-0000-000000000001';
const ADMIN_ID = 'admin001';

// ── 계정 정보 ─────────────────────────────────────────
const accounts = {
  'sungjoong.kim@hancom.com': {
    id: MANAGER_ID,
    email: 'sungjoong.kim@hancom.com',
    password: 'hancom123',
    name: '김성중',
    nickname: '',
    phone: '010-1234-5678',
    role: 'manager',
    bankName: 'KB국민은행',
    bankNumber: '123-456-789012',
  },
  'admin@admin.com': {
    id: ADMIN_ID,
    email: 'admin@admin.com',
    password: 'hancom123',
    name: '관리자',
    nickname: '',
    phone: '010-0000-0000',
    role: 'admin',
  },
  'minting118@naver.com': {
    id: 'minting001',
    email: 'minting118@naver.com',
    password: 'hancom123',
    name: '정산관리자',
    nickname: '',
    phone: '010-9999-9999',
    role: 'admin',
  },
};

// 현재 로그인한 사용자 추적
let currentUser = accounts[sessionStorage.getItem('mock_user_email') || 'sungjoong.kim@hancom.com'];
let isLoggedIn = sessionStorage.getItem('mock_logged_in') === 'true';

function randomToken(len = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ── Inquiries ──────────────────────────────────────────
const inquiries = [];

// ── Clients ────────────────────────────────────────────
const clients = [
  {
    id: 's001',
    name: '김서연',
    nickname: '반짝이는 서연',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c001', 'ef1b2c3d-1234-5678-9abc-def012345001'],
    gender: 'female',
    birthDate: '1995-03-12',
    phone: '010-9876-5432',

    location: '서울 강남구',
    workLocation: '서울 용산구',
    height: 165,
    occupation: '브랜드 마케터',
    company: '아모레퍼시픽',
    education: '이화여자대학교 경영학과',
    religion: '무교',
    mbti: 'ENFP',
    hobbies: '필라테스, 와인 테이스팅, 전시회 관람',
    introduction:
      '안녕하세요! 마케팅 일을 하고 있는 서연입니다. 새로운 사람 만나는 걸 좋아하고, 주말에는 전시회나 팝업스토어를 자주 가요. 대화할 때 서로의 생각을 편하게 나눌 수 있는 관계를 원해요.',
    idealType:
      '유머감각이 있고, 자기 일에 열정적인 분이면 좋겠어요. 같이 맛집 투어 다니면서 소소한 일상을 즐길 수 있는 사람이 좋아요.',
    approvalStatus: 'approved',
    status: 'active',
    managerNote: '밝고 활발한 성격. 대화 능력 좋음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-28T09:00:00Z',
    inviteToken: { id: 'inv001', label: '김서연 지인 소개용' },
  },
  {
    id: 's002',
    name: '이준혁',
    nickname: null,
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c002'],
    gender: 'male',
    birthDate: '1993-07-22',
    phone: '010-1234-5678',

    location: '서울 서초구',
    workLocation: '경기 성남시 분당구',
    height: 180,
    occupation: '소프트웨어 엔지니어',
    company: '네이버',
    education: '서울대학교 컴퓨터공학과',
    religion: '무교',
    mbti: 'INTJ',
    hobbies: '클라이밍, 독서, 커피 내리기',
    introduction:
      '개발자로 일하면서도 야외활동을 즐기는 편입니다. 주말에는 클라이밍장이나 한강에서 시간을 보내요. 깊은 대화를 좋아하고 진정성 있는 만남을 찾고 있습니다.',
    idealType:
      '서로의 공간을 존중하면서도 함께하는 시간을 소중히 여기는 분. 지적 호기심이 많고 자기만의 세계가 있는 분이면 좋겠습니다.',
    approvalStatus: 'approved',
    status: 'active',
    managerNote: '차분하고 진중한 인상. 연봉 높음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-25T14:30:00Z',
    inviteToken: { id: 'inv002', label: '3월 신규 모집' },
  },
  {
    id: 's003',
    name: '박지민',
    nickname: '카페 탐험가',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c003', 'ef1b2c3d-1234-5678-9abc-def012345003', 'ab2d3e4f-5678-9abc-def0-123456789003'],
    gender: 'female',
    birthDate: '1996-11-05',
    phone: '010-5555-1234',

    location: '서울 마포구',
    workLocation: '서울 강남구',
    height: 162,
    occupation: 'UX 디자이너',
    company: '토스',
    education: '홍익대학교 시각디자인학과',
    religion: '기독교',
    mbti: 'INFP',
    hobbies: '수채화, 카페 탐방, 고양이',
    introduction:
      '디자이너로 일하고 있는 지민입니다. 조용한 카페에서 그림 그리는 걸 좋아하고, 고양이 두 마리와 함께 살고 있어요. 감성적이지만 현실적인 사람이에요.',
    idealType:
      '따뜻하고 배려심이 있는 분. 동물을 좋아하시는 분이면 더 좋겠어요. 주말에 같이 카페 투어 다닐 수 있는 분!',
    approvalStatus: 'pending',
    managerNote: '',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-03-05T11:20:00Z',
    inviteToken: { id: 'inv002', label: '3월 신규 모집' },
  },
  {
    id: 's004',
    name: '최민수',
    nickname: null,
    photoIds: [],
    gender: 'male',
    birthDate: '1992-01-30',
    phone: '010-7777-8888',

    location: '서울 용산구',
    workLocation: '서울 서초구',
    height: 178,
    occupation: '변호사',
    company: '김앤장 법률사무소',
    education: '고려대학교 법학과',
    religion: '불교',
    mbti: 'ESTJ',
    hobbies: '골프, 와인, 여행',
    introduction:
      '법률사무소에서 기업자문 업무를 하고 있습니다. 바쁜 일상 속에서도 의미 있는 만남을 위해 시간을 내려고 합니다. 진지하게 미래를 함께할 분을 찾고 있어요.',
    idealType:
      '밝고 긍정적인 에너지를 가진 분. 서로 다른 분야에서 일하더라도 존중하고 응원할 수 있는 관계를 원합니다.',
    approvalStatus: 'pending',
    managerNote: '',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-03-04T16:45:00Z',
    inviteToken: { id: 'inv002', label: '3월 신규 모집' },
  },
  {
    id: 's005',
    name: '한소희',
    nickname: '제주도 소희',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c005', 'ef1b2c3d-1234-5678-9abc-def012345005'],
    gender: 'female',
    birthDate: '1994-08-18',
    phone: '010-3333-4444',

    location: '서울 성동구',
    workLocation: '서울 성동구',
    height: 170,
    occupation: '프리랜서 포토그래퍼',
    company: '',
    education: '중앙대학교 사진학과',
    religion: '무교',
    mbti: 'ISTP',
    hobbies: '사진, 서핑, 요리',
    introduction:
      '프리랜서 포토그래퍼로 일하고 있어요. 자유로운 일정 덕분에 여행도 많이 다니고, 제주도에서 한 달 살기도 해봤어요. 독립적이지만 함께일 때 더 빛나는 사람입니다.',
    idealType:
      '모험적이고 새로운 경험을 두려워하지 않는 분. 같이 여행 다니면서 추억을 쌓고 싶어요.',
    approvalStatus: 'approved',
    managerNote: '자유로운 영혼. 비주얼 좋음.',
    ownerManagerId: 'm002',
    createdAt: '2026-02-20T08:15:00Z',
    inviteToken: { id: 'inv004', label: '' },
  },
  {
    id: 's006',
    name: '정우진',
    nickname: null,
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c006'],
    gender: 'male',
    birthDate: '1991-04-09',
    phone: '010-2222-9999',

    location: '서울 강남구',
    workLocation: '서울 강남구 일원동',
    height: 183,
    occupation: '외과 전문의',
    company: '삼성서울병원',
    education: '연세대학교 의과대학',
    religion: '가톨릭',
    mbti: 'ENFJ',
    hobbies: '테니스, 와인, 클래식 음악',
    introduction:
      '외과 전문의로 일하고 있습니다. 바쁜 일정이지만 사람을 만나는 시간만큼은 소중히 여기는 편이에요. 따뜻하고 성실한 만남을 원합니다.',
    idealType:
      '이해심이 많고 서로의 시간을 존중할 수 있는 분. 건강한 라이프스타일을 즐기는 분이면 좋겠습니다.',
    approvalStatus: 'approved',
    managerNote: '스펙 최상급. 매너 좋음.',
    ownerManagerId: 'm002',
    createdAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 's007',
    name: '윤예은',
    nickname: '크로스핏 예은',
    photoIds: [],
    gender: 'female',
    birthDate: '1997-06-25',
    phone: '010-8888-1111',

    location: '서울 송파구',
    workLocation: '서울 서초구',
    height: 168,
    occupation: '금융 애널리스트',
    company: '삼성증권',
    education: '서강대학교 경제학과',
    religion: '무교',
    mbti: 'ENTJ',
    hobbies: '크로스핏, 주식투자, 넷플릭스',
    introduction:
      '금융업계에서 일하면서 자기계발에도 열심인 예은입니다. 운동을 좋아하고, 주말에는 크로스핏이나 러닝을 자주 해요. 목표가 분명한 사람을 좋아합니다.',
    idealType:
      '자기 일에 열정적이고, 함께 성장할 수 있는 분이면 좋겠어요. 운동이나 건강한 취미를 공유할 수 있는 분이면 더 좋겠습니다.',
    approvalStatus: 'pending',
    managerNote: '',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-03-06T13:00:00Z',
  },
  {
    id: 's008',
    name: '강도윤',
    nickname: null,
    photoIds: [],
    gender: 'male',
    birthDate: '1993-12-03',
    phone: '010-6666-5555',

    location: '서울 영등포구',
    workLocation: '서울 마포구 상암동',
    height: 176,
    occupation: 'PD',
    company: 'CJ ENM',
    education: '한양대학교 신문방송학과',
    religion: '무교',
    mbti: 'ESFP',
    hobbies: '음악 프로듀싱, 맛집 탐방, 농구',
    introduction:
      '방송 PD로 일하면서 다양한 사람들을 만나고 있지만, 진짜 나를 알아주는 사람은 아직 못 만난 것 같아요. 유쾌하고 에너지 넘치는 성격입니다.',
    idealType:
      '같이 있으면 편하고 웃음이 끊이지 않는 분. 서로의 직업을 이해해주면서 응원할 수 있는 관계를 꿈꿔요.',
    approvalStatus: 'rejected',
    managerNote: '프로필 사진 부적절. 재신청 요청.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-15T17:30:00Z',
  },
  {
    id: 's009',
    name: '임수아',
    nickname: '베이킹 수아',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c009', 'ef1b2c3d-1234-5678-9abc-def012345009', 'ab2d3e4f-5678-9abc-def0-123456789009', 'ff3c38a7-8465-4a6a-81a3-73c917990009'],
    gender: 'female',
    birthDate: '1995-09-14',
    phone: '010-4444-7777',

    location: '서울 중구',
    workLocation: '서울 중구',
    height: 163,
    occupation: '호텔리어',
    company: '조선팰리스',
    education: '경희대학교 호텔경영학과',
    religion: '무교',
    mbti: 'ISFJ',
    hobbies: '베이킹, 플라워 클래스, 독서',
    introduction:
      '호텔에서 일하면서 서비스 마인드가 몸에 밴 것 같아요. 사람을 챙기는 걸 좋아하고, 주말에는 빵을 만들어서 주변에 나눠주는 게 취미예요.',
    idealType:
      '진실되고 성실한 분. 화려하지 않아도 일상이 따뜻한 관계를 만들어갈 수 있는 분이면 좋겠습니다.',
    approvalStatus: 'approved',
    managerNote: '성격 정말 좋음. 적극 추천.',
    ownerManagerId: 'm003',
    createdAt: '2026-02-22T09:45:00Z',
  },
  {
    id: 's010',
    name: '오태양',
    nickname: 'AI 태양',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c010', 'ef1b2c3d-1234-5678-9abc-def012345010', 'ab2d3e4f-5678-9abc-def0-123456789010'],
    gender: 'male',
    birthDate: '1990-02-28',
    phone: '010-1111-2222',

    location: '서울 강남구',
    workLocation: '서울 강남구 역삼동',
    height: 185,
    occupation: '스타트업 대표',
    company: '(주)브릿지랩',
    education: 'KAIST 경영공학과',
    religion: '무교',
    mbti: 'ENTP',
    hobbies: '서핑, 스쿠버다이빙, 독서',
    introduction:
      'AI 스타트업을 운영하고 있는 태양입니다. 일할 땐 진지하지만, 놀 때는 화끈하게 노는 스타일이에요. 도전적인 삶을 살면서도 편안한 안식처가 되어줄 사람을 찾고 있습니다.',
    idealType:
      '지적 대화가 통하고, 서로의 꿈을 응원할 수 있는 파트너. 같이 여행 가서 새로운 경험을 즐길 수 있는 분이면 좋겠어요.',
    approvalStatus: 'approved',
    managerNote: 'VIP. 스펙/외모/성격 모두 우수.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-10T15:00:00Z',
  },
  {
    id: 's011',
    name: '송하은',
    nickname: '요가하는 하은',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c011', 'ef1b2c3d-1234-5678-9abc-def012345011'],
    gender: 'female',
    birthDate: '1994-05-20',
    phone: '010-3333-1111',
    location: '서울 강남구',
    workLocation: '경기 성남시 판교',
    height: 167,
    occupation: '마케팅 팀장',
    company: '카카오',
    education: '연세대학교 경영학과',
    religion: '무교',
    mbti: 'ENFJ',
    hobbies: '요가, 독서, 브런치 카페',
    introduction: '카카오에서 마케팅 팀장으로 일하고 있어요. 바쁜 하루 끝에 요가로 마음을 정리하는 걸 좋아합니다.',
    idealType: '함께 성장하면서 서로를 응원할 수 있는 분. 대화가 잘 통하는 게 제일 중요해요.',
    approvalStatus: 'approved',
    managerNote: '커리어 우먼. 매너 좋음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-08T11:00:00Z',
  },
  {
    id: 's012',
    name: '배진우',
    nickname: null,
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c012'],
    gender: 'male',
    birthDate: '1991-11-15',
    phone: '010-7777-2222',
    location: '서울 서초구',
    workLocation: '서울 영등포구 여의도',
    height: 181,
    occupation: '투자심사역',
    company: 'KB인베스트먼트',
    education: '고려대학교 경영학과',
    religion: '무교',
    mbti: 'ISTJ',
    hobbies: '골프, 와인, 재즈',
    introduction: 'VC에서 투자심사역으로 일하고 있습니다. 안정적이면서도 도전적인 삶을 추구해요.',
    idealType: '밝고 긍정적인 분. 서로 다른 일상을 공유하면서 함께 쉴 수 있는 사람이면 좋겠습니다.',
    approvalStatus: 'approved',
    managerNote: '금융맨. 안정적이고 매너 좋음.',
    ownerManagerId: 'm002',
    createdAt: '2026-02-05T09:30:00Z',
  },
  {
    id: 's013',
    name: '장예린',
    nickname: '플루트 예린',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c013', 'ef1b2c3d-1234-5678-9abc-def012345013'],
    gender: 'female',
    birthDate: '1996-03-08',
    phone: '010-5555-9999',
    location: '서울 마포구',
    workLocation: '서울 서초구',
    height: 164,
    occupation: '오케스트라 단원',
    company: '서울시립교향악단',
    education: '서울대학교 음악대학',
    religion: '기독교',
    mbti: 'INFJ',
    hobbies: '플루트, 산책, 요리',
    introduction: '오케스트라에서 플루트를 연주하고 있어요. 음악만큼이나 일상의 소소한 행복을 중요하게 생각합니다.',
    idealType: '차분하고 따뜻한 분. 예술에 관심이 없어도 서로의 세계를 존중할 수 있는 분이면 좋겠어요.',
    approvalStatus: 'approved',
    managerNote: '감성적이고 진중한 분위기.',
    ownerManagerId: 'm003',
    createdAt: '2026-02-12T14:00:00Z',
  },
  {
    id: 's014',
    name: '권도현',
    nickname: '서핑보이',
    photoIds: ['cd3c38a7-8465-4a6a-81a3-73c91799c014', 'ef1b2c3d-1234-5678-9abc-def012345014', 'ab2d3e4f-5678-9abc-def0-123456789014'],
    gender: 'male',
    birthDate: '1992-08-25',
    phone: '010-2222-8888',
    location: '서울 용산구',
    workLocation: '서울 강남구',
    height: 179,
    occupation: '건축가',
    company: '삼우종합건축사사무소',
    education: '한양대학교 건축학과',
    religion: '무교',
    mbti: 'ISFP',
    hobbies: '서핑, 사진, 건축 여행',
    introduction: '건축가로 일하면서 공간이 주는 감동에 매일 설레요. 주말엔 양양에서 서핑을 즐깁니다.',
    idealType: '자기만의 취미가 있고, 서로 독립적이면서도 함께하는 시간을 소중히 여기는 분.',
    approvalStatus: 'approved',
    managerNote: '감각적이고 매력적. 비주얼 좋음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-15T10:00:00Z',
  },
];

// ── Connections (연결된 매니저) ─────────────────────────
const connections = [
  {
    id: 'c001',
    managerId: 'm002',
    name: '박소영',
    email: 'soyoung@knotsandlinks.kr',
    clientCount: 7,
    connectedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'c002',
    managerId: 'm003',
    name: '이현우',
    email: 'hyunwoo@knotsandlinks.kr',
    clientCount: 4,
    connectedAt: '2026-02-01T14:00:00Z',
  },
];

// ── Invites (Client 초대 링크) ─────────────────────────
const invites = [
  {
    id: 'inv001',
    token: 'AbC123xYz001',
    label: '김서연 지인 소개용',
    status: 'active',
    useCount: 1,
    createdAt: '2026-02-27T09:00:00Z',
    expiresAt: '2026-02-28T09:00:00Z',
    registeredClients: [
      { id: 's001', name: '김서연', gender: 'female', approvalStatus: 'approved', createdAt: '2026-02-27T11:00:00Z' },
    ],
  },
  {
    id: 'inv002',
    token: 'KpR482mNv002',
    label: '3월 신규 모집',
    status: 'active',
    useCount: 3,
    createdAt: '2026-03-05T10:00:00Z',
    expiresAt: '2026-03-12T10:00:00Z',
    registeredClients: [
      { id: 's002', name: '이준혁', gender: 'male', approvalStatus: 'approved', createdAt: '2026-03-05T12:00:00Z' },
      { id: 's003', name: '박지민', gender: 'female', approvalStatus: 'approved', createdAt: '2026-03-06T10:00:00Z' },
      { id: 's004', name: '최민수', gender: 'male', approvalStatus: 'pending', createdAt: '2026-03-07T09:00:00Z' },
    ],
  },
  {
    id: 'inv003',
    token: 'Wq7jTn3sL003',
    label: '회사 동료 추천',
    status: 'active',
    useCount: 0,
    createdAt: '2026-03-06T08:00:00Z',
    expiresAt: '2026-03-07T08:00:00Z',
    registeredClients: [],
  },
  {
    id: 'inv004',
    token: 'Hy9fBk2pD004',
    label: '',
    status: 'expired',
    useCount: 2,
    createdAt: '2026-02-01T12:00:00Z',
    expiresAt: '2026-02-02T12:00:00Z',
    registeredClients: [
      { id: 's005', name: '한소희', gender: 'female', approvalStatus: 'approved', createdAt: '2026-02-01T14:00:00Z' },
      { id: 's006', name: '오태양', gender: 'male', approvalStatus: 'approved', createdAt: '2026-02-01T15:00:00Z' },
    ],
  },
  {
    id: 'inv005',
    token: 'Xm4cRt8wJ005',
    label: '테스트용',
    status: 'revoked',
    useCount: 0,
    createdAt: '2026-02-20T16:00:00Z',
    expiresAt: '2026-02-21T16:00:00Z',
    registeredClients: [],
  },
];

// ── Connection Requests ───────────────────────────────
const connectionRequests = [
  { id: 'req001', managerId: 'm004', managerName: '김태희', status: 'pending', message: '안녕하세요! 같이 매칭 풀 공유해요.', createdAt: '2026-03-07T10:00:00Z' },
  { id: 'req002', managerId: 'm005', managerName: '정재영', status: 'pending', message: '', createdAt: '2026-03-08T14:00:00Z' },
];

const sentRequests = [
  { id: 'req003', managerId: 'm006', managerName: '최유리', status: 'pending', message: '연결 요청합니다!', createdAt: '2026-03-06T09:00:00Z' },
];

const searchableManagers = [
  { id: 'admin001', name: '관리자', email: 'admin@admin.com' },
  { id: 'm004', name: '김태희', email: 'taehee@knotsandlinks.kr' },
  { id: 'm005', name: '정재영', email: 'jaeyoung@knotsandlinks.kr' },
  { id: 'm006', name: '최유리', email: 'yuri@knotsandlinks.kr' },
  { id: 'm007', name: '홍길동', email: 'gildong@knotsandlinks.kr' },
];

// ── Feedback 저장소 (proposal token → { rating, comment, feedbackAt }) ──
const feedbacks = {};

// ── Matches (순차 공개 프로세스) ────────────────────
// 가용시간 저장소 (proposal token → times with clientName)
const availableTimes = {};

const matches = [
  // 0) draft — 매칭 시작 전 (매니저만 확인 가능)
  {
    matchId: 'match000',
    type: '1:1 소개팅',
    status: 'draft',
    note: '신규 매칭 — 시작 전 검토 중',
    clientA: {
      clientId: 's003', clientName: '박지민', clientNickname: '지민', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'DraftTkAA1111',
    },
    clientB: {
      clientId: 's004', clientName: '최현우', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: null, respondedAt: null,
      proposalToken: 'DraftTkBB2222',
    },
    createdAt: '2026-04-14T09:00:00Z',
    createdByManagerId: MANAGER_ID,
    createdByManagerName: '김성중',
  },
  // 1) proposal_sent — B(receiver)만 프로필 조회 가능
  {
    matchId: 'match001',
    type: '1:1 소개팅',
    status: 'proposal_sent',
    note: '성격 잘 맞을 것 같아서 매칭합니다.',
    clientA: {
      clientId: 's001', clientName: '김서연', clientNickname: '반짝이는 서연', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk01aB3cD1',
    },
    clientB: {
      clientId: 's002', clientName: '이준혁', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: null, respondedAt: null,
      proposalToken: 'PrTk02eF4gH2',
    },
    createdAt: '2026-03-10T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 2) proposal_accepted — B수락, A(proposer) 확인 대기
  {
    matchId: 'match002',
    type: '1:1 소개팅',
    status: 'proposal_accepted',
    note: '둘 다 여행 취미 보유.',
    clientA: {
      clientId: 's005', clientName: '한소희', clientNickname: '제주도 소희', clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk03iJ5kL3',
    },
    clientB: {
      clientId: 's010', clientName: '오태양', clientNickname: 'AI 태양', clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-08T14:00:00Z',
      proposalToken: 'PrTk04mN6oP4',
    },
    createdAt: '2026-03-07T11:00:00Z',
    createdByManagerId: 'mgr002',
    createdByManagerName: '박소영',
  },
  // 3) arranging — 양쪽 수락, 양쪽 가용시간 등록 완료 → 매니저 확정 대기
  {
    matchId: 'match003',
    type: '1:1 소개팅',
    status: 'arranging',
    note: '운동 좋아하는 두 분.',
    clientA: {
      clientId: 's007', clientName: '윤예은', clientNickname: '크로스핏 예은', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-09T18:00:00Z',
      proposalToken: 'PrTk07yZ9aB7',
    },
    clientB: {
      clientId: 's006', clientName: '정우진', clientNickname: null, clientGender: 'male',
      managerName: '박소영', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-09T12:00:00Z',
      proposalToken: 'PrTk08cD0eF8',
    },
    createdAt: '2026-03-09T10:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 4) scheduled — 약속 확정됨
  {
    matchId: 'match004',
    type: '1:1 소개팅',
    status: 'scheduled',
    note: '감성적인 두 분을 매칭합니다.',
    clientA: {
      clientId: 's009', clientName: '임수아', clientNickname: '베이킹 수아', clientGender: 'female',
      managerName: '이현우', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-02T10:00:00Z',
      proposalToken: 'PrTk09gH1iJ9',
    },
    clientB: {
      clientId: 's008', clientName: '강도윤', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-02T14:00:00Z',
      proposalToken: 'PrTk10kL2mN0',
    },
    meetingDate: '2026-03-18T19:00:00Z',
    location: '청담동 르카페',
    locationLink: 'https://naver.me/5abc123',
    endTime: '21:00',
    confirmedAt: '2026-03-05T10:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
    createdByManagerId: 'mgr003',
    createdByManagerName: '이현우',
  },
  // 5-1) scheduling — 양쪽 수락, B가 아직 가용시간 미등록
  {
    matchId: 'match006',
    type: '1:1 소개팅',
    status: 'scheduling',
    note: '새로 매칭된 두 분. 일정 조율 시작.',
    clientA: {
      clientId: 's010', clientName: '오태양', clientNickname: 'AI 태양', clientGender: 'male',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-13T16:00:00Z',
      proposalToken: 'PrTk11aNewA6',
    },
    clientB: {
      clientId: 's001', clientName: '김서연', clientNickname: '반짝이는 서연', clientGender: 'female',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-13T12:00:00Z',
      proposalToken: 'PrTk12bNewB6',
    },
    createdAt: '2026-03-12T10:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 6) completed — 미팅 완료
  {
    matchId: 'match007',
    type: '1:1 소개팅',
    status: 'completed',
    note: '둘 다 카페 좋아하는 분들.',
    clientA: {
      clientId: 's011', clientName: '송하은', clientNickname: '요가하는 하은', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-02-20T10:00:00Z',
      proposalToken: 'PrTk13cMp7A1',
      afterResponse: 'pending', afterRespondedAt: null,
    },
    clientB: {
      clientId: 's012', clientName: '배진우', clientNickname: null, clientGender: 'male',
      managerName: '박소영', role: 'receiver',
      response: 'accepted', respondedAt: '2026-02-20T15:00:00Z',
      proposalToken: 'PrTk14dNq8B2',
      afterResponse: 'pending', afterRespondedAt: null,
    },
    meetingDate: '2026-03-01T18:00:00Z',
    location: '압구정 블루보틀',
    endTime: '20:00',
    confirmedAt: '2026-02-25T11:00:00Z',
    completedAt: '2026-03-02T10:00:00Z',
    createdAt: '2026-02-18T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
    afterStatus: 'pending',
  },
  // 7) proposal_sent — 또 다른 제안 발송 건
  {
    matchId: 'match008',
    type: '1:1 소개팅',
    status: 'proposal_sent',
    note: '예술 감각 있는 두 분 매칭.',
    clientA: {
      clientId: 's013', clientName: '장예린', clientNickname: '플루트 예린', clientGender: 'female',
      managerName: '이현우', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk15eOr9C3',
    },
    clientB: {
      clientId: 's014', clientName: '권도현', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: null, respondedAt: null,
      proposalToken: 'PrTk16fPs0D4',
    },
    createdAt: '2026-03-14T10:00:00Z',
    createdByManagerId: 'mgr003',
    createdByManagerName: '이현우',
  },
  // 8) scheduling — A만 가용시간 등록 완료, B 미등록
  {
    matchId: 'match009',
    type: '1:1 소개팅',
    status: 'scheduling',
    note: '크로스핏 + 건축 조합.',
    clientA: {
      clientId: 's007', clientName: '윤예은', clientNickname: '크로스핏 예은', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-12T11:00:00Z',
      proposalToken: 'PrTk17gQt1E5',
    },
    clientB: {
      clientId: 's014', clientName: '권도현', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-12T16:00:00Z',
      proposalToken: 'PrTk18hRu2F6',
    },
    createdAt: '2026-03-11T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 9) cancelled — 매니저에 의해 취소
  {
    matchId: 'match010',
    type: '1:1 소개팅',
    status: 'cancelled',
    note: '일정이 안 맞아서 취소.',
    cancelReason: '양측 일정 조율 실패',
    cancelledByName: '김성중',
    cancelledAt: '2026-03-08T16:00:00Z',
    clientA: {
      clientId: 's011', clientName: '송하은', clientNickname: '요가하는 하은', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-06T10:00:00Z',
      proposalToken: 'PrTk19iSv3G7',
    },
    clientB: {
      clientId: 's006', clientName: '정우진', clientNickname: null, clientGender: 'male',
      managerName: '박소영', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-06T14:00:00Z',
      proposalToken: 'PrTk20jTw4H8',
    },
    createdAt: '2026-03-05T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 10) completed + after rejected — 피드백 테스트용
  {
    matchId: 'match011',
    type: '1:1 소개팅',
    status: 'completed',
    note: '활동적인 두 분 매칭.',
    clientA: {
      clientId: 's005', clientName: '한소희', clientNickname: '제주도 소희', clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-01T10:00:00Z',
      proposalToken: 'PrTk21kLm5I9',
    },
    clientB: {
      clientId: 's002', clientName: '이준혁', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-01T15:00:00Z',
      proposalToken: 'PrTk22nOp6J0',
    },
    meetingDate: '2026-03-10T18:00:00Z',
    location: '이태원 클라우드',
    endTime: '20:00',
    confirmedAt: '2026-03-05T11:00:00Z',
    completedAt: '2026-03-11T10:00:00Z',
    createdAt: '2026-02-28T09:00:00Z',
    createdByManagerId: MANAGER_ID,
    createdByManagerName: '김성중',
    afterStatus: 'rejected',
    afterResponses: { A: 'rejected', B: 'accepted' },
    afterRespondedAts: { A: '2026-03-11T15:00:00Z', B: '2026-03-11T16:00:00Z' },
  },
  // 10-b) completed + after accepted — 양쪽 수락 (에프터 성사) 테스트용
  {
    matchId: 'match012',
    type: '1:1 소개팅',
    status: 'completed',
    note: '양쪽 모두 에프터 수락 테스트.',
    clientA: {
      clientId: 's001', clientName: '김수연', clientNickname: '반짝이는 서연', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-01T10:00:00Z',
      proposalToken: 'PrTkAfterOkA1',
      afterResponse: 'accepted', afterRespondedAt: '2026-03-12T10:00:00Z',
    },
    clientB: {
      clientId: 's004', clientName: '최민수', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-01T15:00:00Z',
      proposalToken: 'PrTkAfterOkB1',
      afterResponse: 'accepted', afterRespondedAt: '2026-03-12T11:00:00Z',
    },
    meetingDate: '2026-03-08T18:00:00Z',
    location: '강남 테라로사',
    endTime: '20:00',
    confirmedAt: '2026-03-04T11:00:00Z',
    completedAt: '2026-03-09T10:00:00Z',
    createdAt: '2026-02-25T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
    afterStatus: 'accepted',
    afterResponses: { A: 'accepted', B: 'accepted' },
    afterRespondedAts: { A: '2026-03-12T10:00:00Z', B: '2026-03-12T11:00:00Z' },
  },
  // 10-c) completed + after partial — A수락/B미응답 (대기 화면) 테스트용
  {
    matchId: 'match013',
    type: '1:1 소개팅',
    status: 'completed',
    note: 'A만 에프터 수락, B 미응답 테스트.',
    clientA: {
      clientId: 's003', clientName: '박지민', clientNickname: null, clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-02T10:00:00Z',
      proposalToken: 'PrTkWaitA1',
      afterResponse: 'accepted', afterRespondedAt: '2026-03-13T10:00:00Z',
    },
    clientB: {
      clientId: 's006', clientName: '강태현', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-02T15:00:00Z',
      proposalToken: 'PrTkWaitB1',
      afterResponse: 'pending', afterRespondedAt: null,
    },
    meetingDate: '2026-03-10T18:00:00Z',
    location: '홍대 카페',
    endTime: '20:00',
    confirmedAt: '2026-03-06T11:00:00Z',
    completedAt: '2026-03-11T10:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
    afterStatus: 'pending',
    afterResponses: { A: 'accepted', B: 'pending' },
    afterRespondedAts: { A: '2026-03-13T10:00:00Z' },
  },
  // 11) cancelled — B가 거절
  {
    matchId: 'match005',
    type: null,
    status: 'cancelled',
    note: '',
    cancelReason: 'B가 프로필 확인 후 거절',
    cancelledByName: '최민수',
    cancelledAt: '2026-03-06T12:00:00Z',
    clientA: {
      clientId: 's003', clientName: '박지민', clientNickname: null, clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk05qR7sT5',
    },
    clientB: {
      clientId: 's004', clientName: '최민수', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'rejected', respondedAt: '2026-03-06T12:00:00Z',
      proposalToken: 'PrTk06uV8wX6',
    },
    createdAt: '2026-03-05T15:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 12) 삭제된 회원이 포함된 매칭 (proposal_accepted)
  {
    matchId: 'match014',
    type: '1:1 소개팅',
    status: 'proposal_accepted',
    note: '삭제된 회원 테스트용 매칭',
    clientA: {
      clientId: null, clientName: '삭제된 회원', clientNickname: null, clientGender: null,
      managerName: null, role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-20T10:00:00Z',
      proposalToken: 'PrTkDeleted01',
      deleted: true,
    },
    clientB: {
      clientId: 's002', clientName: '이준혁', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-21T14:00:00Z',
      proposalToken: 'PrTkDeleted02',
      deleted: false,
    },
    createdAt: '2026-03-19T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  // 13) 삭제된 회원이 포함된 완료 매칭
  {
    matchId: 'match015',
    type: '1:1 소개팅',
    status: 'completed',
    note: '삭제된 B회원 완료 매칭 테스트',
    clientA: {
      clientId: 's005', clientName: '한소희', clientNickname: '제주도 소희', clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-10T10:00:00Z',
      proposalToken: 'PrTkDeleted03',
      deleted: false,
    },
    clientB: {
      clientId: null, clientName: '삭제된 회원', clientNickname: null, clientGender: null,
      managerName: null, role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-10T15:00:00Z',
      proposalToken: 'PrTkDeleted04',
      deleted: true,
    },
    meetingDate: '2026-03-15T18:00:00Z',
    location: '강남 카페',
    endTime: '20:00',
    confirmedAt: '2026-03-12T11:00:00Z',
    completedAt: '2026-03-16T10:00:00Z',
    createdAt: '2026-03-08T09:00:00Z',
    createdByManagerId: 'mgr002',
    createdByManagerName: '박소영',
    afterStatus: 'pending',
  },
  // ── 4월 정산 테스트 데이터 ──
  {
    matchId: 'match-apr01',
    type: '1:1 소개팅',
    status: 'scheduling',
    note: '4월 입금확인 완료 — 일정조율 대기',
    clientA: {
      clientId: 's001', clientName: '김서연', clientNickname: '반짝이는 서연', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-02T10:00:00Z',
      proposalToken: 'PrTkApr01A',
    },
    clientB: {
      clientId: 's002', clientName: '이준혁', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-04-02T14:00:00Z',
      proposalToken: 'PrTkApr01B',
    },
    createdAt: '2026-04-01T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  {
    matchId: 'match-apr02',
    type: '1:1 소개팅',
    status: 'arranging',
    note: '4월 조율확정 테스트',
    clientA: {
      clientId: 's005', clientName: '한소희', clientNickname: '제주도 소희', clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-03T10:00:00Z',
      proposalToken: 'PrTkApr02A',
    },
    clientB: {
      clientId: 's010', clientName: '오태양', clientNickname: 'AI 태양', clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-04-03T15:00:00Z',
      proposalToken: 'PrTkApr02B',
    },
    createdAt: '2026-04-03T09:00:00Z',
    createdByManagerId: 'mgr002',
    createdByManagerName: '박소영',
  },
  {
    matchId: 'match-apr03',
    type: '1:1 소개팅',
    status: 'scheduled',
    note: '4월 약속확정 테스트',
    clientA: {
      clientId: 's007', clientName: '윤예은', clientNickname: '별빛 예은', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-04T10:00:00Z',
      proposalToken: 'PrTkApr03A',
    },
    clientB: {
      clientId: 's008', clientName: '정우진', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-04-04T14:00:00Z',
      proposalToken: 'PrTkApr03B',
    },
    meetingDate: '2026-04-12T18:00:00Z',
    location: '청담동 르카페',
    locationLink: 'https://map.naver.com/example3',
    endTime: '20:00',
    confirmedAt: '2026-04-06T11:00:00Z',
    createdAt: '2026-04-04T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  {
    matchId: 'match-apr04',
    type: '1:1 소개팅',
    status: 'completed',
    note: '4월 완료 매칭 1',
    clientA: {
      clientId: 's009', clientName: '송하은', clientNickname: null, clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-28T10:00:00Z',
      proposalToken: 'PrTkApr04A',
    },
    clientB: {
      clientId: 's006', clientName: '배진우', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-28T14:00:00Z',
      proposalToken: 'PrTkApr04B',
    },
    meetingDate: '2026-04-05T18:00:00Z',
    location: '잠실 브런치카페',
    endTime: '20:00',
    confirmedAt: '2026-04-01T11:00:00Z',
    completedAt: '2026-04-05T21:00:00Z',
    createdAt: '2026-03-28T09:00:00Z',
    createdByManagerId: 'mgr002',
    createdByManagerName: '박소영',
    afterStatus: 'accepted',
  },
  {
    matchId: 'match-apr05',
    type: '1:1 소개팅',
    status: 'completed',
    note: '4월 완료 매칭 2',
    clientA: {
      clientId: 's001', clientName: '김서연', clientNickname: '반짝이는 서연', clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-30T10:00:00Z',
      proposalToken: 'PrTkApr05A',
    },
    clientB: {
      clientId: 's010', clientName: '오태양', clientNickname: 'AI 태양', clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-30T14:00:00Z',
      proposalToken: 'PrTkApr05B',
    },
    meetingDate: '2026-04-07T19:00:00Z',
    location: '강남 이탈리안 레스토랑',
    endTime: '21:00',
    confirmedAt: '2026-04-03T11:00:00Z',
    completedAt: '2026-04-07T22:00:00Z',
    createdAt: '2026-03-30T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
    afterStatus: 'pending',
  },
  {
    matchId: 'match-apr06',
    type: '1:1 소개팅',
    status: 'scheduling',
    note: '4월 일정조율 2',
    clientA: {
      clientId: 's003', clientName: '박지민', clientNickname: null, clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-06T10:00:00Z',
      proposalToken: 'PrTkApr06A',
    },
    clientB: {
      clientId: 's004', clientName: '최민수', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-04-06T14:00:00Z',
      proposalToken: 'PrTkApr06B',
    },
    createdAt: '2026-04-06T09:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
  {
    matchId: 'match-apr07',
    type: '1:1 소개팅',
    status: 'scheduled',
    note: '4월 약속확정 2',
    clientA: {
      clientId: 's005', clientName: '한소희', clientNickname: '제주도 소희', clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-01T10:00:00Z',
      proposalToken: 'PrTkApr07A',
    },
    clientB: {
      clientId: 's008', clientName: '정우진', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-04-01T14:00:00Z',
      proposalToken: 'PrTkApr07B',
    },
    meetingDate: '2026-04-15T19:00:00Z',
    location: '홍대 와인바',
    locationLink: 'https://map.naver.com/example7',
    endTime: '21:00',
    confirmedAt: '2026-04-07T11:00:00Z',
    createdAt: '2026-04-01T09:00:00Z',
    createdByManagerId: 'mgr002',
    createdByManagerName: '박소영',
  },
  {
    matchId: 'match-apr08',
    type: '1:1 소개팅',
    status: 'cancelled',
    note: '4월 취소 매칭',
    cancelReason: '일정 맞지 않아 취소',
    cancelledByName: '김성중',
    cancelledAt: '2026-04-04T16:00:00Z',
    clientA: {
      clientId: 's009', clientName: '송하은', clientNickname: null, clientGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-02T10:00:00Z',
      proposalToken: 'PrTkApr08A',
    },
    clientB: {
      clientId: 's002', clientName: '이준혁', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'accepted', respondedAt: '2026-04-02T14:00:00Z',
      proposalToken: 'PrTkApr08B',
    },
    meetingDate: '2026-04-20T18:00:00Z',
    createdAt: '2026-04-02T09:00:00Z',
    createdByManagerId: 'mgr002',
    createdByManagerName: '박소영',
  },
  {
    matchId: 'match-apr09',
    type: '1:1 소개팅',
    status: 'cancelled',
    note: '4월 취소 매칭 2 - 환불 불가',
    cancelReason: '개인 사정으로 취소',
    cancelledByName: '최민수',
    cancelledAt: '2026-04-06T12:00:00Z',
    clientA: {
      clientId: 's003', clientName: '박지민', clientNickname: null, clientGender: 'female',
      managerName: '김성중', role: 'proposer',
      response: 'accepted', respondedAt: '2026-04-01T10:00:00Z',
      proposalToken: 'PrTkApr09A',
    },
    clientB: {
      clientId: 's004', clientName: '최민수', clientNickname: null, clientGender: 'male',
      managerName: '김성중', role: 'receiver',
      response: 'rejected', respondedAt: '2026-04-06T12:00:00Z',
      proposalToken: 'PrTkApr09B',
    },
    meetingDate: '2026-04-08T18:00:00Z',
    createdAt: '2026-04-01T15:00:00Z',
    createdByManagerId: 'mgr001',
    createdByManagerName: '김성중',
  },
];

// match003: 양쪽 가용시간 등록 완료 (arranging 상태)
availableTimes['PrTk07yZ9aB7'] = [
  { timeId: 'time-a01', date: '2026-03-20', startTime: '14:00:00', clientName: '윤예은', selected: false },
  { timeId: 'time-a02', date: '2026-03-21', startTime: '12:00:00', clientName: '윤예은', selected: false },
  { timeId: 'time-a03', date: '2026-03-22', startTime: '14:00:00', clientName: '윤예은', selected: false },
];
availableTimes['PrTk08cD0eF8'] = [
  { timeId: 'time-b01', date: '2026-03-20', startTime: '14:00:00', clientName: '정우진', selected: false },
  { timeId: 'time-b02', date: '2026-03-20', startTime: '18:00:00', clientName: '정우진', selected: false },
  { timeId: 'time-b03', date: '2026-03-21', startTime: '19:00:00', clientName: '정우진', selected: false },
  { timeId: 'time-b04', date: '2026-03-22', startTime: '14:00:00', clientName: '정우진', selected: false },
];

// match009: A만 가용시간 등록 완료 (scheduling 상태 — B 미등록)
availableTimes['PrTk17gQt1E5'] = [
  { timeId: 'time-c01', date: '2026-03-22', startTime: '14:00:00', clientName: '윤예은', selected: false },
  { timeId: 'time-c02', date: '2026-03-22', startTime: '18:00:00', clientName: '윤예은', selected: false },
  { timeId: 'time-c03', date: '2026-03-23', startTime: '13:00:00', clientName: '윤예은', selected: false },
];

// match011: A쪽 피드백 작성 완료
feedbacks['PrTk21kLm5I9'] = { rating: 6, comment: '대화는 좋았지만 취미가 너무 달랐어요.', feedbackAt: '2026-03-12T10:00:00Z' };

// match007: completed — 양쪽 가용시간 + 선택 완료
availableTimes['PrTk13cMp7A1'] = [
  { timeId: 'time-d01', date: '2026-03-01', startTime: '18:00:00', clientName: '송하은', selected: true },
  { timeId: 'time-d02', date: '2026-03-02', startTime: '14:00:00', clientName: '송하은', selected: false },
];
availableTimes['PrTk14dNq8B2'] = [
  { timeId: 'time-e01', date: '2026-03-01', startTime: '18:00:00', clientName: '배진우', selected: false },
  { timeId: 'time-e02', date: '2026-03-01', startTime: '19:00:00', clientName: '배진우', selected: false },
];

// Build proposal lookup from matches
function getProposalByToken(token) {
  for (const m of matches) {
    if (m.clientA.proposalToken === token) {
      const cp = clients.find((c) => c.id === m.clientB.clientId);
      return { match: m, side: 'A', participant: m.clientA, counterpart: cp };
    }
    if (m.clientB.proposalToken === token) {
      const cp = clients.find((c) => c.id === m.clientA.clientId);
      return { match: m, side: 'B', participant: m.clientB, counterpart: cp };
    }
  }
  return null;
}

// ── Manager lookup map ────────────────────────────────
const managerMap = {
  [MANAGER_ID]: { id: MANAGER_ID, name: '김성중', email: 'sungjoong.kim@hancom.com' },
  'm002': { id: 'm002', name: '박소영', email: 'soyoung@knotsandlinks.kr' },
  'm003': { id: 'm003', name: '이현우', email: 'hyunwoo@knotsandlinks.kr' },
  'admin001': { id: 'admin001', name: '관리자', email: 'admin@admin.com' },
};

function enrichClient(c) {
  const owner = managerMap[c.ownerManagerId] || { id: c.ownerManagerId, name: '알 수 없음' };
  const birthYear = c.birthDate ? new Date(c.birthDate).getFullYear() : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;
  const activeStatuses = ['proposal_sent', 'proposal_accepted', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled'];
  const activeMatchCount = matches.filter((m) =>
    activeStatuses.includes(m.status) &&
    (m.clientA.clientId === c.id || m.clientB.clientId === c.id)
  ).length;
  const invite = c.inviteToken ? invites.find((inv) => inv.id === c.inviteToken.id) : null;
  return {
    nickname: c.nickname || null,
    age,
    status: c.status || 'active',
    activeMatchCount,
    photoUrls: (c.photoIds || []).map((id) => `/api/v1/clients/photos/${id}`),
    ownerManager: owner,
    isOwner: c.ownerManagerId === currentUser.id,
    inviteToken: c.inviteToken ? { ...c.inviteToken, token: invite?.token || null } : null,
  };
}

function enrichParticipant(participant) {
  const client = clients.find((c) => c.id === participant.clientId);
  if (!client) return participant;
  const birthYear = client.birthDate ? new Date(client.birthDate).getFullYear() : null;
  const age = birthYear ? new Date().getFullYear() - birthYear : null;
  return {
    ...participant,
    clientAge: age,
    clientHeight: client.height,
    clientOccupation: client.occupation,
    clientCompany: client.company,
    clientEducation: client.education,
    clientLocation: client.location,
    clientReligion: client.religion,
    clientMbti: client.mbti,
    clientHobbies: client.hobbies,
    clientIntroduction: client.introduction,
    clientIdealType: client.idealType,
    clientWorkLocation: client.workLocation || null,
    clientPhotoUrls: (client.photoIds || []).map((id) => `/api/v1/clients/photos/${id}`),
  };
}

// ── Dashboard Summary (동적 계산) ──────────────────────
function getDashboardSummary() {
  const myMatches = matches.filter(m => m.createdByManagerName === currentUser.name);
  return {
    myClientCount: clients.filter((c) => c.ownerManagerId === currentUser.id).length,
    pendingCount: clients.filter((c) => c.approvalStatus === 'pending').length,
    connectedManagerCount: connections.length,
    activeInviteCount: invites.filter((i) => i.status === 'active').length,
    recentPendingClients: clients
      .filter((c) => c.approvalStatus === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((c) => ({ ...c, ...enrichClient(c) })),
    // Match statistics (자신의 매칭만)
    totalMatches: myMatches.length,
    activeMatches: myMatches.filter(m => !['completed', 'cancelled'].includes(m.status)).length,
    completedMatches: myMatches.filter(m => m.status === 'completed').length,
    cancelledMatches: myMatches.filter(m => m.status === 'cancelled').length,
    afterSuccessCount: myMatches.filter(m => m.status === 'completed' && m.afterResponses?.A === 'accepted' && m.afterResponses?.B === 'accepted').length,
  };
}

// managerInfo는 currentUser를 참조하도록 getter로 접근
function getManagerInfo() {
  return { id: currentUser.id, name: currentUser.name, email: currentUser.email, nickname: currentUser.nickname || '', phone: currentUser.phone || '' };
}

// ── Route Matcher ──────────────────────────────────────

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}

// Helper: find match that contains a given proposal token
function findMatchByProposalToken(token) {
  for (const m of matches) {
    if (m.clientA.proposalToken === token) return { match: m, side: 'A' };
    if (m.clientB.proposalToken === token) return { match: m, side: 'B' };
  }
  return null;
}

// Helper: get receiver's proposal token for a match
function getReceiverToken(m) {
  return m.clientA.role === 'receiver' ? m.clientA.proposalToken : m.clientB.proposalToken;
}

export async function mockFetch(path, options = {}) {
  await delay(150 + Math.random() * 200);

  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const params = url.searchParams;

  // POST /api/v1/verification/send (인증번호 발송 — mock)
  if (method === 'POST' && pathname === '/api/v1/verification/send') {
    const body = options.body || {};
    if (!body.phone) throw Object.assign(new Error('전화번호를 입력해주세요.'), { status: 400 });
    return { success: true, message: '인증번호가 발송되었습니다.' };
  }

  // POST /api/v1/verification/verify (인증번호 확인 — mock: 아무 6자리 수락)
  if (method === 'POST' && pathname === '/api/v1/verification/verify') {
    const body = options.body || {};
    if (!body.phone || !body.code) throw Object.assign(new Error('전화번호와 인증번호를 입력해주세요.'), { status: 400 });
    if (body.code.length !== 6) throw Object.assign(new Error('인증번호가 일치하지 않습니다.'), { status: 400 });
    return { verificationId: crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}-${Math.random().toString(36).slice(2)}` };
  }

  // POST /api/v1/auth/login
  if (method === 'POST' && pathname === '/api/v1/auth/login') {
    const body = options.body || {};
    const account = accounts[body.email];
    if (!account || account.password !== body.password) {
      throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { status: 401 });
    }
    currentUser = account;
    isLoggedIn = true; sessionStorage.setItem('mock_logged_in', 'true'); sessionStorage.setItem('mock_user_email', body.email);
    return { manager: { id: account.id, email: account.email, name: account.name, role: account.role } };
  }

  // GET /api/v1/auth/me
  if (method === 'GET' && pathname === '/api/v1/auth/me') {
    if (!isLoggedIn) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    return {
      id: currentUser.id, email: currentUser.email, name: currentUser.name,
      nickname: currentUser.nickname || '', phone: currentUser.phone || '',
      role: currentUser.role,
      bankName: currentUser.bankName || null,
      bankNumber: currentUser.bankNumber || null,
      connections: connections.map((c) => ({ managerId: c.managerId, name: c.name, clientCount: c.clientCount, connectedAt: c.connectedAt })),
      myClientCount: clients.filter((c) => c.ownerManagerId === currentUser.id).length,
      createdAt: '2026-01-01T00:00:00Z',
    };
  }

  // POST /api/v1/auth/logout
  if (method === 'POST' && pathname === '/api/v1/auth/logout') { isLoggedIn = false; sessionStorage.removeItem('mock_logged_in'); sessionStorage.removeItem('mock_user_email'); return { success: true }; }
  // POST /api/v1/managers/signup
  if (method === 'POST' && pathname === '/api/v1/managers/signup') {
    const body = options.body || {};
    if (body.email && accounts[body.email]) {
      if (body.bankName) accounts[body.email].bankName = body.bankName;
      if (body.bankNumber) accounts[body.email].bankNumber = body.bankNumber;
    }
    return { success: true, message: '가입이 완료되었습니다. 로그인해주세요.' };
  }
  // POST /api/v1/managers/register
  if (method === 'POST' && pathname === '/api/v1/managers/register') {
    const body = options.body || {};
    if (currentUser) {
      if (body.bankName) currentUser.bankName = body.bankName;
      if (body.bankNumber) currentUser.bankNumber = body.bankNumber;
    }
    return { success: true, message: '가입이 완료되었습니다. 로그인해주세요.' };
  }
  // GET /api/v1/invites/:id/clients
  if (method === 'GET' && /^\/api\/v1\/invites\/[^/]+\/clients$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const invite = invites.find((inv) => inv.id === id);
    if (!invite) throw Object.assign(new Error('초대 토큰을 찾을 수 없습니다.'), { status: 410, body: { error: '6.001' } });
    return invite.registeredClients || [];
  }
  // GET /api/v1/invites/{token}/validate
  if (method === 'GET' && pathname.match(/^\/api\/v1\/invites\/[^/]+\/validate$/)) return { valid: true, managerName: '김성중' };
  // POST /api/v1/clients
  if (method === 'POST' && pathname === '/api/v1/clients') return { success: true, message: '프로필이 성공적으로 등록되었습니다.' };
  // POST /api/v1/connections/disconnect
  if (method === 'POST' && pathname === '/api/v1/connections/disconnect') {
    const body = options.body || {};
    const idx = connections.findIndex((c) => c.managerId === body.targetManagerId);
    if (idx !== -1) connections.splice(idx, 1);
    return { success: true };
  }

  // GET /api/v1/dashboard/summary
  if (method === 'GET' && pathname === '/api/v1/dashboard/summary') return getDashboardSummary();
  // PATCH /api/v1/managers/me
  if (method === 'PATCH' && pathname === '/api/v1/managers/me') {
    const body = options.body || {};
    if (body.name) currentUser.name = body.name;
    if (body.nickname) currentUser.nickname = body.nickname;
    if (body.phone) currentUser.phone = body.phone;
    if (body.bankName !== undefined) currentUser.bankName = body.bankName;
    if (body.bankNumber !== undefined) currentUser.bankNumber = body.bankNumber;
    return { success: true, message: '정보가 수정되었습니다.' };
  }
  // GET /api/v1/managers/:id
  if (method === 'GET' && /^\/api\/v1\/managers\/[^/]+$/.test(pathname)) return getManagerInfo();

  // GET /api/v1/clients/:id/matches (client match history)
  if (method === 'GET' && /^\/api\/v1\/clients\/[^/]+\/matches$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const page = parseInt(params.get('page') || '0', 10);
    const size = parseInt(params.get('size') || '20', 10);
    const filtered = matches.filter(
      (m) => m.clientA?.clientId === id || m.clientB?.clientId === id,
    );
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = page * size;
    return { content: filtered.slice(start, start + size), pagination: { page, size, totalElements: filtered.length, totalPages: Math.ceil(filtered.length / size) } };
  }

  // GET /api/v1/clients/me (본인 프로필 조회)
  if (method === 'GET' && pathname === '/api/v1/clients/me') {
    const id = params.get('id');
    const token = params.get('token');
    const phone = params.get('phone');
    if ((!id && !token) || !phone) throw Object.assign(new Error('id(또는 token)와 phone은 필수입니다.'), { status: 400 });
    const normalizePhone = (p) => (p || '').replace(/-/g, '');
    let found = null;
    // id로 직접 조회 (문의하기 링크)
    if (id) {
      found = clients.find((c) => c.id === id && normalizePhone(c.phone) === normalizePhone(phone));
    }
    // token으로 조회 (프로필 페이지)
    if (!found && token) {
      const invite = invites.find((inv) => inv.token === token);
      if (invite) {
        found = clients.find((c) => c.inviteToken?.id === invite.id && normalizePhone(c.phone) === normalizePhone(phone));
      }
      if (!found) {
        for (const match of matches) {
          const side = match.clientA?.proposalToken === token ? match.clientA
                     : match.clientB?.proposalToken === token ? match.clientB
                     : null;
          if (side) {
            found = clients.find((c) => c.id === side.clientId && normalizePhone(c.phone) === normalizePhone(phone));
            break;
          }
        }
      }
    }
    if (!found) throw Object.assign(new Error('전화번호가 일치하지 않습니다.'), { status: 404 });
    const birthYear = found.birthDate ? new Date(found.birthDate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;
    return {
      id: found.id, name: found.name, nickname: found.nickname, gender: found.gender,
      birthDate: found.birthDate, age, phone: found.phone, height: found.height,
      occupation: found.occupation, company: found.company, workLocation: found.workLocation,
      education: found.education, location: found.location, religion: found.religion,
      mbti: found.mbti, hobbies: found.hobbies, introduction: found.introduction,
      idealType: found.idealType, status: found.status || 'active',
      photoUrls: (found.photoIds || []).map((id) => `/api/v1/clients/photos/${id}`),
      approvalStatus: found.approvalStatus, createdAt: found.createdAt,
    };
  }

  // PUT /api/v1/clients/me (본인 프로필 수정)
  if (method === 'PUT' && pathname === '/api/v1/clients/me') {
    const token = params.get('token');
    const phone = params.get('phone');
    if (!token || !phone) throw Object.assign(new Error('token과 phone은 필수입니다.'), { status: 400 });
    const invite = invites.find((inv) => inv.token === token);
    if (!invite) throw Object.assign(new Error('유효하지 않은 초대 토큰입니다.'), { status: 404 });
    const normalizePhone = (p) => (p || '').replace(/-/g, '');
    const found = clients.find((c) => c.inviteToken?.id === invite.id && normalizePhone(c.phone) === normalizePhone(phone));
    if (!found) throw Object.assign(new Error('전화번호가 일치하지 않습니다.'), { status: 404 });
    const body = options.body || {};
    const editable = ['name','nickname','birthDate','phone','height','occupation','company','workLocation','education','location','religion','mbti','hobbies','introduction','idealType'];
    for (const key of editable) {
      if (body[key] !== undefined && body[key] !== null) {
        found[key] = key === 'height' ? Number(body[key]) : body[key];
      }
    }
    return { success: true, message: '프로필이 수정되었습니다.' };
  }

  // POST /api/v1/inquiries/:id/answer (답변 등록)
  if (method === 'POST' && /^\/api\/v1\/inquiries\/[^/]+\/answer$/.test(pathname)) {
    const inquiryId = pathname.split('/').slice(-2)[0];
    const inq = inquiries.find((i) => i.id === inquiryId);
    if (!inq) throw Object.assign(new Error('해당 문의를 찾을 수 없습니다.'), { status: 404 });
    if (inq.status !== 'pending') throw Object.assign(new Error('이미 답변이 등록된 문의입니다.'), { status: 409 });
    const { answer } = options.body || {};
    if (!answer) throw Object.assign(new Error('answer는 필수입니다.'), { status: 400 });
    inq.answer = answer;
    inq.status = 'answered';
    inq.answeredAt = new Date().toISOString();
    inq.updatedAt = new Date().toISOString();
    return { success: true, message: '답변이 등록되었습니다.' };
  }

  // PATCH /api/v1/inquiries/:id/close (문의 종료)
  if (method === 'PATCH' && /^\/api\/v1\/inquiries\/[^/]+\/close$/.test(pathname)) {
    const inquiryId = pathname.split('/').slice(-2)[0];
    const inq = inquiries.find((i) => i.id === inquiryId);
    if (!inq) throw Object.assign(new Error('해당 문의를 찾을 수 없습니다.'), { status: 404 });
    inq.status = 'closed';
    inq.updatedAt = new Date().toISOString();
    return { success: true, message: '문의가 종료되었습니다.' };
  }

  // GET /api/v1/inquiries/:id (문의 상세)
  if (method === 'GET' && /^\/api\/v1\/inquiries\/[^/]+$/.test(pathname)) {
    const inquiryId = pathname.split('/').pop();
    const inq = inquiries.find((i) => i.id === inquiryId);
    if (!inq) throw Object.assign(new Error('해당 문의를 찾을 수 없습니다.'), { status: 404 });
    const client = clients.find((c) => c.id === inq.clientId);
    return {
      id: inq.id, clientId: inq.clientId,
      clientName: client?.nickname || client?.name || '알 수 없음',
      category: inq.category, title: inq.title, content: inq.content,
      status: inq.status, answer: inq.answer || null,
      createdAt: inq.createdAt, updatedAt: inq.updatedAt || inq.createdAt,
      answeredAt: inq.answeredAt || null,
    };
  }

  // GET /api/v1/inquiries (매니저 문의 목록)
  if (method === 'GET' && pathname === '/api/v1/inquiries') {
    const myClientIds = new Set(clients.filter((c) => c.ownerManagerId === currentUser.id).map((c) => c.id));
    const statusFilter = params.get('status');
    const categoryFilter = params.get('category');
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '20', 10);
    let filtered = inquiries.filter((inq) => myClientIds.has(inq.clientId));
    if (statusFilter) filtered = filtered.filter((inq) => inq.status === statusFilter);
    if (categoryFilter) filtered = filtered.filter((inq) => inq.category === categoryFilter);
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit).map((inq) => {
      const client = clients.find((c) => c.id === inq.clientId);
      return {
        id: inq.id, clientId: inq.clientId,
        clientName: client?.nickname || client?.name || '알 수 없음',
        category: inq.category, title: inq.title,
        status: inq.status, createdAt: inq.createdAt, answeredAt: inq.answeredAt || null,
      };
    });
    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  // POST /api/v1/inquiries (문의 등록 - Client 공개 API)
  if (method === 'POST' && pathname === '/api/v1/inquiries') {
    const clientId = params.get('id');
    const phone = params.get('phone');
    const verificationId = params.get('verificationId');
    if (!clientId || !phone || !verificationId) throw Object.assign(new Error('id, phone, verificationId는 필수입니다.'), { status: 400 });
    const normalizePhone = (p) => (p || '').replace(/-/g, '');
    const found = clients.find((c) => c.id === clientId && normalizePhone(c.phone) === normalizePhone(phone));
    if (!found) throw Object.assign(new Error('전화번호가 일치하지 않습니다.'), { status: 404 });
    const { category, title, content } = options.body || {};
    if (!category || !title || !content) throw Object.assign(new Error('category, title, content는 필수입니다.'), { status: 400 });
    const newInquiry = {
      id: crypto.randomUUID(),
      clientId, category, title, content,
      status: 'pending', answer: null, answeredAt: null, updatedAt: null,
      createdAt: new Date().toISOString(),
    };
    inquiries.push(newInquiry);
    return { success: true, message: '문의가 등록되었습니다.', data: newInquiry.id };
  }

  // PATCH /api/v1/clients/:id/status (회원 상태 변경)
  if (method === 'PATCH' && /^\/api\/v1\/clients\/[^/]+\/status$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const found = clients.find((c) => c.id === id);
    if (!found) throw Object.assign(new Error('Client not found'), { status: 404 });
    const body = options.body || {};
    if (['active', 'inactive', 'dormant'].includes(body.status)) {
      found.status = body.status;
    }
    return { success: true, message: '상태가 변경되었습니다.' };
  }

  // GET /api/v1/clients/:id (detail)
  if (method === 'GET' && /^\/api\/v1\/clients\/[^?]+$/.test(pathname) && !pathname.endsWith('/clients')) {
    const id = pathname.split('/').pop();
    const found = clients.find((c) => c.id === id);
    if (found) return { ...found, ...enrichClient(found) };
    throw new Error('Client not found');
  }

  // GET /api/v1/clients (list)
  if (method === 'GET' && pathname === '/api/v1/clients') {
    let filtered = [...clients];
    const nameQ = params.get('name');
    const phoneQ = params.get('phone');
    const gender = params.get('gender');
    const approval = params.get('approval');
    const owner = params.get('owner');
    const sort = params.get('sort') || 'createdAt:desc';
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '20', 10);
    if (nameQ) filtered = filtered.filter((c) => c.name.includes(nameQ) || (c.nickname && c.nickname.includes(nameQ)));
    if (phoneQ) filtered = filtered.filter((c) => c.phone === phoneQ);
    const statusQ = params.get('status');
    if (approval) filtered = filtered.filter((c) => c.approvalStatus === approval);
    if (statusQ) filtered = filtered.filter((c) => (c.status || 'active') === statusQ);
    if (owner === 'me') filtered = filtered.filter((c) => c.ownerManagerId === currentUser.id);
    else if (owner && owner !== 'all') filtered = filtered.filter((c) => c.ownerManagerId === owner);
    const maleCount = filtered.filter((c) => c.gender === 'male').length;
    const femaleCount = filtered.filter((c) => c.gender === 'female').length;
    if (gender) filtered = filtered.filter((c) => c.gender === gender);
    const [field, dir] = sort.split(':');
    filtered.sort((a, b) => { const va = a[field] || ''; const vb = b[field] || ''; return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit).map((c) => ({ ...c, ...enrichClient(c) })), pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) }, genderCounts: { male: maleCount, female: femaleCount } };
  }

  // GET /api/v1/connections
  if (method === 'GET' && pathname === '/api/v1/connections') return { connections };
  // GET /api/v1/invites/manager (매니저 초대 quota)
  if (method === 'GET' && pathname === '/api/v1/invites/manager') {
    const activeCount = invites.filter((i) => i.status === 'active').length;
    return { limit: 20, used: activeCount, remaining: 20 - activeCount };
  }
  // GET /api/v1/invites
  if (method === 'GET' && pathname === '/api/v1/invites') return invites;
  // POST /api/v1/invites (create)
  if (method === 'POST' && pathname === '/api/v1/invites') {
    const body = options.body || {};
    const newInvite = { id: `inv${Date.now()}`, token: randomToken(), label: body.label || '', status: 'active', useCount: 0, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + (body.expiresInHours || 24) * 3600000).toISOString() };
    invites.unshift(newInvite);
    return newInvite;
  }

  // PATCH /api/v1/invites/:id/label
  if (method === 'PATCH' && /^\/api\/v1\/invites\/[^/]+\/label$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const inv = invites.find((i) => i.id === id);
    if (!inv) throw Object.assign(new Error('초대를 찾을 수 없습니다.'), { status: 404 });
    inv.label = body.label || '';
    return { success: true };
  }

  // DELETE /api/v1/invites/:id
  if (method === 'DELETE' && /^\/api\/v1\/invites\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    const inv = invites.find((i) => i.id === id);
    if (inv) inv.status = 'revoked';
    return { success: true };
  }

  // GET /api/v1/connections/search?email=
  if (method === 'GET' && pathname === '/api/v1/connections/search') {
    const email = params.get('email');
    const found = searchableManagers.find((m) => m.email === email);
    if (found) return found;
    throw Object.assign(new Error('해당 매니저를 찾을 수 없습니다.'), { status: 404 });
  }

  // GET /api/v1/connections/requests
  if (method === 'GET' && pathname === '/api/v1/connections/requests') {
    return { received: connectionRequests.filter((r) => r.status === 'pending'), sent: sentRequests };
  }

  // POST /api/v1/connections/requests (send)
  if (method === 'POST' && pathname === '/api/v1/connections/requests') {
    const body = options.body || {};
    const target = searchableManagers.find((m) => m.email === body.email);
    if (!target) throw Object.assign(new Error('해당 매니저를 찾을 수 없습니다.'), { status: 404 });
    const newReq = { id: `req${Date.now()}`, managerId: target.id, managerName: target.name, status: 'pending', message: body.message || '', createdAt: new Date().toISOString() };
    sentRequests.unshift(newReq);
    return newReq;
  }

  // POST /api/v1/connections/requests/:id/accept
  if (method === 'POST' && /^\/api\/v1\/connections\/requests\/[^/]+\/accept$/.test(pathname)) {
    const reqId = pathname.split('/').slice(-2, -1)[0];
    const req = connectionRequests.find((r) => r.id === reqId);
    if (req) { req.status = 'accepted'; connections.push({ id: `c${Date.now()}`, managerId: req.managerId, name: req.managerName, email: '', clientCount: 0, connectedAt: new Date().toISOString() }); }
    return { success: true, connection: req ? { managerId: req.managerId, name: req.managerName } : {}, message: req ? `'${req.managerName}' 님과 연결되었습니다.` : '연결되었습니다.' };
  }

  // POST /api/v1/connections/requests/:id/reject
  if (method === 'POST' && /^\/api\/v1\/connections\/requests\/[^/]+\/reject$/.test(pathname)) {
    const reqId = pathname.split('/').slice(-2, -1)[0];
    const req = connectionRequests.find((r) => r.id === reqId);
    if (req) req.status = 'rejected';
    return { success: true, message: '연결 요청을 거절했습니다.' };
  }

  // POST /api/v1/connections/invite
  if (method === 'POST' && pathname === '/api/v1/connections/invite') return { token: randomToken() };

  // PATCH /api/v1/clients/:id/approval
  if (method === 'PATCH' && /\/api\/v1\/clients\/[^/]+\/approval/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const c = clients.find((cl) => cl.id === id);
    if (c) c.approvalStatus = body.status;
    return { success: true };
  }

  // PATCH /api/v1/clients/:id/note
  if (method === 'PATCH' && /\/api\/v1\/clients\/[^/]+\/note/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const c = clients.find((cl) => cl.id === id);
    if (c) c.managerNote = body.note;
    return { success: true };
  }

  // PUT /api/v1/clients/:id (update profile)
  if (method === 'PUT' && /^\/api\/v1\/clients\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    const body = options.body || {};
    const c = clients.find((cl) => cl.id === id);
    if (!c) throw Object.assign(new Error('해당 Client를 찾을 수 없습니다.'), { status: 404, body: { error: '4.002' } });
    for (const [key, value] of Object.entries(body)) {
      if (value != null) c[key] = value;
    }
    return { success: true, message: '프로필이 수정되었습니다.' };
  }

  // POST /api/v1/clients/:id/photos (add photos)
  if (method === 'POST' && /^\/api\/v1\/clients\/[^/]+\/photos$/.test(pathname)) {
    return { success: true, message: '사진이 추가되었습니다.' };
  }

  // DELETE /api/v1/clients/:id (delete client)
  if (method === 'DELETE' && /^\/api\/v1\/clients\/[^/]+$/.test(pathname) && !pathname.includes('/photos/')) {
    const id = pathname.split('/').pop();
    const idx = clients.findIndex((c) => c.id === id);
    if (idx === -1) throw Object.assign(new Error('회원을 찾을 수 없습니다.'), { status: 404, body: { error: '4.002' } });
    if (clients[idx].ownerManagerId !== currentUser.id) throw Object.assign(new Error('담당 매니저만 삭제할 수 있습니다.'), { status: 403, body: { error: '2.001' } });
    for (const m of matches) {
      if (m.clientA.clientId === id) { m.clientA.deleted = true; m.clientA.clientName = '삭제된 회원'; m.clientA.clientGender = null; }
      if (m.clientB.clientId === id) { m.clientB.deleted = true; m.clientB.clientName = '삭제된 회원'; m.clientB.clientGender = null; }
    }
    clients.splice(idx, 1);
    return { message: '회원이 삭제되었습니다.' };
  }

  // DELETE /api/v1/clients/:id/photos/:photoId (delete photo)
  if (method === 'DELETE' && /^\/api\/v1\/clients\/[^/]+\/photos\/[^/]+$/.test(pathname)) {
    return { success: true, message: '사진이 삭제되었습니다.' };
  }

  // ── Match APIs ──

  // POST /api/v1/matches (create) → draft
  if (method === 'POST' && pathname === '/api/v1/matches') {
    const body = options.body || {};
    const foundA = clients.find((c) => c.id === body.clientAId);
    const foundB = clients.find((c) => c.id === body.clientBId);
    if (!foundA || !foundB) throw Object.assign(new Error('회원을 찾을 수 없습니다.'), { status: 404 });
    const tokenA = randomToken();
    const tokenB = randomToken();
    const newMatch = {
      matchId: `match${Date.now()}`, type: body.type || null, status: 'draft', note: body.note || '',
      clientA: { clientId: foundA.id, clientName: foundA.name, clientGender: foundA.gender, managerName: (managerMap[foundA.ownerManagerId] || {}).name || '알 수 없음', role: 'proposer', response: null, respondedAt: null, proposalToken: tokenA },
      clientB: { clientId: foundB.id, clientName: foundB.name, clientGender: foundB.gender, managerName: (managerMap[foundB.ownerManagerId] || {}).name || '알 수 없음', role: 'receiver', response: null, respondedAt: null, proposalToken: tokenB },
      createdAt: new Date().toISOString(),
      createdByManagerId: currentUser.id,
      createdByManagerName: currentUser.name,
    };
    matches.unshift(newMatch);
    return { matchId: newMatch.matchId, status: 'draft', clientA: { clientId: foundA.id, clientName: foundA.name, proposalToken: tokenA }, clientB: { clientId: foundB.id, clientName: foundB.name, proposalToken: tokenB } };
  }

  // POST /api/v1/matches/:matchId/start (draft → proposal_sent)
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/start$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    if (m.status !== 'draft') throw Object.assign(new Error('draft 상태의 매칭만 시작할 수 있습니다. (MATCH_NOT_DRAFT)'), { status: 400 });
    m.status = 'proposal_sent';
    return { status: 'success', message: '매칭이 시작되었습니다.' };
  }

  // DELETE /api/v1/matches/:matchId
  if (method === 'DELETE' && /^\/api\/v1\/matches\/[^/]+$/.test(pathname) && !pathname.endsWith('/matches')) {
    const id = pathname.split('/').pop();
    const idx = matches.findIndex((m) => m.matchId === id);
    if (idx === -1) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    matches.splice(idx, 1);
    return { success: true, message: '매칭이 삭제되었습니다.' };
  }

  // GET /api/v1/matches/:matchId (detail)
  if (method === 'GET' && /^\/api\/v1\/matches\/[^/]+$/.test(pathname) && !pathname.endsWith('/matches')) {
    const id = pathname.split('/').pop();
    const found = matches.find((m) => m.matchId === id);
    if (!found) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    const tokenA = found.clientA.proposalToken;
    const tokenB = found.clientB.proposalToken;
    const rawTimesA = availableTimes[tokenA] || [];
    const rawTimesB = availableTimes[tokenB] || [];
    // Build availableTimes with clientId
    const enrichedTimesA = rawTimesA.map((t) => ({ ...t, clientId: found.clientA.clientId }));
    const enrichedTimesB = rawTimesB.map((t) => ({ ...t, clientId: found.clientB.clientId }));
    const allAvailableTimes = [...enrichedTimesA, ...enrichedTimesB];
    // Build confirmedSchedule
    const pickedTime = allAvailableTimes.find((t) => t.selected);
    const confirmedSchedule = found.confirmedAt ? {
      date: pickedTime?.date || null,
      startTime: pickedTime?.startTime || null,
      location: found.location || null,
      locationLink: found.locationLink || null,
      endTime: found.endTime || null,
      confirmedAt: found.confirmedAt,
    } : null;
    // Enrich participants with client details + feedback
    const fbA = feedbacks[found.clientA.proposalToken];
    const fbB = feedbacks[found.clientB.proposalToken];
    const clientA = {
      ...enrichParticipant(found.clientA),
      availableTimesSubmitted: rawTimesA.length > 0,
      feedbackRating: fbA?.rating || null, feedbackComment: fbA?.comment || null, feedbackAt: fbA?.feedbackAt || null,
      afterResponse: found.afterResponses?.A || null,
      afterRespondedAt: found.afterRespondedAts?.A || null,
    };
    const clientB = {
      ...enrichParticipant(found.clientB),
      availableTimesSubmitted: rawTimesB.length > 0,
      feedbackRating: fbB?.rating || null, feedbackComment: fbB?.comment || null, feedbackAt: fbB?.feedbackAt || null,
      afterResponse: found.afterResponses?.B || null,
      afterRespondedAt: found.afterRespondedAts?.B || null,
    };
    return {
      ...found,
      clientA,
      clientB,
      availableTimes: allAvailableTimes,
      confirmedSchedule,
      afterStatus: found.afterStatus || null,
    };
  }

  // GET /api/v1/matches (list) — 자신의 매칭만 반환
  if (method === 'GET' && pathname === '/api/v1/matches') {
    const rawPage = parseInt(params.get('page') || '0', 10);
    const page = rawPage < 1 ? 0 : rawPage;
    const size = parseInt(params.get('size') || '20', 10);
    const myMatches = currentUser.role === 'admin'
      ? matches
      : matches.filter(m => m.createdByManagerName === currentUser.name);
    const sorted = [...myMatches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = page * size;
    return { data: sorted.slice(start, start + size), pagination: { page, limit: size, total: sorted.length, totalPages: Math.ceil(sorted.length / size) } };
  }

  // POST /api/v1/matches/:matchId/confirm-payment (입금 확인)
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/confirm-payment$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    if (m.status !== 'awaiting_payment') throw Object.assign(new Error('awaiting_payment 상태에서만 입금 확인할 수 있습니다.'), { status: 400 });
    m.status = 'scheduling';
    return { success: true, message: '입금이 확인되었습니다. 일정조율 안내가 발송되었습니다.' };
  }

  // POST /api/v1/matches/:matchId/confirm (매니저 일정 확정 — arranging 상태에서만)
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/confirm$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    if (m.status !== 'arranging') throw Object.assign(new Error('arranging 상태에서만 확정할 수 있습니다.'), { status: 400 });
    // Find selected time by timeId from combined available times
    const timesA = availableTimes[m.clientA.proposalToken] || [];
    const timesB = availableTimes[m.clientB.proposalToken] || [];
    const allTimes = [...timesA, ...timesB];
    const selected = allTimes.find((t) => t.timeId === body.timeId);
    if (!selected) throw Object.assign(new Error('해당 가용 시간을 찾을 수 없습니다.'), { status: 404 });
    selected.selected = true;
    m.location = body.location || '';
    m.locationLink = body.locationLink || null;
    m.endTime = body.endTime || '';
    m.confirmedAt = new Date().toISOString();
    m.meetingDate = `${selected.date}T${selected.startTime}`;
    m.status = 'scheduled';
    return { success: true, message: '일정이 확정되었습니다.' };
  }

  // POST /api/v1/matches/:matchId/reschedule (가용시간 재등록 요청)
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/reschedule$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    if (m.status !== 'arranging') throw Object.assign(new Error('arranging 상태에서만 재등록 요청할 수 있습니다.'), { status: 400 });
    // Clear available times and revert to scheduling
    delete availableTimes[m.clientA.proposalToken];
    delete availableTimes[m.clientB.proposalToken];
    m.status = 'scheduling';
    return { success: true, message: '가용시간 재등록이 요청되었습니다.' };
  }

  // POST /api/v1/matches/:matchId/cancel
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/cancel$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    m.status = 'cancelled';
    m.cancelReason = body.reason || '';
    m.cancelledByName = '김성중';
    m.cancelledAt = new Date().toISOString();
    return { success: true, message: '매칭이 취소되었습니다.' };
  }

  // POST /api/v1/matches/:matchId/complete
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/complete$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    m.status = 'completed';
    if (!m.afterResponses) m.afterResponses = { A: 'pending', B: 'pending' };
    if (!m.afterRespondedAts) m.afterRespondedAts = {};
    return { success: true, message: '매칭이 완료 처리되었습니다.' };
  }

  // ── Proposal APIs ──

  // GET /api/v1/proposals/:token
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+$/.test(pathname) && !pathname.includes('/respond') && !pathname.includes('/available-times') && !pathname.includes('/select-time')) {
    const token = pathname.split('/').pop();
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const { match: m, side, participant, counterpart: cp } = proposal;
    const myRole = participant.role; // 'proposer' or 'receiver'
    const myResponse = participant.response || 'pending';

    // Access control: proposal_sent → proposer만 조회 가능 (A가 먼저 확인)
    if (m.status === 'proposal_sent' && myRole === 'receiver') {
      throw Object.assign(new Error('아직 상대방 응답을 기다리고 있습니다.'), { status: 403, body: { error: '9.005' } });
    }
    if (m.status === 'cancelled') {
      throw Object.assign(new Error('종료된 매칭입니다.'), { status: 410, body: { error: '9.014' } });
    }

    const birthYear = cp?.birthDate ? new Date(cp.birthDate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;

    return {
      myName: participant.clientName || (side === 'A' ? m.clientA.clientName : m.clientB.clientName),
      myRole,
      myResponse,
      matchStatus: m.status,
      counterpart: cp ? {
        nickname: cp.nickname || cp.name,
        gender: cp.gender,
        age,
        height: cp.height,
        occupation: cp.occupation,
        company: cp.company,
        education: cp.education,
        location: cp.location,
        workLocation: cp.workLocation,
        religion: cp.religion,
        mbti: cp.mbti,
        hobbies: cp.hobbies,
        introduction: cp.introduction,
        photoUrls: (cp.photoIds || []).map((id) => `/api/v1/proposals/${token}/photos/${id}`),
      } : null,
    };
  }

  // POST /api/v1/proposals/:token/respond
  if (method === 'POST' && /^\/api\/v1\/proposals\/[^/]+\/respond$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    if (proposal.participant.response) throw Object.assign(new Error('이미 응답한 프로포절입니다.'), { status: 400 });

    proposal.participant.response = body.response;
    proposal.participant.respondedAt = new Date().toISOString();
    const m = proposal.match;

    if (body.response === 'rejected') {
      m.status = 'cancelled';
      m.cancelReason = `${proposal.participant.role === 'receiver' ? 'B' : 'A'}가 프로필 확인 후 거절`;
      return { success: true, message: '응답이 등록되었습니다.' };
    }

    // accepted
    if (proposal.participant.role === 'proposer') {
      // proposer(A) 수락 → proposal_accepted
      m.status = 'proposal_accepted';
      return { success: true, message: '응답이 등록되었습니다.' };
    } else {
      // receiver(B) 수락 → scheduling
      m.status = 'scheduling';
      return { success: true, message: '응답이 등록되었습니다.' };
    }
  }

  // GET /api/v1/proposals/:token/available-times
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+\/available-times$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const result = findMatchByProposalToken(token);
    if (!result) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    // Return combined times from both sides
    const m = result.match;
    const timesA = availableTimes[m.clientA.proposalToken] || [];
    const timesB = availableTimes[m.clientB.proposalToken] || [];
    return { times: [...timesA, ...timesB] };
  }

  // POST /api/v1/proposals/:token/available-times (both sides register)
  if (method === 'POST' && /^\/api\/v1\/proposals\/[^/]+\/available-times$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const result = findMatchByProposalToken(token);
    if (!result) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const m = result.match;
    const participant = result.side === 'A' ? m.clientA : m.clientB;
    const clientName = participant.clientName;
    availableTimes[token] = (body.times || []).map((t, i) => ({
      timeId: `time-${Date.now()}-${i}`,
      date: t.date,
      startTime: t.startTime,
      clientName,
      selected: false,
    }));
    // Auto-transition to arranging if both sides have submitted
    const otherToken = result.side === 'A' ? m.clientB.proposalToken : m.clientA.proposalToken;
    if ((availableTimes[otherToken] || []).length > 0 && m.status === 'scheduling') {
      m.status = 'arranging';
    }
    return { success: true, message: '가용시간이 등록되었습니다.' };
  }

  // ── After APIs ──

  // GET /api/v1/proposals/:token/after
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+\/after$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const m = proposal.match;
    if (m.status !== 'completed') throw Object.assign(new Error('미팅이 완료되지 않았습니다.'), { status: 400, body: { error: '9.007' } });
    const side = proposal.side;
    const otherSide = side === 'A' ? 'B' : 'A';
    const participant = side === 'A' ? m.clientA : m.clientB;
    const counterpart = otherSide === 'A' ? m.clientA : m.clientB;
    const counterpartClient = proposal.counterpart;
    const myAfterResponse = participant.afterResponse || 'pending';
    const counterpartAfterResponse = counterpart.afterResponse || 'pending';
    const currentAfterStatus = m.afterStatus || 'pending';
    return {
      myName: participant.clientName,
      counterpartName: counterpartClient?.nickname || counterpartClient?.name || '',
      matchStatus: m.status,
      afterStatus: currentAfterStatus,
      resultAvailable: currentAfterStatus === 'accepted' || currentAfterStatus === 'rejected',
      myAfterResponse,
      myAfterRespondedAt: participant.afterRespondedAt || null,
      counterpartAfterResponse,
    };
  }

  // POST /api/v1/proposals/:token/after (respond)
  if (method === 'POST' && /^\/api\/v1\/proposals\/[^/]+\/after$/.test(pathname) && !pathname.includes('/after/')) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const m = proposal.match;
    if (m.status !== 'completed') throw Object.assign(new Error('미팅이 완료되지 않았습니다.'), { status: 400, body: { error: '9.007' } });
    const participant = proposal.side === 'A' ? m.clientA : m.clientB;
    participant.afterResponse = body.response;
    participant.afterRespondedAt = new Date().toISOString();
    // Compute overall after status
    const aResp = m.clientA.afterResponse || 'pending';
    const bResp = m.clientB.afterResponse || 'pending';
    if (aResp === 'rejected' || bResp === 'rejected') {
      m.afterStatus = 'rejected';
    } else if (aResp === 'accepted' && bResp === 'accepted') {
      m.afterStatus = 'accepted';
    } else {
      m.afterStatus = 'pending';
    }
    return { success: true, afterStatus: m.afterStatus };
  }

  // GET /api/v1/proposals/:token/after/profile
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+\/after\/profile$/.test(pathname)) {
    const token = pathname.split('/').slice(-3, -2)[0];
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const m = proposal.match;
    if (m.afterStatus !== 'accepted') throw Object.assign(new Error('에프터가 성사되지 않았습니다.'), { status: 400, body: { error: '9.012' } });
    const cp = proposal.counterpart;
    if (!cp) throw Object.assign(new Error('상대 정보를 찾을 수 없습니다.'), { status: 404 });
    return {
      name: cp.name,
      phone: cp.phone,
      nickname: cp.nickname,
      gender: cp.gender,
      age: cp.birthDate ? new Date().getFullYear() - new Date(cp.birthDate).getFullYear() : null,
      height: cp.height,
      occupation: cp.occupation,
      company: cp.company,
      education: cp.education,
      location: cp.location,
      workLocation: cp.workLocation,
      mbti: cp.mbti,
      hobbies: cp.hobbies,
      introduction: cp.introduction,
      photoUrls: (cp.photoIds || []).map((id) => `/api/v1/clients/photos/${id}`),
    };
  }

  // GET /api/v1/proposals/:token/after/result
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+\/after\/result$/.test(pathname)) {
    const token = pathname.split('/').slice(-3, -2)[0];
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const m = proposal.match;
    if (m.status !== 'completed') throw Object.assign(new Error('완료된 매칭이 아닙니다.'), { status: 400, body: { error: 'MATCH_INVALID_STATUS' } });
    const currentAfterStatus = m.afterStatus || 'pending';
    if (currentAfterStatus === 'pending') throw Object.assign(new Error('아직 양쪽 응답이 완료되지 않았습니다.'), { status: 400, body: { error: 'MATCH_INVALID_STATUS' } });
    if (currentAfterStatus === 'rejected') {
      return { afterStatus: 'rejected', counterpartProfile: null };
    }
    const cp = proposal.counterpart;
    return {
      afterStatus: 'accepted',
      counterpartProfile: cp ? {
        name: cp.name,
        phone: cp.phone,
        nickname: cp.nickname,
        gender: cp.gender,
        age: cp.birthDate ? new Date().getFullYear() - new Date(cp.birthDate).getFullYear() : null,
        height: cp.height,
        occupation: cp.occupation,
        company: cp.company,
        workLocation: cp.workLocation,
        education: cp.education,
        location: cp.location,
        religion: cp.religion,
        mbti: cp.mbti,
        hobbies: cp.hobbies,
        introduction: cp.introduction,
        photoUrls: (cp.photoIds || []).map((id) => `/api/v1/proposals/${token}/photos/${id}`),
      } : null,
    };
  }

  // ── Feedback APIs ──

  // GET /api/v1/proposals/:token/feedback
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+\/feedback$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404, body: { error: 'PROPOSAL_NOT_FOUND' } });
    const m = proposal.match;
    if (m.status !== 'completed') throw Object.assign(new Error('완료된 매칭이 아닙니다.'), { status: 400, body: { error: 'MATCH_INVALID_STATUS' } });
    if (m.afterStatus !== 'rejected') throw Object.assign(new Error('에프터가 rejected가 아닙니다.'), { status: 400, body: { error: 'MATCH_INVALID_STATUS' } });
    const fb = feedbacks[token];
    return { rating: fb?.rating || null, comment: fb?.comment || null, feedbackAt: fb?.feedbackAt || null };
  }

  // POST /api/v1/proposals/:token/feedback
  if (method === 'POST' && /^\/api\/v1\/proposals\/[^/]+\/feedback$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const proposal = getProposalByToken(token);
    if (!proposal) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404, body: { error: 'PROPOSAL_NOT_FOUND' } });
    const m = proposal.match;
    if (m.status !== 'completed') throw Object.assign(new Error('완료된 매칭이 아닙니다.'), { status: 400, body: { error: 'MATCH_INVALID_STATUS' } });
    if (m.afterStatus !== 'rejected') throw Object.assign(new Error('에프터가 rejected가 아닙니다.'), { status: 400, body: { error: 'MATCH_INVALID_STATUS' } });
    feedbacks[token] = { rating: body.rating ?? null, comment: body.comment ?? null, feedbackAt: new Date().toISOString() };
    return { rating: feedbacks[token].rating, comment: feedbacks[token].comment, feedbackAt: feedbacks[token].feedbackAt };
  }

  // POST /api/v1/matches/:matchId/after (manager override - per client)
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/after$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    if (body.participants) {
      for (const p of body.participants) {
        if (p.clientId === m.clientA.clientId) m.clientA.afterResponse = p.afterResponse;
        if (p.clientId === m.clientB.clientId) m.clientB.afterResponse = p.afterResponse;
      }
      const aResp = m.clientA.afterResponse;
      const bResp = m.clientB.afterResponse;
      if (aResp === 'accepted' && bResp === 'accepted') m.afterStatus = 'accepted';
      else if (aResp === 'rejected' || bResp === 'rejected') m.afterStatus = 'rejected';
      else m.afterStatus = 'pending';
    }
    return { success: true, message: '에프터 상태가 변경되었습니다.' };
  }

  // ── Notifications ──────────────────────────────────
  const mockNotifications = [
    { id: 'noti-001', type: 'match_created', title: '새 매칭이 생성되었습니다', message: '김서연님과 이준혁님의 매칭이 생성되었습니다.', referenceType: 'match', referenceId: 'match001', read: false, createdAt: '2026-04-07T12:00:00Z' },
    { id: 'noti-002', type: 'proposal_accepted', title: '매칭 제안이 수락되었습니다', message: '한소희님이 매칭 제안을 수락했습니다.', referenceType: 'match', referenceId: 'match002', read: false, createdAt: '2026-04-07T10:30:00Z' },
    { id: 'noti-003', type: 'client_registered', title: '새 회원이 가입했습니다', message: '초대 링크를 통해 새 회원이 가입했습니다.', referenceType: 'client', referenceId: 's003', read: false, createdAt: '2026-04-06T18:00:00Z' },
    { id: 'noti-004', type: 'connection_requested', title: '새 연결 요청이 도착했습니다', message: '이매니저님이 연결을 요청했습니다.', referenceType: 'connection_request', referenceId: 'conn-001', read: false, createdAt: '2026-04-06T15:20:00Z' },
    { id: 'noti-005', type: 'match_matched', title: '매칭이 성사되었습니다', message: '윤예은님과 정우진님의 매칭이 성사되었습니다.', referenceType: 'match', referenceId: 'match003', read: true, createdAt: '2026-04-05T14:00:00Z' },
    { id: 'noti-006', type: 'scheduling_ready', title: '가용시간 등록이 완료되었습니다', message: '양측 가용시간 등록이 완료되어 약속을 확정할 수 있습니다.', referenceType: 'match', referenceId: 'match004', read: true, createdAt: '2026-04-05T11:00:00Z' },
    { id: 'noti-007', type: 'match_scheduled', title: '약속이 확정되었습니다', message: '4월 10일 19:00 강남역 카페에서 만남이 확정되었습니다.', referenceType: 'match', referenceId: 'match006', read: true, createdAt: '2026-04-04T16:30:00Z' },
    { id: 'noti-008', type: 'after_responded', title: '에프터 응답이 도착했습니다', message: '김서연님이 에프터 응답을 제출했습니다.', referenceType: 'match', referenceId: 'match007', read: false, createdAt: '2026-04-04T10:00:00Z' },
    { id: 'noti-009', type: 'match_cancelled', title: '매칭이 취소되었습니다', message: '임수아님과 강도윤님의 매칭이 취소되었습니다.', referenceType: 'match', referenceId: 'match008', read: true, createdAt: '2026-04-03T09:00:00Z' },
    { id: 'noti-010', type: 'connection_accepted', title: '연결 요청이 수락되었습니다', message: '박매니저님이 연결 요청을 수락했습니다.', referenceType: 'connection_request', referenceId: 'conn-002', read: true, createdAt: '2026-04-02T14:00:00Z' },
    { id: 'noti-011', type: 'after_matched', title: '에프터가 성사되었습니다', message: '윤예은님과 정우진님의 에프터가 성사되었습니다!', referenceType: 'match', referenceId: 'match003', read: true, createdAt: '2026-04-01T13:00:00Z' },
    { id: 'noti-012', type: 'match_completed', title: '매칭이 완료되었습니다', message: '오태양님과 김서연님의 매칭이 완료 처리되었습니다.', referenceType: 'match', referenceId: 'match009', read: true, createdAt: '2026-03-31T17:00:00Z' },
  ];

  // GET /api/v1/notifications — 읽지 않은 알림만 반환
  if (method === 'GET' && pathname === '/api/v1/notifications') {
    if (!isLoggedIn) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    const page = parseInt(params.get('page') || '0', 10);
    const size = parseInt(params.get('size') || '20', 10);
    const unread = mockNotifications.filter((n) => !n.read);
    const start = page * size;
    const paged = unread.slice(start, start + size);
    return {
      data: paged,
      pagination: { page, limit: size, total: unread.length, totalPages: Math.ceil(unread.length / size) },
    };
  }

  // GET /api/v1/notifications/unread-count
  if (method === 'GET' && pathname === '/api/v1/notifications/unread-count') {
    if (!isLoggedIn) throw Object.assign(new Error('Unauthorized'), { status: 401 });
    return { unreadCount: mockNotifications.filter((n) => !n.read).length };
  }

  // POST /api/v1/notifications/:id/read
  if (method === 'POST' && /^\/api\/v1\/notifications\/[^/]+\/read$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const noti = mockNotifications.find((n) => n.id === id);
    if (noti) noti.read = true;
    return { success: true };
  }

  // POST /api/v1/notifications/read-all
  if (method === 'POST' && pathname === '/api/v1/notifications/read-all') {
    mockNotifications.forEach((n) => { n.read = true; });
    return { success: true };
  }

  // fallback
  return {};
}
