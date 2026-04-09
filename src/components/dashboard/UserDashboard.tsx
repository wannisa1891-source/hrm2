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
  licenseStats?: { expiring: number, expired: number };
}

export default function UserDashboard({
  user,
  leaveStats,
  recentLeaves,
  newsList,
  onSelectNews,
  today,
  licenseStats = { expiring: 0, expired: 0 }
}: UserDashboardProps) {

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24)) + 1;
  };

  return (
    <div style={{ padding: '0px 24px 40px', maxWidth: '1400px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: '#0f172a',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#1e293b' }}>
            สวัสดีครับ, {user?.name || user?.username || 'User'}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#64748b', fontWeight: 500 }}>
            คุณมีวันลาพักร้อนคงเหลือ <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 18 }}>{leaveStats.vacation.remain} วัน</span> 
          </p>
        </div>
        <Link href="/leave" style={{
          background: '#3b82f6',
          padding: '12px 28px',
          borderRadius: '12px',
          color: 'white',
          fontSize: 15,
          fontWeight: 700,
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'transform 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          ยื่นใบลา
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </Link>
      </div>

<<<<<<< HEAD
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
        {(licenseStats.expiring > 0 || licenseStats.expired > 0) && (
          <div style={{ 
            background: licenseStats.expired > 0 ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
            borderRadius: 24, 
            padding: 28, 
            color: 'white', 
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>การแจ้งเตือนใบประกอบ</div>
               <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
               </div>
            </div>
            <div style={{ marginTop: 12 }}>
               <div style={{ fontSize: 20, fontWeight: 800 }}>
                 {licenseStats.expired > 0 ? 'พบใบประกอบหมดอายุ!' : 'ใบประกอบใกล้หมดอายุ'}
               </div>
               <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
                 {licenseStats.expired > 0 ? `จำนวน ${licenseStats.expired} รายการ` : `ต้องต่ออายุภายใน 90 วัน (${licenseStats.expiring} รายการ)`}
               </div>
            </div>
            <Link href="/license" style={{ 
              marginTop: 20, 
              background: 'white', 
              color: licenseStats.expired > 0 ? '#ef4444' : '#f59e0b', 
              padding: '10px 0', 
              borderRadius: '12px', 
              textAlign: 'center', 
              fontWeight: 800, 
              fontSize: 14, 
              textDecoration: 'none' 
            }}>
              จัดการใบประกอบ
            </Link>
          </div>
        )}
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
=======
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* Left Column (Main Content) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: '1 / -1' }}>
          
          {/* Stats Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            
            {/* Vacation Card */}
            <div style={{ background: '#ffffff', borderRadius: 24, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
>>>>>>> a7fcff3e2cb9b3aa2375803a6a37a277d3dbdb34
                </div>
                <div style={{ fontSize: 16, color: '#475569', fontWeight: 700 }}>วันลาพักร้อน</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <h2 style={{ fontSize: 40, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-1px' }}>{leaveStats.vacation.remain}</h2>
                <span style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>วัน</span>
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>
                  <span>ใช้ไป {leaveStats.vacation.used} วัน</span>
                  <span>รวม {leaveStats.vacation.raw} วัน</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(leaveStats.vacation.used / leaveStats.vacation.raw) * 100}%`, height: '100%', background: '#10b981', borderRadius: 6 }} />
                </div>
              </div>
            </div>

            {/* Personal Card */}
            <div style={{ background: '#ffffff', borderRadius: 24, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div style={{ fontSize: 16, color: '#475569', fontWeight: 700 }}>วันลากิจ</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <h2 style={{ fontSize: 40, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-1px' }}>{leaveStats.personal.remain}</h2>
                <span style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>วัน</span>
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>
                  <span>ใช้ไป {leaveStats.personal.used} วัน</span>
                  <span>รวม {leaveStats.personal.raw} วัน</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(leaveStats.personal.used / leaveStats.personal.raw) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: 6 }} />
                </div>
              </div>
            </div>

            {/* Sick Card */}
            <div style={{ background: '#ffffff', borderRadius: 24, padding: 28, border: '1px solid #f1f5f9', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <div style={{ fontSize: 16, color: '#475569', fontWeight: 700 }}>วันลาป่วย</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <h2 style={{ fontSize: 40, fontWeight: 800, margin: 0, color: '#0f172a', letterSpacing: '-1px' }}>{leaveStats.sick.remain}</h2>
                <span style={{ fontSize: 15, color: '#64748b', fontWeight: 600 }}>วัน</span>
              </div>
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 10, fontWeight: 600 }}>
                  <span>ใช้ไป {leaveStats.sick.used} วัน</span>
                  <span>รวม {leaveStats.sick.raw} วัน</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(leaveStats.sick.used / leaveStats.sick.raw) * 100}%`, height: '100%', background: '#ef4444', borderRadius: 6 }} />
                </div>
              </div>
            </div>
            
          </div>
          
        </div>

        {/* Bottom Section (2 cols standard Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, gridColumn: '1 / -1' }}>
          
          {/* Recent Leaves Block */}
          <div style={{ background: '#ffffff', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>ประวัติการลาของคุณ</h3>
                  <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 4 }}>รายการล่าสุดที่บันทึกไว้ในระบบ</div>
                </div>
              </div>
              
              <Link href="/leave" style={{ color: '#3b82f6', fontSize: 14, fontWeight: 700, textDecoration: 'none', padding: '8px 16px', background: '#f8fafc', borderRadius: 8 }}>
                ดูทั้งหมด
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentLeaves.length > 0 ? recentLeaves.slice(0, 4).map((l: any, i: number) => {
                const days = calculateDays(l.start_date, l.end_date);
                let typeName = 'อื่นๆ';
                let typeColor = '#3b82f6';
                let typeBg = '#eff6ff';
                if (l.leave_type_id === 'L03') { typeName = 'ลาพักผ่อน'; typeColor = '#10b981'; typeBg = '#ecfdf5'; }
                else if (l.leave_type_id === 'L02') { typeName = 'ลากิจ'; typeColor = '#f59e0b'; typeBg = '#fffbeb'; }
                else if (l.leave_type_id === 'L01') { typeName = 'ลาป่วย'; typeColor = '#ef4444'; typeBg = '#fef2f2'; }

                let statusStr = 'รออนุมัติ';
                let statusColor = '#f59e0b';
                let statusBg = '#fffbeb';
                if (l.status === 'Approved') { statusStr = 'อนุมัติแล้ว'; statusColor = '#10b981'; statusBg = '#ecfdf5'; }
                else if (l.status === 'Rejected') { statusStr = 'ไม่อนุมัติ'; statusColor = '#ef4444'; statusBg = '#fef2f2'; }

                const startDateObj = new Date(l.start_date);
                const startMonth = startDateObj.toLocaleDateString('th-TH', { month: 'short' });
                const startDay = startDateObj.getDate();

                return (
                  <div key={i} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '16px', 
                    borderRadius: 16, 
                    border: '1px solid #f1f5f9',
                    gap: 20
                  }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{startMonth}</div>
                      <div style={{ fontSize: 20, color: '#0f172a', fontWeight: 800 }}>{startDay}</div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: typeColor, background: typeBg, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {typeName}
                        </span>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>รวม {days} วัน</span>
                      </div>
                      <div style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>
                        {l.reason || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>-</span>}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      padding: '8px 12px', 
                      borderRadius: 8, 
                      background: statusBg
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }}></div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>{statusStr}</span>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>ยังไม่มีประวัติการลาในระบบ</div>
                </div>
              )}
            </div>
          </div>

          {/* News Slider Block */}
          <div style={{ background: '#ffffff', borderRadius: 24, padding: '32px 24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingLeft: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                 <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>ข่าวสารองค์กร</h3>
                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginTop: 4 }}>ประกาศล่าสุด</div>
              </div>
            </div>

            <div style={{ flex: 1, position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              {newsList.length > 0 ? (
                <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: 20 }} className="custom-scroll">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {newsList.map((news, i) => (
                      <div key={i} onClick={() => onSelectNews(news)} style={{ 
                        background: '#ffffff', 
                        borderRadius: 16, 
                        overflow: 'hidden', 
                        cursor: 'pointer', 
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        {news.image && (
                          <div style={{ width: '100%', height: 140, backgroundImage: `url(${news.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        )}
                        <div style={{ padding: 20 }}>
                          <h4 style={{ margin: 0, color: '#1e293b', fontSize: 15, fontWeight: 700, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{news.title}</h4>
                          <div style={{ color: '#64748b', fontSize: 13, marginTop: 12, fontWeight: 500 }}>{news.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontWeight: 500 }}>ไม่มีประกาศ</div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
