'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TransferRecord {
  transfer_id: string;
  order_no: string;
  order_date: string;
  effective_date: string;
  subject: string;
  transfer_type: string;
  emp_id: string;
  emp_name: string;
  old_dept_name: string;
  new_dept_name: string;
  old_pos_name?: string;
  new_pos_name?: string;
  old_salary: number;
  new_salary: number;
  order_file: string | null;
  status: string;
  // New fields
  birth_date?: string;
  id_card?: string;
  hire_date?: string;
  promotion_order?: string;
  transfer_command?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'all',      label: 'ทุกสถานะ' },
  { value: 'Pending',  label: 'รออนุมัติ' },
  { value: 'Approved', label: 'อนุมัติแล้ว' },
  { value: 'Rejected', label: 'ไม่อนุมัติ' },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: string; label: string }> = {
    Approved: { cls: 'badge-approved', icon: '✓', label: 'อนุมัติแล้ว' },
    Rejected: { cls: 'badge-rejected', icon: '✕', label: 'ไม่อนุมัติ' },
    Pending:  { cls: 'badge-pending',  icon: '⏳', label: 'รออนุมัติ' },
  };
  const s = map[status] ?? { cls: 'badge-pending', icon: '?', label: status };
  return (
    <span className={`status-badge ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

function formatDate(raw?: string) {
  if (!raw) return '—';
  return raw.split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════════════
function TransfersListPageInner() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { user }      = useAuth();
  const isAdmin       = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role ?? '');

  // ── State ─────────────────────────────────────────────────────────────────
  const [records, setRecords]       = useState<TransferRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [status, setStatus]         = useState(searchParams.get('status') || 'all');
  const [sort, setSort]             = useState<'asc' | 'desc'>(
    (searchParams.get('sort') as 'asc' | 'desc') || 'desc'
  );
  const [page, setPage]             = useState(parseInt(searchParams.get('page') || '1', 10));

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  '10',
        sort,
        ...(status !== 'all' ? { status } : {}),
      });
      const res  = await fetch(`/api/transfers?${params}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.message || 'โหลดข้อมูลไม่สำเร็จ');

      setRecords(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, limit: 10, total: 0 });
    } catch (e: any) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [page, status, sort]);

  useEffect(() => { fetchTransfers(); }, [fetchTransfers]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStatusChange = (val: string) => { setStatus(val); setPage(1); };
  const handleSortToggle   = () => setSort(s => (s === 'desc' ? 'asc' : 'desc'));
  const totalPages         = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="tr2-page">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <h1 className="page-title">ระบบการโยกย้ายพนักงาน</h1>
            <p className="page-subtitle">บันทึกคำสั่งแต่งตั้ง / โยกย้าย / เลื่อนตำแหน่ง</p>
          </div>
          {isAdmin && (
            <button
              id="btn-create-transfer"
              className="btn-primary"
              onClick={() => router.push('/transfers/create')}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              สร้างคำสั่งย้ายใหม่
            </button>
          )}
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────── */}
        <div className="glass-card tr2-filter-bar">
          <div className="tr2-filter-group">
            <label className="tr2-filter-label">สถานะ</label>
            <div className="tr2-status-tabs">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  id={`filter-status-${opt.value}`}
                  className={`tr2-status-tab ${status === opt.value ? 'active' : ''}`}
                  onClick={() => handleStatusChange(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            id="btn-sort-date"
            className="tr2-sort-btn"
            onClick={handleSortToggle}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            เรียงวันที่มีผล: {sort === 'desc' ? 'ล่าสุดก่อน' : 'เก่าก่อน'}
          </button>
        </div>

        {/* ── Table Card ─────────────────────────────────────────────── */}
        <div className="glass-card tr2-table-card">
          {loading ? (
            /* Loading */
            <div className="tr2-state-box">
              <div className="tr2-spinner" />
              <p>กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            /* Error */
            <div className="tr2-state-box tr2-state-error">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p>{error}</p>
              <button className="btn-primary" style={{ marginTop: 8 }} onClick={fetchTransfers}>
                ลองใหม่
              </button>
            </div>
          ) : records.length === 0 ? (
            /* Empty */
            <div className="tr2-state-box">
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" opacity={0.3}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ color: '#94a3b8', marginTop: 12 }}>ไม่มีข้อมูลการโยกย้าย</p>
              {isAdmin && (
                <button className="btn-primary" style={{ marginTop: 12 }}
                  onClick={() => router.push('/transfers/create')}>
                  สร้างคำสั่งย้ายใหม่
                </button>
              )}
            </div>
          ) : (
            /* Data Table */
            <div className="tr2-table-wrap custom-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>เลขที่คำสั่ง</th>
                    <th>ชื่อพนักงาน</th>
                    <th>ตำแหน่ง</th>
                    <th>วันที่มีผล</th>
                    <th>วันเกิด</th>
                    <th>เลขบัตรประชาชน</th>
                    <th>วันที่บรรจุ</th>
                    <th>คำสั่งเลื่อนตำแหน่ง</th>
                    <th>คำสั่งย้าย/โอน</th>
                    <th>สถานะ</th>
                    <th style={{ textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(t => (
                    <tr
                      key={t.transfer_id}
                      id={`row-transfer-${t.transfer_id}`}
                      className="tr2-data-row"
                      onClick={() => router.push(`/transfers/${t.transfer_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="tr2-mono-tag">{t.order_no || '—'}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.emp_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {t.old_pos_name || '—'} → {t.new_pos_name || '—'}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#475569' }}>{t.transfer_type || '—'}</td>
                      <td style={{ fontSize: 13, color: '#0284c7', fontWeight: 500 }}>{t.new_dept_name || '—'}</td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{formatDate(t.effective_date)}</td>
                      <td>{t.birth_date ? formatDate(t.birth_date) : '—'}</td>
                      <td>{t.id_card || '—'}</td>
                      <td>{t.hire_date ? formatDate(t.hire_date) : '—'}</td>
                      <td>{t.promotion_order || '—'}</td>
                      <td>{t.transfer_command || '—'}</td>
                      <td><StatusBadge status={t.status} /></td>
                      <td
                        style={{ textAlign: 'center' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="tr2-actions">
                          {/* View detail */}
                          <button
                            id={`btn-view-${t.transfer_id}`}
                            className="action-btn action-view"
                            title="ดูรายละเอียด"
                            onClick={() => router.push(`/transfers/${t.transfer_id}`)}
                          >
                            <EyeIcon />
                          </button>
                          {/* PDF */}
                          {t.order_file && (
                            <a
                              id={`btn-pdf-${t.transfer_id}`}
                              href={`/uploads/${t.order_file}`}
                              target="_blank"
                              rel="noreferrer"
                              className="action-btn action-file"
                              title="เปิดไฟล์ PDF"
                            >
                              <FileIcon />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────────── */}
          {!loading && !error && records.length > 0 && (
            <div className="tr2-pagination">
              <span className="tr2-pagination-info">
                แสดง {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
                จาก {pagination.total} รายการ
              </span>
              <div className="tr2-pagination-btns">
                <button
                  id="btn-page-prev"
                  className="tr2-page-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >ก่อนหน้า</button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="tr2-page-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        id={`btn-page-${p}`}
                        className={`tr2-page-btn ${page === p ? 'active' : ''}`}
                        onClick={() => setPage(p as number)}
                      >{p}</button>
                    )
                  )}

                <button
                  id="btn-page-next"
                  className="tr2-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >ถัดไป</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width={18} height={18}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Wrap with Suspense (required for useSearchParams in Next.js App Router)
export default function TransfersListPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 16, color: '#64748b' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>กำลังโหลด...</p>
      </div>
    }>
      <TransfersListPageInner />
    </Suspense>
  );
}

const STYLES = `
  .tr2-page { display: flex; flex-direction: column; gap: 24px; padding: 24px; min-height: calc(100vh - 65px); }

  /* Filter bar */
  .tr2-filter-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 24px; flex-wrap: wrap; }
  .tr2-filter-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .tr2-filter-label { font-size: 13px; font-weight: 700; color: #64748b; white-space: nowrap; }
  .tr2-status-tabs { display: flex; gap: 6px; background: #f1f5f9; border-radius: 12px; padding: 4px; }
  .tr2-status-tab { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; background: transparent; color: #64748b; transition: all 0.2s; white-space: nowrap; }
  .tr2-status-tab.active { background: #ffffff; color: #2563eb; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .tr2-sort-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; color: #475569; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
  .tr2-sort-btn:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }

  /* Table */
  .tr2-table-card { padding: 0; overflow: hidden; }
  .tr2-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .tr2-data-row:hover { background: #f8fafc !important; }
  .tr2-mono-tag { font-family: monospace; font-size: 12px; background: #f1f5f9; padding: 3px 8px; border-radius: 6px; color: #64748b; }

  /* Actions */
  .tr2-actions { display: flex; gap: 6px; justify-content: center; }
  .action-btn { width: 34px; height: 34px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; }
  .action-view { background: #f1f5f9; color: #475569; }
  .action-view:hover { background: #e2e8f0; color: #0f172a; }
  .action-file { background: #fdf4ff; color: #9333ea; text-decoration: none; }
  .action-file:hover { background: #f3e8ff; color: #7e22ce; }

  /* Status badge */
  .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid transparent; white-space: nowrap; }
  .badge-pending  { background: #fffbeb; color: #d97706; border-color: rgba(245,158,11,.2); }
  .badge-approved { background: #ecfdf5; color: #059669; border-color: rgba(16,185,129,.2); }
  .badge-rejected { background: #fef2f2; color: #dc2626; border-color: rgba(239,68,68,.2); }

  /* States */
  .tr2-state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 64px 24px; color: #64748b; font-size: 15px; }
  .tr2-state-error { color: #dc2626; }
  .tr2-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Pagination */
  .tr2-pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-top: 1px solid #f1f5f9; background: #f8fafc; flex-wrap: wrap; gap: 12px; }
  .tr2-pagination-info { font-size: 13px; color: #64748b; }
  .tr2-pagination-btns { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
  .tr2-page-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; color: #334155; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .tr2-page-btn:hover:not(:disabled) { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }
  .tr2-page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
  .tr2-page-btn:disabled { opacity: 0.4; cursor: default; }
  .tr2-page-ellipsis { padding: 0 4px; color: #94a3b8; font-size: 14px; }

  @media (max-width: 640px) {
    .tr2-filter-bar { flex-direction: column; align-items: flex-start; }
    .tr2-pagination { flex-direction: column; align-items: flex-start; }
  }
`;
