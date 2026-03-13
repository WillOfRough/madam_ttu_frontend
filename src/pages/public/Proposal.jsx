import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import * as matchService from '../../api/matchService';
import styles from './Proposal.module.css';

const OATH_ITEMS = [
  '프로필 정보를 캡처, 저장, 제3자에게 공유하지 않겠습니다.',
  '위반 시 서비스 이용이 영구 제한될 수 있음을 이해합니다.',
];

export default function Proposal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [responded, setResponded] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Oath screen state
  const [oathAgreed, setOathAgreed] = useState(false);
  const [oathPassed, setOathPassed] = useState(false);

  useEffect(() => {
    matchService
      .getProposal(token)
      .then((res) => {
        setData(res);
        if (res.status === 'responded') setResponded(true);
      })
      .catch((err) => setError(err.message || '프로포절을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async (response) => {
    setSubmitting(true);
    try {
      const result = await matchService.respondProposal(token, response);
      setResponded(true);
      setData((d) => ({ ...d, status: 'responded' }));
      setResponseMessage(result.message || '응답이 완료되었습니다.');
    } catch (err) {
      setError(err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>프로포절을 불러오는 중...</div>;
  if (error && !data) return <div className={styles.errorPage}><p>{error}</p></div>;

  // Inactive proposal (A's proposal before B accepts)
  if (data && data.isActive === false) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <div className={styles.inactiveBanner}>
            <Lock size={32} />
            <p className={styles.inactiveTitle}>아직 확인할 수 없는 프로필입니다</p>
            <p className={styles.inactiveDesc}>상대방의 확인이 완료되면 프로필을 확인하실 수 있습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.counterpart) return <div className={styles.errorPage}><p>프로필 정보를 찾을 수 없습니다.</p></div>;

  const cp = data.counterpart;

  // Screen 1: Security Oath
  if (!oathPassed && !responded) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>

          <div className={styles.oathCard}>
            <div className={styles.oathIcon}>
              <Lock size={32} />
            </div>
            <h2 className={styles.oathTitle}>소중한 정보입니다</h2>
            <p className={styles.oathSubtitle}>프로필 열람 전 서약이 필요합니다</p>

            <div className={styles.oathItems}>
              {OATH_ITEMS.map((text, idx) => (
                <div key={idx} className={styles.oathItem}>
                  <span className={styles.oathNum}>{idx + 1}.</span>
                  <span className={styles.oathText}>{text}</span>
                </div>
              ))}
            </div>

            <label className={styles.agreeLabel}>
              <input
                type="checkbox"
                checked={oathAgreed}
                onChange={(e) => setOathAgreed(e.target.checked)}
                className={styles.checkbox}
              />
              <span>위 내용을 숙지했으며 서약합니다.</span>
            </label>

            <button
              className={styles.oathBtn}
              onClick={() => setOathPassed(true)}
              disabled={!oathAgreed}
            >
              동의하고 프로필 확인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Screen 2: Profile View
  const fields = [
    { label: '별명', value: cp.nickname },
    { label: '나이', value: cp.age ? `${cp.age}세` : null },
    { label: '직업', value: cp.occupation },
    { label: '거주지', value: cp.location },
    { label: 'MBTI', value: cp.mbti },
    { label: '취미', value: cp.hobbies },
    { label: '종교', value: cp.religion },
  ].filter((f) => f.value);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>findmyone</h1>
        <p className={styles.subtitle}>당신을 위한 매칭 제안</p>

        {data.myName && (
          <p className={styles.greeting}>{data.myName}님, 아래 프로필을 확인해주세요.</p>
        )}

        {/* Blurred Photos */}
        {cp.photoUrls?.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>사진</h3>
            <div className={styles.photoGallery}>
              {cp.photoUrls.map((url, idx) => (
                <div key={idx} className={styles.photoThumb}>
                  <img src={url} alt={`사진 ${idx + 1}`} className={styles.blurredPhoto} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Fields */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>기본 정보</h3>
          <div className={styles.fields}>
            {fields.map(({ label, value }) => (
              <div key={label} className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {cp.introduction && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>자기소개</h3>
            <p className={styles.text}>{cp.introduction}</p>
          </div>
        )}

        {data.managerComment && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>매니저 추천 코멘트</h3>
            <p className={styles.text}>{data.managerComment}</p>
          </div>
        )}

        {responded ? (
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>응답 완료</p>
            <p className={styles.respondedStatus}>
              {responseMessage || '이미 응답하셨습니다. 감사합니다.'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.cautionNote}>
              매칭 후 취소는 상대방에게 큰 상처가 될 수 있습니다. 신중하게 선택해주세요.
            </div>
            <div className={styles.actions}>
              <button
                className={styles.acceptBtn}
                onClick={() => handleRespond('accepted')}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : '만나볼래요!'}
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => handleRespond('rejected')}
                disabled={submitting}
              >
                정중히 거절할게요
              </button>
            </div>
          </>
        )}

        {error && data && (
          <div className={styles.errorPage} style={{ minHeight: 'auto', padding: '12px 0' }}>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
