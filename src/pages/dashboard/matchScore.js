/**
 * matchScore.js — client-side rule-based pair scoring.
 * 7 signals → max 100 pts. Each signal gracefully no-ops if schema fields are missing.
 * Returns top-N pairs sorted by total desc, opposite genders only.
 */

/* ── Signal weights (sum = 100) ── */
const W = {
  region:    20, // 거주지역 근접
  age:       15, // 나이차
  mbti:      10, // MBTI 궁합
  height:    10, // 키 차이
  religion:  10, // 종교
  education:  5, // 학력
  // keywords (idealKw / selfKw) — 30pt reserved but most schemas lack these fields
  // gracefully returns 0 when fields absent
  keywords:  30,
};

/* ── MBTI compatibility pairs (reference only) ── */
const MBTI_PAIRS = {
  ENFP: ['INTJ', 'INFJ'], INFP: ['ENFJ', 'ENTJ'], ENTP: ['INFJ', 'INTJ'],
  INTP: ['ENTJ', 'ENFJ'], ENFJ: ['INFP', 'ISFP'], INFJ: ['ENFP', 'ENTP'],
  ENTJ: ['INTP', 'INFP'], INTJ: ['ENFP', 'ENTP'], ESFP: ['ISFJ', 'ISTJ'],
  ISFP: ['ENFJ', 'ESFJ'], ESTP: ['ISFJ', 'ISTJ'], ISTP: ['ESFJ', 'ESTJ'],
  ESFJ: ['ISFP', 'ISTP'], ISFJ: ['ESFP', 'ESTP'], ESTJ: ['ISFP', 'ISTP'],
  ISTJ: ['ESFP', 'ESTP'],
};

const EDU_RANK = { 고졸: 1, 대졸: 2, 대학원: 3, 박사: 4 };

function intersect(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return [];
  return a.filter((x) => b.includes(x));
}

/**
 * Hard filter — returns false if the pair should never be recommended.
 * Opposite genders, both active & approved, no strict religion mismatch.
 */
function hardFilter(a, b) {
  if (!a || !b || a.id === b.id) return false;
  const genderA = (a.gender || '').toLowerCase();
  const genderB = (b.gender || '').toLowerCase();
  if (genderA === genderB) return false;
  if ((a.status || 'active') !== 'active' || (b.status || 'active') !== 'active') return false;
  if ((a.approvalStatus || a.approval) !== 'approved') return false;
  if ((b.approvalStatus || b.approval) !== 'approved') return false;
  // Religion hard filter: 무교 always passes; otherwise must match
  const relA = a.religion || '';
  const relB = b.religion || '';
  if (relA && relB && relA !== '무교' && relB !== '무교' && relA !== relB) return false;
  return true;
}

/**
 * Score a pair.
 * @param {object} a - client object from API
 * @param {object} b - client object from API
 * @returns {{ total: number, signals: Array }}
 */
export function scorePair(a, b) {
  const signals = [];

  /* 1. Keywords (30pt) — ideal match keywords ↔ self keywords */
  const aIdeal = a.idealKw || a.idealKeywords || [];
  const bSelf  = b.selfKw  || b.selfKeywords  || [];
  const bIdeal = b.idealKw || b.idealKeywords || [];
  const aSelf  = a.selfKw  || a.selfKeywords  || [];
  const aWantB = intersect(aIdeal, bSelf);
  const bWantA = intersect(bIdeal, aSelf);
  const kwHits = aWantB.length + bWantA.length;
  const kwMax  = Math.max((aIdeal.length || 0) + (bIdeal.length || 0), 1);
  const kwScore = kwHits > 0
    ? Math.min(W.keywords, Math.round((kwHits / kwMax) * W.keywords * 1.5))
    : 0;
  signals.push({
    key: 'keywords', label: '이상형 일치', score: kwScore, max: W.keywords,
    detail: kwHits > 0
      ? [...aWantB, ...bWantA].slice(0, 4).join(' · ')
      : null,
  });

  /* 2. Region (20pt) */
  const locA = a.location || a.region || '';
  const locB = b.location || b.region || '';
  let regionScore = 0;
  let regionDetail = null;
  if (locA && locB) {
    const cityA = locA.split(' ')[0];
    const cityB = locB.split(' ')[0];
    if (cityA === cityB) {
      regionScore = locA === locB ? W.region : Math.round(W.region * 0.7);
      regionDetail = `같은 ${cityA}`;
    } else {
      regionScore = Math.round(W.region * 0.2);
      regionDetail = `${cityA} / ${cityB}`;
    }
  }
  signals.push({ key: 'region', label: '지역', score: regionScore, max: W.region, detail: regionDetail });

  /* 3. Age (15pt) — 서버가 만 나이(age)를 더 이상 주지 않으므로 birthDate 연도로 나이차를 계산한다. */
  const birthYearOf = (c) => (c.birthDate ? Number(String(c.birthDate).slice(0, 4)) : 0);
  const yearA = birthYearOf(a);
  const yearB = birthYearOf(b);
  let ageScore = 0;
  let ageDetail = null;
  if (yearA && yearB) {
    const diff = Math.abs(yearA - yearB);
    if (diff === 0) { ageScore = W.age; ageDetail = '동갑'; }
    else if (diff <= 2) { ageScore = W.age; ageDetail = `나이차 ${diff}세`; }
    else if (diff <= 4) { ageScore = Math.round(W.age * 0.75); ageDetail = `나이차 ${diff}세`; }
    else if (diff <= 6) { ageScore = Math.round(W.age * 0.5); ageDetail = `나이차 ${diff}세`; }
    else if (diff <= 8) { ageScore = Math.round(W.age * 0.25); ageDetail = `나이차 ${diff}세 (많음)`; }
    else { ageScore = 0; ageDetail = `나이차 ${diff}세 (큼)`; }
  }
  signals.push({ key: 'age', label: '나이', score: ageScore, max: W.age, detail: ageDetail });

  /* 4. MBTI (10pt) */
  const mbtiA = (a.mbti || '').toUpperCase();
  const mbtiB = (b.mbti || '').toUpperCase();
  let mbtiScore = 0;
  let mbtiDetail = null;
  if (mbtiA && mbtiB) {
    const match = MBTI_PAIRS[mbtiA]?.includes(mbtiB) || MBTI_PAIRS[mbtiB]?.includes(mbtiA);
    mbtiScore = match ? W.mbti : 0;
    mbtiDetail = `${mbtiA} · ${mbtiB}${match ? ' (궁합)' : ''}`;
  }
  signals.push({ key: 'mbti', label: 'MBTI', score: mbtiScore, max: W.mbti, detail: mbtiDetail });

  /* 5. Height (10pt) — male +8~22cm ideal */
  const hA = a.height || 0;
  const hB = b.height || 0;
  let heightScore = 0;
  let heightDetail = null;
  if (hA && hB) {
    const gA = (a.gender || '').toLowerCase();
    const maleH   = gA === 'male'   ? hA : hB;
    const femaleH = gA === 'female' ? hA : hB;
    const hdiff = maleH - femaleH;
    if (hdiff >= 8 && hdiff <= 22)  { heightScore = W.height; }
    else if (hdiff >= 5 && hdiff <= 25) { heightScore = Math.round(W.height * 0.7); }
    else if (hdiff >= 0) { heightScore = Math.round(W.height * 0.3); }
    heightDetail = `키 차이 ${hdiff}cm`;
  }
  signals.push({ key: 'height', label: '키', score: heightScore, max: W.height, detail: heightDetail });

  /* 6. Religion (10pt) */
  const relA = a.religion || '';
  const relB = b.religion || '';
  let religionScore = 0;
  let religionDetail = null;
  if (relA && relB) {
    if (relA === relB) { religionScore = W.religion; religionDetail = relA; }
    else if (relA === '무교' || relB === '무교') { religionScore = Math.round(W.religion * 0.5); religionDetail = `${relA} / ${relB}`; }
  }
  signals.push({ key: 'religion', label: '종교', score: religionScore, max: W.religion, detail: religionDetail });

  /* 7. Education (5pt) */
  const eduA = EDU_RANK[a.education || a.edu] || 2;
  const eduB = EDU_RANK[b.education || b.edu] || 2;
  let eduScore = 0;
  let eduDetail = null;
  if ((a.education || a.edu) && (b.education || b.edu)) {
    const diff = Math.abs(eduA - eduB);
    if (diff === 0) { eduScore = W.education; eduDetail = `${a.education || a.edu} 동일`; }
    else if (diff === 1) { eduScore = Math.round(W.education * 0.6); eduDetail = `${a.education || a.edu} / ${b.education || b.edu}`; }
    else { eduScore = 0; eduDetail = `${a.education || a.edu} / ${b.education || b.edu}`; }
  }
  signals.push({ key: 'education', label: '학력', score: eduScore, max: W.education, detail: eduDetail });

  const total = signals.reduce((sum, s) => sum + s.score, 0);
  return { total, signals };
}

/**
 * Canonical pair key — order-independent so (a,b) and (b,a) map to the same key.
 */
export function pairKey(idA, idB) {
  const sA = String(idA);
  const sB = String(idB);
  return sA < sB ? `${sA}|${sB}` : `${sB}|${sA}`;
}

/**
 * Returns top-N recommended pairs from a flat client list.
 * @param {Array} clients
 * @param {number} n
 * @param {{ excludePairKeys?: Set<string>, minScore?: number|null }} [options]
 *   - excludePairKeys: pairs with key in this set are skipped (e.g. 제안발송 이상 이력 보유)
 *   - minScore: drop pairs scoring below this threshold (null = no filter)
 * @returns {Array<{ a, b, total, signals }>}
 */
export function topPairs(clients, n = 3, options = {}) {
  const { excludePairKeys = null, minScore = null } = options;
  const pairs = [];
  for (let i = 0; i < clients.length; i++) {
    for (let j = i + 1; j < clients.length; j++) {
      const a = clients[i];
      const b = clients[j];
      if (!hardFilter(a, b)) continue;
      if (excludePairKeys && excludePairKeys.has(pairKey(a.id, b.id))) continue;
      const { total, signals } = scorePair(a, b);
      if (minScore != null && total < minScore) continue;
      pairs.push({ a, b, total, signals });
    }
  }
  pairs.sort((x, y) => y.total - x.total);
  return pairs.slice(0, n);
}

/**
 * Returns 2-3 short chip labels for the best-scoring signals of a pair.
 */
export function topChips(signals, limit = 3) {
  return signals
    .filter((s) => s.score > 0 && s.detail)
    .sort((x, y) => (y.score / y.max) - (x.score / x.max))
    .slice(0, limit)
    .map((s) => s.detail);
}
