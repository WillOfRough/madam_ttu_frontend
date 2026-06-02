// 상세 → 목록 "뒤로가기" 헬퍼.
// 앱 내에서 이동해 들어온 경우(브라우저 히스토리가 있으면)는 진짜 뒤로가기로 돌려보내
// 이전 목록 화면의 검색어·필터·페이지를 그대로 복원한다. 새 탭/직접 URL 진입처럼
// 돌아갈 앱 내 기록이 없으면 목록 경로로 폴백한다.
//
// react-router 는 createBrowserHistory 가 각 히스토리 엔트리에 idx 를 기록한다.
// idx > 0 이면 앱 세션 안에서 한 번 이상 앞으로 이동해 온 것이므로 안전하게 뒤로 갈 수 있다.
export function backOr(navigate, fallbackPath) {
  const idx = typeof window !== 'undefined' ? window.history.state?.idx : undefined;
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1);
  } else {
    navigate(fallbackPath);
  }
}
