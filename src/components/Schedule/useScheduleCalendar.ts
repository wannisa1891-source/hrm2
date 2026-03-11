// สร้างปฏิทิน
import { useMemo } from 'react'

export interface CalendarDay {
  day: number
  date: Date
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function useScheduleCalendar(currentDate: Date) {
  const calendarDays = useMemo((): (CalendarDay | null)[] => {
    const date = new Date(currentDate)
    const year = date.getFullYear()
    const month = date.getMonth()

    // วันแรกของเดือน
    const firstDay = new Date(year, month, 1).getDay()
    // จำนวนวันของเดือน
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const daysArray: (CalendarDay | null)[] = []

    // ช่องว่างก่อนวันแรก
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(null)
    }

    // วันจริงของเดือน
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push({ day: i, date: new Date(year, month, i) })
    }

    // เติมให้ครบ 42 ช่อง
    while (daysArray.length < 42) {
      daysArray.push(null)
    }

    return daysArray
  }, [currentDate])

  return { days: DAY_NAMES, calendarDays }
}
