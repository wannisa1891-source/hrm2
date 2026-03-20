'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatCard from '@/components/dashboard/StatCard'
import DonutChart from '@/components/dashboard/DonutChart'
import PendingList from '@/components/dashboard/PendingList'
import SystemAlert from '@/components/dashboard/SystemAlert'
import Modal from '@/components/common/Modal'
import { useDashboard } from '@/hooks/useDashboard'

export default function DashboardPage() {

  const { dashboardData, loading, error, loadDashboard } = useDashboard()

  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  const [newsList, setNewsList] = useState<any[]>([])

  const [isAddingNews, setIsAddingNews] = useState(false)

  const [newNewsForm, setNewNewsForm] = useState<any>({
    id: null,
    title: '',
    content: '',
    image: ''
  })

  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (newsList.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % newsList.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [newsList.length])


  const fetchAnnouncements = async () => {

    try {

      const res = await fetch('/api/announcements')
      const json = await res.json()

      if (json.success) {

        const formatted = json.data.map((item: any) => {

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

        })

        setNewsList(formatted)

      }

    } catch (err) {

      console.error(err)

    }

  }


  const submitNews = async () => {

    if (!newNewsForm.title || !newNewsForm.content) {
      alert('กรอกข้อมูลให้ครบ')
      return
    }

    try {

      const method = newNewsForm.id ? 'PUT' : 'POST'

      const res = await fetch('/api/announcements', {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNewsForm)
      })

      const data = await res.json()

      if (data.success) {

        await fetchAnnouncements()

        setIsAddingNews(false)

        setNewNewsForm({
          id: null,
          title: '',
          content: '',
          image: ''
        })

      }

    } catch (err) {

      console.error(err)

    }

  }


  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // หากไม่มี token ให้ทำการ redirect ไปหน้า login 
    if (!token) {
      window.location.href = '/login';
      return;
    }

    fetchAnnouncements()

    const u = localStorage.getItem('mockUser')

    if (u) {
      const parsed = JSON.parse(u)
      setUser(parsed)
      loadDashboard(parsed.emp_id, parsed.role)
    } else {
      setUser({ role: 'user' })
      loadDashboard()
    }

  }, [loadDashboard])


  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })


  return (

    <AppLayout hideScrollbar={true}>
      <div className="no-scrollbar" style={{ height: 'calc(100vh - 44px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader today={today} />

      {loading && <p>Loading...</p>}

      {!loading && (

        <div className="dashboard-grid" style={{ flex: 1, minHeight: 0 }}>

          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0 }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>

              <StatCard
                label="บุคลากรทั้งหมด"
                value={dashboardData.empCount}
                unit="คน"
                icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                iconBg="#dcfce7"
                iconColor="#16a34a"
                trend="↑ 2%"
                trendUp={true}
                href="/employees"
              />

              <StatCard
                label="ลางาน/พักร้อน"
                value={dashboardData.leaveTodayCount}
                unit="คน"
                icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                iconBg="#fee2e2"
                iconColor="#ef4444"
                trend="วันนี้"
                href="/leave"
              />

              <StatCard
                label="อัตรากำลังว่าง"
                value={dashboardData.vacantCount}
                unit="อัตรา"
                icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                iconBg="#fef9c3"
                iconColor="#ca8a04"
                trend="คงเหลือ"
                href="/org-structure"
              />

            </div>

            <div style={{ flex: 1, minHeight: 0 }}>
              <DonutChart data={dashboardData.professions} />
            </div>

          </div>


          <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24, minHeight: 0 }}>

            <PendingList
              transfersCount={dashboardData.pendingTransfers}
              leavesCount={dashboardData.pendingLeaves}
            />

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                   <div style={{ color: '#3b82f6', display: 'flex' }}>
                     <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                     </svg>
                   </div>
                   <div>
                     <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e2433' }}>ข่าวสาร</h3>
                     <div style={{ fontSize: 12, color: '#94a3b8' }}>Announcements</div>
                   </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => {
                    setNewNewsForm({ id: null, title: '', content: '', image: '' })
                    setIsAddingNews(true)
                  }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 600, borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }} className="hover-glow">
                    + เขียนข่าว
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', flex: 1, borderRadius: 16, overflow: 'hidden', background: '#0f172a' }}>
                {newsList.length > 0 ? (
                  <>
                    <div style={{ display: 'flex', width: '100%', height: '100%', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${currentSlide * 100}%)` }}>
                      {newsList.map((news, i) => (
                        <div key={i} onClick={() => setSelectedNews(news)} style={{ width: '100%', height: '100%', flexShrink: 0, position: 'relative', cursor: 'pointer' }}>
                          {news.image ? (
                            <img src={news.image} alt={news.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} />
                          )}
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                            <div style={{ display: 'inline-block', padding: '4px 10px', background: '#3b82f6', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 20, marginBottom: 8 }}>ประกาศ</div>
                            <h4 style={{ margin: 0, color: 'white', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{news.title}</h4>
                            <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>{news.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6 }}>
                      {newsList.map((_, idx) => (
                        <div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} style={{ width: currentSlide === idx ? 16 : 6, height: 6, borderRadius: 6, background: currentSlide === idx ? '#3b82f6' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s', cursor: 'pointer' }} />
                      ))}
                    </div>

                    <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev === 0 ? newsList.length - 1 : prev - 1)) }} style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>❮</button>
                    <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev + 1) % newsList.length) }} style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>❯</button>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>ไม่มีข่าวสาร</div>
                )}
              </div>

            </div>

            <SystemAlert 
              expiringCount={dashboardData.expiringLicenses} 
              expiredCount={dashboardData.expiredLicenses} 
            />

          </div>

        </div>

      )}


      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="รายละเอียดข่าวประกาศ"
      >
        {selectedNews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedNews.image && (
              <div style={{ width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', background: '#f1f5f9' }}>
                <img src={selectedNews.image} alt={selectedNews.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>{selectedNews.title}</h3>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{selectedNews.date}</div>
            </div>
            
            <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <p style={{ margin: 0, fontSize: 15, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{selectedNews.content}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              {user?.role === 'admin' && (
                <button className="btn-primary" onClick={() => {
                  setNewNewsForm({ id: selectedNews.id, title: selectedNews.title, content: selectedNews.content, image: selectedNews.image || '' });
                  setSelectedNews(null);
                  setIsAddingNews(true);
                }}>
                  แก้ไข
                </button>
              )}
              <button className="btn-outline" onClick={() => setSelectedNews(null)}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </Modal>


      <Modal
        isOpen={isAddingNews}
        onClose={() => {
          setIsAddingNews(false);
          setNewNewsForm({ id: null, title: '', content: '', image: '' });
        }}
        title={newNewsForm.id ? "แก้ไขข่าว" : "เพิ่มข่าว"}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">หัวข้อข่าว</label>
            <input
              className="form-input"
              placeholder="ระบุหัวข้อข่าวสาร..."
              value={newNewsForm.title}
              onChange={(e) =>
                setNewNewsForm({ ...newNewsForm, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">รายละเอียด</label>
            <textarea
              className="form-input"
              style={{ minHeight: 120, resize: 'vertical' }}
              placeholder="ระบุรายละเอียดข่าวสาร..."
              value={newNewsForm.content}
              onChange={(e) =>
                setNewNewsForm({ ...newNewsForm, content: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">รูปภาพประกอบ</label>
            <input
              type="file"
              accept="image/*"
              className="form-input"
              style={{ cursor: 'pointer', padding: '8px 14px' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setNewNewsForm({ ...newNewsForm, image: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {newNewsForm.image && (
              <div style={{ marginTop: 12, width: 120, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img src={newNewsForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button className="btn-outline" onClick={() => setIsAddingNews(false)}>
              ยกเลิก
            </button>
            <button className="btn-primary" onClick={submitNews}>
              บันทึกข่าวสาร
            </button>
          </div>
        </div>
      </Modal>

      </div>
    </AppLayout>

  )

}