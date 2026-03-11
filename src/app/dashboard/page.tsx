/* หน้าจอ Dashboard */
'use client';
import AppLayout from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DonutChart from '@/components/dashboard/DonutChart';
import PendingList from '@/components/dashboard/PendingList';

export default function DashboardPage() {
  const [empCount, setEmpCount] = useState(0);
  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => setEmpCount(Array.isArray(data) ? data.length : 0))
      .catch(() => { });
  }, []);
  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return (
    <AppLayout>
      <div
        className="dashboard-wrapper"
        style={{
          minHeight: '100vh',
          background: '#f0f2f5',
          fontFamily: "'Sarabun', sans-serif",
          color: '#1a1a1a',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* BG decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: 500,
            height: 500,
            background: 'radial-gradient(circle, rgba(74,86,68,0.07) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        {/* Header */}
        <DashboardHeader today={today} />
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 30 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <StatCard
                icon="👥"
                iconBg="#EBF0E9"
                label="บุคลากรทั้งหมด"
                value={empCount}
                unit="คน"
                trend="↑ 2%"
                trendUp
                href="/employees"
              />
              <StatCard
                icon="📉"
                iconBg="#FFF0F0"
                label="ลางาน/พักร้อน"
                value={0}
                unit="คน"
                trend="วันนี้"
                href="/leave"
              />
              <StatCard
                icon="📊"
                iconBg="#FFF9EB"
                label="อัตรากำลังว่าง"
                value={0}
                unit="อัตรา"
                trend="คงเหลือ"
                href="/org-structure"
              />
            </div>
            {/* Chart */}
            <DonutChart />
          </div>
          {/* Right */}
          <PendingList />
        </div>
      </div>
    </AppLayout>
  );
}