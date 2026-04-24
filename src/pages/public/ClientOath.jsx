import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ClientOath.module.css';

const CONSENT_SECTIONS = [
  {
    id: 'collect',
    title: '개인정보 수집 및 이용 동의',
    required: true,
    content: [
      { label: '수집 항목', value: '이름, 별명(닉네임), 성별, 출생연도, 연락처(휴대전화번호), 거주지역, 신장(키), 직업, 직장명, 최종학력, 종교, MBTI, 취미, 자기소개, 이상형, 프로필 사진' },
      { label: '수집 목적', value: '매칭 서비스 제공, 매칭 대상자 선정 및 프로필 구성, 서비스 이용 관련 연락 및 안내, 회원 관리 및 본인 확인' },
      { label: '보유 및 이용 기간', value: '서비스 이용 종료(탈퇴 요청) 시까지. 단, 관련 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.' },
      { label: '법적 근거', value: '개인정보보호법 제15조 제1항 제1호 (정보주체의 동의)' },
    ],
  },
  {
    id: 'thirdParty',
    title: '개인정보 제3자 제공 동의',
    required: true,
    content: [
      { label: '제공 대상', value: '담당 매칭 매니저 및 매칭 상대방' },
      {
        label: '제공 항목',
        items: [
          '매칭 매니저: 이름, 별명, 성별, 출생연도, 연락처, 거주지역, 신장, 직업, 직장명, 최종학력, 종교, MBTI, 취미, 자기소개, 이상형, 프로필 사진',
          '매칭 상대방: 별명, 성별, 나이(연령대), 거주지역, 신장, 직업, 최종학력, 종교, MBTI, 취미, 자기소개, 프로필 사진',
        ],
      },
      { label: '연락처 공유', value: '연락처(휴대전화번호)는 매칭이 성사되어 양측 모두 동의한 경우에 한하여 상대방에게 제공됩니다.' },
      { label: '제공 목적', value: '매칭 서비스 진행, 매칭 적합성 판단 및 상대방 프로필 열람' },
      { label: '보유 및 이용 기간', value: '제공 목적 달성 시까지. 매칭 종료 또는 탈퇴 요청 시 지체 없이 파기합니다.' },
      { label: '법적 근거', value: '개인정보보호법 제17조 제1항 제1호 (정보주체의 동의)' },
    ],
  },
  {
    id: 'rights',
    title: '정보주체의 권리 및 동의 거부 안내',
    required: false,
    infoOnly: true,
    content: [
      { label: '동의 거부 권리', value: '귀하는 위 개인정보 수집 및 제3자 제공에 대한 동의를 거부할 권리가 있습니다.' },
      { label: '거부 시 불이익', value: '필수 동의 항목에 대한 동의를 거부하실 경우 매칭 서비스 이용이 제한됩니다.' },
      { label: '권리 행사', value: '개인정보의 열람, 정정, 삭제, 처리정지를 요청하실 수 있으며, 동의를 철회(탈퇴)하실 수 있습니다.' },
      { label: '관련 법령', value: '개인정보보호법 제4조(정보주체의 권리), 제36조(개인정보의 정정·삭제), 제37조(개인정보의 처리정지 등)' },
    ],
  },
];

const OATH_ITEMS = [
  '본인은 현재 미혼이며, 교제 중인 상대가 없음을 확인합니다.',
  '허위 정보를 기재할 경우 서비스 이용이 제한되며, 이로 인해 발생하는 민·형사상 책임은 본인에게 있음을 이해합니다.',
  '본인의 양심에 따라 모든 정보를 정직하게 작성할 것을 서약합니다.',
];

function ConsentSection({ section, checked, onToggle, expanded, onExpand }) {
  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={onExpand} type="button">
        <span className={styles.sectionTitle}>{section.title}</span>
        {section.required && <span className={styles.requiredBadge}>필수</span>}
        <span className={styles.chevron}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {expanded && (
        <div className={styles.sectionBody}>
          {section.content.map((row, i) => (
            <div key={i} className={styles.detailRow}>
              <span className={styles.detailLabel}>{row.label}</span>
              {row.items ? (
                <ul className={styles.detailList}>
                  {row.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              ) : (
                <span className={styles.detailValue}>{row.value}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!section.infoOnly && (
        <label className={styles.sectionAgree} onClick={() => onToggle(!checked)}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggle(e.target.checked)}
            className={styles.sectionCheckbox}
          />
          <div className={`${styles.customCheck} ${checked ? styles.checked : styles.unchecked}`}>
            {checked && <div className={styles.checkIcon} />}
          </div>
          <span className={styles.sectionAgreeText}>
            {section.title.replace(' (필수)', '')}에 동의합니다
          </span>
        </label>
      )}
    </div>
  );
}

export default function ClientOath() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [consents, setConsents] = useState({ collect: false, thirdParty: false });
  const [oathAgreed, setOathAgreed] = useState(false);
  const [expanded, setExpanded] = useState({ collect: false, thirdParty: false, rights: false });

  const allRequired = consents.collect && consents.thirdParty && oathAgreed;
  const checkedCount = [consents.collect, consents.thirdParty, oathAgreed].filter(Boolean).length;

  const toggleConsent = (id, val) => setConsents((prev) => ({ ...prev, [id]: val }));
  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleAgreeAll = () => {
    const next = !allRequired;
    setConsents({ collect: next, thirdParty: next });
    setOathAgreed(next);
  };

  const handleProceed = () => {
    if (allRequired) navigate(`/apply/${token}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Brand */}
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>
            <div className={styles.brandIconDot} />
          </div>
          <span className={styles.brandName}>Knots &amp; Links</span>
        </div>

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--tangerine-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6l8-3z" />
            </svg>
          </div>
          <h1 className={styles.heroTitle}>동의와 서약</h1>
          <p className={styles.heroSub}>서비스 이용 전, 아래 내용을 확인해주세요.</p>
        </div>

        {/* Consent sections */}
        <div className={styles.sections}>
          {CONSENT_SECTIONS.map((section) => (
            <ConsentSection
              key={section.id}
              section={section}
              checked={consents[section.id] || false}
              onToggle={(val) => toggleConsent(section.id, val)}
              expanded={expanded[section.id] || false}
              onExpand={() => toggleExpand(section.id)}
            />
          ))}
        </div>

        {/* Oath card */}
        <div className={styles.oathBox}>
          <div className={styles.oathBoxHeader}>
            <svg className={styles.heartIcon} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
            </svg>
            이용자 서약
          </div>
          <div className={styles.items}>
            {OATH_ITEMS.map((text, idx) => (
              <div key={idx} className={styles.item}>
                <span className={styles.itemNum}>{idx + 1}</span>
                <span className={styles.itemText}>{text}</span>
              </div>
            ))}
          </div>
          <label className={styles.sectionAgree} onClick={() => setOathAgreed(!oathAgreed)}>
            <input
              type="checkbox"
              checked={oathAgreed}
              onChange={(e) => setOathAgreed(e.target.checked)}
              className={styles.sectionCheckbox}
            />
            <div className={`${styles.customCheck} ${oathAgreed ? styles.checked : styles.unchecked}`}>
              {oathAgreed && <div className={styles.checkIcon} />}
            </div>
            <span className={styles.sectionAgreeText}>위 서약 사항을 숙지했으며 이에 동의합니다</span>
          </label>
        </div>

        {/* All agree */}
        <label className={`${styles.agreeAllLabel} ${allRequired ? styles.allOn : ''}`} onClick={handleAgreeAll}>
          <input
            type="checkbox"
            checked={allRequired}
            onChange={handleAgreeAll}
            className={styles.checkbox}
          />
          <div className={`${styles.agreeAllCheck} ${allRequired ? styles.checked : styles.unchecked}`}>
            {allRequired && <div className={styles.agreeAllCheckIcon} />}
          </div>
          <span className={styles.agreeAllText}>전체 동의</span>
          <span className={styles.agreeCount} style={{ color: allRequired ? 'var(--mint-600)' : 'var(--ink-400)' }}>
            {checkedCount}/3
          </span>
        </label>

        <button
          className={styles.proceedBtn}
          onClick={handleProceed}
          disabled={!allRequired}
        >
          동의하고 시작하기
          {allRequired && (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
