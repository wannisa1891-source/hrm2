'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { Leave } from '@/services/apiService';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useSearchParams } from 'next/navigation';
import { getCurrentFiscalYearRange, toDateStr, formatThaiDate } from '@/lib/dateUtils';
import { getQuotaByType, LEAVE_RULES } from '@/constants/leaveRules';
import ThaiDateInput from '@/components/ThaiDateInput';
import CustomSelect from '@/components/CustomSelect';

const CATEGORIES = [
  { id: 'Sick', name: 'ลาป่วย', color: '#f59e0b' },
  { id: 'Personal', name: 'ลากิจ', color: '#6366f1' },
  { id: 'Vacation', name: 'ลาพักผ่อน', color: '#10b981' },
  { id: 'Other', name: 'อื่นๆ', color: '#64748b' },
];

export default function LeavePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeavePageContent />
    </Suspense>
  );
}

function LeavePageContent() {
  const { user } = useAuth();
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isHR = role === 'HR';
  const isHead = ['Head', 'หัวหน้า'].includes(role);
  const isAdmin = isSuperAdmin || isHR;
  const isManagement = isSuperAdmin || isHR || isHead;

  const { leaves, loading, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();

  const { employees, loadEmployees } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  
  const searchParams = useSearchParams();
  const leaveIdParam = searchParams.get('id');

  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: '', leave_category: 'Sick', start_date: '', end_date: '', reason: '' });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const perPage = 8;
  const [showRules, setShowRules] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  useEffect(() => { 
    loadLeaves(); 
    loadEmployees(); 
    loadDepartments();
  }, [loadLeaves, loadEmployees, loadDepartments]);

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

  const visibleLeaves = useMemo(() => {
    if (isSuperAdmin || isHR) return leaves;
    const currentEmpId = user?.emp_id || user?.username;
    if (isHead) {
      return leaves.filter(l => l.dept_id === user?.dept_id || l.emp_id === currentEmpId);
    }
    return leaves.filter(l => l.emp_id === currentEmpId);
  }, [leaves, isSuperAdmin, isHR, isHead, user]);

  const filtered = useMemo(() => {
    let r = visibleLeaves;
    if (filterStatus) r = r.filter(l => l.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(l => 
        l.first_name_th?.toLowerCase().includes(q) || 
        l.last_name_th?.toLowerCase().includes(q) ||
        l.dept_name?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [visibleLeaves, filterStatus, searchQuery]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    total: visibleLeaves.length,
    pending: visibleLeaves.filter(l => l.status === 'Pending').length,
    approved: visibleLeaves.filter(l => l.status === 'Approved').length,
    rejected: visibleLeaves.filter(l => l.status === 'Rejected').length,
  }), [visibleLeaves]);

  const handleSubmit = async () => {
    const currentEmpId = user?.emp_id || user?.username;
    const finalEmpId = isAdmin ? form.emp_id : currentEmpId;

    if (!finalEmpId || !form.start_date || !form.end_date) {
      Swal.fire('ข้อความแจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning');
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.append('emp_id', finalEmpId);
    fd.append('leave_type_id', form.leave_type_id || 'T01');
    fd.append('leave_category', form.leave_category);
    fd.append('start_date', form.start_date);
    fd.append('end_date', form.end_date);
    fd.append('reason', form.reason);
    if (attachment) fd.append('attachment', attachment);

    const res = await addLeave(fd);
    setSaving(false);
    if (res.success) {
      setShowForm(false);
      setForm({ emp_id: '', leave_type_id: '', leave_category: 'Sick', start_date: '', end_date: '', reason: '' });
      setAttachment(null);
      Swal.fire('สำเร็จ', 'ยื่นใบลาเรียบร้อยแล้ว', 'success');
      loadLeaves();
    } else {
      Swal.fire('เกิดข้อผิดพลาด', res.message, 'error');
    }
  };

  const badge = (status: string) => {
    let cls = 'lv-badge-yellow', lb = 'รออนุมัติ';
    if (status === 'Approved') { cls = 'lv-badge-green'; lb = 'อนุมัติแล้ว'; }
    if (status === 'Rejected') { cls = 'lv-badge-red'; lb = 'ไม่อนุมัติ'; }
    return <span className={`lv-badge ${cls}`}>{lb}</span>;
  };

  const cards = [
    { key: '', label: 'คำขอลาทั้งหมด', value: stats.total, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: '#f8fafc', ic: '#64748b' },
    { key: 'Pending', label: 'รออนุมัติ', value: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fffbeb', ic: '#d97706' },
    { key: 'Approved', label: 'อนุมัติแล้ว', value: stats.approved, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#f0fdf4', ic: '#166534' },
    { key: 'Rejected', label: 'ปฏิเสธ', value: stats.rejected, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fef2f2', ic: '#991b1b' },
  ];

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{
        __html: `
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

        .lv-table-row { transition: all 0.2s; cursor: pointer; border-bottom: 1px solid #f1f5f9; }
        .lv-table-row:hover { background: #f8fafc !important; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lv-quota-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .lv-quota-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) { .lv-quota-grid { grid-template-columns: 1fr; } }
        .lv-quota-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; transition: all 0.2s; }
        .lv-quota-card:hover { box-shadow: 0 6px 16px rgba(0,0,0,0.07); transform: translateY(-2px); }
        .lv-rules-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-top: 16px; }
        .lv-rules-tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
        .lv-rules-tbl th { background: #f8fafc; padding: 10px 14px; font-weight: 700; color: #374151; border-bottom: 1px solid #e2e8f0; text-align: center; }
        .lv-rules-tbl th:first-child { text-align: left; }
        .lv-rules-tbl td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #374151; text-align: center; }
        .lv-rules-tbl td:first-child { text-align: left; font-weight: 600; }
        .lv-rules-tbl tr:last-child td { border-bottom: none; }
        .lv-rules-tbl tr:hover td { background: #fafafa; }
        .lv-no { color: #9ca3af; font-style: italic; font-size: 11px; }
      `}} />

      <div className="lv-page">
        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, margin: 0, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>ระบบจัดการการลา</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 500 }}>ตรวจสอบ ติดตาม และอนุมัติรายการลาของบุคลากร</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', fontSize: 15, borderRadius: 14, boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            ยื่นใบลาใหม่
          </button>
        </div>

        {/* Stats Grid */}
        <div className="lv-stats">
          {cards.map((c, i) => {
            const active = filterStatus === c.key;
            return (
              <button type="button" key={i} className={`lv-stat ${active ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setFilterStatus(c.key); document.getElementById('leave-table')?.scrollIntoView({ behavior: 'smooth' }); }}>
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

        {/* Quota Summary for Current User */}
        {(() => {
          const empId = user?.emp_id || user?.username;
          const myEmp = employees.find(e => e.emp_id === empId) ?? null;
          const fyRange = getCurrentFiscalYearRange();
          const thY = (y: number) => y + 543;
          const fyLabel = `1 ต.ค. ${thY(fyRange.start.getFullYear())} – 30 ก.ย. ${thY(fyRange.end.getFullYear())}`;

          const myApproved = leaves.filter(l =>
            l.emp_id === empId && l.status === 'Approved' &&
            new Date(l.start_date) >= fyRange.start && new Date(l.start_date) <= fyRange.end
          );
          
          const usedSick = myApproved.filter(l => l.leave_category === 'Sick').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
          const usedPersonal = myApproved.filter(l => l.leave_category === 'Personal').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
          const usedVacation = myApproved.filter(l => l.leave_category === 'Vacation').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);

          const quota = myEmp ? getQuotaByType(myEmp.emp_type || '', myEmp.start_date) : null;
          const accVac = myEmp?.accumulated_vacation || 0;
          const totalVac = quota ? quota.vacation + accVac : 0;

          const qCards = quota ? [
            { label: 'ลาป่วย', used: usedSick, total: quota.sick, color: '#f59e0b' },
            { label: 'ลากิจ', used: usedPersonal, total: quota.personal, color: '#6366f1' },
            { label: 'ลาพักผ่อน', used: usedVacation, total: totalVac, color: '#10b981', acc: quota.canAccumulateVacation ? `สะสม ${accVac} วัน` : 'ไม่สะสม' },
          ] : [];

          return (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>สิทธิ์การลาของคุณ</span>
                  {myEmp?.emp_type && <span style={{ fontSize: 12, background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>{myEmp.emp_type}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>รอบปีงบประมาณ: {fyLabel}</span>
                  <button onClick={() => setShowRules(v => !v)}
                    style={{ fontSize: 12, background: 'white', color: '#475569', padding: '4px 12px', borderRadius: 20, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {showRules ? 'ซ่อนตารางสิทธิ์' : 'ดูตารางสิทธิ์พนักงาน'}
                  </button>
                </div>
              </div>

              {quota && (
                <div className="lv-quota-grid">
                  {qCards.map((qc, i) => {
                    const rem = qc.total - qc.used;
                    const pct = qc.total > 0 ? Math.min(100, Math.round((qc.used / qc.total) * 100)) : 0;
                    const isOver = rem < 0;
                    const barColor = isOver ? '#ef4444' : pct >= 80 ? '#f59e0b' : qc.color;
                    return (
                      <div key={i} className="lv-quota-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>{qc.label}</span>
                          {isOver
                            ? <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>เกินสิทธิ์!</span>
                            : <span style={{ fontSize: 28, fontWeight: 800, color: qc.color, lineHeight: 1 }}>{rem}</span>}
                        </div>
                        {!isOver && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 12 }}>คงเหลือ ({qc.used}/{qc.total} วัน)</div>}
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                          <span>{pct}% ใช้งานไปแล้ว</span>
                          {qc.acc && <span style={{ color: qc.acc === 'ไม่สะสม' ? '#94a3b8' : '#10b981' }}>{qc.acc}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showRules && (
                <div className="lv-rules-wrap" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', fontWeight: 700, fontSize: 14, color: '#1e293b' }}>ตารางสิทธิ์การลาประจำปีงบประมาณ</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="lv-rules-tbl">
                      <thead>
                        <tr>
                          <th style={{ minWidth: 200 }}>ประเภทบุคลากร</th>
                          <th>ลากิจ</th>
                          <th>ลาป่วย</th>
                          <th>ลาพักผ่อน/ปี</th>
                          <th>การสะสม</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(LEAVE_RULES).map(([type, rule], i) => (
                          <tr key={i} style={{ background: myEmp?.emp_type === type ? '#eff6ff' : undefined }}>
                            <td style={{ fontWeight: 600, color: myEmp?.emp_type === type ? '#2563eb' : '#334155' }}>
                              {type}
                              {myEmp?.emp_type === type && <span style={{ marginLeft: 8, fontSize: 10, background: '#2563eb', color: 'white', padding: '1px 8px', borderRadius: 20 }}>คุณ</span>}
                            </td>
                            <td>{rule.personal === 0 ? <span className="lv-no">ไม่มีสิทธิ์</span> : `${rule.personal} วัน`}</td>
                            <td>{rule.sick === 0 ? <span className="lv-no">ไม่มีสิทธิ์</span> : (type === 'ลูกจ้างรายวัน' ? '8-15 วัน' : `${rule.sick} วัน`)}</td>
                            <td>{rule.vacation === 0 ? <span className="lv-no">ไม่มีสิทธิ์</span> : `${rule.vacation} วัน/ปี`}</td>
                            <td style={{ color: rule.canAccumulateVacation ? '#059669' : '#94a3b8', fontWeight: 500 }}>
                              {rule.canAccumulateVacation ? `สะสมปีละ ${rule.accumulatePerYear} วัน` : 'ไม่สะสม'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Main List Table */}
        <div id="leave-table" className="glass-card" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 24, overflow: 'hidden', scrollMarginTop: '24px' }}>
          <div className="lv-filter-bar">
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
              รายการลาบุคลากร {filterStatus ? `(${filterStatus})` : ''}
            </span>
            <div style={{ flex: 1, maxWidth: '380px', position: 'relative' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="ค้นหาพนักงาน หรือแผนก..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '11px 14px 11px 42px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', fontSize: 14, background: '#f8fafc' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  {['พนักงาน', 'ประเภทการลา', 'ช่วงเวลา', 'วัน', 'สถานะ', ''].map((h, i) => (
                    <th key={i} style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: (i === 3 || i === 4) ? 'center' : i === 5 ? 'right' : 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60 }}>
                    <div style={{ display: 'inline-block', width: 24, height: 24, border: '3px solid #f3f4f6', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>ไม่พบข้อมูลรายการลา</td></tr>
                ) : paged.map(l => (
                  <tr key={l.leave_id} className="lv-table-row" onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}>
                    <td style={{ padding: '14px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                          <Image
                            src={l.image ? `/uploads/${l.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(l.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                            alt={l.first_name_th || 'Avatar'}
                            fill
                            unoptimized
                            style={{ borderRadius: 14, objectFit: 'cover', border: '1px solid #f1f5f9', background: 'white' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{l.first_name_th} {l.last_name_th}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{l.dept_name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 10px', borderRadius: 8, fontWeight: 700,
                        background: (CATEGORIES.find(c => c.id === l.leave_category)?.color || '#64748b') + '15',
                        color: CATEGORIES.find(c => c.id === l.leave_category)?.color || '#64748b'
                      }}>
                        {CATEGORIES.find(c => c.id === l.leave_category)?.name || 'อื่นๆ'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      {l.start_date?.split('T')[0]} <span style={{ color: '#cbd5e1', margin: '0 4px' }}>→</span> {l.end_date?.split('T')[0]}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center', fontWeight: 800, color: '#0f172a', fontSize: 15 }}>
                      {calculateDays(l.start_date, l.end_date)}
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>{badge(l.status)}</td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <button style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
                แสดง {filtered.length > 0 ? (page - 1) * perPage + 1 : 0}-{Math.min(page * perPage, filtered.length)} จาก {filtered.length} รายการ
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => {
                  if (totalPages > 5 && i > 1 && i < totalPages - 2 && Math.abs(i + 1 - page) > 1) return null;
                  return (
                    <button key={i} onClick={() => setPage(i + 1)}
                      style={{
                        width: 38, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        border: page === i + 1 ? 'none' : '1px solid #e2e8f0',
                        background: page === i + 1 ? '#0f172a' : 'white',
                        color: page === i + 1 ? 'white' : '#475569'
                      }}>{i + 1}</button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: (page === totalPages || totalPages === 0) ? 'default' : 'pointer', fontSize: 13, color: (page === totalPages || totalPages === 0) ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                  ถัดไป
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Leave Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 28, padding: 32, width: 480, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>ยื่นใบลาใหม่</h3>
              <button onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', border: 'none', fontSize: 16, cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {isAdmin ? (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>เลือกพนักงาน</label>
                  <CustomSelect
                    showSearch
                    value={form.emp_id}
                    onChange={val => {
                      const emp = employees.find(e => e.emp_id === val);
                      if (emp) {
                        setForm({ ...form, emp_id: val, leave_type_id: '' }); // Reset or map if needed
                      } else {
                        setForm({ ...form, emp_id: val });
                      }
                    }}
                    options={employees.map(e => ({ value: e.emp_id, label: `${e.first_name_th} ${e.last_name_th} (${e.emp_id})` }))}
                    placeholder="-- ค้นหาชื่อพนักงาน --"
                    minWidth="100%"
                  />
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>
                    {(user?.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{user?.username}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>รหัส: {user?.emp_id}</div>
                  </div>
                </div>
              )}
              
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>ประเภทการลา</label>
                <select value={form.leave_category} onChange={e => setForm({ ...form, leave_category: e.target.value })} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none' }}>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ThaiDateInput
                  label="วันเริ่มต้น"
                  value={form.start_date}
                  onChange={val => setForm({ ...form, start_date: val })}
                  required
                />
                <ThaiDateInput
                  label="วันสิ้นสุด"
                  value={form.end_date}
                  onChange={val => setForm({ ...form, end_date: val })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>เหตุผลความจำเป็น</label>
                <textarea rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="ระบุรายละเอียดสั้นๆ..." style={{ width: '100%', padding: '12px 14px', resize: 'none', borderRadius: 16, border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>แนบไฟล์หลักฐาน (ถ้ามี)</label>
                <input type="file" onChange={e => setAttachment(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </div>
              <button onClick={handleSubmit} disabled={saving} style={{
                marginTop: 8, padding: '14px', borderRadius: 16, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 800, fontSize: 15, background: '#0f172a', color: 'white', opacity: saving ? 0.6 : 1, transition: 'all 0.2s'
              }}>{saving ? 'กำลังประมวลผล...' : 'ยืนยันส่งใบลา'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedLeave && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}
          onClick={e => e.target === e.currentTarget && setShowReviewModal(false)}>
          <div style={{ background: 'white', borderRadius: 28, padding: 32, width: 500, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>รายละเอียดการลา</h3>
              <button onClick={() => setShowReviewModal(false)} style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
                <Image 
                  src={selectedLeave.image ? `/uploads/${selectedLeave.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLeave.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                  alt={selectedLeave.first_name_th || 'Avatar'}
                  fill
                  unoptimized
                  style={{ borderRadius: 20, objectFit: 'cover', border: '2px solid #f1f5f9', background: 'white' }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 17, marginBottom: 2 }}>{selectedLeave.first_name_th} {selectedLeave.last_name_th}</div>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{selectedLeave.dept_name || 'ไม่ระบุแผนก'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>ประเภท</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{CATEGORIES.find(c => c.id === selectedLeave.leave_category)?.name || 'อื่นๆ'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>จำนวนวัน</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>{calculateDays(selectedLeave.start_date, selectedLeave.end_date)} วัน</div>
              </div>
              <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '14px 18px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>ช่วงเวลา</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{formatThaiDate(selectedLeave.start_date)} - {formatThaiDate(selectedLeave.end_date)}</div>
              </div>
            </div>

            {isManagement && selectedLeave.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => { changeLeaveStatus(String(selectedLeave.leave_id), 'Rejected', selectedLeave.current_stage || ''); setShowReviewModal(false); }}
                  style={{ flex: 1, padding: '14px', borderRadius: 16, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>
                  ไม่อนุมัติ
                </button>
                <button onClick={() => { changeLeaveStatus(String(selectedLeave.leave_id), 'Approved', selectedLeave.current_stage || ''); setShowReviewModal(false); }}
                  style={{ flex: 1, padding: '14px', borderRadius: 16, border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>
                  อนุมัติรายการ
                </button>
              </div>
            )}
            
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {badge(selectedLeave.status)}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}