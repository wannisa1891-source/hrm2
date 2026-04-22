'use client'

import React from 'react'
import type { Schedule } from '../useScheduleModal'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface MonthData {
  month: number
  date: Date
  shiftCount: number
  shifts: Schedule[]
}

interface YearViewProps {
  currentDate: Date
  schedules: Schedule[]
  onOpenMonth: (monthIndex: number) => void
}

function buildYearMonths(currentDate: Date, schedules: Schedule[]): MonthData[] {
  const year = currentDate.getFullYear()
  return Array.from({ length: 12 }, (_, m) => {
    const monthShifts = schedules.filter((s) => {
      const d = new Date(s.date)
      return d.getFullYear() === year && d.getMonth() === m
    })
    return { month: m, date: new Date(year, m, 1), shiftCount: monthShifts.length, shifts: monthShifts }
  })
}

export default function YearView({ currentDate, schedules, onOpenMonth }: YearViewProps) {
  const yearMonths = buildYearMonths(currentDate, schedules)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .year-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 10px 0; }
        .month-box { min-height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: var(--card); border-radius: 12px; border: 1.5px solid var(--bdr); cursor: pointer; transition: all 0.25s; }
        .month-box:hover { background: #eff6ff; border-color: var(--primary, #2563eb); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37,99,235,.12); }
        .month-box:hover .month-name { color: var(--primary, #2563eb); }
        .month-name { font-size: 20px; font-weight: 600; color: var(--txt); transition: color 0.25s; }
        .month-badge { font-size: 13px; color: var(--primary); font-weight: 700; background: var(--primary-lt); padding: 4px 10px; border-radius: 20px; }
      `}} />
      <div className="year-grid">
        {yearMonths.map((m) => (
          <div
            key={m.month}
            className="month-box"
            onClick={() => onOpenMonth(m.month)}
          >
            <div className="month-name">{MONTH_NAMES[m.month]}</div>
            {m.shiftCount > 0 && (
              <div className="month-badge">{m.shiftCount} เวร</div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
