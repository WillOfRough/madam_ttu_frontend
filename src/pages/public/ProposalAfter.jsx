import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as matchService from '../../api/matchService';
import AfterChoice from './after/AfterChoice';
import AfterFeedback from './after/AfterFeedback';
import AfterWaiting from './after/AfterWaiting';
import styles from './Proposal.module.css';

const AFTER_ERROR_MESSAGES = {
  '9.007': '미팅이 아직 완료되지 않았습니다.',
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
  const [myName, setMyName] = useState('');
  const [afterStatus, setAfterStatus] = useState(null);
  const [myAfterResponse, setMyAfterResponse] = useState(null);
  const [afterError, setAfterError] = useState(null);

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
          setMyName(res.myName || '');
          setAfterStatus(res.afterStatus);
          const savedResponse = localStorage.getItem(`after_response_${token}`);
          if (savedResponse && res.afterStatus === 'rejected' && res.myAfterResponse === 'rejected') {
            setMyAfterResponse(savedResponse);
          } else {
            setMyAfterResponse(res.myAfterResponse);
          }
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

  // 에프터 응답 (수락/거절)
  const handleAfterRespond = async (response) => {
    setSubmitting(true);
    try {
      await matchService.respondAfter(token, response);
      localStorage.setItem(`after_response_${token}`, response);
      setMyAfterResponse(response);
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

  // 1. 아직 미응답 → 선택 페이지 (더 만나고 싶어요 / 싫어요)
  if (myAfterResponse === 'pending' || myAfterResponse == null) {
    return (
      <AfterChoice
        onAccept={() => handleAfterRespond('accepted')}
        onReject={() => handleAfterRespond('rejected')}
        submitting={submitting}
      />
    );
  }

  // 2. 내가 수락 → 응답 완료 대기 메시지
  if (myAfterResponse === 'accepted') {
    return <AfterWaiting />;
  }

  // 3. 내가 거절 → 피드백 페이지
  if (myAfterResponse === 'rejected') {
    if (feedbackLoading) {
      return <div className={styles.loadingPage}>정보를 불러오는 중...</div>;
    }
    // 이미 피드백 제출 완료 → 간단 감사 메시지
    if (feedbackAlreadyDone || feedbackSubmitted) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>Knots & Links</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>피드백을 제출했습니다</p>
              <p className={styles.respondedStatus}>감사합니다.</p>
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

  return null;
}
