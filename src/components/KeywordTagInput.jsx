import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './KeywordTagInput.module.css';

export default function KeywordTagInput({
  label,
  hint,
  selected = [],
  suggestions = [],
  onToggle,
  maxTags = 8,
  required,
}) {
  const [custom, setCustom] = useState('');

  const handleAdd = () => {
    const tag = custom.trim();
    if (!tag || selected.includes(tag) || selected.length >= maxTags) return;
    onToggle(tag);
    setCustom('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

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
      {hint && <p className={styles.hint}>{hint}</p>}

      {/* 추천 키워드 */}
      <div className={styles.suggestions}>
        {suggestions.map((kw) => (
          <button
            key={kw}
            type="button"
            className={`${styles.chip} ${selected.includes(kw) ? styles.chipActive : ''}`}
            onClick={() => {
              if (selected.includes(kw) || selected.length < maxTags) {
                onToggle(kw);
              }
            }}
          >
            {kw}
            {selected.includes(kw) && <X size={12} />}
          </button>
        ))}
      </div>

      {/* 직접 입력 */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="직접 입력 후 Enter"
          maxLength={20}
        />
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleAdd}
          disabled={!custom.trim() || selected.length >= maxTags}
        >
          추가
        </button>
      </div>

      {/* 선택된 태그 */}
      {selected.length > 0 && (
        <div className={styles.selected}>
          {selected.map((kw) => (
            <span key={kw} className={styles.tag}>
              {kw}
              <button type="button" onClick={() => onToggle(kw)} className={styles.tagRemove}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <span className={styles.counter}>{selected.length}/{maxTags}개 선택</span>
    </div>
  );
}
