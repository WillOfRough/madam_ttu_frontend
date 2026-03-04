import styles from './TextField.module.css';

export default function TextField({
  label,
  value,
  onChange,
  placeholder = '',
  multiline = false,
  maxLength,
  type = 'text',
}) {
  const Component = multiline ? 'textarea' : 'input';

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
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
