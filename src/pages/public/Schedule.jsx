import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../api/config';
import * as matchService from '../../api/matchService';
import styles from './Schedule.module.css';

function generateDateRange() {
  const dates = [];
  const now = new Date();
  for (let i = 2; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const TIME_SLOTS = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateLabel(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAY_NAMES[date.getDay()];
  return `${m}/${d} (${day})`;
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatSlotDisplay(slot) {
  const d = new Date(slot.date + 'T00:00:00');
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const day = DAY_NAMES[d.getDay()];
  return `${m}/${dd} (${day}) ${slot.time}`;
}

export default function Schedule() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Proposer state
  const [selectedSlots, setSelectedSlots] = useState(new Set());

  // Picker state
  const [pickedSlotId, setPickedSlotId] = useState(null);

  useEffect(() => {
    apiFetch(`/api/v1/schedule/${token}`, { method: 'GET' })
      .then((res) => setData(res))
      .catch((err) => setError(err.message || '일정 조율 정보를 불러올 수 없습니다.'))
      .finally(() => setLoading(false));
  }, [token]);

  const dateRange = useMemo(() => generateDateRange(), []);

  if (loading) return <div className={styles.loadingPage}>일정 정보를 불러오는 중...</div>;
  if (error) return <div className={styles.errorPage}><p>{error}</p></div>;
  if (!data) return <div className={styles.errorPage}><p>데이터를 찾을 수 없습니다.</p></div>;

  const { role, status, schedule, meetingDate } = data;

  // Already confirmed
  if (status === 'confirmed' && meetingDate) {
    const d = new Date(meetingDate);
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <div className={styles.completeBanner}>
            <p className={styles.completeTitle}>약속이 확정되었습니다!</p>
            <p className={styles.completeDate}>
              {d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} {d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {schedule.venue && <p className={styles.completeVenue}>{schedule.venue}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Proposer already submitted
  if (role === 'proposer' && schedule.timeSlots.length > 0) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <div className={styles.completeBanner}>
            <p className={styles.completeTitle}>시간을 전달했습니다</p>
            <p className={styles.completeDesc}>상대방의 선택을 기다리고 있어요.</p>
          </div>
        </div>
      </div>
    );
  }

  // Picker already picked
  if (role === 'picker' && schedule.pickedSlot) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <div className={styles.completeBanner}>
            <p className={styles.completeTitle}>시간이 선택되었습니다</p>
            <p className={styles.completeDate}>{formatSlotDisplay(schedule.pickedSlot)}</p>
            <p className={styles.completeDesc}>매니저가 장소를 확정하면 안내드릴게요.</p>
          </div>
        </div>
      </div>
    );
  }

  // Submission done this session
  if (submitted) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <div className={styles.completeBanner}>
            <p className={styles.completeTitle}>
              {role === 'proposer' ? '시간을 전달했습니다' : '시간이 선택되었습니다'}
            </p>
            <p className={styles.completeDesc}>
              {role === 'proposer'
                ? '상대방의 선택을 기다리고 있어요.'
                : '매니저가 장소를 확정하면 안내드릴게요.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Proposer View: multi-select time slots ──
  if (role === 'proposer') {
    const toggleSlot = (key) => {
      setSelectedSlots((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const handlePropose = async () => {
      if (selectedSlots.size === 0) return;
      setSubmitting(true);
      try {
        const timeSlots = Array.from(selectedSlots).map((key) => {
          const [date, time] = key.split('|');
          return { date, time };
        });
        await matchService.proposeSchedule(data.matchId, { timeSlots });
        setSubmitted(true);
      } catch (err) {
        setError(err.message || '시간 제안에 실패했습니다.');
      }
      setSubmitting(false);
    };

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <h2 className={styles.title}>만남 가능 시간을 알려주세요</h2>
          <p className={styles.desc}>1~2주 내 가능한 시간을 최대한 많이 선택해주세요.</p>

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
            className={styles.submitBtn}
            onClick={handlePropose}
            disabled={selectedSlots.size === 0 || submitting}
          >
            {submitting ? '전송 중...' : `선택 완료 (${selectedSlots.size}개 선택됨)`}
          </button>
        </div>
      </div>
    );
  }

  // ── Picker View: pick one from proposed slots ──
  if (role === 'picker') {
    const slots = schedule.timeSlots || [];

    if (slots.length === 0) {
      return (
        <div className={styles.page}>
          <div className={styles.container}>
            <h1 className={styles.logo}>findmyone</h1>
            <div className={styles.completeBanner}>
              <p className={styles.completeTitle}>아직 시간이 제안되지 않았습니다</p>
              <p className={styles.completeDesc}>상대방이 가능한 시간을 제안하면 안내드릴게요.</p>
            </div>
          </div>
        </div>
      );
    }

    const handlePick = async () => {
      if (!pickedSlotId) return;
      setSubmitting(true);
      try {
        await matchService.pickSchedule(data.matchId, { slotId: pickedSlotId });
        setSubmitted(true);
      } catch (err) {
        setError(err.message || '시간 선택에 실패했습니다.');
      }
      setSubmitting(false);
    };

    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.logo}>findmyone</h1>
          <h2 className={styles.title}>만남 시간을 정해주세요</h2>
          <p className={styles.desc}>상대방이 가능한 시간입니다. 하나를 골라주세요.</p>

          <div className={styles.slotList}>
            {slots.map((slot) => (
              <label
                key={slot.id}
                className={`${styles.slotOption} ${pickedSlotId === slot.id ? styles.slotOptionSelected : ''}`}
              >
                <input
                  type="radio"
                  name="slot"
                  value={slot.id}
                  checked={pickedSlotId === slot.id}
                  onChange={() => setPickedSlotId(slot.id)}
                  className={styles.slotRadio}
                />
                <span className={styles.slotLabel}>{formatSlotDisplay(slot)}</span>
              </label>
            ))}
          </div>

          <div className={styles.policyNote}>
            <strong>약속 안내</strong>
            <ul>
              <li>약속일 3일 전까지: 전액 환불 가능</li>
              <li>약속 24시간 전까지: 일정 변경 가능</li>
              <li>24시간 미만: 취소 시 환불 불가</li>
            </ul>
          </div>

          <button
            className={styles.submitBtn}
            onClick={handlePick}
            disabled={!pickedSlotId || submitting}
          >
            {submitting ? '확정 중...' : '이 시간으로 확정'}
          </button>
        </div>
      </div>
    );
  }

  return <div className={styles.errorPage}><p>알 수 없는 상태입니다.</p></div>;
}
