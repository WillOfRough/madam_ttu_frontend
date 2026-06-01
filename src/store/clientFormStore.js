import { create } from 'zustand';

const NAME_PATTERN = /^[가-힣a-zA-Z]+$/;

const INITIAL_FORM = {
  // Step 1: 기본 정보
  name: '',
  nickname: '',
  gender: '',
  birthYear: '',
  phone: '',
  location: '',
  // Step 2: 모습
  height: '',
  occupation: '',
  company: '',
  companyLocation: '',
  education: '',
  school: '',
  // Step 3: 취향
  religion: '',
  mbti: '',
  hobbies: [],
  // Step 4: 진심
  introQ1: '',
  introQ2: '',
  introKeywords: [],
  idealType: '',
  idealKeywords: [],
  // 선호 범위
  preferredAgeMin: 25,
  preferredAgeMax: 40,
  preferredAgeAny: false,
  preferredHeightMin: 160,
  preferredHeightMax: 185,
  preferredHeightAny: false,
  photos: [],
  consentPrivacy: false,
  consentThirdParty: false,
};

export const AGE_BOUNDS = { min: 20, max: 65 };
export const HEIGHT_BOUNDS = { min: 145, max: 200 };

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const useClientFormStore = create((set, get) => ({
  step: 0,
  form: { ...INITIAL_FORM },
  token: null,
  suggestedNickname: '',
  photoError: null,

  setToken: (token) => set({ token }),
  setSuggestedNickname: (n) => set({ suggestedNickname: n }),
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: s.step + 1 })),
  prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),

  setField: (key, value) => {
    set((s) => ({ form: { ...s.form, [key]: value } }));
  },

  addPhotos: (files) => {
    const { form } = get();
    const current = form.photos;
    const remaining = MAX_PHOTOS - current.length;
    if (remaining <= 0) {
      set({ photoError: `사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.` });
      return;
    }
    const validFiles = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        set({ photoError: `${file.name}: JPG, PNG, WebP 형식만 가능합니다.` });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        set({ photoError: `${file.name}: 파일 크기는 15MB 이하여야 합니다.` });
        return;
      }
      validFiles.push(file);
    }
    set((s) => ({
      form: { ...s.form, photos: [...s.form.photos, ...validFiles] },
      photoError: null,
    }));
  },

  removePhoto: (index) => {
    set((s) => ({
      form: { ...s.form, photos: s.form.photos.filter((_, i) => i !== index) },
      photoError: null,
    }));
  },

  toggleKeyword: (field, keyword) => {
    set((s) => {
      const current = s.form[field] || [];
      const next = current.includes(keyword)
        ? current.filter((k) => k !== keyword)
        : [...current, keyword];
      return { form: { ...s.form, [field]: next } };
    });
  },

  getPayload: () => {
    const { form, token, suggestedNickname } = get();
    const nickname = form.nickname || suggestedNickname;
    const introAnswers = [form.introQ1, form.introQ2]
      .map((a) => a.trim())
      .filter(Boolean)
      .join(' ');
    const introText = [
      form.introKeywords.length > 0 ? `[${form.introKeywords.join(', ')}] ` : '',
      introAnswers,
    ].join('');
    // 선호 나이/키 범위는 구조화 필드(preferred*)로 전송하므로 idealType 텍스트에 합성하지 않는다 (spec 014).
    const idealText = [
      form.idealKeywords.length > 0 ? `[${form.idealKeywords.join(', ')}] ` : '',
      form.idealType,
    ].join('');

    return {
      token,
      name: form.name,
      nickname: nickname,
      gender: form.gender,
      birthDate: form.birthYear ? `${form.birthYear}-01-01` : '',
      phone: form.phone,
      location: form.location || undefined,
      height: form.height ? Number(form.height) : undefined,
      occupation: form.occupation,
      company: form.company || undefined,
      workLocation: form.companyLocation || undefined,
      education: (() => {
        const schoolName = (form.school || '').trim();
        if (schoolName && form.education) return `${schoolName} ${form.education}`;
        if (form.education) return form.education;
        return undefined;
      })(),
      religion: form.religion || undefined,
      mbti: (form.mbti && form.mbti.length <= 4) ? form.mbti : undefined,
      hobbies: form.hobbies.length > 0 ? form.hobbies.join(', ') : undefined,
      introduction: introText,
      idealType: idealText || undefined,
      preferredAgeMin: form.preferredAgeAny ? null : form.preferredAgeMin,
      preferredAgeMax: form.preferredAgeAny ? null : form.preferredAgeMax,
      preferredAgeAny: !!form.preferredAgeAny,
      preferredHeightMin: form.preferredHeightAny ? null : form.preferredHeightMin,
      preferredHeightMax: form.preferredHeightAny ? null : form.preferredHeightMax,
      preferredHeightAny: !!form.preferredHeightAny,
    };
  },

  reset: () => set({ step: 0, form: { ...INITIAL_FORM }, token: null, suggestedNickname: '', photoError: null }),
}));

export { NAME_PATTERN };
export default useClientFormStore;
