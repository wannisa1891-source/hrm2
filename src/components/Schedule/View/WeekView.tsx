'use client'

import React from 'react'
import type { Schedule } from '../useScheduleModal'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface WeekViewProps {
  currentDate: Date
  schedules: Schedule[]
  getShiftColor: (shift: string) => string
  getShiftDot: (shift: string) => string
  onOpenDay: (date: Date) => void
  onOpenEditModal: (schedule: Schedule) => void
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(currentDate: Date): Date[] {
  const start = getStartOfWeek(currentDate)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export default function WeekView({
  currentDate,
  schedules,
  getShiftColor,
  getShiftDot,
  onOpenDay,
  onOpenEditModal,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate)

  function getDaySchedules(date: Date): Schedule[] {
    return schedules.filter((s) => isSameDay(new Date(s.date), date))
  }

  return (
    <>
      <style>{`
        .wv-header { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 4px; }
        .wv-day-name { text-align: center; font-weight: 700; font-size: 12px; color: var(--txt2); padding: 8px 0; text-transform: uppercase; letter-spacing: .5px; }
        .wv-day-name.weekend { color: var(--red); }
        .wv-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 3px; }
        .wv-cell { min-height: 250px; padding: 8px; border-radius: 12px; cursor: pointer; background: var(--card); border: 1.5px solid transparent; transition: .25s; position: relative; display: flex; flex-direction: column; }
        .wv-cell:hover { background: #eff6ff; border-color: var(--primary); transform: scale(1.02); box-shadow: 0 2px 12px rgba(37,99,235,.12); z-index: 1; }
        .wv-cell.today { background: var(--purple-lt); border-color: var(--purple); }
        .wv-cell.weekend:not(.today) .wv-cell-num { color: var(--red); }
        .wv-cell-num { font-size: 13px; font-weight: 600; color: var(--txt); margin-bottom: 4px; }
        .wv-cell-num.today-num { background: var(--purple); color: #fff; display: inline-flex; padding: 4px 8px; border-radius: 14px; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
        .wv-shifts { display: flex; flex-direction: column; gap: 3px; flex: 1; overflow: auto; }
        .wv-shift { display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-radius: 6px; background: rgba(0,0,0,.03); border-left: 3px solid; font-size: 11px; transition: .2s; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wv-shift:hover { background: rgba(0,0,0,.07); }
        .wv-shift .shift-dot { font-size: 10px; flex-shrink: 0; }
        .wv-shift .shift-text { overflow: hidden; text-overflow: ellipsis; color: var(--txt); font-weight: 500; }
      `}</style>
      <div>
        {/* Day headers */}
        <div className="wv-header">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className={`wv-day-name${d === 'Sun' || d === 'Sat' ? ' weekend' : ''}`}
            >
              {d}
            </div>
          ))}
        </div>
        {/* 7-day grid */}
        <div className="wv-grid">
          {weekDays.map((day, idx) => {
            const todayCell = isToday(day)
            const weekendCell = idx === 0 || idx === 6
            return (
              <div
                key={idx}
                className={`wv-cell${todayCell ? ' today' : ''}${weekendCell ? ' weekend' : ''}`}
                onClick={() => onOpenDay(day)}
              >
                <div className={`wv-cell-num${todayCell ? ' today-num' : ''}`}>
                  {day.getDate()} ({day.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })})
                </div>
                <div className="wv-shifts">
                  {getDaySchedules(day).map((sch) => (
                    <div
                      key={sch.id}
                      className="wv-shift"
                      style={{ borderLeftColor: getShiftColor(sch.shift) }}
                      title={`${sch.nurseName} — ${sch.shift} — ${sch.department}`}
                      onClick={(e) => { e.stopPropagation(); onOpenEditModal(sch) }}
                    >
                      <span className="shift-dot">{getShiftDot(sch.shift)}</span>
                      <span className="shift-text">{sch.nurseName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
