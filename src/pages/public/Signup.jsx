import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { generateNickname } from '../../data/constants';
import styles from './RegisterManager.module.css';

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialNickname = useMemo(() => generateNickname(), []);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nickname, setNickname] = useState('');
  const [suggestedNickname, setSuggestedNickname] = useState(initialNickname);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [inviteCode, setInviteCode] = useState('');
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
      await signup({
        email,
        password,
        name: name.trim(),
        nickname: finalNickname,
        inviteCode: inviteCode.trim() || undefined,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '가입에 실패했습니다.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>knotsandlinks</h1>
        <p className={styles.subtitle}>매니저 회원가입</p>

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
            <label className={styles.label}>별명 <span className={styles.required}>*</span></label>
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
            <label className={styles.label}>이메일 <span className={styles.required}>*</span></label>
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
            <label className={styles.label}>비밀번호 <span className={styles.required}>*</span></label>
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
            <label className={styles.label}>비밀번호 확인 <span className={styles.required}>*</span></label>
            <input
              className={styles.input}
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="비밀번호 재입력"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>초대 코드</label>
            <input
              className={styles.input}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="초대 코드가 있으면 입력하세요 (선택)"
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

          <p className={styles.loginLink}>
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
