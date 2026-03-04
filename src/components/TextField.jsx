import styles from './TextField.module.css';

export default function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  multiline = false,
  maxLength,
  type = 'text',
  required,
}) {
  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className={styles.wrapper}>
      {label && (
        <label className={styles.label}>
          {label}
          {required != null && (
            <span className={required ? styles.requiredBadge : styles.optionalBadge}>
              {required ? '필수' : '선택'}
            </span>
          )}
        </label>
      )}
      <Component
        className={`${styles.input} ${multiline ? styles.textarea : ''}`}
        type={multiline ? undefined : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={multiline ? 4 : undefined}
      />
      {maxLength && (
        <span className={styles.counter}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}
