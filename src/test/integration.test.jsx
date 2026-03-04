import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import useFormStore from '../store/formStore';
import useAdminStore from '../store/adminStore';
import mockUsers from '../data/mockUsers';
import { getMatchRecommendations } from '../utils/matchScore';

// Mock the auth service
vi.mock('../api/authService', () => ({
  login: vi.fn(({ email, password }) => {
    if (email === 'admin@madam.mj' && password === 'madam2026') {
      return Promise.resolve({ accountId: 'admin-1', email });
    }
    return Promise.reject(new Error('Invalid credentials'));
  }),
  logout: vi.fn(() => Promise.resolve()),
}));

describe('Integration - 사용자 플로우 시뮬레이션', () => {
  beforeEach(() => {
    useFormStore.getState().resetForm();
  });

  it('전체 폼 입력 플로우: 기본정보 → 성격 → 선호 → 완료', () => {
    const store = useFormStore.getState();

    // Start at Step 0 (account), simulate login done by moving to Step 1
    expect(store.currentStep).toBe(0);
    store.nextStep(); // → Step 1

    // Step 1: 기본 정보 입력
    store.updateField('gender', 'male');
    store.updateField('name', '테스트 유저');
    store.updateField('nickname', '테스트닉네임');
    store.updateField('birthYear', '1998');
    store.updateField('height', '175');
    store.updateField('location', '서울 강남구');
    store.updateField('education', 'bachelor');
    store.updateField('job', '소프트웨어 엔지니어');
    store.updateField('religion', 'none');
    store.updateField('drinking', 'sometimes');
    store.updateField('smoking', 'no');
    store.updateField('mbti', 'INTJ');

    // 성격 키워드 5개 선택
    ['#다정한_츤데레', '#프로직장인', '#유머_담당', '#감성_충만', '#호기심_대마왕'].forEach(kw =>
      store.togglePersonality(kw)
    );

    // 취미 3개 선택
    ['독서', '운동/헬스', '카페 탐방'].forEach(h =>
      store.toggleHobby(h)
    );

    // 자기소개
    store.updateField('intro', '조용한 카페에서 책 읽는 것을 좋아합니다.');

    // 사진 3장 추가
    store.addPhotos([
      { preview: 'test1.jpg' },
      { preview: 'test2.jpg' },
      { preview: 'test3.jpg' },
    ]);

    // 상태 검증
    const data = useFormStore.getState().formData;
    expect(data.gender).toBe('male');
    expect(data.name).toBe('테스트 유저');
    expect(data.personality).toHaveLength(5);
    expect(data.hobbies).toHaveLength(3);
    expect(data.photos).toHaveLength(3);

    // Step 1 → Step 2
    useFormStore.getState().nextStep();
    expect(useFormStore.getState().currentStep).toBe(2);

    // Step 2: 선호 조건 설정
    store.updatePreference('priorities', [
      'personality', 'values', 'humor', 'appearance', 'lifestyle', 'job'
    ]);
    store.updatePreference('religionPref', 'any');
    store.updatePreference('drinkingPref', 'moderate');
    store.updatePreference('smokingPref', 'no');

    // 선호 조건 검증
    const prefs = useFormStore.getState().formData.preferences;
    expect(prefs.priorities[0]).toBe('personality');
    expect(prefs.religionPref).toBe('any');
    expect(prefs.drinkingPref).toBe('moderate');

    // Step 2 → Complete
    useFormStore.getState().nextStep();
    expect(useFormStore.getState().currentStep).toBe(3);
  });

  it('뒤로가기 플로우: Step 2에서 Step 1로 돌아갈 때 데이터 유지', () => {
    const store = useFormStore.getState();
    store.setStep(1); // Start at Step 1 (after account registration)
    store.updateField('name', '홍길동');
    store.updateField('gender', 'male');
    store.togglePersonality('#다정한_츤데레');

    store.nextStep(); // → Step 2
    expect(useFormStore.getState().currentStep).toBe(2);

    store.prevStep(); // → Step 1
    expect(useFormStore.getState().currentStep).toBe(1);

    // 데이터가 유지되는지 확인
    const data = useFormStore.getState().formData;
    expect(data.name).toBe('홍길동');
    expect(data.gender).toBe('male');
    expect(data.personality).toContain('#다정한_츤데레');
  });
});

describe('Integration - 관리자 플로우 시뮬레이션', () => {
  beforeEach(async () => {
    await useAdminStore.getState().logout();
  });

  it('관리자 전체 플로우: 로그인 → 필터링 → 프로필 조회 → 매칭', async () => {
    // 1. 로그인
    const loginResult = await useAdminStore.getState().login({ email: 'admin@madam.mj', password: 'madam2026' });
    expect(loginResult).toBe(true);
    expect(useAdminStore.getState().isAuthenticated).toBe(true);

    // 2. 남성 필터링
    useAdminStore.getState().setGenderFilter('male');
    const malesFiltered = mockUsers.filter(u => u.gender === 'male');
    expect(malesFiltered).toHaveLength(10);

    // 3. 검색
    useAdminStore.getState().setSearchQuery('김');
    const searchResult = mockUsers.filter(u =>
      u.gender === 'male' && u.name.includes('김')
    );
    expect(searchResult.length).toBeGreaterThan(0);

    // 4. 특정 회원 선택 (김도윤 m1)
    useAdminStore.getState().setSelectedUser('m1');
    expect(useAdminStore.getState().selectedUserId).toBe('m1');

    const selectedUser = mockUsers.find(u => u.id === 'm1');
    expect(selectedUser.name).toBe('김도윤');

    // 5. 매칭 시뮬레이션
    useAdminStore.getState().clearSelection();
    useAdminStore.getState().setMatchSource('m1');

    const recs = getMatchRecommendations(selectedUser, mockUsers, 5);
    expect(recs.length).toBe(5);
    expect(recs[0].avgScore).toBeGreaterThanOrEqual(recs[4].avgScore);

    // 6. 추천 1순위 프로필 보기
    const topMatch = recs[0];
    useAdminStore.getState().clearMatchSource();
    useAdminStore.getState().setSelectedUser(topMatch.user.id);
    expect(useAdminStore.getState().selectedUserId).toBe(topMatch.user.id);

    // 7. 로그아웃
    await useAdminStore.getState().logout();
    expect(useAdminStore.getState().isAuthenticated).toBe(false);
    expect(useAdminStore.getState().selectedUserId).toBeNull();
    expect(useAdminStore.getState().matchSourceId).toBeNull();
  });

  it('필터 조합: 성별 + 검색어', async () => {
    await useAdminStore.getState().login({ email: 'admin@madam.mj', password: 'madam2026' });
    useAdminStore.getState().setGenderFilter('female');
    useAdminStore.getState().setSearchQuery('디자이너');

    const results = mockUsers.filter(u => {
      if (u.gender !== 'female') return false;
      return u.job.includes('디자이너');
    });

    expect(results.length).toBeGreaterThan(0);
    results.forEach(u => {
      expect(u.gender).toBe('female');
      expect(u.job).toContain('디자이너');
    });
  });
});

describe('Integration - 매칭 알고리즘 통합 검증', () => {
  it('모든 남성에 대해 매칭 추천이 정상 동작', () => {
    const males = mockUsers.filter(u => u.gender === 'male');

    males.forEach(male => {
      const recs = getMatchRecommendations(male, mockUsers, 5);

      // 추천 결과가 있어야 함
      expect(recs.length, `${male.name}: 추천 결과 없음`).toBeGreaterThan(0);

      // 모두 여성이어야 함
      recs.forEach(rec => {
        expect(rec.user.gender, `${male.name} → ${rec.user.name}: 성별 오류`).toBe('female');
      });

      // 점수가 유효해야 함
      recs.forEach(rec => {
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(100);
        expect(rec.reverseScore).toBeGreaterThanOrEqual(0);
        expect(rec.reverseScore).toBeLessThanOrEqual(100);
      });

      // 내림차순 정렬이어야 함
      for (let i = 0; i < recs.length - 1; i++) {
        expect(recs[i].avgScore).toBeGreaterThanOrEqual(recs[i + 1].avgScore);
      }
    });
  });

  it('모든 여성에 대해 매칭 추천이 정상 동작', () => {
    const females = mockUsers.filter(u => u.gender === 'female');

    females.forEach(female => {
      const recs = getMatchRecommendations(female, mockUsers, 5);

      expect(recs.length).toBeGreaterThan(0);
      recs.forEach(rec => {
        expect(rec.user.gender).toBe('male');
      });
    });
  });

  it('매칭 점수 상호 일관성: A→B 점수와 B→A 점수 모두 유효', () => {
    const m1 = mockUsers.find(u => u.id === 'm1');
    const f1 = mockUsers.find(u => u.id === 'f1');

    const recsFromM1 = getMatchRecommendations(m1, mockUsers, 10);
    const recsFromF1 = getMatchRecommendations(f1, mockUsers, 10);

    // m1에서 f1 방향
    const m1ToF1 = recsFromM1.find(r => r.user.id === 'f1');
    // f1에서 m1 방향
    const f1ToM1 = recsFromF1.find(r => r.user.id === 'm1');

    if (m1ToF1 && f1ToM1) {
      // A→B 점수 = B에서 A방향의 reverseScore
      expect(m1ToF1.score).toBe(f1ToM1.reverseScore);
    }
  });
});
