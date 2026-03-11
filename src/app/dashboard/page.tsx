/* หน้าจอ Dashboard */
'use client';

import AppLayout from '@/components/layout/AppLayout';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/dashboard/StatCard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DonutChart from "@/components/dashboard/DonutChart"
import PendingList from "@/components/dashboard/PendingList"
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
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  สถิติวิชาชีพบุคลากร
                </h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px 0' }}>
                {/* Donut chart */}
                <div style={{ position: 'relative', width: 180 }}>
                  <svg viewBox="0 0 36 36" style={{ display: 'block', maxWidth: '100%' }}>
                    <path
                      fill="none"
                      stroke="#eee"
                      strokeWidth="3.8"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      fill="none"
                      stroke="#4A5644"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      strokeDasharray="50, 100"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                    />
                    <path
                      fill="none"
                      stroke="#C5A073"
                      strokeWidth="3.8"
                      strokeLinecap="round"
                      strokeDasharray="10, 100"
                      strokeDashoffset="-50"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                    />
                  </svg>

                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 24,
                      fontWeight: 700
                    }}
                  >
                    100%
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { color: '#4A5644', label: 'พยาบาล', pct: '50%' },
                    { color: '#C5A073', label: 'แพทย์', pct: '10%' },
                    { color: '#ddd', label: 'อื่นๆ', pct: '40%' }
                  ].map(l => (
                    <div
                      key={l.label}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#555' }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: l.color,
                          display: 'inline-block'
                        }}
                      />
                      {l.label} <strong>{l.pct}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            <div className="glass-card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, margin: '0 0 20px', fontWeight: 700 }}>
                📌 รายการรออนุมัติ
              </h3>

              {[
                { icon: '📄', label: 'คำขอย้ายแผนก', count: '3 รายการใหม่', href: '/transfer' },
                { icon: '🏖️', label: 'ใบลาพักร้อน', count: '1 รายการใหม่', href: '/leave' }
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    background: '#F9FBFA',
                    padding: 14,
                    borderRadius: 18,
                    marginBottom: 12,
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>

                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{item.label}</p>
                    <span style={{ fontSize: 12, color: '#888' }}>{item.count}</span>
                  </div>

                  <button
                    style={{
                      background: 'white',
                      border: 'none',
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      cursor: 'pointer'
                    }}
                  >
                    →
                  </button>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

