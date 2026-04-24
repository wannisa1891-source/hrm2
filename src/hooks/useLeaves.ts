import { useState, useCallback } from 'react'
import {
  fetchLeaves,
  createLeave,
  updateLeaveStatus,
  type Leave,
} from '@/services/apiService'

export function useLeaves() {
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchLeaves()
      setLeaves(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('useLeaves - loadLeaves:', err)
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลการลาไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  const addLeave = useCallback(
    async (fd: FormData): Promise<{ success: boolean; message?: string }> => {
      try {
        setError(null)
        await createLeave(fd)
        await loadLeaves()
        return { success: true }
      } catch (err) {
        console.error('useLeaves - addLeave:', err)
        const msg = err instanceof Error ? err.message : 'บันทึกใบลาไม่สำเร็จ'
        setError(msg)
        return { success: false, message: msg }
      }
    },
    [loadLeaves]
  )

  const changeLeaveStatus = useCallback(
    async (leave_id: string, status: string, stage?: string): Promise<{ success: boolean; message?: string }> => {
      try {
        setError(null)
        await updateLeaveStatus(leave_id, status, stage)
        await loadLeaves()
        return { success: true }
      } catch (err) {
        console.error('useLeaves - changeLeaveStatus:', err)
        const msg = err instanceof Error ? err.message : 'อัปเดตสถานะไม่สำเร็จ'
        setError(msg)
        return { success: false, message: msg }
      }
    },
    [loadLeaves]
  )

  return {
    leaves,
    loading,
    error,
    loadLeaves,
    addLeave,
    changeLeaveStatus,
  }
}
