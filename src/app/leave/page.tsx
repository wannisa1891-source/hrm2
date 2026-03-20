'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { Leave } from '@/services/apiService';
import Swal from 'sweetalert2';

const LEAVE_TYPES = [
  { id: 'L01', name: 'ลาป่วย', color: '#f59e0b' },
  { id: 'L02', name: 'ลากิจ', color: '#6366f1' },
  { id: 'L03', name: 'ลาพักผ่อน', color: '#10b981' },
  { id: 'L04', name: 'ลาคลอด', color: '#ec4899' },
  { id: 'L05', name: 'ลาช่วยภริยาคลอด', color: '#8b5cf6' },
  { id: 'L06', name: 'ลาอุปสมบท/ฮัจญ์', color: '#f97316' },
];

export default function LeavePage() {
  const { leaves, loading, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();
  const { employees, loadEmployees } = useEmployees();

  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 8;

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24)) + 1;
  };

  useEffect(() => { loadLeaves(); loadEmployees(); }, [loadLeaves, loadEmployees]);
  useEffect(() => { setPage(1); }, [filterStatus, searchQuery]);

  const filtered = useMemo(() => {
    let r = leaves;
    if (filterStatus) r = r.filter(l => l.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      r = r.filter(l => `${l.first_name_th} ${l.last_name_th}`.toLowerCase().includes(q) || l.dept_name?.toLowerCase().includes(q));
    }
    return r;
  }, [leaves, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
    rejected: leaves.filter(l => l.status === 'Rejected').length,
  }), [leaves]);

  const handleSubmit = async () => {
    if (!form.emp_id || !form.start_date || !form.end_date) { 
      Swal.fire('ข้อความแจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning'); 
      return; 
    }
    setSaving(true);
    const ok = await addLeave(form);
    setSaving(false);
    if (ok) { 
      setShowForm(false); 
      setForm({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' }); 
      Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  };

  const badge = (s: string) => {
    const m: Record<string, { bg: string; tx: string; lb: string }> = {
      Pending: { bg: '#fef3c7', tx: '#92400e', lb: 'รออนุมัติ' },
      Approved: { bg: '#d1fae5', tx: '#065f46', lb: 'อนุมัติแล้ว' },
      Rejected: { bg: '#fee2e2', tx: '#991b1b', lb: 'ไม่อนุมัติ' },
    };
    const c = m[s] || { bg: '#f1f5f9', tx: '#475569', lb: s };
    return <span style={{ background: c.bg, color: c.tx, padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{c.lb}</span>;
  };

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  // Card config
  const cards = [
    { key: '', label: 'ทั้งหมด', value: stats.total, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: '#f8fafc', bgA: '#e2e8f0', ic: '#64748b', tx: '#334155', ring: '#94a3b8' },
    { key: 'Pending', label: 'รออนุมัติ', value: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fffbeb', bgA: '#fef3c7', ic: '#d97706', tx: '#92400e', ring: '#f59e0b' },
    { key: 'Approved', label: 'อนุมัติแล้ว', value: stats.approved, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#ecfdf5', bgA: '#d1fae5', ic: '#059669', tx: '#065f46', ring: '#10b981' },
    { key: 'Rejected', label: 'ไม่อนุมัติ', value: stats.rejected, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fef2f2', bgA: '#fee2e2', ic: '#dc2626', tx: '#991b1b', ring: '#ef4444' },
  ];

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ระบบจัดการการลา</h1>
          <p className="page-subtitle">จัดการคำขอลาทั้งหมดในองค์กร</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          เพิ่มรายการลา
        </button>
      </div>

      {/* Stat Cards — clickable filters with icons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
        {cards.map((c, i) => {
          const active = filterStatus === c.key;
          return (
            <button key={i} className={`glass-card hover-glow`} onClick={() => setFilterStatus(c.key)} style={{
              padding: '24px',
              border: active ? `2px solid ${c.ring}` : '1px solid transparent',
              background: active ? c.bgA : '#fff',
              cursor: 'pointer', transition: 'all 0.3s', outline: 'none',
              display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: active ? c.ring + '22' : c.ic + '12',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: c.ic, flexShrink: 0
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} /></svg>
              </div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: c.tx, lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 14, color: c.ic, fontWeight: 600, marginTop: 4 }}>{c.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Panel */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      
        {/* Search bar */}
        <div className="filter-bar" style={{ padding: '24px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            รายการลา {filterStatus === 'Pending' ? '(รออนุมัติ)' : filterStatus === 'Approved' ? '(อนุมัติแล้ว)' : filterStatus === 'Rejected' ? '(ไม่อนุมัติ)' : '(ทั้งหมด)'}
          </span>
          <div style={{ position: 'relative' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" className="search-input" placeholder="ค้นหาพนักงาน..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: 300, maxWidth: '100%', paddingLeft: '42px' }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }} className="custom-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['พนักงาน', 'ประเภท', 'ช่วงเวลา', 'วัน', 'เหตุผล', 'สถานะ', ''].map((h, i) => (
                  <th key={i} style={{ textAlign: (i === 3 || i === 5) ? 'center' : i === 6 ? 'right' : 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #e5e7eb', borderTopColor: '#6b7280', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                <div style={{ marginTop: 8, fontSize: 13 }}>กำลังโหลด...</div>
              </td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#d1d5db" style={{ margin: '0 auto 8px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                <div style={{ fontSize: 13 }}>ไม่พบข้อมูล</div>
              </td></tr>
            ) : paged.map(l => (
              <tr key={l.leave_id} 
                onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}
                style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={l.photo ? `/uploads/${l.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(l.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                      alt={l.first_name_th}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0, background: 'white' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{l.first_name_th} {l.last_name_th}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{l.dept_name}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                    background: (LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.color || '#6b7280') + '18',
                    color: LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.color || '#6b7280'
                  }}>
                    {LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.name || 'อื่นๆ'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>
                  {l.start_date?.split('T')[0]} <span style={{ color: '#d1d5db', margin: '0 2px' }}>→</span> {l.end_date?.split('T')[0]}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#111827', fontSize: 14 }}>
                  {calculateDays(l.start_date, l.end_date)}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.reason || '-'}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'center' }}>{badge(l.status)}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  <button onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                      background: l.status === 'Pending' ? '#111827' : 'transparent',
                      color: l.status === 'Pending' ? 'white' : '#9ca3af',
                      border: l.status === 'Pending' ? 'none' : '1px solid #e5e7eb',
                      transition: 'all 0.15s'
                    }}
                  >{l.status === 'Pending' ? 'ตรวจสอบ' : 'ดู'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            แสดง {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} จาก {filtered.length} รายการ
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#94a3b8' : '#334155', fontWeight: 600 }}>
              ก่อนหน้า
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  border: page === i + 1 ? 'none' : '1px solid #cbd5e1',
                  background: page === i + 1 ? '#3b82f6' : 'white',
                  color: page === i + 1 ? 'white' : '#334155'
                }}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13, color: page === totalPages ? '#94a3b8' : '#334155', fontWeight: 600 }}>
              ถัดไป
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Create Leave Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>เพิ่มรายการลาใหม่</h3>
              <button onClick={() => setShowForm(false)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', border: 'none', fontSize: 16, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>พนักงาน</label>
                <select value={form.emp_id} onChange={e => setForm({ ...form, emp_id: e.target.value })} style={inp}>
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(emp => <option key={emp.emp_id} value={emp.emp_id}>{emp.first_name_th} {emp.last_name_th}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>ประเภทการลา</label>
                <select value={form.leave_type_id} onChange={e => setForm({ ...form, leave_type_id: e.target.value })} style={inp}>
                  {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>วันเริ่มต้น</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>วันสิ้นสุด</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={inp} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>เหตุผล</label>
                <textarea rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="ระบุเหตุผลการลา..." style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontWeight: 500, fontSize: 13, color: '#374151' }}>ยกเลิก</button>
              <button onClick={handleSubmit} disabled={saving} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600, fontSize: 13, background: '#111827', color: 'white', opacity: saving ? 0.6 : 1
              }}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedLeave && (() => {
        const days = calculateDays(selectedLeave.start_date, selectedLeave.end_date);
        let qt = 0, ql = '';
        if (selectedLeave.leave_type_id === 'L01') { qt = selectedLeave.quota_sick ?? 30; ql = 'ลาป่วย'; }
        else if (selectedLeave.leave_type_id === 'L02') { qt = selectedLeave.quota_personal ?? 45; ql = 'ลากิจ'; }
        else if (selectedLeave.leave_type_id === 'L03') { qt = selectedLeave.quota_vacation ?? 10; ql = 'ลาพักผ่อน'; }
        else if (selectedLeave.leave_type_id === 'L04') { qt = 90; ql = 'ลาคลอด'; }
        else if (selectedLeave.leave_type_id === 'L05') { qt = 15; ql = 'ลาช่วยภริยาคลอด'; }
        else if (selectedLeave.leave_type_id === 'L06') { qt = 120; ql = 'ลาอุปสมบท/ฮัจญ์'; }
        const rem = qt - days;
        const over = rem < 0;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && setShowReviewModal(false)}>
            <div style={{ background: 'white', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>รายละเอียดการลา</h3>
                <button onClick={() => setShowReviewModal(false)} style={{ width: 28, height: 28, borderRadius: 8, background: '#f3f4f6', border: 'none', fontSize: 16, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>

              {/* Employee info with avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={selectedLeave.photo ? `/uploads/${selectedLeave.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLeave.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                  alt={selectedLeave.first_name_th}
                  style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover', border: '1px solid #e5e7eb', flexShrink: 0, background: 'white' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', fontSize: 15 }}>{selectedLeave.first_name_th} {selectedLeave.last_name_th}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{selectedLeave.dept_name}</div>
                </div>
              </div>

              {/* Detail grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'ประเภท', value: LEAVE_TYPES.find(t => t.id === selectedLeave.leave_type_id)?.name || 'อื่นๆ' },
                  { label: 'จำนวนวัน', value: `${days} วัน`, bold: true, color: '#2563eb' },
                  { label: 'วันเริ่มต้น', value: selectedLeave.start_date?.split('T')[0] },
                  { label: 'วันสิ้นสุด', value: selectedLeave.end_date?.split('T')[0] },
                ].map((d, i) => (
                  <div key={i} style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: 8 }}>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.label}</div>
                    <div style={{ fontSize: 13, fontWeight: d.bold ? 700 : 500, color: d.color || '#111827', marginTop: 2 }}>{d.value}</div>
                  </div>
                ))}
              </div>

              {selectedLeave.reason && (
                <div style={{ background: '#f9fafb', padding: '10px 12px', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>เหตุผล</div>
                  <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{selectedLeave.reason}</div>
                </div>
              )}

              {/* Quota */}
              {qt > 0 && (
                <div style={{ padding: '10px 12px', borderRadius: 8, marginBottom: 16, border: over ? '1px solid #fca5a5' : '1px solid #86efac', background: over ? '#fef2f2' : '#f0fdf4' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: over ? '#991b1b' : '#065f46', marginBottom: 6 }}>
                    {over ? 'เกินโควตา!' : 'โควตาวันลา'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
                    <span>{ql} ทั้งหมด</span><span style={{ fontWeight: 600 }}>{qt} วัน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>คงเหลือหลังอนุมัติ</span><span style={{ fontWeight: 700, color: over ? '#dc2626' : '#059669' }}>{rem} วัน</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedLeave.status === 'Pending' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { changeLeaveStatus(selectedLeave.leave_id, 'Rejected'); setShowReviewModal(false); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #fca5a5', background: 'white', color: '#dc2626', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>
                    ไม่อนุมัติ
                  </button>
                  <button onClick={() => { changeLeaveStatus(selectedLeave.leave_id, 'Approved'); setShowReviewModal(false); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#111827', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s' }}>
                    อนุมัติ
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  {badge(selectedLeave.status)}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      </div>
    </AppLayout>
  );
}