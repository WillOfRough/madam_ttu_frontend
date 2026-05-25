import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import * as matchService from '../../api/matchService';
import styles from './Proposal.module.css';

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
        <span style={{ marginLeft: 'auto', fontSize: 10.5, fontWeight: 700, color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}>
          {step} / {total}
        </span>
      )}
    </div>
  );
}

export default function ProposalSchedule() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Scheduling state
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [dateSlots, setDateSlots] = useState({});
  const [timesSubmitted, setTimesSubmitted] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);

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
      .then((res) => {
        setData(res);
        if (res.matchStatus === 'scheduling') {
          matchService
            .getAvailableTimes(token)
            .then((r) => setAvailableTimes(r.times || []))
            .catch(() => {});
        }
      })
      .catch((err) => setError(err.message || '정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [token]);

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

  if (loading) return <div className={styles.loadingPage}>정보를 불러오는 중...</div>;
  if (error && !data) return <div className={styles.errorPage}><p>{error}</p></div>;
  if (!data) return <div className={styles.errorPage}><p>정보를 찾을 수 없습니다.</p></div>;

  const { myName, matchStatus, counterpart: cp } = data;

  // 일정조율 단계가 아니면 안내 메시지
  if (matchStatus !== 'scheduling') {
    let message = '일정 조율이 아직 시작되지 않았습니다.';
    if (matchStatus === 'awaiting_payment') {
      message = '입금 확인 후 일정 조율이 시작됩니다. 잠시만 기다려주세요.';
    } else if (matchStatus === 'arranging' || matchStatus === 'scheduled') {
      message = '일정이 이미 확정되었습니다. 매니저 안내를 확인해주세요.';
    } else if (matchStatus === 'completed') {
      message = '미팅이 완료되었습니다.';
    } else if (matchStatus === 'cancelled') {
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

  // 이미 등록 완료
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

  // ── Calendar + Time Chip UI ──
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
            두 분이 겹치는 시간으로 약속이 잡혀요.
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
              marginLeft: 'auto',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 10px',
              background: 'var(--mint-100)',
              borderRadius: 'var(--r-pill)',
              color: 'var(--mint-600)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {totalSlotCount}개 선택됨
            </span>
          )}
        </div>

        {/* Hint */}
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

        {/* Time chips for selected dates */}
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
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
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
