import styles from './PersonalityChip.module.css';

export default function PersonalityChip({ label, selected, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={onClick}
      disabled={disabled && !selected}
    >
      {label}
    </button>
  );
}
