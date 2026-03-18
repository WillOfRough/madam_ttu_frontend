import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as matchService from '../../api/matchService';
import AfterChoice from './after/AfterChoice';
import AfterFeedback from './after/AfterFeedback';
import AfterWaiting from './after/AfterWaiting';
import AfterRejected from './after/AfterRejected';
import AfterSuccess from './after/AfterSuccess';
import AfterProfile from './after/AfterProfile';
import styles from './Proposal.module.css';

const AFTER_ERROR_MESSAGES = {
  '9.007': '미팅이 아직 완료되지 않았습니다.',
  '9.012': '에프터가 성사되지 않았습니다.',
  '9.013': '연락처 조회 기간(24시간)이 만료되었습니다.',
};

export default function ProposalAfter() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Match status check
  const [matchStatus, setMatchStatus] = useState(null);

  // After state
  const [afterStatus, setAfterStatus] = useState(null);
  const [myAfterResponse, setMyAfterResponse] = useState(null);
  const [myAfterRespondedAt, setMyAfterRespondedAt] = useState(null);
  const [afterProfile, setAfterProfile] = useState(null);
  const [afterError, setAfterError] = useState(null);
  const [waitTimeUp, setWaitTimeUp] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  // 1. 매칭 상태 확인 → completed일 때만 에프터 상태 조회
  useEffect(() => {
    matchService
      .getProposal(token)
      .then((res) => {
        setMatchStatus(res.matchStatus);
        if (res.matchStatus === 'completed') {
          return matchService.getAfterStatus(token);
        }
        return null;
      })
      .then((res) => {
        if (res) {
          setAfterStatus(res.afterStatus);
          setMyAfterResponse(res.myAfterResponse);
          setMyAfterRespondedAt(res.myAfterRespondedAt || null);
        }
      })
      .catch((err) => {
        const code = err.body?.error;
        if (AFTER_ERROR_MESSAGES[code]) {
          setAfterError(AFTER_ERROR_MESSAGES[code]);
        } else {
          setError(err.message || '정보를 불러올 수 없습니다.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // 2시간 대기 타이머: 내가 수락했는데 상대가 거절한 경우
  useEffect(() => {
    if (myAfterResponse !== 'accepted' || afterStatus !== 'rejected' || !myAfterRespondedAt) {
      setWaitTimeUp(false);
      return;
    }
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(myAfterRespondedAt).getTime();
    if (elapsed >= TWO_HOURS) {
      setWaitTimeUp(true);
      return;
    }
    const timer = setTimeout(() => setWaitTimeUp(true), TWO_HOURS - elapsed);
    return () => clearTimeout(timer);
  }, [myAfterResponse, afterStatus, myAfterRespondedAt]);

  const handleAfterRespond = async (response) => {
    setSubmitting(true);
    try {
      const result = await matchService.respondAfter(token, response);
      setMyAfterResponse(response);
      setAfterStatus(result.afterStatus);
      if (response === 'accepted') {
        setMyAfterRespondedAt(new Date().toISOString());
      }
    } catch (err) {
      const code = err.body?.error;
      setAfterError(AFTER_ERROR_MESSAGES[code] || err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const handleAfterReject = () => {
    setShowFeedback(true);
  };

  const handleFeedbackSubmit = async (_feedbackText) => {
    await handleAfterRespond('rejected');
  };

  const handleViewAfterProfile = async () => {
    setSubmitting(true);
    try {
      const profile = await matchService.getAfterProfile(token);
      setAfterProfile(profile);
    } catch (err) {
      const code = err.body?.error;
      setAfterError(AFTER_ERROR_MESSAGES[code] || err.message || '프로필 조회에 실패했습니다.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>정보를 불러오는 중...</div>;

  // 에러 (네트워크 등)
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

  // 미팅 완료 전이면 안내
  if (matchStatus !== 'completed') {
    let message = '에프터 응답은 미팅 완료 후 가능합니다.';
    if (matchStatus === 'cancelled') {
      message = '이 매칭은 종료되었습니다.';
    }
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>알림</p>
            <p className={styles.respondedStatus}>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  // 에프터 에러 (비즈니스 로직)
  if (afterError) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>알림</p>
            <p className={styles.respondedStatus}>{afterError}</p>
          </div>
        </div>
      </div>
    );
  }

  // 성사 → 프로필 보기
  if (afterProfile) return <AfterProfile profile={afterProfile} />;

  // 양쪽 모두 수락 → 성사 페이지
  if (afterStatus === 'accepted') {
    return <AfterSuccess onViewProfile={handleViewAfterProfile} submitting={submitting} />;
  }

  // 아직 미응답 → 선택 또는 피드백 입력 페이지
  if (myAfterResponse === 'pending' || myAfterResponse == null) {
    if (showFeedback) {
      return (
        <AfterFeedback
          submitted={false}
          onSubmit={handleFeedbackSubmit}
          onBack={() => setShowFeedback(false)}
          submitting={submitting}
        />
      );
    }
    return (
      <AfterChoice
        onAccept={() => handleAfterRespond('accepted')}
        onReject={handleAfterReject}
        submitting={submitting}
      />
    );
  }

  // 내가 거절 → 피드백 완료 페이지
  if (myAfterResponse === 'rejected') {
    return <AfterFeedback submitted />;
  }

  // 내가 수락한 상태
  if (myAfterResponse === 'accepted') {
    if (afterStatus === 'rejected' && waitTimeUp) {
      return <AfterRejected />;
    }
    return <AfterWaiting />;
  }

  return null;
}
