import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDashboard, type DashboardData } from '@/services/apiService'

export function useDashboard(empId?: string, role?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['dashboard', empId, role],
    queryFn: () => fetchDashboard(empId, role),
    staleTime: 60 * 1000, // 1 minute
  })

  return { 
    dashboardData: data, 
    loading: isLoading, 
    error: error instanceof Error ? error.message : null, 
    loadDashboard: refetch 
  }
}
