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
    if (user && !isAdmin) { router.push('/dashboard'); }
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

  // --- ชุดสีใหม่: Vivid & Sharp (เน้น Contrast สูงเพื่อความอ่านง่าย) ---
  const getActionStyle = (detail: string) => {
    const d = detail.toLowerCase();
    if (d.includes('สร้าง') || d.includes('เพิ่ม') || d.includes('create'))
      return { bg: '#DCFCE7', text: '#166534', dot: '#7eca9aff', label: 'CREATE' }; // เขียวเข้มบนเขียวอ่อน
    if (d.includes('แก้ไข') || d.includes('อัปเดต') || d.includes('update'))
      return { bg: '#FEF3C7', text: '#92400E', dot: '#f0ce93ff', label: 'UPDATE' }; // ส้มเข้มบนส้มอ่อน
    if (d.includes('ลบ') || d.includes('delete'))
      return { bg: '#FFE4E6', text: '#9F1239', dot: '#f1a9b5ff', label: 'DELETE' }; // แดงเข้มบนแดงอ่อน
    if (d.includes('เข้าสู่ระบบ') || d.includes('login'))
      return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'LOGIN' };  // น้ำเงินเข้มบนฟ้าอ่อน
    return { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'SYSTEM' };    // เทาเข้ม
  };

  if (user && !isAdmin) return null;

  return (
    <AppLayout>
      <div className="audit-wrapper">
        <header className="audit-header">
          <div>
            <h1>System Audit Logs</h1>
            <p>บันทึกประวัติการใช้งานและกิจกรรมทั้งหมดในระบบ</p>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="ค้นหา Operator หรือ กิจกรรม..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="table-container">
          <table className="audit-table">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>OPERATOR</th>
                <th>ACTIVITY DETAIL</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="status-msg">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan={3} className="status-msg">ไม่พบข้อมูลที่ค้นหา</td></tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const date = new Date(log.action_date);
                  const style = getActionStyle(log.action_detail);

                  return (
                    <tr key={log.log_id || idx} className="row-item">
                      <td className="time-col">
                        <div className="main-time">{date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="sub-date">{date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                      </td>

                      <td className="user-col">
                        <div className="user-pill">
                          <div className="avatar-initial" style={{ backgroundColor: style.dot }}>
                            {log.user_id?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <span>{log.user_id || 'System'}</span>
                        </div>
                      </td>

                      <td className="action-col">
                        <div className="action-flex">
                          <span className="vivid-badge" style={{ backgroundColor: style.bg, color: style.text }}>
                            <span className="vivid-dot" style={{ backgroundColor: style.dot }}></span>
                            {style.label}
                          </span>
                          <span className="detail-text">{log.action_detail}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .audit-wrapper {
          padding: 40px;
          background-color: #c1d6ebff; /* พื้นหลังเทาจางๆ เพื่อให้ Card สีขาวเด่น */
          min-height: 400vh;
          font-family: 'Inter', sans-serif;
        }

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 30px;
        }

        .audit-header h1 { font-size: 28px; font-weight: 800; color: #1E293B; margin: 0; }
        .audit-header p { color: #64748B; margin: 5px 0 0 0; font-size: 14px; }

        .search-box input {
          padding: 12px 20px;
          width: 300px;
          border-radius: 12px;
          border: 2px solid #E2E8F0;
          outline: none;
          transition: all 0.2s;
          font-size: 14px;
        }

        .search-box input:focus { border-color: #6366F1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }

        .table-container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.03);
          border: 1px solid #EDF2F7;
          overflow: hidden;
        }

        .audit-table { width: 100%; border-collapse: collapse; }
        
        .audit-table th {
          background: #F8FAFC;
          padding: 16px 24px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #94A3B8;
          letter-spacing: 1px;
          border-bottom: 1px solid #EDF2F7;
        }

        .row-item { border-bottom: 1px solid #F1F5F9; transition: background 0.2s; }
        .row-item:hover { background-color: #FDFDFF; }

        .time-col { padding: 18px 24px; width: 150px; }
        .main-time { font-weight: 700; color: #1E293B; font-size: 15px; }
        .sub-date { font-size: 12px; color: #94A3B8; }

        .user-col { padding: 18px 24px; }
        .user-pill { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #334155; font-size: 14px; }
        .avatar-initial {
          width: 32px; height: 32px; border-radius: 10px;
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
        }

        .action-col { padding: 18px 24px; }
        .action-flex { display: flex; align-items: center; gap: 15px; }

        .vivid-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 800;
        }
        .vivid-dot { width: 6px; height: 6px; border-radius: 50%; }
        .detail-text { color: #475569; font-size: 14px; font-weight: 500; }

        .status-msg { padding: 60px; text-align: center; color: #CBD5E0; font-weight: 500; }
      `}</style>
    </AppLayout>
  );
}