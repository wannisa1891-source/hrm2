import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  type Employee,
} from '@/services/apiService'

export function useEmployees() {
  const queryClient = useQueryClient()

  const { data: employees = [], isLoading: loading, error: queryError, refetch: loadEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const data = await fetchEmployees()
      return Array.isArray(data) ? data : []
    },
  })

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'โหลดข้อมูลพนักงานไม่สำเร็จ') : null

  const addMutation = useMutation({
    mutationFn: (formData: FormData) => createEmployee(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ emp_id, formData }: { emp_id: string; formData: FormData }) => updateEmployee(emp_id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (emp_id: string) => deleteEmployee(emp_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })

  const addEmployee = async (formData: FormData): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await addMutation.mutateAsync(formData)
      return { success: true, message: res.message }
    } catch (err: any) {
      console.error('useEmployees - addEmployee:', err)
      return { success: false, message: err.message || 'เพิ่มพนักงานไม่สำเร็จ' }
    }
  }

  const editEmployee = async (emp_id: string, formData: FormData): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await editMutation.mutateAsync({ emp_id, formData })
      return { success: true, message: res.message }
    } catch (err: any) {
      console.error('useEmployees - editEmployee:', err)
      return { success: false, message: err.message || 'แก้ไขข้อมูลไม่สำเร็จ' }
    }
  }

  const removeEmployee = async (emp_id: string): Promise<boolean> => {
    try {
      await removeMutation.mutateAsync(emp_id)
      return true
    } catch (err) {
      console.error('useEmployees - removeEmployee:', err)
      return false
    }
  }

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
