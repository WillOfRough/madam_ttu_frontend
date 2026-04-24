import { useState, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { RefreshCw, ShieldCheck, Smartphone, ArrowRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { generateNickname, BANK_OPTIONS } from '../../data/constants';
import PhoneVerifyField from '../../components/PhoneVerifyField';
import styles from './RegisterManager.module.css';

const OATH_ITEMS = [
  '매칭 과정에서 취득한 회원의 개인정보(이름, 연락처, 사진 등)를 제3자에게 무단으로 제공하거나 유출하지 않겠습니다.',
  '수집된 개인정보는 매칭 목적 이외의 용도로 사용하지 않겠습니다.',
  '회원이 탈퇴를 요청한 경우, 관련 정보를 지체 없이 삭제하겠습니다.',
  '위 사항을 위반할 경우 서비스 이용 제한 및 민·형사상 법적 책임을 질 수 있음을 이해합니다.',
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
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [bankName, setBankName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!NAME_REGEX.test(name.trim())) {
      setNameError('한글 또는 영문만 입력 가능하며, 2~20자여야 합니다.');
      return;
    }
    if (password !== confirmPw) { setError('비밀번호가 일치하지 않습니다.'); return; }
    if (!verificationId) { setError('휴대폰 인증을 완료해주세요.'); return; }
    const finalNickname = nickname.trim() || suggestedNickname;
    try {
      await register({ token, email, password, name: name.trim(), nickname: finalNickname, phone, verificationId, bankName: bankName || undefined, bankNumber: bankNumber.trim() || undefined });
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
              {OATH_ITEMS.map((text, i) => (
                <div key={i} className={styles.oathRule}>
                  <div className={styles.oathRuleNum}>{i + 1}</div>
                  <span className={styles.oathRuleText}>{text}</span>
                </div>
              ))}
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
                <span className={styles.oathAgreeText}>위 내용을 숙지했으며 서약합니다</span>
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
                className={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
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
            <span className={styles.sectionLabel}>정산 계좌 <span style={{ fontSize: 11, color: 'var(--ink-400)', fontWeight: 600 }}>(선택)</span></span>
          </div>
          <div className={styles.fieldCard}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>은행명</div>
              <select
                className={styles.select}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              >
                <option value="" className={styles.selectPlaceholder}>은행 선택 (선택)</option>
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank.value} value={bank.value}>{bank.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>계좌번호</div>
              <input
                className={styles.input}
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value)}
                placeholder="계좌번호 입력 (선택)"
              />
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
