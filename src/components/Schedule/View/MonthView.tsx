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
        .mv-header { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 4px; }
        .mv-day-name { text-align: center; font-weight: 700; font-size: 12px; color: var(--txt2); padding: 8px 0; text-transform: uppercase; letter-spacing: .5px; }
        .mv-day-name.weekend { color: var(--red); }
        .mv-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
        .mv-cell { min-height: 100px; padding: 8px; border-radius: 12px; cursor: pointer; background: var(--card); border: 1.5px solid transparent; transition: .25s; position: relative; display: flex; flex-direction: column; }
        .mv-cell:hover:not(.empty) { background: #eff6ff; border-color: var(--primary); transform: scale(1.02); box-shadow: 0 2px 12px rgba(37,99,235,.12); z-index: 1; }
        .mv-cell.empty { background: #fafcfe; cursor: default; }
        .mv-cell.today { background: var(--purple-lt); border-color: var(--purple); }
        .mv-cell.weekend:not(.today) .mv-cell-num { color: var(--red); }
        .mv-cell-num { font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 4px; }
        .mv-cell-num.today-num { background: var(--purple); color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .mv-shifts { display: flex; flex-direction: column; gap: 3px; flex: 1; overflow: hidden; }
        .mv-shift { display: flex; align-items: center; gap: 4px; padding: 2px 6px; border-radius: 6px; background: rgba(0,0,0,.03); border-left: 3px solid; font-size: 11px; transition: .2s; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mv-shift:hover { background: rgba(0,0,0,.07); }
        .mv-shift .shift-dot { font-size: 10px; flex-shrink: 0; }
        .mv-shift .shift-text { overflow: hidden; text-overflow: ellipsis; color: var(--txt); font-weight: 500; }
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
