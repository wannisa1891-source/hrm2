'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { Leave } from '@/services/apiService';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useSearchParams } from 'next/navigation';
import { getCurrentFiscalYearRange } from '@/lib/dateUtils';

const LEAVE_TYPES = [
  { id: 'L01', name: 'ลาป่วย', color: '#f59e0b' },
  { id: 'L02', name: 'ลากิจ', color: '#6366f1' },
  { id: 'L03', name: 'ลาพักผ่อน', color: '#10b981' },
  { id: 'L04', name: 'ลาคลอด', color: '#ec4899' },
  { id: 'L05', name: 'ลาช่วยภริยาคลอด', color: '#8b5cf6' },
  { id: 'L06', name: 'ลาอุปสมบท/ฮัจญ์', color: '#f97316' },
];

export default function LeavePage() {
  const { user } = useAuth();
  const isAdmin = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role || '');
  const { leaves, loading, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();
  const { employees, loadEmployees } = useEmployees();
  const searchParams = useSearchParams();
  const leaveIdParam = searchParams.get('id');

  const visibleLeaves = useMemo(() => {
    if (isAdmin) return leaves;
    const currentEmpId = user?.emp_id || user?.username || (user as any)?.name;
    if (!currentEmpId) return [];
    return leaves.filter(l => l.emp_id === currentEmpId);
  }, [leaves, isAdmin, user]);

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

  useEffect(() => {
    if (leaveIdParam && leaves.length > 0) {
      const found = leaves.find(l => String(l.leave_id) === leaveIdParam);
      if (found) {
        setSelectedLeave(found);
        setShowReviewModal(true);
      }
    }
  }, [leaveIdParam, leaves]);

  const filtered = useMemo(() => {
    let r = visibleLeaves;
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
    total: visibleLeaves.length,
    pending: visibleLeaves.filter(l => l.status === 'Pending').length,
    approved: visibleLeaves.filter(l => l.status === 'Approved').length,
    rejected: visibleLeaves.filter(l => l.status === 'Rejected').length,
  }), [visibleLeaves]);

  const handleSubmit = async () => {
    // If user is not admin, auto-assign their emp_id to the form
    const submissionData = { ...form };
    const currentEmpId = user?.emp_id || user?.username || (user as any)?.name;
    if (!isAdmin && currentEmpId) {
      submissionData.emp_id = currentEmpId;
    }

    if (!submissionData.emp_id || !submissionData.start_date || !submissionData.end_date) { 
      Swal.fire('ข้อความแจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning'); 
      return; 
    }
    setSaving(true);
    const ok = await addLeave(submissionData);
    setSaving(false);
    if (ok) { 
      setShowForm(false); 
      setForm({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' }); 
      Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  };

  const badge = (s: string) => {
    let cls = 'lv-badge-gray', lb = s;
    if (s === 'Pending') { cls = 'lv-badge-yellow'; lb = 'รออนุมัติ'; }
    else if (s === 'Approved') { cls = 'lv-badge-green'; lb = 'อนุมัติแล้ว'; }
    else if (s === 'Rejected') { cls = 'lv-badge-red'; lb = 'ไม่อนุมัติ'; }
    return <span className={`lv-badge ${cls}`}>{lb}</span>;
  };

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  // Card config
  const cards = [
    { key: '', label: 'คำขอลาทั้งหมด', value: stats.total, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: '#f8fafc', ic: '#64748b' },
    { key: 'Pending', label: 'รออนุมัติ', value: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fffbeb', ic: '#d97706' },
    { key: 'Approved', label: 'อนุมัติแล้ว', value: stats.approved, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#ecfdf5', ic: '#059669' },
    { key: 'Rejected', label: 'ไม่อนุมัติ', value: stats.rejected, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fef2f2', ic: '#dc2626' },
  ];

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        .lv-page { padding: 24px; min-height: calc(100vh - 65px); animation: fadeIn 0.4s ease-out; }
        .lv-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 24px; }
        @media (max-width: 1024px) { .lv-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .lv-stats { grid-template-columns: 1fr; } }
        .lv-stat { border: 1px solid rgba(226, 232, 240, 0.7); background: white; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px; transition: all 0.2s; cursor: pointer; text-align: left; outline: none; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .lv-stat:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); transform: translateY(-2px); border-color: rgba(203, 213, 225, 0.9); }
        .lv-stat.active { background: #f8fafc; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        
        .lv-stat-icon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .lv-stat:hover .lv-stat-icon { transform: scale(1.05) rotate(-3deg); }
        .lv-stat-val { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1; margin-bottom: 6px; font-family: 'Inter', sans-serif; letter-spacing: -0.5px; }
        .lv-stat-label { font-size: 14px; font-weight: 600; color: #64748b; }

        .lv-filter-bar { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; background: #fff; }
        @media (max-width: 600px) { .lv-filter-bar { flex-direction: column; gap: 16px; align-items: flex-start; } }
        
        .lv-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
        .lv-badge-yellow { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
        .lv-badge-green { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
        .lv-badge-red { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
        .lv-badge-gray { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

        .lv-table-row { transition: all 0.2s; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
        .lv-table-row:hover { background: #f8fafc !important; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />

      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 24, margin: 0, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#eff6ff', color: '#3b82f6', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </span>
            ระบบจัดการการลา
          </h1>
          <p className="page-subtitle" style={{ margin: '6px 0 0 54px', color: '#64748b', fontSize: 14 }}>อนุมัติและจัดการเวลาสมดุลในการทำงานของบุคลากร</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: 14, borderRadius: 12 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          เพิ่มรายการลา
        </button>
      </div>

      {/* Stat Cards */}
      <div className="lv-stats">
        {cards.map((c, i) => {
          const active = filterStatus === c.key;
          return (
            <button key={i} className={`lv-stat ${active ? 'active' : ''}`} onClick={() => setFilterStatus(c.key)}>
              <div className="lv-stat-icon" style={{ background: c.bg, color: c.ic }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} /></svg>
              </div>
              <div>
                <div className="lv-stat-val">{c.value}</div>
                <div className="lv-stat-label">{c.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Panel */}
      <div className="glass-card" style={{ marginBottom: 24, borderRadius: 16 }}>
      
        {/* Search bar */}
        <div className="filter-bar">
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>
            รายการลา {filterStatus === 'Pending' ? '(รออนุมัติ)' : filterStatus === 'Approved' ? '(อนุมัติแล้ว)' : filterStatus === 'Rejected' ? '(ไม่อนุมัติ)' : '(ทั้งหมด)'}
          </span>
          <div className="search-input-wrap" style={{ flex: 1, maxWidth: '400px' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" className="search-input" placeholder="ค้นหาชื่อพนักงาน หรือแผนก..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', transition: 'border 0.2s', fontSize: 14 }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
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
                className="lv-table-row"
                onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                      <Image 
                        src={l.photo ? `/uploads/${l.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(l.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                        alt={l.first_name_th || 'Avatar'}
                        fill
                        unoptimized
                        style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid #e5e7eb', background: 'white' }}
                      />
                    </div>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="btn-outline hover-glow" onClick={(e) => { e.stopPropagation(); setSelectedLeave(l); setShowReviewModal(true); }}
                      style={{ 
                        width: '32px', height: '32px', padding: 0, borderRadius: '8px', border: '1px solid #e2e8f0', 
                        background: 'white', color: (isAdmin && l.status === 'Pending') ? '#3b82f6' : '#64748b', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}
                      title={(isAdmin && l.status === 'Pending') ? 'ตรวจสอบ' : 'ดูข้อมูล'}
                    >
                      {(isAdmin && l.status === 'Pending') ? (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      ) : (
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fff', borderRadius: '0 0 16px 16px', marginTop: '-16px' }}>
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
              {isAdmin ? (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>พนักงาน</label>
                  <select value={form.emp_id} onChange={e => setForm({ ...form, emp_id: e.target.value })} style={inp}>
                    <option value="">-- เลือกพนักงาน --</option>
                    {employees.map(emp => <option key={emp.emp_id} value={emp.emp_id}>{emp.first_name_th} {emp.last_name_th}</option>)}
                  </select>
                </div>
              ) : (
                <input type="hidden" value={user?.emp_id} />
              )}
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
        else if (selectedLeave.leave_type_id === 'L02') { qt = selectedLeave.quota_personal ?? 15; ql = 'ลากิจ'; }
        else if (selectedLeave.leave_type_id === 'L03') { qt = selectedLeave.quota_vacation ?? 10; ql = 'ลาพักผ่อน'; }
        else if (selectedLeave.leave_type_id === 'L04') { qt = 90; ql = 'ลาคลอด'; }
        else if (selectedLeave.leave_type_id === 'L05') { qt = 15; ql = 'ลาช่วยภริยาคลอด'; }
        else if (selectedLeave.leave_type_id === 'L06') { qt = 120; ql = 'ลาอุปสมบท/ฮัจญ์'; }

        // Calculate used days in current fiscal year
        const usedInFiscalYear = leaves
          .filter(l => 
            l.emp_id === selectedLeave.emp_id && 
            l.status === 'Approved' && 
            l.leave_type_id === selectedLeave.leave_type_id &&
            new Date(l.start_date) >= getCurrentFiscalYearRange().start &&
            new Date(l.start_date) <= getCurrentFiscalYearRange().end
          )
          .reduce((sum, l) => sum + calculateDays(l.start_date, l.end_date), 0);

        const rem = qt - usedInFiscalYear - days;
        const over = rem < 0;

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}
            onClick={e => e.target === e.currentTarget && setShowReviewModal(false)}>
            <div style={{ background: 'white', borderRadius: 24, padding: 32, width: 480, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>รายละเอียดการลา</h3>
                <button onClick={() => setShowReviewModal(false)} style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Employee info with avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                  <Image 
                    src={selectedLeave.photo ? `/uploads/${selectedLeave.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLeave.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                    alt={selectedLeave.first_name_th || 'Avatar'}
                    fill
                    unoptimized
                    style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', background: 'white' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, marginBottom: 2 }}>{selectedLeave.first_name_th} {selectedLeave.last_name_th}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{selectedLeave.dept_name || 'ไม่ระบุแผนก'} {selectedLeave.emp_type ? `(${selectedLeave.emp_type})` : ''}</div>
                </div>
              </div>

              {/* Detail grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'ประเภทการลา', value: LEAVE_TYPES.find(t => t.id === selectedLeave.leave_type_id)?.name || 'อื่นๆ' },
                  { label: 'จำนวนวัน', value: `${days} วัน`, bold: true, color: '#2563eb' },
                  { label: 'วันเริ่มต้น', value: selectedLeave.start_date?.split('T')[0] },
                  { label: 'วันสิ้นสุด', value: selectedLeave.end_date?.split('T')[0] },
                ].map((d, i) => (
                  <div key={i} style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>{d.label}</div>
                    <div style={{ fontSize: 14, fontWeight: d.bold ? 700 : 600, color: d.color || '#0f172a' }}>{d.value}</div>
                  </div>
                ))}
              </div>

              {selectedLeave.reason && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>เหตุผลการลา</div>
                  <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{selectedLeave.reason}</div>
                </div>
              )}

              {/* Quota */}
              {qt > 0 && (
                <div style={{ padding: '16px', borderRadius: 12, marginBottom: 24, border: over ? '1px solid #fecaca' : '1px solid #bbf7d0', background: over ? '#fef2f2' : '#f0fdf4' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: over ? '#991b1b' : '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={over ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                    {over ? 'เกินโควตาวันลา!' : 'โควตาวันลา'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: over ? '#b91c1c' : '#166534' }}>
                    <span>จำนวนโควตา {ql} ทั้งหมด</span><span style={{ fontWeight: 600 }}>{qt} วัน</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: over ? '#b91c1c' : '#166534' }}>
                    <span>คงเหลือหลังอนุมัติ</span><span style={{ fontWeight: 800 }}>{rem} วัน</span>
                  </div>
                </div>
              )}

              {/* Approval Progress */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ขั้นตอนการอนุมัติ (Approval Stages)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 'Head of Dept', label: '1. หัวหน้าแผนก', status: selectedLeave.dept_head_status },
                    { id: 'Administration', label: '2. ธุรการ', status: selectedLeave.admin_status },
                    { id: 'Housekeeper', label: '3. พ่อบ้าน', status: selectedLeave.housekeeper_status },
                    { id: 'Director', label: '4. ผอ.', status: selectedLeave.director_status },
                  ].map((s, i) => {
                    const isCurrent = selectedLeave.current_stage === s.id;
                    const isDone = s.status === 'Approved';
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', background: isCurrent ? '#eff6ff' : '#f8fafc', border: isCurrent ? '1px solid #3b82f6' : '1px solid #e2e8f0' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: isDone ? '#10b981' : isCurrent ? '#3b82f6' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                          {isDone ? '✓' : i + 1}
                        </div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isDone ? '#166534' : isCurrent ? '#1e40af' : '#475569' }}>{s.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isDone ? '#10b981' : isCurrent ? '#3b82f6' : '#94a3b8' }}>
                          {isDone ? 'อนุมัติแล้ว' : isCurrent ? 'กำลังพิจารณา' : 'รอคิว'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              {(isAdmin && selectedLeave.status === 'Pending') ? (
                <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
                  <button onClick={() => { changeLeaveStatus(String(selectedLeave.leave_id), 'Rejected', String(selectedLeave.current_stage)); setShowReviewModal(false); }}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    ไม่อนุมัติ
                  </button>
                  <button onClick={() => { changeLeaveStatus(String(selectedLeave.leave_id), 'Approved', String(selectedLeave.current_stage)); setShowReviewModal(false); }}
                    style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 14, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    อนุมัติขั้นตอนปัจจุบัน
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
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