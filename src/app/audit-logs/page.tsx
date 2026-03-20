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
        <div className="page-header">
          <div>
            <h1 className="page-title">ประวัติการใช้งานระบบ</h1>
            <p className="page-subtitle">บันทึกประวัติการเปลี่ยนแปลงข้อมูลในระบบ (Audit Logs)</p>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="filter-bar" style={{ padding: '24px' }}>
            <div style={{ position: 'relative', width: '350px', maxWidth: '100%' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="ค้นหาชื่อผู้ใช้ หรือ การกระทำ..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
            </div>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }} className="custom-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>เวลาที่บันทึก</th>
                  <th>ผู้ใช้งาน (User ID)</th>
                  <th>รายละเอียดการกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบประวัติการใช้งาน</td></tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.log_id || idx}>
                      <td style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.action_date).toLocaleString('th-TH')}
                      </td>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>
                        <span style={{ background: '#eff6ff', padding: '4px 10px', borderRadius: '6px' }}>{log.user_id || 'System'}</span>
                      </td>
                      <td style={{ color: '#1e293b', fontWeight: 500 }}>
                        {log.action_detail}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
