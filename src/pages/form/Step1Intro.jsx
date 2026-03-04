import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import useFormStore from '../../store/formStore';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import RadioGroup from '../../components/RadioGroup';
import PersonalityChip from '../../components/PersonalityChip';
import PhotoUploader from '../../components/PhotoUploader';
import PrivacyBadge from '../../components/PrivacyBadge';
import {
  GENDER_OPTIONS,
  AGE_OPTIONS,
  HEIGHT_OPTIONS,
  EDUCATION_OPTIONS,
  RELIGION_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  MBTI_OPTIONS,
  PERSONALITY_KEYWORDS,
  HOBBY_OPTIONS,
  LOCATION_OPTIONS,
  MADAM_QUOTES,
  generateNickname,
} from '../../data/constants';
import styles from './Step1Intro.module.css';

export default function Step1Intro() {
  const { formData, updateField, togglePersonality, toggleHobby, addPhotos, removePhoto, nextStep } =
    useFormStore();

  // Nickname auto-suggest
  const [suggestedNickname, setSuggestedNickname] = useState('');

  const refreshNickname = useCallback(() => {
    setSuggestedNickname(generateNickname(formData.gender || 'male'));
  }, [formData.gender]);

  useEffect(() => {
    refreshNickname();
  }, [formData.gender, refreshNickname]);

  // Required: everything except religion, hobbies, hobby text fields
  const canProceed =
    formData.gender &&
    formData.name &&
    formData.age &&
    formData.height &&
    formData.location &&
    formData.education &&
    formData.job &&
    formData.drinking &&
    formData.smoking &&
    formData.mbti &&
    formData.personality.length >= 1 &&
    formData.intro &&
    formData.photos.length >= 3;

  // If no nickname typed, use suggested one on next step
  const handleNext = () => {
    if (!formData.nickname && suggestedNickname) {
      updateField('nickname', suggestedNickname);
    }
    nextStep();
  };

  return (
    <div className={styles.step}>
      {/* Madam Quote */}
      <div className={styles.madamQuote}>
        <div className={styles.quoteMark}>&ldquo;</div>
        <p>{MADAM_QUOTES.step1_intro}</p>
        <div className={styles.quoteBar} />
      </div>

      {/* ── 기본 정보 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>먼저, 당신에 대해 알려주세요</h3>
          <div className={styles.sectionLine} />
        </div>

        <div className={styles.fieldRow}>
          <RadioGroup
            name="gender"
            options={GENDER_OPTIONS}
            value={formData.gender}
            onChange={(v) => updateField('gender', v)}
            label="성별을 알려주세요"
          />

          <TextField
            label="이름이 어떻게 되세요?"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            placeholder="본명을 입력해주세요"
          />

          <div className={styles.nicknameField}>
            <TextField
              label="마담MJ가 불러드릴 별칭이에요"
              value={formData.nickname}
              onChange={(v) => updateField('nickname', v)}
              placeholder={suggestedNickname || '자동 생성 중...'}
            />
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={refreshNickname}
              title="다른 닉네임 추천받기"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          <SelectField
            label="올해 나이가 어떻게 되세요?"
            value={formData.age}
            onChange={(v) => updateField('age', v)}
            options={AGE_OPTIONS}
          />

          <SelectField
            label="키가 어떻게 되세요?"
            value={formData.height}
            onChange={(v) => updateField('height', v)}
            options={HEIGHT_OPTIONS}
          />

          <SelectField
            label="주로 어디에서 지내세요?"
            value={formData.location}
            onChange={(v) => updateField('location', v)}
            options={LOCATION_OPTIONS}
          />

          <SelectField
            label="최종 학력을 알려주세요"
            value={formData.education}
            onChange={(v) => updateField('education', v)}
            options={EDUCATION_OPTIONS}
          />

          <TextField
            label="어떤 일을 하고 계세요?"
            value={formData.job}
            onChange={(v) => updateField('job', v)}
            placeholder="예: 소프트웨어 엔지니어"
          />
        </div>
      </section>

      {/* ── 나의 일상 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>나의 일상이 궁금해요</h3>
          <div className={styles.sectionLine} />
        </div>

        <div className={styles.fieldRow}>
          <SelectField
            label={<>종교가 있으신가요?<span className={styles.optionalBadge}>선택</span></>}
            value={formData.religion}
            onChange={(v) => updateField('religion', v)}
            options={RELIGION_OPTIONS}
          />

          <SelectField
            label="술은 즐기시는 편인가요?"
            value={formData.drinking}
            onChange={(v) => updateField('drinking', v)}
            options={DRINKING_OPTIONS}
          />

          <SelectField
            label="담배는 피우시나요?"
            value={formData.smoking}
            onChange={(v) => updateField('smoking', v)}
            options={SMOKING_OPTIONS}
          />

          <SelectField
            label="혹시 MBTI를 알고 계세요?"
            value={formData.mbti}
            onChange={(v) => updateField('mbti', v)}
            options={MBTI_OPTIONS}
            placeholder="모르면 건너뛰어도 괜찮아요"
          />
        </div>
      </section>

      {/* ── 성격 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>주변에서 이런 얘기 많이 들어요</h3>
          <div className={styles.sectionLine} />
        </div>
        <p className={styles.hint}>
          나를 잘 표현하는 키워드를 골라주세요 (최대 5개)
          <span className={styles.counter}>{formData.personality.length} / 5</span>
        </p>
        <div className={styles.chipGrid}>
          {PERSONALITY_KEYWORDS.map((kw) => (
            <PersonalityChip
              key={kw}
              label={kw}
              selected={formData.personality.includes(kw)}
              onClick={() => togglePersonality(kw)}
              disabled={formData.personality.length >= 5}
            />
          ))}
        </div>
      </section>

      {/* ── 취미 · 관심사 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            휴일은 이렇게 보내요
            <span className={styles.optionalBadge}>선택</span>
          </h3>
          <div className={styles.sectionLine} />
        </div>
        <p className={styles.hint}>
          관심 있는 것들을 골라주세요 (최대 5개)
          <span className={styles.counter}>{formData.hobbies.length} / 5</span>
        </p>
        <div className={styles.chipGrid}>
          {HOBBY_OPTIONS.map((hobby) => (
            <PersonalityChip
              key={hobby}
              label={hobby}
              selected={formData.hobbies.includes(hobby)}
              onClick={() => toggleHobby(hobby)}
              disabled={formData.hobbies.length >= 5}
            />
          ))}
        </div>

        <div className={styles.fieldRow}>
          <TextField
            label="요즘 빠져있는 게 있나요?"
            value={formData.commonCompliment}
            onChange={(v) => updateField('commonCompliment', v)}
            placeholder="예: 최근에 재즈 피아노를 배우기 시작했어요"
          />

          <TextField
            label="내가 가보고 싶은 여행지가 있다면?"
            value={formData.dreamTrip}
            onChange={(v) => updateField('dreamTrip', v)}
            placeholder="예: 남프랑스 프로방스의 라벤더 밭"
          />

          <TextField
            label="나만의 힐링 방법이 있다면?"
            value={formData.holidayStyle}
            onChange={(v) => updateField('holidayStyle', v)}
            placeholder="예: 비 오는 날 창가에서 책 읽기"
          />
        </div>
      </section>

      {/* ── 자기소개 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>마담MJ에게 하고 싶은 이야기</h3>
          <div className={styles.sectionLine} />
        </div>
        <TextField
          value={formData.intro}
          onChange={(v) => updateField('intro', v)}
          placeholder="나는 이런 사람이에요, 이런 만남을 원해요... 자유롭게 적어주세요"
          multiline
          maxLength={500}
        />
      </section>

      {/* ── 사진 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>당신의 매력을 보여줄 사진을 올려주세요</h3>
          <div className={styles.sectionLine} />
        </div>
        <PhotoUploader
          photos={formData.photos}
          onAdd={addPhotos}
          onRemove={removePhoto}
          min={3}
          max={6}
        />
      </section>

      <PrivacyBadge />

      {/* Next Button */}
      <div className={styles.actions}>
        <button
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={!canProceed}
        >
          <span>다음 단계로</span>
        </button>
        {!canProceed && (
          <p className={styles.validation}>
            필수 항목을 모두 입력하고, 사진을 3장 이상 올려주세요.
          </p>
        )}
      </div>
    </div>
  );
}
