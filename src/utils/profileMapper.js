/**
 * Map frontend formData to the backend profileJson schema.
 *
 * Backend required fields:
 *   name, gender (MALE/FEMALE), birthYear, occupation, organization,
 *   education, phone, email, relationshipGoal, childrenPlan,
 *   privacyConsent, verificationConsent, preference
 */
export function mapFormToProfileJson(formData, email = '') {
  return {
    // Required
    name: formData.name,
    gender: formData.gender === 'male' ? 'MALE' : 'FEMALE',
    birthYear: parseInt(formData.birthYear, 10),
    occupation: formData.job,
    organization: formData.job, // use job as fallback
    education: formData.education,
    phone: '', // not collected in form yet
    email: email,
    relationshipGoal: 'MARRIAGE_FLEXIBLE', // default
    childrenPlan: 'UNDECIDED', // default
    privacyConsent: true,
    verificationConsent: true,

    // Preference object
    preference: {
      priorities: formData.preferences.priorities,
      ageRange: formData.preferences.ageRange,
      religionPref: formData.preferences.religionPref,
      drinkingPref: formData.preferences.drinkingPref,
      smokingPref: formData.preferences.smokingPref,
    },

    // Optional / extra fields
    nickname: formData.nickname || undefined,
    height: parseInt(formData.height, 10) || undefined,
    location: formData.location || undefined,
    religion: formData.religion || undefined,
    drinking: formData.drinking || undefined,
    smoking: formData.smoking || undefined,
    mbti: formData.mbti || undefined,
    personality: formData.personality,
    hobbies: formData.hobbies,
    oneLiner: formData.oneLiner || undefined,
    commonCompliment: formData.commonCompliment || undefined,
    holidayStyle: formData.holidayStyle || undefined,
    dreamTrip: formData.dreamTrip || undefined,
    intro: formData.intro || undefined,
    lastWord: formData.lastWord || undefined,
  };
}
