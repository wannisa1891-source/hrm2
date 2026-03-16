'use client';
import AppLayout from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DonutChart from '@/components/dashboard/DonutChart';
import PendingList from '@/components/dashboard/PendingList';
import SystemAlert from '@/components/dashboard/SystemAlert';
import { useDashboard } from '@/hooks/useDashboard';
import Modal from '@/components/common/Modal';

export default function DashboardPage() {
  const { dashboardData, loading, error, loadDashboard } = useDashboard();
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
<<<<<<< HEAD
  const [newsList, setNewsList] = useState<any[]>([]);
=======

  const [newsList, setNewsList] = useState<any[]>([
    {
      title: 'นโยบายการเบิกจ่ายสวัสดิการใหม่',
      date: 'เริ่มใช้งาน 1 เม.ย. นี้เป็นต้นไป  ',
      content: 'ตั้งแต่วันที่ 1 เมษายน 2569 เป็นต้นไป ฝ่ายบุคคลได้ปรับปรุงนโยบายการเบิกจ่ายสวัสดิการ โดยเพิ่มวงเงินค่ารักษาพยาบาลและเพิ่มสวัสดิการด้านทันตกรรมให้กับพนักงานทุกคน สามารถตรวจสอบคู่มือฉบับเต็มได้ที่ระบบ Intranet ของโรงพยาบาล',
      icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14',
      iconBg: '#e0e7ff',
      iconColor: '#4f46e5'
    },
    {
      title: 'โครงการตรวจสุขภาพประจำปี',
      date: 'ลงชื่อได้ถึงวันที่ 15 พ.ค. 2569',
      content: 'แจ้งพนักงานทุกท่าน โครงการตรวจสุขภาพประจำปี 2569 ของโรงพยาบาลจัดขึ้นในวันที่ 20-30 พฤษภาคม ขอให้พนักงานทุกคนเข้าไปลงชื่อและเลือกเพจเกจการตรวจสุขภาพผ่านลิงก์ของฝ่ายบุคคล ภายในวันที่ 15 พฤษภาคม 2569',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      iconBg: '#fce7f3',
      iconColor: '#db2777'
    }
  ]);
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // เพิ่มสถานะการกำลังบันทึก
  const [newNewsForm, setNewNewsForm] = useState({ title: '', content: '', image: '' });

  // ฟังก์ชันดึงข่าวสารจาก API
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const json = await res.json();
      if (json.success) {
        const formattedNews = json.data.map((item: any) => {
<<<<<<< HEAD
=======
          // Format date
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
          const d = new Date(item.created_at);
          const dateStr = d.toLocaleDateString('th-TH', {
            day: 'numeric', month: 'short', year: 'numeric'
          });
          return {
<<<<<<< HEAD
            ...item,
            date: `ประกาศเมื่อ ${dateStr}`,
=======
            title: item.title,
            date: `ประกาศเมื่อ ${dateStr}`,
            content: item.content,
            image: item.image,
            icon: item.icon,
            iconBg: item.iconBg,
            iconColor: item.iconColor
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
          };
        });
        setNewsList(formattedNews);
      }
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // จำกัดขนาด 2MB
        alert("ไฟล์รูปภาพใหญ่เกินไป (ไม่ควรเกิน 2MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewNewsForm({ ...newNewsForm, image: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // ฟังก์ชันส่งข้อมูลข่าวใหม่ลงฐานข้อมูล
  const submitNewNews = async () => {
<<<<<<< HEAD
    if (!newNewsForm.title || !newNewsForm.content) {
      return alert('กรุณากรอกหัวข้อและเนื้อหาประกาศ');
    }

    setIsSubmitting(true);
=======
    if (!newNewsForm.title || !newNewsForm.content) return alert('กรุณากรอกหัวข้อและเนื้อหาประกาศ');

>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
<<<<<<< HEAD
        body: JSON.stringify({
          ...newNewsForm,
          // เพิ่มค่า Default สำหรับไอคอนเพื่อให้ API ไม่ Error
          icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
          iconBg: '#fef3c7',
          iconColor: '#d97706'
        })
=======
        body: JSON.stringify(newNewsForm)
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
      });

      const data = await res.json();
      if (data.success) {
<<<<<<< HEAD
        alert('บันทึกข่าวสารสำเร็จ!');
        await fetchAnnouncements(); // โหลดรายการข่าวใหม่
        setIsAddingNews(false); // ปิด Modal
        setNewNewsForm({ title: '', content: '', image: '' }); // ล้างฟอร์ม
      } else {
        alert('ไม่สามารถเพิ่มข่าวสารได้: ' + (data.error || 'ชื่อตารางอาจไม่ถูกต้อง'));
=======
        // Refresh list from DB
        await fetchAnnouncements();
        setIsAddingNews(false);
        setNewNewsForm({ title: '', content: '', image: '' });
      } else {
        alert('ไม่สามารถเพิ่มข่าวสารได้: ' + data.error);
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      console.error(e);
<<<<<<< HEAD
    } finally {
      setIsSubmitting(false);
=======
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
    }
  };

  useEffect(() => {
    loadDashboard();
    fetchAnnouncements();
    const mockUserStr = localStorage.getItem('mockUser');
    if (mockUserStr) {
      setUser(JSON.parse(mockUserStr));
    } else {
      setUser({ role: 'admin' });
    }
  }, [loadDashboard]);

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <AppLayout>
      <div className="dashboard-wrapper" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DashboardHeader today={today} />

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            ⚠️ ไม่สามารถโหลด Dashboard ได้: {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 15 }}>
            ⏳ กำลังโหลดข้อมูล Dashboard...
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, flex: 1, minHeight: 0 }} className="dashboard-grid">

            {/* Left Column */}
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <StatCard
                  icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  iconBg="linear-gradient(135deg, #dcfce7, #bbf7d0)"
                  label="บุคลากรทั้งหมด"
                  value={dashboardData.empCount}
                  unit="คน"
                  trend="↑ 2%"
                  trendUp
                  href="/employees"
                  iconColor="#15803d"
                />
                <StatCard
                  icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  iconBg="linear-gradient(135deg, #fee2e2, #fecaca)"
                  label="ลางาน/พักร้อน"
                  value={dashboardData.leaveTodayCount}
                  unit="คน"
                  trend="วันนี้"
                  href="/leave"
                  iconColor="#b91c1c"
                />
                <StatCard
                  icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  iconBg="linear-gradient(135deg, #fef9c3, #fef08a)"
                  label="อัตรากำลังว่าง"
                  value={dashboardData.vacantCount}
                  unit="อัตรา"
                  trend="คงเหลือ"
                  href="/org-structure"
                  iconColor="#a16207"
                />
              </div>
<<<<<<< HEAD
              <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
                <DonutChart data={dashboardData.professions} />
=======

              <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }} className="middle-section">

                {/* Donut Chart */}
                <div style={{ flex: 1, display: 'flex' }}>
                  <DonutChart data={dashboardData.professions} />
                </div>

>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
              </div>
            </div>

            {/* Right Column */}
            <div style={{ gridColumn: 'span 4', display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>
              <PendingList
                transfersCount={dashboardData.pendingTransfers}
                leavesCount={dashboardData.pendingLeaves}
              />

              {/* Announcements Section */}
              <div className="glass-card hover-glow" style={{ background: "white", borderRadius: 20, padding: "16px 20px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>📣 ประกาศ / ข่าวสาร</h3>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Announcements</span>
                  </div>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setIsAddingNews(true)}
<<<<<<< HEAD
                      style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      + เขียนข่าว
=======
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      className="hover-lift"
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      เขียนข่าว
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
                    </button>
                  )}
                </div>

<<<<<<< HEAD
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: '200px' }}>
                  {newsList.length === 0 ? (
                    <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>ไม่มีประกาศใหม่</p>
                  ) : (
                    newsList.map((news, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedNews(news)}
                        style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 12, padding: '10px', display: 'flex', gap: 12, textAlign: 'left', cursor: 'pointer' }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: news.iconBg || '#eff6ff', color: news.iconColor || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={news.icon || "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"} />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{news.title}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{news.date}</div>
                        </div>
                      </button>
                    ))
                  )}
=======
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: '180px' }}>
                  {newsList.map((news, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedNews(news)}
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', alignItems: 'flex-start' }}
                      className="hover-lift"
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: news.iconBg, color: news.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={news.icon} /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{news.title}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{news.date}</div>
                      </div>
                    </button>
                  ))}
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex' }}><SystemAlert /></div>
            </div>
          </div>
        )}

<<<<<<< HEAD
        {/* Modals */}
        <Modal isOpen={!!selectedNews} onClose={() => setSelectedNews(null)} title="รายละเอียดประกาศ">
          {selectedNews && (
            <div style={{ padding: '10px' }}>
              <h3 style={{ fontSize: 18, color: '#1e293b', marginBottom: 12 }}>{selectedNews.title}</h3>
              {selectedNews.image && <img src={selectedNews.image} alt="Announcement" style={{ width: '100%', borderRadius: 12, marginBottom: 16 }} />}
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selectedNews.content}</p>
=======
        {/* News Details Modal */}
        <Modal
          isOpen={!!selectedNews}
          onClose={() => setSelectedNews(null)}
          title="รายละเอียดประกาศ"
        >
          {selectedNews && (
            <div style={{ padding: '0 10px 10px 10px' }}>
              <h3 style={{ fontSize: 18, color: '#1e293b', marginBottom: selectedNews.image ? 16 : 10 }}>{selectedNews.title}</h3>

              {selectedNews.image && (
                <div style={{ marginBottom: 16 }}>
                  <img src={selectedNews.image} alt="Announcement" style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
                </div>
              )}

              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>{selectedNews.content}</p>
              <div style={{ marginTop: 24, textAlign: 'right' }}>
                <button onClick={() => setSelectedNews(null)} className="btn-primary" style={{ padding: '8px 24px' }}>ปิด</button>
              </div>
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
            </div>
          )}
        </Modal>

<<<<<<< HEAD
        <Modal isOpen={isAddingNews} onClose={() => setIsAddingNews(false)} title="สร้างประกาศข่าวสารใหม่">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>หัวข้อประกาศ</label>
              <input type="text" value={newNewsForm.title} onChange={e => setNewNewsForm({ ...newNewsForm, title: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }} placeholder="ระบุหัวข้อข่าว..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>รายละเอียด</label>
              <textarea rows={4} value={newNewsForm.content} onChange={e => setNewNewsForm({ ...newNewsForm, content: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', resize: 'none' }} placeholder="เนื้อหาประกาศ..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>รูปภาพประกอบ</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {newNewsForm.image && <img src={newNewsForm.image} alt="Preview" style={{ marginTop: 10, height: 80, borderRadius: 8 }} />}
            </div>
            <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button onClick={() => setIsAddingNews(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white' }}>ยกเลิก</button>
              <button onClick={submitNewNews} disabled={isSubmitting} className="btn-primary" style={{ padding: '8px 24px', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'กำลังบันทึก...' : 'ประกาศข่าว'}
              </button>
=======
        {/* Add News Modal */}
        <Modal
          isOpen={isAddingNews}
          onClose={() => setIsAddingNews(false)}
          title="สร้างประกาศข่าวสารใหม่"
        >
          <div style={{ padding: '0 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>หัวข้อประกาศ</label>
              <input
                type="text"
                value={newNewsForm.title}
                onChange={e => setNewNewsForm({ ...newNewsForm, title: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                placeholder="เช่น กำหนดการวันหยุดสงกรานต์"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>รายละเอียด</label>
              <textarea
                rows={4}
                value={newNewsForm.content}
                onChange={e => setNewNewsForm({ ...newNewsForm, content: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, resize: 'none' }}
                placeholder="รายละเอียดข่าวสาร..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>อัปโหลดรูปภาพ (ถ้ามี)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ fontSize: 14 }}
              />
              {newNewsForm.image && (
                <div style={{ marginTop: 10 }}>
                  <img src={newNewsForm.image} alt="Preview" style={{ maxWidth: '100%', height: 100, borderRadius: 8, objectFit: 'cover' }} />
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setIsAddingNews(false)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: 600 }}>ยกเลิก</button>
              <button onClick={submitNewNews} className="btn-primary" style={{ padding: '8px 24px' }}>ประกาศข่าว</button>
>>>>>>> 3f4475d052bcc5c265772691a56354e96cea55af
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}