import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProposalAfter from '../pages/public/ProposalAfter';

// jsdom 환경에 localStorage 가 없을 수 있어 스텁 제공
beforeAll(() => {
  if (typeof globalThis.localStorage?.getItem !== 'function') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  }
});

// 미성사 시나리오: match011 (이준혁=수락 / 한소희=거절 → afterStatus 'rejected')
// 수락한 이준혁(token PrTk22nOp6J0)의 /after 화면 = AfterWaiting
const ACCEPTED_TOKEN = 'PrTk22nOp6J0';

function renderAfter(token) {
  return render(
    <MemoryRouter initialEntries={[`/proposal/${token}/after`]}>
      <Routes>
        <Route path="/proposal/:token/after" element={<ProposalAfter />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('애프터 미성사 — 수락한 회원의 /after 화면', () => {
  it('"응답이 완료되었습니다" 와 양쪽 수락 시에만 연락처 링크 안내를 보여준다', async () => {
    const { container } = renderAfter(ACCEPTED_TOKEN);

    await waitFor(() => {
      expect(screen.getByText('응답이 완료되었습니다')).toBeInTheDocument();
    });

    // 정책 안내 문구 (텍스트가 <br> 로 나뉘므로 부분 매칭)
    expect(screen.getByText(/서로 애프터를 수락한 경우에만/)).toBeInTheDocument();
    expect(screen.getByText(/이름과/)).toBeInTheDocument();
    expect(screen.getByText(/연락처가 담긴 프로필 링크를 보내드려요/)).toBeInTheDocument();

    // 상대방 거절 사실을 드러내지 않는다
    expect(screen.queryByText(/상대방의 선택이 완료되지 않았어요/)).toBeNull();
    expect(screen.queryByText(/거절/)).toBeNull();
    // 미성사 시 매니저가 아무것도 보내지 않으므로 "별도로 안내" 문구도 없다
    expect(screen.queryByText(/매니저가 별도로 안내/)).toBeNull();

    // 완료(체크) 아이콘이 렌더된다 — lucide CheckCircle2 → .lucide-circle-check
    const checkIcon = container.querySelector('.lucide-circle-check');
    expect(checkIcon).not.toBeNull();
    // 기다림을 뜻하던 펄스 도트는 없다
    expect(container.querySelector('[class*="afterWaitingDot"]')).toBeNull();
  });
});
