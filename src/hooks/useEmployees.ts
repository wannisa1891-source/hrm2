import { useState, useCallback } from 'react'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from '@/services/apiService'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchEmployees()
      setEmployees(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('useEmployees - loadEmployees:', err)
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลพนักงานไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  const addEmployee = useCallback(
    async (formData: FormData): Promise<boolean> => {
      try {
        setError(null)
        await createEmployee(formData)
        await loadEmployees()
        return true
      } catch (err) {
        console.error('useEmployees - addEmployee:', err)
        setError(err instanceof Error ? err.message : 'เพิ่มพนักงานไม่สำเร็จ')
        return false
      }
    },
    [loadEmployees]
  )

  const editEmployee = useCallback(
    async (emp_id: string, formData: FormData): Promise<boolean> => {
      try {
        setError(null)
        await updateEmployee(emp_id, formData)
        await loadEmployees()
        return true
      } catch (err) {
        console.error('useEmployees - editEmployee:', err)
        setError(err instanceof Error ? err.message : 'แก้ไขข้อมูลไม่สำเร็จ')
        return false
      }
    },
    [loadEmployees]
  )

  const removeEmployee = useCallback(
    async (emp_id: string): Promise<boolean> => {
      try {
        setError(null)
        await deleteEmployee(emp_id)
        await loadEmployees()
        return true
      } catch (err) {
        console.error('useEmployees - removeEmployee:', err)
        setError(err instanceof Error ? err.message : 'ลบพนักงานไม่สำเร็จ')
        return false
      }
    },
    [loadEmployees]
  )

  return {
    employees,
    loading,
    error,
    loadEmployees,
    addEmployee,
    editEmployee,
    removeEmployee,
  }
}
