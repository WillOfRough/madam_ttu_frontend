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
  '9.014': '이 매칭은 종료되었습니다.',
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

  // Feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackAlreadyDone, setFeedbackAlreadyDone] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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
          // 백엔드 버그 대응: 매니저가 에프터 상태를 rejected로 변경하면
          // 양쪽 myAfterResponse를 모두 rejected로 덮어씀
          // localStorage에 저장된 원래 응답이 있으면 그것을 우선 사용
          const savedResponse = localStorage.getItem(`after_response_${token}`);
          if (savedResponse && res.afterStatus === 'rejected' && res.myAfterResponse === 'rejected') {
            setMyAfterResponse(savedResponse);
          } else {
            setMyAfterResponse(res.myAfterResponse);
          }
          setMyAfterRespondedAt(res.myAfterRespondedAt || null);
        }
      })
      .catch((err) => {
        const code = err.body?.error;
        if (code === '9.014') {
          setError('이 매칭은 종료되었습니다.');
        } else if (AFTER_ERROR_MESSAGES[code]) {
          setAfterError(AFTER_ERROR_MESSAGES[code]);
        } else {
          setError(err.message || '정보를 불러올 수 없습니다.');
        }
      })
      .finally(() => {
        setLoading(false);
        setInitialLoadDone(true);
      });
  }, [token]);

  // 거절 후 피드백 데이터 로드 (초기 로드 시에만 - 이미 제출했는지 확인)
  useEffect(() => {
    if (initialLoadDone && myAfterResponse === 'rejected') {
      setFeedbackLoading(true);
      matchService
        .getFeedback(token)
        .then((res) => {
          if (res?.feedbackAt) {
            setFeedbackSubmitted(true);
            setFeedbackAlreadyDone(true);
          }
        })
        .catch(() => {})
        .finally(() => setFeedbackLoading(false));
    }
  }, [initialLoadDone, token]);

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

  // 에프터 응답 (수락/거절)
  const handleAfterRespond = async (response) => {
    setSubmitting(true);
    try {
      await matchService.respondAfter(token, response);
      // 백엔드 버그 대응: 원래 응답을 localStorage에 저장
      // 매니저가 에프터 상태를 rejected로 변경하면 양쪽 myAfterResponse가
      // 모두 rejected로 덮어씌워지므로 원본 응답을 보존
      localStorage.setItem(`after_response_${token}`, response);
      setMyAfterResponse(response);
      if (response === 'accepted') {
        setMyAfterRespondedAt(new Date().toISOString());
      }
      // 응답 후 최신 상태를 서버에서 재조회
      try {
        const fresh = await matchService.getAfterStatus(token);
        setAfterStatus(fresh.afterStatus);
      } catch {
        // 재조회 실패 시 안전한 기본값 유지
        if (response === 'rejected') {
          setAfterStatus('rejected');
        }
      }
    } catch (err) {
      const code = err.body?.error;
      setAfterError(AFTER_ERROR_MESSAGES[code] || err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  // 피드백 제출 (거절 후 별도 단계)
  const handleFeedbackSubmit = async (comment) => {
    setSubmitting(true);
    try {
      await matchService.submitFeedback(token, { rating: 5, comment });
      setFeedbackSubmitted(true);
    } catch {
      setAfterError('피드백 제출에 실패했습니다. 다시 시도해주세요.');
    }
    setSubmitting(false);
  };

  // 에프터 성사 → 프로필 조회
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

  // ── 상태별 화면 분기 ──

  // 1. 성사 → 프로필 보기
  if (afterProfile) return <AfterProfile profile={afterProfile} />;

  // 2. 양쪽 모두 수락 → 성사 페이지 (프로필+연락처 보기)
  if (afterStatus === 'accepted') {
    return <AfterSuccess onViewProfile={handleViewAfterProfile} submitting={submitting} />;
  }

  // 3. 아직 미응답 → 선택 페이지 (더 만나고 싶어요 / 싫어요)
  if (myAfterResponse === 'pending' || myAfterResponse == null) {
    return (
      <AfterChoice
        onAccept={() => handleAfterRespond('accepted')}
        onReject={() => handleAfterRespond('rejected')}
        submitting={submitting}
      />
    );
  }

  // 4. 내가 거절 → 피드백 페이지 (이미 제출한 경우 만료 화면)
  if (myAfterResponse === 'rejected') {
    if (feedbackLoading) {
      return <div className={styles.loadingPage}>정보를 불러오는 중...</div>;
    }
    // 새로고침 시 이미 피드백 제출 완료 → 만료 화면
    if (feedbackAlreadyDone) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>Knots & Links</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>아쉽지만 이번엔 인연이 아니였나봐요</p>
              <p className={styles.respondedStatus}>더 좋은 매칭으로 다시 돌아올게요!</p>
            </div>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>만료된 링크입니다</p>
              <p className={styles.respondedStatus}>이 매칭은 종료되었습니다.</p>
            </div>
          </div>
        </div>
      );
    }
    return (
      <AfterFeedback
        submitted={feedbackSubmitted}
        onSubmit={handleFeedbackSubmit}
        submitting={submitting}
      />
    );
  }

  // 5. 내가 수락한 상태
  if (myAfterResponse === 'accepted') {
    // 5a. 상대가 거절 → 2시간 대기 후 "다음 인연 찾자"
    if (afterStatus === 'rejected') {
      if (waitTimeUp) {
        return <AfterRejected />;
      }
      // 2시간 이내 → 대기 화면 (결과 업데이트 안내)
      return <AfterWaiting />;
    }
    // 5b. 상대 미응답 → 대기 화면
    return <AfterWaiting />;
  }

  return null;
}
