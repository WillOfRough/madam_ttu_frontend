import { useCallback, useMemo } from 'react';
import styles from './RangeSlider.module.css';

const STEP_DEFAULT = 1;
const HANDLE_GAP = 1;

export default function RangeSlider({
  label,
  unit = '',
  min,
  max,
  step = STEP_DEFAULT,
  valueMin,
  valueMax,
  onChange,
  disabled = false,
  anyChecked = false,
  onToggleAny,
  anyLabel = '상관없음',
  hint,
}) {
  const safeMin = Math.max(min, Math.min(valueMin ?? min, max));
  const safeMax = Math.max(min, Math.min(valueMax ?? max, max));

  const pctMin = useMemo(
    () => ((safeMin - min) / (max - min)) * 100,
    [safeMin, min, max],
  );
  const pctMax = useMemo(
    () => ((safeMax - min) / (max - min)) * 100,
    [safeMax, min, max],
  );

  const handleMinChange = useCallback(
    (e) => {
      const v = Number(e.target.value);
      const clamped = Math.min(v, safeMax - HANDLE_GAP);
      onChange?.({ min: Math.max(min, clamped), max: safeMax });
    },
    [onChange, safeMax, min],
  );

  const handleMaxChange = useCallback(
    (e) => {
      const v = Number(e.target.value);
      const clamped = Math.max(v, safeMin + HANDLE_GAP);
      onChange?.({ min: safeMin, max: Math.min(max, clamped) });
    },
    [onChange, safeMin, max],
  );

  const containerCls = [
    styles.container,
    disabled || anyChecked ? styles.disabled : '',
  ].join(' ');

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {anyChecked ? (
          <span className={styles.valueAny}>상관없음</span>
        ) : (
          <span className={styles.value}>
            <strong>{safeMin}</strong>
            <span className={styles.dash}>~</span>
            <strong>{safeMax}</strong>
            <span className={styles.unit}>{unit}</span>
          </span>
        )}
      </div>

      <div className={containerCls}>
        <div className={styles.track} />
        <div
          className={styles.trackActive}
          style={{ left: `${pctMin}%`, width: `${Math.max(0, pctMax - pctMin)}%` }}
        />
        <input
          type="range"
          className={styles.range}
          min={min}
          max={max}
          step={step}
          value={safeMin}
          onChange={handleMinChange}
          disabled={disabled || anyChecked}
          aria-label={`${label} 최소`}
        />
        <input
          type="range"
          className={styles.range}
          min={min}
          max={max}
          step={step}
          value={safeMax}
          onChange={handleMaxChange}
          disabled={disabled || anyChecked}
          aria-label={`${label} 최대`}
        />
      </div>

      <div className={styles.bounds}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>

      {onToggleAny && (
        <label className={styles.anyToggle}>
          <input
            type="checkbox"
            checked={anyChecked}
            onChange={(e) => onToggleAny(e.target.checked)}
          />
          <span className={styles.anyBox} aria-hidden />
          <span className={styles.anyText}>{anyLabel}</span>
        </label>
      )}

      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
