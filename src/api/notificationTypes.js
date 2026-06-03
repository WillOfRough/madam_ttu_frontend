// 알림 type 분류 — 단일 출처
//
// "당연한 것들" = 대부분 매니저 본인 행동의 결과거나 단순 상태 기록이라
// 굳이 알림으로 알릴 필요가 없는 종류. 알림 리스트와 안읽음 배지 양쪽에서 제외한다.
//
// deny-list 방식: 여기 명시된 type 만 routine 으로 숨기고,
// 새로 추가되거나 모르는 type 은 기본 노출(중요)로 둔다 — 중요한 알림을
// 실수로 숨기지 않기 위함.
export const ROUTINE_NOTIFICATION_TYPES = new Set([
  'match_created',    // 매칭 생성됨 — 보통 매니저가 직접 만든 직후
  'match_scheduled',  // 약속 확정됨 — 매니저가 확정한 결과
  'match_completed',  // 매칭 완료 처리 — 단순 상태 기록
  'match_cancelled',  // 매칭 취소 — 단순 상태 기록
]);

export function isRoutineNotification(type) {
  return ROUTINE_NOTIFICATION_TYPES.has(type);
}

// 화면/배지에 노출할 "중요" 알림인지
export function isImportantNotification(type) {
  return !isRoutineNotification(type);
}

// 안읽음 + 중요 알림 개수 (배지용)
export function countImportantUnread(notifications = []) {
  return notifications.filter((n) => !n.read && isImportantNotification(n.type)).length;
}
