// ควบคุมเดือน / ปี / เปลี่ยน view / ปุ่ม Today
import { useState, useMemo } from 'react'

export type ViewType = 'list' | 'week' | 'month' | 'year'

export const VIEWS: ViewType[] = ['list', 'week', 'month', 'year']

export default function useScheduleControls() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<ViewType>('list')

  // แสดงเดือน+ปี สำหรับ month view
  const formatMonth = useMemo(() => {
    return currentDate.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
    })
  }, [currentDate])

  // แสดงปี สำหรับ year view (พ.ศ.)
  const formatYear = useMemo(() => {
    return currentDate.getFullYear() + 543
  }, [currentDate])

  // format วันที่สำหรับแสดงใน modal
  function formatDate(date: Date | string | null): string {
    if (!date) return ''
    if (typeof date === 'string') return date
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // format สำหรับแสดงใน header
  const formatDisplay = useMemo(() => {
    if (currentView === 'year') return String(formatYear)
    if (currentView === 'month') return formatMonth
    if (currentView === 'week') {
      const d = currentDate
      return (
        `สัปดาห์ของ ${d.getDate()} ` +
        d.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
      )
    }
    if (currentView === 'list') {
      return currentDate.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
    return formatMonth
  }, [currentDate, currentView, formatMonth, formatYear])

  function goPrev() {
    const d = new Date(currentDate)
    if (currentView === 'year') d.setFullYear(d.getFullYear() - 1)
    else if (currentView === 'month') d.setMonth(d.getMonth() - 1)
    else if (currentView === 'week') d.setDate(d.getDate() - 7)
    else if (currentView === 'list') d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  function goNext() {
    const d = new Date(currentDate)
    if (currentView === 'year') d.setFullYear(d.getFullYear() + 1)
    else if (currentView === 'month') d.setMonth(d.getMonth() + 1)
    else if (currentView === 'week') d.setDate(d.getDate() + 7)
    else if (currentView === 'list') d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  function goToday() {
    setCurrentDate(new Date())
  }

  function changeView(view: ViewType) {
    if (!VIEWS.includes(view)) return
    setCurrentView(view)
  }

  return {
    currentDate,
    setCurrentDate,
    currentView,
    formatMonth,
    formatYear,
    formatDate,
    formatDisplay,
    goPrev,
    goNext,
    goToday,
    changeView,
  }
}
