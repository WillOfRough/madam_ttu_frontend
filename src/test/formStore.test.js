import { describe, it, expect, beforeEach } from 'vitest';
import useFormStore from '../store/formStore';

describe('Form Store - 폼 상태 관리', () => {
  beforeEach(() => {
    useFormStore.getState().resetForm();
  });

  it('초기 상태가 올바른지 확인', () => {
    const state = useFormStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.formData.gender).toBe('');
    expect(state.formData.name).toBe('');
    expect(state.formData.oneLiner).toBe('');
    expect(state.formData.birthYear).toBe('');
    expect(state.formData.personality).toEqual([]);
    expect(state.formData.hobbies).toEqual([]);
    expect(state.formData.photos).toEqual([]);
    expect(state.formData.lastWord).toBe('');
  });

  describe('스텝 관리', () => {
    it('nextStep으로 다음 단계 이동', () => {
      useFormStore.getState().nextStep();
      expect(useFormStore.getState().currentStep).toBe(2);
    });

    it('prevStep으로 이전 단계 이동', () => {
      useFormStore.getState().setStep(3);
      useFormStore.getState().prevStep();
      expect(useFormStore.getState().currentStep).toBe(2);
    });

    it('prevStep은 1 미만으로 내려가지 않음', () => {
      useFormStore.getState().prevStep();
      expect(useFormStore.getState().currentStep).toBe(1);
    });

    it('setStep으로 특정 단계 설정', () => {
      useFormStore.getState().setStep(3);
      expect(useFormStore.getState().currentStep).toBe(3);
    });
  });

  describe('필드 업데이트', () => {
    it('updateField로 단일 필드 업데이트', () => {
      useFormStore.getState().updateField('name', '홍길동');
      expect(useFormStore.getState().formData.name).toBe('홍길동');
    });

    it('updateField로 성별 업데이트', () => {
      useFormStore.getState().updateField('gender', 'male');
      expect(useFormStore.getState().formData.gender).toBe('male');
    });

    it('updateField로 여러 필드 순차 업데이트', () => {
      const store = useFormStore.getState();
      store.updateField('name', '김철수');
      store.updateField('age', '28');
      store.updateField('height', '175');
      store.updateField('job', 'IT 개발자');

      const data = useFormStore.getState().formData;
      expect(data.name).toBe('김철수');
      expect(data.age).toBe('28');
      expect(data.height).toBe('175');
      expect(data.job).toBe('IT 개발자');
    });
  });

  describe('성격 키워드 토글', () => {
    it('키워드 추가', () => {
      useFormStore.getState().togglePersonality('#다정한_츤데레');
      expect(useFormStore.getState().formData.personality).toContain('#다정한_츤데레');
    });

    it('이미 선택된 키워드 제거', () => {
      useFormStore.getState().togglePersonality('#다정한_츤데레');
      useFormStore.getState().togglePersonality('#다정한_츤데레');
      expect(useFormStore.getState().formData.personality).not.toContain('#다정한_츤데레');
    });

    it('최대 5개까지만 선택 가능', () => {
      const keywords = ['#다정한_츤데레', '#프로직장인', '#유머_담당', '#집순이_꿈나무', '#러닝_홀릭'];
      keywords.forEach(kw => useFormStore.getState().togglePersonality(kw));
      expect(useFormStore.getState().formData.personality).toHaveLength(5);

      // 6번째는 무시
      useFormStore.getState().togglePersonality('#감성_충만');
      expect(useFormStore.getState().formData.personality).toHaveLength(5);
      expect(useFormStore.getState().formData.personality).not.toContain('#감성_충만');
    });

    it('5개 선택 상태에서 기존 키워드 제거 후 새 키워드 추가 가능', () => {
      ['#다정한_츤데레', '#프로직장인', '#유머_담당', '#집순이_꿈나무', '#러닝_홀릭'].forEach(kw =>
        useFormStore.getState().togglePersonality(kw)
      );
      useFormStore.getState().togglePersonality('#다정한_츤데레'); // 제거
      expect(useFormStore.getState().formData.personality).toHaveLength(4);

      useFormStore.getState().togglePersonality('#감성_충만'); // 추가
      expect(useFormStore.getState().formData.personality).toHaveLength(5);
      expect(useFormStore.getState().formData.personality).toContain('#감성_충만');
    });
  });

  describe('취미 토글', () => {
    it('취미 추가/제거', () => {
      useFormStore.getState().toggleHobby('독서');
      expect(useFormStore.getState().formData.hobbies).toContain('독서');

      useFormStore.getState().toggleHobby('독서');
      expect(useFormStore.getState().formData.hobbies).not.toContain('독서');
    });

    it('최대 5개까지만 선택 가능', () => {
      ['운동/헬스', '독서', '영화/넷플릭스', '여행', '요리'].forEach(h =>
        useFormStore.getState().toggleHobby(h)
      );
      useFormStore.getState().toggleHobby('카페 탐방');
      expect(useFormStore.getState().formData.hobbies).toHaveLength(5);
    });
  });

  describe('사진 관리', () => {
    it('사진 추가', () => {
      useFormStore.getState().addPhotos([{ preview: 'photo1.jpg' }]);
      expect(useFormStore.getState().formData.photos).toHaveLength(1);
    });

    it('여러 사진 추가', () => {
      useFormStore.getState().addPhotos([
        { preview: 'photo1.jpg' },
        { preview: 'photo2.jpg' },
        { preview: 'photo3.jpg' },
      ]);
      expect(useFormStore.getState().formData.photos).toHaveLength(3);
    });

    it('최대 6장까지만 저장', () => {
      const photos = Array.from({ length: 8 }, (_, i) => ({ preview: `photo${i}.jpg` }));
      useFormStore.getState().addPhotos(photos);
      expect(useFormStore.getState().formData.photos).toHaveLength(6);
    });

    it('사진 제거', () => {
      useFormStore.getState().addPhotos([
        { preview: 'photo1.jpg' },
        { preview: 'photo2.jpg' },
        { preview: 'photo3.jpg' },
      ]);
      useFormStore.getState().removePhoto(1);
      expect(useFormStore.getState().formData.photos).toHaveLength(2);
      expect(useFormStore.getState().formData.photos[0].preview).toBe('photo1.jpg');
      expect(useFormStore.getState().formData.photos[1].preview).toBe('photo3.jpg');
    });
  });

  describe('선호 조건 업데이트', () => {
    it('종교 선호 업데이트', () => {
      useFormStore.getState().updatePreference('religionPref', 'same');
      expect(useFormStore.getState().formData.preferences.religionPref).toBe('same');
    });

    it('우선순위 업데이트', () => {
      const newOrder = ['humor', 'personality', 'appearance', 'values', 'lifestyle', 'job'];
      useFormStore.getState().updatePreference('priorities', newOrder);
      expect(useFormStore.getState().formData.preferences.priorities).toEqual(newOrder);
    });

    it('기존 preference 필드가 보존되는지 확인', () => {
      useFormStore.getState().updatePreference('religionPref', 'same');
      useFormStore.getState().updatePreference('drinkingPref', 'moderate');

      const prefs = useFormStore.getState().formData.preferences;
      expect(prefs.religionPref).toBe('same');
      expect(prefs.drinkingPref).toBe('moderate');
      expect(prefs.priorities).toBeDefined();
    });
  });

  describe('폼 리셋', () => {
    it('resetForm으로 모든 상태 초기화', () => {
      // 데이터 입력
      useFormStore.getState().updateField('name', '홍길동');
      useFormStore.getState().updateField('gender', 'male');
      useFormStore.getState().togglePersonality('#다정한_츤데레');
      useFormStore.getState().nextStep();

      // 리셋
      useFormStore.getState().resetForm();

      const state = useFormStore.getState();
      expect(state.currentStep).toBe(1);
      expect(state.formData.name).toBe('');
      expect(state.formData.gender).toBe('');
      expect(state.formData.personality).toEqual([]);
    });
  });
});
