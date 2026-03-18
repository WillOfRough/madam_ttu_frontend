import { Phone, User } from 'lucide-react';
import styles from '../Proposal.module.css';

export default function AfterProfile({ profile }) {
  const profileFields = [
    { label: '이름', value: profile.name },
    { label: '전화번호', value: profile.phone },
    { label: '나이', value: profile.age ? `${profile.age}세` : null },
    { label: '키', value: profile.height ? `${profile.height}cm` : null },
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

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <User size={16} /> 프로필
          </h3>
          <div className={styles.fields}>
            {profileFields.filter((f) => f.label !== '이름' && f.label !== '전화번호').map(({ label, value }) => (
              <div key={label} className={styles.field}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldValue}>{value}</span>
              </div>
            ))}
          </div>
        </div>

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
