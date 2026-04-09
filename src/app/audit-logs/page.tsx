'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ClipboardList, 
  Search, 
  Download, 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock,
  LayoutDashboard,
  ShieldCheck,
  History
} from 'lucide-react';

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

  // --- ระบบแบ่งหน้า (Pagination) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

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
      return { bg: 'rgba(22, 163, 74, 0.1)', text: '#16a34a', dot: '#16a34a', label: 'CREATE' };
    if (d.includes('แก้ไข') || d.includes('อัปเดต') || d.includes('update'))
      return { bg: 'rgba(202, 138, 4, 0.1)', text: '#ca8a04', dot: '#ca8a04', label: 'UPDATE' };
    if (d.includes('ลบ') || d.includes('delete'))
      return { bg: 'rgba(220, 38, 38, 0.1)', text: '#dc2626', dot: '#dc2626', label: 'DELETE' };
    if (d.includes('เข้าสู่ระบบ') || d.includes('login'))
      return { bg: 'rgba(37, 99, 235, 0.1)', text: '#2563eb', dot: '#2563eb', label: 'LOGIN' };
    return { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b', dot: '#64748b', label: 'SYSTEM' };
  };

  if (user && !isAdmin) return null;

  return (
    <AppLayout>
      <div className="audit-container">
        {/* HEADER SECTION */}
        <div className="audit-page-header">
          <div className="header-left">
            <button onClick={() => router.back()} className="back-btn-modern">
              <ArrowLeft size={18} />
              <span>ย้อนกลับ</span>
            </button>
            <div className="title-group">
              <div className="icon-badge">
                <History size={24} />
              </div>
              <div>
                <h1>System <span className="text-primary">Audit Logs</span></h1>
                <p>บันทึกประวัติกิจกรรมและระบบการตรวจสอบความปลอดภัย</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <button onClick={handleExport} className="export-btn-premium">
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            <div className="search-wrapper-modern">
              <Search className="search-icon-fixed" size={18} />
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
        </div>

        {/* MAIN DATA SECTION */}
        <div className="data-card-premium">
          <div className="card-header-stats">
            <div className="stat-pill">
              <ShieldCheck size={14} className="text-blue-500" />
              <span>ความปลอดภัยสูงสุด</span>
            </div>
            <div className="data-count">
              พบทั้งหมด <strong>{filteredLogs.length}</strong> รายการ
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="audit-table-modern">
              <thead>
                <tr>
                  <th><div className="th-flex"><Clock size={12} /> TIMESTAMP</div></th>
                  <th><div className="th-flex"><User size={12} /> OPERATOR</div></th>
                  <th><div className="th-flex"><ClipboardList size={12} /> ACTIVITY DETAIL</div></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="loading-state">
                        <div className="spinner-modern"></div>
                        <p>กำลังเตรียมข้อมูลประวัติ...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3}>
                      <div className="empty-state-modern">
                        <History size={48} className="opacity-20" />
                        <p>ไม่พบข้อมูลประวัติในระบบ</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log, idx) => {
                    const date = new Date(log.action_date);
                    const style = getActionStyle(log.action_detail);
                    const displayName = formatUserName(log.user_id);

                    return (
                      <tr key={log.log_id || idx} className="audit-row">
                        <td className="time-td">
                          <div className="timestamp-wrapper">
                            <span className="time-text">{date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="date-text">{date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                          </div>
                        </td>

                        <td className="user-td">
                          <div className="user-profile-sm">
                            <div className="avatar-shimmer" style={{ background: `linear-gradient(135deg, ${style.dot}, ${style.dot}aa)` }}>
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="name-bold">{displayName}</span>
                          </div>
                        </td>

                        <td className="action-td">
                          <div className="action-pill-wrapper">
                            <span className="status-badge-modern" style={{ backgroundColor: style.bg, color: style.text }}>
                              <span className="status-dot-pulse" style={{ backgroundColor: style.dot }}></span>
                              {style.label}
                            </span>
                            <span className="detail-msg">{log.action_detail}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION SECTION */}
          {!loading && totalPages > 1 && (
            <div className="pagination-premium">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="pag-btn"
              >
                <ArrowLeft size={16} />
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage;
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="pag-btn"
              >
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
              
              <div className="page-count-text">
                หน้า {currentPage} / {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .audit-container {
          padding: 40px;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
          font-family: 'Inter', 'Sarabun', sans-serif;
        }

        /* HEADER STYLES */
        .audit-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          gap: 24px;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .back-btn-modern {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 12px;
          color: #64748b;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          width: fit-content;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .back-btn-modern:hover {
          color: #6366f1;
          border-color: #6366f1;
          transform: translateX(-4px);
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1);
        }

        .title-group {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .icon-badge {
          width: 56px;
          height: 56px;
          background: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.2);
        }

        .title-group h1 {
          font-size: 32px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .text-primary { color: #6366f1; }

        .title-group p {
          color: #64748b;
          margin: 4px 0 0;
          font-size: 15px;
          font-weight: 500;
        }

        .header-right {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .export-btn-premium {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #0f172a;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .export-btn-premium:hover {
          background: #1e293b;
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .search-wrapper-modern {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon-fixed {
          position: absolute;
          left: 16px;
          color: #94a3b8;
          pointer-events: none;
        }

        .search-wrapper-modern input {
          padding: 12px 16px 12px 48px;
          width: 320px;
          border-radius: 14px;
          border: 2px solid white;
          background: white;
          outline: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .search-wrapper-modern input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
          width: 380px;
        }

        /* DATA CARD STYLES */
        .data-card-premium {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: all 0.3s;
        }

        .card-header-stats {
          padding: 24px 32px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.03);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #eff6ff;
          color: #1e40af;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .data-count {
          font-size: 14px;
          color: #64748b;
        }

        .data-count strong {
          color: #0f172a;
          font-size: 16px;
        }

        .table-responsive-wrapper {
          overflow-x: auto;
        }

        .audit-table-modern {
          width: 100%;
          border-collapse: collapse;
        }

        .audit-table-modern th {
          padding: 20px 32px;
          text-align: left;
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          background: rgba(248, 250, 252, 0.5);
        }

        .th-flex {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .audit-row {
          border-bottom: 1px solid rgba(0, 0, 0, 0.02);
          transition: all 0.2s;
        }

        .audit-row:hover {
          background: rgba(248, 250, 252, 0.8);
        }

        /* COLUMN STYLES */
        .time-td { padding: 20px 32px; min-width: 160px; }
        .timestamp-wrapper { display: flex; flex-direction: column; }
        .time-text { font-size: 16px; font-weight: 800; color: #1e293b; }
        .date-text { font-size: 13px; color: #94a3b8; font-weight: 500; }

        .user-td { padding: 20px 32px; }
        .user-profile-sm { display: flex; align-items: center; gap: 12px; }
        .avatar-shimmer {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .name-bold { font-size: 15px; font-weight: 700; color: #334155; }

        .action-td { padding: 20px 32px; }
        .action-pill-wrapper { display: flex; align-items: center; gap: 16px; }

        .status-badge-modern {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .status-dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
        }

        .status-dot-pulse::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: inherit;
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(2.5); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }

        .detail-msg {
          font-size: 15px;
          font-weight: 500;
          color: #475569;
          line-height: 1.5;
        }

        /* PAGINATION STYLES */
        .pagination-premium {
          padding: 24px 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.03);
          position: relative;
        }

        .pag-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          color: #64748b;
        }

        .pag-btn:hover:not(:disabled) {
          border-color: #6366f1;
          color: #6366f1;
          transform: translateY(-2px);
        }

        .pag-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-numbers {
          display: flex;
          gap: 8px;
        }

        .page-num-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }

        .page-num-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .page-num-btn.active {
          background: #6366f1;
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .page-count-text {
          position: absolute;
          right: 32px;
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
        }

        /* STATES */
        .loading-state, .empty-state-modern {
          padding: 80px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .spinner-modern {
          width: 40px;
          height: 40px;
          border: 4px solid #f1f5f9;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-state p, .empty-state-modern p {
          font-size: 16px;
          font-weight: 600;
          color: #94a3b8;
        }

        @media (max-width: 1024px) {
          .audit-page-header { flex-direction: column; align-items: flex-start; }
          .header-right { width: 100%; flex-direction: column; align-items: stretch; }
          .search-wrapper-modern input { width: 100%; }
          .search-wrapper-modern input:focus { width: 100%; }
          .page-count-text { position: static; margin-top: 16px; }
          .pagination-premium { flex-wrap: wrap; }
        }
      `}</style>
    </AppLayout>
  );
}