import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ImagePlus, X as XIcon, ShieldCheck } from 'lucide-react';
import useClientFormStore, { NAME_PATTERN, AGE_BOUNDS, HEIGHT_BOUNDS } from '../../store/clientFormStore';
import * as clientService from '../../api/clientService';
import TextField from '../../components/TextField';
import SelectField from '../../components/SelectField';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import RadioGroup from '../../components/RadioGroup';
import StepTransition from '../../components/StepTransition';
import KeywordTagInput from '../../components/KeywordTagInput';
import RangeSlider from '../../components/RangeSlider';
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

const STEP_LABELS = ['기본', '매력', '라이프', '진심'];
const STEP_TITLES = [
  '먼저, 기본 정보부터.',
  '이제 매력을 들려주세요.',
  '라이프스타일을 알려주세요.',
  '마지막이에요, 조금만 더.',
];
const STEP_SUBS = [
  '본인을 확인할 수 있는 최소한의 정보예요.',
  '직장·학력 등 매니저가 매칭에 참고하는 정보예요.',
  '종교·성향·취미로 잘 맞는 분을 찾아요.',
  '당신을 가장 잘 표현하는 몇 가지를 골라주세요.',
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
    if (form.nickname) {
      if (form.nickname.length < 2) {
        errors.nickname = '별명은 2자 이상 입력해주세요.';
      } else if (form.nickname.length > 50) {
        errors.nickname = '별명은 50자 이하로 입력해주세요.';
      }
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

/* ── Step progress dots ── */
function StepDots({ step }) {
  return (
    <div className={styles.stepDots}>
      {STEP_LABELS.map((label, i) => (
        <div key={i} className={styles.stepDotItem}>
          <div
            className={[
              styles.dot,
              i < step ? styles.dotDone : '',
              i === step ? styles.dotActive : '',
            ].join(' ')}
          />
          {i < STEP_LABELS.length - 1 && (
            <div className={[styles.dotLine, i < step ? styles.dotLineDone : ''].join(' ')} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Section label ── */
function SectionLabel({ n, children, required, count }) {
  return (
    <div className={styles.sectionLabel}>
      <span className={styles.sectionN}>{n}</span>
      <span className={styles.sectionT}>
        {children}
        {required && <span className={styles.sectionReq}> *</span>}
      </span>
      {count && <span className={styles.sectionCount}>{count}</span>}
    </div>
  );
}

/* ── White card wrap ── */
function FieldCard({ children }) {
  return <div className={styles.fieldCard}>{children}</div>;
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
  const [verificationId, setVerificationId] = useState(null);
  const [nicknameStatus, setNicknameStatus] = useState('idle'); // 'idle' | 'checking' | 'available' | 'taken' | 'error'

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

  const autoRerollAttemptsRef = useRef(0);

  const rerollNickname = () => {
    autoRerollAttemptsRef.current = 0;
    setSuggestedNickname(generateNickname());
    setField('nickname', '');
  };

  const displayNickname = form.nickname || suggestedNickname;

  useEffect(() => {
    const value = (displayNickname || '').trim();
    if (!value || value.length < 2 || value.length > 50) { setNicknameStatus('idle'); return; }
    setNicknameStatus('checking');
    const handle = setTimeout(async () => {
      try {
        const available = await clientService.checkNicknameAvailable(value);
        if (available) {
          autoRerollAttemptsRef.current = 0;
          setNicknameStatus('available');
        } else if (!form.nickname && autoRerollAttemptsRef.current < 5) {
          // 사용자가 직접 입력하지 않은 추천 별명이 중복이면 조용히 재추첨
          autoRerollAttemptsRef.current += 1;
          setSuggestedNickname(generateNickname());
        } else {
          setNicknameStatus('taken');
        }
      } catch {
        setNicknameStatus('error');
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [displayNickname, form.nickname, setSuggestedNickname]);

  const errors = validateStep(step, form);
  const hasErrors = Object.keys(errors).length > 0;

  const markTouched = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const getError = (field) => (touched[field] ? errors[field] : undefined);

  const handleSubmit = async () => {
    if (!verificationId) {
      setError('휴대폰 인증을 완료해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...getPayload(), verificationId };
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

    if (step === 0 && !verificationId) {
      setError('휴대폰 인증을 완료해주세요.');
      return;
    }

    if (step === 0 && nicknameStatus === 'taken') {
      setError('이미 사용 중인 별명이에요. 다른 별명으로 변경해주세요.');
      return;
    }

    if (!hasErrors) {
      setError(null);
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
      {/* ambient blobs */}
      <div className={styles.blobTop} aria-hidden />
      <div className={styles.blobBottom} aria-hidden />

      <div className={styles.container}>
        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.topRow}>
            <div className={styles.brand}>
              <div className={styles.brandMark} />
              <span className={styles.brandName}>Knots &amp; Links</span>
            </div>
            <span className={styles.stepCounter}>{step + 1} / 4</span>
          </div>

          {/* Progress dots */}
          <StepDots step={step} />

          {/* Step title */}
          <div className={styles.stepTitle}>{STEP_TITLES[step]}</div>
          <div className={styles.stepSub}>{STEP_SUBS[step]}</div>
        </div>

        <StepTransition stepKey={step}>
          {/* ── Step 0: 기본 ── */}
          {step === 0 && (
            <div className={styles.fields}>
              <SectionLabel n="01" required>본명</SectionLabel>
              <FieldCard>
                <TextField
                  label="한글 이름"
                  value={form.name}
                  onChange={(v) => { setField('name', v); markTouched('name'); }}
                  placeholder="홍길동"
                  maxLength={20}
                  required
                  error={getError('name')}
                />
              </FieldCard>

              <SectionLabel n="02" count={form.nickname ? form.nickname.length + '/50' : undefined}>
                프로필 별명
                <span className={styles.optBadge}>선택</span>
              </SectionLabel>
              <FieldCard>
                <div className={styles.nicknameDisplay}>
                  <span className={styles.nicknameVal}>{displayNickname}</span>
                  <button type="button" className={styles.rerollBtn} onClick={rerollNickname}>
                    <RefreshCw size={13} />
                    다시
                  </button>
                </div>
                <p className={styles.nicknameHint}>
                  매칭 상대에게 처음 보여지는 이름이에요. 마음에 드실 때까지 바꿔보세요.
                </p>
                <div className={styles.fieldWrap}>
                  <input
                    className={`${styles.nicknameInput} ${getError('nickname') || nicknameStatus === 'taken' ? styles.nicknameInputError : ''}`}
                    value={form.nickname}
                    onChange={(e) => setField('nickname', e.target.value)}
                    onBlur={() => markTouched('nickname')}
                    placeholder={`추천: ${suggestedNickname}`}
                    maxLength={50}
                  />
                  {getError('nickname') && (
                    <span className={styles.fieldError}>{getError('nickname')}</span>
                  )}
                  {!getError('nickname') && nicknameStatus === 'taken' && (
                    <span className={styles.fieldError}>
                      이미 사용 중인 별명이에요. 다른 별명을 입력하거나 ‘다시’를 눌러주세요.
                    </span>
                  )}
                  {!getError('nickname') && nicknameStatus === 'checking' && (
                    <span className={styles.nicknameStatusChecking}>중복 확인 중…</span>
                  )}
                  {!getError('nickname') && nicknameStatus === 'available' && (
                    <span className={styles.nicknameStatusOk}>사용 가능한 별명이에요.</span>
                  )}
                </div>
              </FieldCard>

              <SectionLabel n="03" required>기본 정보</SectionLabel>
              <FieldCard>
                <RadioGroup
                  name="gender"
                  label="성별"
                  options={GENDER_OPTIONS}
                  value={form.gender}
                  onChange={(v) => { setField('gender', v); markTouched('gender'); }}
                  required
                  error={getError('gender')}
                />
                <div className={styles.cardDivider} />
                <TextField
                  label="출생연도 (숫자 4자리)"
                  value={form.birthYear}
                  onChange={(v) => { setField('birthYear', v.replace(/\D/g, '').slice(0, 4)); markTouched('birthYear'); }}
                  placeholder="1994"
                  maxLength={4}
                  required
                  error={getError('birthYear')}
                />
                <div className={styles.cardDivider} />
                <div className={styles.fieldWrap}>
                  <label className={styles.fieldLabel}>
                    연락처
                    <span className={styles.reqBadge}>필수</span>
                  </label>
                  <PhoneVerifyField
                    value={form.phone}
                    onChange={(v) => { setField('phone', v); markTouched('phone'); }}
                    onVerified={setVerificationId}
                  />
                  {getError('phone') && (
                    <span className={styles.fieldError}>{getError('phone')}</span>
                  )}
                  {!getError('phone') && !verificationId && form.phone && PHONE_REGEX.test(form.phone) && (
                    <p className={styles.verifyHint}><span>휴대폰 인증을 완료해야 다음 단계로 넘어갈 수 있어요.</span></p>
                  )}
                </div>
              </FieldCard>

              <div className={styles.trustNote}>
                <ShieldCheck size={13} />
                연락처는 매칭 성사 시에만 상대방에게 공유됩니다. 그 전에는 절대 노출되지 않으니 안심하세요.
              </div>

              <SectionLabel n="04" required>거주 지역</SectionLabel>
              <FieldCard>
                <TextField
                  label="시/도 · 시군구"
                  hint="만남 장소를 정하는 데 도움이 되니 구체적으로 적어주세요."
                  value={form.location}
                  onChange={(v) => { setField('location', v); markTouched('location'); }}
                  placeholder="예) 서울 영등포구, 경기도 용인 수지"
                  required
                  error={getError('location')}
                />
              </FieldCard>
            </div>
          )}

          {/* ── Step 1: 매력 ── */}
          {step === 1 && (
            <div className={styles.fields}>
              <SectionLabel n="01" required>외적 정보</SectionLabel>
              <FieldCard>
                <div className={styles.heightWrap}>
                  <div className={styles.heightLabel}>
                    키 <span className={styles.sectionReq}>*</span>
                  </div>
                  {form.height ? (
                    <div className={styles.heightDisplay}>
                      <span className={styles.heightVal}>{form.height}</span>
                      <span className={styles.heightUnit}>cm</span>
                    </div>
                  ) : null}
                  <TextField
                    label=""
                    value={form.height}
                    onChange={(v) => { setField('height', v); markTouched('height'); }}
                    placeholder="178"
                    type="number"
                    required
                    error={getError('height')}
                  />
                </div>
              </FieldCard>

              <SectionLabel n="02" required>직업</SectionLabel>
              <FieldCard>
                <TextField
                  label="직업"
                  value={form.occupation}
                  onChange={(v) => { setField('occupation', v); markTouched('occupation'); }}
                  placeholder="소프트웨어 엔지니어"
                  required
                  error={getError('occupation')}
                />
                <div className={styles.cardDivider} />
                <TextField
                  label="회사명"
                  value={form.company}
                  onChange={(v) => { setField('company', v); markTouched('company'); }}
                  placeholder="예) 삼성전자, 네이버, 프리랜서"
                  required
                  error={getError('company')}
                />
                <div className={styles.cardDivider} />
                <TextField
                  label="회사 위치"
                  hint="만남 장소를 정할 때 참고되니 구/동 단위로 적어주세요."
                  value={form.companyLocation}
                  onChange={(v) => { setField('companyLocation', v); markTouched('companyLocation'); }}
                  placeholder="예) 서울 강남구 역삼동"
                  required
                  error={getError('companyLocation')}
                />
              </FieldCard>

              <SectionLabel n="03" required>학력</SectionLabel>
              <FieldCard>
                <SelectField
                  label="최종 학력"
                  value={form.education}
                  onChange={(v) => { setField('education', v); markTouched('education'); }}
                  options={EDUCATION_OPTIONS}
                  placeholder="최종 학력을 선택해주세요"
                  required
                  error={getError('education')}
                />
                <div className={styles.cardDivider} />
                <TextField
                  label="학교"
                  value={form.school}
                  onChange={(v) => { setField('school', v); markTouched('school'); }}
                  placeholder="예) OO대학교"
                  required={false}
                />
              </FieldCard>
            </div>
          )}

          {/* ── Step 2: 라이프 ── */}
          {step === 2 && (
            <div className={styles.fields}>
              <SectionLabel n="01" required>종교</SectionLabel>
              <FieldCard>
                <SelectField
                  label=""
                  value={form.religion}
                  onChange={(v) => { setField('religion', v); markTouched('religion'); }}
                  options={RELIGION_OPTIONS}
                  placeholder="선택해주세요"
                  required
                  error={getError('religion')}
                />
              </FieldCard>

              <SectionLabel n="02" required>MBTI</SectionLabel>
              <FieldCard>
                <SelectField
                  label=""
                  value={form.mbti}
                  onChange={(v) => { setField('mbti', v); markTouched('mbti'); }}
                  options={[...MBTI_OPTIONS, { value: '잘 모르겠어요', label: '잘 모르겠어요' }]}
                  placeholder="선택해주세요"
                  required
                  error={getError('mbti')}
                />
                <p className={styles.mbtiFoot}>잘 모르시면 '잘 모르겠어요'를 선택해주세요.</p>
              </FieldCard>

              <SectionLabel n="03" required count={`${form.hobbies.length}개 선택`}>취미</SectionLabel>
              <FieldCard>
                <KeywordTagInput
                  label=""
                  hint="최소 3개 이상 선택해주세요. 클릭하거나 직접 입력할 수 있어요!"
                  suggestions={HOBBY_KEYWORDS}
                  selected={form.hobbies}
                  onToggle={(kw) => { toggleKeyword('hobbies', kw); markTouched('hobbies'); }}
                  required
                  error={getError('hobbies')}
                />
              </FieldCard>
            </div>
          )}

          {/* ── Step 3: 진심 ── */}
          {step === 3 && (
            <div className={styles.fields}>
              <SectionLabel n="01" required count={`${form.introKeywords.length}개`}>
                나를 표현하는 키워드
              </SectionLabel>
              <FieldCard>
                <KeywordTagInput
                  label=""
                  hint="최소 2개 이상 선택해주세요. 키워드만으로도 당신이 어떤 사람인지 느껴져요!"
                  suggestions={INTRO_KEYWORDS}
                  selected={form.introKeywords}
                  onToggle={(kw) => { toggleKeyword('introKeywords', kw); markTouched('introKeywords'); }}
                  required
                  error={getError('introKeywords')}
                />
              </FieldCard>

              <SectionLabel n="02" required>자기소개</SectionLabel>
              <div className={styles.introNotice}>
                <span>질문에 답하면 자기소개가 완성돼요</span>
                <p>어렵게 생각하지 마세요! 아래 질문에 편하게 답변하면 자연스러운 자기소개가 만들어집니다.</p>
              </div>
              <FieldCard>
                <TextField
                  label="휴일에는 주로 뭘 하시나요?"
                  value={form.introQ1}
                  onChange={(v) => { setField('introQ1', v); markTouched('introQ1'); markTouched('introLength'); }}
                  placeholder="카페에서 책 읽거나 넷플릭스 봐요"
                  required
                  error={getError('introQ1')}
                />
                <div className={styles.cardDivider} />
                <TextField
                  label="나만의 매력이나 자신 있는 점은?"
                  value={form.introQ2}
                  onChange={(v) => { setField('introQ2', v); markTouched('introLength'); }}
                  placeholder="요리를 잘해서 친구들이 집에 자주 놀러 와요"
                  required={false}
                  error={!getError('introQ1') ? getError('introLength') : undefined}
                />
              </FieldCard>

              <SectionLabel n="03" required>이상형</SectionLabel>
              <div className={styles.idealNotice}>
                <span>구체적일수록 딱 맞는 사람을 만나요</span>
                <p>
                  "키 175 이상", "MBTI가 E인 사람", "강남 근처 거주" — 이렇게 구체적으로 적을수록
                  매칭 확률이 올라갑니다.
                </p>
              </div>
              <FieldCard>
                <div className={styles.rangeBlock}>
                  <RangeSlider
                    label="선호 나이"
                    unit="세"
                    min={AGE_BOUNDS.min}
                    max={AGE_BOUNDS.max}
                    valueMin={form.preferredAgeMin}
                    valueMax={form.preferredAgeMax}
                    onChange={({ min, max }) => {
                      setField('preferredAgeMin', min);
                      setField('preferredAgeMax', max);
                    }}
                    anyChecked={form.preferredAgeAny}
                    onToggleAny={(v) => setField('preferredAgeAny', v)}
                    hint="연상·연하·동갑 중 어느 폭이 편한지 알려주세요."
                  />
                </div>
                <div className={styles.cardDivider} />
                <div className={styles.rangeBlock}>
                  <RangeSlider
                    label="선호 키"
                    unit="cm"
                    min={HEIGHT_BOUNDS.min}
                    max={HEIGHT_BOUNDS.max}
                    valueMin={form.preferredHeightMin}
                    valueMax={form.preferredHeightMax}
                    onChange={({ min, max }) => {
                      setField('preferredHeightMin', min);
                      setField('preferredHeightMax', max);
                    }}
                    anyChecked={form.preferredHeightAny}
                    onToggleAny={(v) => setField('preferredHeightAny', v)}
                    hint="편안하게 마주할 수 있는 키의 범위를 골라주세요."
                  />
                </div>
                <div className={styles.cardDivider} />
                <KeywordTagInput
                  label="이상형 키워드"
                  hint="어떤 사람에게 마음이 끌리나요? 솔직하게 골라주세요!"
                  suggestions={IDEAL_KEYWORDS}
                  selected={form.idealKeywords}
                  onToggle={(kw) => toggleKeyword('idealKeywords', kw)}
                  required={false}
                />
                <div className={styles.cardDivider} />
                <div className={styles.privacyNote}>
                  <ShieldCheck size={13} />
                  이상형은 <strong>담당 매니저만 확인</strong>하며, 상대방에게는 공개되지 않아요.
                </div>
                <TextField
                  label="어떤 사람이 이상형인가요?"
                  hint="외모, 성격, 재력, 거주지, 종교 등 구체적으로 적을수록 딱 맞는 사람을 만날 확률이 올라가요."
                  value={form.idealType}
                  onChange={(v) => { setField('idealType', v); markTouched('idealType'); }}
                  placeholder="예) 눈이 큰 사람, 키 175 이상, 좋은 회사 다니는 사람, 강남 근처 거주"
                  multiline
                  maxLength={500}
                  required
                  error={getError('idealType')}
                />
              </FieldCard>

              <SectionLabel n="04" required count={`${form.photos.length}/5`}>
                사진
              </SectionLabel>
              <div className={styles.photoWarningBox}>
                얼굴이 잘 보이는 사진을 올려주세요. 마스크·선글라스·과도한 필터·뒷모습 등은 매칭에 불이익이 있을 수 있어요.
              </div>
              <FieldCard>
                <p className={styles.photoHint}>최소 2장 필수 · 최대 5장 · 장당 10MB · JPG, PNG, WebP</p>
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
                      {idx === 0 && <div className={styles.photoBadge}>대표</div>}
                      <button
                        type="button"
                        className={styles.photoRemoveBtn}
                        onClick={() => removePhoto(idx)}
                      >
                        <XIcon size={13} />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < 5 && (
                    <button
                      type="button"
                      className={styles.photoAdd}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus size={22} />
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
              </FieldCard>

              {error && <p className={styles.error}>{error}</p>}
            </div>
          )}
        </StepTransition>

        {/* ── Bottom nav ── */}
        <div className={styles.nav}>
          <div className={styles.navInner}>
            {step > 0 ? (
              <button
                className={styles.prevBtn}
                onClick={() => { prevStep(); setTouched({}); }}
              >
                <ArrowLeft size={16} />
                이전
              </button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <button
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={(hasErrors && Object.keys(touched).length > 0) || (step === 0 && !verificationId) || (step === 0 && nicknameStatus === 'taken')}
              >
                다음
              </button>
            ) : (
              <button
                className={styles.submitBtn}
                onClick={handleSubmitClick}
                disabled={submitting}
              >
                {submitting ? '제출 중...' : '신청 완료'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
