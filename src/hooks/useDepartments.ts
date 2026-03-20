import { useState, useCallback } from 'react'
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment, type Department } from '@/services/apiService'

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
  const addDepartment = async (dept_id: string, dept_name: string) => {
    try {
      setLoading(true)
      await createDepartment({ dept_id, dept_name })
      await loadDepartments() // Refresh
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally { setLoading(false) }
  }

  const editDepartment = async (dept_id: string, dept_name: string) => {
    try {
      setLoading(true)
      await updateDepartment(dept_id, { dept_name })
      await loadDepartments()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally { setLoading(false) }
  }

  const removeDepartment = async (dept_id: string) => {
    try {
      setLoading(true)
      await deleteDepartment(dept_id)
      await loadDepartments()
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    } finally { setLoading(false) }
  }

  return { departments, loading, error, loadDepartments, addDepartment, editDepartment, removeDepartment }
}
