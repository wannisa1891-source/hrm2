import { useQuery } from '@tanstack/react-query'
import { fetchAnnouncements, type Announcement } from '@/services/apiService'

export function useAnnouncements() {
  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: Announcement[] }>({
    queryKey: ['announcements'],
    queryFn: fetchAnnouncements,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  // Format data for UI display
  const formattedData = data?.data.map((item: any) => {
    const d = new Date(item.created_at)
    const dateStr = d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    return {
      ...item,
      date: `ประกาศเมื่อ ${dateStr}`
    }
  }) || []

  return {
    announcements: formattedData,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch
  }
}
