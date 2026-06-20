/* MatchDetail 하위 카드 컴포넌트 — 링크 카드, 참가자 카드, 가이드 메시지, 자동발송 이력, 지도 링크.
   MatchDetail.jsx 에서 분리. 동일한 MatchDetail.module.css 를 공유한다. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, Check, Link2, ChevronDown, ChevronUp, User, RefreshCw, Heart, FileText, Phone, Mail,
} from 'lucide-react';
import { toast } from '../../../store/toastStore';
import { birthYearLabelFromDate } from '../../../utils/age';
import styles from '../MatchDetail.module.css';
import {
  generateProposalMessage, generateReminderMessage, generateAfterCompleteMessage,
  generateSchedulingMessage, generateAfterResultMessage, RESPONSE_MAP, formatDate,
  formatAutoSendTime,
} from './helpers';

export function AfterResultLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [msgCopiedKey, setMsgCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/after/result`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/after/result`;
  const bothResponded = match.afterStatus === 'accepted' || match.afterStatus === 'rejected';

  const handleCopy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleMsgCopy = async (url, clientName, key) => {
    try {
      const msg = generateAfterResultMessage(clientName, url, match.afterStatus);
      await navigator.clipboard.writeText(msg);
      setMsgCopiedKey(key);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setMsgCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.schedulingLinkCard}>
      <h3 className={styles.schedulingLinkTitle}><Heart size={16} /> 만남 성사 결과 링크</h3>
      <p className={styles.schedulingLinkHint}>
        {bothResponded ? '에프터 응답이 완료되었습니다. 아래 링크로 결과를 전달해주세요' : '양쪽 에프터 응답 완료 후 결과 링크를 전달해주세요'}
      </p>
      <div className={styles.schedulingLinkRows}>
        {[
          { side: 'A', client: match.clientA, url: urlA },
          { side: 'B', client: match.clientB, url: urlB },
        ].map(({ side, client, url }) => (
          <div key={side} className={styles.schedulingLinkRow}>
            <div className={styles.schedulingLinkLabel}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span>{client.clientName} — 결과 확인</span>
            </div>
            <div className={styles.schedulingLinkUrl}>
              <span className={styles.schedulingLinkValue}>{url}</span>
              <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(url, side)} disabled={!bothResponded}>
                {copiedKey === side ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === side ? '복사됨' : '링크 복사'}
              </button>
              <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(url, client.clientNickname || client.clientName, side)} disabled={!bothResponded}>
                {msgCopiedKey === side ? <Check size={13} /> : <FileText size={13} />}
                {msgCopiedKey === side ? '복사됨' : '안내 메시지 복사'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ParticipantCard — 단계 적응형 단일 회원 뷰.
   3탭(프로필/응답/링크)을 대체한다. 단계에 따라
   · 상태 배지(제안 응답 / 가용시간 제출 / 에프터 응답 …)
   · per-member 액션 링크(프로포절 / 일정 / 에프터 + 안내문자)
   · 거절·에프터 미성사 피드백
   를 한 카드에서 보여주고, 프로필 상세는 접이식으로 둔다.
───────────────────────────────────────────────────────────── */
export function ParticipantCard({ match, side, label }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false); // 원문 URL은 기본 접힘 — 복사 버튼은 상시 노출(P6)

  const participant = side === 'A' ? match.clientA : match.clientB;
  const partner = side === 'A' ? match.clientB : match.clientA;
  const status = match.status;
  const origin = window.location.origin;
  const token = participant.proposalToken;
  const displayName = participant.clientNickname || participant.clientName;

  const copyTo = async (text, setFlag, okMsg) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      toast.success(okMsg);
      setTimeout(() => setFlag(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handlePhoneCopy = () => {
    if (!participant.clientPhone) return;
    copyTo(participant.clientPhone, setPhoneCopied, '번호가 복사되었습니다.');
  };

  // ── 단계별 per-member 액션 링크 (제안/일정/에프터) ──
  const linkConfig = (() => {
    if (status === 'proposal_sent' || status === 'proposal_accepted') {
      const url = `${origin}/proposal/${token}`;
      return {
        label: '프로포절 링크',
        url,
        makeMsg: () => generateProposalMessage(displayName, url, `${origin}/inquiry?id=${participant.clientId}`),
        makeReminder: () => generateReminderMessage(displayName, partner.clientNickname || partner.clientName, url),
        // 제안 발송 단계에서 B 링크는 A 수락 후에야 활성화한다.
        active: side === 'A' || status !== 'proposal_sent',
      };
    }
    if (status === 'scheduling') {
      const url = `${origin}/proposal/${token}/schedule`;
      return { label: '일정 등록 링크', url, makeMsg: () => generateSchedulingMessage(displayName, url), active: true };
    }
    if (status === 'completed') {
      // 이미 에프터에 응답한 회원에겐 응답 링크를 숨긴다(재전송 무의미). 미응답자만 노출.
      if (participant.afterResponse && participant.afterResponse !== 'pending') return null;
      const url = `${origin}/proposal/${token}/after`;
      return { label: '에프터 응답 링크', url, makeMsg: () => generateAfterCompleteMessage(url), active: true };
    }
    return null;
  })();

  // ── 가용시간 제출 현황 ──
  const submittedCount = (match.availableTimes || []).filter((t) => t.clientId === participant.clientId).length;
  const submitted = participant.availableTimesSubmitted === true || submittedCount > 0;

  // ── 단계별 상태 배지 ──
  const respChip = (r) =>
    r === 'accepted'
      ? <span className={styles.responseAccepted}>수락</span>
      : r === 'rejected'
      ? <span className={styles.responseRejected}>거절</span>
      : <span className={styles.responseWaiting}>대기 중</span>;

  const renderStatus = () => {
    const resp = participant.response;
    switch (status) {
      case 'draft':
        return <span className={styles.responseWaiting}>시작 전</span>;
      case 'proposal_sent':
        return side === 'A'
          ? (resp && resp !== 'pending' ? respChip(resp) : <span className={styles.responseWaiting}>프로필 확인 대기</span>)
          : <span className={styles.responseWaiting}>A 확인 후 전달 예정</span>;
      case 'proposal_accepted':
        return side === 'A'
          ? (resp && resp !== 'pending' ? respChip(resp) : <span className={styles.responseWaiting}>응답 대기</span>)
          : (resp && resp !== 'pending' ? respChip(resp) : <span className={styles.responseWaiting}>프로필 확인 대기</span>);
      case 'awaiting_payment': {
        // 입금 단계: 직전 '수락' 대신 회원별 입금 상태를 노출 (히어로 슬롯과 별개 글랜스).
        const pay = match.paymentSummary?.[`client${side}`];
        const ps = pay?.status;
        if (ps === 'paid' || ps === 'confirmed' || pay?.amount === 0)
          return <span className={styles.submittedBadge}>입금 완료</span>;
        if (ps === 'partial_refunded') return <span className={styles.responseRejected}>부분환불</span>;
        if (ps === 'refunded') return <span className={styles.responseRejected}>환불완료</span>;
        return <span className={styles.pendingSubmitBadge}>입금 대기</span>;
      }
      case 'scheduling':
      case 'arranging':
        return submitted
          ? <span className={styles.submittedBadge}>가용시간{submittedCount > 0 ? ` ${submittedCount}개` : ''} 제출</span>
          : <span className={styles.pendingSubmitBadge}>가용시간 미제출</span>;
      case 'scheduled':
        return <span className={styles.submittedBadge}>약속 확정</span>;
      case 'completed': {
        const a = participant.afterResponse;
        if (a === 'accepted') return <span className={styles.afterResp_accepted}>만나볼래요</span>;
        if (a === 'rejected') return <span className={styles.afterResp_rejected}>괜찮아요</span>;
        return <span className={styles.afterResp_pending}>에프터 미응답</span>;
      }
      case 'cancelled':
        return resp === 'rejected'
          ? <span className={styles.responseRejected}>거절</span>
          : resp === 'accepted'
          ? <span className={styles.responseAccepted}>수락</span>
          : <span className={styles.responseWaiting}>미응답</span>;
      default:
        return null;
    }
  };

  const showRejectFeedback = status === 'cancelled' && participant.response === 'rejected' && participant.feedbackAt;
  const showAfterFeedback = status === 'completed' && participant.afterResponse === 'rejected' && participant.feedbackAt;

  if (participant.deleted) {
    return (
      <div className={styles.participantCard}>
        <div className={styles.participantHeader}>
          <span className={styles.participantNameDeleted}>삭제된 회원</span>
          <span className={styles.participantLabel}>{label}</span>
        </div>
        <div className={styles.participantBody}>
          <div className={styles.deletedNotice}>이 회원의 정보는 삭제되었습니다.</div>
          {participant.response && participant.response !== 'pending' && (
            <div className={styles.participantField}>
              <span className={styles.fieldLabel}>응답 상태</span>
              <span className={styles[RESPONSE_MAP[participant.response]?.className || '']}>
                {RESPONSE_MAP[participant.response]?.label || participant.response}
              </span>
            </div>
          )}
          {participant.respondedAt && (
            <div className={styles.participantField}>
              <span className={styles.fieldLabel}>응답 시각</span>
              <span className={styles.fieldValue}>{formatDate(participant.respondedAt)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasProfile = participant.clientBirthDate || participant.clientOccupation || participant.clientLocation;
  const photos = participant.clientPhotoUrls || [];

  return (
    <div className={styles.participantCard}>
      <div className={styles.participantHeader}>
        <span
          className={styles.participantName}
          onClick={() => navigate(`/dashboard/clients/${participant.clientId}`)}
          style={{ cursor: 'pointer' }}
        >
          {participant.clientName}
          {participant.clientNickname && <span className={styles.participantNickname}>{participant.clientNickname}</span>}
        </span>
        <span className={styles.participantLabel}>{label}</span>
        <span className={participant.clientGender === 'female' ? styles.participantGenderFemale : styles.participantGenderMale}>
          {participant.clientGender === 'female' ? '여' : '남'}
        </span>
        {/* 완료 단계는 상단 '에프터 결과' 스트립이 A/B 상태를 담당 → 카드 배지 생략(P5) */}
        {status !== 'completed' && (
          <span className={styles.participantHeaderStatus}>{renderStatus()}</span>
        )}
      </div>

      <div className={styles.participantBody}>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>담당 매니저</span>
          <span className={styles.fieldValue}>{participant.managerName || '-'}</span>
        </div>
        {participant.respondedAt && (
          <div className={styles.participantField}>
            <span className={styles.fieldLabel}>응답 시각</span>
            <span className={styles.fieldValue}>{formatDate(participant.respondedAt)}</span>
          </div>
        )}
      </div>

      {/* 거절 / 에프터 미성사 피드백 */}
      {showRejectFeedback && (
        <div className={styles.participantFeedback}>
          {participant.feedbackComment
            ? <p className={styles.feedbackCommentText}>&ldquo;{participant.feedbackComment}&rdquo;</p>
            : <p className={styles.feedbackDateText}>코멘트 없이 거절했습니다.</p>}
          <p className={styles.feedbackDateText}>{formatDate(participant.feedbackAt)}</p>
        </div>
      )}
      {showAfterFeedback && (
        <div className={`${styles.participantFeedback} ${styles.participantFeedbackAfter}`}>
          {participant.feedbackComment
            ? <p className={styles.feedbackCommentText}>&ldquo;{participant.feedbackComment}&rdquo;</p>
            : <p className={styles.feedbackDateText}>코멘트 없이 마무리했습니다.</p>}
          <p className={styles.feedbackDateText}>{formatDate(participant.feedbackAt)}</p>
        </div>
      )}

      {participant.clientPhone && (
        <div className={styles.phoneQuickRow}>
          <Phone size={13} />
          <span className={styles.phoneQuickValue}>{participant.clientPhone}</span>
          <button className={styles.phoneQuickCopyBtn} onClick={handlePhoneCopy}>
            {phoneCopied ? <Check size={12} /> : <Copy size={12} />}
            {phoneCopied ? '복사됨' : '복사'}
          </button>
        </div>
      )}

      {hasProfile && (
        <>
          <button className={styles.profileToggle} onClick={() => setProfileOpen(!profileOpen)}>
            <User size={14} />
            {profileOpen ? '프로필 접기' : '프로필 상세 보기'}
            {profileOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {profileOpen && (
            <div className={styles.profileDetail}>
              {photos.length > 0 && (
                <div className={styles.profilePhotos}>
                  {photos.map((url, i) => (
                    <img key={i} src={url} alt="" className={styles.profilePhoto} />
                  ))}
                </div>
              )}
              <div className={styles.profileFields}>
                {participant.clientBirthDate && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>출생연도</span>
                    <span className={styles.profileFieldValue}>{birthYearLabelFromDate(participant.clientBirthDate)}</span>
                  </div>
                )}
                {participant.clientHeight && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>키</span>
                    <span className={styles.profileFieldValue}>{participant.clientHeight}cm</span>
                  </div>
                )}
                {participant.clientOccupation && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>직업</span>
                    <span className={styles.profileFieldValue}>{participant.clientOccupation}</span>
                  </div>
                )}
                {participant.clientCompany && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>회사</span>
                    <span className={styles.profileFieldValue}>{participant.clientCompany}</span>
                  </div>
                )}
                {participant.clientEducation && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>학력</span>
                    <span className={styles.profileFieldValue}>{participant.clientEducation}</span>
                  </div>
                )}
                {participant.clientLocation && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>거주지</span>
                    <span className={styles.profileFieldValue}>{participant.clientLocation}</span>
                  </div>
                )}
                {participant.clientMbti && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>MBTI</span>
                    <span className={styles.profileFieldValue}>{participant.clientMbti}</span>
                  </div>
                )}
                {participant.clientHobbies && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>취미</span>
                    <span className={styles.profileFieldValue}>{participant.clientHobbies}</span>
                  </div>
                )}
                {participant.clientReligion && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>종교</span>
                    <span className={styles.profileFieldValue}>{participant.clientReligion}</span>
                  </div>
                )}
              </div>
              {participant.clientPhone && (
                <div className={styles.phoneSection}>
                  <span className={styles.profileFieldLabel}><Phone size={12} /> 연락처</span>
                  <div className={styles.phoneRow}>
                    <span className={styles.phoneValue}>{participant.clientPhone}</span>
                    <button className={styles.phoneCopyBtn} onClick={handlePhoneCopy}>
                      {phoneCopied ? <Check size={12} /> : <Copy size={12} />}
                      {phoneCopied ? '복사됨' : '번호 복사'}
                    </button>
                  </div>
                </div>
              )}
              {participant.clientIntroduction && (
                <div className={styles.profileTextSection}>
                  <span className={styles.profileTextLabel}>자기소개</span>
                  <p className={styles.profileTextContent}>{participant.clientIntroduction}</p>
                </div>
              )}
              {participant.clientIdealType && (
                <div className={styles.profileTextSection}>
                  <span className={styles.profileTextLabel}>이상형</span>
                  <p className={styles.profileTextContent}>{participant.clientIdealType}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── 단계별 액션 링크 (제안/일정/에프터) — 복사 버튼 상시 노출, 원문 URL은 접기(P6) ── */}
      {linkConfig && (
        <div className={styles.tokenSection}>
          {linkConfig.active ? (
            <>
              <div className={styles.linkActionHead}>
                <span className={styles.linkActionLabel}><Link2 size={13} /> {linkConfig.label}</span>
                <button className={styles.linkRevealBtn} onClick={() => setLinkOpen(!linkOpen)}>
                  {linkOpen ? '링크 숨기기' : '링크 보기'}
                  {linkOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
              {linkOpen && (
                <div className={styles.tokenRow}>
                  <span className={styles.tokenValue}>{linkConfig.url}</span>
                </div>
              )}
              <div className={styles.msgCopyBtnRow}>
                <button className={styles.msgCopyBtn} onClick={() => copyTo(linkConfig.url, setCopied, '링크가 복사되었습니다.')}>
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? '복사됨' : '링크 복사'}
                </button>
                <button className={styles.msgCopyBtn} onClick={() => copyTo(linkConfig.makeMsg(), setMsgCopied, '안내 메시지가 복사되었습니다.')}>
                  <FileText size={13} />
                  {msgCopied ? '복사됨' : '안내 메시지'}
                </button>
                {linkConfig.makeReminder && (
                  <button className={styles.msgCopyBtn} onClick={() => copyTo(linkConfig.makeReminder(), setReminderCopied, '리마인드 메시지가 복사되었습니다.')}>
                    <RefreshCw size={13} />
                    {reminderCopied ? '복사됨' : '리마인드'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.linkActionHead}>
              <span className={styles.linkActionLabel}><Link2 size={13} /> {linkConfig.label}</span>
              <span className={styles.tokenInactive}>A 수락 후 활성화</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function GuideMessageCard({ title, hint, badge, participants, generateMsg }) {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = async (participant, key) => {
    try {
      const msg = generateMsg(participant);
      await navigator.clipboard.writeText(msg);
      setCopiedKey(key);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.guideMessageCard}>
      <h3 className={styles.guideMessageTitle}>
        <FileText size={16} /> {title}
        <span className={styles.guideBadge}>{badge}</span>
      </h3>
      <p className={styles.guideMessageHint}>{hint}</p>
      <div className={styles.guideMessageRows}>
        {participants.map((p, idx) => {
          const side = idx === 0 ? 'A' : 'B';
          const isCopied = copiedKey === side;
          return (
            <div key={side} className={styles.guideMessageRow}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span className={styles.guideMessageClientName}>{p.clientName}</span>
              <button className={styles.msgCopyBtn} onClick={() => handleCopy(p, side)}>
                {isCopied ? <Check size={13} /> : <FileText size={13} />}
                {isCopied ? '복사됨' : '안내 메시지 복사'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AutoSendHistoryCard({ history }) {
  const sentList = (history || []).filter((e) => e.sent && e.sentAt);
  if (sentList.length === 0) return null;

  const sorted = [...sentList].sort((a, b) => {
    const ta = new Date(a.sentAt).getTime();
    const tb = new Date(b.sentAt).getTime();
    return tb - ta;
  });

  return (
    <div className={styles.autoSendHistoryCard}>
      <div className={styles.autoSendHistoryHeader}>
        <span className={styles.autoSendHistoryIcon}><Mail size={12} /></span>
        <span className={styles.autoSendHistoryTitle}>자동 발송 히스토리</span>
        <span className={styles.autoSendHistoryCount}>{sorted.length}건</span>
      </div>
      <ul className={styles.autoSendHistoryList}>
        {sorted.map((e) => (
          <li key={e.stepKey} className={styles.autoSendHistoryItem}>
            <span className={styles.autoSendHistoryTime}>{formatAutoSendTime(e.sentAt)}</span>
            <span className={styles.autoSendHistoryBadge}>자동발송</span>
            <span className={styles.autoSendHistoryText}>
              <strong>{e.recipients.join(', ')}</strong>에게 &lsquo;{e.label}&rsquo; 자동 문자 발송 완료
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MapLinks({ address }) {
  const encoded = encodeURIComponent(address);
  const naverUrl = `https://map.naver.com/v5/search/${encoded}`;
  const kakaoUrl = `https://map.kakao.com/?q=${encoded}`;
  return (
    <span className={styles.mapLinks}>
      <a href={naverUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>N</a>
      <a href={kakaoUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>K</a>
    </span>
  );
}
