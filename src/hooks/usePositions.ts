import { useState, useCallback } from 'react'
import { fetchPositions, type Position } from '@/services/apiService'

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPositions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchPositions()
      setPositions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('usePositions - loadPositions:', err)
      setError(err instanceof Error ? err.message : 'โหลดข้อมูลตำแหน่งไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  return { positions, loading, error, loadPositions }
}
