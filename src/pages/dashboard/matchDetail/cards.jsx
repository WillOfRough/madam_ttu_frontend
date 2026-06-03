/* MatchDetail 하위 카드 컴포넌트 — 링크 카드, 참가자 카드, 가이드 메시지, 자동발송 이력, 지도 링크.
   MatchDetail.jsx 에서 분리. 동일한 MatchDetail.module.css 를 공유한다. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, Check, Link2, ChevronDown, ChevronUp, User, RefreshCw, Heart, FileText, Phone, Mail,
} from 'lucide-react';
import { toast } from '../../../store/toastStore';
import styles from '../MatchDetail.module.css';
import {
  generateProposalMessage, generateReminderMessage, generateAfterCompleteMessage,
  generateSchedulingMessage, generateAfterResultMessage, RESPONSE_MAP, formatDate,
  formatAutoSendTime,
} from './helpers';

export function AfterLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [msgCopiedKey, setMsgCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/after`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/after`;

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

  const handleMsgCopy = async (url, key) => {
    try {
      const msg = generateAfterCompleteMessage(url);
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
      <h3 className={styles.schedulingLinkTitle}><Heart size={16} /> 에프터 링크</h3>
      <p className={styles.schedulingLinkHint}>미팅 후 아래 링크를 각 회원에게 전달해주세요</p>
      <div className={styles.schedulingLinkRows}>
        {[
          { side: 'A', client: match.clientA, url: urlA },
          { side: 'B', client: match.clientB, url: urlB },
        ].map(({ side, client, url }) => (
          <div key={side} className={styles.schedulingLinkRow}>
            <div className={styles.schedulingLinkLabel}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span>{client.clientName} — 에프터 응답</span>
              {client.afterResponse === 'accepted' && <span className={styles.submittedBadge}>만나볼래요</span>}
              {client.afterResponse === 'rejected' && <span className={styles.rejectedSubmitBadge}>괜찮아요</span>}
              {(!client.afterResponse || client.afterResponse === 'pending') && <span className={styles.pendingSubmitBadge}>미응답</span>}
            </div>
            <div className={styles.schedulingLinkUrl}>
              <span className={styles.schedulingLinkValue}>{url}</span>
              <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(url, side)}>
                {copiedKey === side ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === side ? '복사됨' : '링크 복사'}
              </button>
              <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(url, side)}>
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

export function SchedulingLinkCard({ match }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const [msgCopiedKey, setMsgCopiedKey] = useState(null);

  const urlA = `${window.location.origin}/proposal/${match.clientA.proposalToken}/schedule`;
  const urlB = `${window.location.origin}/proposal/${match.clientB.proposalToken}/schedule`;

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
      const msg = generateSchedulingMessage(clientName, url);
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
      <h3 className={styles.schedulingLinkTitle}><Link2 size={16} /> 일정 조율 링크</h3>
      <p className={styles.schedulingLinkHint}>아래 링크를 각 회원에게 전달해주세요</p>
      <div className={styles.schedulingLinkRows}>
        {[
          { side: 'A', client: match.clientA, url: urlA },
          { side: 'B', client: match.clientB, url: urlB },
        ].map(({ side, client, url }) => (
          <div key={side} className={styles.schedulingLinkRow}>
            <div className={styles.schedulingLinkLabel}>
              <span className={styles.schedulingRoleBadge}>{side}</span>
              <span>{client.clientName} — 가용시간 등록</span>
              {client.availableTimesSubmitted && <span className={styles.submittedBadge}>등록 완료</span>}
              {client.availableTimesSubmitted === false && <span className={styles.pendingSubmitBadge}>미완료</span>}
            </div>
            <div className={styles.schedulingLinkUrl}>
              <span className={styles.schedulingLinkValue}>{url}</span>
              <button className={styles.schedulingCopyBtn} onClick={() => handleCopy(url, side)}>
                {copiedKey === side ? <Check size={13} /> : <Copy size={13} />}
                {copiedKey === side ? '복사됨' : '링크 복사'}
              </button>
              <button className={styles.schedulingCopyBtn} onClick={() => handleMsgCopy(url, client.clientNickname || client.clientName, side)}>
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

export function ParticipantCard({ participant, partner, label, matchStatus, side }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const isProposalPhase = matchStatus === 'proposal_sent' || matchStatus === 'proposal_accepted';
  const [tokenOpen, setTokenOpen] = useState(isProposalPhase);

  const proposalUrl = `${window.location.origin}/proposal/${participant.proposalToken}`;
  const inquiryUrl = `${window.location.origin}/inquiry?id=${participant.clientId}`;
  const isLinkActive = side === 'A' || matchStatus !== 'proposal_sent';

  const handleCopy = async () => {
    if (!isLinkActive) return;
    try {
      await navigator.clipboard.writeText(proposalUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleMsgCopy = async () => {
    if (!isLinkActive) return;
    try {
      const msg = generateProposalMessage(participant.clientNickname || participant.clientName, proposalUrl, inquiryUrl);
      await navigator.clipboard.writeText(msg);
      setMsgCopied(true);
      toast.success('안내 메시지가 복사되었습니다.');
      setTimeout(() => setMsgCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handleReminderCopy = async () => {
    if (!isLinkActive) return;
    try {
      const clientName = participant.clientNickname || participant.clientName;
      const partnerName = partner.clientNickname || partner.clientName;
      const msg = generateReminderMessage(clientName, partnerName, proposalUrl);
      await navigator.clipboard.writeText(msg);
      setReminderCopied(true);
      toast.success('리마인드 메시지가 복사되었습니다.');
      setTimeout(() => setReminderCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const handlePhoneCopy = async () => {
    const phone = participant.clientPhone;
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setPhoneCopied(true);
      toast.success('번호가 복사되었습니다.');
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다.');
    }
  };

  const responseInfo = participant.response && participant.response !== 'pending'
    ? RESPONSE_MAP[participant.response] || { label: participant.response, className: '' }
    : null;

  let statusText = null;
  if (matchStatus === 'proposal_sent') {
    statusText = side === 'A' ? '프로필 확인 대기' : 'A 확인 후 전달 예정';
  } else if (matchStatus === 'proposal_accepted') {
    statusText = side === 'A' ? null : '프로필 확인 대기';
  }

  const hasProfile = participant.clientAge || participant.clientOccupation || participant.clientLocation;
  const photos = participant.clientPhotoUrls || [];

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
      </div>

      <div className={styles.participantBody}>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>담당 매니저</span>
          <span className={styles.fieldValue}>{participant.managerName}</span>
        </div>
        <div className={styles.participantField}>
          <span className={styles.fieldLabel}>응답 상태</span>
          {responseInfo ? (
            <span className={styles[responseInfo.className]}>{responseInfo.label}</span>
          ) : statusText ? (
            <span className={styles.responseWaiting}>{statusText}</span>
          ) : (
            <span className={styles.responseWaiting}>대기 중</span>
          )}
        </div>
        {participant.respondedAt && (
          <div className={styles.participantField}>
            <span className={styles.fieldLabel}>응답 시각</span>
            <span className={styles.fieldValue}>{formatDate(participant.respondedAt)}</span>
          </div>
        )}
      </div>

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
                {participant.clientAge && (
                  <div className={styles.profileFieldItem}>
                    <span className={styles.profileFieldLabel}>나이</span>
                    <span className={styles.profileFieldValue}>{participant.clientAge}세</span>
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

      {matchStatus !== 'draft' && (
        <div className={styles.tokenSection}>
          <button className={styles.tokenToggle} onClick={() => setTokenOpen(!tokenOpen)}>
            <Link2 size={13} />
            <span>프로포절 링크</span>
            {tokenOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {tokenOpen && (
            isLinkActive ? (
              <>
                <div className={styles.tokenRow}>
                  <span className={styles.tokenValue}>{proposalUrl}</span>
                  <button className={styles.copyBtn} onClick={handleCopy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className={styles.msgCopyBtnRow}>
                  <button className={styles.msgCopyBtn} onClick={handleMsgCopy}>
                    <FileText size={13} />
                    {msgCopied ? '복사됨' : '안내 메시지 복사'}
                  </button>
                  <button className={styles.msgCopyBtn} onClick={handleReminderCopy}>
                    <RefreshCw size={13} />
                    {reminderCopied ? '복사됨' : '리마인드 복사'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.tokenInactive}>A 수락 후 활성화</div>
            )
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
