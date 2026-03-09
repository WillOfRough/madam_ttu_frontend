import { useEffect, useState, useCallback } from 'react';
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
  MBTI_OPTIONS,
  HOBBY_KEYWORDS,
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

const PHONE_REGEX = /^010-\d{4}-\d{4}$/;
const CURRENT_YEAR = new Date().getFullYear();

function validateStep(step, form) {
  const errors = {};
  if (step === 0) {
    if (form.nickname && form.nickname.length > 20) {
      errors.nickname = '별명은 20자 이하로 입력해주세요.';
    }
    if (!form.gender) errors.gender = '성별을 선택해주세요.';
    if (!form.birthYear) {
      errors.birthYear = '출생연도를 입력해주세요.';
    } else if (form.birthYear.length !== 4) {
      errors.birthYear = '4자리 숫자로 입력해주세요.';
    } else {
      const year = Number(form.birthYear);
      if (year > CURRENT_YEAR - 19) errors.birthYear = '만 19세 이상만 등록 가능합니다.';
      else if (year < 1940) errors.birthYear = '올바른 출생연도를 입력해주세요.';
    }
    if (!form.phone) {
      errors.phone = '연락처를 입력해주세요.';
    } else if (!PHONE_REGEX.test(form.phone)) {
      errors.phone = '010-0000-0000 형식으로 입력해주세요.';
    }
  } else if (step === 1) {
    if (form.height) {
      const h = Number(form.height);
      if (h < 100 || h > 250) errors.height = '100~250cm 사이의 값을 입력해주세요.';
    }
    if (!form.occupation) {
      errors.occupation = '직업을 입력해주세요.';
    } else if (form.occupation.length < 2) {
      errors.occupation = '2자 이상 입력해주세요.';
    }
    if (!form.company) {
      errors.company = '회사를 입력해주세요.';
    }
  } else if (step === 3) {
    if (!form.introduction) {
      errors.introduction = '자기소개를 입력해주세요.';
    } else if (form.introduction.length < 50) {
      errors.introduction = `${50 - form.introduction.length}자 더 작성해주세요. (최소 50자)`;
    }
    if (!form.consentPrivacy) errors.consentPrivacy = '개인정보 수집 동의가 필요합니다.';
    if (!form.consentThirdParty) errors.consentThirdParty = '정보 제공 동의가 필요합니다.';
  }
  return errors;
}

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
  const [touched, setTouched] = useState({});
  const [showTerms, setShowTerms] = useState(false);

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

  const errors = validateStep(step, form);
  const hasErrors = Object.keys(errors).length > 0;

  const markTouched = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const getError = (field) => (touched[field] ? errors[field] : undefined);

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

  const handleNext = () => {
    // Mark all current step fields as touched to show errors
    const stepFields = {
      0: ['gender', 'birthYear', 'phone'],
      1: ['occupation', 'height', 'company'],
      3: ['introduction', 'consentPrivacy', 'consentThirdParty'],
    };
    const fields = stepFields[step] || [];
    const newTouched = { ...touched };
    fields.forEach((f) => { newTouched[f] = true; });
    setTouched(newTouched);

    if (!hasErrors) {
      nextStep();
      setTouched({});
    }
  };

  const handleSubmitClick = () => {
    setTouched({ introduction: true, consentPrivacy: true, consentThirdParty: true });
    if (!hasErrors) {
      handleSubmit();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.topRow}>
            {step > 0 && (
              <button className={styles.backBtn} onClick={() => { prevStep(); setTouched({}); }}>
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
          {/* Step 1: 기본 정보 */}
          {step === 0 && (
            <div className={styles.fields}>
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
                  onBlur={() => markTouched('nickname')}
                  placeholder={`추천: ${suggestedNickname}`}
                  maxLength={20}
                />
                {getError('nickname') && <span className={styles.fieldError}>{getError('nickname')}</span>}
              </div>

              <RadioGroup
                name="gender"
                label="성별"
                options={GENDER_OPTIONS}
                value={form.gender}
                onChange={(v) => { setField('gender', v); markTouched('gender'); }}
                required
                error={getError('gender')}
              />

              <TextField
                label="당신이 세상에 온 해를 알려주세요 (숫자 4자리)"
                value={form.birthYear}
                onChange={(v) => { setField('birthYear', v.replace(/\D/g, '').slice(0, 4)); markTouched('birthYear'); }}
                placeholder="1994"
                maxLength={4}
                required
                error={getError('birthYear')}
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
                  markTouched('phone');
                }}
                placeholder="010-0000-0000"
                type="tel"
                required
                error={getError('phone')}
              />
              <p className={styles.phoneHint}>
                연락처는 매칭 성사 시에만 상대방에게 공유됩니다. 그 전에는 절대 노출되지 않으니 안심하세요.
              </p>

              <TextField
                label="현재 당신의 일상이 머무는 곳은 어디인가요?"
                value={form.location}
                onChange={(v) => setField('location', v)}
                placeholder="예) 서울 영등포구, 경기도 용인 수지"
                required={false}
              />
            </div>
          )}

          {/* Step 2: 모습 */}
          {step === 1 && (
            <div className={styles.fields}>
              <TextField
                label="당신의 멋진 비율을 상상할 수 있게 키를 알려주세요"
                value={form.height}
                onChange={(v) => { setField('height', v); markTouched('height'); }}
                placeholder="178 (cm)"
                type="number"
                required={false}
                error={getError('height')}
              />
              <TextField
                label="어떤 가치 있는 일로 당신의 하루를 채우고 계신가요?"
                value={form.occupation}
                onChange={(v) => { setField('occupation', v); markTouched('occupation'); }}
                placeholder="소프트웨어 엔지니어"
                required
                error={getError('occupation')}
              />
              <TextField
                label="회사"
                value={form.company}
                onChange={(v) => { setField('company', v); markTouched('company'); }}
                placeholder="현재 근무 중인 곳"
                required
                error={getError('company')}
              />
              <TextField
                label="회사 위치"
                value={form.companyLocation}
                onChange={(v) => setField('companyLocation', v)}
                placeholder="예) 서울 강남, 판교"
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
              <TextField
                label="학교"
                value={form.school}
                onChange={(v) => setField('school', v)}
                placeholder="최종 학교명"
                required={false}
              />
            </div>
          )}

          {/* Step 3: 취향 */}
          {step === 2 && (
            <div className={styles.fields}>
              <SelectField
                label="혹시 종교가 있으신가요?"
                value={form.religion}
                onChange={(v) => setField('religion', v)}
                options={RELIGION_OPTIONS}
                placeholder="선택해주세요"
                required={false}
              />
              <SelectField
                label="MBTI를 알고 계시다면 알려주세요"
                value={form.mbti}
                onChange={(v) => setField('mbti', v)}
                options={[...MBTI_OPTIONS, { value: '잘 모르겠어요', label: '잘 모르겠어요' }]}
                placeholder="선택해주세요"
                required={false}
              />
              <KeywordTagInput
                label="일상 속에서 당신을 미소 짓게 하는 활동은 무엇인가요?"
                hint="클릭하거나 직접 입력해주세요"
                suggestions={HOBBY_KEYWORDS}
                selected={form.hobbies}
                onToggle={(kw) => toggleKeyword('hobbies', kw)}
                required={false}
              />
            </div>
          )}

          {/* Step 4: 진심 */}
          {step === 3 && (
            <div className={styles.fields}>
              <KeywordTagInput
                label="나를 표현하는 키워드"
                hint="클릭하거나 직접 입력해주세요. 키워드만으로도 당신이 어떤 사람인지 느껴져요!"
                suggestions={INTRO_KEYWORDS}
                selected={form.introKeywords}
                onToggle={(kw) => toggleKeyword('introKeywords', kw)}
                required={false}
              />

              <TextField
                label="간단한 자기소개"
                value={form.introduction}
                onChange={(v) => { setField('introduction', v); markTouched('introduction'); }}
                placeholder="진솔하게 자신을 표현해주세요..."
                multiline
                maxLength={1000}
                required
                error={getError('introduction')}
              />

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
                    onChange={(e) => { setField('consentPrivacy', e.target.checked); markTouched('consentPrivacy'); }}
                    className={styles.consentCheckbox}
                  />
                  <span>개인정보 수집 및 이용 동의 <em>(필수)</em></span>
                </label>
                <label className={styles.consentLabel}>
                  <input
                    type="checkbox"
                    checked={form.consentThirdParty}
                    onChange={(e) => { setField('consentThirdParty', e.target.checked); markTouched('consentThirdParty'); }}
                    className={styles.consentCheckbox}
                  />
                  <span>관리자 및 매칭 상대 정보 제공 동의 <em>(필수)</em></span>
                </label>
                <button
                  type="button"
                  className={styles.termsLink}
                  onClick={() => setShowTerms(true)}
                >
                  약관 보기
                </button>
              </div>

              {showTerms && (
                <div className={styles.termsOverlay} onClick={() => setShowTerms(false)}>
                  <div className={styles.termsModal} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.termsHeader}>
                      <h3 className={styles.termsTitle}>이용약관 및 개인정보 처리방침</h3>
                      <button className={styles.termsClose} onClick={() => setShowTerms(false)}>×</button>
                    </div>
                    <div className={styles.termsBody}>
                      <h4>1. 개인정보 수집 및 이용 동의</h4>
                      <p>수집 항목: 별명, 성별, 출생연도, 연락처, 거주지역, 키, 직업, 회사, 학력, 종교, MBTI, 취미, 자기소개, 이상형</p>
                      <p>수집 목적: 매칭 서비스 제공 및 회원 관리</p>
                      <p>보유 기간: 서비스 이용 종료 시까지 (탈퇴 요청 시 즉시 파기)</p>

                      <h4>2. 제3자 정보 제공 동의</h4>
                      <p>제공 대상: 매칭 관리자 및 매칭 상대방</p>
                      <p>제공 항목: 별명, 성별, 나이, 거주지역, 키, 직업, 학력, 종교, MBTI, 취미, 자기소개, 이상형</p>
                      <p>제공 목적: 매칭 서비스 진행</p>
                      <p>연락처는 매칭 성사 후 양측 동의 시에만 상대방에게 공유됩니다.</p>

                      <h4>3. 동의 거부 권리</h4>
                      <p>위 동의를 거부할 권리가 있으며, 동의 거부 시 서비스 이용이 제한될 수 있습니다.</p>
                    </div>
                    <button className={styles.termsConfirmBtn} onClick={() => setShowTerms(false)}>
                      확인
                    </button>
                  </div>
                </div>
              )}

              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}
        </StepTransition>

        <div className={styles.nav}>
          {step < 3 ? (
            <button
              className={styles.nextBtn}
              onClick={handleNext}
              disabled={hasErrors && Object.keys(touched).length > 0}
            >
              다음 →
            </button>
          ) : (
            <button
              className={styles.submitBtn}
              onClick={handleSubmitClick}
              disabled={submitting}
            >
              {submitting ? '제출 중...' : '최종 제출하기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
