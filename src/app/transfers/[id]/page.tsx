'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TransferDetail {
  transfer_id: string;
  order_no: string;
  order_date: string;
  effective_date: string;
  subject: string;
  transfer_type: string;
  emp_id: string;
  emp_name: string;
  emp_image?: string | null;
  old_dept_name: string;
  new_dept_name: string;
  old_pos_name: string;
  new_pos_name: string;
  old_level?: string;
  new_level?: string;
  remark?: string;
  status: string;
  file_url: string | null;
  order_file: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(raw?: string) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw.split('T')[0];
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatMoney(val?: number | null) {
  if (val == null) return '—';
  return val.toLocaleString('th-TH') + ' บาท';
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    Approved: { cls: 'badge-approved', label: 'อนุมัติแล้ว' },
    Rejected: { cls: 'badge-rejected', label: 'ไม่อนุมัติ' },
    Pending:  { cls: 'badge-pending',  label: 'รออนุมัติ' },
  };
  const s = map[status] ?? { cls: 'badge-pending', label: status };
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
}

// ─── Comparison Row ───────────────────────────────────────────────────────────
function CompareRow({ label, oldVal, newVal }: { label: string; oldVal?: string | null; newVal?: string | null }) {
  const changed = oldVal && newVal && oldVal !== newVal;
  return (
    <div className="td-compare-row">
      <span className="td-compare-label">{label}</span>
      <span className="td-compare-old">{oldVal || '—'}</span>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={changed ? '#3b82f6' : '#cbd5e1'} style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className={`td-compare-new ${changed ? 'changed' : ''}`}>{newVal || '—'}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function TransferDetailPage() {
  const params  = useParams<{ id: string }>();
  const router  = useRouter();
  const id      = params?.id;

  const [transfer, setTransfer] = useState<TransferDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res  = await fetch(`/api/transfers/${id}`, { signal: controller.signal });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'ไม่พบข้อมูล');
        setTransfer(json.data);
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [id]);

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="td-page">

        {/* ── Back button + title ─────────────────────────────────────── */}
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              id="btn-back"
              className="td-back-btn"
              title="กลับไปรายการโยกย้าย"
              aria-label="กลับไปรายการโยกย้าย"
              onClick={() => router.push('/transfers')}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="page-title">รายละเอียดคำสั่งย้าย</h1>
              <p className="page-subtitle">
                {loading ? 'กำลังโหลด...' : transfer?.order_no ?? 'ไม่พบข้อมูล'}
              </p>
            </div>
          </div>
          {/* Open PDF button */}
          {transfer?.file_url && (
            <a
              id="btn-open-pdf"
              href={transfer.file_url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary td-pdf-btn"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              เปิดไฟล์ PDF (คำสั่ง)
            </a>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="td-state-box">
            <div className="td-spinner" />
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────────────── */}
        {!loading && error && (
          <div className="td-state-box td-state-error">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p>{error}</p>
            <button className="btn-primary" style={{ marginTop: 8 }}
              onClick={() => router.push('/transfers')}>
              กลับสู่รายการ
            </button>
          </div>
        )}

        {/* ── Content ────────────────────────────────────────────────── */}
        {!loading && !error && transfer && (
          <>
            {/* Order Info Card */}
            <div className="glass-card td-card">
              <div className="td-card-header">
                <div className="td-card-icon td-icon-blue">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="td-card-title">ข้อมูลคำสั่ง</h2>
                <div style={{ marginLeft: 'auto' }}>
                  <StatusBadge status={transfer.status} />
                </div>
              </div>
              <div className="td-info-grid">
                <div className="td-info-item">
                  <span className="td-info-label">เลขที่คำสั่ง</span>
                  <span className="td-info-value mono">{transfer.order_no || '—'}</span>
                </div>
                <div className="td-info-item">
                  <span className="td-info-label">วันที่ออกคำสั่ง</span>
                  <span className="td-info-value">{formatDate(transfer.order_date)}</span>
                </div>
                <div className="td-info-item">
                  <span className="td-info-label">วันที่มีผล</span>
                  <span className="td-info-value highlight">{formatDate(transfer.effective_date)}</span>
                </div>
                <div className="td-info-item">
                  <span className="td-info-label">ประเภทคำสั่ง</span>
                  <span className="td-info-value">{transfer.transfer_type || '—'}</span>
                </div>
                <div className="td-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="td-info-label">เรื่อง</span>
                  <span className="td-info-value">{transfer.subject || '—'}</span>
                </div>
              </div>
            </div>

            {/* Employee Card */}
            <div className="glass-card td-card">
              <div className="td-card-header">
                <div className="td-card-icon td-icon-purple">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="td-card-title">ผู้ถูกคำสั่ง</h2>
              </div>
              <div className="td-employee-row">
                {transfer.emp_image ? (
                  <img
                    src={`/uploads/${transfer.emp_image}`}
                    alt={transfer.emp_name}
                    className="td-emp-avatar"
                  />
                ) : (
                  <div className="td-emp-avatar td-emp-avatar-placeholder">
                    {transfer.emp_name?.charAt(0) ?? '?'}
                  </div>
                )}
                <div>
                  <div className="td-emp-name">{transfer.emp_name || '—'}</div>
                  <div className="td-emp-id">รหัส: {transfer.emp_id}</div>
                </div>
              </div>
            </div>

            {/* Change Summary Card */}
            <div className="glass-card td-card">
              <div className="td-card-header">
                <div className="td-card-icon td-icon-teal">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h2 className="td-card-title">รายละเอียดการเปลี่ยนแปลง</h2>
              </div>

              {/* Column headers */}
              <div className="td-compare-head">
                <span>รายการ</span>
                <span>ข้อมูลเดิม</span>
                <span />
                <span>ข้อมูลใหม่</span>
              </div>

              <div className="td-compare-body">
                <CompareRow
                  label="สังกัด / แผนก"
                  oldVal={transfer.old_dept_name}
                  newVal={transfer.new_dept_name}
                />
                <CompareRow
                  label="ตำแหน่ง"
                  oldVal={transfer.old_pos_name}
                  newVal={transfer.new_pos_name}
                />
                <CompareRow
                  label="ระดับ"
                  oldVal={transfer.old_level}
                  newVal={transfer.new_level}
                />

              </div>
            </div>

            {/* Remark */}
            {transfer.remark && (
              <div className="glass-card td-card">
                <div className="td-card-header">
                  <div className="td-card-icon td-icon-amber">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                  <h2 className="td-card-title">หมายเหตุ</h2>
                </div>
                <p className="td-remark">{transfer.remark}</p>
              </div>
            )}

            {/* PDF attachment notice (if no button at top) */}
            {!transfer.file_url && (
              <div className="td-no-pdf">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ไม่มีไฟล์เอกสารแนบสำหรับคำสั่งนี้
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  .td-page { display: flex; flex-direction: column; gap: 20px; padding: 24px; min-height: calc(100vh - 65px); }

  /* Back button */
  .td-back-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all 0.2s; flex-shrink: 0; }
  .td-back-btn:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }

  /* PDF button */
  .td-pdf-btn { display: flex; align-items: center; gap: 8px; text-decoration: none; }

  /* Card */
  .td-card { padding: 0; overflow: hidden; }
  .td-card-header { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
  .td-card-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .td-icon-blue   { background: #eff6ff; color: #2563eb; }
  .td-icon-purple { background: #faf5ff; color: #7c3aed; }
  .td-icon-teal   { background: #f0fdfa; color: #0d9488; }
  .td-icon-amber  { background: #fffbeb; color: #d97706; }
  .td-card-title { font-size: 17px; font-weight: 800; color: #0f172a; }

  /* Info grid */
  .td-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; }
  .td-info-item { display: flex; flex-direction: column; gap: 6px; padding: 20px 24px; border-bottom: 1px solid #f8fafc; }
  .td-info-item:nth-child(odd) { border-right: 1px solid #f8fafc; }
  .td-info-label { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
  .td-info-value { font-size: 16px; font-weight: 600; color: #1e293b; }
  .td-info-value.mono { font-family: monospace; font-size: 15px; color: #475569; }
  .td-info-value.highlight { color: #2563eb; }

  /* Employee row */
  .td-employee-row { display: flex; align-items: center; gap: 20px; padding: 24px; }
  .td-emp-avatar { width: 64px; height: 64px; border-radius: 20px; object-fit: cover; flex-shrink: 0; }
  .td-emp-avatar-placeholder { width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; font-size: 24px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .td-emp-name { font-size: 20px; font-weight: 800; color: #0f172a; }
  .td-emp-id { font-size: 14px; color: #64748b; margin-top: 4px; }

  /* Compare section */
  .td-compare-head { display: grid; grid-template-columns: 140px 1fr 24px 1fr; gap: 12px; padding: 12px 24px; background: #f8fafc; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #f1f5f9; }
  .td-compare-body { display: flex; flex-direction: column; }
  .td-compare-row { display: grid; grid-template-columns: 140px 1fr 24px 1fr; gap: 12px; padding: 16px 24px; align-items: center; border-bottom: 1px solid #f8fafc; transition: background 0.15s; }
  .td-compare-row:last-child { border-bottom: none; }
  .td-compare-row:hover { background: #fafbfc; }
  .td-compare-label { font-size: 13px; font-weight: 700; color: #475569; }
  .td-compare-old { font-size: 14px; color: #64748b; background: #f1f5f9; padding: 8px 14px; border-radius: 10px; text-align: center; }
  .td-compare-new { font-size: 14px; color: #475569; background: #f8fafc; padding: 8px 14px; border-radius: 10px; text-align: center; border: 1px solid #e2e8f0; }
  .td-compare-new.changed { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; font-weight: 700; }

  /* Remark */
  .td-remark { padding: 20px 24px; font-size: 15px; color: #334155; line-height: 1.7; margin: 0; }

  /* No PDF notice */
  .td-no-pdf { display: flex; align-items: center; gap: 10px; padding: 16px 20px; background: #f8fafc; border-radius: 16px; border: 1px dashed #e2e8f0; color: #94a3b8; font-size: 14px; }

  /* States */
  .td-state-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 24px; color: #64748b; font-size: 15px; }
  .td-state-error { color: #dc2626; }
  .td-spinner { width: 44px; height: 44px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Badge */
  .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid transparent; white-space: nowrap; }
  .badge-pending  { background: #fffbeb; color: #d97706; border-color: rgba(245,158,11,.2); }
  .badge-approved { background: #ecfdf5; color: #059669; border-color: rgba(16,185,129,.2); }
  .badge-rejected { background: #fef2f2; color: #dc2626; border-color: rgba(239,68,68,.2); }

  @media (max-width: 640px) {
    .td-info-grid { grid-template-columns: 1fr; }
    .td-info-item:nth-child(odd) { border-right: none; }
    .td-compare-head, .td-compare-row { grid-template-columns: 120px 1fr 20px 1fr; gap: 8px; }
  }
`;
