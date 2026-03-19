//วันที่-ข้อความต้อนรับ-ช่องค้นหา-รูปโปรไฟล์
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  type: 'employee' | 'leave' | 'transfer' | 'schedule' | 'announcement';
  id: string;
  title: string;
  subtitle: string;
}

export default function DashboardHeader({ today, userName = "Hospital HRM" }: { today: string, userName?: string }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (searchQuery.trim().length === 0) {
      setResults([])
      setShowDropdown(false)
      return
    }

    const fetchResults = async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        const data = await res.json()
        if (data.success) {
          setResults(data.results)
          setShowDropdown(true)
        }
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setIsSearching(false)
      }
    }

    timeoutId = setTimeout(fetchResults, 300) // 300ms debounce
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowDropdown(false)
      router.push(`/employees?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    setShowDropdown(false)
    switch(result.type) {
      case 'employee':
        router.push(`/employees?q=${encodeURIComponent(result.id)}`)
        break;
      case 'leave':
        router.push('/leave')
        break;
      case 'transfer':
        router.push('/transfer')
        break;
      case 'schedule':
        router.push('/schedule')
        break;
      case 'announcement':
        // Scroll to announcements or open modal if handled by state
        router.push('/dashboard')
        break;
    }
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'employee': return '🧑‍⚕️';
      case 'leave': return '🏖️';
      case 'transfer': return '🔄';
      case 'schedule': return '📅';
      case 'announcement': return '📣';
      default: return '📄';
    }
  }
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>

      <div>
        <span style={{
          background: 'white',
          padding: '3px 12px',
          borderRadius: 100,
          fontSize: 11,
          fontWeight: 700,
          color: '#4A5644',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}>
          {today}
        </span>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 2px' }}>
          สวัสดีครับ, <span style={{ color: '#4A5644' }}>{userName}</span>
        </h1>

        <p style={{ color: '#666', margin: 0 }}>
          มาดูความเคลื่อนไหวของบุคลากรวันนี้กันครับ
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div style={{
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid white',
            padding: '10px 18px',
            borderRadius: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: 250
          }}>
            <span>🔍</span>

            <input
              type="text"
              placeholder="ค้นหาข้อมูล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchEnter}
              onFocus={() => { if(results.length > 0) setShowDropdown(true) }}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontFamily: 'Sarabun, sans-serif',
                fontSize: 14
              }}
            />
            {isSearching && <span style={{ fontSize: 12, color: '#94a3b8' }}>...</span>}
          </div>

          {/* Search Dropdown */}
          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 320,
              maxHeight: 400,
              overflowY: 'auto',
              background: 'white',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              padding: 8,
              gap: 4
            }}>
              {results.length > 0 ? results.map((item, idx) => (
                <div 
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleResultClick(item)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ fontSize: 20 }}>{getIconForType(item.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                  ไม่พบข้อมูลที่ค้นหา
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', width: 45, height: 45 }}>

          <div style={{
            width: 45,
            height: 45,
            background: '#4A5644',
            color: 'white',
            borderRadius: 15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>

          <div style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 12,
            height: 12,
            background: '#4cd137',
            border: '2px solid #f0f2f5',
            borderRadius: '50%'
          }} />

        </div>

      </div>
    </header>
  )
}