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

  const dayShifts = schedules.filter((s) => {
    const d = new Date(s.date)
    return (
      d.getFullYear() === currentDate.getFullYear() &&
      d.getMonth() === currentDate.getMonth() &&
      d.getDate() === currentDate.getDate()
    )
  })

  function getShiftsForHour(hour: string): Schedule[] {
    // Basic mapping: if user didn't specify start time, we map Evening to 16:00, Night to 00:00, Morning to 08:00
    // This provides a visual representation in the timeline if real `startTime` is not present
    return dayShifts.filter((s) => {
       if(s.startTime) return s.startTime === hour;
       if(s.shift === 'Morning' && hour === '08:00') return true;
       if(s.shift === 'Afternoon' && hour === '16:00') return true;
       if(s.shift === 'Night' && hour === '00:00') return true;
       return false;
    })
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
        .day-view-container { background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .day-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; background: #fafafa; }
        .day-header.is-today { background: #eff6ff; border-bottom-color: #bfdbfe; }
        .day-title { margin: 0; font-size: 20px; color: #1e293b; font-weight: 800; letter-spacing: -0.5px; }
        .day-header.is-today .day-title { color: #1d4ed8; }
        .time-grid { display: flex; flex-direction: column; max-height: 600px; overflow-y: auto; background: #fff; }
        .time-grid::-webkit-scrollbar { width: 6px; }
        .time-grid::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
        .time-row { display: flex; min-height: 80px; border-bottom: 1px solid #f1f5f9; position: relative; }
        .time-row:last-child { border-bottom: none; }
        .time-label { width: 80px; padding: 16px 12px; text-align: right; font-size: 13px; color: #64748b; font-weight: 700; border-right: 1px dashed #e2e8f0; background: #fafafa; flex-shrink: 0; }
        .time-cell { flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: background 0.2s; position: relative; }
        .time-cell:hover { background: #f8fafc; }
        .shift-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-radius: 10px; cursor: pointer; transition: 0.25s cubic-bezier(0.16, 1, 0.3, 1); min-width: 250px; width: max-content; max-width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .shift-card:hover { transform: translateY(-3px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08); filter: brightness(0.96); z-index: 10; relative; }
        .shift-details { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .nurse-name { margin: 0; font-size: 15px; font-weight: 700; color: inherit; }
        .shift-meta { font-size: 13px; font-weight: 700; opacity: 0.8; letter-spacing: 0.5px; }
        .shift-note-tag { font-size: 12px; color: #475569; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.05); padding: 4px 10px; border-radius: 12px; font-weight: 600; }
        .shift-type-badge { padding: 4px 10px; font-size: 11px; font-weight: 800; border-radius: 6px; background: rgba(255,255,255,0.4); text-transform: uppercase; }
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
                {getShiftsForHour(hour).map((shift) => {
                    const color = getShiftColor(shift.shift);
                    const bg = color + '18'; // 18% opacity hex
                    
                    return (
                      <div
                        key={shift.id}
                        className="shift-card"
                        style={{ backgroundColor: bg, color: color, border: `1px solid ${color}30`, borderLeftWidth: '5px', borderLeftColor: color }}
                        onClick={(e) => { e.stopPropagation(); onOpenEditModal(shift) }}
                      >
                        <div className="shift-details">
                          <h4 className="nurse-name">{shift.nurseName}</h4>
                          <span className="shift-note-tag">{shift.department}</span>
                          {shift.note && <span className="shift-note-tag italic">{shift.note}</span>}
                        </div>
                        <div className="shift-type-badge text-right">
                          {shift.shift}
                        </div>
                      </div>
                    )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
