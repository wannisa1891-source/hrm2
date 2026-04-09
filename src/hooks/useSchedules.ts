import { useState, useCallback } from 'react'
import {
  fetchSchedules,
  createScheduleRecord,
  updateScheduleRecord,
  deleteScheduleRecord,
  type ScheduleRecord,
  type ScheduleBody,
} from '@/services/apiService'

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // โหลดเวรของเดือนที่ต้องการ (เช่น "2026-03")
  const loadSchedules = useCallback(async (month?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSchedules(month)
      setSchedules(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('useSchedules - loadSchedules:', err)
      setError(err instanceof Error ? err.message : 'โหลดตารางเวรไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  // เพิ่มเวรใหม่ แล้ว reload เดือนเดิม
  const addSchedule = useCallback(
    async (body: ScheduleBody, month?: string): Promise<boolean> => {
      try {
        setError(null)
        await createScheduleRecord(body)
        await loadSchedules(month)
        return true
      } catch (err) {
        console.error('useSchedules - addSchedule:', err)
        setError(err instanceof Error ? err.message : 'เพิ่มเวรไม่สำเร็จ')
        throw err
      }
    },
    [loadSchedules]
  )

  // แก้ไขเวร
  const editSchedule = useCallback(
    async (id: string, body: Omit<ScheduleBody, 'date'>, month?: string): Promise<boolean> => {
      try {
        setError(null)
        await updateScheduleRecord(id, body)
        await loadSchedules(month)
        return true
      } catch (err) {
        console.error('useSchedules - editSchedule:', err)
        setError(err instanceof Error ? err.message : 'แก้ไขเวรไม่สำเร็จ')
        throw err
      }
    },
    [loadSchedules]
  )

  // ลบเวร
  const removeSchedule = useCallback(
    async (id: string, month?: string): Promise<boolean> => {
      try {
        setError(null)
        await deleteScheduleRecord(id)
        await loadSchedules(month)
        return true
      } catch (err) {
        console.error('useSchedules - removeSchedule:', err)
        setError(err instanceof Error ? err.message : 'ลบเวรไม่สำเร็จ')
        throw err
      }
    },
    [loadSchedules]
  )

  return {
    schedules,
    loading,
    error,
    loadSchedules,
    addSchedule,
    editSchedule,
    removeSchedule,
  }
}
