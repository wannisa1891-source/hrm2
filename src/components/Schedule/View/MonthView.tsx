'use client'

import React from 'react'
import useScheduleCalendar, { CalendarDay, DAY_NAMES } from '../useScheduleCalendar'
import type { Schedule } from '../useScheduleModal'

interface MonthViewProps {
  currentDate: Date
  schedules: Schedule[]
  getShiftColor: (room: string) => string
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
      <style dangerouslySetInnerHTML={{ __html: `
        .mv-header { display: grid; grid-template-columns: repeat(7,1fr); margin-bottom: 8px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; }
        .mv-day-name { text-align: center; font-weight: 700; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .mv-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 8px; }
        .mv-cell { min-height: 120px; padding: 10px; border-radius: 12px; cursor: pointer; background: #fff; border: 1px solid #f1f5f9; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); position: relative; display: flex; flex-direction: column; overflow: hidden; }
        .mv-cell:hover:not(.empty) { background: #fafafa; transform: scale(1.02); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); z-index: 10; border-color: #e2e8f0; }
        .mv-cell.empty { background: transparent; border: none; cursor: default; }
        .mv-cell.today { background: #eff6ff; border-color: #bfdbfe; }
        .mv-cell-num { font-size: 14px; font-weight: 700; color: #475569; margin-bottom: 8px; display: inline-block; }
        .mv-cell-num.today-num { background: #3b82f6; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; box-shadow: 0 2px 8px rgba(59,130,246,0.35); }
        .mv-cell.weekend:not(.today) { background: #fdfdfd; }
        .mv-cell.weekend:not(.today) .mv-cell-num { color: #94a3b8; }
        .mv-shifts { display: flex; flex-direction: column; gap: 5px; flex: 1; overflow-y: auto; padding-right: 2px; }
        .mv-shifts::-webkit-scrollbar { width: 3px; }
        .mv-shifts::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .mv-shift { display: flex; align-items: center; justify-content: space-between; gap: 4px; padding: 4px 6px; border-radius: 6px; font-size: 11px; transition: .2s; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .mv-shift:hover { filter: brightness(0.95); transform: translateY(-1px); }
        .mv-shift .shift-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
        .mv-shift .shift-type { font-size: 10px; font-weight: 700; opacity: 0.8; }
      `}} />
      <div>
        {/* Day name header */}
        <div className="mv-header">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="mv-day-name"
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
                      {getDaySchedules(day).map((sch) => {
                          // Beautiful glass pill styling for room
                          const color = getShiftColor(sch.room);
                          const bg = color + '15'; // 15% opacity hex
                          const shortType = sch.room ? sch.room.charAt(0).toUpperCase() : 'M';
                          
                          return (
                            <div
                                key={sch.id}
                                className="mv-shift"
                                style={{ backgroundColor: bg, color: color, border: `1px solid ${color}30` }}
                                title={`${sch.startTime} - ${sch.endTime} | ${sch.subject} — ${sch.room} — ${sch.organizer}`}
                                onClick={(e) => { e.stopPropagation(); onOpenEditModal(sch) }}
                            >
                                <span className="shift-text"><strong>{sch.startTime}</strong> {sch.subject}</span>
                                <span className="shift-type">{shortType}</span>
                            </div>
                          )
                      })}
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
