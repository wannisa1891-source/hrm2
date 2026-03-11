'use client';
import AppLayout from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DonutChart from '@/components/dashboard/DonutChart';
import PendingList from '@/components/dashboard/PendingList';

type DashboardData = {
  empCount: number
  leaveTodayCount: number
  vacantCount: number
  professions: any[]
  pendingTransfers: number
  pendingLeaves: number
}

export default function DashboardPage() {

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    empCount: 0,
    leaveTodayCount: 0,
    vacantCount: 0,
    professions: [],
    pendingTransfers: 0,
    pendingLeaves: 0,
  });

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setDashboardData(data);
      })
      .catch(() => { });
  }, []);

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AppLayout>
      <div className="dashboard-wrapper" style={{ minHeight: '100vh' }}>

        <DashboardHeader today={today} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>

              <StatCard
                icon="👥"
                iconBg="#EBF0E9"
                label="บุคลากรทั้งหมด"
                value={dashboardData.empCount}
                unit="คน"
                trend="↑ 2%"
                trendUp
                href="/employees"
              />

              <StatCard
                icon="📉"
                iconBg="#FFF0F0"
                label="ลางาน/พักร้อน"
                value={dashboardData.leaveTodayCount}
                unit="คน"
                trend="วันนี้"
                href="/leave"
              />

              <StatCard
                icon="📊"
                iconBg="#FFF9EB"
                label="อัตรากำลังว่าง"
                value={dashboardData.vacantCount}
                unit="อัตรา"
                trend="คงเหลือ"
                href="/org-structure"
              />

            </div>

            <DonutChart data={dashboardData.professions} />

          </div>

          <PendingList
            transfersCount={dashboardData.pendingTransfers}
            leavesCount={dashboardData.pendingLeaves}
          />

        </div>

      </div>
    </AppLayout>
  );
}