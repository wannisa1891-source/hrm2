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
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0 }}>ประวัติการใช้งานระบบ</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>บันทึกประวัติการเปลี่ยนแปลงข้อมูลในระบบ (Audit Logs)</p>
          </div>
          <input 
            type="text" 
            placeholder="ค้นหาชื่อผู้ใช้ หรือ การกระทำ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', width: '300px', maxWidth: '100%', outline: 'none' }}
          />
        </div>

        <div style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 13, textTransform: 'uppercase' }}>เวลาที่บันทึก</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 13, textTransform: 'uppercase' }}>ผู้ใช้งาน (User ID)</th>
                  <th style={{ padding: '16px 24px', color: '#475569', fontSize: 13, textTransform: 'uppercase' }}>รายละเอียดการกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลดข้อมูล...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบประวัติการใช้งาน</td></tr>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <tr key={log.log_id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', color: '#64748b', fontSize: 14, whiteSpace: 'nowrap' }}>
                        {new Date(log.action_date).toLocaleString('th-TH')}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: '#3b82f6', fontSize: 14 }}>
                        {log.user_id || 'System'}
                      </td>
                      <td style={{ padding: '16px 24px', color: '#1e293b', fontSize: 15 }}>
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
