import { useState, useEffect } from 'react';
import useFormStore from '../../store/formStore';
import DragRanking from '../../components/DragRanking';
import RadioGroup from '../../components/RadioGroup';
import {
  PREFERENCE_PRIORITIES,
  RELIGION_PREFERENCE_OPTIONS,
  DRINKING_PREFERENCE_OPTIONS,
  SMOKING_PREFERENCE_OPTIONS,
  MADAM_QUOTES,
} from '../../data/constants';
import styles from './Step2Preference.module.css';

export default function Step2Preference() {
  const { formData, updatePreference, prevStep, nextStep } = useFormStore();
  const prefs = formData.preferences;

  const [priorityItems, setPriorityItems] = useState(() =>
    prefs.priorities.map((id) => PREFERENCE_PRIORITIES.find((p) => p.id === id))
  );

  useEffect(() => {
    updatePreference(
      'priorities',
      priorityItems.map((item) => item.id)
    );
  }, [priorityItems]);

  return (
    <div className={styles.step}>
      {/* Madam Quote */}
      <div className={styles.madamQuote}>
        <span className={styles.quoteIcon}>"</span>
        <p>{MADAM_QUOTES.step2_intro}</p>
      </div>

      {/* Priority Ranking */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{MADAM_QUOTES.step2_priority}</h3>
        <p className={styles.hint}>드래그해서 순서를 바꿔주세요. 위에 있을수록 중요해요.</p>
        <DragRanking items={priorityItems} onReorder={setPriorityItems} />
      </section>

      {/* Religion Preference */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>종교에 대해</h3>
        <RadioGroup
          name="religionPref"
          options={RELIGION_PREFERENCE_OPTIONS}
          value={prefs.religionPref}
          onChange={(v) => updatePreference('religionPref', v)}
        />
      </section>

      {/* Drinking Preference */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>음주에 대해</h3>
        <RadioGroup
          name="drinkingPref"
          options={DRINKING_PREFERENCE_OPTIONS}
          value={prefs.drinkingPref}
          onChange={(v) => updatePreference('drinkingPref', v)}
        />
      </section>

      {/* Smoking Preference */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>흡연에 대해</h3>
        <RadioGroup
          name="smokingPref"
          options={SMOKING_PREFERENCE_OPTIONS}
          value={prefs.smokingPref}
          onChange={(v) => updatePreference('smokingPref', v)}
        />
      </section>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={prevStep}>
          이전으로
        </button>
        <button className={styles.submitBtn} onClick={nextStep}>
          마담MJ에게 전달하기
        </button>
      </div>
    </div>
  );
}
