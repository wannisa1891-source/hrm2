'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Swal from 'sweetalert2'
import useScheduleControls, { VIEWS } from './useScheduleControls'
import useScheduleModal from './useScheduleModal'
import useScheduleSummary from './useScheduleSummary'
import useScheduleStatus from './useScheduleStatus'
import { useSchedules } from '@/hooks/useSchedules'
import ListView from './View/ListView'
import WeekView from './View/WeekView'
import MonthView from './View/MonthView'
import YearView from './View/YearView'
import { useAuth } from '@/contexts/AuthContext'
import CustomSelect from '@/components/CustomSelect'
import type { Schedule, ScheduleForm } from './useScheduleModal'
import type { ScheduleRecord } from '@/services/apiService'

// แปลง ScheduleRecord (จาก API) → Schedule (ใช้ใน component)
function toSchedule(r: ScheduleRecord): Schedule {
  return {
    id: r.id,
    date: new Date(r.schedule_date),
    subject: r.nurse_name,
    room: r.shift,
    organizer: r.department,
    unit: r.unit_name,
    bookerName: r.booker_name,
    contactPhone: r.contact_phone,
    startTime: r.startTime || '09:00',
    endTime: r.endTime || '10:00',
    note: r.note || '',
  }
}

// ฟอร์แมต "YYYY-MM" จากวันที่
function toMonthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// ฟอร์แมต "YYYY-MM-DD" จากวันที่
function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function SchedulePage() {
  const { user } = useAuth();
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isHR = role === 'HR';
  const isAdmin = isSuperAdmin || isHR;
  const { schedules: apiSchedules, loading, error, loadSchedules, addSchedule, editSchedule, removeSchedule } = useSchedules()

  // แปลง ScheduleRecord[] → Schedule[] สำหรับ component ต่างๆ
  const schedules: Schedule[] = useMemo(() => apiSchedules.map(toSchedule), [apiSchedules])

  const {
    currentDate,
    setCurrentDate,
    currentView,
    formatDisplay,
    formatDate,
    goPrev,
    goNext,
    goToday,
    changeView,
  } = useScheduleControls()

  const {
    showModal,
    selectedDate,
    editingId,
    errors,
    roomTypes,
    departments,
    employees,
    form,
    setForm,
    isEditing,
    openModal,
    openEditModal,
    closeModal,
    deptData,
    units,
    checkRoomConflict,
    getShiftColor,
  } = useScheduleModal(schedules, () => loadSchedules(toMonthKey(currentDate)))

  const { totalSchedules, todaySchedules, monthSchedules } = useScheduleSummary(schedules)
  const { departmentStatus } = useScheduleStatus(schedules)

  // --- Reimbursement States ---
  const [showReimModal, setShowReimModal] = useState(false);
  const [submittingReim, setSubmittingReim] = useState(false);
  const [reimForm, setReimForm] = useState({
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
      setReimForm({ title: '', date: '', organizerAmount: '', parentAmount: '', file: null });
    } catch (err: any) {
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
    } finally {
      setSubmittingReim(false);
    }
  };

  const conflictErrors = useMemo(() => {
    if (!form.room || !selectedDate || !form.startTime || !form.endTime) return [];
    return checkRoomConflict(form.room, selectedDate, form.startTime, form.endTime, editingId);
  }, [form.room, selectedDate, form.startTime, form.endTime, editingId, schedules, checkRoomConflict]);

  const hasConflicts = conflictErrors.length > 0;

  const yesterdayStr = useMemo(() => selectedDate ? new Date(selectedDate.getTime() - 86400000).toDateString() : '', [selectedDate]);
  const todayStr = useMemo(() => selectedDate ? selectedDate.toDateString() : '', [selectedDate]);
  const tomorrowStr = useMemo(() => selectedDate ? new Date(selectedDate.getTime() + 86400000).toDateString() : '', [selectedDate]);

  const empContextSchedules = useMemo(() => {
    if (!form.subject || !selectedDate) return [];
    const empIdOnly = form.subject.split(' - ')[0].trim();
    return schedules.filter(s => {
      const sEmpIdOnly = s.subject ? s.subject.split(' - ')[0].trim() : '';
      if (sEmpIdOnly !== empIdOnly) return false;
      if (editingId && s.id === editingId) return false;
      const dStr = s.date.toDateString();
      return dStr === yesterdayStr || dStr === todayStr || dStr === tomorrowStr;
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [form.subject, selectedDate, schedules, editingId, yesterdayStr, todayStr, tomorrowStr]);

  // โหลดการประชุมของเดือนที่กำลังดูอยู่
  useEffect(() => {
    loadSchedules(toMonthKey(currentDate))
  }, [currentDate, loadSchedules])

  useEffect(() => {
    if (showModal && !isEditing && !isAdmin && user && employees.length > 0) {
      const u = user as any;
      const expectedName = `${u.emp_id || ''} - ${u.name || u.username || ''}`;
      let expectedDept = '';

      const empData = employees.find(e => e.emp_id === u.emp_id);
      if (empData && empData.dept_id && deptData) {
        const d = (deptData as any[])?.find(d => d.dept_id === empData.dept_id);
        if (d && d.division) expectedDept = d.division;
      }

      setForm((f: ScheduleForm) => {
        if (f.subject === expectedName && f.organizer === expectedDept) {
          return f; // Prevent infinite loop
        }
        return { ...f, subject: expectedName, organizer: expectedDept, bookerName: u.name || u.username || '' };
      });
    }
  }, [showModal, isEditing, isAdmin, user, setForm, departments, employees])

  function openMonth(monthIndex: number) {
    const newDate = new Date(currentDate)
    newDate.setMonth(monthIndex)
    setCurrentDate(newDate)
    changeView('month')
  }

  function openDay(date: Date) {
    setCurrentDate(date)
    changeView('list')
  }

  async function confirmDelete(id: string) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบการประชุม',
      text: 'คุณต้องการลบการประชุมนี้ใช่ไหม?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ลบการประชุม',
      cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      try {
        await removeSchedule(id, toMonthKey(currentDate));
        closeModal();
        Swal.fire({ title: 'ลบการประชุมสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
      } catch (err: any) {
        Swal.fire('ลบการประชุมไม่สำเร็จ', err.message || 'Error deleting schedule', 'error');
      }
    }
  }

  // บันทึกการประชุม (เพิ่ม / แก้ไข) ผ่าน API
  async function handleSave(keepOpen: boolean = false) {
    if (!selectedDate) return
    if (!form.subject.trim() || !form.room || !form.organizer) {
      Swal.fire('ข้อความแจ้งเตือน', 'กรุณาระบุข้อมูลจำเป็นให้ครบถ้วน', 'warning');
      return;
    }

    try {
      // Extract Emp ID from nurseName if it's in format "ID - Name"
      let empIdOnly = form.subject.split(' - ')[0].trim();
      if (!empIdOnly) {
        empIdOnly = form.subject.replace(' - ', '').trim();
      }

      const scheduleData = {
        nurseName: empIdOnly,
        shift: form.room,
        department: form.organizer,
        unitName: form.unit || '',
        bookerName: form.bookerName || '',
        contactPhone: form.contactPhone || '',
        startTime: form.startTime || '09:00',
        endTime: form.endTime || '10:00',
        note: form.note || '',
        date: toDateStr(selectedDate)
      };

      if (isEditing && editingId) {
        await editSchedule(editingId, scheduleData, toMonthKey(currentDate))
      } else {
        await addSchedule(scheduleData, toMonthKey(currentDate))
      }

      if (keepOpen) {
        setForm({ ...form, subject: '', note: '' });
      } else {
        closeModal()
      }
      Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (err: any) {
      Swal.fire('ข้อผิดพลาด', err.message || 'Error saving schedule', 'error');
    }
  }

  const handleEditCheck = (sch: Schedule) => {
    if (isAdmin || sch.subject.includes((user as any)?.emp_id || 'UNKNOWN_EMP')) {
      openEditModal(sch)
    } else {
      Swal.fire('ไม่มีสิทธิ์', 'คุณไม่มีสิทธิ์แก้ไขการประชุมของผู้อื่น', 'error')
    }
  }

  const daySchedules = selectedDate ? schedules.filter(s => {
    const a = new Date(s.date)
    const b = new Date(selectedDate)
    if (a.toDateString() === b.toDateString()) return true;
    return false;
  }).sort((a, b) => a.date.getTime() - b.date.getTime()) : []

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
        `}} />

      <div className="schedule-page" style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>

        {/* HEADER */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="28" height="28" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
              ตารางการประชุม
            </h1>
            <p className="page-subtitle">จัดการตารางการประชุมและการจองห้องประชุมแบบครบวงจร</p>
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

        {/* ERROR BANNER */}
        {error && <div className="sp-error">เกิดข้อผิดพลาด: {error}</div>}

        {/* SUMMARY */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div className="glass-card hover-glow"
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
            onClick={() => changeView('month')}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e2433', lineHeight: 1 }}>{totalSchedules}</div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>การประชุมทั้งหมด</div>
            </div>
          </div>
          <div className="glass-card hover-glow"
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
            onClick={() => { goToday(); changeView('list'); }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e2433', lineHeight: 1 }}>{todaySchedules}</div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>การประชุมวันนี้</div>
            </div>
          </div>
          <div className="glass-card hover-glow"
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
            onClick={() => changeView('month')}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1e2433', lineHeight: 1 }}>{monthSchedules}</div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>การประชุมเดือนนี้</div>
            </div>
          </div>
        </div>

        {/* CALENDAR CARD */}
        <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', overflow: 'hidden', border: 'none' }}>
          <div className="sp-cal-controls">
            <div className="sp-cal-nav">
              <button className="sp-btn-nav" onClick={goPrev}>
                <svg width="16" height="16" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="sp-cal-month">{formatDisplay}</h2>
              <button className="sp-btn-nav" onClick={goNext}>
                <svg width="16" height="16" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button className="sp-btn-today" onClick={() => { goToday(); changeView('list'); }}>วันนี้</button>
            </div>
            <div className="sp-cal-views">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  className={`sp-btn-view${currentView === v ? ' active' : ''}`}
                  onClick={() => changeView(v)}
                >{v === 'list' ? 'วัน' : v === 'week' ? 'สัปดาห์' : v === 'month' ? 'เดือน' : 'ปี'}</button>
              ))}
            </div>
          </div>

          {/* Loading indicator */}
          {loading && <div className="sp-loading">กำลังโหลดตารางการประชุม...</div>}

          {/* Views */}
          {!loading && currentView === 'list' && (
            <ListView currentDate={currentDate} schedules={schedules}
              roomTypes={roomTypes}
              onOpenDay={openModal}
              onOpenEditModal={handleEditCheck} />
          )}
          {!loading && currentView === 'week' && (
            <WeekView currentDate={currentDate} schedules={schedules}
              getShiftColor={getShiftColor}
              onOpenDay={openModal}
              onOpenEditModal={handleEditCheck} />
          )}
          {!loading && currentView === 'month' && (
            <MonthView currentDate={currentDate} schedules={schedules}
              getShiftColor={getShiftColor}
              onOpenDay={openModal}
              onOpenEditModal={handleEditCheck} />
          )}
          {!loading && currentView === 'year' && (
            <YearView currentDate={currentDate} schedules={schedules} onOpenMonth={openMonth} />
          )}

          {/* Shift Legend */}
          {currentView !== 'year' && (
            <div className="sp-shift-legend">
              {roomTypes.map((st) => (
                <div key={st.value} className="sp-legend-item">
                  <span className="sp-legend-dot" style={{ background: st.color }} />
                  <span>{st.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DEPARTMENT STATUS */}
        {Object.keys(departmentStatus).length > 0 && (
          <div className="glass-card" style={{ padding: '32px', border: 'none' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e2433', margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" style={{ color: '#64748b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              สถานะการจองแต่ละแผนก
            </h3>
            <div className="sp-dept-grid">
              {Object.entries(departmentStatus).map(([dept, count]) => (
                <div key={dept} className="sp-dept-item">
                  <span className="sp-dept-name">{dept}</span>
                  <span className="sp-dept-badge">{count} ครั้ง</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL */}
        {showModal && (
          <div className="sp-modal-bg" onClick={closeModal}>
            <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="sp-modal-top">
                <h3>
                  {isEditing ? (
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  )}
                  {isEditing ? 'แก้ไขการประชุม' : 'การประชุม'}
                </h3>
                <button className="sp-modal-x" onClick={closeModal} aria-label="Close">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="sp-modal-date">
                วันที่: {formatDate(selectedDate)}
              </div>

              {/* Existing schedules for day */}
              {!isEditing && daySchedules.length > 0 && (
                <div className="sp-modal-existing">
                  <p className="sp-existing-title">การประชุมที่มีอยู่ในวันนี้:</p>
                  {daySchedules.map((sch) => (
                    <div key={sch.id} className="sp-existing-item">
                      <div className="sp-existing-info">
                        <span className="sp-existing-dot" style={{ background: getShiftColor(sch.room) }} />
                        <span>
                          {sch.subject} — {sch.room} — {sch.organizer}
                          {new Date(sch.date).toDateString() !== selectedDate?.toDateString() && <span className="sp-shift-type-badge ml-2 text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">ข้ามคืนจากเมื่อวาน</span>}
                        </span>
                      </div>
                      <div className="sp-existing-actions">
                        <button className="sp-btn-icon" onClick={() => openEditModal(sch)} title="แก้ไข">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button className="sp-btn-icon" onClick={() => confirmDelete(sch.id)} title="ลบ">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation errors */}
              {conflictErrors.length > 0 && (
                <div className="sp-error" style={{ background: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>⚠️ พบข้อผิดพลาดของเวลาพัก/กะชน:</div>
                  {conflictErrors.map((err, i) => (
                    <div key={i} className="mb-1 text-sm">- {err}</div>
                  ))}
                </div>
              )}
              {errors.length > 0 && (
                <div className="sp-error">
                  {errors.map((err, i) => (
                    <div key={i} className="mb-1">ข้อผิดพลาด: {err}</div>
                  ))}
                </div>
              )}

              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Row 1: Meeting Subject */}
                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>หัวข้อการประชุม <span className="sp-req">*</span></label>
                  <input className="sp-field" value={form.subject}
                    disabled={!isAdmin}
                    onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, subject: e.target.value }))}
                    placeholder="เช่น ประชุมสรุปผลการดำเนินงานประจำปี" />
                </div>

                {/* Row 2: Booker Name & Contact Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>ชื่อผู้จัด/ผู้ประสานงาน <span className="sp-req">*</span></label>
                    <input className="sp-field" value={form.bookerName}
                      onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, bookerName: e.target.value }))}
                      placeholder="ระบุชื่อผู้ติดต่อ" />
                  </div>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>เบอร์โทรศัพท์ติดต่อ</label>
                    <input className="sp-field" value={form.contactPhone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setForm((f: ScheduleForm) => ({ ...f, contactPhone: val }));
                      }}
                      placeholder="0xx-xxxxxxx" />
                  </div>
                </div>

                {/* Row 3: Department & Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>หน่วยงานผู้จัด <span className="sp-req">*</span></label>
                    <CustomSelect
                      minWidth="100%"
                      value={form.organizer}
                      disabled={!isAdmin}
                      placeholder="เลือกหน่วยงาน/แผนก"
                      options={departments.map(d => ({ value: d, label: d }))}
                      onChange={(val) => setForm((f: ScheduleForm) => ({ ...f, organizer: val }))}
                    />
                  </div>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>แผนกที่รับผิดชอบ <span className="sp-req">*</span></label>
                    <CustomSelect
                      minWidth="100%"
                      value={form.unit}
                      placeholder="เลือกกลุ่มงาน/แผนกย่อย"
                      options={units.map(u => ({ value: u, label: u }))}
                      onChange={(val) => setForm((f: ScheduleForm) => ({ ...f, unit: val }))}
                    />
                  </div>
                </div>

                {/* Row 4: Day & Time Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>วันที่ประชุม</label>
                    <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '16px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                      {selectedDate?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>เวลาเริ่ม <span className="sp-req">*</span></label>
                    <input type="time" className="sp-field" value={form.startTime}
                      onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, startTime: e.target.value }))} />
                  </div>
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label>เวลาสิ้นสุด <span className="sp-req">*</span></label>
                    <input type="time" className="sp-field" value={form.endTime}
                      onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, endTime: e.target.value }))} />
                  </div>
                </div>

                {/* Row 5: Room Selection */}
                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>สถานที่/ห้องประชุม <span className="sp-req">*</span></label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {roomTypes.map((st: any) => (
                      <div key={st.value}
                        onClick={() => setForm((f: ScheduleForm) => ({ ...f, room: st.value }))}
                        style={{
                          border: form.room === st.value ? `2px solid ${st.color}` : '1px solid #e2e8f0',
                          borderRadius: '16px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: form.room === st.value ? st.color + '10' : '#fff',
                          transition: 'all 0.2s',
                          boxShadow: form.room === st.value ? `0 0 0 3px ${st.color}20` : 'none'
                        }}>
                        {st.image ? (
                          <div style={{ height: '60px', width: '100%', background: '#f1f5f9', position: 'relative' }}>
                            <img src={st.image} alt={st.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ height: '60px', width: '100%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e2e8f0' }}>
                            <svg width="24" height="24" fill="none" stroke="#94a3b8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          </div>
                        )}
                        <div style={{ padding: '6px', textAlign: 'center', fontSize: '12px', fontWeight: form.room === st.value ? 700 : 500, color: form.room === st.value ? st.color : '#475569' }}>
                          {st.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 6: Remark */}
                <div className="sp-form-group" style={{ marginBottom: 0 }}>
                  <label>หมายเหตุ</label>
                  <input className="sp-field" value={form.note}
                    onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, note: e.target.value }))}
                    placeholder="ระบุหมายเหตุ (ถ้ามี)" />
                </div>
              </div>

              <div className="sp-modal-btns">
                {!isEditing && (
                  <button className="sp-btn-save" style={{ background: '#0ea5e9' }} onClick={() => handleSave(true)} disabled={loading || hasConflicts} title="บันทึกคนนี้แล้วเคลียร์ชื่อเพื่อกรอกคนถัดไป">
                    บันทึก + เพิ่มต่อ
                  </button>
                )}
                <button className="sp-btn-save" onClick={() => handleSave(false)} disabled={loading || hasConflicts}>
                  {isEditing ? 'อัปเดต (ปิด)' : 'บันทึก (ปิด)'}
                </button>
                {isEditing && editingId && (
                  <button className="sp-btn-delete" onClick={() => confirmDelete(editingId)}>
                    ลบการประชุม
                  </button>
                )}
                <button className="sp-btn-cancel" onClick={closeModal}>ยกเลิก</button>
              </div>
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
