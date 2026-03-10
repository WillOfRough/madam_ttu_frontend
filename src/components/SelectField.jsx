import { ChevronDown } from 'lucide-react';
import styles from './SelectField.module.css';

export default function SelectField({ label, value, onChange, options, placeholder = '선택해주세요', required, error }) {
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
      <div className={styles.selectWrap}>
        <select
          className={`${styles.select} ${!value ? styles.placeholder : ''} ${error ? styles.selectError : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.icon} />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
