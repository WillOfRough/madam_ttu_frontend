import { useMemo } from 'react';
import { X, Heart, ArrowRight, Star } from 'lucide-react';
import useAdminStore from '../../store/adminStore';
import mockUsers from '../../data/mockUsers';
import { getMatchRecommendations } from '../../utils/matchScore';
import styles from './MatchSimulation.module.css';

function ScoreBar({ score }) {
  const color =
    score >= 75 ? 'var(--success)' :
    score >= 50 ? 'var(--gold)' :
    'var(--charcoal-light)';

  return (
    <div className={styles.scoreBarWrap}>
      <div
        className={styles.scoreBar}
        style={{ width: `${score}%`, background: color }}
      />
      <span className={styles.scoreText} style={{ color }}>{score}%</span>
    </div>
  );
}

export default function MatchSimulation() {
  const { matchSourceId, clearMatchSource, setSelectedUser } = useAdminStore();
  const sourceUser = mockUsers.find((u) => u.id === matchSourceId);

  const recommendations = useMemo(() => {
    if (!sourceUser) return [];
    return getMatchRecommendations(sourceUser, mockUsers, 5);
  }, [sourceUser]);

  if (!sourceUser) return null;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            <Heart size={18} />
            매칭 시뮬레이션
          </h3>
          <p className={styles.sourceInfo}>
            {sourceUser.name} ({sourceUser.nickname}) 기준
          </p>
        </div>
        <button className={styles.closeBtn} onClick={clearMatchSource}>
          <X size={18} />
        </button>
      </div>

      {/* Results */}
      <div className={styles.results}>
        {recommendations.map((rec, idx) => (
          <div key={rec.user.id} className={styles.resultItem}>
            <div className={styles.resultRank}>
              {idx === 0 ? <Star size={16} className={styles.starIcon} /> : idx + 1}
            </div>
            <div className={styles.resultInfo}>
              <div className={styles.resultName}>
                <strong>{rec.user.name}</strong>
                <span className={styles.resultNickname}>{rec.user.nickname}</span>
              </div>
              <div className={styles.resultMeta}>
                {rec.user.age}세 · {rec.user.job} · {rec.user.mbti}
              </div>
              <div className={styles.scores}>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    {sourceUser.name} <ArrowRight size={12} /> {rec.user.name}
                  </span>
                  <ScoreBar score={rec.score} />
                </div>
                <div className={styles.scoreRow}>
                  <span className={styles.scoreLabel}>
                    {rec.user.name} <ArrowRight size={12} /> {sourceUser.name}
                  </span>
                  <ScoreBar score={rec.reverseScore} />
                </div>
                <div className={`${styles.scoreRow} ${styles.avgRow}`}>
                  <span className={styles.scoreLabel}>평균</span>
                  <ScoreBar score={rec.avgScore} />
                </div>
              </div>
              {/* Common traits */}
              <div className={styles.commonTraits}>
                {sourceUser.personality
                  .filter((p) => rec.user.personality.includes(p))
                  .map((p) => (
                    <span key={p} className={styles.commonTag}>{p}</span>
                  ))}
              </div>
            </div>
            <button
              className={styles.profileBtn}
              onClick={() => {
                setSelectedUser(rec.user.id);
                clearMatchSource();
              }}
              title="프로필 보기"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
