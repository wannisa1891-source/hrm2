import { useState, useCallback } from 'react'
import { fetchDashboard, type DashboardData } from '@/services/apiService'



const DEFAULT_DATA: DashboardData = {
  empCount: 0,
  leaveTodayCount: 0,
  vacantCount: 0,
  professions: [],
  pendingTransfers: 0,
  pendingLeaves: 0,
  expiringLicenses: 0,
  expiredLicenses: 0,
}

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(DEFAULT_DATA)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (empId?: string, role?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDashboard(empId, role)
      setDashboardData(data)
    } catch (err) {
      console.error('useDashboard - loadDashboard:', err)
      setError(err instanceof Error ? err.message : 'โหลด Dashboard ไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  return { dashboardData, loading, error, loadDashboard }
}
