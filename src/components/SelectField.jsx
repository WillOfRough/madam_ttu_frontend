import { ChevronDown } from 'lucide-react';
import styles from './SelectField.module.css';

export default function SelectField({ label, value, onChange, options, placeholder = '선택해주세요' }) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.selectWrap}>
        <select
          className={`${styles.select} ${!value ? styles.placeholder : ''}`}
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
    </div>
  );
}
