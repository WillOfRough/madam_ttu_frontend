/**
 * DEV 모드 전용 목 데이터
 */

const MANAGER_ID = '00000000-0000-0000-0000-000000000001';

function randomToken(len = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

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
    managerNote: '밝고 활발한 성격. 대화 능력 좋음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-28T09:00:00Z',
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
    managerNote: '차분하고 진중한 인상. 연봉 높음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-25T14:30:00Z',
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

// ── Invites (Seeker 초대 링크) ─────────────────────────
const invites = [
  {
    id: 'inv001',
    token: 'AbC123xYz001',
    label: '김서연 지인 소개용',
    status: 'active',
    useCount: 1,
    createdAt: '2026-02-27T09:00:00Z',
    expiresAt: '2026-02-28T09:00:00Z',
  },
  {
    id: 'inv002',
    token: 'KpR482mNv002',
    label: '3월 신규 모집',
    status: 'active',
    useCount: 3,
    createdAt: '2026-03-05T10:00:00Z',
    expiresAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'inv003',
    token: 'Wq7jTn3sL003',
    label: '회사 동료 추천',
    status: 'active',
    useCount: 0,
    createdAt: '2026-03-06T08:00:00Z',
    expiresAt: '2026-03-07T08:00:00Z',
  },
  {
    id: 'inv004',
    token: 'Hy9fBk2pD004',
    label: '',
    status: 'expired',
    useCount: 2,
    createdAt: '2026-02-01T12:00:00Z',
    expiresAt: '2026-02-02T12:00:00Z',
  },
  {
    id: 'inv005',
    token: 'Xm4cRt8wJ005',
    label: '테스트용',
    status: 'revoked',
    useCount: 0,
    createdAt: '2026-02-20T16:00:00Z',
    expiresAt: '2026-02-21T16:00:00Z',
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
  { id: 'm004', name: '김태희', nickname: '태희매니저' },
  { id: 'm005', name: '정재영', nickname: '재영매니저' },
  { id: 'm006', name: '최유리', nickname: '유리매니저' },
  { id: 'm007', name: '홍길동', nickname: '길동매니저' },
];

// ── Matches (순차 공개 프로세스) ────────────────────
// 가용시간 저장소 (proposal token → times)
const availableTimes = {};

const matches = [
  // 1) proposal_sent — B(receiver)만 프로필 조회 가능
  {
    matchId: 'match001',
    type: '1:1 소개팅',
    status: 'proposal_sent',
    note: '성격 잘 맞을 것 같아서 매칭합니다.',
    seekerA: {
      seekerId: 's001', seekerName: '김서연', seekerGender: 'female',
      managerName: 'Manager', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk01aB3cD1',
    },
    seekerB: {
      seekerId: 's002', seekerName: '이준혁', seekerGender: 'male',
      managerName: 'Manager', role: 'receiver',
      response: null, respondedAt: null,
      proposalToken: 'PrTk02eF4gH2',
    },
    createdAt: '2026-03-10T09:00:00Z',
  },
  // 2) proposal_accepted — B수락, A(proposer) 확인 대기
  {
    matchId: 'match002',
    type: '1:1 소개팅',
    status: 'proposal_accepted',
    note: '둘 다 여행 취미 보유.',
    seekerA: {
      seekerId: 's005', seekerName: '한소희', seekerGender: 'female',
      managerName: '박소영', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk03iJ5kL3',
    },
    seekerB: {
      seekerId: 's010', seekerName: '오태양', seekerGender: 'male',
      managerName: 'Manager', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-08T14:00:00Z',
      proposalToken: 'PrTk04mN6oP4',
    },
    createdAt: '2026-03-07T11:00:00Z',
  },
  // 3) scheduling — 양쪽 수락, 일정 조율 중 (B가 가용시간 등록 완료)
  {
    matchId: 'match003',
    type: '1:1 소개팅',
    status: 'scheduling',
    note: '운동 좋아하는 두 분.',
    seekerA: {
      seekerId: 's007', seekerName: '윤예은', seekerGender: 'female',
      managerName: 'Manager', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-09T18:00:00Z',
      proposalToken: 'PrTk07yZ9aB7',
    },
    seekerB: {
      seekerId: 's006', seekerName: '정우진', seekerGender: 'male',
      managerName: '박소영', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-09T12:00:00Z',
      proposalToken: 'PrTk08cD0eF8',
    },
    createdAt: '2026-03-09T10:00:00Z',
  },
  // 4) scheduled — 약속 확정됨
  {
    matchId: 'match004',
    type: '1:1 소개팅',
    status: 'scheduled',
    note: '감성적인 두 분을 매칭합니다.',
    seekerA: {
      seekerId: 's009', seekerName: '임수아', seekerGender: 'female',
      managerName: '이현우', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-02T10:00:00Z',
      proposalToken: 'PrTk09gH1iJ9',
    },
    seekerB: {
      seekerId: 's008', seekerName: '강도윤', seekerGender: 'male',
      managerName: 'Manager', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-02T14:00:00Z',
      proposalToken: 'PrTk10kL2mN0',
    },
    meetingDate: '2026-03-18T19:00:00Z',
    location: '청담동 르카페',
    endTime: '21:00',
    confirmedAt: '2026-03-05T10:00:00Z',
    createdAt: '2026-03-01T09:00:00Z',
  },
  // 5-1) scheduling — 양쪽 수락, B가 아직 가용시간 미등록
  {
    matchId: 'match006',
    type: '1:1 소개팅',
    status: 'scheduling',
    note: '새로 매칭된 두 분. 일정 조율 시작.',
    seekerA: {
      seekerId: 's010', seekerName: '오태양', seekerGender: 'male',
      managerName: 'Manager', role: 'proposer',
      response: 'accepted', respondedAt: '2026-03-13T16:00:00Z',
      proposalToken: 'PrTk11aNewA6',
    },
    seekerB: {
      seekerId: 's001', seekerName: '김서연', seekerGender: 'female',
      managerName: 'Manager', role: 'receiver',
      response: 'accepted', respondedAt: '2026-03-13T12:00:00Z',
      proposalToken: 'PrTk12bNewB6',
    },
    createdAt: '2026-03-12T10:00:00Z',
  },
  // 5) cancelled — 취소된 매칭
  {
    matchId: 'match005',
    type: null,
    status: 'cancelled',
    note: '',
    cancelReason: 'B가 프로필 확인 후 거절',
    seekerA: {
      seekerId: 's003', seekerName: '박지민', seekerGender: 'female',
      managerName: 'Manager', role: 'proposer',
      response: null, respondedAt: null,
      proposalToken: 'PrTk05qR7sT5',
    },
    seekerB: {
      seekerId: 's004', seekerName: '최민수', seekerGender: 'male',
      managerName: 'Manager', role: 'receiver',
      response: 'rejected', respondedAt: '2026-03-06T12:00:00Z',
      proposalToken: 'PrTk06uV8wX6',
    },
    createdAt: '2026-03-05T15:00:00Z',
  },
];

// match003: B(receiver)가 가용시간 등록 완료 상태
availableTimes['PrTk08cD0eF8'] = [
  { timeId: 'time-001', date: '2026-03-20', startTime: '14:00:00', selected: false },
  { timeId: 'time-002', date: '2026-03-20', startTime: '18:00:00', selected: false },
  { timeId: 'time-003', date: '2026-03-21', startTime: '12:00:00', selected: false },
  { timeId: 'time-004', date: '2026-03-21', startTime: '19:00:00', selected: false },
  { timeId: 'time-005', date: '2026-03-22', startTime: '14:00:00', selected: false },
];

// Build proposal lookup from matches
function getProposalByToken(token) {
  for (const m of matches) {
    if (m.seekerA.proposalToken === token) {
      const cp = clients.find((c) => c.id === m.seekerB.seekerId);
      return { match: m, side: 'A', participant: m.seekerA, counterpart: cp };
    }
    if (m.seekerB.proposalToken === token) {
      const cp = clients.find((c) => c.id === m.seekerA.seekerId);
      return { match: m, side: 'B', participant: m.seekerB, counterpart: cp };
    }
  }
  return null;
}

// ── Export Logs ─────────────────────────────────────────
const exportLogs = [
  { id: 'exp001', exportType: 'Excel', recordCount: 6, createdAt: '2026-03-01T09:00:00Z' },
  { id: 'exp002', exportType: 'Excel', recordCount: 8, createdAt: '2026-02-15T14:30:00Z' },
];

// ── Manager lookup map ────────────────────────────────
const managerMap = {
  [MANAGER_ID]: { id: MANAGER_ID, name: '나' },
  'm002': { id: 'm002', name: '박소영' },
  'm003': { id: 'm003', name: '이현우' },
};

function enrichClient(c) {
  const owner = managerMap[c.ownerManagerId] || { id: c.ownerManagerId, name: '알 수 없음' };
  return {
    nickname: c.nickname || null,
    photoIds: c.photoIds || [],
    ownerManager: owner,
    isOwner: c.ownerManagerId === MANAGER_ID,
  };
}

// ── Dashboard Summary ──────────────────────────────────
const dashboardSummary = {
  myClientCount: clients.filter((c) => c.ownerManagerId === MANAGER_ID).length,
  pendingCount: clients.filter((c) => c.approvalStatus === 'pending').length,
  connectedManagerCount: connections.length,
  activeInviteCount: invites.filter((i) => i.status === 'active').length,
  recentPendingClients: clients
    .filter((c) => c.approvalStatus === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((c) => ({ ...c, ...enrichClient(c) })),
};

const managerInfo = { id: MANAGER_ID, name: 'Manager', email: 'manager@knotsandlinks.kr' };

// ── Route Matcher ──────────────────────────────────────

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}

// Helper: find match that contains a given proposal token
function findMatchByProposalToken(token) {
  for (const m of matches) {
    if (m.seekerA.proposalToken === token) return { match: m, side: 'A' };
    if (m.seekerB.proposalToken === token) return { match: m, side: 'B' };
  }
  return null;
}

// Helper: get receiver's proposal token for a match
function getReceiverToken(m) {
  return m.seekerA.role === 'receiver' ? m.seekerA.proposalToken : m.seekerB.proposalToken;
}

export async function mockFetch(path, options = {}) {
  await delay(150 + Math.random() * 200);

  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const params = url.searchParams;

  // POST /api/v1/auth/login
  if (method === 'POST' && pathname === '/api/v1/auth/login') {
    const body = options.body || {};
    return { manager: { id: MANAGER_ID, email: body.email || 'manager@knotsandlinks.kr', name: (body.email || 'manager').split('@')[0] } };
  }

  // GET /api/v1/auth/me
  if (method === 'GET' && pathname === '/api/v1/auth/me') {
    return {
      id: MANAGER_ID, email: 'manager@knotsandlinks.kr', name: 'Manager',
      connections: connections.map((c) => ({ managerId: c.managerId, name: c.name, clientCount: c.clientCount, connectedAt: c.connectedAt })),
      myClientCount: clients.filter((c) => c.ownerManagerId === MANAGER_ID).length,
      createdAt: '2026-01-01T00:00:00Z',
    };
  }

  // POST /api/v1/auth/logout
  if (method === 'POST' && pathname === '/api/v1/auth/logout') return { success: true };
  // POST /api/v1/managers/signup
  if (method === 'POST' && pathname === '/api/v1/managers/signup') {
    const body = options.body || {};
    return { managerId: MANAGER_ID, success: true, nickname: body.nickname || null };
  }
  // POST /api/v1/managers/register
  if (method === 'POST' && pathname === '/api/v1/managers/register') {
    const body = options.body || {};
    return { managerId: MANAGER_ID, success: true, nickname: body.nickname || null };
  }
  // GET /api/v1/invites/{token}/validate
  if (method === 'GET' && pathname.match(/^\/api\/v1\/invites\/[^/]+\/validate$/)) return { valid: true, managerName: 'Manager' };
  // POST /api/v1/seekers
  if (method === 'POST' && pathname === '/api/v1/seekers') return { success: true, message: '프로필이 성공적으로 등록되었습니다.' };
  // POST /api/v1/connections/join
  if (method === 'POST' && pathname === '/api/v1/connections/join') return { success: true, message: '연결되었습니다.' };

  // POST /api/v1/connections/disconnect
  if (method === 'POST' && pathname === '/api/v1/connections/disconnect') {
    const body = options.body || {};
    const idx = connections.findIndex((c) => c.managerId === body.targetManagerId);
    if (idx !== -1) connections.splice(idx, 1);
    dashboardSummary.connectedManagerCount = connections.length;
    return { success: true };
  }

  // GET /api/v1/dashboard/summary
  if (method === 'GET' && pathname === '/api/v1/dashboard/summary') return dashboardSummary;
  // GET /api/v1/managers/:id
  if (method === 'GET' && /^\/api\/v1\/managers\/[^/]+$/.test(pathname)) return managerInfo;

  // GET /api/v1/seekers/:id (detail)
  if (method === 'GET' && /^\/api\/v1\/seekers\/[^?]+$/.test(pathname) && !pathname.endsWith('/seekers')) {
    const id = pathname.split('/').pop();
    const found = clients.find((c) => c.id === id);
    if (found) return { ...found, ...enrichClient(found) };
    throw new Error('Client not found');
  }

  // GET /api/v1/seekers (list)
  if (method === 'GET' && pathname === '/api/v1/seekers') {
    let filtered = [...clients];
    const nameQ = params.get('name');
    const phoneQ = params.get('phone');
    const gender = params.get('gender');
    const approval = params.get('approval');
    const owner = params.get('owner');
    const sort = params.get('sort') || 'createdAt:desc';
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '20', 10);
    if (nameQ) filtered = filtered.filter((c) => c.name.includes(nameQ));
    if (phoneQ) filtered = filtered.filter((c) => c.phone === phoneQ);
    if (gender) filtered = filtered.filter((c) => c.gender === gender);
    if (approval) filtered = filtered.filter((c) => c.approvalStatus === approval);
    if (owner === 'me') filtered = filtered.filter((c) => c.ownerManagerId === MANAGER_ID);
    else if (owner && owner !== 'all') filtered = filtered.filter((c) => c.ownerManagerId === owner);
    const [field, dir] = sort.split(':');
    filtered.sort((a, b) => { const va = a[field] || ''; const vb = b[field] || ''; return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1); });
    const start = (page - 1) * limit;
    return { data: filtered.slice(start, start + limit).map((c) => ({ ...c, ...enrichClient(c) })), pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } };
  }

  // GET /api/v1/connections
  if (method === 'GET' && pathname === '/api/v1/connections') return { connections };
  // GET /api/v1/invites
  if (method === 'GET' && pathname === '/api/v1/invites') return invites;
  // GET /api/v1/exports
  if (method === 'GET' && pathname === '/api/v1/exports') return exportLogs;

  // POST /api/v1/invites (create)
  if (method === 'POST' && pathname === '/api/v1/invites') {
    const body = options.body || {};
    const newInvite = { id: `inv${Date.now()}`, token: randomToken(), label: body.label || '', status: 'active', useCount: 0, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + (body.expiresInHours || 24) * 3600000).toISOString() };
    invites.unshift(newInvite);
    dashboardSummary.activeInviteCount = invites.filter((i) => i.status === 'active').length;
    return newInvite;
  }

  // DELETE /api/v1/invites/:id
  if (method === 'DELETE' && /^\/api\/v1\/invites\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    const inv = invites.find((i) => i.id === id);
    if (inv) inv.status = 'revoked';
    dashboardSummary.activeInviteCount = invites.filter((i) => i.status === 'active').length;
    return { success: true };
  }

  // GET /api/v1/connections/search?nickname=
  if (method === 'GET' && pathname === '/api/v1/connections/search') {
    const nickname = params.get('nickname');
    const found = searchableManagers.find((m) => m.nickname === nickname);
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
    const target = searchableManagers.find((m) => m.nickname === body.name);
    if (!target) throw Object.assign(new Error('해당 매니저를 찾을 수 없습니다.'), { status: 404 });
    const newReq = { id: `req${Date.now()}`, managerId: target.id, managerName: target.nickname, status: 'pending', message: body.message || '', createdAt: new Date().toISOString() };
    sentRequests.unshift(newReq);
    return newReq;
  }

  // POST /api/v1/connections/requests/:id/accept
  if (method === 'POST' && /^\/api\/v1\/connections\/requests\/[^/]+\/accept$/.test(pathname)) {
    const reqId = pathname.split('/').slice(-2, -1)[0];
    const req = connectionRequests.find((r) => r.id === reqId);
    if (req) { req.status = 'accepted'; connections.push({ id: `c${Date.now()}`, managerId: req.managerId, name: req.managerName, email: '', clientCount: 0, connectedAt: new Date().toISOString() }); dashboardSummary.connectedManagerCount = connections.length; }
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

  // PATCH /api/v1/seekers/:id/approval
  if (method === 'PATCH' && /\/api\/v1\/seekers\/[^/]+\/approval/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const c = clients.find((cl) => cl.id === id);
    if (c) c.approvalStatus = body.status;
    dashboardSummary.pendingCount = clients.filter((cl) => cl.approvalStatus === 'pending').length;
    return { success: true };
  }

  // PATCH /api/v1/seekers/:id/note
  if (method === 'PATCH' && /\/api\/v1\/seekers\/[^/]+\/note/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const c = clients.find((cl) => cl.id === id);
    if (c) c.managerNote = body.note;
    return { success: true };
  }

  // ── Match APIs ──

  // POST /api/v1/matches (create) → proposal_sent
  if (method === 'POST' && pathname === '/api/v1/matches') {
    const body = options.body || {};
    const seekerA = clients.find((c) => c.id === body.seekerAId);
    const seekerB = clients.find((c) => c.id === body.seekerBId);
    if (!seekerA || !seekerB) throw Object.assign(new Error('Seeker를 찾을 수 없습니다.'), { status: 404 });
    const tokenA = randomToken();
    const tokenB = randomToken();
    const newMatch = {
      matchId: `match${Date.now()}`, type: body.type || null, status: 'proposal_sent', note: body.note || '',
      seekerA: { seekerId: seekerA.id, seekerName: seekerA.name, seekerGender: seekerA.gender, managerName: (managerMap[seekerA.ownerManagerId] || {}).name || '알 수 없음', role: 'proposer', response: null, respondedAt: null, proposalToken: tokenA },
      seekerB: { seekerId: seekerB.id, seekerName: seekerB.name, seekerGender: seekerB.gender, managerName: (managerMap[seekerB.ownerManagerId] || {}).name || '알 수 없음', role: 'receiver', response: null, respondedAt: null, proposalToken: tokenB },
      createdAt: new Date().toISOString(),
    };
    matches.unshift(newMatch);
    return { matchId: newMatch.matchId, status: 'proposal_sent', seekerA: { seekerId: seekerA.id, seekerName: seekerA.name, proposalToken: tokenA }, seekerB: { seekerId: seekerB.id, seekerName: seekerB.name, proposalToken: tokenB } };
  }

  // GET /api/v1/matches/:matchId (detail)
  if (method === 'GET' && /^\/api\/v1\/matches\/[^/]+$/.test(pathname) && !pathname.endsWith('/matches')) {
    const id = pathname.split('/').pop();
    const found = matches.find((m) => m.matchId === id);
    if (!found) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    // Build schedule object from availableTimes
    const recToken = getReceiverToken(found);
    const times = availableTimes[recToken] || [];
    const pickedTime = times.find((t) => t.selected);
    const schedule = times.length > 0 ? {
      proposedBy: recToken,
      timeSlots: times.map((t) => ({ id: t.timeId, date: t.date, time: t.startTime.slice(0, 5) })),
      pickedSlot: pickedTime ? { id: pickedTime.timeId, date: pickedTime.date, time: pickedTime.startTime.slice(0, 5) } : null,
      venue: found.location || null,
      confirmedAt: found.confirmedAt || null,
    } : null;
    return { ...found, schedule };
  }

  // GET /api/v1/matches (list)
  if (method === 'GET' && pathname === '/api/v1/matches') {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('size') || '20', 10);
    const sorted = [...matches].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const start = (page - 1) * size;
    return { data: sorted.slice(start, start + size), pagination: { page, limit: size, total: sorted.length, totalPages: Math.ceil(sorted.length / size) } };
  }

  // POST /api/v1/matches/:matchId/confirm (매니저 일정 확정)
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/confirm$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    // Find selected time
    const recToken = getReceiverToken(m);
    const times = availableTimes[recToken] || [];
    const selected = times.find((t) => t.selected);
    m.location = body.location || '';
    m.endTime = body.endTime || '';
    m.confirmedAt = new Date().toISOString();
    if (selected) m.meetingDate = `${selected.date}T${selected.startTime}`;
    m.status = 'scheduled';
    return { success: true, message: '일정이 확정되었습니다.' };
  }

  // POST /api/v1/matches/:matchId/cancel
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/cancel$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    m.status = 'cancelled';
    m.cancelReason = body.reason || '';
    return { success: true, message: '매칭이 취소되었습니다.' };
  }

  // POST /api/v1/matches/:matchId/complete
  if (method === 'POST' && /^\/api\/v1\/matches\/[^/]+\/complete$/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const m = matches.find((match) => match.matchId === id);
    if (!m) throw Object.assign(new Error('매칭을 찾을 수 없습니다.'), { status: 404 });
    m.status = 'completed';
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

    // Access control: proposal_sent → receiver만 조회 가능
    if (m.status === 'proposal_sent' && myRole === 'proposer') {
      throw Object.assign(new Error('아직 상대방 응답을 기다리고 있습니다.'), { status: 403, body: { error: '9.005' } });
    }
    if (m.status === 'cancelled' || m.status === 'completed') {
      throw Object.assign(new Error('종료된 매칭입니다.'), { status: 410, body: { error: '9.003' } });
    }

    const birthYear = cp?.birthDate ? new Date(cp.birthDate).getFullYear() : null;
    const age = birthYear ? new Date().getFullYear() - birthYear : null;

    return {
      myName: participant.seekerName || (side === 'A' ? m.seekerA.seekerName : m.seekerB.seekerName),
      myRole,
      myResponse,
      matchStatus: m.status,
      counterpart: cp ? {
        nickname: cp.nickname || cp.name,
        gender: cp.gender,
        age,
        height: cp.height,
        occupation: cp.occupation,
        education: cp.education,
        location: cp.location,
        religion: cp.religion,
        mbti: cp.mbti,
        hobbies: cp.hobbies,
        introduction: cp.introduction,
        photoUrls: (cp.photoIds || []).map((id) => `https://picsum.photos/seed/${id}/400/400`),
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
    if (proposal.participant.role === 'receiver') {
      // receiver 수락 → proposal_accepted
      m.status = 'proposal_accepted';
      return { success: true, message: '응답이 등록되었습니다.' };
    } else {
      // proposer 수락 → scheduling
      m.status = 'scheduling';
      return { success: true, message: '응답이 등록되었습니다.' };
    }
  }

  // GET /api/v1/proposals/:token/available-times
  if (method === 'GET' && /^\/api\/v1\/proposals\/[^/]+\/available-times$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const result = findMatchByProposalToken(token);
    if (!result) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    // Return the receiver's available times
    const recToken = getReceiverToken(result.match);
    return { times: availableTimes[recToken] || [] };
  }

  // POST /api/v1/proposals/:token/available-times (receiver registers)
  if (method === 'POST' && /^\/api\/v1\/proposals\/[^/]+\/available-times$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const result = findMatchByProposalToken(token);
    if (!result) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const recToken = getReceiverToken(result.match);
    availableTimes[recToken] = (body.times || []).map((t, i) => ({
      timeId: `time-${Date.now()}-${i}`,
      date: t.date,
      startTime: t.startTime,
      selected: false,
    }));
    return { success: true, message: '가용시간이 등록되었습니다.' };
  }

  // POST /api/v1/proposals/:token/select-time (proposer selects)
  if (method === 'POST' && /^\/api\/v1\/proposals\/[^/]+\/select-time$/.test(pathname)) {
    const token = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const result = findMatchByProposalToken(token);
    if (!result) throw Object.assign(new Error('프로포절을 찾을 수 없습니다.'), { status: 404 });
    const recToken = getReceiverToken(result.match);
    const times = availableTimes[recToken] || [];
    const already = times.find((t) => t.selected);
    if (already) throw Object.assign(new Error('이미 시간이 선택된 매칭입니다.'), { status: 400, body: { error: '9.010' } });
    const slot = times.find((t) => t.timeId === body.timeId);
    if (!slot) throw Object.assign(new Error('해당 가용 시간을 찾을 수 없습니다.'), { status: 404, body: { error: '9.008' } });
    slot.selected = true;
    return { success: true, message: '시간이 선택되었습니다.' };
  }

  // fallback
  return {};
}
