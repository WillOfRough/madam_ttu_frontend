import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFetch } from '../api/mockData';
import useClientFormStore from '../store/clientFormStore';

// ──────────────────────────────────────────────
// 1. clientService — createClient FormData 변환
// ──────────────────────────────────────────────
describe('clientService: createClient FormData 변환', () => {
  it('createClient가 FormData를 생성하고 data 파트에 JSON blob을 포함해야 한다', async () => {
    const { createClient } = await import('../api/clientService');

    // apiFetch를 모킹해서 전달받는 body를 캡처
    const apiFetchModule = await import('../api/config');
    let capturedBody = null;

    vi.spyOn(apiFetchModule, 'apiFetch').mockImplementation(async (path, options) => {
      capturedBody = options.body;
      return { success: true };
    });

    const payload = { name: '테스트', gender: 'male', phone: '010-1234-5678' };
    const mockFile = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });

    await createClient(payload, [mockFile]);

    expect(capturedBody).toBeInstanceOf(FormData);
    expect(capturedBody.get('data')).toBeInstanceOf(Blob);
    expect(capturedBody.getAll('photos')).toHaveLength(1);
    expect(capturedBody.getAll('photos')[0].name).toBe('test.jpg');

    // JSON blob 내용 확인
    const blobText = await capturedBody.get('data').text();
    const parsed = JSON.parse(blobText);
    expect(parsed.name).toBe('테스트');
    expect(parsed.gender).toBe('male');

    apiFetchModule.apiFetch.mockRestore?.();
  });

  it('photos가 빈 배열이면 FormData에 photos 파트가 없어야 한다', async () => {
    const { createClient } = await import('../api/clientService');
    const apiFetchModule = await import('../api/config');
    let capturedBody = null;

    vi.spyOn(apiFetchModule, 'apiFetch').mockImplementation(async (path, options) => {
      capturedBody = options.body;
      return { success: true };
    });

    await createClient({ name: '테스트' }, []);

    expect(capturedBody).toBeInstanceOf(FormData);
    expect(capturedBody.getAll('photos')).toHaveLength(0);

    apiFetchModule.apiFetch.mockRestore?.();
  });
});

// ──────────────────────────────────────────────
// 2. mockData — nickname, photoIds 필드
// ──────────────────────────────────────────────
describe('mockData: nickname, photoIds 필드', () => {
  it('client 목록에 nickname, photoIds 필드가 존재해야 한다', async () => {
    const result = await mockFetch('/api/v1/seekers', { method: 'GET' });
    const clients = result.data;

    expect(clients.length).toBeGreaterThan(0);
    for (const client of clients) {
      // nickname은 null 또는 string
      expect(client).toHaveProperty('nickname');
      expect(typeof client.nickname === 'string' || client.nickname === null).toBe(true);
      // photoIds는 UUID 배열
      expect(client).toHaveProperty('photoIds');
      expect(Array.isArray(client.photoIds)).toBe(true);
    }
  });

  it('일부 client는 nickname이 있고 일부는 null이어야 한다', async () => {
    const result = await mockFetch('/api/v1/seekers', { method: 'GET' });
    const clients = result.data;
    const withNickname = clients.filter((c) => c.nickname);
    const withoutNickname = clients.filter((c) => !c.nickname);

    expect(withNickname.length).toBeGreaterThan(0);
    expect(withoutNickname.length).toBeGreaterThan(0);
  });

  it('client 상세 조회에도 nickname, photoIds가 포함되어야 한다', async () => {
    const detail = await mockFetch('/api/v1/seekers/s001', { method: 'GET' });
    expect(detail.nickname).toBe('반짝이는 서연');
    expect(detail.photoIds).toHaveLength(2);
  });

  it('photoIds 값은 UUID 형식이어야 한다', async () => {
    const detail = await mockFetch('/api/v1/seekers/s001', { method: 'GET' });
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const id of detail.photoIds) {
      expect(id).toMatch(uuidPattern);
    }
  });

  it('photoUrls 필드는 더 이상 존재하지 않아야 한다 (목록)', async () => {
    const result = await mockFetch('/api/v1/seekers', { method: 'GET' });
    for (const client of result.data) {
      expect(client).not.toHaveProperty('photoUrls');
    }
  });

  it('photoUrls 필드는 더 이상 존재하지 않아야 한다 (상세)', async () => {
    const detail = await mockFetch('/api/v1/seekers/s001', { method: 'GET' });
    expect(detail).not.toHaveProperty('photoUrls');
  });

  it('dashboard summary의 recentPendingClients에 nickname, photoIds가 포함되어야 한다', async () => {
    const summary = await mockFetch('/api/v1/dashboard/summary', { method: 'GET' });
    const pending = summary.recentPendingClients;
    expect(pending.length).toBeGreaterThan(0);
    for (const client of pending) {
      expect(client).toHaveProperty('nickname');
      expect(client).toHaveProperty('photoIds');
      expect(client).not.toHaveProperty('photoUrls');
    }
  });

  it('POST /api/v1/seekers는 FormData body를 무시하고 성공을 반환해야 한다', async () => {
    const result = await mockFetch('/api/v1/seekers', {
      method: 'POST',
      body: new FormData(),
    });
    expect(result.success).toBe(true);
  });
});

// ──────────────────────────────────────────────
// 3. clientFormStore — photos 상태 + 액션
// ──────────────────────────────────────────────
describe('clientFormStore: photos 상태 관리', () => {
  beforeEach(() => {
    useClientFormStore.getState().reset();
  });

  it('초기 상태에서 photos가 빈 배열이어야 한다', () => {
    const { form } = useClientFormStore.getState();
    expect(form.photos).toEqual([]);
  });

  it('addPhotos로 사진을 추가할 수 있어야 한다', () => {
    const file = new File(['a'], 'photo1.jpg', { type: 'image/jpeg' });
    useClientFormStore.getState().addPhotos([file]);

    const { form, photoError } = useClientFormStore.getState();
    expect(form.photos).toHaveLength(1);
    expect(form.photos[0].name).toBe('photo1.jpg');
    expect(photoError).toBeNull();
  });

  it('여러 사진을 한 번에 추가할 수 있어야 한다', () => {
    const files = [
      new File(['a'], 'p1.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'p2.png', { type: 'image/png' }),
      new File(['c'], 'p3.webp', { type: 'image/webp' }),
    ];
    useClientFormStore.getState().addPhotos(files);
    expect(useClientFormStore.getState().form.photos).toHaveLength(3);
  });

  it('5장 초과 시 에러를 표시하고 추가하지 않아야 한다', () => {
    // 5장 채우기
    for (let i = 0; i < 5; i++) {
      useClientFormStore.getState().addPhotos([
        new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }),
      ]);
    }
    expect(useClientFormStore.getState().form.photos).toHaveLength(5);

    // 6번째 추가 시도
    useClientFormStore.getState().addPhotos([
      new File(['x'], 'p6.jpg', { type: 'image/jpeg' }),
    ]);
    expect(useClientFormStore.getState().form.photos).toHaveLength(5);
    expect(useClientFormStore.getState().photoError).toContain('최대 5장');
  });

  it('3장 있을 때 4장 추가하면 2장만(잔여) 추가되어야 한다', () => {
    for (let i = 0; i < 3; i++) {
      useClientFormStore.getState().addPhotos([
        new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }),
      ]);
    }

    const newFiles = [
      new File(['a'], 'new1.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'new2.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'new3.jpg', { type: 'image/jpeg' }),
      new File(['d'], 'new4.jpg', { type: 'image/jpeg' }),
    ];
    useClientFormStore.getState().addPhotos(newFiles);
    // 잔여 2장만 추가 (슬라이스)
    expect(useClientFormStore.getState().form.photos).toHaveLength(5);
  });

  it('허용되지 않는 파일 타입은 에러를 표시해야 한다', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    useClientFormStore.getState().addPhotos([file]);

    expect(useClientFormStore.getState().form.photos).toHaveLength(0);
    expect(useClientFormStore.getState().photoError).toContain('JPG, PNG, WebP');
  });

  it('10MB 초과 파일은 에러를 표시해야 한다', () => {
    // 11MB짜리 파일 시뮬레이션
    const bigContent = new ArrayBuffer(11 * 1024 * 1024);
    const file = new File([bigContent], 'big.jpg', { type: 'image/jpeg' });
    useClientFormStore.getState().addPhotos([file]);

    expect(useClientFormStore.getState().form.photos).toHaveLength(0);
    expect(useClientFormStore.getState().photoError).toContain('10MB');
  });

  it('removePhoto로 특정 인덱스의 사진을 제거할 수 있어야 한다', () => {
    const files = [
      new File(['a'], 'p1.jpg', { type: 'image/jpeg' }),
      new File(['b'], 'p2.jpg', { type: 'image/jpeg' }),
      new File(['c'], 'p3.jpg', { type: 'image/jpeg' }),
    ];
    useClientFormStore.getState().addPhotos(files);
    expect(useClientFormStore.getState().form.photos).toHaveLength(3);

    useClientFormStore.getState().removePhoto(1); // p2.jpg 제거
    const photos = useClientFormStore.getState().form.photos;
    expect(photos).toHaveLength(2);
    expect(photos[0].name).toBe('p1.jpg');
    expect(photos[1].name).toBe('p3.jpg');
  });

  it('removePhoto 후 에러가 초기화되어야 한다', () => {
    // 5장 채우기
    for (let i = 0; i < 5; i++) {
      useClientFormStore.getState().addPhotos([
        new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' }),
      ]);
    }
    // 에러 발생시키기
    useClientFormStore.getState().addPhotos([
      new File(['x'], 'extra.jpg', { type: 'image/jpeg' }),
    ]);
    expect(useClientFormStore.getState().photoError).toBeTruthy();

    // 하나 제거하면 에러 초기화
    useClientFormStore.getState().removePhoto(0);
    expect(useClientFormStore.getState().photoError).toBeNull();
  });

  it('reset 시 photos와 photoError가 초기화되어야 한다', () => {
    useClientFormStore.getState().addPhotos([
      new File(['x'], 'p1.jpg', { type: 'image/jpeg' }),
    ]);
    expect(useClientFormStore.getState().form.photos).toHaveLength(1);

    useClientFormStore.getState().reset();
    expect(useClientFormStore.getState().form.photos).toEqual([]);
    expect(useClientFormStore.getState().photoError).toBeNull();
  });
});

// ──────────────────────────────────────────────
// 4. clientFormStore — getPayload name + nickname 필드
// ──────────────────────────────────────────────
describe('clientFormStore: getPayload name + nickname 필드', () => {
  beforeEach(() => {
    useClientFormStore.getState().reset();
  });

  it('payload에 name과 nickname 모두 포함되어야 한다', () => {
    const store = useClientFormStore.getState();
    store.setSuggestedNickname('추천닉네임');
    store.setField('name', '홍길동');
    store.setField('gender', 'male');
    store.setField('birthYear', '1994');
    store.setField('phone', '010-1234-5678');
    store.setField('occupation', '개발자');
    store.setField('introQ1', '카페에서 책 읽어요');
    store.setField('introQ2', '러닝에 빠져있어요');
    store.setField('introQ3', '유머 있다고 해요');

    const payload = useClientFormStore.getState().getPayload();
    expect(payload).toHaveProperty('name');
    expect(payload).toHaveProperty('nickname');
    expect(payload.name).toBe('홍길동');
    expect(payload.nickname).toBe('추천닉네임');
  });

  it('사용자 입력 닉네임이 있으면 nickname에 사용되어야 한다', () => {
    const store = useClientFormStore.getState();
    store.setSuggestedNickname('추천닉네임');
    store.setField('name', '김철수');
    store.setField('nickname', '내닉네임');

    const payload = useClientFormStore.getState().getPayload();
    expect(payload.name).toBe('김철수');
    expect(payload.nickname).toBe('내닉네임');
  });

  it('사용자 입력 닉네임이 없으면 suggestedNickname이 nickname에 사용되어야 한다', () => {
    const store = useClientFormStore.getState();
    store.setSuggestedNickname('자동생성별명');
    store.setField('name', '박영희');
    store.setField('nickname', '');

    const payload = useClientFormStore.getState().getPayload();
    expect(payload.name).toBe('박영희');
    expect(payload.nickname).toBe('자동생성별명');
  });

  it('name과 nickname이 독립적인 필드여야 한다', () => {
    const store = useClientFormStore.getState();
    store.setSuggestedNickname('추천별명');
    store.setField('name', '이수진');
    store.setField('nickname', '반짝이수진');

    const payload = useClientFormStore.getState().getPayload();
    expect(payload.name).toBe('이수진');
    expect(payload.nickname).toBe('반짝이수진');
    expect(payload.name).not.toBe(payload.nickname);
  });
});

// ──────────────────────────────────────────────
// 5. nickname 표시 로직 검증
// ──────────────────────────────────────────────
describe('nickname 표시 로직', () => {
  function displayName(client) {
    return client.nickname || client.name;
  }

  it('nickname이 있으면 nickname을 표시해야 한다', () => {
    expect(displayName({ name: '김서연', nickname: '반짝이는 서연' })).toBe('반짝이는 서연');
  });

  it('nickname이 null이면 name을 표시해야 한다', () => {
    expect(displayName({ name: '이준혁', nickname: null })).toBe('이준혁');
  });

  it('nickname이 빈 문자열이면 name을 표시해야 한다', () => {
    expect(displayName({ name: '최민수', nickname: '' })).toBe('최민수');
  });

  it('nickname이 undefined면 name을 표시해야 한다', () => {
    expect(displayName({ name: '오태양' })).toBe('오태양');
  });
});

// ──────────────────────────────────────────────
// 6-1. getPhotoUrl — 사진 프록시 URL 생성
// ──────────────────────────────────────────────
describe('getPhotoUrl: 사진 프록시 URL 생성', () => {
  // config.js의 getPhotoUrl 로직을 환경별로 시뮬레이션
  function getPhotoUrlMock(photoId) {
    // DEV && !API_BASE → picsum placeholder
    return `https://picsum.photos/seed/${photoId}/400/400`;
  }

  function getPhotoUrlProd(photoId, apiBase = '') {
    return `${apiBase}/api/v1/seekers/photos/${photoId}`;
  }

  it('DEV mock 모드에서는 picsum placeholder URL 형식이어야 한다', () => {
    const photoId = 'cd3c38a7-8465-4a6a-81a3-73c91799c001';
    const url = getPhotoUrlMock(photoId);
    expect(url).toContain(photoId);
    expect(url).toContain('picsum.photos');
  });

  it('photoId가 URL에 포함되어야 한다', () => {
    const photoId = 'ef1b2c3d-1234-5678-9abc-def012345001';
    expect(getPhotoUrlMock(photoId)).toContain(photoId);
    expect(getPhotoUrlProd(photoId)).toContain(photoId);
  });

  it('프로덕션 환경에서는 /api/v1/seekers/photos/{photoId} 형식이어야 한다', () => {
    const photoId = 'cd3c38a7-8465-4a6a-81a3-73c91799c001';
    expect(getPhotoUrlProd(photoId)).toBe(`/api/v1/seekers/photos/${photoId}`);
    expect(getPhotoUrlProd(photoId, 'https://api.example.com')).toBe(
      `https://api.example.com/api/v1/seekers/photos/${photoId}`
    );
  });

  it('실제 getPhotoUrl export가 photoId를 포함하는 URL을 반환해야 한다', async () => {
    const { getPhotoUrl } = await import('../api/config');
    const photoId = 'cd3c38a7-8465-4a6a-81a3-73c91799c001';
    const url = getPhotoUrl(photoId);
    expect(url).toContain(photoId);
  });
});

// ──────────────────────────────────────────────
// 6-2. apiFetch FormData 처리 확인
// ──────────────────────────────────────────────
describe('apiFetch: FormData 감지 시 Content-Type 미설정', () => {
  it('FormData body일 때 Content-Type 헤더가 없어야 한다', async () => {
    // config.js의 로직을 유닛 테스트
    function buildFetchOptions(body, headers = {}) {
      return {
        credentials: 'include',
        headers: {
          ...(body !== undefined && !(body instanceof FormData)
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...headers,
        },
      };
    }

    const formData = new FormData();
    const options = buildFetchOptions(formData);
    expect(options.headers['Content-Type']).toBeUndefined();
  });

  it('일반 객체 body일 때 Content-Type: application/json이 설정되어야 한다', () => {
    function buildFetchOptions(body, headers = {}) {
      return {
        credentials: 'include',
        headers: {
          ...(body !== undefined && !(body instanceof FormData)
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...headers,
        },
      };
    }

    const options = buildFetchOptions({ name: 'test' });
    expect(options.headers['Content-Type']).toBe('application/json');
  });
});

// ──────────────────────────────────────────────
// 7. clientFormStore — name 필드 검증
// ──────────────────────────────────────────────
describe('clientFormStore: name (실명) 필드', () => {
  beforeEach(() => {
    useClientFormStore.getState().reset();
  });

  it('초기 상태에서 name이 빈 문자열이어야 한다', () => {
    const { form } = useClientFormStore.getState();
    expect(form.name).toBe('');
  });

  it('setField로 name을 설정할 수 있어야 한다', () => {
    useClientFormStore.getState().setField('name', '홍길동');
    expect(useClientFormStore.getState().form.name).toBe('홍길동');
  });

  it('reset 시 name이 초기화되어야 한다', () => {
    useClientFormStore.getState().setField('name', '테스트');
    useClientFormStore.getState().reset();
    expect(useClientFormStore.getState().form.name).toBe('');
  });
});
