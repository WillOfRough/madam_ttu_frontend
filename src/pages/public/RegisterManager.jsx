import { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { generateNickname } from '../../data/constants';
import styles from './RegisterManager.module.css';
import oathStyles from './ClientOath.module.css';

const OATH_ITEMS = [
  '매칭 과정에서 취득한 회원의 개인정보(이름, 연락처, 사진 등)를 제3자에게 무단으로 제공하거나 유출하지 않겠습니다.',
  '수집된 개인정보는 매칭 목적 이외의 용도로 사용하지 않겠습니다.',
  '매칭이 종료되거나 회원이 탈퇴를 요청한 경우, 관련 정보를 지체 없이 삭제하겠습니다.',
  '위 사항을 위반할 경우 서비스 이용 제한 및 민·형사상 법적 책임을 질 수 있음을 이해합니다.',
];

export default function RegisterManager() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialNickname = useMemo(() => generateNickname(), []);

  // 이미 로그인한 사용자는 대시보드로 리다이렉트
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const [oathAgreed, setOathAgreed] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nickname, setNickname] = useState('');
  const [suggestedNickname, setSuggestedNickname] = useState(initialNickname);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState(null);

  const NAME_REGEX = /^[가-힣a-zA-Z]{2,20}$/;

  const handleNameChange = (value) => {
    setName(value);
    if (value && !NAME_REGEX.test(value)) {
      setNameError('한글 또는 영문만 입력 가능하며, 2~20자여야 합니다.');
    } else {
      setNameError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!NAME_REGEX.test(name.trim())) {
      setNameError('한글 또는 영문만 입력 가능하며, 2~20자여야 합니다.');
      return;
    }

    if (password !== confirmPw) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const finalNickname = nickname.trim() || suggestedNickname;
    try {
      await register({ token, email, password, name: name.trim(), nickname: finalNickname });
      navigate('/dashboard/guide');
    } catch (err) {
      setError(err.message || '가입에 실패했습니다.');
    }
  };

  if (!oathAgreed) {
    return (
      <div className={oathStyles.page}>
        <div className={oathStyles.container}>
          <div className={oathStyles.iconWrap}>
            <ShieldCheck size={36} />
          </div>
          <h1 className={oathStyles.title}>회원 정보 보호 서약</h1>
          <h2 className={oathStyles.subtitle}>매니저로서 꼭 지켜주세요</h2>

          <div className={oathStyles.items}>
            {OATH_ITEMS.map((text, idx) => (
              <div key={idx} className={oathStyles.item}>
                <span className={oathStyles.itemNum}>{idx + 1}.</span>
                <span className={oathStyles.itemText}>{text}</span>
              </div>
            ))}
          </div>

          <label className={oathStyles.agreeAllLabel}>
            <input
              type="checkbox"
              checked={oathAgreed}
              onChange={(e) => setOathAgreed(e.target.checked)}
              className={oathStyles.checkbox}
            />
            <span>위 내용을 숙지했으며 서약합니다.</span>
          </label>

          <button
            className={oathStyles.proceedBtn}
            onClick={() => setOathAgreed(true)}
            disabled={!oathAgreed}
          >
            서약하고 회원가입 진행하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <p className={styles.subtitle}>매니저 가입</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>이름 <span className={styles.required}>*</span></label>
            <input
              className={`${styles.input} ${nameError ? styles.inputError : ''}`}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="실명을 입력하세요 (한글/영문 2~20자)"
              autoFocus
              required
            />
            {nameError && <p className={styles.fieldError}>{nameError}</p>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>별명</label>
            <input
              className={styles.input}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={suggestedNickname}
            />
            <div className={styles.nicknameHint}>
              <span>입력하지 않으면 <strong>{suggestedNickname}</strong> 으로 설정됩니다</span>
              <button
                type="button"
                className={styles.refreshBtn}
                onClick={() => setSuggestedNickname(generateNickname())}
              >
                <RefreshCw size={13} /> 다른 별명
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>이메일</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 (8자 이상)"
              required
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>비밀번호 확인</label>
            <input
              className={styles.input}
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="비밀번호 재입력"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.submitBtn}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '가입하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
