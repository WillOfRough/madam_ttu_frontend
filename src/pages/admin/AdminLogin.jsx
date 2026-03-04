import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, BookOpen } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAdminStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await login({ email, password });
    setLoading(false);
    if (ok) {
      navigate('/admin/dashboard');
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setPassword('');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <BookOpen size={28} />
        </div>
        <h2 className={styles.title}>마담MJ의 서재</h2>
        <p className={styles.subtitle}>관리자 전용 입구</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputWrap}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="관리자 이메일"
              autoFocus
              autoComplete="email"
            />
          </div>
          <div className={styles.inputWrap}>
            <Lock size={16} className={styles.inputIcon} />
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? '확인 중...' : '입장하기'}
          </button>
        </form>
      </div>
    </div>
  );
}
