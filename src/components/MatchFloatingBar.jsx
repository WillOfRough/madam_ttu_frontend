import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, AlertTriangle, Info } from 'lucide-react';
import useClientListStore from '../store/clientListStore';
import * as matchService from '../api/matchService';
import { toast } from '../store/toastStore';
import StatusBadge from './StatusBadge';
import ConfirmModal from './ConfirmModal';
import TextField from './TextField';
import styles from './MatchFloatingBar.module.css';

export default function MatchFloatingBar() {
  const navigate = useNavigate();
  const { selectedForMatch: selected, toggleSelectForMatch, clearSelectedForMatch } =
    useClientListStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [proposerMessage, setProposerMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [duplicateMatch, setDuplicateMatch] = useState(null);
  const [pairHistory, setPairHistory] = useState([]);
  const [activeMatches, setActiveMatches] = useState({ A: [], B: [], deletedA: [], deletedB: [] });

  const genderValid = selected.length === 2 && selected[0].gender !== selected[1].gender;
  const inactiveClients = selected.filter((c) => (c.status || 'active') !== 'active');

  useEffect(() => {
    if (selected.length === 0) {
      setDuplicateMatch(null);
      setPairHistory([]);
      setActiveMatches({ A: [], B: [], deletedA: [], deletedB: [] });
      return;
    }

    let cancelled = false;
    matchService.listMatches({ size: 200 }).then((res) => {
      if (cancelled) return;
      const list = res.data || res.matches || [];
      const activeStatuses = ['proposal_sent', 'proposal_accepted', 'awaiting_payment', 'scheduling', 'arranging', 'scheduled'];

      if (selected.length === 2) {
        const [a, b] = selected;

        // 중복 매칭 체크 (진행중인 매칭이 있으면 차단)
        const dup = list.find((m) => {
          if (m.status === 'cancelled') return false;
          const ids = [m.clientA.clientId, m.clientB.clientId];
          return ids.includes(a.id) && ids.includes(b.id);
        });
        setDuplicateMatch(dup || null);

        // 과거 이력 체크 (취소, 거절, 에프터 미성사 → 차단)
        const pairMatches = list.filter((m) => {
          const ids = [m.clientA.clientId, m.clientB.clientId];
          return ids.includes(a.id) && ids.includes(b.id);
        });

        const warnings = [];
        for (const m of pairMatches) {
          if (m.status === 'cancelled') {
            warnings.push({ type: 'cancelled', message: '이전에 매칭이 취소된 이력이 있습니다', matchId: m.matchId });
          }
          const rejectedBy = [];
          if (m.clientA.response === 'rejected') rejectedBy.push(m.clientA.clientName);
          if (m.clientB.response === 'rejected') rejectedBy.push(m.clientB.clientName);
          if (rejectedBy.length > 0) {
            warnings.push({ type: 'rejected', message: `${rejectedBy.join(', ')}이(가) 프로포절을 거절한 이력이 있습니다`, matchId: m.matchId });
          }
          if (m.afterStatus === 'rejected') {
            warnings.push({ type: 'after_rejected', message: '만남 후 애프터가 미성사된 이력이 있습니다', matchId: m.matchId });
          }
        }
        setPairHistory(warnings);
      } else {
        setDuplicateMatch(null);
        setPairHistory([]);
      }

      // 개별 회원 진행중 매칭 체크 (삭제된 회원과의 매칭 분리)
      const findActive = (clientId) => {
        if (!clientId) return [];
        const all = list.filter((m) =>
          activeStatuses.includes(m.status) &&
          (m.clientA.clientId === clientId || m.clientB.clientId === clientId)
        );
        const normal = all.filter((m) => !m.clientA.deleted && !m.clientB.deleted);
        const deleted = all.filter((m) => m.clientA.deleted || m.clientB.deleted);
        return { normal, deleted };
      };
      const activeA = findActive(selected[0]?.id);
      const activeB = findActive(selected[1]?.id);
      setActiveMatches({
        A: activeA.normal || [],
        B: activeB.normal || [],
        deletedA: activeA.deleted || [],
        deletedB: activeB.deleted || [],
      });
    }).catch(() => {
      if (!cancelled) {
        setDuplicateMatch(null);
        setPairHistory([]);
        setActiveMatches({ A: [], B: [], deletedA: [], deletedB: [] });
      }
    });
    return () => { cancelled = true; };
  }, [selected]);

  const handleCreateMatch = async () => {
    if (selected.length !== 2 || !genderValid) return;
    setCreating(true);
    try {
      const [a, b] = selected;
      const created = await matchService.createMatch({ clientAId: a.id, clientBId: b.id, proposerMessage });
      toast.success(`${a.nickname || a.name} ↔ ${b.nickname || b.name} 매칭이 생성되었습니다.`);
      clearSelectedForMatch();
      setProposerMessage('');
      setShowConfirm(false);
      navigate(created?.matchId ? `/dashboard/matches/${created.matchId}` : '/dashboard/matches');
    } catch (err) {
      toast.error(err.message || '매칭 생성에 실패했습니다.');
    }
    setCreating(false);
  };

  if (selected.length === 0) return null;

  const hasBlockingIssue = !!duplicateMatch || pairHistory.length > 0 || inactiveClients.length > 0;
  const createDisabled = selected.length !== 2 || !genderValid || creating || hasBlockingIssue;

  return (
    <>
      <div className={styles.bar}>
        <div className={styles.content}>
          <div className={styles.left}>
            <div className={styles.names}>
              {selected.map((c) => (
                <span key={c.id} className={styles.chip}>
                  {c.nickname || c.name}
                  <span className={c.gender === 'female' ? styles.chipGenderF : styles.chipGenderM}>
                    {c.gender === 'female' ? '여' : '남'}
                  </span>
                  <button className={styles.chipRemove} onClick={() => toggleSelectForMatch(c)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              {selected.length === 1 && <span className={styles.hint}>1명 더 선택하세요</span>}
            </div>

            {selected.length === 2 && !genderValid && (
              <div className={styles.warning}>
                <AlertTriangle size={12} /> 같은 성별은 매칭할 수 없습니다
              </div>
            )}

            {duplicateMatch && (
              <div className={styles.warning}>
                <AlertTriangle size={12} /> 이미 진행 중인 매칭이 있습니다
                <button
                  className={styles.warningLink}
                  onClick={() => navigate(`/dashboard/matches/${duplicateMatch.matchId}`)}
                >
                  확인하기
                </button>
              </div>
            )}

            {pairHistory.length > 0 && !duplicateMatch && (
              <div className={styles.warning}>
                <AlertTriangle size={12} />
                {pairHistory.map((w, i) => (
                  <span key={i}>
                    {w.message}
                    <button
                      className={styles.warningLink}
                      onClick={() => navigate(`/dashboard/matches/${w.matchId}`)}
                    >
                      확인
                    </button>
                  </span>
                ))}
              </div>
            )}

            {(activeMatches.A.length > 0 || activeMatches.B.length > 0) && !duplicateMatch && !pairHistory.length && (
              <div className={styles.info}>
                <Info size={12} />
                {selected[0] && activeMatches.A.length > 0 && (
                  <span>{selected[0].nickname || selected[0].name}: 진행 중 {activeMatches.A.length}건</span>
                )}
                {selected[1] && activeMatches.B.length > 0 && (
                  <span>{selected[1].nickname || selected[1].name}: 진행 중 {activeMatches.B.length}건</span>
                )}
              </div>
            )}

            {inactiveClients.length > 0 && (
              <div className={styles.warning}>
                <AlertTriangle size={12} />
                <span>{inactiveClients.map((c) => c.nickname || c.name).join(', ')} 회원이 비활성/휴면 상태입니다. 매칭할 수 없습니다.</span>
              </div>
            )}

            {(activeMatches.deletedA.length > 0 || activeMatches.deletedB.length > 0) && !duplicateMatch && (
              <div className={styles.warning}>
                <AlertTriangle size={12} />
                <span>삭제된 회원과의 진행 중 매칭 {activeMatches.deletedA.length + activeMatches.deletedB.length}건 (매칭 상세에서 취소 가능)</span>
              </div>
            )}
          </div>
          <div className={styles.actions}>
            <button
              className={styles.createBtn}
              disabled={createDisabled}
              onClick={() => setShowConfirm(true)}
            >
              <Heart size={14} /> 매칭 만들기
            </button>
            <button className={styles.cancelBtn} onClick={clearSelectedForMatch}>
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      {showConfirm && selected.length === 2 && (
        <ConfirmModal
          title="매칭 생성"
          message={`${selected[0].nickname || selected[0].name}(${selected[0].gender === 'female' ? '여' : '남'}) ↔ ${selected[1].nickname || selected[1].name}(${selected[1].gender === 'female' ? '여' : '남'}) 매칭을 생성하시겠습니까?`}
          confirmLabel="매칭 생성"
          cancelLabel="돌아가기"
          onConfirm={handleCreateMatch}
          onCancel={() => { setShowConfirm(false); setProposerMessage(''); }}
        >
          <TextField
            label={`${selected[0].nickname || selected[0].name}님께 보낼 한마디`}
            required={false}
            hint={`매칭 성사율을 높이고 싶다면 한마디를 남겨보세요. 제안 문자와 프로필 확인 화면 상단에 표시돼요. (${selected[1].nickname || selected[1].name}님에게는 보이지 않아요)`}
            multiline
            maxLength={100}
            value={proposerMessage}
            onChange={setProposerMessage}
            placeholder="예) 오래 기다리셨죠? 꼭 맞을 분을 찾았어요. 한번 확인해보세요!"
          />
        </ConfirmModal>
      )}
    </>
  );
}
