import styles from './EmptyState.module.css';

/**
 * 빈 상태(empty state) 공통 컴포넌트.
 * 페이지마다 중복 정의되던 .empty / .emptyIcon / .emptyTitle / .emptyHint 패턴을 대체한다.
 *
 * @param {React.ComponentType} [icon]  lucide 아이콘 컴포넌트 (예: Bell, Users)
 * @param {string} title                제목 (필수)
 * @param {string} [hint]               보조 설명
 * @param {React.ReactNode} [children]  버튼 등 액션 영역
 * @param {'md'|'sm'} [size='md']       세로 여백 크기
 */
export default function EmptyState({ icon: Icon, title, hint, children, size = 'md' }) {
  return (
    <div className={`${styles.empty} ${styles[size] || ''}`}>
      {Icon && (
        <div className={styles.icon}>
          <Icon size={24} strokeWidth={1.4} />
        </div>
      )}
      <p className={styles.title}>{title}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children && <div className={styles.action}>{children}</div>}
    </div>
  );
}
