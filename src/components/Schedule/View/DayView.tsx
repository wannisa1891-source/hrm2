'use client'

import React from 'react'
import type { Schedule } from '../useScheduleModal'

interface DayViewProps {
  currentDate: Date
  schedules: Schedule[]
  getShiftColor: (shift: string) => string
  getShiftDot: (shift: string) => string
  onOpenDay: (date: Date) => void
  onOpenEditModal: (schedule: Schedule) => void
}

// สร้างรายการเวลา 24 ชั่วโมง
const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${i.toString().padStart(2, '0')}:00`
)

function isTodayDate(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export default function DayView({
  currentDate,
  schedules,
  getShiftColor,
  getShiftDot,
  onOpenDay,
  onOpenEditModal,
}: DayViewProps) {
  const formatDate = currentDate.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ดึงเวรของวันนั้น
  const dayShifts = schedules.filter((s) => {
    const d = new Date(s.date)
    return (
      d.getFullYear() === currentDate.getFullYear() &&
      d.getMonth() === currentDate.getMonth() &&
      d.getDate() === currentDate.getDate()
    )
  })

  function getShiftsForHour(hour: string): Schedule[] {
    return dayShifts.filter((s) => s.startTime === hour)
  }

  function createShift(hour: string) {
    const targetDate = new Date(currentDate)
    const hourInt = parseInt(hour.split(':')[0])
    targetDate.setHours(hourInt, 0, 0, 0)
    onOpenDay(targetDate)
  }

  const isToday = isTodayDate(currentDate)

  return (
    <>
      <style>{`
        .day-view-container { background: var(--card); border-radius: 16px; overflow: hidden; border: 1px solid var(--bdr); }
        .day-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--bdr); background: #f8fafc; }
        .day-header.is-today { background: var(--purple-lt); }
        .day-title { margin: 0; font-size: 20px; color: var(--txt); font-weight: 700; }
        .day-header.is-today .day-title { color: var(--purple); }
        .time-grid { display: flex; flex-direction: column; max-height: 600px; overflow-y: auto; }
        .time-row { display: flex; min-height: 70px; border-bottom: 1px solid var(--bdr); }
        .time-row:last-child { border-bottom: none; }
        .time-label { width: 70px; padding: 12px; text-align: right; font-size: 13px; color: var(--txt2); font-weight: 600; border-right: 1px solid var(--bdr); background: #f8fafc; flex-shrink: 0; }
        .time-cell { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 6px; cursor: pointer; transition: background 0.2s; }
        .time-cell:hover { background: #f1f5f9; }
        .shift-card { display: flex; align-items: center; justify-content: flex-start; gap: 12px; padding: 10px 14px; background: var(--bg); border: 1px solid var(--bdr); border-left-width: 5px; border-left-style: solid; border-radius: 8px; cursor: pointer; transition: 0.2s; width: max-content; max-width: 100%; }
        .shift-card:hover { background: #eff6ff; border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,.1); }
        .shift-card .shift-dot { font-size: 16px; }
        .shift-details { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .nurse-name { margin: 0; font-size: 15px; font-weight: 700; color: var(--txt); }
        .shift-meta { font-size: 13px; color: var(--txt2); }
        .shift-note-tag { font-size: 12px; color: var(--txt2); background: var(--amber-lt, #fef3c7); padding: 2px 10px; border-radius: 12px; margin-left: 6px; }
      `}</style>
      <div className="day-view-container">
        <div className={`day-header${isToday ? ' is-today' : ''}`}>
          <h2 className="day-title">{formatDate}</h2>
        </div>
        <div className="time-grid">
          {HOURS.map((hour) => (
            <div key={hour} className="time-row">
              <div className="time-label">{hour}</div>
              <div className="time-cell" onClick={() => createShift(hour)}>
                {getShiftsForHour(hour).map((shift) => (
                  <div
                    key={shift.id}
                    className="shift-card"
                    style={{ borderLeftColor: getShiftColor(shift.shift) }}
                    onClick={(e) => { e.stopPropagation(); onOpenEditModal(shift) }}
                  >
                    <span className="shift-dot">{getShiftDot(shift.shift)}</span>
                    <div className="shift-details">
                      <h4 className="nurse-name">{shift.nurseName}</h4>
                      <span className="shift-meta">({shift.shift} / {shift.department})</span>
                    </div>
                    {shift.note && <span className="shift-note-tag">{shift.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
