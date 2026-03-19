import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Phone, User } from 'lucide-react';
import * as matchService from '../../api/matchService';
import styles from './Proposal.module.css';

const ERROR_MESSAGES = {
  '9.014': '이 매칭은 종료되었습니다.',
  MATCH_INVALID_STATUS: '아직 결과를 확인할 수 없습니다.',
  MATCH_CANCELLED: '이 매칭은 취소되었습니다.',
};

export default function ProposalAfterResult() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myName, setMyName] = useState('');
  const [afterStatus, setAfterStatus] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let namePromise = matchService
      .getAfterStatus(token)
      .then((res) => {
        setMyName(res.myName || '');
      })
      .catch(() => {});

    namePromise.then(() => {
      matchService
        .getAfterResult(token)
        .then((res) => {
          setAfterStatus(res.afterStatus);
          if (res.afterStatus === 'accepted' && res.counterpartProfile) {
            setProfile(res.counterpartProfile);
          }
        })
        .catch((err) => {
          const code = err.body?.error;
          setError(ERROR_MESSAGES[code] || err.message || '결과를 불러올 수 없습니다.');
        })
        .finally(() => setLoading(false));
    });
  }, [token]);

  if (loading) return <div className={styles.loadingPage}>결과를 불러오는 중...</div>;

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>알림</p>
            <p className={styles.respondedStatus}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // 미성사
  if (afterStatus === 'rejected') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.afterCard}>
            <p className={styles.afterDesc}>
              인연을 찾는 과정이 늘 쉽지는 않죠.
              <br />비록 이번 만남은 닿지 못했지만, 보내주신 피드백을 꼼꼼히 보고
              {myName ? ` ${myName}` : ''} 님께 더 좋은 매칭을 만들어 드리기 위해 노력할게요.
              <br />저희가{myName ? ` ${myName}` : ''} 님의 진가를 알아볼 분을 꼭 찾아낼게요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 성사 + 프로필
  if (afterStatus === 'accepted' && profile) {
    const profileFields = [
      { label: '나이', value: profile.age ? `${profile.age}세` : null },
      { label: '키', value: profile.height ? `${profile.height}cm` : null },
      { label: '직업', value: profile.occupation },
      { label: '회사', value: profile.company },
      { label: '거주지', value: profile.location },
      { label: 'MBTI', value: profile.mbti },
      { label: '취미', value: profile.hobbies },
    ].filter((f) => f.value);

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.afterSuccessBanner}>
            <p className={styles.respondedLabel}>에프터가 성사되었습니다!</p>
            <p className={styles.respondedStatus}>상대방의 연락처와 프로필입니다.</p>
          </div>

          {profile.photoUrls?.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>사진</h3>
              <div className={styles.photoGallery}>
                {profile.photoUrls.map((url, idx) => (
                  <div key={idx} className={styles.photoThumb}>
                    <img src={url} alt={`사진 ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <Phone size={16} /> 연락처 정보
            </h3>
            <div className={styles.fields}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>이름</span>
                <span className={styles.fieldValue}>{profile.name}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>전화번호</span>
                <span className={styles.fieldValue}>{profile.phone}</span>
              </div>
            </div>
          </div>

          {profileFields.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <User size={16} /> 프로필
              </h3>
              <div className={styles.fields}>
                {profileFields.map(({ label, value }) => (
                  <div key={label} className={styles.field}>
                    <span className={styles.fieldLabel}>{label}</span>
                    <span className={styles.fieldValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {profile.introduction && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>자기소개</h3>
              <p className={styles.text}>{profile.introduction}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <div className={styles.respondedBanner}>
          <p className={styles.respondedLabel}>알림</p>
          <p className={styles.respondedStatus}>아직 결과를 확인할 수 없습니다.</p>
        </div>
      </div>
    </div>
  );
}
