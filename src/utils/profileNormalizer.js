const currentYear = new Date().getFullYear();

function normalizeGender(g) {
  if (!g) return '';
  const lower = g.toLowerCase();
  if (lower === 'male') return 'male';
  if (lower === 'female') return 'female';
  return lower;
}

/**
 * Normalize a single API profile response to the frontend format
 * used by mockUsers (age, etc.)
 *
 * Backend profileJson may be a JSON string or an object.
 */
export function normalizeProfile(apiProfile) {
  let p = apiProfile.profileJson || apiProfile;

  // profileJson might be a JSON string
  if (typeof p === 'string') {
    try { p = JSON.parse(p); } catch { p = {}; }
  }

  return {
    id: apiProfile.id || apiProfile.profileId || p.id,
    accountId: apiProfile.accountId,
    status: apiProfile.status,
    gender: normalizeGender(p.gender),
    name: p.name,
    nickname: p.nickname || '',
    age: p.birthYear ? currentYear - p.birthYear : p.age,
    birthYear: p.birthYear,
    height: p.height,
    location: p.location || '',
    education: p.education,
    job: p.occupation || p.job || '',
    religion: p.religion || 'none',
    drinking: p.drinking || '',
    smoking: p.smoking || 'no',
    mbti: p.mbti || '',
    personality: p.personality || [],
    hobbies: p.hobbies || [],
    intro: p.intro || p.oneLiner || '',
    oneLiner: p.oneLiner || '',
    commonCompliment: p.commonCompliment || '',
    holidayStyle: p.holidayStyle || '',
    dreamTrip: p.dreamTrip || '',
    lastWord: p.lastWord || '',
    photos: p.photos || [],
    preferences: p.preference || p.preferences || {
      priorities: ['appearance', 'personality', 'job', 'values', 'humor', 'lifestyle'],
      ageRange: [25, 35],
      religionPref: 'any',
      drinkingPref: 'any',
      smokingPref: 'any',
    },
    createdAt: apiProfile.createdAt
      ? new Date(apiProfile.createdAt).toISOString().split('T')[0]
      : '',
  };
}

/**
 * Normalize a list of API profile responses
 */
export function normalizeProfiles(apiProfiles) {
  if (!Array.isArray(apiProfiles)) return [];
  return apiProfiles.map(normalizeProfile);
}
