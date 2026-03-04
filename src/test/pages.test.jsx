import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import useFormStore from '../store/formStore';
import useAdminStore from '../store/adminStore';

import Landing from '../pages/Landing';
import FormContainer from '../pages/form/FormContainer';
import Step1Intro from '../pages/form/Step1Intro';
import Step2Preference from '../pages/form/Step2Preference';
import AdminLogin from '../pages/admin/AdminLogin';

const RouterWrap = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('Landing 페이지', () => {
  it('타이틀이 렌더링되는지 확인', () => {
    render(<RouterWrap><Landing /></RouterWrap>);
    expect(screen.getByText(/비밀 서재/)).toBeInTheDocument();
  });

  it('서브타이틀이 렌더링되는지 확인', () => {
    render(<RouterWrap><Landing /></RouterWrap>);
    expect(screen.getByText(/정성껏 찾아드립니다/)).toBeInTheDocument();
  });

  it('CTA 버튼이 렌더링되는지 확인', () => {
    render(<RouterWrap><Landing /></RouterWrap>);
    expect(screen.getByText('마담MJ에게 인연을 부탁하기')).toBeInTheDocument();
  });

  it('특징 목록이 렌더링되는지 확인', () => {
    render(<RouterWrap><Landing /></RouterWrap>);
    expect(screen.getByText(/프라이빗 매칭/)).toBeInTheDocument();
    expect(screen.getByText(/철저한 비밀 보장/)).toBeInTheDocument();
    expect(screen.getByText(/마담MJ의 큐레이션/)).toBeInTheDocument();
  });

  it('개인정보 보호 안내가 표시되는지 확인', () => {
    render(<RouterWrap><Landing /></RouterWrap>);
    expect(screen.getByText(/마담MJ만 열람/)).toBeInTheDocument();
  });
});

describe('FormContainer 페이지', () => {
  beforeEach(() => {
    useFormStore.getState().resetForm();
  });

  it('Step 1이 기본 렌더링', () => {
    render(<RouterWrap><FormContainer /></RouterWrap>);
    expect(screen.getAllByText(/소중한 당신을 알고 싶어요/).length).toBeGreaterThanOrEqual(1);
  });

  it('프로그레스 바가 표시되는지 확인', () => {
    render(<RouterWrap><FormContainer /></RouterWrap>);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('마담MJ 경청 메시지가 표시되는지 확인', () => {
    render(<RouterWrap><FormContainer /></RouterWrap>);
    expect(screen.getByText(/마담MJ가 당신의 이야기를 경청/)).toBeInTheDocument();
  });
});

describe('Step1Intro 페이지', () => {
  beforeEach(() => {
    useFormStore.getState().resetForm();
  });

  it('마담MJ 멘트가 표시되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/마담MJ예요/)).toBeInTheDocument();
  });

  it('기본 정보 섹션이 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/소중한 당신을 알고 싶어요/)).toBeInTheDocument();
    expect(screen.getByText('멋진 신사')).toBeInTheDocument();
    expect(screen.getByText('아름다운 숙녀')).toBeInTheDocument();
  });

  it('일상 섹션이 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/당신의 일상이 궁금해요/)).toBeInTheDocument();
  });

  it('성격 키워드가 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText('#다정한_츤데레')).toBeInTheDocument();
    expect(screen.getByText('#프로직장인')).toBeInTheDocument();
    expect(screen.getByText('#유머_담당')).toBeInTheDocument();
  });

  it('성격 키워드 선택 시 formStore에 반영', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    fireEvent.click(screen.getByText('#다정한_츤데레'));
    expect(useFormStore.getState().formData.personality).toContain('#다정한_츤데레');
  });

  it('취미 섹션이 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/휴일에는 주로 어떻게/)).toBeInTheDocument();
    expect(screen.getByText('운동/헬스')).toBeInTheDocument();
  });

  it('라이프스타일 텍스트 필드가 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/요즘 빠져있는 게 있나요/)).toBeInTheDocument();
    expect(screen.getByText(/가보고 싶은 여행지/)).toBeInTheDocument();
    expect(screen.getByText(/나만의 힐링 방법/)).toBeInTheDocument();
  });

  it('사진 업로드 섹션이 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/빛나는 미소를 보여주세요/)).toBeInTheDocument();
  });

  it('한 문장 소개 필드가 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/어떤 향기를 가진 사람/)).toBeInTheDocument();
  });

  it('태어난 해 입력 필드가 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/세상에 빛을 본 소중한 해/)).toBeInTheDocument();
  });

  it('마담MJ에게 마지막 한마디 섹션이 렌더링되는지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/마담MJ에게 마지막으로 한마디/)).toBeInTheDocument();
    expect(screen.getByText(/진짜 원하는 걸 솔직하게/)).toBeInTheDocument();
  });

  it('다음 버튼이 초기에 비활성화인지 확인', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    const btn = screen.getByRole('button', { name: /다음 단계로/ });
    expect(btn).toBeDisabled();
  });

  it('필수 항목 안내 메시지 표시', () => {
    render(<RouterWrap><Step1Intro /></RouterWrap>);
    expect(screen.getByText(/필수 항목을 모두 입력/)).toBeInTheDocument();
  });
});

describe('Step2Preference 페이지', () => {
  beforeEach(() => {
    useFormStore.getState().resetForm();
    useFormStore.getState().setStep(2);
  });

  it('마담MJ 멘트가 표시되는지 확인', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    expect(screen.getByText(/꿈꾸는 인연은 어떤 모습/)).toBeInTheDocument();
  });

  it('우선순위 드래그 랭킹이 표시되는지 확인', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    expect(screen.getByText('외모')).toBeInTheDocument();
    expect(screen.getByText('성격')).toBeInTheDocument();
    expect(screen.getByText('직업/경제력')).toBeInTheDocument();
  });

  it('종교 선호 옵션이 표시되는지 확인', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    expect(screen.getByText(/같은 믿음을 가진 분과 함께 걷고/)).toBeInTheDocument();
    expect(screen.getByText(/같은 믿음을 가진 분과 함께하고 싶어요/)).toBeInTheDocument();
    expect(screen.getByText(/사랑만 있다면 상관없어요/)).toBeInTheDocument();
  });

  it('음주 선호 옵션이 표시되는지 확인', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    expect(screen.getByText(/사랑하는 사람과 함께하는 한 잔/)).toBeInTheDocument();
  });

  it('흡연 선호 옵션이 표시되는지 확인', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    expect(screen.getByText('흡연에 대해')).toBeInTheDocument();
    expect(screen.getByText('비흡연자만')).toBeInTheDocument();
  });

  it('이전/전달 버튼이 표시되는지 확인', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    expect(screen.getByText('이전으로')).toBeInTheDocument();
    expect(screen.getByText('마담MJ에게 전달하기')).toBeInTheDocument();
  });

  it('종교 선호 라디오 클릭 시 store에 반영', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    fireEvent.click(screen.getByText(/같은 믿음을 가진 분과 함께하고 싶어요/));
    expect(useFormStore.getState().formData.preferences.religionPref).toBe('same');
  });

  it('이전 버튼 클릭 시 Step 1로 이동', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    fireEvent.click(screen.getByText('이전으로'));
    expect(useFormStore.getState().currentStep).toBe(1);
  });

  it('전달 버튼 클릭 시 Step 3(완료)으로 이동', () => {
    render(<RouterWrap><Step2Preference /></RouterWrap>);
    fireEvent.click(screen.getByText('마담MJ에게 전달하기'));
    expect(useFormStore.getState().currentStep).toBe(3);
  });
});

describe('AdminLogin 페이지', () => {
  beforeEach(() => {
    useAdminStore.getState().logout();
  });

  it('로그인 폼이 렌더링되는지 확인', () => {
    render(<RouterWrap><AdminLogin /></RouterWrap>);
    expect(screen.getByText('마담MJ의 서재')).toBeInTheDocument();
    expect(screen.getByText('관리자 전용 입구')).toBeInTheDocument();
  });

  it('비밀번호 입력 필드가 있는지 확인', () => {
    render(<RouterWrap><AdminLogin /></RouterWrap>);
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
  });

  it('입장 버튼이 있는지 확인', () => {
    render(<RouterWrap><AdminLogin /></RouterWrap>);
    expect(screen.getByText('입장하기')).toBeInTheDocument();
  });

  it('잘못된 비밀번호로 에러 표시', () => {
    render(<RouterWrap><AdminLogin /></RouterWrap>);
    const input = screen.getByPlaceholderText('비밀번호를 입력하세요');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('입장하기'));
    expect(screen.getByText('비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
  });

  it('올바른 비밀번호로 인증 성공', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminLogin />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText('비밀번호를 입력하세요');
    fireEvent.change(input, { target: { value: 'madam2026' } });
    fireEvent.click(screen.getByText('입장하기'));
    expect(useAdminStore.getState().isAuthenticated).toBe(true);
  });
});
