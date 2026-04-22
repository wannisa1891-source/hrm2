import React from 'react';
import Link from 'next/link';

interface UserDashboardProps {
  user: any;
  leaveStats: {
    vacation: { remain: number, used: number, raw: number };
    personal: { remain: number, used: number, raw: number };
    sick: { remain: number, used: number, raw: number };
  };
  recentLeaves: any[];
  newsList: any[];
  onSelectNews: (news: any) => void;
  today: string;
  licenseStats: { expiring: number, expired: number };
  payrollData: {
    currentNetSalary: number;
    paymentDate: string;
    history: any[];
  };
}

export default function UserDashboard({
  user,
  leaveStats,
  recentLeaves,
  newsList,
  onSelectNews,
  today,
  licenseStats,
  payrollData
}: UserDashboardProps) {

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24)) + 1;
  };

  return (
    <div style={{ padding: '0px 24px 40px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', fontFamily: "'Sarabun', sans-serif" }}>

      {/* Welcome Banner */}
      <div style={{ padding: '20px 0' }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
          สวัสดีครับ, {user?.name || user?.username || 'User'}
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#64748b', fontWeight: 500 }}>
          คุณมีวันลาพักร้อนคงเหลือ <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 18 }}>{leaveStats.vacation.remain} วัน</span>
        </p>
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

        {/* License Alert Card (New) */}
        <div style={{
          background: (licenseStats.expired > 0 || licenseStats.expiring > 0) ? (licenseStats.expired > 0 ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)') : '#ffffff',
          borderRadius: 24,
          padding: 28,
          color: (licenseStats.expired > 0 || licenseStats.expiring > 0) ? 'white' : '#64748b',
          boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
          border: (licenseStats.expired > 0 || licenseStats.expiring > 0) ? 'none' : '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>ใบประกอบวิชาชีพ</div>
            <div style={{ width: 32, height: 32, background: (licenseStats.expired > 0 || licenseStats.expiring > 0) ? 'rgba(255,255,255,0.2)' : '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" fill={(licenseStats.expired > 0 || licenseStats.expiring > 0) ? "white" : "#64748b"} viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            {(licenseStats.expired > 0 || licenseStats.expiring > 0) ? (
              <>
                <div style={{ fontSize: 20, fontWeight: 800 }}>
                  {licenseStats.expired > 0 ? 'พบใบอนุญาตหมดอายุ!' : 'ใบอนุญาตใกล้หมดอายุ'}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                  {licenseStats.expired > 0 ? `จำนวน ${licenseStats.expired} รายการ` : `ต้องต่ออายุภายใน 90 วัน (${licenseStats.expiring} รายการ)`}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>ปกติ</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>ข้อมูลใบอนุญาตเป็นปัจจุบัน</div>
              </>
            )}
          </div>
          <Link href="/license" style={{
            marginTop: 20,
            background: (licenseStats.expired > 0 || licenseStats.expiring > 0) ? 'white' : '#f8fafc',
            color: licenseStats.expired > 0 ? '#ef4444' : (licenseStats.expiring > 0 ? '#f59e0b' : '#3b82f6'),
            padding: '10px 0',
            borderRadius: '12px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 14,
            textDecoration: 'none',
            border: (licenseStats.expired > 0 || licenseStats.expiring > 0) ? 'none' : '1px solid #e2e8f0'
          }}>
            จัดการใบอนุญาต
          </Link>
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
            {payrollData.history.length > 0 ? payrollData.history.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{item.month}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{item.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{formatMoney(item.amount)}</div>
                </div>
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>ไม่พบประวัติการจ่ายเงิน</div>
            )}
          </div>
        </div>

        {/* Recent Activity (Leaves) */}
        <div style={{ background: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>รายการลาล่าสุด</h3>
            <Link href="/leave" style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>ทั้งหมด</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentLeaves.length > 0 ? recentLeaves.slice(0, 3).map((l, i) => {
              const statusColor = l.status === 'Approved' ? '#10b981' : l.status === 'Rejected' ? '#ef4444' : '#f59e0b';
              const statusBg = l.status === 'Approved' ? '#ecfdf5' : l.status === 'Rejected' ? '#fef2f2' : '#fffbeb';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{l.reason || 'ลา'}</div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{new Date(l.start_date).toLocaleDateString('th-TH')} - {new Date(l.end_date).toLocaleDateString('th-TH')}</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: '8px', background: statusBg, color: statusColor, fontSize: 12, fontWeight: 800 }}>
                    {l.status === 'Approved' ? 'อนุมัติ' : l.status === 'Rejected' ? 'ปฏิเสธ' : 'รออนุมัติ'}
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>ไม่มีรายการลาล่าลุด</div>
            )}
          </div>
        </div>

      </div>

      {/* News Slider (Simplified for now or restored from team) */}
      <div style={{ background: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: 18, fontWeight: 800 }}>ข่าวสารและประกาศ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {newsList.slice(0, 3).map((news, i) => (
            <div key={i} onClick={() => onSelectNews(news)} style={{ cursor: 'pointer', background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              {news.image && <div style={{ height: 120, backgroundImage: `url(${news.image})`, backgroundSize: 'cover' }} />}
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>{news.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{news.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
