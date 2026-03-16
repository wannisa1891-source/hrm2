'use client'

import React from 'react'
import useScheduleCalendar, { CalendarDay, DAY_NAMES } from '../useScheduleCalendar'
import type { Schedule } from '../useScheduleModal'

interface MonthViewProps {
  currentDate: Date
  schedules: Schedule[]
  getShiftColor: (shift: string) => string
  getShiftDot: (shift: string) => string
  onOpenDay: (date: Date) => void
  onOpenEditModal: (schedule: Schedule) => void
}

function getDate(day: CalendarDay | null): Date | null {
  if (!day) return null
  if (day.date instanceof Date) return day.date
  return new Date(day.date)
}

function isToday(day: CalendarDay | null): boolean {
  const d = getDate(day)
  if (!d) return false
  const today = new Date()
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function MonthView({
  currentDate,
  schedules,
  getShiftColor,
  getShiftDot,
  onOpenDay,
  onOpenEditModal,
}: MonthViewProps) {
  const { calendarDays } = useScheduleCalendar(currentDate)

  function getDaySchedules(day: CalendarDay | null): Schedule[] {
    const date = getDate(day)
    if (!date) return []
    return schedules.filter((s) => isSameDay(new Date(s.date), date))
  }

  function handleDayClick(day: CalendarDay | null) {
    const date = getDate(day)
    if (date) onOpenDay(date)
  }

  return (
    <>
      <style>{`
        .mv-header { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 8px; }
        .mv-day-name { text-align: center; font-weight: 700; font-size: 13px; color: #64748b; padding: 10px 0; text-transform: uppercase; letter-spacing: 1px; }
        .mv-day-name.weekend { color: #f43f5e; }
        .mv-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 6px; }
        .mv-cell { min-height: 120px; padding: 10px; border-radius: 14px; cursor: pointer; background: #fff; border: 1px solid #e2e8f0; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .mv-cell:hover:not(.empty) { background: #f8fafc; border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59,130,246,0.15); z-index: 10; }
        .mv-cell.empty { background: transparent; border: none; cursor: default; }
        .mv-cell.today { background: #f0fdfa; border-color: #0d9488; }
        .mv-cell.weekend:not(.today) { background: #fff1f2; border-color: #ffe4e6; }
        .mv-cell.weekend:not(.today) .mv-cell-num { color: #e11d48; }
        .mv-cell-num { font-size: 14px; font-weight: 700; color: #334155; margin-bottom: 8px; display: inline-block; }
        .mv-cell-num.today-num { background: #0d9488; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; box-shadow: 0 2px 6px rgba(13,148,136,0.3); }
        .mv-shifts { display: flex; flex-direction: column; gap: 4px; flex: 1; overflow-y: auto; padding-right: 2px; }
        .mv-shifts::-webkit-scrollbar { width: 4px; }
        .mv-shifts::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .mv-shift { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 8px; background: #f8fafc; border-left: 4px solid; font-size: 11px; transition: .2s; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .mv-shift:hover { filter: brightness(0.95); transform: translateX(2px); }
        .mv-shift .shift-dot { font-size: 10px; flex-shrink: 0; }
        .mv-shift .shift-text { overflow: hidden; text-overflow: ellipsis; color: #1e293b; font-weight: 600; }
      `}</style>
      <div>
        {/* Day name header */}
        <div className="mv-header">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className={`mv-day-name${d === 'Sun' || d === 'Sat' ? ' weekend' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="mv-grid">
          {calendarDays.map((day, idx) => {
            const todayCell = isToday(day)
            const weekendCell = idx % 7 === 0 || idx % 7 === 6
            const emptyCell = !day
            return (
              <div
                key={idx}
                className={`mv-cell${emptyCell ? ' empty' : ''}${todayCell ? ' today' : ''}${weekendCell && !emptyCell ? ' weekend' : ''}`}
                onClick={() => handleDayClick(day)}
              >
                {day && (
                  <>
                    <div className={`mv-cell-num${todayCell ? ' today-num' : ''}`}>
                      {day.day}
                    </div>
                    <div className="mv-shifts">
                      {getDaySchedules(day).map((sch) => (
                        <div
                          key={sch.id}
                          className="mv-shift"
                          style={{ borderLeftColor: getShiftColor(sch.shift) }}
                          title={`${sch.nurseName} — ${sch.shift} — ${sch.department}`}
                          onClick={(e) => { e.stopPropagation(); onOpenEditModal(sch) }}
                        >
                          <span className="shift-dot">{getShiftDot(sch.shift)}</span>
                          <span className="shift-text">{sch.nurseName}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
