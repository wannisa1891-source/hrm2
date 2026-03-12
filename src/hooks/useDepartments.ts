import { useState, useCallback } from 'react'
import { fetchDepartments, type Department } from '@/services/apiService'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDepartments()
      setDepartments(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('useDepartments - loadDepartments:', err)
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลแผนกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  return { departments, loading, error, loadDepartments }
}
