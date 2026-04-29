'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Swal from 'sweetalert2'
import { useAuth } from '@/contexts/AuthContext'
import CustomSelect from '@/components/CustomSelect'

export default function SchedulePage() {
  const { user } = useAuth();
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isHR = role === 'HR';
  const isAdmin = isSuperAdmin || isHR;
  const [reimbursementsList, setReimbursementsList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReim, setSelectedReim] = useState<any | null>(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/reimbursements');
      if (res.ok) {
        const data = await res.json();
        setReimbursementsList(data);
      }
    } catch (err) {
      console.error('Failed to load reimbursement history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // --- Reimbursement States ---
  const [showReimModal, setShowReimModal] = useState(false);
  const [submittingReim, setSubmittingReim] = useState(false);
  const [reimForm, setReimForm] = useState({
    fullName: '',
    title: '',
    date: '',
    organizerAmount: '',
    parentAmount: '',
    file: null as File | null
  });

  const handleReimSubmit = async () => {
    if (!reimForm.title || !reimForm.date) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลหัวข้อและวันที่ให้ครบถ้วน', 'warning');
      return;
    }

    setSubmittingReim(true);
    try {
      const formData = new FormData();
      formData.append('full_name', reimForm.fullName);
      formData.append('title', reimForm.title);
      formData.append('date', reimForm.date);
      formData.append('organizer_amount', reimForm.organizerAmount);
      formData.append('parent_amount', reimForm.parentAmount);
      if (reimForm.file) {
        formData.append('file', reimForm.file);
      }

      const res = await fetch('/api/reimbursements', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save reimbursement');

      Swal.fire({
        title: 'บันทึกสำเร็จ',
        text: 'ข้อมูลการเบิกงบประมาณถูกบันทึกเรียบร้อยแล้ว',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

      setShowReimModal(false);
      setReimForm({ fullName: '', title: '', date: '', organizerAmount: '', parentAmount: '', file: null });
      loadHistory();
    } catch (err: any) {
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
    } finally {
      setSubmittingReim(false);
    }
  };



  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        /* ===========================
           COLOR TOKENS & FORMAL THEME
           =========================== */
        .schedule-page {
          --primary: #2563eb; --primary-lt: #eff6ff; --primary-dk: #1d4ed8;
          --green: #059669; --green-lt: #ecfdf5;
          --amber: #d97706; --amber-lt: #fffbeb;
          --purple: #6d28d9; --purple-lt: #f5f3ff;
          --red: #dc2626;
          --card: #ffffff; --bg: #f8fafc; --txt: #1e293b; --txt2: #64748b;
          --bdr: #e2e8f0; --shd: 0 1px 3px rgba(0,0,0,.04); --shd2: 0 4px 12px rgba(0,0,0,.06);
          --rad: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .sp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--bdr); }
        .sp-header-left { display: flex; align-items: center; gap: 12px; }
        .sp-header-icon { color: var(--txt2); }
        .sp-header h1 { margin: 0; font-size: 20px; font-weight: 700; color: var(--txt); }
        .sp-header-sub { margin: 2px 0 0; font-size: 13px; color: var(--txt2); font-weight: 500; }
        .sp-summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .sp-sum-card { background: var(--card); border-radius: var(--rad); padding: 16px 20px; display: flex; align-items: center; gap: 14px; box-shadow: var(--shd); border: 1px solid var(--bdr); }
        .sp-sum-icon { width: 44px; height: 44px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; }
        .sp-sum-icon-blue { background: var(--primary); }
        .sp-sum-icon-green { background: var(--green); }
        .sp-sum-icon-amber { background: var(--amber); }
        .sp-sum-body { display: flex; flex-direction: column; }
        .sp-sum-num { font-size: 24px; font-weight: 700; color: var(--txt); line-height: 1.2; }
        .sp-sum-label { font-size: 12px; color: var(--txt2); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .sp-cal-card { background: var(--card); border-radius: var(--rad); padding: 24px; box-shadow: var(--shd); border: 1px solid var(--bdr); margin-bottom: 24px; }
        .sp-cal-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .sp-cal-nav { display: flex; align-items: center; gap: 8px; }
        .sp-btn-nav { width: 34px; height: 34px; border-radius: 6px; border: 1px solid var(--bdr); background: var(--card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--txt2); transition: .2s; }
        .sp-btn-nav:hover { background: var(--bg); color: var(--txt); }
        .sp-cal-month { font-size: 18px; font-weight: 700; color: var(--txt); min-width: 140px; text-align: center; margin: 0; }
        .sp-btn-today { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--bdr); background: #fff; color: var(--txt); font-weight: 600; font-size: 13px; cursor: pointer; transition: .2s; }
        .sp-btn-today:hover { background: var(--bg); }
        .sp-cal-views { display: flex; border: 1px solid var(--bdr); border-radius: 6px; overflow: hidden; }
        .sp-btn-view { padding: 6px 14px; border: none; background: #fff; color: var(--txt2); font-size: 13px; font-weight: 600; cursor: pointer; transition: .2s; text-transform: capitalize; border-right: 1px solid var(--bdr); }
        .sp-btn-view:last-child { border-right: none; }
        .sp-btn-view:hover { background: var(--bg); }
        .sp-btn-view.active { background: var(--primary-lt); color: var(--primary-dk); }
        .sp-shift-legend { display: flex; gap: 20px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--bdr); justify-content: center; }
        .sp-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--txt2); font-weight: 600; }
        .sp-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .sp-dept-card { background: var(--card); border-radius: var(--rad); padding: 20px 24px; box-shadow: var(--shd); border: 1px solid var(--bdr); }
        .sp-dept-title { font-size: 16px; font-weight: 700; color: var(--txt); margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .sp-dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 14px; }
        .sp-dept-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: linear-gradient(to bottom right, #ffffff, #fdfbfa); border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); transition: all 0.25s ease; }
        .sp-dept-item:hover { transform: translateY(-3px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.06); border-color: #cbd5e1; }
        .sp-dept-name { font-weight: 700; color: #334155; font-size: 14px; letter-spacing: 0.2px; }
        .sp-dept-badge { font-size: 12px; color: #1d4ed8; font-weight: 800; background: #eff6ff; padding: 4px 12px; border-radius: 20px; border: 1px solid #bfdbfe; box-shadow: inset 0 1px 2px rgba(255,255,255,0.7); }
        .sp-modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; transition: all 0.3s ease; }
        .sp-modal-box { background: #ffffff; border-radius: 32px; padding: 32px 36px; width: 600px; max-width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2); animation: spModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes spModalIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .sp-modal-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; }
        .sp-modal-top h3 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; letter-spacing: -0.5px; }
        .sp-modal-x { background: #f8fafc; border: 1px solid #e2e8f0; font-size: 18px; cursor: pointer; color: #64748b; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
        .sp-modal-x:hover { background: #f1f5f9; color: #0f172a; transform: rotate(90deg); }
        .sp-modal-date { font-size: 14px; color: #3b82f6; margin-bottom: 24px; padding: 12px 16px; background: #eff6ff; border-radius: 16px; font-weight: 700; border: 1px solid #bfdbfe; display: flex; align-items: center; gap: 8px; box-shadow: inset 0 2px 4px rgba(255,255,255,0.5); }
        .sp-modal-existing { margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .sp-existing-title { font-size: 13px; color: #475569; margin: 0 0 12px; font-weight: 700; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }
        .sp-existing-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: transform 0.2s; }
        .sp-existing-item:hover { transform: translateX(4px); border-color: #94a3b8; }
        .sp-existing-info { display: flex; align-items: center; gap: 12px; font-size: 14px; color: #1e293b; font-weight: 600;}
        .sp-existing-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgba(0,0,0,0.1); }
        .sp-existing-actions { display: flex; gap: 6px; }
        .sp-btn-icon { background: #f1f5f9; border: none; cursor: pointer; color: #475569; width: 32px; height: 32px; border-radius: 8px; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; }
        .sp-btn-icon:hover { background: #e2e8f0; color: #0f172a; transform: translateY(-2px); }
        .sp-form-group { margin-bottom: 20px; }
        .sp-form-group label { display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; letter-spacing: 0.2px; }
        .sp-req { color: #ef4444; margin-left: 2px; }
        .sp-field { width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 16px; font-size: 14px; color: #0f172a; background: #fff; transition: all 0.2s ease; box-sizing: border-box; font-weight: 500; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }
        .sp-field:hover { border-color: #94a3b8; }
        .sp-field:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px #eff6ff; background: #fff; }
        .sp-field:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; border-color: #e2e8f0; }
        .sp-shift-picker { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        .sp-shift-opt { padding: 16px; border-radius: 12px; border: 2px solid #e2e8f0; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: #fff; transition: all 0.2s ease; position: relative; overflow: hidden; }
        .sp-shift-opt::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.02)); opacity: 0; transition: 0.2s; }
        .sp-shift-opt:hover { transform: translateY(-2px); border-color: #cbd5e1; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        .sp-shift-opt:hover::before { opacity: 1; }
        .sp-shift-opt-active { border-color: #3b82f6; background: #eff6ff; box-shadow: 0 0 0 1px #3b82f6, 0 10px 15px -3px rgba(59,130,246,0.1); }
        .sp-shift-opt-active .sp-shift-icon { color: #3b82f6; }
        .sp-shift-opt-active .sp-shift-label { color: #1e3a8a; font-weight: 700; }
        .sp-shift-icon { color: #64748b; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .sp-shift-label { font-size: 13px; font-weight: 600; color: #475569; text-align: center; z-index: 1; transition: 0.2s; }
        .sp-modal-btns { display: flex; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; background: #fff; }
        .sp-btn-save { flex: 2; padding: 14px; border-radius: 12px; border: none; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(37,99,235,0.2), 0 2px 4px -1px rgba(37,99,235,0.1); display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.5px; }
        .sp-btn-save:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(37,99,235,0.3), 0 4px 6px -2px rgba(37,99,235,0.15); }
        .sp-btn-save:active { transform: translateY(0); }
        .sp-btn-save:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; transform: none; }
        .sp-btn-delete { flex: 1; padding: 14px; border-radius: 16px; border: 1.5px solid #fecaca; background: #fff; color: #ef4444; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .sp-btn-delete:hover { background: #fef2f2; border-color: #ef4444; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(239,68,68,0.1); }
        .sp-btn-cancel { flex: 1; padding: 14px; border-radius: 16px; border: 1.5px solid #cbd5e1; background: #fff; color: #475569; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .sp-btn-cancel:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .sp-loading { text-align: center; padding: 40px; color: #64748b; font-size: 15px; font-weight: 500; }
        .sp-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px; color: #b91c1c; font-size: 14px; font-weight: 500; box-shadow: 0 4px 6px -1px rgba(239,68,68,0.05); }
        /* Fix SVG sizes */
        .schedule-page svg { max-width: 24px; max-height: 24px; flex-shrink: 0; }
        .sp-header-icon svg { width: 28px; height: 28px; max-width: 28px; max-height: 28px; }
        .sp-sum-icon svg { width: 22px; height: 22px; }
        .sp-btn-nav svg { width: 16px; height: 16px; }
        .sp-dept-title svg { width: 22px; height: 22px; }
        .sp-modal-top h3 svg { width: 20px; height: 20px; }
        .sp-modal-top .sp-modal-x svg { width: 20px; height: 20px; }
        .sp-btn-icon svg { width: 16px; height: 16px; }
        /* Detail View Button */
        .sp-btn-detail { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 10px; border: 1.5px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
        .sp-btn-detail:hover { background: #dbeafe; border-color: #93c5fd; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(37,99,235,0.15); }
        .sp-btn-detail svg { width: 14px; height: 14px; max-width: 14px; }
        /* Detail Modal */
        .sp-detail-modal { background: #ffffff; border-radius: 28px; padding: 36px 40px; width: 560px; max-width: 100%; max-height: 88vh; overflow-y: auto; box-shadow: 0 25px 60px -10px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.3); animation: spModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .sp-detail-hero { background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 20px; padding: 24px 28px; margin-bottom: 28px; color: white; position: relative; overflow: hidden; }
        .sp-detail-hero::before { content: ''; position: absolute; top: -30px; right: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(255,255,255,0.08); }
        .sp-detail-hero::after { content: ''; position: absolute; bottom: -20px; left: -20px; width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.06); }
        .sp-detail-hero-title { font-size: 20px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.3px; position: relative; z-index: 1; }
        .sp-detail-hero-date { font-size: 13px; opacity: 0.85; font-weight: 600; position: relative; z-index: 1; display: flex; align-items: center; gap: 6px; }
        .sp-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .sp-detail-field { background: #f8fafc; border-radius: 16px; padding: 18px 20px; border: 1px solid #e2e8f0; }
        .sp-detail-field-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .sp-detail-field-value { font-size: 20px; font-weight: 800; color: #0f172a; }
        .sp-detail-field-unit { font-size: 12px; font-weight: 600; color: #64748b; margin-top: 2px; }
        .sp-detail-file-box { background: #f8fafc; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
        .sp-detail-file-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .sp-detail-file-label svg { width: 15px; height: 15px; max-width: 15px; }
        .sp-detail-file-link { display: inline-flex; align-items: center; gap: 10px; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 12px 18px; color: #1d4ed8; font-weight: 700; font-size: 14px; text-decoration: none; transition: all 0.2s; }
        .sp-detail-file-link:hover { background: #dbeafe; border-color: #93c5fd; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(37,99,235,0.15); }
        .sp-detail-file-link svg { width: 18px; height: 18px; max-width: 18px; }
        `}} />

      <div className="schedule-page" style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>

        {/* HEADER */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ประวัติการเบิกงบประมาณ
            </h1>
            <p className="page-subtitle">บันทึกและจัดการประวัติการเบิกงบประมาณประชุม/อบรมวิชาการ</p>
          </div>
          <button 
            onClick={() => setShowReimModal(true)}
            className="hover-glow"
            style={{ 
              background: 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '16px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.2s'
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            เพิ่มการเบิกงบประมาณประชุม/อบรม
          </button>
        </div>


        {/* REIMBURSEMENT HISTORY CARD */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', overflow: 'hidden', border: 'none' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>ประวัติการเบิกงบประมาณ</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>รายการบันทึกคำขอเบิกงบประมาณสนับสนุนการประชุมและอบรมวิชาการ</p>
          </div>

          {loadingHistory ? (
            <div className="sp-loading">กำลังดึงข้อมูลประวัติการเบิกงบประมาณ...</div>
          ) : reimbursementsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
              ไม่มีประวัติข้อมูลการเบิกงบประมาณ
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>ชื่อ-นามสกุล</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>หัวข้อการประชุม/อบรม</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#475569' }}>วันที่</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>เบิกจากผู้จัด</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>เบิกจากต้นสังกัด</th>
                    <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>เอกสารแนบ</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursementsList.map((r: any) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedReim(r)}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s', cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f9f5')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{r.full_name || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{r.title}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#64748b' }}>{new Date(r.reimbursement_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>
                        {r.organizer_amount ? parseFloat(r.organizer_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'} บาท
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: 600, textAlign: 'right' }}>
                        {r.parent_amount ? parseFloat(r.parent_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'} บาท
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        {r.memo_file ? (
                          <a href={`/uploads/${r.memo_file}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', border: '1px solid #bfdbfe' }} className="hover-glow">
                            เปิดดูไฟล์
                          </a>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>- ไม่มีไฟล์ -</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>




        {/* DETAIL VIEW MODAL */}
        {selectedReim && (
          <div className="sp-modal-bg" onClick={() => setSelectedReim(null)}>
            <div className="sp-detail-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="sp-modal-top" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="22" height="22" fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  รายละเอียดการเบิกงบประมาณ
                </h3>
                <button className="sp-modal-x" onClick={() => setSelectedReim(null)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Hero Banner */}
              <div className="sp-detail-hero">
                {selectedReim.full_name && (
                  <p style={{ fontSize: '13px', opacity: 0.8, fontWeight: 600, margin: '0 0 4px', position: 'relative', zIndex: 1 }}>
                    👤 {selectedReim.full_name}
                  </p>
                )}
                <p className="sp-detail-hero-title">{selectedReim.title}</p>
                <p className="sp-detail-hero-date">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 14, height: 14, maxWidth: 14 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(selectedReim.reimbursement_date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Amount Grid */}
              <div className="sp-detail-grid">
                <div className="sp-detail-field">
                  <div className="sp-detail-field-label">เบิกจากผู้จัด</div>
                  <div className="sp-detail-field-value">
                    {selectedReim.organizer_amount ? parseFloat(selectedReim.organizer_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                  <div className="sp-detail-field-unit">บาท</div>
                </div>
                <div className="sp-detail-field">
                  <div className="sp-detail-field-label">เบิกจากต้นสังกัด</div>
                  <div className="sp-detail-field-value">
                    {selectedReim.parent_amount ? parseFloat(selectedReim.parent_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 }) : '0.00'}
                  </div>
                  <div className="sp-detail-field-unit">บาท</div>
                </div>
              </div>

              {/* Total */}
              <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '16px', padding: '18px 22px', marginBottom: '20px', border: '1.5px solid #86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>รวมทั้งหมด</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>
                  {((parseFloat(selectedReim.organizer_amount || '0') + parseFloat(selectedReim.parent_amount || '0'))).toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                </span>
              </div>

              {/* File Attachment */}
              <div className="sp-detail-file-box">
                <div className="sp-detail-file-label">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  เอกสารแนบ
                </div>
                {selectedReim.memo_file ? (
                  <a href={`/uploads/${selectedReim.memo_file}`} target="_blank" rel="noreferrer" className="sp-detail-file-link">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    เปิดดูเอกสารแนบ
                  </a>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20, maxWidth: 20 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    ไม่มีเอกสารแนบ
                  </div>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedReim(null)}
                style={{ width: '100%', padding: '14px', borderRadius: '16px', border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
              >
                ปิด
              </button>
            </div>
          </div>
        )}

        {/* REIMBURSEMENT MODAL */}
        {showReimModal && (
          <div className="sp-modal-bg" onClick={() => setShowReimModal(false)}>
            <div className="sp-modal-box" onClick={(e) => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="sp-modal-top">
                <h3>
                  เพิ่มการเบิกงบประมาณประชุม/อบรม
                </h3>
                <button className="sp-modal-x" onClick={() => setShowReimModal(false)}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>ชื่อ-นามสกุล</label>
                  <input className="sp-field"
                    value={reimForm.fullName}
                    onChange={(e) => setReimForm({ ...reimForm, fullName: e.target.value })}
                    placeholder="ระบุชื่อ-นามสกุลผู้เบิก" />
                </div>

                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>การประชุม/อบรม <span className="sp-req">*</span></label>
                  <input className="sp-field" 
                    value={reimForm.title}
                    onChange={(e) => setReimForm({ ...reimForm, title: e.target.value })}
                    placeholder="ระบุหัวข้อการประชุมหรือการอบรม" />
                </div>

                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>วัน/เดือน/ปี <span className="sp-req">*</span></label>
                  <input type="date" className="sp-field" 
                    value={reimForm.date}
                    onChange={(e) => setReimForm({ ...reimForm, date: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>เบิกจากผู้จัด (บาท)</label>
                    <input type="number" className="sp-field" 
                      value={reimForm.organizerAmount}
                      onChange={(e) => setReimForm({ ...reimForm, organizerAmount: e.target.value })}
                      placeholder="0.00" />
                  </div>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>เบิกจากต้นสังกัด (บาท)</label>
                    <input type="number" className="sp-field" 
                      value={reimForm.parentAmount}
                      onChange={(e) => setReimForm({ ...reimForm, parentAmount: e.target.value })}
                      placeholder="0.00" />
                  </div>
                </div>

                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>ไฟล์เอกสารบันทึกข้อความการเบิกเงิน</label>
                  <input type="file" className="sp-field" 
                    onChange={(e) => setReimForm({ ...reimForm, file: e.target.files ? e.target.files[0] : null })}
                    style={{ padding: '8px' }} />
                  <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>รองรับไฟล์ภาพ หรือ PDF</p>
                </div>
              </div>

              <div className="sp-modal-btns">
                <button className="sp-btn-save" 
                  onClick={handleReimSubmit} 
                  disabled={submittingReim}
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
                  {submittingReim ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
                <button className="sp-btn-cancel" onClick={() => setShowReimModal(false)}>ยกเลิก</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
