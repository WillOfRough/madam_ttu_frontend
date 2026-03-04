import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PersonalityChip from '../components/PersonalityChip';
import TextField from '../components/TextField';
import SelectField from '../components/SelectField';
import RadioGroup from '../components/RadioGroup';
import ProgressBar from '../components/ProgressBar';
import PrivacyBadge from '../components/PrivacyBadge';
import Layout from '../components/Layout';

// Wrapper for components that need router
const RouterWrap = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('PersonalityChip 컴포넌트', () => {
  it('라벨이 정상 렌더링', () => {
    render(<PersonalityChip label="#다정한_츤데레" selected={false} onClick={() => {}} />);
    expect(screen.getByText('#다정한_츤데레')).toBeInTheDocument();
  });

  it('클릭 이벤트 동작', () => {
    let clicked = false;
    render(
      <PersonalityChip label="#다정한_츤데레" selected={false} onClick={() => { clicked = true; }} />
    );
    fireEvent.click(screen.getByText('#다정한_츤데레'));
    expect(clicked).toBe(true);
  });

  it('비활성 상태에서 클릭 불가', () => {
    let clicked = false;
    render(
      <PersonalityChip
        label="#다정한_츤데레"
        selected={false}
        onClick={() => { clicked = true; }}
        disabled={true}
      />
    );
    fireEvent.click(screen.getByText('#다정한_츤데레'));
    expect(clicked).toBe(false);
  });

  it('선택 상태에서는 disabled여도 클릭 가능 (해제 용도)', () => {
    let clicked = false;
    render(
      <PersonalityChip
        label="#다정한_츤데레"
        selected={true}
        onClick={() => { clicked = true; }}
        disabled={true}
      />
    );
    fireEvent.click(screen.getByText('#다정한_츤데레'));
    expect(clicked).toBe(true);
  });
});

describe('TextField 컴포넌트', () => {
  it('라벨이 렌더링되는지 확인', () => {
    render(<TextField label="이름" value="" onChange={() => {}} />);
    expect(screen.getByText('이름')).toBeInTheDocument();
  });

  it('placeholder가 표시되는지 확인', () => {
    render(<TextField label="이름" value="" onChange={() => {}} placeholder="홍길동" />);
    expect(screen.getByPlaceholderText('홍길동')).toBeInTheDocument();
  });

  it('값 변경 이벤트 동작', () => {
    let value = '';
    render(
      <TextField label="이름" value={value} onChange={(v) => { value = v; }} />
    );
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '김철수' } });
    expect(value).toBe('김철수');
  });

  it('maxLength 카운터 표시', () => {
    render(<TextField label="소개" value="안녕" onChange={() => {}} maxLength={500} />);
    expect(screen.getByText('2/500')).toBeInTheDocument();
  });

  it('multiline 모드에서 textarea 렌더링', () => {
    render(<TextField label="소개" value="" onChange={() => {}} multiline />);
    const el = screen.getByRole('textbox');
    expect(el.tagName.toLowerCase()).toBe('textarea');
  });
});

describe('SelectField 컴포넌트', () => {
  const options = [
    { value: 'a', label: '옵션 A' },
    { value: 'b', label: '옵션 B' },
    { value: 'c', label: '옵션 C' },
  ];

  it('라벨이 렌더링되는지 확인', () => {
    render(<SelectField label="테스트" value="" onChange={() => {}} options={options} />);
    expect(screen.getByText('테스트')).toBeInTheDocument();
  });

  it('옵션이 모두 렌더링되는지 확인', () => {
    render(<SelectField label="테스트" value="" onChange={() => {}} options={options} />);
    expect(screen.getByText('옵션 A')).toBeInTheDocument();
    expect(screen.getByText('옵션 B')).toBeInTheDocument();
    expect(screen.getByText('옵션 C')).toBeInTheDocument();
  });

  it('값 변경 이벤트 동작', () => {
    let value = '';
    render(
      <SelectField
        label="테스트"
        value={value}
        onChange={(v) => { value = v; }}
        options={options}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(value).toBe('b');
  });
});

describe('RadioGroup 컴포넌트', () => {
  const options = [
    { value: 'yes', label: '예' },
    { value: 'no', label: '아니오' },
  ];

  it('모든 옵션이 렌더링되는지 확인', () => {
    render(<RadioGroup name="test" options={options} value="" onChange={() => {}} />);
    expect(screen.getByText('예')).toBeInTheDocument();
    expect(screen.getByText('아니오')).toBeInTheDocument();
  });

  it('라벨 렌더링', () => {
    render(
      <RadioGroup name="test" options={options} value="" onChange={() => {}} label="질문" />
    );
    expect(screen.getByText('질문')).toBeInTheDocument();
  });

  it('값 변경 이벤트 동작', () => {
    let value = '';
    render(
      <RadioGroup
        name="test"
        options={options}
        value={value}
        onChange={(v) => { value = v; }}
      />
    );
    fireEvent.click(screen.getByText('예'));
    expect(value).toBe('yes');
  });
});

describe('ProgressBar 컴포넌트', () => {
  it('라벨이 렌더링되는지 확인', () => {
    render(<ProgressBar current={1} total={3} label="테스트 진행 중" />);
    expect(screen.getByText('테스트 진행 중')).toBeInTheDocument();
  });

  it('진행 상태가 표시되는지 확인', () => {
    render(<ProgressBar current={2} total={3} />);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });
});

describe('PrivacyBadge 컴포넌트', () => {
  it('배지 텍스트 렌더링', () => {
    render(<PrivacyBadge />);
    expect(screen.getByText(/마담MJ의 비밀 금고에 안전하게 보관/)).toBeInTheDocument();
  });
});

describe('Layout 컴포넌트', () => {
  it('헤더에 로고 렌더링', () => {
    render(
      <RouterWrap>
        <Layout>
          <div>Content</div>
        </Layout>
      </RouterWrap>
    );
    expect(screen.getByText('마담MJ의 비밀 서재')).toBeInTheDocument();
  });

  it('children이 정상 렌더링', () => {
    render(
      <RouterWrap>
        <Layout>
          <div>테스트 콘텐츠</div>
        </Layout>
      </RouterWrap>
    );
    expect(screen.getByText('테스트 콘텐츠')).toBeInTheDocument();
  });

  it('푸터 렌더링', () => {
    render(
      <RouterWrap>
        <Layout>
          <div>Content</div>
        </Layout>
      </RouterWrap>
    );
    expect(screen.getByText(/당신의 인연을 소중히/)).toBeInTheDocument();
  });

  it('관리자 링크 표시', () => {
    render(
      <RouterWrap>
        <Layout>
          <div>Content</div>
        </Layout>
      </RouterWrap>
    );
    expect(screen.getByText('관리자')).toBeInTheDocument();
  });
});
