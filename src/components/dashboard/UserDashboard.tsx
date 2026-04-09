import React, { useState } from 'react';
import Link from 'next/link';

interface UserDashboardProps {
  user: any;
  leaveStats: {
    vacation: { remain: number, used: number, raw: number };
    personal: { remain: number, used: number, raw: number };
    sick: { remain: number, used: number, raw: number };
  };
  payrollData?: {
    currentNetSalary: number;
    paymentDate: string;
    history: any[];
  };
  recentLeaves: any[];
  newsList: any[];
  onSelectNews: (news: any) => void;
  today: string;
}

export default function UserDashboard({
  user,
  leaveStats,
  payrollData = { currentNetSalary: 0, paymentDate: '-', history: [] },
  recentLeaves,
  newsList,
  onSelectNews,
  today
}: UserDashboardProps) {
  const [showSalary, setShowSalary] = useState(false);

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24)) + 1;
  };

  const formatMoney = (amount: number) => {
    return showSalary
      ? `฿${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      : '฿ ••••••';
  };

  return (
    <div style={{ padding: '0px 24px 40px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', 'Sarabun', sans-serif" }}>

      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>
            สวัสดีครับ, {user?.name || 'คุณพนักงาน'}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#94a3b8', fontWeight: 500 }}>
            ข้อมูลอัปเดตประจำวันที่ {today} | สถานะพนักงาน: <span style={{ color: '#10b981' }}>Active</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowSalary(!showSalary)}
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '12px', color: 'white', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {showSalary ? '🙈 ซ่อนตัวเลข' : '👁️ ดูยอดเงิน'}
          </button>
          <Link href="/leave" style={{ background: '#3b82f6', padding: '12px 28px', borderRadius: '12px', color: 'white', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            ยื่นใบลา
          </Link>
        </div>
      </div>

      {/* Financial & Leave Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>

        {/* Money Card (Income) */}
        <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', borderRadius: 24, padding: 28, color: 'white', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.8, marginBottom: 4 }}>รายได้สุทธิเดือนปัจจุบัน</div>
              <h2 style={{ fontSize: 38, fontWeight: 800, margin: 0 }}>{formatMoney(payrollData.currentNetSalary)}</h2>
            </div>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div style={{ marginTop: 24, fontSize: 14, background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span>โอนเข้าบัญชีวันที่</span>
            <span style={{ fontWeight: 700 }}>{payrollData.paymentDate}</span>
          </div>
        </div>

        {/* Leave Summary (Condensed) */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 28, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#64748b', marginBottom: 16 }}>สิทธิ์วันลาคงเหลือ</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{leaveStats.vacation.remain}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>พักร้อน</div>
            </div>
            <div style={{ borderLeft: '1px solid #f1f5f9' }}></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{leaveStats.personal.remain}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>ลากิจ</div>
            </div>
            <div style={{ borderLeft: '1px solid #f1f5f9' }}></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{leaveStats.sick.remain}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>ลาป่วย</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>

        {/* Payroll History (New Section) */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>สลิปเงินเดือนย้อนหลัง</h3>
            <Link href="/payroll" style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>ทั้งหมด</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {payrollData.history.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{item.month}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>จ่ายเมื่อ: {item.date}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{formatMoney(item.amount)}</div>
                </div>
                <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                  <svg width="18" height="18" fill="none" stroke="#64748b" strokeWidth="2"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Leaves Block */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>ประวัติการลาล่าสุด</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentLeaves.slice(0, 3).map((l, i) => {
              const days = calculateDays(l.start_date, l.end_date);
              let statusColor = l.status === 'Approved' ? '#10b981' : '#f59e0b';
              return (
                <div key={i} style={{ padding: '16px', borderRadius: 16, border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{l.leave_type_name || 'ลางาน'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{l.start_date} • {days} วัน</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: statusColor, background: statusColor + '10', padding: '4px 10px', borderRadius: '6px' }}>
                    {l.status === 'Approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* News Section */}
        <div style={{ gridColumn: '1 / -1', background: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 800 }}>ประกาศภายใน</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {newsList.slice(0, 3).map((news, i) => (
              <div key={i} onClick={() => onSelectNews(news)} style={{ cursor: 'pointer', background: '#f8fafc', borderRadius: 16, overflow: 'hidden' }}>
                {news.image && <div style={{ height: 120, backgroundImage: `url(${news.image})`, backgroundSize: 'cover' }} />}
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{news.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{news.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}