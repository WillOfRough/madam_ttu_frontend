import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Lock, Phone, User } from 'lucide-react';
import * as matchService from '../../api/matchService';
import styles from './Proposal.module.css';

const AFTER_ERROR_MESSAGES = {
  '9.007': '미팅이 아직 완료되지 않았습니다.',
  '9.012': '에프터가 성사되지 않았습니다.',
  '9.013': '연락처 조회 기간(24시간)이 만료되었습니다.',
};

const OATH_ITEMS = [
  '프로필 정보를 캡처, 저장, 제3자에게 공유하지 않겠습니다.',
  '위반 시 서비스 이용이 영구 제한될 수 있음을 이해합니다.',
];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const TIME_SLOTS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

function generateDateRange() {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function generateCalendarWeeks(dates) {
  if (dates.length === 0) return [];
  const firstDayOfWeek = dates[0].getDay();
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  dates.forEach((d) => cells.push(d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
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
  const location = useLocation();
  const isSchedulingRoute = location.pathname.endsWith('/available-times');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');

  // Oath
  const [oathAgreed, setOathAgreed] = useState(false);
  const [oathPassed, setOathPassed] = useState(false);

  // Scheduling: calendar + time slot design (both sides)
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [dateSlots, setDateSlots] = useState({});
  const [timesSubmitted, setTimesSubmitted] = useState(false);

  // Available times from server
  const [availableTimes, setAvailableTimes] = useState([]);

  // After
  const [afterStatus, setAfterStatus] = useState(null);
  const [myAfterResponse, setMyAfterResponse] = useState(null);
  const [afterProfile, setAfterProfile] = useState(null);
  const [afterError, setAfterError] = useState(null);

  const dateRange = useMemo(() => generateDateRange(), []);
  const calendarWeeks = useMemo(() => generateCalendarWeeks(dateRange), [dateRange]);
  const sortedSelectedDates = useMemo(() => Array.from(selectedDates).sort(), [selectedDates]);
  const totalSlotCount = useMemo(
    () => Object.values(dateSlots).reduce((sum, slots) => sum + slots.size, 0),
    [dateSlots],
  );

  useEffect(() => {
    matchService
      .getProposal(token)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || '프로포절을 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (data?.matchStatus === 'scheduling') {
      matchService
        .getAvailableTimes(token)
        .then((res) => setAvailableTimes(res.times || []))
        .catch(() => {});
    }
  }, [data?.matchStatus, token]);

  useEffect(() => {
    if (data?.matchStatus === 'completed') {
      matchService
        .getAfterStatus(token)
        .then((res) => {
          setAfterStatus(res.afterStatus);
          setMyAfterResponse(res.myAfterResponse);
        })
        .catch((err) => {
          const code = err.body?.error;
          setAfterError(AFTER_ERROR_MESSAGES[code] || err.message);
        });
    }
  }, [data?.matchStatus, token]);

  const handleAfterRespond = async (response) => {
    setSubmitting(true);
    try {
      const result = await matchService.respondAfter(token, response);
      setMyAfterResponse(response);
      setAfterStatus(result.afterStatus);
    } catch (err) {
      const code = err.body?.error;
      setAfterError(AFTER_ERROR_MESSAGES[code] || err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
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

  // ── Receiver scheduling helpers ──

  const toggleDate = useCallback((dateStr) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
        setDateSlots((ds) => {
          const copy = { ...ds };
          delete copy[dateStr];
          return copy;
        });
      } else {
        next.add(dateStr);
      }
      return next;
    });
  }, []);

  const toggleSlot = useCallback((dateStr, time) => {
    setDateSlots((prev) => {
      const slots = new Set(prev[dateStr] || []);
      if (slots.has(time)) slots.delete(time);
      else slots.add(time);
      return { ...prev, [dateStr]: slots };
    });
  }, []);

  const copyFromPrevious = useCallback((fromDateStr, toDateStr) => {
    setDateSlots((prev) => ({
      ...prev,
      [toDateStr]: new Set(prev[fromDateStr] || []),
    }));
  }, []);

  const selectWeekends = useCallback(() => {
    const weekendSet = new Set(
      dateRange
        .filter((d) => d.getDay() === 0 || d.getDay() === 6)
        .map((d) => formatDateISO(d)),
    );
    setSelectedDates(weekendSet);
    setDateSlots((prev) => {
      const copy = {};
      for (const [k, v] of Object.entries(prev)) {
        if (weekendSet.has(k)) copy[k] = v;
      }
      return copy;
    });
  }, [dateRange]);

  const selectAllDates = useCallback(() => {
    setSelectedDates(new Set(dateRange.map((d) => formatDateISO(d))));
  }, [dateRange]);

  const handleRegisterTimes = async () => {
    const times = [];
    for (const [date, slots] of Object.entries(dateSlots)) {
      for (const time of slots) {
        times.push({ date, startTime: time });
      }
    }
    if (times.length === 0) return;
    setSubmitting(true);
    try {
      await matchService.registerAvailableTimes(token, { times });
      setTimesSubmitted(true);
    } catch (err) {
      setError(err.message || '시간 등록에 실패했습니다.');
    }
    setSubmitting(false);
  };

  if (loading) return <div className={styles.loadingPage}>프로포절을 불러오는 중...</div>;
  if (error && !data) return <div className={styles.errorPage}><p>{error}</p></div>;
  if (!data) return <div className={styles.errorPage}><p>프로필 정보를 찾을 수 없습니다.</p></div>;

  const { myName, myRole, myResponse, matchStatus, counterpart: cp } = data;
  const responded = myResponse !== 'pending';

  // ══════════════════════════════════════════
  // ── Scheduling: 양쪽 가용시간 등록 ──
  // ══════════════════════════════════════════
  // 매니저가 보낸 /available-times 링크로 접근했을 때만 일정조율 UI 표시
  if (matchStatus === 'scheduling' && !isSchedulingRoute) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>매칭이 성사되었습니다!</p>
            <p className={styles.respondedStatus}>
              매니저가 일정 조율 링크를 보내드릴 예정입니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (matchStatus === 'scheduling' && isSchedulingRoute) {
    // Check if I already submitted (my name appears in availableTimes)
    const alreadySubmitted = timesSubmitted || availableTimes.some((t) => t.clientName === myName);

    if (alreadySubmitted) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>knotsandlinks</h1>
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>가용시간을 전달했습니다</p>
              <p className={styles.respondedStatus}>
                상대방도 시간을 등록 중입니다. 등록이 완료되면 안내드릴게요.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // ── Calendar + Time Chip UI ──
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>

          {/* Header */}
          <div className={styles.schedulingHeader}>
            <div className={styles.schedulingCelebration}>
              <span className={styles.celebrationDot} />
              <span className={styles.celebrationDot} />
              <span className={styles.celebrationDot} />
            </div>
            <h2 className={styles.schedulingTitle}>매칭이 성사되었습니다!</h2>
            <p className={styles.schedulingDesc}>
              {cp?.nickname ? `${cp.nickname}님과 ` : ''}만나기 편한 시간을
              <br />
              모두 골라주세요
            </p>
            <span className={styles.schedulingBadge}>최대한 많이 선택해 주셔야 만남의 성사율이 높아요</span>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button className={styles.quickBtn} onClick={selectWeekends} type="button">
              주말만 선택
            </button>
            <button className={styles.quickBtn} onClick={selectAllDates} type="button">
              전체 선택
            </button>
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarCard}>
            <div className={styles.calendarDayNames}>
              {DAY_NAMES.map((name, i) => (
                <span
                  key={name}
                  className={[
                    styles.calendarDayName,
                    i === 0 ? styles.calendarSunLabel : '',
                    i === 6 ? styles.calendarSatLabel : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {name}
                </span>
              ))}
            </div>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className={styles.calendarRow}>
                {week.map((date, di) => {
                  if (!date) return <div key={di} className={styles.calendarCellEmpty} />;
                  const dateStr = formatDateISO(date);
                  const isActive = selectedDates.has(dateStr);
                  const hasSlots = (dateSlots[dateStr]?.size || 0) > 0;
                  return (
                    <button
                      key={di}
                      type="button"
                      className={[
                        styles.calendarCell,
                        isActive ? styles.calendarCellActive : '',
                        di === 0 ? styles.calendarSun : '',
                        di === 6 ? styles.calendarSat : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => toggleDate(dateStr)}
                    >
                      <span className={styles.calendarDateNum}>{date.getDate()}</span>
                      {hasSlots && <span className={styles.calendarDot} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Time Chips for selected dates */}
          {sortedSelectedDates.length > 0 && (
            <div className={styles.chipSection}>
              <p className={styles.chipSectionTitle}>시간대를 선택해주세요</p>
              {sortedSelectedDates.map((dateStr, idx) => {
                const date = new Date(dateStr + 'T00:00:00');
                const slots = dateSlots[dateStr] || new Set();
                const prevDateStr = idx > 0 ? sortedSelectedDates[idx - 1] : null;
                const prevHasSlots =
                  prevDateStr && (dateSlots[prevDateStr]?.size || 0) > 0;

                // 당일이면 현재 시각 +1시간 이후 슬롯만 표시
                const todayStr = formatDateISO(new Date());
                const isToday = dateStr === todayStr;
                const availableSlots = isToday
                  ? TIME_SLOTS.filter((t) => {
                      const hour = parseInt(t.split(':')[0], 10);
                      return hour > new Date().getHours();
                    })
                  : TIME_SLOTS;

                if (availableSlots.length === 0) {
                  return (
                    <div key={dateStr} className={styles.chipDateRow}>
                      <div className={styles.chipDateHeader}>
                        <span className={styles.chipDateLabel}>
                          {formatDateLabel(date)}
                        </span>
                      </div>
                      <p className={styles.noSlots}>
                        선택 가능한 시간이 없습니다
                      </p>
                    </div>
                  );
                }

                const allSelected = availableSlots.every((t) => slots.has(t));

                return (
                  <div key={dateStr} className={styles.chipDateRow}>
                    <div className={styles.chipDateHeader}>
                      <span className={styles.chipDateLabel}>
                        {formatDateLabel(date)}
                      </span>
                      <div className={styles.chipDateActions}>
                        {prevHasSlots && (
                          <button
                            type="button"
                            className={styles.copyBtn}
                            onClick={() => copyFromPrevious(prevDateStr, dateStr)}
                          >
                            이전과 동일
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() =>
                            setDateSlots((prev) => ({
                              ...prev,
                              [dateStr]: allSelected
                                ? new Set()
                                : new Set(availableSlots),
                            }))
                          }
                        >
                          {allSelected ? '전체 해제' : '전체 선택'}
                        </button>
                      </div>
                    </div>
                    <div className={styles.timeSlotGrid}>
                      {availableSlots.map((time) => {
                        const isOn = slots.has(time);
                        return (
                          <button
                            key={time}
                            type="button"
                            className={`${styles.timeSlot} ${isOn ? styles.timeSlotSelected : ''}`}
                            onClick={() => toggleSlot(dateStr, time)}
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
          )}

          {/* CTA */}
          <div className={styles.ctaSection}>
            {totalSlotCount > 0 && (
              <p className={styles.ctaInfo}>
                {totalSlotCount}개 시간대 선택됨
                {totalSlotCount < 3 && (
                  <span className={styles.ctaWarn}> · 최소 3개 권장</span>
                )}
              </p>
            )}
            <button
              className={styles.ctaBtn}
              onClick={handleRegisterTimes}
              disabled={totalSlotCount === 0 || submitting}
              type="button"
            >
              {submitting
                ? '전송 중...'
                : totalSlotCount === 0
                  ? '날짜와 시간대를 선택해주세요'
                  : '이 시간대면 언제든 좋아요'}
            </button>
          </div>
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
            <p className={styles.respondedStatus}>
              매니저로부터 장소 안내를 확인해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Completed: After Flow ──
  if (matchStatus === 'completed') {
    // After profile view
    if (afterProfile) {
      const profileFields = [
        { label: '이름', value: afterProfile.name },
        { label: '전화번호', value: afterProfile.phone },
        { label: '나이', value: afterProfile.age ? `${afterProfile.age}세` : null },
        { label: '키', value: afterProfile.height ? `${afterProfile.height}cm` : null },
        { label: '직업', value: afterProfile.occupation },
        { label: '학력', value: afterProfile.education },
        { label: '거주지', value: afterProfile.location },
        { label: 'MBTI', value: afterProfile.mbti },
        { label: '취미', value: afterProfile.hobbies },
      ].filter((f) => f.value);

      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>knotsandlinks</h1>
            <div className={styles.afterSuccessBanner}>
              <p className={styles.respondedLabel}>에프터가 성사되었습니다!</p>
              <p className={styles.respondedStatus}>상대방의 연락처와 프로필입니다.</p>
            </div>

            {afterProfile.photoUrls?.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>사진</h3>
                <div className={styles.photoGallery}>
                  {afterProfile.photoUrls.map((url, idx) => (
                    <div key={idx} className={styles.photoThumb}>
                      <img src={url} alt={`사진 ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <Phone size={16} /> 연락처 정보
              </h3>
              <div className={styles.fields}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>이름</span>
                  <span className={styles.fieldValue}>{afterProfile.name}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>전화번호</span>
                  <span className={styles.fieldValue}>{afterProfile.phone}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <User size={16} /> 프로필
              </h3>
              <div className={styles.fields}>
                {profileFields.filter((f) => f.label !== '이름' && f.label !== '전화번호').map(({ label, value }) => (
                  <div key={label} className={styles.field}>
                    <span className={styles.fieldLabel}>{label}</span>
                    <span className={styles.fieldValue}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {afterProfile.introduction && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>자기소개</h3>
                <p className={styles.text}>{afterProfile.introduction}</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>

          {afterError && (
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>알림</p>
              <p className={styles.respondedStatus}>{afterError}</p>
            </div>
          )}

          {!afterError && afterStatus === 'pending' && myAfterResponse === 'pending' && (
            <>
              <div className={styles.afterCard}>
                <h2 className={styles.afterTitle}>미팅은 어떠셨나요?</h2>
                <p className={styles.afterDesc}>
                  상대방을 다시 만나고 싶으시다면 에프터를 신청해주세요.
                  <br />양쪽 모두 수락하면 연락처가 공개됩니다.
                </p>
                <div className={styles.afterActions}>
                  <button
                    className={styles.acceptBtn}
                    onClick={() => handleAfterRespond('accepted')}
                    disabled={submitting}
                  >
                    {submitting ? '처리 중...' : '다시 만나고 싶어요!'}
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleAfterRespond('rejected')}
                    disabled={submitting}
                  >
                    괜찮습니다
                  </button>
                </div>
              </div>
            </>
          )}

          {!afterError && afterStatus === 'pending' && myAfterResponse === 'accepted' && (
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>에프터를 신청했습니다</p>
              <p className={styles.respondedStatus}>상대방의 응답을 기다리고 있습니다.</p>
            </div>
          )}

          {!afterError && afterStatus === 'pending' && myAfterResponse === 'rejected' && (
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>응답 완료</p>
              <p className={styles.respondedStatus}>소중한 시간 감사합니다.</p>
            </div>
          )}

          {!afterError && afterStatus === 'rejected' && (
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>에프터가 성사되지 않았습니다</p>
              <p className={styles.respondedStatus}>좋은 인연이 있을 거예요. 감사합니다.</p>
            </div>
          )}

          {!afterError && afterStatus === 'accepted' && (
            <div className={styles.afterSuccessBanner}>
              <p className={styles.respondedLabel}>에프터가 성사되었습니다!</p>
              <p className={styles.respondedStatus}>양쪽 모두 다시 만나고 싶어합니다.</p>
              <button
                className={styles.afterProfileBtn}
                onClick={handleViewAfterProfile}
                disabled={submitting}
              >
                {submitting ? '조회 중...' : '상대 연락처 보기'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Responded banner (shown above profile when already responded) ──
  let respondedBanner = null;
  if (responded) {
    const label = myResponse === 'accepted' ? '수락 완료' : '응답 완료';
    let statusMsg = responseMessage || '다음 단계를 준비하고 있습니다.';
    if (matchStatus === 'proposal_sent') {
      statusMsg = '상대방 프로필 확인 대기 중입니다.';
    } else if (matchStatus === 'proposal_accepted') {
      statusMsg = '일정 조율이 곧 시작됩니다.';
    }
    respondedBanner = (
      <div className={styles.respondedBanner}>
        <p className={styles.respondedLabel}>{label}</p>
        <p className={styles.respondedStatus}>{statusMsg}</p>
      </div>
    );
  }

  if (!cp)
    return (
      <div className={styles.errorPage}>
        <p>프로필 정보를 찾을 수 없습니다.</p>
      </div>
    );

  // ── Oath Screen ──
  if (!oathPassed) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>knotsandlinks</h1>
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

  // ── Profile View + Response ──
  const fields = [
    { label: '별명', value: cp.nickname },
    { label: '나이', value: cp.age ? `${cp.age}세` : null },
    { label: '키', value: cp.height ? `${cp.height}cm` : null },
    { label: '직업', value: cp.occupation },
    { label: '학력', value: cp.education },
    { label: '거주지', value: cp.location },
    { label: 'MBTI', value: cp.mbti },
    { label: '취미', value: cp.hobbies },
    { label: '종교', value: cp.religion },
  ].filter((f) => f.value);

  let contextMessage = null;
  if (matchStatus === 'proposal_sent' && myRole === 'proposer') {
    contextMessage = '상대방 프로필을 확인하고 수락/거절해주세요.';
  } else if (matchStatus === 'proposal_accepted' && myRole === 'receiver') {
    contextMessage = '상대방이 수락했습니다! 프로필을 확인하고 수락/거절해주세요.';
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.logo}>knotsandlinks</h1>
        <p className={styles.subtitle}>당신을 위한 매칭 제안</p>
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
                  <img
                    src={url}
                    alt={`사진 ${idx + 1}`}
                  />
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
                onClick={() => handleRespond('accepted')}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : '만나볼래요!'}
              </button>
              <button
                className={styles.rejectBtn}
                onClick={() => handleRespond('rejected')}
                disabled={submitting}
              >
                정중히 거절할게요
              </button>
            </div>
          </>
        )}

        {error && data && (
          <div
            className={styles.errorPage}
            style={{ minHeight: 'auto', padding: '12px 0' }}
          >
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
