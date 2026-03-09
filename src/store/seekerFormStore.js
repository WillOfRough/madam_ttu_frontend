import { create } from 'zustand';

const INITIAL_FORM = {
  // Step 1: 기본 정보
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
  introQ3: '',
  introQ4: '',
  introKeywords: [],
  idealType: '',
  idealKeywords: [],
  consentPrivacy: false,
  consentThirdParty: false,
};

const useSeekerFormStore = create((set, get) => ({
  step: 0,
  form: { ...INITIAL_FORM },
  token: null,
  suggestedNickname: '',

  setToken: (token) => set({ token }),
  setSuggestedNickname: (n) => set({ suggestedNickname: n }),
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: s.step + 1 })),
  prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),

  setField: (key, value) => {
    set((s) => ({ form: { ...s.form, [key]: value } }));
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
    const introAnswers = [form.introQ1, form.introQ2, form.introQ3, form.introQ4]
      .map((a) => a.trim())
      .filter(Boolean)
      .join(' ');
    const introText = [
      form.introKeywords.length > 0 ? `[${form.introKeywords.join(', ')}] ` : '',
      introAnswers,
    ].join('');
    const idealText = [
      form.idealKeywords.length > 0 ? `[${form.idealKeywords.join(', ')}] ` : '',
      form.idealType,
    ].join('');

    return {
      token,
      name: nickname,
      gender: form.gender,
      birthDate: form.birthYear ? `${form.birthYear}-01-01` : '',
      phone: form.phone,
      location: form.location || undefined,
      height: form.height ? Number(form.height) : undefined,
      occupation: form.occupation,
      company: form.company || undefined,
      education: form.education || undefined,
      religion: form.religion || undefined,
      mbti: (form.mbti && form.mbti.length <= 4) ? form.mbti : undefined,
      hobbies: form.hobbies.length > 0 ? form.hobbies.join(', ') : undefined,
      introduction: introText,
      idealType: idealText || undefined,
    };
  },

  reset: () => set({ step: 0, form: { ...INITIAL_FORM }, token: null, suggestedNickname: '' }),
}));

export default useSeekerFormStore;
