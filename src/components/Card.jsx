import styles from './Card.module.css';

const PAD = {
  none: '',
  sm: styles.padSm,
  md: styles.padMd,
  lg: styles.padLg,
};

/**
 * 카드 surface 공통 컴포넌트.
 * 배경·모서리·그림자·테두리 같은 "표면" 스타일을 한곳에서 관리한다.
 * 페이지마다 다른 여백/마진은 className 으로 넘겨 그대로 유지한다.
 *
 * @param {React.ElementType} [as='div']  렌더링 태그
 * @param {'none'|'sm'|'md'|'lg'} [padding='none']  내부 패딩 (none=페이지 className 으로 직접 지정)
 * @param {boolean} [border=true]          1px 테두리 표시
 * @param {boolean} [interactive=false]    hover 시 그림자 강조 + 포인터 커서
 * @param {string} [className]             페이지별 추가 클래스(여백 등) — surface 위에 덧입혀짐
 */
export default function Card({
  as: Tag = 'div',
  padding = 'none',
  border = true,
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    styles.card,
    border ? styles.bordered : '',
    PAD[padding] || '',
    interactive ? styles.interactive : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
