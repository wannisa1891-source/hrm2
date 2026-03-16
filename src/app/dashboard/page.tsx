'use client';
import AppLayout from '@/components/layout/AppLayout';
import { useEffect } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DonutChart from '@/components/dashboard/DonutChart';
import PendingList from '@/components/dashboard/PendingList';
import SystemAlert from '@/components/dashboard/SystemAlert';
import { useDashboard } from '@/hooks/useDashboard';

export default function DashboardPage() {
  const { dashboardData, loading, error, loadDashboard } = useDashboard();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AppLayout>
      <div className="dashboard-wrapper" style={{ height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        <DashboardHeader today={today} />

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            ⚠️ ไม่สามารถโหลด Dashboard ได้: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 15 }}>
            ⏳ กำลังโหลดข้อมูล Dashboard...
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, flex: 1, minHeight: 0 }} className="dashboard-grid">

            {/* Left Column (8/12) */}
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }} className="dashboard-left">

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="stat-cards-grid">

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

              <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }} className="middle-section">
                
                {/* Donut Chart */}
                <div style={{ flex: 1, display: 'flex' }}>
                   <DonutChart data={dashboardData.professions} />
                </div>
                
              </div>

            </div>

            {/* Right Column (4/12) */}
            <div style={{ gridColumn: 'span 4', display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }} className="dashboard-right">

              <PendingList
                transfersCount={dashboardData.pendingTransfers}
                leavesCount={dashboardData.pendingLeaves}
              />

              {/* Announcements / Upcoming Events */}
              <div className="glass-card hover-glow" style={{ background: "white", borderRadius: 20, padding: "16px 20px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                 <div style={{ marginBottom: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>📣 ประกาศ / ข่าวสาร</h3>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Announcements</span>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10 }}>
                       <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" /></svg>
                       </div>
                       <div>
                           <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>นโยบายการเบิกจ่ายสวัสดิการใหม่</div>
                           <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>เริ่มใช้งาน 1 เม.ย. นี้เป็นต้นไป</div>
                       </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 10 }}>
                       <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fce7f3', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                       </div>
                       <div>
                           <div style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>โครงการตรวจสุขภาพประจำปี</div>
                           <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>ลงชื่อได้ถึงวันที่ 15 พ.ค. 2569</div>
                       </div>
                    </div>
                 </div>
              </div>

              <div style={{ flex: 1, display: 'flex' }}>
                <SystemAlert />
              </div>

            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
}