'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { Leave } from '@/services/apiService';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useSearchParams } from 'next/navigation';
import { getCurrentFiscalYearRange, toDateStr, formatThaiDate } from '@/lib/dateUtils';
import { getQuotaByType } from '@/constants/leaveRules';
import ThaiDateInput from '@/components/ThaiDateInput';
import CustomSelect from '@/components/CustomSelect';

const CATEGORIES = [
  { id: 'Personal', name: 'ลากิจ', color: '#6366f1' },
  { id: 'Sick', name: 'ลาป่วย', color: '#f59e0b' },
  { id: 'Vacation', name: 'ลาพักผ่อน', color: '#10b981' },
];

const LEAVE_TYPES = [
  { id: 'T01', name: 'ข้าราชการ', p_qt: 45, s_qt: 60, v_qt: 10, rule: 'สะสมเพิ่มปีละ 10 วัน', color: '#f59e0b' },
  { id: 'T02', name: 'ลูกจ้างประจำ', p_qt: 45, s_qt: 60, v_qt: 10, rule: 'สะสมเพิ่มปีละ 10 วัน', color: '#6366f1' },
  { id: 'T03', name: 'พนักงานราชการ', p_qt: 10, s_qt: 30, v_qt: 15, rule: 'สะสมเพิ่มปีละ 15 วัน', color: '#10b981' },
  { id: 'T04', name: 'ลูกจ้างพนักงานกระทรวง', p_qt: 15, s_qt: 45, v_qt: 15, rule: 'สะสมไม่เกิน 15 วัน/ปี', color: '#ec4899' },
  { id: 'T05', name: 'ลูกจ้างชั่วคราว(นักเรียนทุน)', p_qt: 0, s_qt: 15, v_qt: 10, rule: 'ไม่สะสม', color: '#8b5cf6' },
  { id: 'T06', name: 'ลูกจ้างรายเดือน', p_qt: 0, s_qt: 15, v_qt: 10, rule: 'ไม่สะสม', color: '#f97316' },
  { id: 'T07', name: 'ลูกจ้างรายวัน', p_qt: 0, s_qt: 15, v_qt: 10, rule: 'ไม่สะสม', color: '#64748b' },
  { id: 'T08', name: 'ลูกจ้างเหมาบริการ', p_qt: 0, s_qt: 15, v_qt: 10, rule: 'ไม่สะสม', color: '#334155' },
  { id: 'T09', name: 'ลูกจ้างชั่วคราวที่อายุ 60 ปี', p_qt: 0, s_qt: 15, v_qt: 10, rule: 'ไม่สะสม', color: '#475569' },
  { id: 'T10', name: 'ลูกจ้างเเบ่งเปอร์เซ็น', p_qt: 0, s_qt: 15, v_qt: 10, rule: 'ไม่สะสม', color: '#1e293b' },
  { id: 'T11', name: 'ราชการ', p_qt: 45, s_qt: 60, v_qt: 10, rule: 'สะสมเพิ่มปีละ 10 วัน', color: '#f59e0b' },
];

export default function LeavePage() {
  const { user } = useAuth();
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isHR = role === 'HR';
  const isHead = ['Head', 'หัวหน้า'].includes(role);
  const isAdmin = isSuperAdmin || isHR;
  const isManagement = isSuperAdmin || isHR || isHead;

  const { leaves, loading, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();
  const dbLeaveTypes: any[] = []; // Fallback if not provided by hook
  const { employees, loadEmployees } = useEmployees();
  const searchParams = useSearchParams();
  const leaveIdParam = searchParams.get('id');

  const visibleLeaves = useMemo(() => {
    if (isSuperAdmin || isHR) return leaves;
    const currentEmpId = user?.emp_id || user?.username || (user as any)?.name;
    
    if (isHead) {
      return leaves.filter(l => l.dept_id === user?.dept_id || l.emp_id === currentEmpId);
    }
    
    if (!currentEmpId) return [];
    return leaves.filter(l => l.emp_id === currentEmpId);
  }, [leaves, isSuperAdmin, isHR, isHead, user]);

  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: 'T01', leave_category: 'Sick', start_date: '', end_date: '', reason: '' });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 8;
  const [showRules, setShowRules] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24)) + 1;
  };

  useEffect(() => { loadLeaves(); loadEmployees(); }, [loadLeaves, loadEmployees]);
  useEffect(() => { setPage(1); }, [filterStatus, searchQuery]);

  useEffect(() => {
    if (showForm && !isAdmin && user?.emp_type) {
      const group = LEAVE_TYPES.find(t => t.name === user.emp_type);
      if (group) {
        setForm(f => ({ ...f, leave_type_id: group.id }));
      }
    }
  }, [showForm, isAdmin, user]);

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
    const currentEmpId = user?.emp_id || user?.username || (user as any)?.name;
    const finalEmpId = isAdmin ? form.emp_id : currentEmpId;

    const missing = [];
    if (!finalEmpId) missing.push('พนักงาน');
    if (!form.start_date) missing.push('วันที่เริ่มต้น');
    if (!form.end_date) missing.push('วันที่สิ้นสุด');
    if (!form.reason.trim()) missing.push('เหตุผลการลา');

    if (missing.length > 0) {
      Swal.fire({
        title: '⚠️ ข้อมูลไม่ครบถ้วน',
        text: `กรุณากรอก: ${missing.join(', ')}`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.append('emp_id', finalEmpId);
    fd.append('leave_type_id', form.leave_type_id);
    fd.append('leave_category', form.leave_category);
    fd.append('start_date', form.start_date);
    fd.append('end_date', form.end_date);
    fd.append('reason', form.reason);
    if (attachment) fd.append('attachment', attachment);

    const ok = await addLeave(fd);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setForm({ emp_id: '', leave_type_id: 'T01', leave_category: 'Sick', start_date: '', end_date: '', reason: '' });
      setAttachment(null);
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

  const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', fontFamily: 'inherit' };

  const cards = [
    { key: '', label: 'คำขอลาทั้งหมด', value: stats.total, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', bg: '#f8fafc', ic: '#64748b' },
    { key: 'Pending', label: 'รออนุมัติ', value: stats.pending, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fffbeb', ic: '#d97706' },
    { key: 'Approved', label: 'อนุมัติแล้ว', value: stats.approved, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#ecfdf5', ic: '#059669' },
    { key: 'Rejected', label: 'ไม่อนุมัติ', value: stats.rejected, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', bg: '#fef2f2', ic: '#dc2626' },
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
        .lv-badge-gray { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

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

      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
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

        {/* ─── Quota Summary Panel ─── */}
        {(() => {
          const empId = user?.emp_id || user?.username || (user as any)?.name;
          const myEmp = employees.find(e => e.emp_id === empId) ?? null;
          const fyRange = getCurrentFiscalYearRange();
          const thY = (y: number) => y + 543;
          const fyLabel = `1 ต.ค. ${thY(fyRange.start.getFullYear())} – 30 ก.ย. ${thY(fyRange.end.getFullYear())}`;

          const myApproved = leaves.filter(l =>
            l.emp_id === empId && l.status === 'Approved' &&
            new Date(l.start_date) >= fyRange.start && new Date(l.start_date) <= fyRange.end
          );
          const usedSick = myApproved.filter(l => (l as any).leave_category === 'Sick').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
          const usedPersonal = myApproved.filter(l => (l as any).leave_category === 'Personal').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
          const usedVacation = myApproved.filter(l => (l as any).leave_category === 'Vacation').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);

          const quota = myEmp ? getQuotaByType(myEmp.emp_type || '', myEmp.start_date) : null;
          const accVac = myEmp?.accumulated_vacation || 0;
          const totalVac = quota ? quota.vacation + accVac : 0;

          const rulesData = [
            { type: 'ราชการ', personal: '45', sick: '60', vacation: '10/ปี', acc: 'สะสมได้ไม่จำกัด' },
            { type: 'พนักงานราชการ', personal: '10', sick: '30', vacation: '15/ปี', acc: 'สะสมได้ไม่จำกัด' },
            { type: 'ลูกจ้างพนักงานกระทรวง', personal: '15', sick: '45', vacation: '15/ปี', acc: 'สะสมไม่เกิน 15 วัน' },
            { type: 'ลูกจ้างชั่วคราว(นักเรียนทุน)', personal: '-', sick: '15', vacation: '10/ปี', acc: 'ไม่สะสม' },
            { type: 'ลูกจ้างรายเดือน', personal: '-', sick: '15', vacation: '10/ปี', acc: 'ไม่สะสม' },
            { type: 'ลูกจ้างรายวัน', personal: '-', sick: '8 (ปีแรก) / 15 (ครบปี)', vacation: '10/ปี', acc: 'ไม่สะสม' },
            { type: 'ลูกจ้างเหมา', personal: '-', sick: '-', vacation: '-', acc: '-' },
            { type: 'ลูกจ้างชั่วคราวที่อายุ 60 ปี', personal: '-', sick: '15', vacation: '10/ปี', acc: 'ไม่สะสม' },
          ];

          const qCards = quota ? [
            { label: 'ลาป่วย', used: usedSick, total: quota.sick, color: '#f59e0b', typeId: 'L01', acc: null },
            { label: 'ลากิจ', used: usedPersonal, total: quota.personal, color: '#6366f1', typeId: 'L02', acc: null },
            {
              label: 'ลาพักผ่อน', used: usedVacation, total: totalVac, color: '#10b981', typeId: 'L03',
              acc: quota.canAccumulateVacation ? `รวมสะสม ${accVac} วัน` : 'ไม่สะสม', base: quota.vacation
            },
          ] : [];

          return (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>สรุปโควตาวันลา</span>
                  {myEmp?.emp_type && <span style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>{myEmp.emp_type}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>📅 {fyLabel}</span>
                  <button onClick={() => setShowRules(v => !v)}
                    style={{ fontSize: 12, background: '#f8fafc', color: '#475569', padding: '4px 12px', borderRadius: 20, fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                    {showRules ? '▲ ซ่อนตารางสิทธิ์' : '▼ ดูตารางสิทธิ์ทุกประเภท'}
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
                    if (qc.total === 0) return (
                      <div key={i} className="lv-quota-card" style={{ opacity: 0.65 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{qc.label}</span>
                          <span style={{ fontSize: 11, background: '#f3f4f6', color: '#9ca3af', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>ไม่มีสิทธิ์</span>
                        </div>
                        <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3 }} />
                      </div>
                    );
                    return (
                      <div key={i} className="lv-quota-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>{qc.label}</span>
                          {isOver
                            ? <span style={{ fontSize: 11, background: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>เกินโควตา!</span>
                            : <span style={{ fontSize: 28, fontWeight: 800, color: qc.color, lineHeight: 1 }}>{rem}</span>}
                        </div>
                        {!isOver && <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>วันคงเหลือ (ใช้ไป {qc.used}/{qc.total} วัน)</div>}
                        {isOver && <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 10 }}>ใช้ไป {qc.used} วัน เกิน {Math.abs(rem)} วัน</div>}
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af' }}>
                          <span>{pct}% ใช้แล้ว</span>
                          {qc.acc && <span style={{ color: qc.acc === 'ไม่สะสม' ? '#9ca3af' : '#10b981', fontWeight: 600 }}>{qc.acc}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showRules && (
                <div className="lv-rules-wrap">
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>ตารางสิทธิ์การลาตามประเภทบุคลากร (ปีงบประมาณ 1 ต.ค. – 30 ก.ย.)</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="lv-rules-tbl">
                      <thead>
                        <tr>
                          <th style={{ minWidth: 180 }}>ประเภทบุคลากร</th>
                          <th>ลากิจ</th>
                          <th>ลาป่วย</th>
                          <th>ลาพักผ่อน/ปี</th>
                          <th>การสะสมพักผ่อน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rulesData.map((r, i) => (
                          <tr key={i} style={{ background: myEmp?.emp_type === r.type || (r.type === 'ลูกจ้างชั่วคราว(นักเรียนทุน)' && myEmp?.emp_type === 'ลูกจ้างชั่วคราว(นักเรียนทุน)') ? '#eff6ff' : undefined }}>
                            <td style={{ fontWeight: 600, color: (myEmp?.emp_type === r.type || (r.type === 'ลูกจ้างชั่วคราว(นักเรียนทุน)' && myEmp?.emp_type === 'ลูกจ้างชั่วคราว(นักเรียนทุน)')) ? '#2563eb' : '#111827' }}>
                              {r.type}
                              {(myEmp?.emp_type === r.type || (r.type === 'ลูกจ้างชั่วคราว(นักเรียนทุน)' && myEmp?.emp_type === 'ลูกจ้างชั่วคราว(นักเรียนทุน)')) && <span style={{ marginLeft: 6, fontSize: 10, background: '#2563eb', color: 'white', padding: '1px 6px', borderRadius: 4 }}>ท่าน</span>}
                            </td>
                            <td>{r.personal === '-' ? <span className="lv-no">ไม่มีสิทธิ์</span> : `${r.personal} วัน`}</td>
                            <td>{r.sick === '-' ? <span className="lv-no">ไม่มีสิทธิ์</span> : r.sick.includes('/') ? r.sick : `${r.sick} วัน`}</td>
                            <td>{r.vacation === '-' ? <span className="lv-no">ไม่มีสิทธิ์</span> : r.vacation}</td>
                            <td style={{ color: r.acc === 'ไม่สะสม' || r.acc === '-' ? '#9ca3af' : '#059669', fontWeight: r.acc.includes('สะสมได้') ? 600 : 400 }}>{r.acc}</td>
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

        {/* Main Panel */}
        <div className="glass-card" style={{ marginBottom: 24, borderRadius: 16, background: 'white', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div className="lv-filter-bar">
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginRight: '16px', whiteSpace: 'nowrap' }}>
              รายการลา {filterStatus === 'Pending' ? '(รออนุมัติ)' : filterStatus === 'Approved' ? '(อนุมัติแล้ว)' : filterStatus === 'Rejected' ? '(ไม่อนุมัติ)' : '(ทั้งหมด)'}
            </span>
            <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="ค้นหาชื่อพนักงาน หรือแผนก..." value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', transition: 'border 0.2s', fontSize: 14 }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }} className="custom-scroll">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['พนักงาน', 'ประเภท', 'ช่วงเวลา', 'วัน', 'เหตุผล', 'สถานะ', ''].map((h, i) => (
                    <th key={i} style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#475569', textAlign: (i === 3 || i === 5) ? 'center' : i === 6 ? 'right' : 'left' }}>
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
                  <tr key={l.leave_id} className="lv-table-row" onClick={() => { setSelectedLeave(l); setShowReviewModal(true); }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
                          <Image
                            src={l.image ? `/uploads/${l.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(l.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
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
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500,
                        background: (CATEGORIES.find(c => c.id === l.leave_category)?.color || '#6b7280') + '18',
                        color: CATEGORIES.find(c => c.id === l.leave_category)?.color || '#6b7280'
                      }}>
                        {CATEGORIES.find(c => c.id === l.leave_category)?.name || 'อื่นๆ'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#374151' }}>
                      {l.start_date?.split('T')[0]} <span style={{ color: '#d1d5db', margin: '0 2px' }}>→</span> {l.end_date?.split('T')[0]}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#111827', fontSize: 14 }}>
                      {calculateDays(l.start_date, l.end_date)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280', maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {l.reason || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>{badge(l.status)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button style={{ width: 32, height: 32, padding: 0, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fff' }}>
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
                      const emp = employees.find(e => e.emp_id === val || e.citizen_id === val);
                      if (emp) {
                        const dbType = dbLeaveTypes.find(t => t.leave_type_id === emp.leave_type_id) || dbLeaveTypes.find(t => t.emp_group_name === emp.emp_type);
                        setForm({ ...form, emp_id: val, leave_type_id: dbType ? dbType.leave_type_id : form.leave_type_id });
                      } else {
                        setForm({ ...form, emp_id: val });
                      }
                    }}
                    options={employees.map(e => ({ 
                      value: e.citizen_id || e.emp_id, 
                      label: `${e.first_name_th} ${e.last_name_th} (${e.nickname || 'ไม่มีชื่อเล่น'})` 
                    }))}
                    placeholder="-- ค้นหาชื่อพนักงาน --"
                    minWidth="100%"
                  />
                </div>
              ) : (
                <div style={{ padding: '16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>
                    {(user?.username || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{user?.username}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{user?.emp_id ? `ID: ${user.emp_id}` : 'บัญชีบุคลากร'}</div>
                  </div>
                </div>
              )}

              {/* Real-time Quota Display for Selected Employee */}
              {(() => {
                const selectedEmpId = isAdmin ? form.emp_id : user?.emp_id || user?.citizen_id;
                const emp = employees.find(e => e.emp_id === selectedEmpId || e.citizen_id === selectedEmpId);
                if (!emp) return null;

                const fyRange = getCurrentFiscalYearRange();
                const empLeaves = leaves.filter(l => 
                  l.emp_id === emp.emp_id && 
                  l.status === 'Approved' &&
                  new Date(l.start_date) >= fyRange.start && 
                  new Date(l.start_date) <= fyRange.end
                );

                // Try to get quota from DB using leave_type_id first, then fallback to name matching
                const dbType = dbLeaveTypes.find(t => t.leave_type_id === form.leave_type_id) || dbLeaveTypes.find(t => t.emp_group_name === emp.emp_type);
                let qPersonal = 0, qSick = 0, qVacation = 0;

                if (dbType) {
                  qPersonal = dbType.personal_quota;
                  qSick = dbType.sick_quota;
                  qVacation = dbType.vacation_quota;
                } else {
                  const hardQuota = getQuotaByType(emp.emp_type || '', emp.start_date);
                  qPersonal = hardQuota.personal;
                  qSick = hardQuota.sick;
                  qVacation = hardQuota.vacation;
                }

                const usedSick = empLeaves.filter(l => l.leave_category === 'Sick').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
                const usedPersonal = empLeaves.filter(l => l.leave_category === 'Personal').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
                const usedVacation = empLeaves.filter(l => l.leave_category === 'Vacation').reduce((s, l) => s + calculateDays(l.start_date, l.end_date), 0);
                
                const accVac = emp.accumulated_vacation || 0;
                const totalVac = qVacation + accVac;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '14px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {[
                      { label: 'ลากิจ', rem: qPersonal - usedPersonal, total: qPersonal, color: '#6366f1' },
                      { label: 'ลาป่วย', rem: qSick - usedSick, total: qSick, color: '#f59e0b' },
                      { label: 'พักผ่อน', rem: totalVac - usedVacation, total: totalVac, color: '#10b981' },
                    ].map((q, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>{q.label}</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: q.color }}>{q.rem}<span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>/{q.total}</span></div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>ประเภทการลา</label>
                  <CustomSelect
                    value={form.leave_category}
                    onChange={val => setForm({ ...form, leave_category: val })}
                    options={CATEGORIES.map(c => ({ value: c.id, label: c.name }))}
                    minWidth="100%"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>กลุ่มบุคลากร</label>
                  <CustomSelect
                    value={form.leave_type_id}
                    onChange={val => setForm({ ...form, leave_type_id: val })}
                    disabled={!isAdmin}
                    options={dbLeaveTypes.length > 0
                      ? dbLeaveTypes.map(t => ({ value: t.leave_type_id, label: t.emp_group_name }))
                      : LEAVE_TYPES.map(t => ({ value: t.id, label: t.name }))
                    }
                    minWidth="100%"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <ThaiDateInput
                  label="วันเริ่มต้น"
                  value={form.start_date}
                  onChange={val => setForm({ ...form, start_date: val })}
                  required
                  style={{ ...inp, background: 'white' }}
                />
                <ThaiDateInput
                  label="วันสิ้นสุด"
                  value={form.end_date}
                  onChange={val => setForm({ ...form, end_date: val })}
                  required
                  style={{ ...inp, background: 'white' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>เหตุผลความจำเป็น</label>
                <textarea rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="ระบุรายละเอียดสั้นๆ..." style={{ ...inp, padding: '12px 14px', resize: 'none', borderRadius: 16 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>แนบไฟล์หลักฐาน (ถ้ามี)</label>
                <input type="file" onChange={e => setAttachment(e.target.files?.[0] || null)} style={{ ...inp, padding: '8px', borderRadius: 16 }} />
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
        {showReviewModal && selectedLeave && (() => {
          const days = calculateDays(selectedLeave.start_date, selectedLeave.end_date);
          const typeCfg = LEAVE_TYPES.find(t => t.id === selectedLeave.leave_type_id);
          const quotaObj = getQuotaByType(selectedLeave.emp_type || '', selectedLeave.start_date_work);
          
          const cat = selectedLeave.leave_category || 'Sick';
          let qt = 0;
          if (cat === 'Sick') qt = quotaObj.sick || typeCfg?.s_qt || 0;
          else if (cat === 'Personal') qt = quotaObj.personal || typeCfg?.p_qt || 0;
          else if (cat === 'Vacation') qt = quotaObj.vacation || typeCfg?.v_qt || 0;

          const acc = (selectedLeave as any).accumulated_vacation || 0;
          const totalQt = qt + acc;

          const usedInFiscalYear = leaves
            .filter(l => 
              l.emp_id === selectedLeave.emp_id && 
              l.status === 'Approved' && 
              (l as any).leave_category === (selectedLeave as any).leave_category &&
              new Date(l.start_date) >= getCurrentFiscalYearRange().start &&
              new Date(l.start_date) <= getCurrentFiscalYearRange().end &&
              l.leave_id !== selectedLeave.leave_id
            )
            .reduce((sum, l) => sum + calculateDays(l.start_date, l.end_date), 0);

          const finalRem = totalQt - usedInFiscalYear - (selectedLeave.status === 'Approved' ? 0 : days);
          const over = finalRem < 0;

          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}
              onClick={e => e.target === e.currentTarget && setShowReviewModal(false)}>
              <div style={{ background: 'white', borderRadius: 24, padding: '24px 32px', width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }} className="custom-scroll">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>รายละเอียดการลา</h3>
                  <button onClick={() => setShowReviewModal(false)} style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
                    <Image 
                      src={selectedLeave.image ? `/uploads/${selectedLeave.image}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedLeave.first_name_th || 'User')}&background=random&color=fff&size=128&bold=true`}
                      alt={selectedLeave.first_name_th || 'Avatar'}
                      fill
                      unoptimized
                      style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', background: 'white' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, marginBottom: 2 }}>{selectedLeave.first_name_th} {selectedLeave.last_name_th}</div>
                    <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{selectedLeave.dept_name || 'ไม่ระบุแผนก'}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'ประเภทการลา', value: CATEGORIES.find(c => c.id === selectedLeave.leave_category)?.name || 'อื่นๆ', color: CATEGORIES.find(c => c.id === selectedLeave.leave_category)?.color },
                    { label: 'จำนวนวันลา', value: `${days} วัน`, bold: true, color: '#0f172a' },
                    { label: 'วันที่เริ่มต้น', value: formatThaiDate(selectedLeave.start_date) },
                    { label: 'วันที่สิ้นสุด', value: formatThaiDate(selectedLeave.end_date) },
                  ].map((d, i) => (
                    <div key={i} style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>{d.label}</div>
                      <div style={{ fontSize: 14, fontWeight: d.bold ? 800 : 700, color: d.color || '#334155' }}>{d.value}</div>
                    </div>
                  ))}
                  <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '14px 18px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>เหตุผลการลา</div>
                    <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{selectedLeave.reason || 'ไม่ได้ระบุเหตุผล'}</div>
                  </div>
                  {selectedLeave.attachment && (
                    <div style={{ gridColumn: 'span 2', background: '#eff6ff', padding: '14px 18px', borderRadius: 16, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>ไฟล์แนบหลักฐาน</div>
                      <a href={`/uploads/${selectedLeave.attachment}`} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#2563eb', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        เปิดดูไฟล์แนบ
                      </a>
                    </div>
                  )}
                </div>

                <div style={{ padding: '18px', borderRadius: 20, marginBottom: 28, border: over ? '1px solid #fecaca' : '1px solid #bbf7d0', background: over ? '#fef2f2' : '#f0fdf4' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: over ? '#b91c1c' : '#166534', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {over ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" /></svg>
                    )}
                    {over ? 'คำเตือน: วันลาเกินสิทธิ์โควตาที่กำหนด' : 'สถานะวันลาคงเหลือ'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      <span>โควตาปีปัจจุบัน</span>
                      <span style={{ fontWeight: 700 }}>{qt} วัน</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      <span>ใช้ไปแล้ว (รวมสะสม)</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>-{usedInFiscalYear} วัน</span>
                    </div>
                    <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ fontWeight: 800, color: '#1e293b' }}>คงเหลือสุทธิ</span>
                      <span style={{ fontWeight: 900, color: finalRem < 0 ? '#ef4444' : '#10b981', fontSize: 20 }}>{finalRem} วัน</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase' }}>ขั้นตอนการอนุมัติ</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { id: 'Head of Dept', label: '1. หัวหน้าแผนก', status: selectedLeave.dept_head_status },
                      { id: 'Administration', label: '2. ธุรการ', status: selectedLeave.admin_status },
                      { id: 'Housekeeper', label: '3. พ่อบ้าน', status: selectedLeave.housekeeper_status },
                      { id: 'Director', label: '4. ผอ.', status: selectedLeave.director_status },
                    ].map((s, i) => {
                      const isCurrent = selectedLeave.current_stage === s.id;
                      const isDone = s.status === 'Approved';
                      const isRejected = s.status === 'Rejected';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: isCurrent ? '#eff6ff' : '#f8fafc', border: isCurrent ? '1px solid #3b82f6' : '1px solid #e2e8f0', opacity: (selectedLeave.status === 'Rejected' && !isDone && !isRejected) ? 0.5 : 1 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: isDone ? '#10b981' : isRejected ? '#ef4444' : isCurrent ? '#3b82f6' : '#e2e8f0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>
                            {isDone ? '✓' : isRejected ? '×' : i + 1}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: isCurrent ? 800 : 600, color: isDone ? '#166534' : isRejected ? '#b91c1c' : isCurrent ? '#1e40af' : '#64748b' }}>{s.label}</div>
                          {isCurrent && selectedLeave.status === 'Pending' && <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6' }}>กำลังพิจารณา</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {((isSuperAdmin || isHR || (isHead && selectedLeave.current_stage === 'Head of Dept')) && selectedLeave.status === 'Pending') ? (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => { changeLeaveStatus(String(selectedLeave.leave_id), 'Rejected', String(selectedLeave.current_stage)); setShowReviewModal(false); }}
                      style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}>
                      ไม่อนุมัติ
                    </button>
                    <button onClick={() => { changeLeaveStatus(String(selectedLeave.leave_id), 'Approved', String(selectedLeave.current_stage)); setShowReviewModal(false); }}
                      style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: '#0f172a', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                      อนุมัติ
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>{badge(selectedLeave.status)}</div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </AppLayout>
  );
}