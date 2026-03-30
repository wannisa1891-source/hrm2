import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPayrollDashboard, type PayrollRecord } from '@/services/apiService'

export function usePayroll(empId?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<{
    employees: PayrollRecord[],
    targetMonth: number,
    targetYear: number
  }>({
    queryKey: ['payroll', empId],
    queryFn: () => fetchPayrollDashboard(empId),
    staleTime: 60 * 1000,
  })

  return {
    data,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    fetchDashboardData: refetch
  }
}
