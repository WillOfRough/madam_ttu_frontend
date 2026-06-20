// 나이 표기 유틸 — 출생연도(연도)만 보유하므로 만/세는나이 어떤 '나이 숫자'도
// 정확할 수 없다. 그래서 사람의 나이는 숫자 대신 'OO년생'(뒤 2자리)으로 통일해 노출한다.

// age 숫자(= 올해연도 − 출생연도)로부터 출생연도를 역산한다.
export function birthYearFromAge(age) {
  if (age == null || age === '') return null;
  const n = Number(age);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date().getFullYear() - n;
}

// 4자리 출생연도 → 'OO년생' (뒤 2자리). 예: 1994 → '94년생', 2003 → '03년생'
export function birthYearLabelFromYear(year) {
  if (year == null || year === '') return null;
  const y = Number(year);
  if (!Number.isFinite(y) || y <= 0) return null;
  return `${String(y % 100).padStart(2, '0')}년생`;
}

// age 숫자 → 'OO년생' (없으면 null). 예: 32 → '94년생'
export function birthYearLabel(age) {
  return birthYearLabelFromYear(birthYearFromAge(age));
}

// 'yyyy-MM-dd'(또는 'yyyy…') 출생일 문자열 → 'OO년생'. 잘못된 값이면 null.
// 서버가 만 나이(age)를 더 이상 내려주지 않으므로 birthDate 에서 직접 연도를 뽑는다.
// Date 파싱 대신 앞 4글자만 잘라 타임존 보정 오차를 피한다.
export function birthYearLabelFromDate(birthDate) {
  if (!birthDate || typeof birthDate !== 'string') return null;
  return birthYearLabelFromYear(Number(birthDate.slice(0, 4)));
}
