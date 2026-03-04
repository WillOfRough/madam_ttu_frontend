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
  EDUCATION_OPTIONS,
  RELIGION_OPTIONS,
  DRINKING_OPTIONS,
  PERSONALITY_KEYWORDS,
  HOBBY_OPTIONS,
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

  // Birth year validation
  const birthYearValid =
    formData.birthYear.length === 4 &&
    /^\d{4}$/.test(formData.birthYear) &&
    Number(formData.birthYear) >= 1960 &&
    Number(formData.birthYear) <= 2005;

  // Height validation (140~210)
  const heightValid =
    /^\d{3}$/.test(formData.height) &&
    Number(formData.height) >= 140 &&
    Number(formData.height) <= 210;

  // Required: everything except religion, hobbies, hobby text fields, oneLiner, smoking, lastWord
  const canProceed =
    formData.gender &&
    formData.name &&
    birthYearValid &&
    heightValid &&
    formData.location &&
    formData.education &&
    formData.job &&
    formData.drinking &&
    formData.personality.length >= 1 &&
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

      {/* ── 소중한 당신을 알고 싶어요 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>소중한 당신을 알고 싶어요</h3>
          <div className={styles.sectionLine} />
        </div>

        <div className={styles.fieldRow}>
          <RadioGroup
            name="gender"
            options={GENDER_OPTIONS}
            value={formData.gender}
            onChange={(v) => updateField('gender', v)}
            label="당신은 멋진 신사분인가요, 아름다운 숙녀분인가요?"
            required
          />

          <TextField
            label="당신은 어떤 향기를 가진 사람인가요?"
            value={formData.oneLiner}
            onChange={(v) => updateField('oneLiner', v)}
            placeholder="예: 비 오는 날의 따뜻한 라떼 같은 사람입니다"
            required={false}
          />

          <div className={styles.nicknameField}>
            <TextField
              label="이름 대신 제가 부를 예쁜 별명을 알려주세요!"
              value={formData.nickname}
              onChange={(v) => updateField('nickname', v)}
              placeholder={suggestedNickname || '다정한호밀빵, 햇살가득한오후'}
              required={false}
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

          <TextField
            label="이름이 어떻게 되세요?"
            value={formData.name}
            onChange={(v) => updateField('name', v)}
            placeholder="본명을 입력해주세요"
            required
          />

          <div>
            <TextField
              label="당신이 세상에 빛을 본 소중한 해는 언제인가요?"
              value={formData.birthYear}
              onChange={(v) => updateField('birthYear', v.replace(/\D/g, '').slice(0, 4))}
              placeholder="숫자 4자리로 톡톡 적어주세요! (예: 1995)"
              required
            />
            {formData.birthYear && !birthYearValid && (
              <p className={styles.fieldError}>
                어머나, 4자리 숫자로 정확히 적어주셔야 제가 기록해둘 수 있어요!
              </p>
            )}
          </div>

          <TextField
            label="지금 당신의 일상이 머무는 곳은 어디인가요?"
            value={formData.location}
            onChange={(v) => updateField('location', v)}
            placeholder="예: 서울 마포구, 경기도 용인 수지"
            required
          />

          <div>
            <TextField
              label="당신의 훤칠한 높이는 어느 정도인가요?"
              value={formData.height}
              onChange={(v) => updateField('height', v.replace(/\D/g, '').slice(0, 3))}
              placeholder="숫자만 적어주세요 (예: 175)"
              required
            />
            {formData.height && !heightValid && (
              <p className={styles.fieldError}>
                3자리 숫자로 정확히 적어주세요! (예: 165, 178)
              </p>
            )}
          </div>

          <SelectField
            label="배움의 길을 어디까지 걸어오셨나요?"
            value={formData.education}
            onChange={(v) => updateField('education', v)}
            options={EDUCATION_OPTIONS}
            required
          />

          <TextField
            label="지금 당신의 열정을 쏟고 있는 곳은 어디인가요?"
            value={formData.job}
            onChange={(v) => updateField('job', v)}
            placeholder="공무원, 전문직, 사업가, 회사 이름 등 편하게 적어주세요"
            required
          />
        </div>
      </section>

      {/* ── 나의 일상 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>당신의 일상이 궁금해요</h3>
          <div className={styles.sectionLine} />
        </div>

        <div className={styles.fieldRow}>
          <SelectField
            label="마음속으로 깊이 의지하는 신념이나 종교가 있으신가요?"
            value={formData.religion}
            onChange={(v) => updateField('religion', v)}
            options={RELIGION_OPTIONS}
            required={false}
          />

          <SelectField
            label="사랑하는 사람과 시원한 맥주 한 잔, 즐기시는 편인가요?"
            value={formData.drinking}
            onChange={(v) => updateField('drinking', v)}
            options={DRINKING_OPTIONS}
            required
          />

          <TextField
            label="혹시 MBTI를 알고 계세요?"
            value={formData.mbti}
            onChange={(v) => updateField('mbti', v.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
            placeholder="모르면 건너뛰어도 괜찮아요 (예: ENFP)"
            required={false}
          />
        </div>
      </section>

      {/* ── 성격 키워드 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            당신만의 특별한 매력을 뽐내볼까요?
            <span className={styles.requiredBadge}>필수</span>
          </h3>
          <div className={styles.sectionLine} />
        </div>
        <p className={styles.hint}>
          어떤 단어들이 당신을 가장 잘 설명할까요? (최대 5개)
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
            휴일에는 주로 어떻게 시간을 보내시나요?
            <span className={styles.optionalBadge}>선택</span>
          </h3>
          <div className={styles.sectionLine} />
        </div>
        <p className={styles.hint}>
          당신의 마음을 즐겁게 하는 일들을 골라주세요 (최대 5개)
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
            required={false}
          />

          <TextField
            label="내가 가보고 싶은 여행지가 있다면?"
            value={formData.dreamTrip}
            onChange={(v) => updateField('dreamTrip', v)}
            placeholder="예: 남프랑스 프로방스의 라벤더 밭"
            required={false}
          />

          <TextField
            label="나만의 힐링 방법이 있다면?"
            value={formData.holidayStyle}
            onChange={(v) => updateField('holidayStyle', v)}
            placeholder="예: 비 오는 날 창가에서 책 읽기"
            required={false}
          />
        </div>
      </section>

      {/* ── 사진 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            당신의 가장 빛나는 미소를 보여주세요!
            <span className={styles.requiredBadge}>필수</span>
          </h3>
          <div className={styles.sectionLine} />
        </div>
        <p className={styles.hint}>
          정면이 포함된 사진 3장 이상이면 충분해요. 얼굴이 잘 보이지 않으면 제가 상대를 찾을 때 너무 속상할 거예요!
        </p>
        <PhotoUploader
          photos={formData.photos}
          onAdd={addPhotos}
          onRemove={removePhoto}
          min={3}
          max={6}
        />
      </section>

      {/* ── 마담MJ에게 마지막 한마디 ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            마담MJ에게 마지막으로 한마디!
            <span className={styles.optionalBadge}>선택</span>
          </h3>
          <div className={styles.sectionLine} />
        </div>
        <p className={styles.hint}>
          진짜 원하는 걸 솔직하게 적어주세요. 여기에 적는 내용은 마담MJ만 볼 수 있어요!
        </p>
        <div className={styles.fieldRow}>
          <TextField
            label="마담MJ에게만 살짝 귀띔해주세요"
            value={formData.lastWord}
            onChange={(v) => updateField('lastWord', v)}
            placeholder="예: 재력이 있는 분이면 좋겠어요 / 키 큰 분이 좋아요 / 연상만 원해요"
            multiline
            maxLength={300}
            required={false}
          />
        </div>
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
