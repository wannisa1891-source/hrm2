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
      <div className="dashboard-wrapper">

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, flex: 1, minHeight: 0 }} className="dashboard-grid">

            {/* Left Column (8/12) */}
            <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: 24 }} className="dashboard-left">

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }} className="stat-cards-grid">

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

              <div style={{ flex: 1, display: 'flex', gap: 24 }} className="middle-section">
                
                {/* Quick Actions (New Section) */}
                <div className="glass-card hover-glow" style={{ flex: '0 0 240px', background: "white", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px rgba(0,0,0,0.04)" }}>
                   <div style={{ marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e293b" }}>🔧 เมนูลัด</h3>
                      <span style={{ fontSize: 13, color: "#64748b" }}>Quick Actions</span>
                   </div>
                   
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <button onClick={() => window.location.href='/leave'} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12 }} className="quick-btn">
                         <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         </div>
                         <div style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>อนุมัติใบลา</div>
                      </button>

                      <button onClick={() => window.location.href='/employees'} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12 }} className="quick-btn">
                         <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                         </div>
                         <div style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>เพิ่มพนักงานใหม่</div>
                      </button>

                      <button onClick={() => window.location.href='/transfer'} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12 }} className="quick-btn">
                         <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                         </div>
                         <div style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>ทำเรื่องย้ายแผนก</div>
                      </button>
                   </div>
                </div>

                {/* Donut Chart */}
                <div style={{ flex: 1, display: 'flex' }}>
                   <DonutChart data={dashboardData.professions} />
                </div>
                
              </div>

            </div>

            {/* Right Column (4/12) */}
            <div style={{ gridColumn: 'span 4', display: "flex", flexDirection: "column", gap: 24 }} className="dashboard-right">

              <PendingList
                transfersCount={dashboardData.pendingTransfers}
                leavesCount={dashboardData.pendingLeaves}
              />

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