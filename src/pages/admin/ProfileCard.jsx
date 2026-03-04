import { X, MapPin, Briefcase, GraduationCap, Wine, Cigarette, BookOpen, Check, XCircle } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import useProfileListStore from '../../store/profileListStore';
import {
  RELIGION_OPTIONS,
  DRINKING_OPTIONS,
  SMOKING_OPTIONS,
  EDUCATION_OPTIONS,
} from '../../data/constants';
import styles from './ProfileCard.module.css';

function getLabel(options, value) {
  return options.find((o) => o.value === value)?.label || value;
}

export default function ProfileCard() {
  const { selectedUserId, clearSelection, setMatchSource } = useAdminStore();
  const { getProfileById, updateProfileStatus } = useProfileListStore();
  const user = getProfileById(selectedUserId);

  if (!user) return null;

  const handleApprove = async () => {
    await updateProfileStatus(user.id, 'APPROVED');
  };

  const handleReject = async () => {
    await updateProfileStatus(user.id, 'REJECTED');
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3 className={styles.name}>{user.name}</h3>
          <span className={styles.nickname}>"{user.nickname}"</span>
        </div>
        <button className={styles.closeBtn} onClick={clearSelection}>
          <X size={18} />
        </button>
      </div>

      {/* Status + Actions */}
      {user.status && (
        <div className={styles.statusRow}>
          <span className={`${styles.statusBadge} ${styles[`status_${user.status.toLowerCase()}`]}`}>
            {user.status}
          </span>
          <div className={styles.statusActions}>
            <button
              className={styles.approveBtn}
              onClick={handleApprove}
              disabled={user.status === 'APPROVED'}
              title="승인"
            >
              <Check size={14} /> 승인
            </button>
            <button
              className={styles.rejectBtn}
              onClick={handleReject}
              disabled={user.status === 'REJECTED'}
              title="거절"
            >
              <XCircle size={14} /> 거절
            </button>
          </div>
        </div>
      )}

      {/* Photo placeholder */}
      <div className={styles.photoSection}>
        <div className={styles.photoPlaceholder}>
          <BookOpen size={32} />
          <span>사진 {user.photos?.length || 0}장</span>
        </div>
      </div>

      {/* Basic Info */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>나이</span>
          <span className={styles.infoValue}>{user.age}세</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>키</span>
          <span className={styles.infoValue}>{user.height}cm</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>MBTI</span>
          <span className={styles.infoValue}>{user.mbti || '-'}</span>
        </div>
      </div>

      {/* Detail Rows */}
      <div className={styles.details}>
        <div className={styles.detailRow}>
          <Briefcase size={15} />
          <span>{user.job}</span>
        </div>
        <div className={styles.detailRow}>
          <GraduationCap size={15} />
          <span>{getLabel(EDUCATION_OPTIONS, user.education)}</span>
        </div>
        <div className={styles.detailRow}>
          <MapPin size={15} />
          <span>{user.location}</span>
        </div>
        <div className={styles.detailRow}>
          <BookOpen size={15} />
          <span>{getLabel(RELIGION_OPTIONS, user.religion)}</span>
        </div>
        <div className={styles.detailRow}>
          <Wine size={15} />
          <span>{getLabel(DRINKING_OPTIONS, user.drinking)}</span>
        </div>
        <div className={styles.detailRow}>
          <Cigarette size={15} />
          <span>{getLabel(SMOKING_OPTIONS, user.smoking)}</span>
        </div>
      </div>

      {/* Personality */}
      <div className={styles.tagSection}>
        <h4 className={styles.tagTitle}>성격</h4>
        <div className={styles.tags}>
          {(user.personality || []).map((p) => (
            <span key={p} className={styles.tag}>{p}</span>
          ))}
        </div>
      </div>

      {/* Hobbies */}
      <div className={styles.tagSection}>
        <h4 className={styles.tagTitle}>취미</h4>
        <div className={styles.tags}>
          {(user.hobbies || []).map((h) => (
            <span key={h} className={`${styles.tag} ${styles.hobbyTag}`}>{h}</span>
          ))}
        </div>
      </div>

      {/* Intro */}
      <div className={styles.introSection}>
        <h4 className={styles.tagTitle}>자기소개</h4>
        <p className={styles.introText}>"{user.intro}"</p>
      </div>

      {/* Match Button */}
      <button
        className={styles.matchBtn}
        onClick={() => { setMatchSource(user.id); clearSelection(); }}
      >
        이 회원의 매칭 시뮬레이션
      </button>
    </div>
  );
}
