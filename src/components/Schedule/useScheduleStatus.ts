// สถานะเวรแต่ละแผนก
import { useMemo } from 'react'
import type { Schedule } from '@/components/Schedule/useScheduleModal'

export default function useScheduleStatus(schedules: Schedule[]) {
  const departmentStatus = useMemo(() => {
    const result: Record<string, number> = {}
    schedules.forEach((s) => {
      const dept = s.department || 'Unknown'
      result[dept] = (result[dept] || 0) + 1
    })
    return result
  }, [schedules])

  return { departmentStatus }
}
