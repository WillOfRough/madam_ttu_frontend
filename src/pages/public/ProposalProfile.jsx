import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import * as matchService from '../../api/matchService';
import ConfirmModal from './ConfirmModal';
import styles from './Proposal.module.css';

const OATH_ITEMS = [
  '프로필 정보를 캡처·녹화·저장·인쇄하거나 SNS·메신저·단체방에 공유하지 않겠습니다.',
  '사진·연락처·직장·거주지 등 개인정보를 외부에 노출하거나 신원 검색·조회에 사용하지 않겠습니다.',
  '본인 외 제3자와 함께 열람하거나 대신 의견을 구하지 않겠습니다.',
  '매칭 진행 외 목적(영업·홍보·사적 연락 시도 등)으로 정보를 사용하지 않겠습니다.',
  '상대방을 존중하며 비방·차별·성희롱 등 부적절한 언행을 하지 않겠습니다.',
  '위반 시 서비스 이용이 영구 제한될 수 있으며, 관련 법령에 따라 민·형사상 책임이 따를 수 있음을 이해합니다.',
];

export default function ProposalProfile() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState(null); // 'accept' | 'reject' | null
  const [rejectComment, setRejectComment] = useState(''); // 거절 사유 피드백(선택)
  const [rejectResult, setRejectResult] = useState(null); // 거절 완료 시 { hasComment } — 완료 화면 표시

  // Oath
  const [oathAgreed, setOathAgreed] = useState(false);
  const [oathPassed, setOathPassed] = useState(false);

  // After status (completed 상태에서 에프터 확정 여부)
  const [afterFinalized, setAfterFinalized] = useState(false);

  useEffect(() => {
    matchService
      .getProposal(token)
      .then((res) => {
        setData(res);
        // completed 상태면 에프터 확정 여부 확인
        if (res.matchStatus === 'completed') {
          return matchService.getAfterStatus(token).then((afterRes) => {
            if (afterRes.afterStatus === 'accepted' || afterRes.afterStatus === 'rejected') {
              setAfterFinalized(true);
            }
          }).catch(() => {});
        }
      })
      .catch((err) => {
        const code = err.body?.error;
        if (code === '9.014') {
          setError('이 매칭은 종료되었습니다.');
        } else {
          setError(err.message || '프로포절을 불러올 수 없습니다.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async (response, feedbackComment) => {
    setSubmitting(true);
    try {
      const result = await matchService.respondProposal(token, response, { feedbackComment });
      setResponseMessage(result.message || '응답이 완료되었습니다.');
      if (response === 'rejected') {
        setRejectResult({ hasComment: !!(feedbackComment && feedbackComment.trim()) });
      }
      const updated = await matchService.getProposal(token).catch(() => null);
      if (updated) setData(updated);
      else setData((d) => ({ ...d, myResponse: response }));
    } catch (err) {
      setError(err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>프로포절을 불러오는 중...</div>;
  if (error && !data) {
    if (error.includes('만료') || error.includes('취소') || error.includes('종료')) {
      return (
        <div className={styles.page}>
          <PageHeader />
          <div className={styles.container}>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>만료된 링크입니다</p>
              <p className={styles.respondedStatus}>이 매칭은 종료되었습니다.</p>
            </div>
          </div>
        </div>
      );
    }
    return <div className={styles.errorPage}><p>{error}</p></div>;
  }
  if (!data) return <div className={styles.errorPage}><p>프로필 정보를 찾을 수 없습니다.</p></div>;

  const { myName, myRole, myResponse, matchStatus, counterpart: cp } = data;
  const responded = myResponse !== 'pending';

  // 거절 응답 직후 — 만료 화면 대신 따뜻한 완료 화면 (애프터 피드백 흐름과 동일 톤)
  if (rejectResult) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🌱</div>
            <p className={styles.respondedLabel}>
              {rejectResult.hasComment ? '피드백 감사합니다' : '응답이 완료되었습니다'}
            </p>
            <p className={styles.respondedStatus}>
              {rejectResult.hasComment
                ? '솔직한 의견 감사합니다. 보내주신 피드백을 꼼꼼히 살펴 다음엔 더 잘 맞는 분을 소개해 드릴게요.'
                : '응답해 주셔서 감사합니다. 다음엔 더 잘 맞는 분을 소개해 드릴게요.'}
            </p>
            {myName && (
              <p className={styles.respondedStatus} style={{ marginTop: 12 }}>
                저희가 {myName} 님의 진가를 알아볼 분을 꼭 찾아낼게요.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 만료 체크: 취소됨 또는 에프터 확정(성사/미성사)
  if (matchStatus === 'cancelled' || afterFinalized) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>만료된 링크입니다</p>
            <p className={styles.respondedStatus}>이 매칭은 종료되었습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  // 거절한 경우 — 만료 화면
  if (myResponse === 'rejected') {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>만료된 링크입니다</p>
            <p className={styles.respondedStatus}>이 매칭은 종료되었습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cp) {
    return (
      <div className={styles.errorPage}>
        <p>프로필 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // ── Oath Screen ──
  if (!oathPassed) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.oathCard}>
            <div className={styles.oathIcon}>
              <Lock size={26} />
            </div>
            <h2 className={styles.oathTitle}>소중한 정보입니다</h2>
            <p className={styles.oathSubtitle}>프로필 열람 전 서약이 필요합니다</p>
            <div className={styles.oathItems}>
              {OATH_ITEMS.map((text, idx) => (
                <div key={idx} className={styles.oathItem}>
                  <span className={styles.oathNum}>{idx + 1}.</span>
                  <span className={styles.oathText}>{text}</span>
                </div>
              ))}
            </div>
            <label className={styles.agreeLabel}>
              <input
                type="checkbox"
                checked={oathAgreed}
                onChange={(e) => setOathAgreed(e.target.checked)}
                className={styles.checkbox}
              />
              <span>위 내용을 숙지했으며 서약합니다.</span>
            </label>
            <button
              className={styles.oathBtn}
              onClick={() => setOathPassed(true)}
              disabled={!oathAgreed}
            >
              동의하고 프로필 확인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 응답 배너 ──
  let respondedBanner = null;
  if (responded) {
    const label = myResponse === 'accepted' ? '수락 완료' : '응답 완료';
    let statusMsg = responseMessage || '다음 단계를 준비하고 있습니다.';
    if (matchStatus === 'proposal_sent') {
      statusMsg = '상대방 프로필 확인 대기 중입니다.';
    } else if (matchStatus === 'proposal_accepted') {
      statusMsg = '상대방의 선택을 기다리고 있어요. 조금만 기다려주세요!';
    } else if (matchStatus === 'awaiting_payment') {
      statusMsg = '입금 확인 후 일정 조율이 시작됩니다.';
    } else if (matchStatus === 'scheduling' || matchStatus === 'arranging') {
      statusMsg = '일정 조율이 진행 중입니다.';
    } else if (matchStatus === 'scheduled') {
      statusMsg = '약속이 확정되었습니다. 매니저 안내를 확인해주세요.';
    } else if (matchStatus === 'completed') {
      statusMsg = '미팅이 완료되었습니다.';
    }
    respondedBanner = (
      <div className={styles.respondedBanner}>
        <p className={styles.respondedLabel}>{label}</p>
        <p className={styles.respondedStatus}>{statusMsg}</p>
      </div>
    );
  }

  // ── 프로필 필드 ──
  const fields = [
    { label: '닉네임', value: cp.nickname },
    { label: '나이', value: cp.age ? `${cp.age}세` : null },
    { label: '키', value: cp.height ? `${cp.height}cm` : null },
    { label: '직업', value: cp.occupation },
    { label: '회사', value: cp.company },
    { label: '거주지', value: cp.location },
    { label: '직장 위치', value: cp.workLocation },
    { label: 'MBTI', value: cp.mbti },
    { label: '취미', value: cp.hobbies },
  ].filter((f) => f.value);

  let contextMessage = null;
  if ((matchStatus === 'proposal_sent' && myRole === 'proposer') ||
      (matchStatus === 'proposal_accepted' && myRole === 'receiver')) {
    contextMessage = '상대방 프로필을 확인하고 수락/거절해주세요.';
  }

  return (
    <div className={styles.page}>
      <PageHeader />
      <div className={styles.container}>
        {/* Title block */}
        <div className={styles.pageTitleBlock}>
          <div className={`${styles.progressBadge} ${styles.lilac}`}>
            <span className={styles.progressBadgeDot} />
            매칭 제안
          </div>
          {cp.nickname && (
            <h1 className={styles.pageTitle}>{cp.nickname}님의 프로필</h1>
          )}
          {myName && (
            <p className={styles.pageSubtitle}>{myName}님, 아래 프로필을 확인해주세요.</p>
          )}
          {contextMessage && (
            <p className={styles.pageSubtitle} style={{ marginTop: 4 }}>{contextMessage}</p>
          )}
        </div>

        {respondedBanner}

        {/* Photos */}
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

        {/* Basic info */}
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

        {/* Introduction */}
        {cp.introduction && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>자기소개</h3>
            <p className={styles.text}>{cp.introduction}</p>
          </div>
        )}

        {/* Action buttons */}
        {!responded && (
          <>
            <p className={styles.cautionNote}>
              매칭 후 취소는 상대방에게 큰 상처가 될 수 있습니다. 신중하게 선택해주세요.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.rejectBtn}
                onClick={() => setConfirmModal('reject')}
                disabled={submitting}
              >
                정중히 거절할게요
              </button>
              <button
                className={styles.acceptBtn}
                onClick={() => setConfirmModal('accept')}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : '만나볼래요!'}
              </button>
            </div>
          </>
        )}

        {error && data && (
          <div className={styles.errorPage} style={{ minHeight: 'auto', padding: '12px 0' }}>
            <p>{error}</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmModal === 'accept'}
        variant="accept"
        title="상대방과 만나보시겠어요?"
        message="수락하시면 매칭이 다음 단계로 진행됩니다."
        confirmLabel="네, 만나볼래요!"
        onConfirm={() => { setConfirmModal(null); handleRespond('accepted'); }}
        onCancel={() => setConfirmModal(null)}
      />
      <ConfirmModal
        open={confirmModal === 'reject'}
        variant="reject"
        title="이번 매칭 제안을 거절하시겠어요?"
        message="거절하시면 이번 매칭은 취소되며, 다시 연결되지 않습니다."
        confirmLabel="네, 거절할게요"
        warningText="확인 후에는 거절을 취소할 수 없습니다"
        commentValue={rejectComment}
        onCommentChange={setRejectComment}
        commentLabel={(
          <>
            <span className={styles.confirmCommentOptional}>선택</span>
            솔직한 거절 이유를 알려주세요. 자세히 적어주실수록 매니저가 꼼꼼히 분석해{' '}
            <span className={styles.confirmCommentHighlight}>다음번엔 마음에 쏙 드는 분</span>을 찾아드릴게요. 📝
          </>
        )}
        commentPlaceholder="예) 취미나 가치관이 저와 조금 맞지 않는 것 같아요. / 프로필 사진의 스타일이 제 이상형과 거리가 있어요."
        commentNote={(
          <>
            <span aria-hidden="true">🔒</span>
            <span>피드백은 담당 매니저만 확인하며, 상대방에게는 공개되지 않아요.</span>
          </>
        )}
        commentMaxLength={1000}
        onConfirm={() => { setConfirmModal(null); handleRespond('rejected', rejectComment); }}
        onCancel={() => { setConfirmModal(null); setRejectComment(''); }}
      />
    </div>
  );
}

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
