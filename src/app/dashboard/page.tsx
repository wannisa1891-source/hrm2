/* หน้าจอ Dashboard */
'use client';
import AppLayout from '@/components/AppLayout';
import { useEffect, useState } from 'react';
import Link from 'next/link';
export default function DashboardPage() {
  const [empCount, setEmpCount] = useState(0);
  useEffect(() => {
    fetch('/api/employees')
      .then(r => r.json())
      .then(data => setEmpCount(Array.isArray(data) ? data.length : 0))
      .catch(() => { });
  }, []);

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    calendar: 'buddhist',
  } as Intl.DateTimeFormatOptions);

  return (
    <AppLayout>
      <div className="dashboard-wrapper" style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: "'Sarabun', sans-serif", color: '#1a1a1a', position: 'relative', overflow: 'hidden' }}>
        {/* BG decoration */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(74,86,68,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <span style={{ background: 'white', padding: '4px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#4A5644', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              {today}
            </span>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: '10px 0 4px' }}>
              สวัสดีครับ, <span style={{ color: '#4A5644' }}>Hospital HRM</span>
            </h1>
            <p style={{ color: '#666', margin: 0 }}>มาดูความเคลื่อนไหวของบุคลากรวันนี้กันครับ</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', border: '1px solid white', padding: '10px 18px', borderRadius: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔍</span>
              <input type="text" placeholder="ค้นหาข้อมูล..." style={{ border: 'none', outline: 'none', background: 'transparent', width: 180, fontFamily: 'Sarabun, sans-serif', fontSize: 14 }} />
            </div>
            <div style={{ position: 'relative', width: 45, height: 45 }}>
              <div style={{ width: 45, height: 45, background: '#4A5644', color: 'white', borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>W</div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, background: '#4cd137', border: '2px solid #f0f2f5', borderRadius: '50%' }} />
            </div>
          </div>
        </header>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 30 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <StatCard
                icon="👥" iconBg="#EBF0E9"
                label="บุคลากรทั้งหมด" value={empCount} unit="คน"
                trend="↑ 2%" trendUp href="/employees"
              />
              <StatCard
                icon="📉" iconBg="#FFF0F0"
                label="ลางาน/พักร้อน" value={0} unit="คน"
                trend="วันนี้" href="/leave"
              />
              <StatCard
                icon="📊" iconBg="#FFF9EB"
                label="อัตรากำลังว่าง" value={0} unit="อัตรา"
                trend="คงเหลือ" href="/org-structure"
              />
            </div>
            {/* Chart */}
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>สถิติวิชาชีพบุคลากร</h3>
                <div style={{ display: 'flex', gap: 6, background: '#f0f2f5', padding: 5, borderRadius: 12 }}>
                  <span style={{ padding: '6px 15px', borderRadius: 8, background: 'white', fontSize: 12, fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}>ทั้งหมด</span>
                  <span style={{ padding: '6px 15px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#888' }}>รายแผนก</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px 0' }}>
                {/* Donut chart */}
                <div style={{ position: 'relative', width: 180 }}>
                  <svg viewBox="0 0 36 36" style={{ display: 'block', maxWidth: '100%' }}>
                    <path fill="none" stroke="#eee" strokeWidth="3.8" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path fill="none" stroke="#4A5644" strokeWidth="3.8" strokeLinecap="round" strokeDasharray="50, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" />
                    <path fill="none" stroke="#C5A073" strokeWidth="3.8" strokeLinecap="round" strokeDasharray="10, 100" strokeDashoffset="-50" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 24, fontWeight: 700 }}>100%</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { color: '#4A5644', label: 'พยาบาล', pct: '50%' },
                    { color: '#C5A073', label: 'แพทย์', pct: '10%' },
                    { color: '#ddd', label: 'อื่นๆ', pct: '40%' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#555' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
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
              <h3 style={{ fontSize: 18, margin: '0 0 20px', fontWeight: 700 }}>📌 รายการรออนุมัติ</h3>
              {[
                { icon: '📄', label: 'คำขอย้ายแผนก', count: '3 รายการใหม่', href: '/transfer' },
                { icon: '🏖️', label: 'ใบลาพักร้อน', count: '1 รายการใหม่', href: '/leave' },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F9FBFA', padding: 14, borderRadius: 18, marginBottom: 12, textDecoration: 'none', color: 'inherit' }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{item.label}</p>
                    <span style={{ fontSize: 12, color: '#888' }}>{item.count}</span>
                  </div>
                  <button style={{ background: 'white', border: 'none', width: 34, height: 34, borderRadius: 10, cursor: 'pointer' }}>→</button>
                </Link>
              ))}
            </div>

            <div style={{ background: 'linear-gradient(135deg, #4A5644 0%, #2d3436 100%)', borderRadius: 28, padding: 28, color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>System Alert</span>
                <h4 style={{ fontSize: 20, margin: '14px 0 5px' }}>ใบประกอบวิชาชีพ</h4>
                <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 24 }}>พบข้อมูลใกล้หมดอายุใน 30 วัน</p>
                <Link href="/license">
                  <button style={{ background: '#C5A073', border: 'none', padding: '11px 22px', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', fontFamily: 'Sarabun, sans-serif' }}>
                    ตรวจสอบทันที
                  </button>
                </Link>
              </div>
              <div style={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, opacity: 0.1, transform: 'rotate(-15deg)' }}>🔔</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ icon, iconBg, label, value, unit, trend, trendUp, href }: {
  icon: string; iconBg: string; label: string; value: number; unit: string;
  trend: string; trendUp?: boolean; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="glass-card" style={{ borderRadius: 28, cursor: 'pointer', transition: 'all 0.3s', padding: 24 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLElement).style.background = 'white'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.background = ''; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 50, height: 50, borderRadius: 16, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: trendUp ? '#27ae60' : '#999' }}>{trend}</span>
        </div>
        <div>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</span>
          <h2 style={{ fontSize: 36, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
            {value} <small style={{ fontSize: 16, color: '#bbb', fontWeight: 400 }}>{unit}</small>
          </h2>
        </div>
      </div>
    </Link>
  );
}
