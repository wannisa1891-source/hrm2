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
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const timeDiff = d2.getTime() - d1.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, [loadLeaves, loadEmployees]);

  const filtered = useMemo(() => {
    let result = leaves;
    if (filterStatus) result = result.filter(l => l.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(l =>
        `${l.first_name_th} ${l.last_name_th}`.toLowerCase().includes(q) ||
        (l.dept_name && l.dept_name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [leaves, filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
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
        backgroundColor: style.bg, color: style.text,
        padding: '4px 10px', borderRadius: '20px', fontSize: '12px',
        fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: style.text }} />
        {style.label}
      </span>
    );
  };

  // Shared label style
  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: '#475569' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', fontSize: 14 };

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: '#e0e7ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>ระบบจัดการการลา</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>ติดตามและตรวจสอบคำขอลาของพนักงาน</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          background: '#0f766e', color: 'white', border: 'none',
          padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          สร้างใบลาใหม่
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'รายการทั้งหมด', value: stats.total, color: '#64748b', bg: '#f8fafc', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'รออนุมัติ', value: stats.pending, color: '#d97706', bg: '#fffbeb', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'อนุมัติแล้ว', value: stats.approved, color: '#059669', bg: '#ecfdf5', iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'ไม่อนุมัติ', value: stats.rejected, color: '#dc2626', bg: '#fef2f2', iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map((item, i) => (
          <div key={i} style={{
            padding: '16px 20px', backgroundColor: 'white', borderRadius: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>{item.label}</span>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} /></svg>
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6, color: '#0f172a' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + Search Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
          {[
            { key: '', label: 'ทั้งหมด' },
            { key: 'Pending', label: 'รออนุมัติ' },
            { key: 'Approved', label: 'อนุมัติแล้ว' },
            { key: 'Rejected', label: 'ไม่อนุมัติ' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilterStatus(tab.key)} style={{
              padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              backgroundColor: filterStatus === tab.key ? 'white' : 'transparent',
              color: filterStatus === tab.key ? '#0f172a' : '#64748b',
              boxShadow: filterStatus === tab.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s'
            }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="ค้นหาพนักงาน..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '7px 12px 7px 32px', borderRadius: 8, border: '1px solid #e2e8f0',
              fontSize: 13, outline: 'none', width: 220, background: 'white'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <table className="data-table" style={{ width: '100%' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>พนักงาน</th>
              <th style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>ประเภท</th>
              <th style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>วันที่ลา</th>
              <th style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>จำนวนวัน</th>
              <th style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'left' }}>เหตุผล</th>
              <th style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>สถานะ</th>
              <th style={{ color: '#64748b', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>กำลังโหลดข้อมูล...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 14 }}>ไม่พบข้อมูลรายการลา</td></tr>
            ) : filtered.map(l => (
              <tr key={l.leave_id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{l.first_name_th} {l.last_name_th}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{l.dept_name}</div>
                </td>
                <td>
                  <span style={{ fontSize: 12, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                    {LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.name || 'ลาอื่นๆ'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: '#475569' }}>
                  <div>{l.start_date?.split('T')[0]}</div>
                  <div style={{ fontSize: 11, color: '#cbd5e1' }}>ถึง {l.end_date?.split('T')[0]}</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                    {calculateDays(l.start_date, l.end_date)}
                  </span>
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 2 }}>วัน</span>
                </td>
                <td style={{ fontSize: 13, color: '#64748b', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.reason || '-'}
                </td>
                <td style={{ textAlign: 'center' }}>{statusBadge(l.status)}</td>
                <td style={{ textAlign: 'center' }}>
                  {l.status === 'Pending' && (
                    <button onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}
                      style={{
                        padding: '5px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                        background: 'white', color: '#334155', cursor: 'pointer',
                        fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 12, transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ตรวจสอบคำขอ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Leave Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box" style={{ borderRadius: 16, padding: 28, maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>สร้างคำขอใบลาใหม่</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>พนักงาน</label>
                <select value={form.emp_id} onChange={e => setForm({ ...form, emp_id: e.target.value })} style={inputStyle}>
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(emp => (
                    <option key={emp.emp_id} value={emp.emp_id}>{emp.first_name_th} {emp.last_name_th} ({emp.emp_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>ประเภทการลา</label>
                <select value={form.leave_type_id} onChange={e => setForm({ ...form, leave_type_id: e.target.value })} style={inputStyle}>
                  {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>วันเริ่มต้น</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ถึงวันที่</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>เหตุผลการลา</label>
                <textarea rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="ระบุเหตุผล..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 13, color: '#475569' }}>ยกเลิก</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                padding: '8px 16px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: 13, opacity: saving ? 0.7 : 1, background: '#0f766e', color: 'white'
              }}>
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

        if (selectedLeave.leave_type_id === 'L02') { quotaTotal = selectedLeave.quota_personal ?? 45; quotaLabel = "สิทธิ์ลากิจ (รับค่าจ้าง)"; }
        else if (selectedLeave.leave_type_id === 'L03') { quotaTotal = selectedLeave.quota_vacation ?? 10; quotaLabel = "สิทธิ์ลาพักผ่อน (พักร้อน)"; }
        else if (selectedLeave.leave_type_id === 'L01') { quotaTotal = selectedLeave.quota_sick ?? 30; quotaLabel = "สิทธิ์ลาป่วย"; }
        else if (selectedLeave.leave_type_id === 'L04') { quotaTotal = 90; quotaLabel = "สิทธิ์ลาคลอด"; }
        else if (selectedLeave.leave_type_id === 'L05') { quotaTotal = 15; quotaLabel = "ลาไปช่วยเหลือภริยาที่คลอดบุตร"; }
        else if (selectedLeave.leave_type_id === 'L06') { quotaTotal = 120; quotaLabel = "ลาอุปสมบท / ลาไปประกอบพิธีฮัจญ์"; }
        else { quotaTotal = 0; quotaLabel = "อื่นๆ"; }

        const usedSoFar = 0;
        const remaining = quotaTotal - usedSoFar;
        const remainingAfter = remaining - daysRequested;
        const isOverQuota = remainingAfter < 0;

        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReviewModal(false)}>
            <div className="modal-box" style={{ borderRadius: 16, padding: 28, maxWidth: 480 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>ตรวจสอบคำขออนุมัติลา</h2>
                <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94a3b8', padding: 4 }}>✕</button>
              </div>

              {/* Employee Info */}
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 16, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>ผู้ขอลางาน</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{selectedLeave.first_name_th} {selectedLeave.last_name_th}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{selectedLeave.dept_name}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>ประเภท</div>
                    <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 13 }}>{LEAVE_TYPES.find(t => t.id === selectedLeave.leave_type_id)?.name || 'อื่นๆ'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>จำนวนวัน</div>
                    <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 13 }}>{daysRequested} วัน</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>ระยะเวลา</div>
                    <div style={{ fontSize: 12, color: '#1e293b' }}>{selectedLeave.start_date?.split('T')[0]} - {selectedLeave.end_date?.split('T')[0]}</div>
                  </div>
                </div>

                {selectedLeave.reason && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>เหตุผล</div>
                    <div style={{ fontSize: 13, color: '#334155', background: 'white', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>{selectedLeave.reason}</div>
                  </div>
                )}
              </div>

              {/* Quota Check */}
              {quotaTotal > 0 && (
                <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, border: isOverQuota ? '1px solid #fecaca' : '1px solid #bbf7d0', background: isOverQuota ? '#fef2f2' : '#f0fdf4' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isOverQuota ? '#b91c1c' : '#15803d', marginBottom: 10 }}>
                    {isOverQuota ? 'แจ้งเตือน: ใช้วันลาเกินโควตา' : 'ตรวจสอบโควตาวันลา'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#475569' }}>{quotaLabel} ทั้งหมด:</span>
                    <span style={{ fontWeight: 600 }}>{quotaTotal} วัน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#475569' }}>ใช้ไปแล้ว:</span>
                    <span style={{ fontWeight: 600 }}>{usedSoFar} วัน</span>
                  </div>
                  <div style={{ height: 1, background: isOverQuota ? '#fca5a5' : '#86efac', margin: '6px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>คงเหลือสุทธิ (ถ้ายอมรับ):</span>
                    <span style={{ fontWeight: 700, color: isOverQuota ? '#ef4444' : '#16a34a' }}>{remainingAfter} วัน</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => { changeLeaveStatus(selectedLeave.leave_id, 'Rejected'); setShowReviewModal(false); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.15s' }}
                >
                  ไม่อนุมัติ
                </button>
                <button
                  onClick={() => { changeLeaveStatus(selectedLeave.leave_id, 'Approved'); setShowReviewModal(false); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#0f766e', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.15s' }}
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