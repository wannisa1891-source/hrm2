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
  History,
  Activity,
  LogIn,
  AlertCircle
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
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-['Inter',_-apple-system,_'Sarabun',_sans-serif]">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div className="space-y-4">
            <button 
              onClick={() => router.back()} 
              className="group flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-slate-500 font-semibold text-sm border border-slate-200 shadow-sm hover:border-indigo-400 hover:text-indigo-600 transition-all duration-300"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>ย้อนกลับ</span>
            </button>
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
                <History size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  System <span className="text-indigo-600">Audit Logs</span>
                </h1>
                <p className="text-slate-500 font-medium mt-1">ประวัติกิจกรรมและการตรวจสอบความปลอดภัยของระบบ</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExport} 
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 hover:-translate-y-0.5 transition-all shadow-lg active:scale-95"
            >
              <Download size={18} />
              <span>Export CSV</span>
            </button>
            <div className="relative flex items-center group">
              <Search className="absolute left-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ค้นหาชื่อผู้ใช้หรือรายละเอียด..."
                className="pl-12 pr-4 py-3 w-full sm:w-[320px] lg:w-[400px] bg-white border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none shadow-sm transition-all text-sm font-medium"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'กิจกรรมทั้งหมด', value: logs.length, icon: Activity, color: 'indigo' },
            { label: 'เข้าสู่ระบบ (LOGIN)', value: logs.filter(l => l.action_detail.includes('เข้าสู่ระบบ')).length, icon: LogIn, color: 'blue' },
            { label: 'การเปลี่ยนแปลงข้อมูล', value: logs.filter(l => ['สร้าง', 'แก้ไข', 'ลบ', 'อัปเดต'].some(w => l.action_detail.includes(w))).length, icon: ClipboardList, color: 'emerald' },
            { label: 'ระบบ / อื่นๆ', value: logs.length - logs.filter(l => ['เข้าสู่ระบบ', 'สร้าง', 'แก้ไข', 'ลบ', 'อัปเดต'].some(w => l.action_detail.includes(w))).length, icon: AlertCircle, color: 'slate' },
          ].map((card, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-white shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${card.color}-50 text-${card.color}-600`}>
                <card.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                <h3 className="text-2xl font-black text-slate-800 tabular-nums">{card.value.toLocaleString()}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* DATA TABLE SECTION */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-2xl shadow-slate-200/50 overflow-hidden ring-1 ring-slate-200/10">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>ความปลอดภัยสูงสุด</span>
            </div>
            <div className="text-slate-500 font-semibold text-sm">
              พบข้อมูลทั้งหมด <span className="text-slate-900 font-bold">{filteredLogs.length}</span> รายการ
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><Clock size={12} /> Timestamp</div></th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><User size={12} /> Operator</div></th>
                  <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]"><div className="flex items-center gap-2"><ClipboardList size={12} /> Activity Detail</div></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="py-24">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="font-bold text-slate-400">กำลังเตรียมข้อมูลระบบ...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-24">
                      <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                        <History size={64} />
                        <p className="font-bold text-lg text-slate-900">ไม่พบประวัติในระบบ</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log, idx) => {
                    const date = new Date(log.action_date);
                    const style = getActionStyle(log.action_detail);
                    const displayName = formatUserName(log.user_id);

                    return (
                      <tr key={log.log_id || idx} className="group hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-slate-800 tabular-nums">
                              {date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                            </span>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm ring-2 ring-white"
                              style={{ background: `linear-gradient(135deg, ${style.dot}, ${style.dot}aa)` }}
                            >
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700">{displayName}</span>
                          </div>
                        </td>

                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <span 
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all"
                              style={{ backgroundColor: style.bg, color: style.text }}
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: style.dot }}></span>
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: style.dot }}></span>
                              </span>
                              {style.label}
                            </span>
                            <span className="text-sm font-medium text-slate-600 leading-relaxed max-w-2xl truncate lg:whitespace-normal">
                              {log.action_detail}
                            </span>
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
            <div className="px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                หน้า {currentPage} จาก {totalPages}
              </div>
              
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-slate-400 shadow-sm border border-slate-200 disabled:opacity-50 disabled:shadow-none hover:text-indigo-600 transition-all font-bold group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                
                <div className="flex items-center gap-1 px-2">
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
                          className={`min-w-[40px] h-10 px-3 rounded-xl font-bold text-sm transition-all ${
                            currentPage === pageNum 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-50' 
                            : 'text-slate-500 hover:bg-white hover:text-slate-900'
                          }`}
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-slate-400 shadow-sm border border-slate-200 disabled:opacity-50 disabled:shadow-none hover:text-indigo-600 transition-all font-bold group"
                >
                  <ArrowLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              
              <div className="sm:hidden text-xs font-bold text-slate-400">
                {currentPage} / {totalPages}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}