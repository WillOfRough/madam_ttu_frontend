import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import * as matchService from '../../api/matchService';
import styles from './Proposal.module.css';

const OATH_ITEMS = [
  '프로필 정보를 캡처, 저장, 제3자에게 공유하지 않겠습니다.',
  '위반 시 서비스 이용이 영구 제한될 수 있음을 이해합니다.',
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

function generateDateRange() {
  const dates = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateLabel(date) {
  return `${date.getMonth() + 1}/${date.getDate()} (${DAY_NAMES[date.getDay()]})`;
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTimeDisplay(slot) {
  const d = new Date(slot.date + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()} (${DAY_NAMES[d.getDay()]}) ${slot.startTime.slice(0, 5)}`;
}

export default function Proposal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Oath
  const [oathAgreed, setOathAgreed] = useState(false);
  const [oathPassed, setOathPassed] = useState(false);

  // Scheduling: receiver registers times
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [timesSubmitted, setTimesSubmitted] = useState(false);

  // Scheduling: proposer picks time
  const [availableTimes, setAvailableTimes] = useState([]);
  const [pickedTimeId, setPickedTimeId] = useState(null);
  const [timeSubmitted, setTimeSubmitted] = useState(false);

  const dateRange = useMemo(() => generateDateRange(), []);

  useEffect(() => {
    matchService
      .getProposal(token)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || '프로포절을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [token]);

  // Load available times when in scheduling state
  useEffect(() => {
    if (data?.matchStatus === 'scheduling') {
      matchService.getAvailableTimes(token).then((res) => {
        setAvailableTimes(res.times || []);
      }).catch(() => {});
    }
  }, [data?.matchStatus, token]);

  const handleRespond = async (response) => {
    setSubmitting(true);
    try {
      const result = await matchService.respondProposal(token, response);
      setResponseMessage(result.message || '응답이 완료되었습니다.');
      // Reload data to get updated state
      const updated = await matchService.getProposal(token).catch(() => null);
      if (updated) setData(updated);
      else setData((d) => ({ ...d, myResponse: response }));
    } catch (err) {
      setError(err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const handleRegisterTimes = async () => {
    if (selectedSlots.size === 0) return;
    setSubmitting(true);
    try {
      const times = Array.from(selectedSlots).map((key) => {
        const [date, time] = key.split('|');
        return { date, startTime: time };
      });
      await matchService.registerAvailableTimes(token, { times });
      setTimesSubmitted(true);
    } catch (err) {
      setError(err.message || '시간 등록에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const handleSelectTime = async () => {
    if (!pickedTimeId) return;
    setSubmitting(true);
    try {
      await matchService.selectTime(token, { timeId: pickedTimeId });
      setTimeSubmitted(true);
    } catch (err) {
      setError(err.message || '시간 선택에 실패했습니다.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>프로포절을 불러오는 중...</div>;
  if (error && !data) return <div className={styles.errorPage}><p>{error}</p></div>;
  if (!data) return <div className={styles.errorPage}><p>프로필 정보를 찾을 수 없습니다.</p></div>;

  const { myName, myRole, myResponse, matchStatus, counterpart: cp } = data;
  const responded = myResponse !== 'pending';

  // ── Scheduling: Receiver 가용시간 등록 ──
  if (matchStatus === 'scheduling' && myRole === 'receiver') {
    if (timesSubmitted || availableTimes.length > 0) {
      const hasSelected = availableTimes.some((t) => t.selected);
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>knotsandlinks</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>
                {hasSelected ? '시간이 선택되었습니다' : '가용시간을 전달했습니다'}
              </p>
              <p className={styles.respondedStatus}>
                {hasSelected
                  ? '매니저가 최종 확정 중입니다. 확정되면 안내드릴게요.'
                  : '상대방의 시간 선택을 기다리고 있어요.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const toggleSlot = (key) => {
      setSelectedSlots((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <p className={styles.subtitle}>매칭이 성사되었습니다!</p>
          {myName && <p className={styles.greeting}>{myName}님, 만남 가능 시간을 알려주세요.</p>}
          <p className={styles.scheduleDesc}>1~2주 내 가능한 시간을 최대한 많이 선택해주세요.</p>

          <div className={styles.dateList}>
            {dateRange.map((date) => {
              const dateStr = formatDateISO(date);
              return (
                <div key={dateStr} className={styles.dateGroup}>
                  <div className={styles.dateLabel}>{formatDateLabel(date)}</div>
                  <div className={styles.timeGrid}>
                    {TIME_SLOTS.map((time) => {
                      const key = `${dateStr}|${time}`;
                      const isSelected = selectedSlots.has(key);
                      return (
                        <button
                          key={key}
                          className={`${styles.timeSlot} ${isSelected ? styles.timeSlotSelected : ''}`}
                          onClick={() => toggleSlot(key)}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className={styles.oathBtn}
            onClick={handleRegisterTimes}
            disabled={selectedSlots.size === 0 || submitting}
          >
            {submitting ? '전송 중...' : `선택 완료 (${selectedSlots.size}개 선택됨)`}
          </button>
        </div>
      </div>
    );
  }

  // ── Scheduling: Proposer 시간 선택 ──
  if (matchStatus === 'scheduling' && myRole === 'proposer') {
    if (timeSubmitted) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>knotsandlinks</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>시간이 선택되었습니다</p>
              <p className={styles.respondedStatus}>매니저가 최종 확정 중입니다. 확정되면 안내드릴게요.</p>
            </div>
          </div>
        </div>
      );
    }

    if (availableTimes.length === 0) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>knotsandlinks</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>매칭이 성사되었습니다!</p>
              <p className={styles.respondedStatus}>상대방이 가능한 시간을 등록 중입니다. 등록이 완료되면 안내드릴게요.</p>
            </div>
          </div>
        </div>
      );
    }

    const alreadySelected = availableTimes.find((t) => t.selected);
    if (alreadySelected) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>knotsandlinks</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>시간이 선택되었습니다</p>
              <p className={styles.respondedStatus}>{formatTimeDisplay(alreadySelected)}</p>
              <p className={styles.respondedStatus}>매니저가 최종 확정 중입니다. 확정되면 안내드릴게요.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <p className={styles.subtitle}>매칭이 성사되었습니다!</p>
          {myName && <p className={styles.greeting}>{myName}님, 만남 시간을 정해주세요.</p>}
          <p className={styles.scheduleDesc}>상대방이 가능한 시간입니다. 하나를 골라주세요.</p>

          <div className={styles.slotList}>
            {availableTimes.map((slot) => (
              <label
                key={slot.timeId}
                className={`${styles.slotOption} ${pickedTimeId === slot.timeId ? styles.slotOptionSelected : ''}`}
              >
                <input
                  type="radio"
                  name="slot"
                  value={slot.timeId}
                  checked={pickedTimeId === slot.timeId}
                  onChange={() => setPickedTimeId(slot.timeId)}
                  className={styles.slotRadio}
                />
                <span className={styles.slotLabel}>{formatTimeDisplay(slot)}</span>
              </label>
            ))}
          </div>

          <div className={styles.policyNote}>
            <strong>약속 안내</strong>
            <ul>
              <li>확정일 3일 전까지: 전액 환불 가능</li>
              <li>약속 24시간 전까지: 일정 변경 가능</li>
              <li>24시간 미만: 취소 시 환불 불가</li>
            </ul>
          </div>

          <button
            className={styles.oathBtn}
            onClick={handleSelectTime}
            disabled={!pickedTimeId || submitting}
          >
            {submitting ? '확정 중...' : '이 시간으로 확정'}
          </button>
        </div>
      </div>
    );
  }

  // ── Scheduled: 약속 확정됨 ──
  if (matchStatus === 'scheduled') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>약속이 확정되었습니다!</p>
            <p className={styles.respondedStatus}>매니저로부터 장소 안내를 확인해주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Proposer: proposal_sent → B 응답 대기 ──
  if (matchStatus === 'proposal_sent' && myRole === 'proposer') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>매칭이 진행 중입니다</p>
            <p className={styles.respondedStatus}>상대방이 프로필을 확인 중입니다. 확인이 완료되면 안내드릴게요.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Receiver: proposal_accepted → A 응답 대기 ──
  if (matchStatus === 'proposal_accepted' && myRole === 'receiver') {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>수락 완료</p>
            <p className={styles.respondedStatus}>상대방이 프로필을 확인 중입니다. 잠시만 기다려주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── 이미 응답 완료 (상태 전환 전 표시) ──
  if (responded) {
    let label = myResponse === 'accepted' ? '수락 완료' : '응답 완료';
    let statusMsg = responseMessage || '다음 단계를 준비하고 있습니다.';
    if (matchStatus === 'proposal_sent') {
      statusMsg = '상대방 프로필 확인 대기 중입니다.';
    } else if (matchStatus === 'proposal_accepted') {
      statusMsg = '일정 조율이 곧 시작됩니다.';
    }
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>{label}</p>
            <p className={styles.respondedStatus}>{statusMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cp) return <div className={styles.errorPage}><p>프로필 정보를 찾을 수 없습니다.</p></div>;

  // ── Oath Screen ──
  if (!oathPassed) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <div className={styles.oathCard}>
            <div className={styles.oathIcon}><Lock size={32} /></div>
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
              <input type="checkbox" checked={oathAgreed} onChange={(e) => setOathAgreed(e.target.checked)} className={styles.checkbox} />
              <span>위 내용을 숙지했으며 서약합니다.</span>
            </label>
            <button className={styles.oathBtn} onClick={() => setOathPassed(true)} disabled={!oathAgreed}>
              동의하고 프로필 확인하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Profile View + Response ──
  const fields = [
    { label: '별명', value: cp.nickname },
    { label: '나이', value: cp.age ? `${cp.age}세` : null },
    { label: '직업', value: cp.occupation },
    { label: '거주지', value: cp.location },
    { label: 'MBTI', value: cp.mbti },
    { label: '취미', value: cp.hobbies },
    { label: '종교', value: cp.religion },
  ].filter((f) => f.value);

  // Context message based on role & status
  let contextMessage = null;
  if (matchStatus === 'proposal_sent' && myRole === 'receiver') {
    contextMessage = '상대방 프로필을 확인하고 수락/거절해주세요.';
  } else if (matchStatus === 'proposal_accepted' && myRole === 'proposer') {
    contextMessage = '상대방이 수락했습니다! 프로필을 확인하고 수락/거절해주세요.';
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>knotsandlinks</h1>
        <p className={styles.subtitle}>당신을 위한 매칭 제안</p>
        {myName && <p className={styles.greeting}>{myName}님, 아래 프로필을 확인해주세요.</p>}
        {contextMessage && <p className={styles.scheduleDesc}>{contextMessage}</p>}

        {cp.photoUrls?.length > 0 && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>사진</h3>
            <div className={styles.photoGallery}>
              {cp.photoUrls.map((url, idx) => (
                <div key={idx} className={styles.photoThumb}>
                  <img src={url} alt={`사진 ${idx + 1}`} className={styles.blurredPhoto} />
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

        <div className={styles.cautionNote}>
          매칭 후 취소는 상대방에게 큰 상처가 될 수 있습니다. 신중하게 선택해주세요.
        </div>
        <div className={styles.actions}>
          <button className={styles.acceptBtn} onClick={() => handleRespond('accepted')} disabled={submitting}>
            {submitting ? '처리 중...' : '만나볼래요!'}
          </button>
          <button className={styles.rejectBtn} onClick={() => handleRespond('rejected')} disabled={submitting}>
            정중히 거절할게요
          </button>
        </div>

        {error && data && (
          <div className={styles.errorPage} style={{ minHeight: 'auto', padding: '12px 0' }}>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
