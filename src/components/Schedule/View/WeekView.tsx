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
        .wv-header { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 8px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
        .wv-day-name { text-align: center; font-weight: 700; font-size: 13px; color: var(--txt2); text-transform: uppercase; letter-spacing: 0.5px; }
        .wv-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 8px; }
        .wv-cell { min-height: 280px; padding: 12px; border-radius: 12px; cursor: pointer; background: #fff; border: 1px solid #f1f5f9; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; flex-direction: column; }
        .wv-cell:hover { background: #fafafa; border-color: #e2e8f0; transform: scale(1.02); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); z-index: 10; }
        .wv-cell.today { background: #eff6ff; border-color: #bfdbfe; }
        .wv-cell.weekend:not(.today) { background: #fdfdfd; }
        .wv-cell.weekend:not(.today) .wv-cell-num { color: #94a3b8; }
        .wv-cell-num { font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 8px; display: inline-block; }
        .wv-cell-num.today-num { background: var(--primary); color: #fff; display: inline-flex; padding: 4px 10px; border-radius: 14px; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; box-shadow: 0 2px 8px rgba(37,99,235,.35); }
        .wv-shifts { display: flex; flex-direction: column; gap: 5px; flex: 1; overflow: auto; padding-right: 2px; }
        .wv-shifts::-webkit-scrollbar { width: 3px; }
        .wv-shifts::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .wv-shift { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 6px 8px; border-radius: 8px; font-size: 11px; transition: .2s; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .wv-shift:hover { filter: brightness(0.95); transform: translateY(-1px); }
        .wv-shift .shift-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .wv-shift .shift-type { font-size: 10px; font-weight: 700; opacity: 0.8; }
      `}</style>
      <div>
        {/* Day headers */}
        <div className="wv-header">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="wv-day-name"
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
                  {day.getDate()} ({day.toLocaleDateString('th-TH', { month: 'short' })})
                </div>
                <div className="wv-shifts">
                  {getDaySchedules(day).map((sch) => {
                      const color = getShiftColor(sch.shift);
                      const bg = color + '15'; 
                      const shortType = sch.shift === 'Morning' ? 'ช' : sch.shift === 'Afternoon' ? 'บ' : 'ด';
                      
                      return (
                        <div
                            key={sch.id}
                            className="wv-shift"
                            style={{ backgroundColor: bg, color: color, border: `1px solid ${color}30` }}
                            title={`${sch.nurseName} — ${sch.shift} — ${sch.department}`}
                            onClick={(e) => { e.stopPropagation(); onOpenEditModal(sch) }}
                        >
                            <span className="shift-text">{sch.nurseName}</span>
                            <span className="shift-type">{shortType}</span>
                        </div>
                      )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
