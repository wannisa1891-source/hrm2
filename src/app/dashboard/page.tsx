'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import StatCard from '@/components/dashboard/StatCard'
import DonutChart from '@/components/dashboard/DonutChart'
import PendingList from '@/components/dashboard/PendingList'
import SystemAlert from '@/components/dashboard/SystemAlert'
import Modal from '@/components/common/Modal'
import { useDashboard } from '@/hooks/useDashboard'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import Swal from 'sweetalert2'
import UserDashboard from '@/components/dashboard/UserDashboard'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()

  // React Query Hooks
  const { dashboardData, loading, error, loadDashboard } = useDashboard(user?.emp_id, user?.role)
  const { announcements, loading: announcementsLoading, refetch: refetchAnnouncements } = useAnnouncements()

  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [isAddingNews, setIsAddingNews] = useState(false)

  const [newNewsForm, setNewNewsForm] = useState<any>({
    id: null,
    title: '',
    content: '',
    image: ''
  })

  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (announcements.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % announcements.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [announcements.length])

  const submitNews = async () => {
    if (!newNewsForm.title || !newNewsForm.content) {
      Swal.fire('ข้อความแจ้งเตือน', 'กรอกข้อมูลให้ครบ', 'warning')
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
        await refetchAnnouncements()
        setIsAddingNews(false)
        setNewNewsForm({
          id: null,
          title: '',
          content: '',
          image: ''
        })
        Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const isAdmin = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role || '');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
    } else if (user && !isAdmin) {
      // Redirect regular users to profile
      router.push('/profile');
    }
  }, [router, user, isAdmin])

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const newsContent = (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 340, maxHeight: 420, padding: isAdmin ? '24px' : '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className={isAdmin ? '' : 'clay-accent-blue'} style={{ color: isAdmin ? '#3b82f6' : undefined, display: 'flex', width: 56, height: 56, borderRadius: isAdmin ? 14 : '50%', background: isAdmin ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : undefined, alignItems: 'center', justifyContent: 'center', boxShadow: isAdmin ? 'inset 0 2px 4px rgba(255,255,255,0.5)' : undefined }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: isAdmin ? '#1e2433' : '#334155' }}>ข่าวสารองค์กร</h3>
            <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600, marginTop: 4 }}>Announcements</div>
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

      <div style={{ position: 'relative', flex: 1, borderRadius: isAdmin ? 16 : 16, overflow: 'hidden', background: isAdmin ? '#0f172a' : '#e0e5ec', boxShadow: isAdmin ? undefined : 'inset 6px 6px 12px rgba(163, 177, 198, 0.4), inset -6px -6px 12px rgba(255, 255, 255, 0.8)' }}>
        {announcements.length > 0 ? (
          <>
            <div style={{ display: 'flex', width: '100%', height: '100%', transition: 'transform 0.5s ease-in-out', transform: `translateX(-${currentSlide * 100}%)` }}>
              {announcements.map((news, i) => (
                <div key={i} onClick={() => setSelectedNews(news)} style={{ width: '100%', height: '100%', flexShrink: 0, position: 'relative', cursor: 'pointer', padding: isAdmin ? 0 : '16px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: isAdmin ? 0 : 12, overflow: 'hidden', position: 'relative', boxShadow: isAdmin ? 'none' : '4px 4px 8px rgba(163, 177, 198, 0.4), -4px -4px 8px rgba(255, 255, 255, 0.8)' }}>
                    {news.image ? (
                      <Image fill unoptimized src={news.image} alt={news.title} style={{ objectFit: 'cover', opacity: isAdmin ? 0.6 : 0.85 }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: isAdmin ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #8fa29e 0%, #b5b3d6 100%)' }} />
                    )}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isAdmin ? '24px 20px' : '28px 24px', background: isAdmin ? 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' : 'linear-gradient(to top, rgba(227, 228, 230, 0.98), rgba(227, 228, 230, 0))' }}>
                      <div className={isAdmin ? '' : 'clay-pill'} style={{ display: 'inline-flex', padding: isAdmin ? '4px 10px' : undefined, background: isAdmin ? '#3b82f6' : undefined, color: isAdmin ? 'white' : '#5a6268', fontSize: 11, fontWeight: 800, borderRadius: 8, marginBottom: 12 }}>ข่าวเด่น</div>
                      <h4 style={{ margin: 0, color: isAdmin ? 'white' : '#1e293b', fontSize: isAdmin ? 16 : 20, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{news.title}</h4>
                      <div style={{ color: isAdmin ? '#cbd5e1' : '#64748b', fontSize: 13, marginTop: 6, fontWeight: 600 }}>{news.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', bottom: isAdmin ? 12 : 36, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
              {announcements.map((_, idx) => (
                <div key={idx} onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }} style={{ width: currentSlide === idx ? 20 : 8, height: 8, borderRadius: 8, background: currentSlide === idx ? (isAdmin ? '#3b82f6' : '#8fa29e') : (isAdmin ? 'rgba(255,255,255,0.4)' : '#c5c5e8'), transition: 'all 0.3s', cursor: 'pointer', boxShadow: isAdmin ? 'none' : 'inset 1px 1px 2px rgba(0,0,0,0.1)' }} />
              ))}
            </div>

            <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev === 0 ? announcements.length - 1 : prev - 1)) }} style={{ position: 'absolute', top: '50%', left: isAdmin ? 8 : 24, transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 12, background: isAdmin ? 'rgba(0,0,0,0.5)' : '#e0e5ec', color: isAdmin ? 'white' : '#5a6268', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: isAdmin ? undefined : '2px 2px 4px rgba(163, 177, 198, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.8)' }}>❮</button>
            <button onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev + 1) % announcements.length) }} style={{ position: 'absolute', top: '50%', right: isAdmin ? 8 : 24, transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 12, background: isAdmin ? 'rgba(0,0,0,0.5)' : '#e0e5ec', color: isAdmin ? 'white' : '#5a6268', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: isAdmin ? undefined : '2px 2px 4px rgba(163, 177, 198, 0.4), -2px -2px 4px rgba(255, 255, 255, 0.8)' }}>❯</button>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>ไม่มีข่าวสาร</div>
        )}
      </div>

    </div>
  );

  return (
    <AppLayout hideScrollbar={false}>
      <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '48px', minHeight: '100%' }}>
        <DashboardHeader today={today} />

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {!loading && (
          isAdmin ? (
            <>
              <div className="dashboard-grid">
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
                    <StatCard
                      label="บุคลากรทั้งหมด"
                      value={dashboardData?.empCount || 0}
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
                      value={dashboardData?.leaveTodayCount || 0}
                      unit="คน"
                      icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      iconBg="#fee2e2"
                      iconColor="#ef4444"
                      trend="วันนี้"
                      href="/leave"
                    />

                    <StatCard
                      label="อัตรากำลังว่าง"
                      value={dashboardData?.vacantCount || 0}
                      unit="อัตรา"
                      icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      iconBg="#fef9c3"
                      iconColor="#ca8a04"
                      trend="คงเหลือ"
                      href="/org-structure"
                    />
                  </div>

                  <div style={{ flex: 1, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
                    <DonutChart data={dashboardData?.professions || []} />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <PendingList
                    transfersCount={dashboardData?.pendingTransfers || 0}
                    leavesCount={dashboardData?.pendingLeaves || 0}
                  />

                  {newsContent}

                  <SystemAlert
                    expiringCount={dashboardData?.expiringLicenses || 0}
                    expiredCount={dashboardData?.expiredLicenses || 0}
                  />
                </div>
              </div>
            </>
          ) : (
            <UserDashboard
              user={user}
              leaveStats={dashboardData?.leaveStats || { vacation: { remain: 0, used: 0, raw: 0 }, personal: { remain: 0, used: 0, raw: 0 }, sick: { remain: 0, used: 0, raw: 0 } }}
              recentLeaves={dashboardData?.recentLeaves || []}
              newsList={announcements}
              onSelectNews={setSelectedNews}
              today={today}
              licenseStats={{
                expiring: dashboardData?.expiringLicenses || 0,
                expired: dashboardData?.expiredLicenses || 0
              }}
            />
          )
        )}
      </div>

      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="รายละเอียดข่าวประกาศ"
      >
        {selectedNews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedNews.image && (
              <div style={{ width: '100%', height: 200, position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#f1f5f9' }}>
                <Image fill unoptimized src={selectedNews.image} alt={selectedNews.title} style={{ objectFit: 'cover' }} onError={(e: any) => { e.currentTarget.style.display = 'none' }} />
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
              <div style={{ marginTop: 12, width: 120, height: 80, position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <Image fill unoptimized src={newNewsForm.image} alt="Preview" style={{ objectFit: 'cover' }} />
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
    </AppLayout>
  )
}