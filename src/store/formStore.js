import { create } from 'zustand';

const useFormStore = create((set) => ({
  currentStep: 1,
  formData: {
    // Step 1: 자기소개
    gender: '',
    name: '',
    nickname: '',
    oneLiner: '',
    birthYear: '',
    height: '',
    location: '',
    education: '',
    job: '',
    religion: '',
    drinking: '',
    smoking: '',
    mbti: '',
    personality: [],
    hobbies: [],
    commonCompliment: '',
    holidayStyle: '',
    dreamTrip: '',
    intro: '',
    photos: [],
    lastWord: '',
    // Step 2: 선호 조건
    preferences: {
      priorities: ['appearance', 'personality', 'job', 'values', 'humor', 'lifestyle'],
      ageRange: [25, 35],
      religionPref: 'any',
      drinkingPref: 'any',
      smokingPref: 'any',
    },
  },

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

  updateField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),

  updatePreference: (field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        preferences: { ...state.formData.preferences, [field]: value },
      },
    })),

  togglePersonality: (keyword) =>
    set((state) => {
      const current = state.formData.personality;
      const exists = current.includes(keyword);
      if (exists) {
        return { formData: { ...state.formData, personality: current.filter((k) => k !== keyword) } };
      }
      if (current.length >= 5) return state;
      return { formData: { ...state.formData, personality: [...current, keyword] } };
    }),

  toggleHobby: (hobby) =>
    set((state) => {
      const current = state.formData.hobbies;
      const exists = current.includes(hobby);
      if (exists) {
        return { formData: { ...state.formData, hobbies: current.filter((h) => h !== hobby) } };
      }
      if (current.length >= 5) return state;
      return { formData: { ...state.formData, hobbies: [...current, hobby] } };
    }),

  addPhotos: (files) =>
    set((state) => ({
      formData: {
        ...state.formData,
        photos: [...state.formData.photos, ...files].slice(0, 6),
      },
    })),

  removePhoto: (index) =>
    set((state) => ({
      formData: {
        ...state.formData,
        photos: state.formData.photos.filter((_, i) => i !== index),
      },
    })),

  resetForm: () =>
    set({
      currentStep: 1,
      formData: {
        gender: '', name: '', nickname: '', oneLiner: '', birthYear: '', height: '',
        location: '', education: '', job: '', religion: '', drinking: '',
        smoking: '', mbti: '', personality: [], hobbies: [],
        commonCompliment: '', holidayStyle: '', dreamTrip: '',
        intro: '', photos: [], lastWord: '',
        preferences: {
          priorities: ['appearance', 'personality', 'job', 'values', 'humor', 'lifestyle'],
          ageRange: [25, 35],
          religionPref: 'any',
          drinkingPref: 'any',
          smokingPref: 'any',
        },
      },
    }),
}));

export default useFormStore;
