import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import * as matchService from '../../api/matchService';
import ConfirmModal from './ConfirmModal';
import styles from './Proposal.module.css';

const OATH_ITEMS = [
  '프로필 정보를 캡처, 저장, 제3자에게 공유하지 않겠습니다.',
  '위반 시 서비스 이용이 영구 제한될 수 있음을 이해합니다.',
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

  const handleRespond = async (response) => {
    setSubmitting(true);
    try {
      const result = await matchService.respondProposal(token, response);
      setResponseMessage(result.message || '응답이 완료되었습니다.');
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
    if (error.includes('만료') || error.includes('취소')) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>Knots & Links</h1>
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

  // 만료 체크: 취소됨 또는 에프터 확정(성사/미성사)
  if (matchStatus === 'cancelled' || afterFinalized) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
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
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
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

  // Oath Screen
  if (!oathPassed) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>Knots & Links</h1>
          <div className={styles.oathCard}>
            <div className={styles.oathIcon}>
              <Lock size={32} />
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

  // 응답 배너 (이미 응답한 경우 프로필 위에 표시)
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

  // 프로필 필드
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
      <div className={styles.container}>
        <h1 className={styles.logo}>Knots & Links</h1>
        <p className={styles.subtitle}>당신을 위한 매칭 제안</p>
        {cp.nickname && (
          <h2 className={styles.counterpartName}>{cp.nickname}</h2>
        )}
        {myName && (
          <p className={styles.greeting}>{myName}님, 아래 프로필을 확인해주세요.</p>
        )}
        {contextMessage && <p className={styles.scheduleDesc}>{contextMessage}</p>}
        {respondedBanner}

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

        {cp.introduction && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>자기소개</h3>
            <p className={styles.text}>{cp.introduction}</p>
          </div>
        )}

        {!responded && (
          <>
            <div className={styles.cautionNote}>
              매칭 후 취소는 상대방에게 큰 상처가 될 수 있습니다. 신중하게 선택해주세요.
            </div>
            <div className={styles.actions}>
              <button
                className={styles.acceptBtn}
                onClick={() => setConfirmModal('accept')}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : '만나볼래요!'}
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => setConfirmModal('reject')}
                disabled={submitting}
              >
                정중히 거절할게요
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
        title="정말 거절하시겠어요?"
        message="거절하시면 이번 매칭은 성사되지 않습니다."
        confirmLabel="네, 거절할게요"
        onConfirm={() => { setConfirmModal(null); handleRespond('rejected'); }}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
