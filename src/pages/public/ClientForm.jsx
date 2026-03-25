import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ImagePlus, X as XIcon } from 'lucide-react';
import useClientFormStore, { NAME_PATTERN } from '../../store/clientFormStore';
import * as clientService from '../../api/clientService';
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
import styles from './ClientForm.module.css';

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
    if (!form.name || !form.name.trim()) {
      errors.name = '소중한 인연을 위해 이름을 알려주세요.';
    } else if (form.name.length < 2 || form.name.length > 20) {
      errors.name = '이름은 2~20자로 적어주세요.';
    } else if (!NAME_PATTERN.test(form.name)) {
      errors.name = '한글 또는 영문만 입력 가능합니다. (공백 불가)';
    }
    if (form.nickname && form.nickname.length > 50) {
      errors.nickname = '별명은 50자 이하로 입력해주세요.';
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
    if (!form.location || !form.location.trim()) {
      errors.location = '거주지역을 입력해주세요.';
    }
  } else if (step === 1) {
    if (!form.height) {
      errors.height = '키를 입력해주세요.';
    } else {
      const h = Number(form.height);
      if (h < 100 || h > 250) errors.height = '100~250cm 사이의 값을 입력해주세요.';
    }
    if (!form.occupation) {
      errors.occupation = '직업을 입력해주세요.';
    } else if (form.occupation.length < 2) {
      errors.occupation = '2자 이상 입력해주세요.';
    }
    if (!form.company) {
      errors.company = '회사명을 입력해주세요.';
    }
    if (!form.companyLocation || !form.companyLocation.trim()) {
      errors.companyLocation = '회사 위치를 입력해주세요.';
    }
    if (!form.education) {
      errors.education = '학력을 선택해주세요.';
    }
  } else if (step === 2) {
    if (!form.religion) errors.religion = '종교를 선택해주세요.';
    if (!form.mbti) errors.mbti = 'MBTI를 선택해주세요.';
    if (form.hobbies.length < 3) errors.hobbies = '활동을 최소 3개 선택해주세요.';
  } else if (step === 3) {
    if (!form.introQ1.trim()) errors.introQ1 = '답변을 입력해주세요.';
    const combined = [form.introQ1, form.introQ2]
      .map((a) => a.trim()).filter(Boolean).join(' ');
    const keywordsPrefix = form.introKeywords.length > 0 ? `[${form.introKeywords.join(', ')}] ` : '';
    const totalLen = keywordsPrefix.length + combined.length;
    if (combined.length > 0 && totalLen < 20) {
      errors.introLength = `${20 - totalLen}자 더 작성해주세요. (최소 20자)`;
    }
    if (form.introKeywords.length < 2) {
      errors.introKeywords = '키워드를 최소 2개 선택해주세요.';
    }
    if (!form.idealType || !form.idealType.trim()) {
      errors.idealType = '이상형을 적어주세요.';
    }
    if (!form.photos || form.photos.length < 2) {
      errors.photos = '사진을 최소 2장 등록해주세요.';
    }
  }
  return errors;
}

export default function ClientForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const {
    step, form, suggestedNickname, photoError,
    setToken, setSuggestedNickname, nextStep, prevStep,
    setField, toggleKeyword, getPayload, reset,
    addPhotos, removePhoto,
  } = useClientFormStore();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState({});
  const [loadedPhotos, setLoadedPhotos] = useState({});

  useEffect(() => {
    setToken(token);
    setSuggestedNickname(generateNickname());
    return () => reset();
  }, [token, setToken, setSuggestedNickname, reset]);

  const previewUrls = useRef([]);
  useEffect(() => {
    previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    previewUrls.current = form.photos.map((f) => URL.createObjectURL(f));
    setLoadedPhotos({});
    return () => {
      previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [form.photos]);

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
      const payload = getPayload();
      await clientService.createClient(payload, form.photos);
      navigate('/apply/complete');
    } catch (err) {
      setError(err.message || '제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
    setSubmitting(false);
  };

  const handleNext = () => {
    const stepFields = {
      0: ['name', 'gender', 'birthYear', 'phone', 'location'],
      1: ['occupation', 'height', 'company', 'companyLocation', 'education', 'school'],
      2: ['religion', 'mbti', 'hobbies'],
      3: ['introQ1', 'introLength', 'introKeywords', 'idealType', 'photos'],
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
    setTouched({ introQ1: true, introLength: true, introKeywords: true, idealType: true, photos: true });
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
            <span className={styles.logo}>Knots & Links</span>
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
              <TextField
                label="당신의 이름을 알려주세요"
                hint="매칭 진행 시 매니저만 확인하며, 상대방에게는 별명으로 소개됩니다."
                value={form.name}
                onChange={(v) => { setField('name', v); markTouched('name'); }}
                placeholder="홍길동"
                maxLength={20}
                required
                error={getError('name')}
              />

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
                  maxLength={50}
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
                label="현재 어디에 살고 계신가요?"
                hint="만남 장소를 정하는 데 도움이 되니 구체적으로 적어주세요."
                value={form.location}
                onChange={(v) => { setField('location', v); markTouched('location'); }}
                placeholder="예) 서울 영등포구, 경기도 용인 수지"
                required
                error={getError('location')}
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
                required
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
                label="현재 다니고 계신 회사명은 어디인가요?"
                value={form.company}
                onChange={(v) => { setField('company', v); markTouched('company'); }}
                placeholder="예) 삼성전자, 네이버, 프리랜서"
                required
                error={getError('company')}
              />
              <TextField
                label="회사 위치"
                hint="만남 장소를 정할 때 참고되니 구/동 단위로 적어주세요."
                value={form.companyLocation}
                onChange={(v) => { setField('companyLocation', v); markTouched('companyLocation'); }}
                placeholder="예) 서울 강남구 역삼동, 경기 성남시 판교"
                required
                error={getError('companyLocation')}
              />
              <SelectField
                label="최종 학력이 어떻게 되시나요?"
                value={form.education}
                onChange={(v) => { setField('education', v); markTouched('education'); }}
                options={EDUCATION_OPTIONS}
                placeholder="최종 학력을 선택해주세요"
                required
                error={getError('education')}
              />
              <TextField
                label="학교"
                value={form.school}
                onChange={(v) => { setField('school', v); markTouched('school'); }}
                placeholder="예) OO대학교"
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
                onChange={(v) => { setField('religion', v); markTouched('religion'); }}
                options={RELIGION_OPTIONS}
                placeholder="선택해주세요"
                required
                error={getError('religion')}
              />
              <SelectField
                label="MBTI가 어떻게 되시나요?"
                value={form.mbti}
                onChange={(v) => { setField('mbti', v); markTouched('mbti'); }}
                options={[...MBTI_OPTIONS, { value: '잘 모르겠어요', label: '잘 모르겠어요' }]}
                placeholder="선택해주세요"
                required
                error={getError('mbti')}
              />
              <KeywordTagInput
                label="일상 속에서 당신을 미소 짓게 하는 활동은 무엇인가요?"
                hint="최소 3개 이상 선택해주세요. 클릭하거나 직접 입력할 수 있어요!"
                suggestions={HOBBY_KEYWORDS}
                selected={form.hobbies}
                onToggle={(kw) => { toggleKeyword('hobbies', kw); markTouched('hobbies'); }}
                required
                error={getError('hobbies')}
              />
            </div>
          )}

          {/* Step 4: 진심 */}
          {step === 3 && (
            <div className={styles.fields}>
              <KeywordTagInput
                label="나를 표현하는 키워드"
                hint="최소 2개 이상 선택해주세요. 키워드만으로도 당신이 어떤 사람인지 느껴져요!"
                suggestions={INTRO_KEYWORDS}
                selected={form.introKeywords}
                onToggle={(kw) => { toggleKeyword('introKeywords', kw); markTouched('introKeywords'); }}
                required
                error={getError('introKeywords')}
              />

              <div className={styles.guidedIntro}>
                <div className={styles.guidedIntroNotice}>
                  <p className={styles.guidedIntroNoticeTitle}>✍️ 질문에 답하면 자기소개가 완성돼요</p>
                  <p className={styles.guidedIntroNoticeText}>
                    어렵게 생각하지 마세요! 아래 질문에 편하게 답변하면 자연스러운 자기소개가 만들어집니다.
                  </p>
                </div>

                <TextField
                  label="휴일에는 주로 뭘 하시나요?"
                  value={form.introQ1}
                  onChange={(v) => { setField('introQ1', v); markTouched('introQ1'); }}
                  placeholder="카페에서 책 읽거나 넷플릭스 봐요"
                  required
                  error={getError('introQ1')}
                />
                <TextField
                  label="나만의 매력이나 자신 있는 점은?"
                  value={form.introQ2}
                  onChange={(v) => { setField('introQ2', v); }}
                  placeholder="요리를 잘해서 친구들이 집에 자주 놀러 와요"
                  required={false}
                />
                {getError('introLength') && <p className={styles.fieldError}>{getError('introLength')}</p>}
              </div>

              <div className={styles.idealSection}>
                <div className={styles.idealNotice}>
                  <p className={styles.idealNoticeTitle}>💡 구체적일수록 딱 맞는 사람을 만나요</p>
                  <p className={styles.idealNoticeText}>
                    "키 175 이상", "MBTI가 E인 사람", "강남 근처 거주" — 이렇게 구체적으로 적을수록
                    매칭 확률이 올라갑니다. 외모, 성격, 재력, 거주지, 종교, 라이프스타일 등
                    솔직하게 적어주세요. 정확한 기준이 정확한 만남을 만듭니다.
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
                  label="어떤 사람이 이상형인가요?"
                  hint="외모, 성격, 재력, 거주지, 종교 등 구체적으로 적을수록 딱 맞는 사람을 만날 확률이 올라가요."
                  value={form.idealType}
                  onChange={(v) => { setField('idealType', v); markTouched('idealType'); }}
                  placeholder="예) 눈이 큰 사람, 키 175 이상, 좋은 회사 다니는 사람, 강남 근처 거주, MBTI E인 사람"
                  multiline
                  maxLength={500}
                  required
                  error={getError('idealType')}
                />
              </div>

              <div className={styles.photoSection}>
                <label className={styles.fieldLabel}>
                  당신의 매력을 보여줄 사진을 올려주세요
                  <span className={styles.requiredMark}> *</span>
                </label>
                <p className={styles.photoHint}>최소 2장 필수, 최대 5장 (장당 10MB / JPG, PNG, WebP)</p>
                <p className={styles.photoWarning}>
                  얼굴이 잘 보이는 사진을 올려주세요. 마스크 착용, 선글라스, 과도한 필터, 옆모습·뒷모습 등 얼굴 확인이 어려운 사진은 매칭에 불이익이 있을 수 있습니다.
                </p>
                <div className={styles.photoGrid}>
                  {form.photos.map((file, idx) => (
                    <div key={idx} className={styles.photoItem}>
                      {!loadedPhotos[idx] && <div className={styles.photoSkeleton} />}
                      <img
                        src={previewUrls.current[idx]}
                        alt={`사진 ${idx + 1}`}
                        onLoad={() => setLoadedPhotos((prev) => ({ ...prev, [idx]: true }))}
                        className={loadedPhotos[idx] ? styles.photoLoaded : styles.photoLoading}
                      />
                      <button
                        type="button"
                        className={styles.photoRemoveBtn}
                        onClick={() => removePhoto(idx)}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < 5 && (
                    <button
                      type="button"
                      className={styles.photoAdd}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={24} />
                      <span>추가</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }}
                  onChange={(e) => {
                    if (e.target.files?.length) addPhotos(e.target.files);
                    e.target.value = '';
                  }}
                />
                {photoError && <p className={styles.fieldError}>{photoError}</p>}
                {getError('photos') && <p className={styles.fieldError}>{getError('photos')}</p>}
              </div>

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
