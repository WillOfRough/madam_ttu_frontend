import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Lock, Phone, User } from 'lucide-react';
import * as matchService from '../../api/matchService';
import { toast } from '../../store/toastStore';
import styles from './Proposal.module.css';

const AFTER_ERROR_MESSAGES = {
  '9.007': '미팅이 아직 완료되지 않았습니다.',
  '9.012': '에프터가 성사되지 않았습니다.',
  '9.013': '연락처 조회 기간(24시간)이 만료되었습니다.',
  '9.014': '이 매칭은 종료되었습니다.',
};

const OATH_ITEMS = [
  '프로필 정보를 캡처·녹화·저장·인쇄하거나 SNS·메신저·단체방에 공유하지 않겠습니다.',
  '사진·연락처·직장·거주지 등 개인정보를 외부에 노출하거나 신원 검색·조회에 사용하지 않겠습니다.',
  '본인 외 제3자와 함께 열람하거나 대신 의견을 구하지 않겠습니다.',
  '매칭 진행 외 목적(영업·홍보·사적 연락 시도 등)으로 정보를 사용하지 않겠습니다.',
  '상대방을 존중하며 비방·차별·성희롱 등 부적절한 언행을 하지 않겠습니다.',
  '위반 시 서비스 이용이 영구 제한될 수 있으며, 관련 법령에 따라 민·형사상 책임이 따를 수 있음을 이해합니다.',
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

function PageHeader({ step, total }) {
  return (
    <div className={styles.brandHeader}>
      <div className={styles.brandMark}>
        <div className={styles.brandMarkDot} />
      </div>
      <span className={styles.brandName}>Knots &amp; Links</span>
      {step && total && (
        <span style={{
          marginLeft: 'auto', fontSize: 10.5, fontWeight: 700,
          color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums',
        }}>
          {step} / {total}
        </span>
      )}
    </div>
  );
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
  const [resultAvailable, setResultAvailable] = useState(false);
  const [myAfterResponse, setMyAfterResponse] = useState(null);
  const [afterProfile, setAfterProfile] = useState(null);
  const [afterError, setAfterError] = useState(null);

  // Meeting feedback (에프터 불성사 후 만남 피드백)
  const [meetingFeedback, setMeetingFeedback] = useState(null);
  const [meetingFeedbackLoading, setMeetingFeedbackLoading] = useState(false);
  const [editingMeetingFeedback, setEditingMeetingFeedback] = useState(false);
  const [meetingComment, setMeetingComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

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
          setResultAvailable(res.resultAvailable || false);
          const savedResponse = localStorage.getItem(`after_response_${token}`);
          if (savedResponse && res.afterStatus === 'rejected' && res.myAfterResponse === 'rejected') {
            setMyAfterResponse(savedResponse);
          } else {
            setMyAfterResponse(res.myAfterResponse);
          }
        })
        .catch((err) => {
          const code = err.body?.error;
          setAfterError(AFTER_ERROR_MESSAGES[code] || err.message);
        });
    }
  }, [data?.matchStatus, token]);

  useEffect(() => {
    if (afterStatus === 'rejected') {
      setMeetingFeedbackLoading(true);
      matchService.getFeedback(token)
        .then((res) => {
          setMeetingFeedback(res);
          if (res.feedbackAt) {
            setMeetingComment(res.comment || '');
          }
        })
        .catch(() => {})
        .finally(() => setMeetingFeedbackLoading(false));
    }
  }, [afterStatus, token]);

  const handleMeetingFeedbackSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await matchService.submitFeedback(token, {
        comment: meetingComment || null,
      });
      setMeetingFeedback(result);
      setEditingMeetingFeedback(false);
      toast.success('소중한 피드백 감사합니다!');
    } catch {
      toast.error('피드백 제출에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const handleAfterRespond = async (response) => {
    setSubmitting(true);
    try {
      await matchService.respondAfter(token, response);
      localStorage.setItem(`after_response_${token}`, response);
      setMyAfterResponse(response);
      try {
        const status = await matchService.getAfterStatus(token);
        setAfterStatus(status.afterStatus);
        setResultAvailable(status.resultAvailable || false);
      } catch {
        setAfterStatus('pending');
      }
    } catch (err) {
      const code = err.body?.error;
      setAfterError(AFTER_ERROR_MESSAGES[code] || err.message || '응답 처리에 실패했습니다.');
    }
    setSubmitting(false);
  };

  const handleViewAfterResult = async () => {
    setSubmitting(true);
    try {
      const result = await matchService.getAfterResult(token);
      if (result.afterStatus === 'accepted' && result.counterpartProfile) {
        setAfterProfile(result.counterpartProfile);
      } else if (result.afterStatus === 'rejected') {
        setAfterStatus('rejected');
        setResultAvailable(true);
      }
    } catch (err) {
      const code = err.body?.error;
      setAfterError(AFTER_ERROR_MESSAGES[code] || err.message || '결과 조회에 실패했습니다.');
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
  // ── Awaiting Payment ──
  // ══════════════════════════════════════════
  if (matchStatus === 'awaiting_payment') {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
          <div className={styles.respondedBanner}>
            <p className={styles.respondedLabel}>매칭이 성사되었습니다!</p>
            <p className={styles.respondedStatus}>
              입금 확인 후 일정 조율이 시작됩니다. 잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // ── Scheduling: 일정조율 링크가 아닌 경우 대기 ──
  // ══════════════════════════════════════════
  if (matchStatus === 'scheduling' && !isSchedulingRoute) {
    return (
      <div className={styles.page}>
        <PageHeader />
        <div className={styles.container}>
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

  // ══════════════════════════════════════════
  // ── Scheduling: 가용시간 등록 UI ──
  // ══════════════════════════════════════════
  if (matchStatus === 'scheduling' && isSchedulingRoute) {
    const alreadySubmitted = timesSubmitted || availableTimes.some((t) => t.clientName === myName);

    if (alreadySubmitted) {
      return (
        <div className={styles.page}>
          <PageHeader />
          <div className={styles.container}>
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

    return (
      <div className={styles.page}>
        <PageHeader step={2} total={3} />
        <div className={styles.container}>

          {/* Title block */}
          <div className={styles.pageTitleBlock}>
            <div className={`${styles.progressBadge} ${styles.tangerine}`}>
              <span className={styles.progressBadgeDot} />
              일정 선택
            </div>
            <h1 className={styles.pageTitle}>언제 만나기 좋으세요?</h1>
            <p className={styles.pageSubtitle}>
              {cp?.nickname ? `${cp.nickname}님과 ` : ''}만나기 편한 시간을 모두 골라주세요.
            </p>
          </div>

          {/* Quick actions */}
          <div className={styles.quickActions}>
            <button className={styles.quickBtn} onClick={selectWeekends} type="button">
              주말만
            </button>
            <button className={styles.quickBtn} onClick={selectAllDates} type="button">
              전체 선택
            </button>
            {totalSlotCount > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                padding: '6px 10px', background: 'var(--mint-100)',
                borderRadius: 'var(--r-pill)', color: 'var(--mint-600)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {totalSlotCount}개 선택됨
              </span>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 12, lineHeight: 1.5 }}>
            날짜를 선택 후 아래에서 시간대를 고르세요. 최대한 많이 선택할수록 성사율이 높아요.
          </p>

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
                  ].filter(Boolean).join(' ')}
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
                      ].filter(Boolean).join(' ')}
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

          {/* Time chips */}
          {sortedSelectedDates.length > 0 && (
            <div className={styles.chipSection}>
              <p className={styles.chipSectionTitle}>시간대를 선택해주세요</p>
              {sortedSelectedDates.map((dateStr, idx) => {
                const date = new Date(dateStr + 'T00:00:00');
                const slots = dateSlots[dateStr] || new Set();
                const prevDateStr = idx > 0 ? sortedSelectedDates[idx - 1] : null;
                const prevHasSlots = prevDateStr && (dateSlots[prevDateStr]?.size || 0) > 0;
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
                        <span className={styles.chipDateLabel}>{formatDateLabel(date)}</span>
                      </div>
                      <p className={styles.noSlots}>선택 가능한 시간이 없습니다</p>
                    </div>
                  );
                }

                const allSelected = availableSlots.every((t) => slots.has(t));

                return (
                  <div key={dateStr} className={styles.chipDateRow}>
                    <div className={styles.chipDateHeader}>
                      <span className={styles.chipDateLabel}>{formatDateLabel(date)}</span>
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
                              [dateStr]: allSelected ? new Set() : new Set(availableSlots),
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

          {/* Reassurance note */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--paper-warm)',
            borderRadius: 'var(--r-md)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
            marginBottom: 80,
          }}>
            <span style={{ color: 'var(--tangerine-600)', fontSize: 13, flexShrink: 0, marginTop: 1 }}>ⓘ</span>
            <p style={{ fontSize: 11.5, color: 'var(--ink-700)', lineHeight: 1.6 }}>
              선택하신 시간은 상대방에게 바로 공개되지 않아요.{' '}
              <strong style={{ color: 'var(--ink-900)' }}>겹치는 시간이 있다면</strong>{' '}
              매니저가 안전한 장소로 약속을 잡아드려요.
            </p>
          </div>

          {/* Sticky CTA */}
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
                  : '이 시간대면 언제든 좋아요 →'}
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
        <PageHeader />
        <div className={styles.container}>
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

  // ══════════════════════════════════════════
  // ── Completed: After Flow ──
  // ══════════════════════════════════════════
  if (matchStatus === 'completed') {
    // 피드백 제출 완료 화면
    if (afterStatus === 'rejected' && meetingFeedback?.feedbackAt && !editingMeetingFeedback) {
      return (
        <div className={styles.page}>
          <PageHeader />
          <div className={styles.container} key="feedback-done">
            <div className={styles.respondedBanner}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🌱</div>
              <p className={styles.respondedLabel}>피드백을 남겨주셨습니다</p>
              <p className={styles.respondedStatus}>
                소중한 의견 감사합니다.
                <br />다음에는 꼭 맞는 분을 찾아드릴게요.
              </p>
              <button
                className={styles.editFeedbackBtn}
                onClick={() => setEditingMeetingFeedback(true)}
              >
                피드백 수정하기
              </button>
            </div>
          </div>
        </div>
      );
    }

    // After profile view (성사 후 연락처)
    if (afterProfile) {
      const profileFields = [
        { label: '이름', value: afterProfile.name },
        { label: '전화번호', value: afterProfile.phone },
        { label: '나이', value: afterProfile.age ? `${afterProfile.age}세` : null },
        { label: '키', value: afterProfile.height ? `${afterProfile.height}cm` : null },
        { label: '회사', value: afterProfile.company },
        { label: '거주지', value: afterProfile.location },
        { label: 'MBTI', value: afterProfile.mbti },
        { label: '취미', value: afterProfile.hobbies },
      ].filter((f) => f.value);

      return (
        <div className={styles.page}>
          <PageHeader />
          <div className={styles.container}>
            <div className={styles.afterSuccessBanner}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                <span className={styles.celebrationDot} />
                <span className={styles.celebrationDot} />
                <span className={styles.celebrationDot} />
              </div>
              <p className={styles.respondedLabel} style={{ color: 'var(--mint-600)', fontFamily: 'var(--font-sans)', fontSize: 18 }}>
                에프터가 성사되었습니다!
              </p>
              <p className={styles.respondedStatus} style={{ marginTop: 6 }}>상대방의 연락처와 프로필입니다.</p>
            </div>

            {afterProfile.photoUrls?.length > 0 && (
              <div className={styles.card} style={{ marginTop: 16 }}>
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
              <h3 className={styles.cardTitle}><Phone size={13} /> 연락처 정보</h3>
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
              <h3 className={styles.cardTitle}><User size={13} /> 프로필</h3>
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
        <PageHeader />
        <div className={styles.container}>

          {afterError && (
            <div className={styles.respondedBanner}>
              <p className={styles.respondedLabel}>알림</p>
              <p className={styles.respondedStatus}>{afterError}</p>
            </div>
          )}

          {/* 1. 아직 미응답 → 에프터 선택 화면 */}
          {!afterError && myAfterResponse === 'pending' && (
            <div className={styles.afterCard}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                <span className={styles.afterWaitingDot} style={{ background: 'var(--tangerine-600)' }} />
                <span className={styles.afterWaitingDot} style={{ background: 'var(--mint-600)', animationDelay: '.2s' }} />
                <span className={styles.afterWaitingDot} style={{ background: 'var(--lilac-600)', animationDelay: '.4s' }} />
              </div>
              <h2 className={styles.afterTitle}>미팅은 어떠셨나요?</h2>
              <p className={styles.afterDesc}>
                상대방을 다시 만나고 싶으시다면 에프터를 신청해주세요.
                <br />양쪽 모두 수락하면 연락처가 공개됩니다.
              </p>
              <div className={styles.afterActions}>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleAfterRespond('rejected')}
                  disabled={submitting}
                >
                  괜찮습니다
                </button>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleAfterRespond('accepted')}
                  disabled={submitting}
                >
                  {submitting ? '처리 중...' : '다시 만나고 싶어요!'}
                </button>
              </div>
            </div>
          )}

          {/* 2. "만나볼래요" + 결과 아직 없음 → 대기 */}
          {!afterError && myAfterResponse === 'accepted' && !resultAvailable && (
            <div className={styles.afterWaitingCard}>
              <div className={styles.afterWaitingIcon}>
                <span className={styles.afterWaitingDot} />
                <span className={styles.afterWaitingDot} />
                <span className={styles.afterWaitingDot} />
              </div>
              <p className={styles.afterWaitingTitle}>응답이 전달되었습니다</p>
              <p className={styles.afterWaitingDesc}>
                아직 상대방의 선택이 완료되지 않았어요.
                <br />상대방이 응답하면 결과를 확인하실 수 있습니다.
              </p>
            </div>
          )}

          {/* 3. "만나볼래요" + 결과 나옴 + 미성사 → 미성사 안내 */}
          {!afterError && resultAvailable && afterStatus === 'rejected' && myAfterResponse === 'accepted' && (
            <>
              <div className={styles.respondedBanner}>
                <p className={styles.respondedLabel}>에프터가 성사되지 않았습니다</p>
                <p className={styles.respondedStatus}>
                  아쉽지만 상대방이 다른 결정을 내렸어요. 더 좋은 인연이 기다리고 있을 거예요.
                </p>
              </div>
              {!showFeedbackForm && !meetingFeedbackLoading && (
                <button className={styles.feedbackToggleBtn} onClick={() => setShowFeedbackForm(true)}>
                  이번 만남에 대한 피드백 남기기
                </button>
              )}
              {showFeedbackForm && !meetingFeedbackLoading && (
                <div className={styles.afterCard}>
                  <p className={styles.afterDesc}>
                    괜찮으시다면 이번 만남에 대한 소감을 편하게 들려주세요.
                    <br />다음에는 꼭 맞는 분을 찾아드릴게요.
                  </p>
                  <textarea
                    className={styles.feedbackTextarea}
                    value={meetingComment}
                    onChange={(e) => setMeetingComment(e.target.value)}
                    placeholder="예) 전반적으로 좋았어요, 이런 스타일이면 더 좋을 것 같아요 등"
                    rows={4}
                    maxLength={1000}
                    disabled={submitting}
                  />
                  {!submitting && <p className={styles.feedbackCount}>{meetingComment.length}/1000</p>}
                  <div className={styles.afterActions}>
                    <button
                      className={styles.rejectBtn}
                      onClick={() => setShowFeedbackForm(false)}
                    >
                      닫기
                    </button>
                    <button
                      className={styles.acceptBtn}
                      onClick={handleMeetingFeedbackSubmit}
                      disabled={submitting || !meetingComment}
                    >
                      {submitting ? '제출 중...' : '피드백 제출'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 4. "괜찮습니다" + 상대 미응답 → 피드백 화면 */}
          {!afterError && myAfterResponse === 'rejected' && afterStatus === 'pending' && (
            <div className={styles.afterCard}>
              <p className={styles.afterDesc}>
                인연에도 &lsquo;결&rsquo;이 있다고 합니다.
                <br />이번 만남은 두 분의 결이 잠시 어긋났을 뿐이에요.
                <br /><br />
                괜찮으시다면 어떤 부분이 아쉬우셨는지 편하게 들려주세요.
                <br />다음에는 꼭 맞는 분을 찾아드릴게요.
              </p>
              <textarea
                className={styles.feedbackTextarea}
                value={meetingComment}
                onChange={(e) => setMeetingComment(e.target.value)}
                placeholder="예) 대화 스타일이 조금 달랐어요, 관심사가 달라서 아쉬웠어요 등"
                rows={4}
                maxLength={1000}
                disabled={submitting}
              />
              {!submitting && <p className={styles.feedbackCount}>{meetingComment.length}/1000</p>}
              <div className={styles.afterActions}>
                <button
                  className={styles.acceptBtn}
                  onClick={handleMeetingFeedbackSubmit}
                  disabled={submitting || !meetingComment}
                  style={{ width: '100%' }}
                >
                  {submitting ? '제출 중...' : '피드백 제출'}
                </button>
              </div>
            </div>
          )}

          {/* 5. 양쪽 완료 → 미성사 (본인 거절) */}
          {!afterError && afterStatus === 'rejected' && myAfterResponse === 'rejected' && (
            <>
              <div className={styles.respondedBanner}>
                <p className={styles.respondedLabel}>응답이 완료되었습니다</p>
                <p className={styles.respondedStatus}>
                  소중한 시간 감사합니다. 더 좋은 인연을 찾아드릴게요.
                </p>
              </div>
              {!meetingFeedbackLoading && (
                <div className={styles.afterCard}>
                  <p className={styles.afterDesc}>
                    괜찮으시다면 어떤 부분이 아쉬우셨는지 편하게 들려주세요.
                    <br />다음에는 꼭 맞는 분을 찾아드릴게요.
                  </p>
                  <textarea
                    className={styles.feedbackTextarea}
                    value={meetingComment}
                    onChange={(e) => setMeetingComment(e.target.value)}
                    placeholder="예) 대화 스타일이 조금 달랐어요, 관심사가 달라서 아쉬웠어요 등"
                    rows={4}
                    maxLength={1000}
                    disabled={submitting}
                  />
                  {!submitting && <p className={styles.feedbackCount}>{meetingComment.length}/1000</p>}
                  <div className={styles.afterActions}>
                    <button
                      className={styles.acceptBtn}
                      onClick={handleMeetingFeedbackSubmit}
                      disabled={submitting || !meetingComment}
                      style={{ width: '100%' }}
                    >
                      {submitting ? '제출 중...' : '피드백 제출'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 6. 양쪽 완료 → 성사 */}
          {!afterError && resultAvailable && afterStatus === 'accepted' && (
            <div className={styles.afterSuccessBanner}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                <span className={styles.celebrationDot} />
                <span className={styles.celebrationDot} />
                <span className={styles.celebrationDot} />
              </div>
              <p className={styles.respondedLabel} style={{ color: 'var(--mint-600)', fontFamily: 'var(--font-sans)', fontSize: 18 }}>
                에프터가 성사되었습니다!
              </p>
              <p className={styles.respondedStatus} style={{ marginTop: 6 }}>
                양쪽 모두 다시 만나고 싶어합니다.
              </p>
              <button
                className={styles.afterProfileBtn}
                onClick={handleViewAfterResult}
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

  // ── Responded banner ──
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

  // ── Profile View + Response ──
  const fields = [
    { label: '닉네임', value: cp.nickname },
    { label: '나이', value: cp.age ? `${cp.age}세` : null },
    { label: '키', value: cp.height ? `${cp.height}cm` : null },
    { label: '회사', value: cp.company },
    { label: '거주지', value: cp.location },
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

        {cp.introduction && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>자기소개</h3>
            <p className={styles.text}>{cp.introduction}</p>
          </div>
        )}

        {!responded && (
          <>
            <p className={styles.cautionNote}>
              매칭 후 취소는 상대방에게 큰 상처가 될 수 있습니다. 신중하게 선택해주세요.
            </p>
            <div className={styles.actions}>
              <button
                className={styles.rejectBtn}
                onClick={() => handleRespond('rejected')}
                disabled={submitting}
              >
                정중히 거절할게요
              </button>
              <button
                className={styles.acceptBtn}
                onClick={() => handleRespond('accepted')}
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
    </div>
  );
}
