// สรุปจำนวนเวร
import { useMemo } from 'react'
import type { Schedule } from '@/components/Schedule/useScheduleModal'

export default function useScheduleSummary(schedules: Schedule[]) {
  const totalSchedules = useMemo(() => schedules.length, [schedules])

  const todaySchedules = useMemo(() => {
    const today = new Date().toDateString()
    return schedules.filter(
      (s) => new Date(s.date).toDateString() === today
    ).length
  }, [schedules])

  const monthSchedules = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return schedules.filter((s) => {
      const d = new Date(s.date)
      return d.getMonth() === month && d.getFullYear() === year
    }).length
  }, [schedules])

  return { totalSchedules, todaySchedules, monthSchedules }
}
