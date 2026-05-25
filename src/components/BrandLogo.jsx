import styles from './BrandLogo.module.css';

const BRAND_NAME = 'Knots & Links';

export default function BrandLogo({
  size = 26,
  showName = true,
  className = '',
}) {
  const dotSize = Math.round(size * 0.385);
  const radius = Math.max(6, Math.round(size * 0.31));
  const fontSize = size <= 26 ? 12.5 : 13;
  const rootClass = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <div
        className={styles.icon}
        style={{ width: size, height: size, borderRadius: radius }}
      >
        <div
          className={styles.iconDot}
          style={{ width: dotSize, height: dotSize }}
        />
      </div>
      {showName && (
        <span className={styles.name} style={{ fontSize }}>
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
}
