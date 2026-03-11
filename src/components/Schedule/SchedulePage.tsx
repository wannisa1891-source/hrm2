'use client'

import React, { useState } from 'react'
import useScheduleControls, { VIEWS } from './useScheduleControls'
import useScheduleModal, { SHIFT_TYPES } from './useScheduleModal'
import useScheduleSummary from './useScheduleSummary'
import useScheduleStatus from './useScheduleStatus'
import DayView from './View/DayView'
import WeekView from './View/WeekView'
import MonthView from './View/MonthView'
import YearView from './View/YearView'
import type { Schedule, ScheduleForm } from './useScheduleModal'

function getShiftDot(shift: string): string {
  if (shift === 'Morning') return '🟢'
  if (shift === 'Afternoon') return '🟠'
  if (shift === 'Night') return '🟣'
  return '⚪'
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])

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
    shiftTypes,
    departments,
    form,
    setForm,
    isEditing,
    openModal,
    openEditModal,
    closeModal,
    saveSchedule,
    deleteSchedule,
    getSchedulesForDate,
    getShiftColor,
  } = useScheduleModal(schedules, setSchedules)

  const { totalSchedules, todaySchedules, monthSchedules } = useScheduleSummary(schedules)
  const { departmentStatus } = useScheduleStatus(schedules)

  function openMonth(monthIndex: number) {
    const newDate = new Date(currentDate)
    newDate.setMonth(monthIndex)
    setCurrentDate(newDate)
    changeView('month')
  }

  function openDay(date: Date) {
    setCurrentDate(date)
    changeView('day')
  }

  function confirmDelete(id: string) {
    if (confirm('คุณต้องการลบเวรนี้ใช่ไหม?')) {
      deleteSchedule(id)
    }
  }

  const daySchedules = selectedDate ? getSchedulesForDate(selectedDate) : []

  return (
    <>
      <style>{`
        /* ===========================
           COLOR TOKENS
           =========================== */
        .schedule-page {
          --primary: #2563eb; --primary-lt: #dbeafe; --primary-dk: #1d4ed8;
          --green: #10b981; --green-lt: #d1fae5;
          --amber: #f59e0b; --amber-lt: #fef3c7;
          --purple: #7c3aed; --purple-lt: #ede9fe;
          --red: #ef4444;
          --card: #ffffff; --bg: #f8fafc; --txt: #1e293b; --txt2: #64748b;
          --bdr: #e2e8f0; --shd: 0 4px 20px rgba(0,0,0,.06); --shd2: 0 8px 32px rgba(0,0,0,.1);
          --rad: 16px;
        }
        /* PAGE */
        .schedule-page { padding: 28px 32px; max-width: 1200px; margin: 0 auto; background: var(--bg); min-height: 100vh; font-family: 'Segoe UI', system-ui, sans-serif; }
        /* HEADER */
        .sp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .sp-header-left { display: flex; align-items: center; gap: 16px; }
        .sp-header-icon { font-size: 34px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: var(--primary-lt); border-radius: 14px; }
        .sp-header h1 { margin: 0; font-size: 24px; font-weight: 800; color: var(--txt); }
        .sp-header-sub { margin: 2px 0 0; font-size: 13px; color: var(--txt2); }
        /* SUMMARY */
        .sp-summary-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; margin-bottom: 28px; }
        .sp-sum-card { background: var(--card); border-radius: var(--rad); padding: 22px 24px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shd); border: 1px solid var(--bdr); transition: .3s; }
        .sp-sum-card:hover { transform: translateY(-3px); box-shadow: var(--shd2); }
        .sp-sum-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .sp-sum-icon-blue { background: linear-gradient(135deg,#dbeafe,#bfdbfe); }
        .sp-sum-icon-green { background: linear-gradient(135deg,#d1fae5,#a7f3d0); }
        .sp-sum-icon-amber { background: linear-gradient(135deg,#fef3c7,#fde68a); }
        .sp-sum-body { display: flex; flex-direction: column; }
        .sp-sum-num { font-size: 28px; font-weight: 800; color: var(--txt); line-height: 1; }
        .sp-sum-label { font-size: 13px; color: var(--txt2); margin-top: 4px; font-weight: 500; }
        /* CALENDAR CARD */
        .sp-cal-card { background: var(--card); border-radius: 20px; padding: 28px; box-shadow: var(--shd); border: 1px solid var(--bdr); margin-bottom: 28px; }
        /* CONTROLS */
        .sp-cal-controls { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 12px; }
        .sp-cal-nav { display: flex; align-items: center; gap: 10px; }
        .sp-btn-nav { width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--bdr); background: var(--card); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--txt); transition: .25s; }
        .sp-btn-nav:hover { background: var(--primary); color: #fff; border-color: var(--primary); transform: scale(1.06); }
        .sp-cal-month { font-size: 20px; font-weight: 700; color: var(--txt); min-width: 160px; text-align: center; margin: 0; }
        .sp-btn-today { padding: 7px 16px; border-radius: 8px; border: 1px solid var(--primary); background: var(--primary-lt); color: var(--primary); font-weight: 600; font-size: 13px; cursor: pointer; transition: .25s; }
        .sp-btn-today:hover { background: var(--primary); color: #fff; }
        /* VIEW BUTTONS */
        .sp-cal-views { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; }
        .sp-btn-view { padding: 7px 18px; border: none; border-radius: 8px; background: transparent; color: var(--txt2); font-size: 13px; font-weight: 600; cursor: pointer; transition: .25s; text-transform: capitalize; }
        .sp-btn-view:hover { color: var(--primary); }
        .sp-btn-view.active { background: var(--primary); color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,.3); }
        /* LEGEND */
        .sp-shift-legend { display: flex; gap: 20px; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--bdr); justify-content: center; }
        .sp-legend-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--txt2); font-weight: 500; }
        .sp-legend-dot { width: 10px; height: 10px; border-radius: 50%; }
        /* DEPARTMENT STATUS */
        .sp-dept-card { background: var(--card); border-radius: 20px; padding: 24px 28px; box-shadow: var(--shd); border: 1px solid var(--bdr); }
        .sp-dept-title { font-size: 18px; font-weight: 700; color: var(--txt); margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .sp-dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 10px; }
        .sp-dept-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 10px; border: 1px solid var(--bdr); transition: .2s; }
        .sp-dept-item:hover { background: #eff6ff; border-color: var(--primary); }
        .sp-dept-name { font-weight: 600; color: var(--txt); font-size: 14px; }
        .sp-dept-badge { font-size: 12px; color: var(--primary); font-weight: 700; background: var(--primary-lt); padding: 4px 10px; border-radius: 20px; }
        /* MODAL */
        .sp-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .sp-modal-box { background: var(--card); border-radius: 22px; padding: 30px; width: 520px; max-width: 92vw; max-height: 88vh; overflow-y: auto; box-shadow: var(--shd2); animation: mSlide .3s ease; }
        @keyframes mSlide { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .sp-modal-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .sp-modal-top h3 { margin: 0; font-size: 20px; font-weight: 700; color: var(--txt); }
        .sp-modal-x { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--txt2); padding: 4px 8px; border-radius: 8px; }
        .sp-modal-x:hover { background: #f1f5f9; }
        .sp-modal-date { font-size: 14px; color: var(--txt2); margin-bottom: 16px; padding: 10px 14px; background: #f8fafc; border-radius: 10px; font-weight: 500; }
        .sp-modal-existing { margin-bottom: 16px; }
        .sp-existing-title { font-size: 13px; color: var(--txt2); margin: 0 0 8px; font-weight: 600; }
        .sp-existing-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: #f8fafc; border-radius: 10px; border: 1px solid var(--bdr); margin-bottom: 6px; }
        .sp-existing-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--txt); }
        .sp-existing-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        .sp-existing-actions { display: flex; gap: 4px; }
        .sp-btn-icon { background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: 6px; transition: .2s; }
        .sp-btn-icon:hover { background: #f1f5f9; }
        .sp-modal-errors { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; }
        .sp-err-line { color: #dc2626; font-size: 13px; margin-bottom: 4px; }
        .sp-err-line:last-child { margin-bottom: 0; }
        .sp-form-group { margin-bottom: 16px; }
        .sp-form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 6px; }
        .sp-req { color: var(--red); }
        .sp-field { width: 100%; padding: 10px 14px; border: 1.5px solid var(--bdr); border-radius: 10px; font-size: 14px; color: var(--txt); background: #fff; transition: .2s; box-sizing: border-box; }
        .sp-field:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
        .sp-shift-picker { display: flex; gap: 8px; flex-wrap: wrap; }
        .sp-shift-opt { padding: 8px 14px; border-radius: 8px; border: 2px solid transparent; cursor: pointer; font-size: 13px; font-weight: 600; background: #f8fafc; transition: .2s; }
        .sp-shift-opt:hover { background: #f1f5f9; }
        .sp-modal-btns { display: flex; gap: 10px; margin-top: 20px; }
        .sp-btn-save { flex: 1; padding: 12px; border-radius: 10px; border: none; background: var(--primary); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: .25s; }
        .sp-btn-save:hover { background: var(--primary-dk); }
        .sp-btn-delete { padding: 12px 20px; border-radius: 10px; border: 1.5px solid var(--red); background: #fff; color: var(--red); font-size: 14px; font-weight: 600; cursor: pointer; transition: .25s; }
        .sp-btn-delete:hover { background: var(--red); color: #fff; }
        .sp-btn-cancel { padding: 12px 20px; border-radius: 10px; border: 1.5px solid var(--bdr); background: #f8fafc; color: var(--txt2); font-size: 14px; font-weight: 600; cursor: pointer; transition: .25s; }
        .sp-btn-cancel:hover { background: #e2e8f0; }
      `}</style>

      <div className="schedule-page">

        {/* ==================== HEADER ==================== */}
        <div className="sp-header">
          <div className="sp-header-left">
            <div className="sp-header-icon">🏥</div>
            <div>
              <h1>ตารางเวรพยาบาล</h1>
              <p className="sp-header-sub">Nurse Shift Schedule Management</p>
            </div>
          </div>
        </div>

        {/* ==================== SUMMARY ==================== */}
        <div className="sp-summary-row">
          <div className="sp-sum-card">
            <div className="sp-sum-icon sp-sum-icon-blue"><span>📋</span></div>
            <div className="sp-sum-body">
              <span className="sp-sum-num">{totalSchedules}</span>
              <span className="sp-sum-label">เวรทั้งหมด</span>
            </div>
          </div>
          <div className="sp-sum-card">
            <div className="sp-sum-icon sp-sum-icon-green"><span>🕐</span></div>
            <div className="sp-sum-body">
              <span className="sp-sum-num">{todaySchedules}</span>
              <span className="sp-sum-label">เวรวันนี้</span>
            </div>
          </div>
          <div className="sp-sum-card">
            <div className="sp-sum-icon sp-sum-icon-amber"><span>📆</span></div>
            <div className="sp-sum-body">
              <span className="sp-sum-num">{monthSchedules}</span>
              <span className="sp-sum-label">เวรเดือนนี้</span>
            </div>
          </div>
        </div>

        {/* ==================== CALENDAR CARD ==================== */}
        <div className="sp-cal-card">

          {/* Controls */}
          <div className="sp-cal-controls">
            <div className="sp-cal-nav">
              <button className="sp-btn-nav" onClick={goPrev} title="ก่อนหน้า">◀</button>
              <h2 className="sp-cal-month">{formatDisplay}</h2>
              <button className="sp-btn-nav" onClick={goNext} title="ถัดไป">▶</button>
              <button className="sp-btn-today" onClick={goToday}>Today</button>
            </div>
            <div className="sp-cal-views">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  className={`sp-btn-view${currentView === v ? ' active' : ''}`}
                  onClick={() => changeView(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Day View */}
          {currentView === 'day' && (
            <DayView
              currentDate={currentDate}
              schedules={schedules}
              getShiftColor={getShiftColor}
              getShiftDot={getShiftDot}
              onOpenDay={openModal}
              onOpenEditModal={openEditModal}
            />
          )}

          {/* Week View */}
          {currentView === 'week' && (
            <WeekView
              currentDate={currentDate}
              schedules={schedules}
              getShiftColor={getShiftColor}
              getShiftDot={getShiftDot}
              onOpenDay={openDay}
              onOpenEditModal={openEditModal}
            />
          )}

          {/* Month View */}
          {currentView === 'month' && (
            <MonthView
              currentDate={currentDate}
              schedules={schedules}
              getShiftColor={getShiftColor}
              getShiftDot={getShiftDot}
              onOpenDay={openDay}
              onOpenEditModal={openEditModal}
            />
          )}

          {/* Year View */}
          {currentView === 'year' && (
            <YearView
              currentDate={currentDate}
              schedules={schedules}
              onOpenMonth={openMonth}
            />
          )}

          {/* Shift Legend */}
          {currentView !== 'year' && (
            <div className="sp-shift-legend">
              {shiftTypes.map((st) => (
                <div key={st.value} className="sp-legend-item">
                  <span className="sp-legend-dot" style={{ background: st.color }} />
                  <span>{st.value}</span>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ==================== DEPARTMENT STATUS ==================== */}
        {Object.keys(departmentStatus).length > 0 && (
          <div className="sp-dept-card">
            <h3 className="sp-dept-title"><span>🏥</span> สถานะเวรแต่ละแผนก</h3>
            <div className="sp-dept-grid">
              {Object.entries(departmentStatus).map(([dept, count]) => (
                <div key={dept} className="sp-dept-item">
                  <span className="sp-dept-name">{dept}</span>
                  <span className="sp-dept-badge">{count} เวร</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== MODAL ==================== */}
        {showModal && (
          <div className="sp-modal-bg" onClick={closeModal}>
            <div className="sp-modal-box" onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="sp-modal-top">
                <h3>{isEditing ? '✏️ แก้ไขเวร' : '➕ เพิ่มเวร'}</h3>
                <button className="sp-modal-x" onClick={closeModal}>✕</button>
              </div>

              {/* Date badge */}
              <div className="sp-modal-date">
                📅 {formatDate(selectedDate)}
              </div>

              {/* Existing schedules */}
              {!isEditing && daySchedules.length > 0 && (
                <div className="sp-modal-existing">
                  <p className="sp-existing-title">เวรที่มีอยู่ในวันนี้:</p>
                  {daySchedules.map((sch) => (
                    <div key={sch.id} className="sp-existing-item">
                      <div className="sp-existing-info">
                        <span className="sp-existing-dot" style={{ background: getShiftColor(sch.shift) }} />
                        <span>{sch.nurseName} — {sch.shift} — {sch.department}</span>
                      </div>
                      <div className="sp-existing-actions">
                        <button className="sp-btn-icon" onClick={() => openEditModal(sch)} title="แก้ไข">✏️</button>
                        <button className="sp-btn-icon" onClick={() => confirmDelete(sch.id)} title="ลบ">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Errors */}
              {errors.length > 0 && (
                <div className="sp-modal-errors">
                  {errors.map((err, i) => (
                    <div key={i} className="sp-err-line">⚠️ {err}</div>
                  ))}
                </div>
              )}

              {/* Form */}
              <div>
                <div className="sp-form-group">
                  <label>👩‍⚕️ ชื่อพยาบาล <span className="sp-req">*</span></label>
                  <input
                    className="sp-field"
                    value={form.nurseName}
                    onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, nurseName: e.target.value }))}
                    placeholder="กรอกชื่อพยาบาล"
                  />
                </div>

                <div className="sp-form-group">
                  <label>⏰ ประเภทเวร <span className="sp-req">*</span></label>
                  <div className="sp-shift-picker">
                    {shiftTypes.map((st) => (
                      <button
                        key={st.value}
                        className="sp-shift-opt"
                        style={{
                          borderColor: form.shift === st.value ? st.color : 'transparent',
                          background: form.shift === st.value ? st.color + '18' : '',
                        }}
                        onClick={() => setForm((f: ScheduleForm) => ({ ...f, shift: st.value }))}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sp-form-group">
                  <label>🏢 แผนก <span className="sp-req">*</span></label>
                  <select
                    className="sp-field"
                    value={form.department}
                    onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, department: e.target.value }))}
                  >
                    <option value="">เลือกแผนก</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="sp-form-group">
                  <label>📝 หมายเหตุ</label>
                  <input
                    className="sp-field"
                    value={form.note}
                    onChange={(e) => setForm((f: ScheduleForm) => ({ ...f, note: e.target.value }))}
                    placeholder="หมายเหตุ (ไม่จำเป็น)"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="sp-modal-btns">
                <button className="sp-btn-save" onClick={saveSchedule}>
                  💾 {isEditing ? 'อัปเดต' : 'บันทึก'}
                </button>
                {isEditing && editingId && (
                  <button className="sp-btn-delete" onClick={() => confirmDelete(editingId)}>
                    🗑️ ลบเวร
                  </button>
                )}
                <button className="sp-btn-cancel" onClick={closeModal}>ยกเลิก</button>
              </div>

            </div>
          </div>
        )}

      </div>
    </>
  )
}
