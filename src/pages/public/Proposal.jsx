import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as matchService from '../../api/matchService';
import styles from './Proposal.module.css';

export default function Proposal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [responded, setResponded] = useState(false);

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
      await matchService.respondProposal(token, response);
      setResponded(true);
      setData((d) => ({ ...d, status: 'responded' }));
    } catch (err) {
      setError(err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>프로포절을 불러오는 중...</div>;
  if (error && !data) return <div className={styles.errorPage}><p>{error}</p></div>;
  if (!data?.counterpart) return <div className={styles.errorPage}><p>프로필 정보를 찾을 수 없습니다.</p></div>;

  const cp = data.counterpart;

  const fields = [
    { label: '별명', value: cp.nickname },
    { label: '나이', value: cp.age ? `${cp.age}세` : null },
    { label: '성별', value: cp.gender === 'male' ? '남성' : cp.gender === 'female' ? '여성' : null },
    { label: '키', value: cp.height ? `${cp.height}cm` : null },
    { label: '직업', value: cp.occupation },
    { label: '학력', value: cp.education },
    { label: '거주지', value: cp.location },
    { label: '종교', value: cp.religion },
    { label: 'MBTI', value: cp.mbti },
    { label: '취미', value: cp.hobbies },
  ].filter((f) => f.value);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>findmyone</h1>
        <p className={styles.subtitle}>당신을 위한 매칭 제안</p>

        {data.myName && (
          <p className={styles.greeting}>{data.myName}님, 아래 프로필을 확인해주세요.</p>
        )}

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

        {cp.photoUrls?.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>사진</h3>
            <div className={styles.photoGallery}>
              {cp.photoUrls.map((url, idx) => (
                <div key={idx} className={styles.photoThumb}>
                  <img src={url} alt={`사진 ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {cp.introduction && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>자기소개</h3>
            <p className={styles.text}>{cp.introduction}</p>
          </div>
        )}

        {responded ? (
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>응답 완료</p>
            <p className={styles.respondedStatus}>이미 응답하셨습니다. 감사합니다.</p>
          </div>
        ) : (
          <div className={styles.actions}>
            <button
              className={styles.acceptBtn}
              onClick={() => handleRespond('accepted')}
              disabled={submitting}
            >
              {submitting ? '처리 중...' : '수락'}
            </button>
            <button
              className={styles.rejectBtn}
              onClick={() => handleRespond('rejected')}
              disabled={submitting}
            >
              거절
            </button>
          </div>
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
