import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Shield } from 'lucide-react';
import styles from './Layout.module.css';

export default function Layout({ children, variant = 'default' }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className={`${styles.layout} ${styles[variant]}`}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <BookOpen size={24} className={styles.logoIcon} />
          <span className={styles.logoText}>마담MJ의 비밀 서재</span>
        </Link>
        {!isAdmin && (
          <Link to="/admin" className={styles.adminLink}>
            <Shield size={16} />
            <span>관리자</span>
          </Link>
        )}
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; 2026 마담MJ의 비밀 서재. 당신의 인연을 소중히 다룹니다.</p>
      </footer>
    </div>
  );
}
