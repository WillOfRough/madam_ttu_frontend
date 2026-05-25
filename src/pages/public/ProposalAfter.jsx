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

  // 이미 거절 응답한 경우 피드백 제출 여부 확인 (서버 + localStorage)
  useEffect(() => {
    if (initialLoadDone && myAfterResponse === 'rejected') {
      // localStorage에 피드백 제출 기록이 있으면 바로 완료 처리
      if (localStorage.getItem(`after_feedback_${token}`)) {
        setFeedbackSubmitted(true);
        setFeedbackAlreadyDone(true);
        return;
      }
      setFeedbackLoading(true);
      matchService
        .getFeedback(token)
        .then((res) => {
          if (res?.feedbackAt) {
            setFeedbackSubmitted(true);
            setFeedbackAlreadyDone(true);
            localStorage.setItem(`after_feedback_${token}`, 'true');
          }
        })
        .catch(() => {})
        .finally(() => setFeedbackLoading(false));
    }
  }, [initialLoadDone, myAfterResponse, token]);

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

  // 피드백 제출 (에러 무시 — 백엔드 이슈로 거절 후 피드백 제출 시 9.007 발생 가능)
  const handleFeedbackSubmit = async (comment) => {
    setSubmitting(true);
    try {
      await matchService.submitFeedback(token, { rating: 5, comment });
    } catch {
      // 백엔드 이슈: 거절 후 피드백 제출 시 에러 발생 가능 — 무시
    }
    localStorage.setItem(`after_feedback_${token}`, 'true');
    setFeedbackSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>정보를 불러오는 중...</div>;

  if (error) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>알림</p>
            <p className={styles.respondedStatus}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (matchStatus !== 'completed') {
    let message = '에프터 응답은 미팅 완료 후 가능합니다.';
    if (matchStatus === 'cancelled') {
      message = '이 매칭은 종료되었습니다.';
    }
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>알림</p>
            <p className={styles.respondedStatus}>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (afterError) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>알림</p>
            <p className={styles.respondedStatus}>{afterError}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── 상태별 화면 분기 ──

  // 1. 아직 미응답 → 선택 페이지
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
    // 피드백 제출 완료
    if (feedbackAlreadyDone || feedbackSubmitted) {
      return (
        <div className={styles.page}>
          <PageHeader />
          <div className={styles.container}>
            <div className={styles.respondedBanner}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🌱</div>
              <p className={styles.respondedLabel}>피드백 감사합니다</p>
              <p className={styles.respondedStatus}>
                비록 이번 만남은 닿지 못했지만, 보내주신 피드백을 꼼꼼히 보고
                {myName ? ` ${myName} 님께` : ''} 더 좋은 매칭을 만들어 드리기 위해 노력할게요.
              </p>
              <p className={styles.respondedStatus} style={{ marginTop: '12px' }}>
                저희가{myName ? ` ${myName} 님의` : ''} 진가를 알아볼 분을 꼭 찾아낼게요.
              </p>
            </div>
          </div>
        </div>
      );
    }
    // 피드백 미제출 → 피드백 폼 표시
    return (
      <AfterFeedback
        submitted={false}
        onSubmit={handleFeedbackSubmit}
        submitting={submitting}
      />
    );
  }

  return null;
}
