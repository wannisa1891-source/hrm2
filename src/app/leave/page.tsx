'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { Leave } from '@/services/apiService';

const LEAVE_TYPES = [
  { id: 'L01', name: 'ลาป่วย', color: '#f59e0b' },
  { id: 'L02', name: 'ลากิจ (รับค่าจ้าง)', color: '#6366f1' },
  { id: 'L03', name: 'ลาพักผ่อน (พักร้อน)', color: '#10b981' },
  { id: 'L04', name: 'ลาคลอด', color: '#ec4899' },
  { id: 'L05', name: 'ลาไปช่วยเหลือภริยาที่คลอดบุตร', color: '#8b5cf6' },
  { id: 'L06', name: 'ลาอุปสมบท / ลาไปประกอบพิธีฮัจญ์', color: '#f97316' },
];

export default function LeavePage() {
  const { leaves, loading, error, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();
  const { employees, loadEmployees } = useEmployees();

  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  // Helper function to calculate working days between two dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const timeDiff = d2.getTime() - d1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
  };

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, [loadLeaves, loadEmployees]);

  const filtered = filterStatus ? leaves.filter(l => l.status === filterStatus) : leaves;

  // คำนวณ Stats สำหรับโชว์เป็น Card
  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
  }), [leaves]);

  const handleSubmit = async () => {
    if (!form.emp_id || !form.start_date || !form.end_date) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSaving(true);
    const ok = await addLeave(form);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setForm({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' });
    }
  };

  const statusBadge = (s: string) => {
    const config: Record<string, { bg: string, text: string, label: string }> = {
      Pending: { bg: '#fffbeb', text: '#b45309', label: 'รออนุมัติ' },
      Approved: { bg: '#f0fdf4', text: '#15803d', label: 'อนุมัติแล้ว' },
      Rejected: { bg: '#fef2f2', text: '#b91c1c', label: 'ไม่อนุมัติ' }
    };
    const style = config[s] || { bg: '#f8fafc', text: '#64748b', label: s };

    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.text,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: style.text }} />
        {style.label}
      </span>
    );
  };

  return (
    <AppLayout>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.history.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <span>←</span> ย้อนกลับ
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#e0e7ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', margin: 0 }}>ระบบจัดการการลา</h1>
            </div>
            <p style={{ color: '#64748b', margin: '4px 0 0 44px', fontSize: 14 }}>ติดตามและตรวจสอบคำขอลาของพนักงาน</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          style={{
            background: '#042f2e', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '8px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
          + สร้างใบลาใหม่
        </button>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'รายการทั้งหมด', value: stats.total, color: '#cbd5e1', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
          { label: 'รออนุมัติ', value: stats.pending, color: '#f59e0b', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
          { label: 'อนุมัติแล้ว', value: stats.approved, color: '#10b981', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        ].map((item, i) => (
          <div key={i} style={{ padding: '24px', backgroundColor: 'white', borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>{item.label}</span>
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, marginTop: 12, color: '#0f172a' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'transparent' }}>
        {['', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              border: filterStatus === s ? 'none' : 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: filterStatus === s ? 'white' : 'transparent',
              color: filterStatus === s ? '#2563eb' : '#64748b',
              boxShadow: filterStatus === s ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}>
            {s === '' ? 'ทั้งหมด' : s === 'Pending' ? 'รออนุมัติ' : s === 'Approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table className="data-table">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>พนักงาน</th>
              <th style={{ color: '#64748b', fontWeight: 600 }}>ประเภท</th>
              <th style={{ color: '#64748b', fontWeight: 600 }}>วันที่ลา</th>
              <th style={{ color: '#64748b', fontWeight: 600 }}>เหตุผล</th>
              <th style={{ color: '#64748b', fontWeight: 600 }}>สถานะ</th>
              <th style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>กำลังโหลดข้อมูล...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>ไม่พบข้อมูลรายการลา</td></tr>
            ) : filtered.map(l => (
              <tr key={l.leave_id} className="table-row-hover">
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{l.first_name_th} {l.last_name_th}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{l.dept_name}</div>
                </td>
                <td>
                  <span style={{ fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
                    {LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.name || 'ลาอื่นๆ'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: '#475569' }}>
                  <div style={{ fontWeight: 500 }}>{l.start_date?.split('T')[0]}</div>
                  <div style={{ fontSize: 11, color: '#cbd5e1' }}>ถึง {l.end_date?.split('T')[0]}</div>
                </td>
                <td style={{ fontSize: 13, color: '#64748b', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.reason}
                </td>
                <td>{statusBadge(l.status)}</td>
                <td style={{ textAlign: 'center' }}>
                  {l.status === 'Pending' && (
                    <button onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}
                      style={{
                        padding: '6px 14px', borderRadius: 20, border: '1px solid #cbd5e1',
                        background: 'transparent', color: '#334155', cursor: 'pointer',
                        fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: 13, transition: 'all 0.2s'
                      }}
                      className="hover-btn-outline"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ตรวจสอบคำขอ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ปรับปรุง CSS เล็กน้อยในหัวข้อ Style tag หรือ Global CSS */}
      <style jsx>{`
        .table-row-hover:hover {
          background-color: #f8fafc;
          transition: background-color 0.2s;
        }
        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
      `}</style>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box" style={{ borderRadius: 20, padding: 32 }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 20, color: '#1e293b' }}>สร้างคำขอใบลาใหม่</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#475569' }}>พนักงานที่ต้องการลา</label>
                <select
                  value={form.emp_id}
                  onChange={e => setForm({ ...form, emp_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(emp => (
                    <option key={emp.emp_id} value={emp.emp_id}>
                      {emp.first_name_th} {emp.last_name_th} ({emp.emp_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#475569' }}>ประเภท</label>
                <select
                  value={form.leave_type_id}
                  onChange={e => setForm({ ...form, leave_type_id: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
                >
                  {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#475569' }}>วันเริ่มต้น</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#475569' }}>ถึงวันที่</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#475569' }}>เหตุผลการลา</label>
                <textarea rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="ระบุเหตุผล..." style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 500 }}>ยกเลิก</button>
              <button
                onClick={handleSubmit}
                className="btn-primary"
                disabled={saving}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึกใบลา'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Approval Review Modal */}
      {showReviewModal && selectedLeave && (() => {
        const daysRequested = calculateDays(selectedLeave.start_date, selectedLeave.end_date);
        let quotaTotal = 0;
        let quotaLabel = "";

        // Map leave type to quota
        if (selectedLeave.leave_type_id === 'L02') { quotaTotal = selectedLeave.quota_personal ?? 45; quotaLabel = "สิทธิ์ลากิจ (รับค่าจ้าง)"; }
        else if (selectedLeave.leave_type_id === 'L03') { quotaTotal = selectedLeave.quota_vacation ?? 10; quotaLabel = "สิทธิ์ลาพักผ่อน (พักร้อน)"; }
        else if (selectedLeave.leave_type_id === 'L01') { quotaTotal = selectedLeave.quota_sick ?? 30; quotaLabel = "สิทธิ์ลาป่วย"; }
        else if (selectedLeave.leave_type_id === 'L04') { quotaTotal = 90; quotaLabel = "สิทธิ์ลาคลอด"; }
        else if (selectedLeave.leave_type_id === 'L05') { quotaTotal = 15; quotaLabel = "ลาไปช่วยเหลือภริยาที่คลอดบุตร"; }
        else if (selectedLeave.leave_type_id === 'L06') { quotaTotal = 120; quotaLabel = "ลาอุปสมบท / ลาไปประกอบพิธีฮัจญ์"; }
        else { quotaTotal = 0; quotaLabel = "อื่นๆ"; }

        // Mocking "used leaves" - in real app this requires another DB sum per employee. For demo, we assume 0 used initially.
        const usedSoFar = 0;
        const remaining = quotaTotal - usedSoFar;
        const remainingAfter = remaining - daysRequested;
        const isOverQuota = remainingAfter < 0;

        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReviewModal(false)}>
            <div className="modal-box" style={{ borderRadius: 20, padding: 32, maxWidth: 500 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: '#1e293b' }}>ฟอร์มอนุมัติการลา (Leave Approval)</h2>
                <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 20, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>ผู้ขอลางาน</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>{selectedLeave.first_name_th} {selectedLeave.last_name_th} ({selectedLeave.dept_name})</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>ประเภท</div>
                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{LEAVE_TYPES.find(t => t.id === selectedLeave.leave_type_id)?.name || 'อื่นๆ'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>จำนวนวัน</div>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>{daysRequested} วัน</div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>ระยะเวลา</div>
                  <div style={{ fontSize: 14, color: '#1e293b' }}>{selectedLeave.start_date?.split('T')[0]} <span style={{ color: '#94a3b8' }}>ถึง</span> {selectedLeave.end_date?.split('T')[0]}</div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>เหตุผล</div>
                  <div style={{ fontSize: 14, color: '#1e293b', background: 'white', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}>{selectedLeave.reason || '-'}</div>
                </div>
              </div>

              {/* Quota Check Area */}
              {quotaTotal > 0 && (
                <div style={{ marginBottom: 24, padding: 16, borderRadius: 12, border: isOverQuota ? '1px solid #fecaca' : '1px solid #bbf7d0', background: isOverQuota ? '#fef2f2' : '#f0fdf4' }}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: isOverQuota ? '#b91c1c' : '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isOverQuota ? 'แจ้งเตือน: ใช้วันลาเกินโควตา' : 'ตรวจสอบโควตาวันลา'}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: '#475569' }}>{quotaLabel} ทั้งหมด:</span>
                    <span style={{ fontWeight: 600 }}>{quotaTotal} วัน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: '#475569' }}>ใช้ไปแล้ว:</span>
                    <span style={{ fontWeight: 600 }}>{usedSoFar} วัน</span>
                  </div>
                  <div style={{ height: 1, background: isOverQuota ? '#fca5a5' : '#86efac', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>คงเหลือสุทธิ (ถ้ายอมรับ):</span>
                    <span style={{ fontWeight: 700, color: isOverQuota ? '#ef4444' : '#16a34a' }}>{remainingAfter} วัน</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => { changeLeaveStatus(selectedLeave.leave_id, 'Rejected'); setShowReviewModal(false); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 15, transition: 'all 0.2s' }}
                >
                  ไม่อนุมัติ
                </button>
                <button
                  onClick={() => { changeLeaveStatus(selectedLeave.leave_id, 'Approved'); setShowReviewModal(false); }}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 15, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
                >
                  อนุมัติการลา
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </AppLayout>
  );
}