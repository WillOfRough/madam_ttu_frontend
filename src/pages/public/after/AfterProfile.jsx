import { Phone, User } from 'lucide-react';
import styles from '../Proposal.module.css';

function PageHeader() {
  return (
    <div className={styles.brandHeader}>
      <div className={styles.brandMark}>
        <div className={styles.brandMarkDot} />
      </div>
      <span className={styles.brandName}>Knots &amp; Links</span>
    </div>
  );
}

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
      <PageHeader />
      <div className={styles.container}>
        {/* Success banner */}
        <div className={styles.afterSuccessBanner}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            <span className={styles.celebrationDot} />
            <span className={styles.celebrationDot} />
            <span className={styles.celebrationDot} />
          </div>
          <p className={styles.respondedLabel} style={{ color: 'var(--mint-600)', fontFamily: 'var(--font-sans)', fontSize: 18 }}>
            에프터가 성사되었습니다!
          </p>
          <p className={styles.respondedStatus} style={{ marginTop: 6 }}>
            상대방의 연락처와 프로필입니다.
          </p>
        </div>

        {/* Photos */}
        {profile.photoUrls?.length > 0 && (
          <div className={styles.card} style={{ marginTop: 16 }}>
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

        {/* Contact info */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <Phone size={13} />
            연락처 정보
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

        {/* Profile details */}
        {profileFields.filter((f) => f.label !== '이름' && f.label !== '전화번호').length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <User size={13} />
              프로필
            </h3>
            <div className={styles.fields}>
              {profileFields
                .filter((f) => f.label !== '이름' && f.label !== '전화번호')
                .map(({ label, value }) => (
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
