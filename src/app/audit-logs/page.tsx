'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

interface AuditLog {
  log_id: number;
  user_id: string;
  action_detail: string;
  action_date: string;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role || '');
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(r => r.json())
      .then(data => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(l =>
    l.action_detail?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  // ฟังก์ชันช่วยจัดสีตามประเภทกิจกรรม
  const getActionColor = (detail: string) => {
    const d = detail.toLowerCase();
    if (d.includes('สร้าง') || d.includes('เพิ่ม') || d.includes('create') || d.includes('add')) return { bg: '#ECFDF5', text: '#059669', border: '#10B981', label: 'สร้างใหม่' };
    if (d.includes('แก้ไข') || d.includes('อัปเดต') || d.includes('update') || d.includes('edit')) return { bg: '#FFFBEB', text: '#D97706', border: '#F59E0B', label: 'แก้ไข' };
    if (d.includes('ลบ') || d.includes('delete') || d.includes('remove')) return { bg: '#FEF2F2', text: '#DC2626', border: '#EF4444', label: 'ลบข้อมูล' };
    if (d.includes('เข้าสู่ระบบ') || d.includes('login')) return { bg: '#EFF6FF', text: '#2563EB', border: '#3B82F6', label: 'เข้าระบบ' };
    return { bg: '#F8FAFC', text: '#475569', border: '#94a3b8', label: 'ทั่วไป' }; // สีเริ่มต้น
  };

  if (user && !isAdmin) return null;

  return (
    <AppLayout>
      <div style={{
        padding: '32px',
        minHeight: 'calc(100vh - 65px)',
        background: '#f1f5f9' // พื้นหลังสีเทาอ่อนมาก
      }}>
        {/* Header Section พร้อม Gradient พื้นหลัง */}
        <div style={{
          marginBottom: 32,
          padding: '24px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #2563eb 0%, #a855f7 100%)', // Gradient ฟ้า-ม่วง
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2), 0 4px 6px -2px rgba(37, 99, 235, 0.1)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
              <div style={{
                background: 'rgba(255,255,255,0.2)', // กระจกใส
                backdropFilter: 'blur(5px)',
                color: 'white', width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 style={{ fontSize: 28, margin: 0, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                ศูนย์ตรวจสอบประวัติระบบ
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 15, paddingLeft: 62 }}>
              ค้นหาและติดตามทุกความเคลื่อนไหวภายในระบบ (System Audit Trail)
            </p>
          </div>

          {/* ช่องค้นหาแบบ Floating */}
          <div className="search-input-wrap" style={{ position: 'relative', width: '380px' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.8 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="ค้นหาผู้ใช้ หรือ รายละเอียด..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '16px 16px 16px 52px', borderRadius: '18px',
                border: 'none', outline: 'none', transition: 'all 0.3s ease',
                fontSize: 15, background: 'rgba(255,255,255,0.2)', // กระจกใส
                color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)',
              }}
              // กำหนดสี placeholder
              className="search-input-colorful"
            />
          </div>
        </div>

        {/* ตารางแบบการ์ด (Glassmorphism Effect) */}
        <div style={{
          background: 'white',
          borderRadius: '32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f8fafc' }}>เวลากิจกรรม</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f8fafc' }}>ผู้ดำเนินการ</th>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: '#f8fafc' }}>กิจกรรมที่เกิดขึ้น</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '100px', color: '#94a3b8', fontSize: 18, fontWeight: 600 }}>กำลังดึงข้อมูลกิจกรรม...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '100px 24px' }}>
                      <div style={{ color: '#e2e8f0', marginBottom: 20 }}>
                        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ margin: '0 auto' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8', letterSpacing: '-0.01em' }}>ไม่พบประวัติที่คุณกำลังค้นหา</div>
                      <p style={{ color: '#cbd5e1', marginTop: 8 }}>ลองค้นหาด้วยคำอื่นดูนะ</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const d = new Date(log.action_date);
                    const actionInfo = getActionColor(log.action_detail);

                    return (
                      <tr key={log.log_id || idx} style={{
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #f1f5f9'
                      }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} // ไฮไลท์แถวเมื่อ hover
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

                        {/* 1. เวลา - สี Slate */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              background: '#f1f5f9', width: 44, height: 44,
                              borderRadius: '14px', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', color: '#475569'
                            }}>
                              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div style={{ color: '#1e293b', fontWeight: 800, fontSize: 15 }}>
                                {d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })}
                              </div>
                              <div style={{ color: '#64748b', fontSize: 13, marginTop: 2, fontWeight: 500 }}>
                                {d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. ผู้ดำเนินการ - สีน้ำเงิน/ม่วง */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px', borderRadius: '14px', fontSize: 14, fontWeight: 700,
                            background: log.user_id ? 'linear-gradient(135deg, #eff6ff 0%, #fae8ff 100%)' : '#FEF2F2', // Gradient อ่อนๆ
                            color: log.user_id ? '#7e22ce' : '#e11d48',
                            boxShadow: log.user_id ? '0 2px 4px rgba(126, 34, 206, 0.05)' : 'none',
                          }}>
                            {/* Avatar วงกลมสุ่มสี */}
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: log.user_id ? `hsl(${(log.user_id.length * 40) % 360}, 70%, 60%)` : '#ef4444', // สีตามชื่อ
                              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, textTransform: 'uppercase', fontWeight: 800
                            }}>
                              {log.user_id ? log.user_id.substring(0, 2) : 'S'}
                            </div>
                            {log.user_id || 'System'}
                          </div>
                        </td>

                        {/* 3. รายละเอียด - มี Badge สีตามประเภท */}
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: 12, flexDirection: 'column' }}>
                            {/* Badge ประเภทกิจกรรม */}
                            <span style={{
                              background: actionInfo.bg,
                              color: actionInfo.text,
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: 11,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              border: `1px solid ${actionInfo.border}30` // สีขอบโปร่งแสง 30%
                            }}>
                              {actionInfo.label}
                            </span>

                            {/* ตัวหนังสือรายละเอียด */}
                            <div style={{
                              color: '#334155', fontSize: 14, lineHeight: 1.6,
                              fontWeight: 500, maxWidth: '650px'
                            }}>
                              {log.action_detail}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info พร้อมสไตล์ที่เข้ากัน */}
          {!loading && filteredLogs.length > 0 && (
            <div style={{ padding: '18px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', color: '#64748b', fontSize: 13, fontWeight: 600, textAlign: 'right', letterSpacing: '0.02em' }}>
              ทั้งหมด <span style={{ color: '#2563eb', fontSize: 15, fontWeight: 800 }}>{filteredLogs.length}</span> กิจกรรมล่าสุด
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* CSS สำหรับช่องค้นหาให้ Placeholder เป็นสีขาวโปร่งแสง */
        .search-input-colorful::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1;
        }
        
        /* CSS สำหรับ Scrollbar */
        .custom-scroll::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #a855f7; /* สีม่วง */
          border-radius: 5px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #7e22ce;
        }
      `}</style>
    </AppLayout>
  );
}