import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import useSeekerFormStore from '../../store/seekerFormStore';
import * as seekerService from '../../api/seekerService';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import RadioGroup from '../../components/RadioGroup';
import ProgressBar from '../../components/ProgressBar';
import StepTransition from '../../components/StepTransition';
import KeywordTagInput from '../../components/KeywordTagInput';
import {
  GENDER_OPTIONS,
  EDUCATION_OPTIONS,
  RELIGION_OPTIONS,
  generateNickname,
  INTRO_KEYWORDS,
  IDEAL_KEYWORDS,
} from '../../data/constants';
import styles from './SeekerForm.module.css';

const STEP_TITLES = [
  '당신을 알아가는 첫걸음',
  '당신의 매력을 보여주세요',
  '당신만의 색깔',
  '진심을 담아',
];

export default function SeekerForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    step, form, suggestedNickname,
    setToken, setSuggestedNickname, nextStep, prevStep,
    setField, toggleKeyword, getPayload, reset,
  } = useSeekerFormStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setToken(token);
    setSuggestedNickname(generateNickname());
    return () => reset();
  }, [token, setToken, setSuggestedNickname, reset]);

  const rerollNickname = () => {
    setSuggestedNickname(generateNickname());
    setField('nickname', '');
  };

  const displayNickname = form.nickname || suggestedNickname;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await seekerService.createSeeker(getPayload());
      navigate('/apply/complete');
    } catch (err) {
      setError(err.message || '제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
    setSubmitting(false);
  };

  const canNext = () => {
    switch (step) {
      case 0:
        return form.gender && form.birthYear.length === 4 && form.phone;
      case 1:
        return form.occupation;
      case 2:
        return true;
      case 3:
        return form.introduction.length >= 50 && form.consentPrivacy && form.consentThirdParty;
      default:
        return false;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.topRow}>
            {step > 0 && (
              <button className={styles.backBtn} onClick={prevStep}>
                <ArrowLeft size={18} /> 뒤로
              </button>
            )}
            <span className={styles.logo}>findmyone</span>
          </div>

          <p className={styles.notice}>이 링크는 귀하만을 위한 일회성 링크입니다</p>

          <ProgressBar
            current={step + 1}
            total={4}
            label={`Step ${step + 1}/4`}
            progressText={STEP_TITLES[step]}
          />
        </div>

        <StepTransition stepKey={step}>
          {/* ── Step 1: 기본 정보 ── */}
          {step === 0 && (
            <div className={styles.fields}>
              {/* 별명 */}
              <div className={styles.nicknameSection}>
                <label className={styles.fieldLabel}>
                  이곳에서 불릴 당신만의 별명을 골라주세요
                  <span className={styles.optionalBadge}>선택</span>
                </label>
                <p className={styles.nicknameHint}>
                  입력하지 않으면 아래 추천 별명이 사용됩니다
                </p>
                <div className={styles.nicknameRow}>
                  <div className={styles.nicknamePreview}>
                    <span className={styles.nicknameEmoji}>🎭</span>
                    <span className={styles.nicknameText}>{displayNickname}</span>
                  </div>
                  <button type="button" className={styles.rerollBtn} onClick={rerollNickname}>
                    <RefreshCw size={16} />
                    다른 별명
                  </button>
                </div>
                <input
                  className={styles.nicknameInput}
                  value={form.nickname}
                  onChange={(e) => setField('nickname', e.target.value)}
                  placeholder={`추천: ${suggestedNickname}`}
                  maxLength={20}
                />
              </div>

              <RadioGroup
                name="gender"
                label="성별"
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(v) => setField('gender', v)}
                required
              />

              {/* 태어난 년도 */}
              <TextField
                label="당신이 세상에 온 해를 알려주세요 (숫자 4자리)"
                value={form.birthYear}
                onChange={(v) => setField('birthYear', v.replace(/\D/g, '').slice(0, 4))}
                placeholder="1994"
                maxLength={4}
                required
              />

              <TextField
                label="연락처"
                value={form.phone}
                onChange={(v) => {
                  const nums = v.replace(/\D/g, '').slice(0, 11);
                  let formatted = nums;
                  if (nums.length > 7) formatted = `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
                  else if (nums.length > 3) formatted = `${nums.slice(0, 3)}-${nums.slice(3)}`;
                  setField('phone', formatted);
                }}
                placeholder="010-0000-0000"
                type="tel"
                required
              />

              {/* 거주지 - 자유 입력 */}
              <TextField
                label="현재 당신의 일상이 머무는 곳은 어디인가요?"
                value={form.location}
                onChange={(v) => setField('location', v)}
                placeholder="예) 서울 영등포구, 경기도 용인 수지"
                required={false}
              />
            </div>
          )}

          {/* ── Step 2: 모습 ── */}
          {step === 1 && (
            <div className={styles.fields}>
              <TextField
                label="당신의 멋진 비율을 상상할 수 있게 키를 알려주세요"
                value={form.height}
                onChange={(v) => setField('height', v)}
                placeholder="178 (cm)"
                type="number"
                required={false}
              />
              <TextField
                label="어떤 가치 있는 일로 당신의 하루를 채우고 계신가요?"
                value={form.occupation}
                onChange={(v) => setField('occupation', v)}
                placeholder="소프트웨어 엔지니어"
                required
              />
              <TextField
                label="회사"
                value={form.company}
                onChange={(v) => setField('company', v)}
                placeholder="현재 근무 중인 곳"
                required={false}
              />
              <SelectField
                label="학력"
                value={form.education}
                onChange={(v) => setField('education', v)}
                options={EDUCATION_OPTIONS}
                placeholder="최종 학력을 알려주세요"
                required={false}
              />
            </div>
          )}

          {/* ── Step 3: 취향 ── */}
          {step === 2 && (
            <div className={styles.fields}>
              <SelectField
                label="종교"
                value={form.religion}
                onChange={(v) => setField('religion', v)}
                options={RELIGION_OPTIONS}
                placeholder="선택해주세요"
                required={false}
              />
              <TextField
                label="당신을 가장 잘 설명해 주는 4개의 알파벳이 있을까요?"
                value={form.mbti}
                onChange={(v) => setField('mbti', v.toUpperCase())}
                placeholder="ENTJ"
                maxLength={4}
                required={false}
              />
              <TextField
                label="일상 속에서 당신을 미소 짓게 하는 활동은 무엇인가요?"
                value={form.hobbies}
                onChange={(v) => setField('hobbies', v)}
                placeholder="등산, 요리, 독서"
                required={false}
              />
            </div>
          )}

          {/* ── Step 4: 진심 ── */}
          {step === 3 && (
            <div className={styles.fields}>
              {/* 자기소개 키워드 */}
              <KeywordTagInput
                label="나를 표현하는 키워드"
                hint="클릭하거나 직접 입력해주세요. 키워드만으로도 당신이 어떤 사람인지 느껴져요!"
                suggestions={INTRO_KEYWORDS}
                selected={form.introKeywords}
                onToggle={(kw) => toggleKeyword('introKeywords', kw)}
                required={false}
              />

              <TextField
                label="당신이라는 사람을 한 권의 책으로 비유한다면 어떤 문장을 적고 싶으신가요?"
                value={form.introduction}
                onChange={(v) => setField('introduction', v)}
                placeholder="진솔하게 자신을 표현해주세요..."
                multiline
                maxLength={1000}
                required
              />
              {form.introduction.length > 0 && form.introduction.length < 50 && (
                <p className={styles.hint}>
                  {50 - form.introduction.length}자 더 작성해주세요 (최소 50자)
                </p>
              )}

              {/* 이상형 키워드 */}
              <div className={styles.idealSection}>
                <div className={styles.idealNotice}>
                  <p className={styles.idealNoticeTitle}>💡 솔직할수록 좋은 인연을 만나요</p>
                  <p className={styles.idealNoticeText}>
                    "키 큰 사람이 좋아요", "유머 감각 있는 사람" — 이런 솔직한 마음이
                    오히려 더 잘 맞는 사람을 찾는 데 큰 도움이 됩니다.
                    속물이라고 생각하지 않아요. 진짜 원하는 걸 적어야 진짜 맞는 사람을 만날 수 있으니까요.
                  </p>
                </div>

                <KeywordTagInput
                  label="내 마음을 움직이는 키워드"
                  hint="어떤 사람에게 마음이 끌리나요? 솔직하게 골라주세요!"
                  suggestions={IDEAL_KEYWORDS}
                  selected={form.idealKeywords}
                  onToggle={(kw) => toggleKeyword('idealKeywords', kw)}
                  required={false}
                />

                <TextField
                  label="어떤 사람을 만날 때 당신의 눈이 가장 반짝이나요?"
                  value={form.idealType}
                  onChange={(v) => setField('idealType', v)}
                  placeholder="이상형을 자유롭게 적어주세요..."
                  multiline
                  maxLength={500}
                  required={false}
                />
              </div>

              <div className={styles.consents}>
                <label className={styles.consentLabel}>
                  <input
                    type="checkbox"
                    checked={form.consentPrivacy}
                    onChange={(e) => setField('consentPrivacy', e.target.checked)}
                    className={styles.consentCheckbox}
                  />
                  <span>개인정보 수집 및 이용 동의 <em>(필수)</em></span>
                </label>
                <label className={styles.consentLabel}>
                  <input
                    type="checkbox"
                    checked={form.consentThirdParty}
                    onChange={(e) => setField('consentThirdParty', e.target.checked)}
                    className={styles.consentCheckbox}
                  />
                  <span>관리자 및 매칭 상대 정보 제공 동의 <em>(필수)</em></span>
                </label>
              </div>

              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}
        </StepTransition>

        <div className={styles.nav}>
          {step < 3 ? (
            <button
              className={styles.nextBtn}
              onClick={nextStep}
              disabled={!canNext()}
            >
              다음 →
            </button>
          ) : (
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
            >
              {submitting ? '제출 중...' : '최종 제출하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
