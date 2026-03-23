'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface AuditLog {
  log_id: number;
  user_id: string;
  action_detail: string;
  action_date: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header" style={{ marginBottom: 24, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 24, margin: 0, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#eff6ff', color: '#3b82f6', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              ประวัติการใช้งานระบบ
            </h1>
            <p className="page-subtitle" style={{ color: '#64748b', margin: '4px 0 0 54px' }}>ตรวจสอบและบันทึกประวัติการเปลี่ยนแปลงข้อมูลในระบบ (Audit Logs)</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
          <div className="filter-bar" style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>รายการบันทึกล่าสุด</span>
            <div className="search-input-wrap" style={{ position: 'relative', width: '350px', maxWidth: '100%' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="ค้นหาชื่อผู้ใช้ หรือ การกระทำที่ต้องการ..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none', transition: 'border 0.2s', fontSize: 14 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
                />
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }} className="custom-scroll">
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '25%' }}>เวลาที่บันทึก</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: '20%' }}>ผู้ดำเนินการ</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: 13, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>รายละเอียดรายการอัปเดต</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
                      <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#cbd5e1" style={{ margin: '0 auto 16px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      <div style={{ fontSize: 16, fontWeight: 500, color: '#64748b' }}>ไม่พบประวัติการใช้งาน</div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const d = new Date(log.action_date);
                    return (
                      <tr key={log.log_id || idx} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '10px', color: '#64748b' }}>
                              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                              <div style={{ color: '#0f172a', fontWeight: 700, fontSize: 14 }}>{d.toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })}</div>
                              <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: log.user_id ? '#eff6ff' : '#fef2f2', 
                            color: log.user_id ? '#2563eb' : '#dc2626',
                            padding: '6px 12px', borderRadius: '20px', fontSize: 13, fontWeight: 600
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: log.user_id ? '#3b82f6' : '#ef4444' }}></span>
                            {log.user_id || 'ระบบอัตโนมัติ'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px', color: '#334155', fontSize: 14, fontWeight: 500, lineHeight: 1.6, borderBottom: '1px solid #f1f5f9' }}>
                          {log.action_detail}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
