'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isAdmin = ['Admin', 'HR', 'หัวหน้า'].includes(role);
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // --- ระบบแบ่งหน้า (Pagination) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [user, isSuperAdmin, router]);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((r) => r.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ฟิลเตอร์ข้อมูล
  const filteredLogs = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();
    if (!searchTerm) return logs;
    return logs.filter((l) =>
      l.action_detail?.toLowerCase().trim().startsWith(searchTerm) ||
      l.user_id?.toLowerCase().trim().startsWith(searchTerm)
    );
  }, [logs, search]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- ฟังก์ชันดึงชื่อแบบไม่ซ้ำ (Helper Function) ---
  const formatUserName = (userId: string) => {
    if (!userId) return 'System';
    // ถ้ามีคอมม่า ให้เอาแค่คำแรก และตัดช่องว่างทิ้ง
    return userId.split(',')[0].trim();
  };

  // --- ฟังก์ชัน Export ข้อมูลเป็น CSV ---
  const handleExport = () => {
    const BOM = '\uFEFF';
    const header = ['ID', 'Date', 'Time', 'Operator', 'Action'].join(',');
    const rows = filteredLogs.map(log => {
      const d = new Date(log.action_date);
      return [
        log.log_id,
        d.toLocaleDateString('th-TH'),
        d.toLocaleTimeString('th-TH'),
        `"${formatUserName(log.user_id)}"`, // แก้ไขชื่อใน CSV
        `"${log.action_detail}"`
      ].join(',');
    });

    const csvContent = BOM + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().getTime()}.csv`);
    link.click();
  };

  const getActionStyle = (detail: string) => {
    const d = detail.toLowerCase();
    if (d.includes('สร้าง') || d.includes('เพิ่ม') || d.includes('create'))
      return { bg: '#DCFCE7', text: '#166534', dot: '#7eca9aff', label: 'CREATE' };
    if (d.includes('แก้ไข') || d.includes('อัปเดต') || d.includes('update'))
      return { bg: '#FEF3C7', text: '#92400E', dot: '#f0ce93ff', label: 'UPDATE' };
    if (d.includes('ลบ') || d.includes('delete'))
      return { bg: '#FFE4E6', text: '#9F1239', dot: '#f1a9b5ff', label: 'DELETE' };
    if (d.includes('เข้าสู่ระบบ') || d.includes('login'))
      return { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6', label: 'LOGIN' };
    return { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', label: 'SYSTEM' };
  };

  if (user && !isAdmin) return null;

  return (
    <AppLayout>
      <div className="audit-wrapper">
        <header className="audit-header">
          <div>
            <h1>System Audit Logs</h1>
            <p>บันทึกประวัติกิจกรรม และระบบการแบ่งหน้า</p>
          </div>

          <div className="tool-box">
            <button onClick={handleExport} className="export-btn">
              📥 Export CSV
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้หรือรายละเอียด..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
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
              ) : currentLogs.length === 0 ? (
                <tr><td colSpan={3} className="status-msg">ไม่พบข้อมูล</td></tr>
              ) : (
                currentLogs.map((log, idx) => {
                  const date = new Date(log.action_date);
                  const style = getActionStyle(log.action_detail);
                  const displayName = formatUserName(log.user_id); // เรียกใช้ฟังก์ชันที่แก้แล้ว

                  return (
                    <tr key={log.log_id || idx} className="row-item">
                      <td className="time-col">
                        <div className="main-time">{date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="sub-date">{date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                      </td>

                      <td className="user-col">
                        <div className="user-pill">
                          <div className="avatar-initial" style={{ backgroundColor: style.dot }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="user-name">{displayName}</span>
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

          {!loading && totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                ก่อนหน้า
              </button>
              <span className="page-info">หน้า {currentPage} จาก {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                ถัดไป
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .audit-wrapper { padding: 40px; background-color: #f8fafc; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .audit-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
        .audit-header h1 { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0; }
        .audit-header p { color: #64748b; margin: 5px 0 0 0; font-size: 14px; }
        
        .tool-box { display: flex; gap: 12px; align-items: center; }
        .export-btn {
          background: #0f172a; color: white; border: none; padding: 10px 16px;
          border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s;
        }
        .export-btn:hover { background: #334155; transform: translateY(-1px); }

        .search-box input {
          padding: 12px 20px; width: 280px; border-radius: 12px;
          border: 2px solid #e2e8f0; outline: none; transition: all 0.2s; font-size: 14px;
        }
        .search-box input:focus { border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); }
        
        .table-container { background: white; border-radius: 20px; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05); border: 1px solid #edf2f7; overflow: hidden; }
        .audit-table { width: 100%; border-collapse: collapse; }
        .audit-table th {
          background: #f8fafc; padding: 16px 24px; text-align: left; font-size: 11px;
          font-weight: 700; color: #94a3b8; letter-spacing: 1px; border-bottom: 1px solid #edf2f7;
        }
        .row-item { border-bottom: 1px solid #f1f5f9; transition: background 0.2s; }
        .row-item:hover { background-color: #f8fafc; }
        
        .time-col { padding: 18px 24px; width: 150px; }
        .main-time { font-weight: 700; color: #1e293b; font-size: 15px; }
        .sub-date { font-size: 12px; color: #94a3b8; }
        
        .user-col { padding: 18px 24px; }
        .user-pill { display: flex; align-items: center; gap: 10px; }
        .user-name { font-weight: 600; color: #334155; font-size: 14px; }
        .avatar-initial {
          width: 32px; height: 32px; border-radius: 10px; color: white;
          display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;
        }

        .pagination { padding: 20px; display: flex; justify-content: center; align-items: center; gap: 15px; border-top: 1px solid #f1f5f9; }
        .pagination button {
          padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: white;
          font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s;
        }
        .pagination button:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e0; }
        .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
        .page-info { font-size: 13px; color: #64748b; font-weight: 500; }

        .action-col { padding: 18px 24px; }
        .action-flex { display: flex; align-items: center; gap: 15px; }
        .vivid-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; }
        .vivid-dot { width: 6px; height: 6px; border-radius: 50%; }
        .detail-text { color: #4d5766ff; font-size: 14px; font-weight: 500; }
        .status-msg { padding: 60px; text-align: center; color: #cbd5e0; font-weight: 500; }
      `}</style>
    </AppLayout>
    //
  );
}