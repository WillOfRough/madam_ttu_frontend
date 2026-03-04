import styles from './RadioGroup.module.css';

export default function RadioGroup({ name, options, value, onChange, label }) {
  return (
    <fieldset className={styles.fieldset}>
      {label && <legend className={styles.legend}>{label}</legend>}
      <div className={styles.options}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`${styles.option} ${value === opt.value ? styles.selected : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              className={styles.input}
            />
            <span className={styles.radio} />
            <span className={styles.label}>{opt.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
