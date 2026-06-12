import { describe, it, expect, vi } from 'vitest';
import { mockFetch } from '../api/mockData';

// ──────────────────────────────────────────────────────────────
// 제안 거절 시 피드백(코멘트) 수집 → 매칭 상세에 노출되는 end-to-end 흐름.
// 브라우저 DEV 모드와 동일하게 mockFetch 핸들러를 직접 태워 검증한다.
//
// 흐름: 회원이 제안을 거절(+선택 코멘트) → POST /respond 한 번의 요청으로 전송 →
//       매니저가 GET /matches/:id 로 거절한 참가자의 feedbackComment/feedbackAt 확인.
// (mock 상태는 모듈 단위 싱글턴이므로 테스트마다 서로 다른 토큰/매칭을 사용한다)
// ──────────────────────────────────────────────────────────────

const reject = (token, body) =>
  mockFetch(`/api/v1/proposals/${token}/respond`, { method: 'POST', body });
const getDetail = (matchId) =>
  mockFetch(`/api/v1/matches/${matchId}`, { method: 'GET' });

describe('제안 거절 피드백 → 매칭 상세 노출', () => {
  it('거절 + 코멘트 입력 시, 매칭 상세의 해당 참가자에 feedbackComment/feedbackAt 가 노출된다', async () => {
    // match001: clientA(김서연, proposer)가 토큰 PrTk01aB3cD1 로 응답 대기 중
    const token = 'PrTk01aB3cD1';
    const comment = '프로필이 제 이상형과 거리가 있어요';

    const res = await reject(token, { response: 'rejected', feedbackComment: comment });
    expect(res.success).toBe(true);

    const detail = await getDetail('match001');
    // 거절하면 매칭은 즉시 취소된다
    expect(detail.status).toBe('cancelled');
    // 거절한 참가자(A)에 피드백이 노출된다
    expect(detail.clientA.feedbackComment).toBe(comment);
    expect(detail.clientA.feedbackAt).toBeTruthy();
    // 거절하지 않은 상대(B)는 피드백 없음
    expect(detail.clientB.feedbackComment).toBeNull();
    expect(detail.clientB.feedbackAt).toBeNull();
  });

  it('거절하되 코멘트를 비우면 피드백은 저장되지 않는다 (상세에 미노출)', async () => {
    // match002: clientA(proposer, PrTk03iJ5kL3) 응답 대기 중
    const token = 'PrTk03iJ5kL3';

    const res = await reject(token, { response: 'rejected' });
    expect(res.success).toBe(true);

    const detail = await getDetail('match002');
    expect(detail.status).toBe('cancelled');
    expect(detail.clientA.feedbackAt).toBeNull();
    expect(detail.clientA.feedbackComment).toBeNull();
  });

  it('이미 거절 사유 피드백이 있는 취소 매칭(시드)도 매니저 상세에서 조회된다', async () => {
    // match005: clientB(최민수)가 프로필 확인 후 거절하며 남긴 시드 피드백
    const detail = await getDetail('match005');
    expect(detail.status).toBe('cancelled');
    expect(detail.clientB.feedbackComment).toContain('프로필 사진');
    expect(detail.clientB.feedbackAt).toBeTruthy();
  });
});

describe('matchService.respondProposal 요청 본문 규칙', () => {
  it('거절일 때만 feedbackComment 를 body 에 포함하고, 수락/빈 코멘트는 제외한다', async () => {
    const config = await import('../api/config');
    const matchService = await import('../api/matchService');
    const bodies = [];
    const spy = vi.spyOn(config, 'apiFetch').mockImplementation(async (_path, opts) => {
      bodies.push(opts.body);
      return { success: true };
    });

    // 1) 거절 + 코멘트 → 포함
    await matchService.respondProposal('t1', 'rejected', { feedbackComment: '맞지 않아요' });
    // 2) 거절 + 빈 코멘트 → 제외
    await matchService.respondProposal('t2', 'rejected', { feedbackComment: '' });
    // 3) 수락 + 코멘트 → 제외 (수락 시 피드백 무시)
    await matchService.respondProposal('t3', 'accepted', { feedbackComment: '무시되어야 함' });

    expect(bodies[0]).toEqual({ response: 'rejected', feedbackComment: '맞지 않아요' });
    expect(bodies[1]).toEqual({ response: 'rejected' });
    expect(bodies[2]).toEqual({ response: 'accepted' });

    spy.mockRestore();
  });
});
