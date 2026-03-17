import { useEffect, useState } from 'react';
import { Plus, Copy, Trash2, Mail, X, Pencil } from 'lucide-react';
import useInviteStore from '../../store/inviteStore';
import { updateInviteLabel } from '../../api/inviteService';
import { toast } from '../../store/toastStore';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import Pagination from '../../components/Pagination';
import { SkeletonListItem } from '../../components/Skeleton';
import styles from './InviteManagement.module.css';

export default function InviteManagement() {
  const { invites, isLoading, page, totalPages, statusFilter, fetchInvites, createInvite, revokeInvite, setStatusFilter } = useInviteStore();
  const [label, setLabel] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [showDesc, setShowDesc] = useState(() => localStorage.getItem('hideInviteDesc') !== '1');

  useEffect(() => {
    fetchInvites({ page: 1, status: statusFilter || undefined });
  }, [fetchInvites, statusFilter]);

  const handleCreateClick = () => {
    setShowCreateConfirm(true);
  };

  const handleCreateConfirm = async () => {
    setShowCreateConfirm(false);
    try {
      await createInvite({ label: label || undefined });
      setLabel('');
      fetchInvites({ page: 1, status: statusFilter || undefined });
      toast.success('초대 링크가 생성되었습니다.');
    } catch (err) {
      toast.error(err.message || '초대 링크 생성에 실패했습니다.');
    }
  };

  const handleCopy = (invite) => {
    const token = invite.token || invite.id;
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
    toast.success('링크가 복사되었습니다.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeInvite(revokeTarget.id);
      toast.success('초대 링크가 폐기되었습니다.');
    } catch (err) {
      toast.error(err.message || '초대 링크 폐기에 실패했습니다.');
    }
    setRevokeTarget(null);
  };

  const handleStartEdit = (invite) => {
    setEditingId(invite.id);
    setEditingLabel(invite.label || '');
  };

  const handleSaveLabel = async (inviteId) => {
    try {
      await updateInviteLabel(inviteId, editingLabel);
      toast.success('라벨이 수정되었습니다.');
      fetchInvites({ page, status: statusFilter || undefined });
    } catch (err) {
      toast.error(err.message || '라벨 수정에 실패했습니다.');
    }
    setEditingId(null);
  };

  const handleLabelKeyDown = (e, inviteId) => {
    if (e.key === 'Enter') handleSaveLabel(inviteId);
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>초대 관리</h1>

      {showDesc && (
        <div className={styles.descBox}>
          <div className={styles.descHeader}>
            <p className={styles.descTitle}>회원 초대란?</p>
            <button
              className={styles.descClose}
              onClick={() => { setShowDesc(false); localStorage.setItem('hideInviteDesc', '1'); }}
            >
              <X size={14} />
            </button>
          </div>
          <p className={styles.descText}>
            소개를 희망하는 분(회원)에게 초대 링크를 전달하면, 상대방이 프로필을 직접 등록할 수 있습니다.
            라벨을 붙여 어떤 용도로 생성한 링크인지 관리하고, 더 이상 필요 없는 링크는 폐기하세요.
          </p>
        </div>
      )}

      <div className={styles.createBox}>
        <div className={styles.createRow}>
          <input
            className={styles.labelInput}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (선택, 예: 홍길동 소개용)"
          />
          <button className={styles.createBtn} onClick={handleCreateClick}>
            <Plus size={16} /> 생성
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">상태 전체</option>
          <option value="active">활성</option>
          <option value="revoked">폐기</option>
        </select>
      </div>

      {isLoading ? (
        <div className={styles.list}>{[1, 2, 3].map((i) => <SkeletonListItem key={i} />)}</div>
      ) : invites.length === 0 ? (
        <div className={styles.empty}>
          <Mail size={40} strokeWidth={1} />
          <p>생성된 초대가 없습니다.</p>
        </div>
      ) : (
        <>
          <div className={styles.list}>
            {invites.map((invite) => (
              <div key={invite.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardInfo}>
                    {editingId === invite.id ? (
                      <input
                        className={styles.labelEditInput}
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onBlur={() => handleSaveLabel(invite.id)}
                        onKeyDown={(e) => handleLabelKeyDown(e, invite.id)}
                        autoFocus
                        placeholder="라벨 입력..."
                      />
                    ) : (
                      <span
                        className={styles.inviteLabel}
                        onClick={() => invite.status === 'active' && handleStartEdit(invite)}
                        title={invite.status === 'active' ? '클릭하여 수정' : ''}
                        style={invite.status === 'active' ? { cursor: 'pointer' } : {}}
                      >
                        {invite.label || '라벨 없음'}
                        {invite.status === 'active' && <Pencil size={12} className={styles.editIcon} />}
                      </span>
                    )}
                    <StatusBadge status={invite.status} />
                  </div>
                  <span className={styles.cardMeta}>
                    생성: {new Date(invite.createdAt).toLocaleDateString('ko-KR')}
                    {invite.useCount != null && ` · 등록 ${invite.useCount}명`}
                  </span>
                </div>
                <div className={styles.cardActions}>
                  {invite.status === 'active' && (
                    <>
                      <button className={styles.iconBtn} onClick={() => handleCopy(invite)}>
                        <Copy size={14} />
                        {copiedId === invite.id ? '복사됨!' : '복사'}
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.dangerBtn}`}
                        onClick={() => setRevokeTarget(invite)}
                      >
                        <Trash2 size={14} /> 폐기
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={(p) => fetchInvites({ page: p, status: statusFilter || undefined })} />
        </>
      )}

      {showCreateConfirm && (
        <ConfirmModal
          title="초대 링크 생성"
          message="초대 링크 1개를 생성하시겠습니까?"
          confirmLabel="생성"
          onConfirm={handleCreateConfirm}
          onCancel={() => setShowCreateConfirm(false)}
        />
      )}

      {revokeTarget && (
        <ConfirmModal
          title="초대 폐기"
          message="이 초대 링크를 폐기하시겠습니까? 더 이상 사용할 수 없게 됩니다."
          confirmLabel="폐기"
          danger
          onConfirm={handleRevoke}
          onCancel={() => setRevokeTarget(null)}
        />
      )}
    </div>
  );
}
