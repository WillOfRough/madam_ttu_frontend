/**
 * DEV 모드 전용 목 데이터
 */

const MANAGER_ID = '00000000-0000-0000-0000-000000000001';

// ── Seekers ────────────────────────────────────────────
const seekers = [
  {
    id: 's001',
    name: '김서연',
    gender: 'female',
    birthDate: '1995-03-12',
    phone: '010-9876-5432',
    email: 'seoyeon.k@gmail.com',
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
    approval: 'approved',
    managerNote: '밝고 활발한 성격. 대화 능력 좋음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-28T09:00:00Z',
  },
  {
    id: 's002',
    name: '이준혁',
    gender: 'male',
    birthDate: '1993-07-22',
    phone: '010-1234-5678',
    email: 'junhyuk.lee@naver.com',
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
    approval: 'approved',
    managerNote: '차분하고 진중한 인상. 연봉 높음.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-25T14:30:00Z',
  },
  {
    id: 's003',
    name: '박지민',
    gender: 'female',
    birthDate: '1996-11-05',
    phone: '010-5555-1234',
    email: 'jimin.park@outlook.com',
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
    approval: 'pending',
    managerNote: '',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-03-05T11:20:00Z',
  },
  {
    id: 's004',
    name: '최민수',
    gender: 'male',
    birthDate: '1992-01-30',
    phone: '010-7777-8888',
    email: 'minsu.choi@gmail.com',
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
    approval: 'pending',
    managerNote: '',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-03-04T16:45:00Z',
  },
  {
    id: 's005',
    name: '한소희',
    gender: 'female',
    birthDate: '1994-08-18',
    phone: '010-3333-4444',
    email: 'sohee.han@kakao.com',
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
    approval: 'approved',
    managerNote: '자유로운 영혼. 비주얼 좋음.',
    ownerManagerId: 'm002',
    createdAt: '2026-02-20T08:15:00Z',
  },
  {
    id: 's006',
    name: '정우진',
    gender: 'male',
    birthDate: '1991-04-09',
    phone: '010-2222-9999',
    email: 'woojin.j@gmail.com',
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
    approval: 'approved',
    managerNote: '스펙 최상급. 매너 좋음.',
    ownerManagerId: 'm002',
    createdAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 's007',
    name: '윤예은',
    gender: 'female',
    birthDate: '1997-06-25',
    phone: '010-8888-1111',
    email: 'yeeun.y@naver.com',
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
    approval: 'pending',
    managerNote: '',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-03-06T13:00:00Z',
  },
  {
    id: 's008',
    name: '강도윤',
    gender: 'male',
    birthDate: '1993-12-03',
    phone: '010-6666-5555',
    email: 'doyun.kang@gmail.com',
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
    approval: 'rejected',
    managerNote: '프로필 사진 부적절. 재신청 요청.',
    ownerManagerId: MANAGER_ID,
    createdAt: '2026-02-15T17:30:00Z',
  },
  {
    id: 's009',
    name: '임수아',
    gender: 'female',
    birthDate: '1995-09-14',
    phone: '010-4444-7777',
    email: 'sua.im@gmail.com',
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
    approval: 'approved',
    managerNote: '성격 정말 좋음. 적극 추천.',
    ownerManagerId: 'm003',
    createdAt: '2026-02-22T09:45:00Z',
  },
  {
    id: 's010',
    name: '오태양',
    gender: 'male',
    birthDate: '1990-02-28',
    phone: '010-1111-2222',
    email: 'taeyang.oh@gmail.com',
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
    approval: 'approved',
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
    email: 'soyoung@findmyone.kr',
    seekerCount: 7,
    connectedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'c002',
    managerId: 'm003',
    name: '이현우',
    email: 'hyunwoo@findmyone.kr',
    seekerCount: 4,
    connectedAt: '2026-02-01T14:00:00Z',
  },
];

// ── Invites (Seeker 초대 링크) ─────────────────────────
const invites = [
  {
    id: 'inv001',
    token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001',
    label: '김서연 지인 소개용',
    status: 'used',
    createdAt: '2026-02-27T09:00:00Z',
    expiresAt: '2026-02-28T09:00:00Z',
  },
  {
    id: 'inv002',
    token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002',
    label: '3월 신규 모집',
    status: 'active',
    createdAt: '2026-03-05T10:00:00Z',
    expiresAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'inv003',
    token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0003',
    label: '회사 동료 추천',
    status: 'active',
    createdAt: '2026-03-06T08:00:00Z',
    expiresAt: '2026-03-07T08:00:00Z',
  },
  {
    id: 'inv004',
    token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0004',
    label: '',
    status: 'expired',
    createdAt: '2026-02-01T12:00:00Z',
    expiresAt: '2026-02-02T12:00:00Z',
  },
  {
    id: 'inv005',
    token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0005',
    label: '테스트용',
    status: 'revoked',
    createdAt: '2026-02-20T16:00:00Z',
    expiresAt: '2026-02-21T16:00:00Z',
  },
];

// ── Export Logs ─────────────────────────────────────────
const exportLogs = [
  { id: 'exp001', type: 'Excel', count: 6, createdAt: '2026-03-01T09:00:00Z' },
  { id: 'exp002', type: 'Excel', count: 8, createdAt: '2026-02-15T14:30:00Z' },
];

// ── Manager lookup map ────────────────────────────────
const managerMap = {
  [MANAGER_ID]: { id: MANAGER_ID, name: '나' },
  'm002': { id: 'm002', name: '박소영' },
  'm003': { id: 'm003', name: '이현우' },
};

function enrichSeeker(s) {
  const owner = managerMap[s.ownerManagerId] || { id: s.ownerManagerId, name: '알 수 없음' };
  return {
    ownerManager: owner,
    isOwner: s.ownerManagerId === MANAGER_ID,
  };
}

// ── Dashboard Summary ──────────────────────────────────
const dashboardSummary = {
  mySeekerCount: seekers.filter((s) => s.ownerManagerId === MANAGER_ID).length,
  pendingCount: seekers.filter((s) => s.approval === 'pending').length,
  connectionCount: connections.length,
  activeInviteCount: invites.filter((i) => i.status === 'active').length,
  recentPendingSeekers: seekers
    .filter((s) => s.approval === 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map((s) => ({ ...s, ...enrichSeeker(s) })),
};

// ── Manager Info ───────────────────────────────────────
const managerInfo = {
  id: MANAGER_ID,
  name: 'Manager',
  email: 'manager@findmyone.kr',
  connectionCount: connections.length,
  seekerCount: seekers.filter((s) => s.ownerManagerId === MANAGER_ID).length,
};

// ── Route Matcher ──────────────────────────────────────

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mockFetch(path, options = {}) {
  await delay(150 + Math.random() * 200);

  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const params = url.searchParams;

  // POST /api/auth/login
  if (method === 'POST' && pathname === '/api/auth/login') {
    const body = options.body || {};
    return {
      managerId: MANAGER_ID,
      id: MANAGER_ID,
      email: body.email || 'manager@findmyone.kr',
      name: (body.email || 'manager').split('@')[0],
    };
  }

  // GET /api/auth/me
  if (method === 'GET' && pathname === '/api/auth/me') {
    return {
      managerId: MANAGER_ID,
      id: MANAGER_ID,
      email: 'manager@findmyone.kr',
      name: 'Manager',
    };
  }

  // POST /api/auth/logout
  if (method === 'POST' && pathname === '/api/auth/logout') {
    return { success: true };
  }

  // POST /api/auth/signup (register)
  if (method === 'POST' && pathname === '/api/auth/signup') {
    return { managerId: MANAGER_ID, success: true };
  }

  // GET /api/invites/{token}/validate (token validation)
  if (method === 'GET' && pathname.match(/^\/api\/invites\/[^/]+\/validate$/)) {
    return { valid: true, type: 'seeker', managerName: 'Manager' };
  }

  // POST /api/seekers (create seeker)
  if (method === 'POST' && pathname === '/api/seekers') {
    return { success: true, message: '프로필이 성공적으로 등록되었습니다.' };
  }

  // POST /api/connections/join
  if (method === 'POST' && pathname === '/api/connections/join') {
    return { success: true, message: '연결되었습니다.' };
  }

  // POST /api/connections/disconnect
  if (method === 'POST' && pathname === '/api/connections/disconnect') {
    const body = options.body || {};
    const idx = connections.findIndex((c) => c.managerId === body.targetManagerId);
    if (idx !== -1) connections.splice(idx, 1);
    dashboardSummary.connectionCount = connections.length;
    return { success: true };
  }

  // GET /api/managers/:id/dashboard
  if (method === 'GET' && /^\/api\/managers\/[^/]+\/dashboard$/.test(pathname)) {
    return dashboardSummary;
  }

  // GET /api/managers/:id
  if (method === 'GET' && /^\/api\/managers\/[^/]+$/.test(pathname)) {
    return managerInfo;
  }

  // GET /api/seekers/:id  (detail)
  if (method === 'GET' && /^\/api\/seekers\/[^?]+$/.test(pathname) && !pathname.endsWith('/seekers')) {
    const id = pathname.split('/').pop();
    const found = seekers.find((s) => s.id === id);
    if (found) return { ...found, ...enrichSeeker(found) };
    throw new Error('Seeker not found');
  }

  // GET /api/seekers  (list)
  if (method === 'GET' && pathname === '/api/seekers') {
    let filtered = [...seekers];
    const gender = params.get('gender');
    const approval = params.get('approval');
    const owner = params.get('owner');
    const sort = params.get('sort') || 'createdAt:desc';
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '20', 10);

    if (gender) filtered = filtered.filter((s) => s.gender === gender);
    if (approval) filtered = filtered.filter((s) => s.approval === approval);
    if (owner === 'me') {
      filtered = filtered.filter((s) => s.ownerManagerId === MANAGER_ID);
    } else if (owner && owner !== 'all') {
      filtered = filtered.filter((s) => s.ownerManagerId === owner);
    }

    const [field, dir] = sort.split(':');
    filtered.sort((a, b) => {
      const va = a[field] || '';
      const vb = b[field] || '';
      return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });

    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map((s) => ({ ...s, ...enrichSeeker(s) })),
      totalCount: filtered.length,
    };
  }

  // GET /api/connections
  if (method === 'GET' && pathname === '/api/connections') {
    return { data: connections };
  }

  // GET /api/invites
  if (method === 'GET' && pathname === '/api/invites') {
    return { data: invites };
  }

  // GET /api/exports
  if (method === 'GET' && pathname === '/api/exports') {
    return exportLogs;
  }

  // POST /api/invites  (create)
  if (method === 'POST' && pathname === '/api/invites') {
    const body = options.body || {};
    const newInvite = {
      id: `inv${Date.now()}`,
      token: crypto.randomUUID(),
      label: body.label || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (body.expiresInHours || 24) * 3600000).toISOString(),
    };
    invites.unshift(newInvite);
    dashboardSummary.activeInviteCount = invites.filter((i) => i.status === 'active').length;
    return newInvite;
  }

  // DELETE /api/invites/:id
  if (method === 'DELETE' && /^\/api\/invites\/[^/]+$/.test(pathname)) {
    const id = pathname.split('/').pop();
    const inv = invites.find((i) => i.id === id);
    if (inv) inv.status = 'revoked';
    dashboardSummary.activeInviteCount = invites.filter((i) => i.status === 'active').length;
    return { success: true };
  }

  // POST /api/connections/invite
  if (method === 'POST' && pathname === '/api/connections/invite') {
    return { token: crypto.randomUUID() };
  }

  // PATCH /api/seekers/:id/approval
  if (method === 'PATCH' && /\/api\/seekers\/[^/]+\/approval/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const s = seekers.find((sk) => sk.id === id);
    if (s) s.approval = body.status;
    dashboardSummary.pendingCount = seekers.filter((sk) => sk.approval === 'pending').length;
    return { success: true };
  }

  // PATCH /api/seekers/:id/note
  if (method === 'PATCH' && /\/api\/seekers\/[^/]+\/note/.test(pathname)) {
    const id = pathname.split('/').slice(-2, -1)[0];
    const body = options.body || {};
    const s = seekers.find((sk) => sk.id === id);
    if (s) s.managerNote = body.note;
    return { success: true };
  }

  // fallback
  return {};
}
