import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, BookOpen } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAdminStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin/dashboard');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
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
            <Lock size={16} className={styles.inputIcon} />
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="비밀번호를 입력하세요"
              autoFocus
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn}>
            입장하기
          </button>
        </form>
      </div>
    </div>
  );
}
