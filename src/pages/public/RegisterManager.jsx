import { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck, Smartphone, ArrowRight, UserCheck, Lock, Scale, AlertTriangle, Gavel } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { generateNickname, BANK_OPTIONS } from '../../data/constants';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import styles from './RegisterManager.module.css';

const OATH_GROUPS = [
  {
    id: 'privacy',
    icon: ShieldCheck,
    label: 'A. 개인정보 처리 의무',
    color: 'tangerine',
    items: [
      {
        text: '본인은 회사가 부여한 권한 범위 내에서만 회원의 성명·연락처·주소·사진·직업·소득·가족관계 등 일체의 개인정보를 처리하며, 매칭 목적 외 용도로 이용·제공·공개하지 않겠습니다.',
        basis: '개인정보 보호법 §15·§17·§18, §28',
      },
      {
        text: '회원의 동의 없이 개인정보를 제3자(타 매니저·지인·외부 업체 포함)에게 제공·열람·공유하지 않으며, 위탁이 필요한 경우 반드시 회사의 서면 사전 승인을 받겠습니다.',
        basis: '개인정보 보호법 §17·§26·§59 제2호',
      },
      {
        text: '업무 수행 중 알게 된 회원의 정보·상담 내용·대화 기록·사진을 어떠한 매체(메신저·SNS·메모·클라우드·인쇄물 포함)에도 무단 저장·전송·캡처·녹음하지 않겠습니다.',
        basis: '정보통신망법 §49, 형법 §316·§317',
      },
      {
        text: '회원이 탈퇴·열람·정정·삭제·이용 정지를 요청한 경우, 회사의 지시에 따라 보유 중인 모든 사본을 지체 없이 파기하고 그 결과를 회사에 통지하겠습니다.',
        basis: '개인정보 보호법 §21·§35~§37',
      },
    ],
  },
  {
    id: 'confidentiality',
    icon: Lock,
    label: 'B. 비밀유지 및 누설 금지',
    color: 'lilac',
    items: [
      {
        text: '회사의 영업비밀(매칭 알고리즘·회원 풀·정산 방식·내부 절차·운영 노하우 등)을 재직 중은 물론 계약 종료·해지 후에도 영구히 외부에 누설·이용하지 않겠습니다.',
        basis: '부정경쟁방지 및 영업비밀보호법 §2 제11호·§18 (10년 이하 징역 또는 5억원 이하 벌금)',
      },
      {
        text: '회원 또는 회사의 정보를 부정한 이익을 얻거나 회원·회사·제3자에게 손해를 가할 목적으로 누설·이용하지 않겠습니다.',
        basis: '개인정보 보호법 §59 제2호·§71 제5호 (5년 이하 징역 또는 5천만원 이하 벌금)',
      },
      {
        text: '계정·접근 권한·인증 수단을 타인에게 양도·대여·공유하지 않으며, 권한 외 접근이 의심되는 경우 즉시 회사에 신고하겠습니다.',
        basis: '정보통신망법 §49·§71, 정보통신기반보호법 §12',
      },
    ],
  },
  {
    id: 'security',
    icon: ShieldCheck,
    label: 'C. 안전조치 및 사고 대응',
    color: 'mint',
    items: [
      {
        text: '회사가 정한 기술적·관리적·물리적 안전조치(접근 통제·암호화·단말 보안·공용기기 사용 금지 등)를 준수하며, 이를 위반하여 발생한 유출은 본인의 과실로 인한 사고임을 인정합니다.',
        basis: '개인정보 보호법 §29 및 동법 시행령 §30 (개인정보 안전성 확보조치 기준)',
      },
      {
        text: '개인정보 유출 또는 그 우려가 있는 사고(분실·도난·해킹·권한 외 접근 포함)를 인지한 즉시(늦어도 24시간 이내) 회사에 통지하고, 회사의 사고 조사·증거 확보·관계 기관 신고에 적극 협조하겠습니다.',
        basis: '개인정보 보호법 §34 및 시행령 §39·§40',
      },
    ],
  },
  {
    id: 'ethics',
    icon: UserCheck,
    label: 'D. 직업 윤리 및 영리 이용 금지',
    color: 'rose',
    items: [
      {
        text: '회원에 대한 사적 호감 표현·개별 연락·금품 요구·사적 접촉 등 직무 범위를 벗어난 행위를 하지 않으며, 회원 정보를 본인 또는 제3자의 영리·사적 활동에 이용하지 않겠습니다.',
        basis: '결혼중개업의 관리에 관한 법률 §10·§26, 형법 §347(사기)·§356(업무상 배임)',
      },
      {
        text: '회원의 외모·학력·직업·소득·가족 관계 등을 사유로 차별·비방·부당평가하지 않으며, 회원 정보를 다른 영리 매칭·중개 활동에 전용하지 않겠습니다.',
        basis: '결혼중개업법 §10, 국가인권위원회법 §2 제3호',
      },
    ],
  },
  {
    id: 'liability',
    icon: Gavel,
    label: 'E. 손해배상 책임 및 회사의 구상권',
    color: 'rose',
    items: [
      {
        text: '본인의 고의 또는 과실로 발생한 개인정보 유출·오·남용에 관하여 회원·회사·감독기관·제3자에 대한 일체의 민사·형사·행정상 책임을 본인이 부담함을 인정합니다.',
        basis: '민법 §390(채무불이행)·§750(불법행위), 개인정보 보호법 §39·§39-2',
      },
      {
        text: '회사가 유출 사고로 인하여 회원 또는 감독기관에 손해배상·과징금·과태료·법정손해배상금(회원 1인당 최대 300만원)을 지급한 경우, 본인의 귀책 범위 내에서 회사의 구상 청구에 응하며, 회사가 부담한 변호사 비용·조사 비용·통지 비용·시스템 복구 비용 등 부수 비용도 함께 부담하겠습니다.',
        basis: '민법 §425·§465, 개인정보 보호법 §39-2',
      },
      {
        text: '본인의 위반 행위가 확인되는 경우 회사가 사전 통지 없이 즉시 계약 해지·서비스 이용 정지·정산금 지급 보류·정산금에서의 손해액 상계·형사 고발 등 일체의 조치를 취할 수 있음에 동의합니다.',
        basis: '본 서약서 및 매니저 이용약관, 민법 §492(상계)',
      },
    ],
  },
  {
    id: 'companyLimit',
    icon: AlertTriangle,
    label: 'F. 회사 책임의 한계 및 서비스 보증 제한',
    color: 'lilac',
    items: [
      {
        text: '회사는 매니저에게 매칭 기회를 제공하는 중개 플랫폼으로서, 배정되는 회원 수·매칭 건수·성사율 및 그에 따른 정산 수익의 규모를 보증하지 않으며, 본인은 이를 이해하고 활동합니다.',
        basis: '약관의 규제에 관한 법률 §6, 민법 §105 (계약 자유의 원칙)',
      },
      {
        text: '천재지변·정전·통신 및 시스템 장애 등 불가항력이나 회사의 합리적 통제를 벗어난 사유로 인한 서비스 중단·지연에 대하여, 회사의 고의 또는 중대한 과실이 없는 한 회사가 책임지지 않음을 이해합니다.',
        basis: '민법 §390(채무불이행), 약관의 규제에 관한 법률 §7 제1호',
      },
      {
        text: '회원과 매니저, 매니저 상호 간, 회원 상호 간에 발생한 분쟁·손해는 당사자 간의 문제로서, 회사의 고의·중과실이 없는 한 회사가 책임지지 않음을 이해합니다.',
        basis: '민법 §750(불법행위)·§390',
      },
      {
        text: '회사가 본인에게 부담하는 배상책임은 관련 법령이 허용하는 범위에서 통상의 손해로 한정되며, 회사의 고의·중과실로 인한 경우를 제외하고는 간접·특별·결과적 손해에 대하여 회사가 책임지지 않음에 동의합니다.',
        basis: '민법 §393(손해배상의 범위), 약관의 규제에 관한 법률 §7 제2호',
      },
    ],
  },
  {
    id: 'effect',
    icon: Scale,
    label: 'G. 서약의 효력 및 관할',
    color: 'tangerine',
    items: [
      {
        text: '본 서약은 회사와 본인 간 매니저 이용계약의 일부로 편입되며, 회원가입 완료 시점부터 효력이 발생합니다. 회원 정보를 처리한 사실이 있는 한 본 서약의 비밀유지 의무는 계약 종료 후에도 영구히 존속합니다.',
        basis: '민법 §105·§535 (계약 자유의 원칙)',
      },
      {
        text: '본 서약과 관련된 분쟁의 관할은 회사의 본점 소재지를 관할하는 법원으로 하며, 준거법은 대한민국 법으로 합니다.',
        basis: '민사소송법 §29 (합의관할)',
      },
    ],
  },
];

function getStrengthLevel(pw) {
  if (pw.length === 0) return 0;
  if (pw.length < 6) return 1;
  if (pw.length < 8) return 2;
  return 4;
}

export default function RegisterManager() {
  const { token } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialNickname = useMemo(() => generateNickname(), []);

  const [oathChecked, setOathChecked] = useState(false);
  const [oathAgreed, setOathAgreed] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nickname, setNickname] = useState('');
  const [suggestedNickname, setSuggestedNickname] = useState(initialNickname);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [bankName, setBankName] = useState('');
  const [bankNameError, setBankNameError] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankNumberError, setBankNumberError] = useState('');
  const [error, setError] = useState(null);

  if (isLoggedIn) return <Navigate to="/dashboard" replace />;

  const NAME_REGEX = /^[가-힣a-zA-Z]{2,20}$/;

  const handleNameChange = (value) => {
    setName(value);
    if (value && !NAME_REGEX.test(value)) {
      setNameError('한글 또는 영문만 입력 가능하며, 2~20자여야 합니다.');
    } else {
      setNameError('');
    }
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEmailError('');
    setBankNameError('');
    setBankNumberError('');

    let hasFieldError = false;
    if (!NAME_REGEX.test(name.trim())) {
      setNameError('한글 또는 영문만 입력 가능하며, 2~20자여야 합니다.');
      hasFieldError = true;
    }
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      hasFieldError = true;
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('올바른 이메일 형식으로 입력해주세요.');
      hasFieldError = true;
    }
    if (!bankName) {
      setBankNameError('은행을 선택해주세요.');
      hasFieldError = true;
    }
    const trimmedBankNumber = bankNumber.trim();
    if (!trimmedBankNumber) {
      setBankNumberError('계좌번호를 입력해주세요.');
      hasFieldError = true;
    } else if (!/^\d{8,16}$/.test(trimmedBankNumber)) {
      setBankNumberError('계좌번호는 숫자 8~16자리로 입력해주세요.');
      hasFieldError = true;
    }
    if (hasFieldError) return;

    if (password !== confirmPw) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!verificationId) { setError('휴대폰 인증을 완료해주세요.'); return; }

    const finalNickname = nickname.trim() || suggestedNickname;
    try {
      await register({ token, email, password, name: name.trim(), nickname: finalNickname, phone, verificationId, bankName, bankNumber: trimmedBankNumber });
      navigate('/dashboard/guide');
    } catch (err) {
      setError(err.message || '가입에 실패했습니다.');
    }
  };

  const strength = getStrengthLevel(password);

  // ── Oath screen ──
  if (!oathAgreed) {
    return (
      <div className={styles.oathPage}>
        <div className={styles.oathScroll}>
          <div className={styles.oathInner}>
            {/* Brand */}
            <div className={styles.oathBrandRow}>
              <div className={styles.oathBrandIcon}>
                <div className={styles.oathBrandDot} />
              </div>
              <span className={styles.oathBrandName}>Knots &amp; Links</span>
              <span className={styles.oathBrandBadge}>MANAGER</span>
            </div>

            {/* Hero */}
            <div className={styles.oathHero}>
              <div className={styles.oathIconWrap}>
                <ShieldCheck size={26} />
              </div>
              <p className={styles.oathEyebrow}>Manager Oath</p>
              <h1 className={styles.oathTitle}>회원 정보 보호 서약</h1>
              <p className={styles.oathSubtitle}>매니저로서 꼭 지켜주셔야 하는 약속이에요</p>
            </div>

            {/* Rules */}
            <div className={styles.oathRules}>
              {OATH_GROUPS.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.id} className={`${styles.oathGroup} ${styles[`oathGroup_${group.color}`]}`}>
                    <div className={styles.oathGroupHeader}>
                      <div className={`${styles.oathGroupIcon} ${styles[`oathGroupIcon_${group.color}`]}`}>
                        <Icon size={13} />
                      </div>
                      <span className={`${styles.oathGroupLabel} ${styles[`oathGroupLabel_${group.color}`]}`}>{group.label}</span>
                    </div>
                    {group.items.map((item, i) => (
                      <div key={i} className={styles.oathRule}>
                        <div className={`${styles.oathRuleNum} ${styles[`oathRuleNum_${group.color}`]}`}>{i + 1}</div>
                        <div className={styles.oathRuleBody}>
                          <span className={styles.oathRuleText}>{item.text}</span>
                          {item.basis && (
                            <span className={styles.oathRuleBasis}>
                              <Scale size={9} strokeWidth={2.4} />
                              근거: {item.basis}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Legal warning block — 위반 시 법적 효과 */}
            <div className={styles.oathLegalWarning}>
              <div className={styles.oathLegalWarningHead}>
                <AlertTriangle size={14} strokeWidth={2.2} />
                <span>위반 시 법적 효과 요약</span>
              </div>
              <ul className={styles.oathLegalWarningList}>
                <li>
                  <strong>형사 처벌</strong> — 개인정보 보호법 §71(5년/5천만원), 정보통신망법 §71,
                  영업비밀 침해(부정경쟁방지법 §18, 10년/5억원), 형법 §316·§317 비밀 누설죄
                </li>
                <li>
                  <strong>민사 배상</strong> — 회원에 대한 손해배상(민법 §750) 및 법정손해배상(피해자 1인당 최대 300만원, 개인정보 보호법 §39-2)
                </li>
                <li>
                  <strong>회사 구상권</strong> — 회사가 회원·당국에 우선 배상한 금액 전부와
                  변호사 비용·조사 비용·시스템 복구 비용을 본인에게 청구
                </li>
                <li>
                  <strong>즉시 조치</strong> — 계약 해지·서비스 이용 정지·정산금 지급 보류 및 상계,
                  필요 시 형사 고발 및 감독기관 신고
                </li>
              </ul>
            </div>

            {/* Agreement */}
            <div className={styles.oathAgreeRow}>
              <div
                className={`${styles.oathAgreeBox}${oathChecked ? ` ${styles.agreed}` : ''}`}
                onClick={() => setOathChecked((v) => !v)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setOathChecked((v) => !v)}
              >
                <div className={`${styles.oathCheck}${oathChecked ? ` ${styles.checked}` : ''}`}>
                  {oathChecked && <div className={styles.oathCheckMark} />}
                </div>
                <span className={styles.oathAgreeText}>
                  위 A~G항 및 위반 시 법적 효과를 모두 숙지하였으며, 본 서약을 회사와의 매니저 이용계약의 일부로 받아들이고 위반 시 모든 책임을 본인이 부담함에 동의합니다.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.oathCta}>
          <button
            className={styles.oathCtaBtn}
            onClick={() => setOathAgreed(true)}
            disabled={!oathChecked}
          >
            서약하고 회원가입 진행하기
            {oathChecked && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    );
  }

  // ── Signup form ──
  return (
    <div className={styles.page}>
      <div className={styles.scrollArea}>
        <div className={styles.inner}>
          {/* Brand */}
          <div className={styles.brandRow}>
            <h1 className={styles.logoTitle}>Knots &amp; Links</h1>
            <span className={styles.managerPill}>
              <span className={styles.managerDot} />
              매니저 가입
            </span>
          </div>

          {/* 01 기본 정보 */}
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>01</span>
            <span className={styles.sectionLabel}>기본 정보</span>
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>
                이름 <span className={styles.required}>*</span>
              </div>
              <input
                className={`${styles.input}${nameError ? ` ${styles.inputError}` : ''}`}
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="실명을 입력하세요 (한글/영문 2~20자)"
                autoFocus
              />
              {nameError && <p className={styles.fieldError}>{nameError}</p>}
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>별명 <span style={{ fontSize: 10, color: 'var(--ink-400)', fontWeight: 700, marginLeft: 2 }}>선택</span></div>
              <div className={styles.nicknameRow}>
                <input
                  className={`${styles.input} ${styles.nicknameInput}`}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={suggestedNickname}
                />
                <button
                  type="button"
                  className={styles.refreshBtn}
                  onClick={() => setSuggestedNickname(generateNickname())}
                >
                  <RefreshCw size={12} /> 다른 별명
                </button>
              </div>
              <p className={styles.nicknameHint}>
                입력하지 않으면 <strong style={{ color: 'var(--ink-700)' }}>{suggestedNickname}</strong> 으로 설정됩니다
              </p>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>이메일 <span className={styles.required}>*</span></div>
              <input
                className={`${styles.input}${emailError ? ` ${styles.inputError}` : ''}`}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                placeholder="email@example.com"
              />
              {emailError && <p className={styles.fieldError}>{emailError}</p>}
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>전화번호 <span className={styles.required}>*</span></div>
              <PhoneVerifyField
                value={phone}
                onChange={setPhone}
                onVerified={setVerificationId}
                inputClassName={styles.input}
              />
              <div className={styles.smsHint}>
                <Smartphone size={13} className={styles.smsHintIcon} />
                <p className={styles.smsHintText}>
                  매칭 알림은 <strong>070-8095-3662</strong> 번호로 발송됩니다.
                  스팸 번호가 아니니 수신 차단을 해제해 주세요.
                </p>
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>비밀번호 <span className={styles.required}>*</span></div>
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 (8자 이상)"
                minLength={8}
              />
              {password.length > 0 && (
                <div className={styles.pwStrength}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`${styles.pwStrengthBar}${
                        strength >= i ? (strength <= 1 ? ` ${styles.weak}` : strength <= 2 ? ` ${styles.fair}` : ` ${styles.good}`) : ''
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>비밀번호 확인 <span className={styles.required}>*</span></div>
              <input
                className={styles.input}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="비밀번호 재입력"
              />
            </div>
          </div>

          {/* 02 정산 계좌 */}
          <div className={styles.sectionHead}>
            <span className={styles.sectionNum}>02</span>
            <span className={styles.sectionLabel}>정산 계좌</span>
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>은행명 <span className={styles.required}>*</span></div>
              <select
                className={`${styles.select}${bankNameError ? ` ${styles.inputError}` : ''}`}
                value={bankName}
                onChange={(e) => { setBankName(e.target.value); if (bankNameError) setBankNameError(''); }}
              >
                <option value="" className={styles.selectPlaceholder}>은행 선택</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank.value} value={bank.value}>{bank.label}</option>
                ))}
              </select>
              {bankNameError && <p className={styles.fieldError}>{bankNameError}</p>}
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>계좌번호 <span className={styles.required}>*</span></div>
              <input
                className={`${styles.input}${bankNumberError ? ` ${styles.inputError}` : ''}`}
                inputMode="numeric"
                value={bankNumber}
                onChange={(e) => { setBankNumber(e.target.value.replace(/\D/g, '')); if (bankNumberError) setBankNumberError(''); }}
                placeholder="계좌번호 입력 (숫자만, '-' 제외)"
              />
              {bankNumberError && <p className={styles.fieldError}>{bankNumberError}</p>}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyInner}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '가입하기'}
            {!isLoading && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
