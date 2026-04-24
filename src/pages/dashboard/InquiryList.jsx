import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronDown, Send, X, ExternalLink } from 'lucide-react';
import * as clientService from '../../api/clientService';
import { toast } from '../../store/toastStore';
import Pagination from '../../components/Pagination';
import { SkeletonLine } from '../../components/Skeleton';
import styles from './InquiryList.module.css';

const STATUS_TABS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기 중' },
  { value: 'answered', label: '답변 완료' },
  { value: 'closed', label: '종료' },
];

const CATEGORY_LABELS = {
  matching: '매칭',
  profile_edit: '프로필 수정',
  schedule: '일정',
  payment: '입금/결제',
  other: '기타',
};

const STATUS_LABELS = {
  pending: '대기 중',
  answered: '답변 완료',
  closed: '종료',
};

// SLA left-bar tone per status
const SLA_BAR = {
  pending: 'var(--amber-600)',
  answered: 'var(--mint-600)',
  closed: 'var(--ink-200)',
};

// Category badge tone
const CATEGORY_TONE = {
  schedule: { bg: 'var(--amber-100)', color: 'var(--amber-600)' },
  payment: { bg: 'var(--mint-100)', color: 'var(--mint-600)' },
  matching: { bg: 'var(--tangerine-100)', color: 'var(--tangerine-700)' },
  profile_edit: { bg: 'var(--lilac-100)', color: 'var(--lilac-600)' },
  other: { bg: 'var(--ink-50)', color: 'var(--ink-400)' },
};

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function InquiryList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchList = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await clientService.listInquiries({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        limit: pagination.limit,
      });
      setItems(res.content || res.data || []);
      setPagination((prev) => ({ ...prev, ...res.pagination, page }));
    } catch (err) {
      toast.error(err.message || '문의 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter, pagination.limit]);

  useEffect(() => {
    fetchList(1);
  }, [statusFilter, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      setAnswerText('');
      return;
    }
    setExpandedId(id);
    setDetail(null);
    setAnswerText('');
    setDetailLoading(true);
    try {
      const d = await clientService.getInquiry(id);
      setDetail(d);
    } catch (err) {
      toast.error(err.message || '문의 상세를 불러오지 못했습니다.');
      setExpandedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!answerText.trim() || !expandedId) return;
    setSubmitting(true);
    try {
      await clientService.answerInquiry(expandedId, answerText.trim());
      toast.success('답변이 등록되었습니다.');
      setAnswerText('');
      await fetchList(pagination.page);
      const d = await clientService.getInquiry(expandedId);
      setDetail(d);
    } catch (err) {
      toast.error(err.message || '답변 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!expandedId) return;
    if (!window.confirm('이 문의를 종료하시겠습니까?')) return;
    setClosing(true);
    try {
      await clientService.closeInquiry(expandedId);
      toast.success('문의가 종료되었습니다.');
      setExpandedId(null);
      setDetail(null);
      await fetchList(pagination.page);
    } catch (err) {
      toast.error(err.message || '문의 종료에 실패했습니다.');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>문의 관리</h1>
        <p className={styles.pageSubtitle}>회원이 등록한 문의를 확인하고 답변합니다</p>
      </div>

      {/* ── Status chip filter row ── */}
      <div className={styles.chipRow}>
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            className={`${styles.chip} ${statusFilter === value ? styles.chipActive : ''}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
        {/* category select — kept for function parity */}
        <select
          className={styles.categorySelect}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">전체 유형</option>
          {Object.entries(CATEGORY_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {/* ── List ── */}
      <div className={styles.listWrap}>
        {isLoading ? (
          <div className={styles.skeletonWrap}>
            {[...Array(5)].map((_, i) => <SkeletonLine key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <MessageSquare size={32} strokeWidth={1.2} />
            <p>등록된 문의가 없습니다.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {items.map((item) => {
              const isOpen = expandedId === item.id;
              const catTone = CATEGORY_TONE[item.category] || CATEGORY_TONE.other;
              const slaColor = SLA_BAR[item.status] || 'var(--ink-200)';

              return (
                <div
                  key={item.id}
                  className={`${styles.card} ${isOpen ? styles.cardOpen : ''}`}
                  style={{ '--sla-color': slaColor }}
                >
                  {/* SLA 3px left bar */}
                  <div className={styles.slaBar} />

                  {/* ── Summary row (accordion trigger) ── */}
                  <button
                    className={styles.cardHeader}
                    onClick={() => handleExpand(item.id)}
                    aria-expanded={isOpen}
                  >
                    <div className={styles.headerTop}>
                      {/* category badge */}
                      <span
                        className={styles.catBadge}
                        style={{ background: catTone.bg, color: catTone.color }}
                      >
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      {/* status badge */}
                      <span className={`${styles.statusBadge} ${styles[`status_${item.status}`]}`}>
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                      {item.matchId && (
                        <span className={styles.matchBadge}>매칭</span>
                      )}
                      <span className={styles.elapsed}>{formatDate(item.createdAt)}</span>
                      <ChevronDown
                        size={15}
                        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                      />
                    </div>
                    <div className={styles.headerBottom}>
                      <span className={styles.clientName}>{item.clientName}</span>
                      <span className={styles.itemTitle}>{item.title}</span>
                    </div>
                  </button>

                  {/* ── Expanded body ── */}
                  {isOpen && (
                    <div className={styles.cardBody}>
                      {detailLoading || !detail ? (
                        <div className={styles.skeletonInner}>
                          <SkeletonLine />
                          <SkeletonLine />
                        </div>
                      ) : (
                        <>
                          {/* inquiry content */}
                          <div className={styles.detailSection}>
                            <p className={styles.sectionLabel}>문의 내용</p>
                            <p className={styles.detailContent}>{detail.content}</p>
                            <p className={styles.detailMeta}>등록일 {formatDate(detail.createdAt)}</p>
                            {detail.matchId && (
                              <button
                                className={styles.matchLink}
                                onClick={() => navigate(`/dashboard/matches/${detail.matchId}`)}
                              >
                                <ExternalLink size={12} />
                                해당 매칭 보기
                              </button>
                            )}
                          </div>

                          {/* existing answer */}
                          {detail.answer && (
                            <div className={styles.answerSection}>
                              <p className={styles.sectionLabel}>답변</p>
                              <p className={styles.detailContent}>{detail.answer}</p>
                              <p className={styles.detailMeta}>답변일 {formatDate(detail.answeredAt)}</p>
                            </div>
                          )}

                          {/* answer form — pending only */}
                          {detail.status === 'pending' && (
                            <div className={styles.answerForm}>
                              <textarea
                                className={styles.answerTextarea}
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                placeholder="답변을 입력해주세요."
                                rows={4}
                              />
                              <div className={styles.answerActions}>
                                <button
                                  className={styles.closeBtn}
                                  onClick={handleClose}
                                  disabled={closing}
                                >
                                  <X size={13} />
                                  {closing ? '처리 중...' : '문의 종료'}
                                </button>
                                <button
                                  className={styles.submitBtn}
                                  onClick={handleAnswer}
                                  disabled={!answerText.trim() || submitting}
                                >
                                  <Send size={13} />
                                  {submitting ? '등록 중...' : '답변 등록'}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* answered — close only */}
                          {detail.status === 'answered' && (
                            <div className={styles.answerActions}>
                              <button
                                className={styles.closeBtn}
                                onClick={handleClose}
                                disabled={closing}
                              >
                                <X size={13} />
                                {closing ? '처리 중...' : '문의 종료'}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isLoading && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => fetchList(p)}
        />
      )}
    </div>
  );
}
