'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import PayslipTemplate from '@/components/Payroll/PayslipTemplate';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { usePayroll } from '@/hooks/usePayroll';

const CloseIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const CheckIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const TrashIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PrintIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;

export default function PayrollDashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isHR = role === 'HR';
  const isAdmin = isSuperAdmin || isHR;
  const router = useRouter();

  // React Query Hook
  const { data, loading: isLoading, fetchDashboardData } = usePayroll(isAdmin ? undefined : user?.emp_id);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const perPage = 15; // Standardized to 15
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Generate logic
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());

  // Master Data
  const [allowanceTypes, setAllowanceTypes] = useState<any[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<any[]>([]);

  // Drawer
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [addType, setAddType] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addRemark, setAddRemark] = useState('');

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: selectedRecord ? `Payslip_${selectedRecord.emp_id}_${selectedRecord?.pay_month || data?.targetMonth || ''}_${selectedRecord?.pay_year || data?.targetYear || ''}` : 'Payslip',
  });

  const MONTHS_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => { setPage(1); }, [searchQuery, deptFilter, statusFilter]);

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/payroll/master');
      const mst = await res.json();
      setAllowanceTypes(mst.allowances || []);
      setDeductionTypes(mst.deductions || []);
    } catch (e) { console.error(e); }
  };

  const handleGenerate = async () => {
    const result = await Swal.fire({
      title: 'เริ่มต้นรอบเงินเดือน',
      text: `ยืนยันสร้างรอบเงินเดือน ${MONTHS_TH[genMonth - 1]} ${genYear}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#4f46e5'
    });
    if (!result.isConfirmed) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_month: genMonth, pay_year: genYear })
      });
      if (res.ok) {
        setShowGenerateModal(false);
        Swal.fire({ title: 'สร้างสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
        fetchDashboardData();
      } else {
        const errorData = await res.json();
        Swal.fire('ข้อผิดพลาด', errorData.error, 'error');
      }
    } finally { setIsGenerating(false); }
  };

  const handleBulkStatusUpdate = async (fromStatus: string, toStatus: string) => {
    const msg = toStatus === 'Approved' ? 'ยืนยันอนุมัติสลิป?' : 'ยืนยันเปลี่ยนเป็นจ่ายแล้ว?';
    const result = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนสถานะ',
      text: msg,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#10b981'
    });
    if (!result.isConfirmed) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/payroll/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: data?.targetMonth, year: data?.targetYear, fromStatus, toStatus })
      });
      if (res.ok) fetchDashboardData();
    } finally { setIsUpdatingStatus(false); }
  };

  const handleExportCSV = () => {
    if (!filteredEmployees.length) {
      Swal.fire('ข้อความแจ้งเตือน', 'ไม่มีข้อมูลให้ส่งออก', 'warning');
      return;
    }
    const BOM = "\uFEFF";
    let csvContent = BOM + "รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,ฐานเงินเดือน,รายรับ+,รายหัก-,ยอดโอนสุทธิ,สถานะ\n";
    filteredEmployees.forEach((emp: any) => {
      const row = [emp.emp_id, `${emp.prefix}${emp.first_name_th} ${emp.last_name_th}`, emp.dept_name || 'ไม่มีแผนก',
      emp.base_salary, emp.total_allowance, emp.total_deduction, emp.net_salary, emp.status];
      csvContent += row.map(c => `"${c}"`).join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Payroll_Bank_Export.csv`);
    document.body.appendChild(link);
    link.click(); document.body.removeChild(link);
  };

  const openDrawer = async (emp: any) => {
    setSelectedRecord(emp);
    try {
      const [aRes, dRes] = await Promise.all([
        fetch(`/api/payroll/allowances?payroll_id=${emp.payroll_id}`),
        fetch(`/api/payroll/deductions?payroll_id=${emp.payroll_id}`)
      ]);
      setAllowances(await aRes.json());
      setDeductions(await dRes.json());
    } catch (e) { console.error(e); }
  };

  const closeDrawer = () => { setSelectedRecord(null); setIsAdding(false); fetchDashboardData(); };

  const handleAddDetail = async (kind: 'allowance' | 'deduction') => {
    if (!addType || !addAmount) return;
    try {
      const endpoint = kind === 'allowance' ? '/api/payroll/allowances' : '/api/payroll/deductions';
      const body = {
        payroll_id: selectedRecord.payroll_id, amount: Number(addAmount), remark: addRemark,
        ...(kind === 'allowance' ? { allowance_type_id: addType } : { deduction_type_id: addType })
      };
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        setIsAdding(false); setAddType(''); setAddAmount(''); setAddRemark('');
        const [aRes, dRes] = await Promise.all([
          fetch(`/api/payroll/allowances?payroll_id=${selectedRecord.payroll_id}`),
          fetch(`/api/payroll/deductions?payroll_id=${selectedRecord.payroll_id}`)
        ]);
        setAllowances(await aRes.json()); setDeductions(await dRes.json());
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteDetail = async (kind: 'allowance' | 'deduction', id: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันลบรายการนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;
    try {
      const endpoint = kind === 'allowance' ? '/api/payroll/allowances' : '/api/payroll/deductions';
      const res = await fetch(`${endpoint}?id=${id}&payroll_id=${selectedRecord.payroll_id}`, { method: 'DELETE' });
      if (res.ok) {
        const [aRes, dRes] = await Promise.all([
          fetch(`/api/payroll/allowances?payroll_id=${selectedRecord.payroll_id}`),
          fetch(`/api/payroll/deductions?payroll_id=${selectedRecord.payroll_id}`)
        ]);
        setAllowances(await aRes.json()); setDeductions(await dRes.json());
      }
    } catch (e) { console.error(e); }
  };

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];

    // First, filter by role (Own-Data for non-admins)
    let baseEmployees = data?.employees || [];
    if (!isAdmin) {
      baseEmployees = user?.emp_id ? baseEmployees.filter((emp: any) => emp.emp_id === user.emp_id) : [];
    }

    return baseEmployees.filter((emp: any) => {
      const searchStr = `${emp.first_name_th || ''} ${emp.last_name_th || ''} ${emp.emp_id || ''} ${emp.dept_name || ''}`.toLowerCase();
      const matchSearch = searchStr.includes(searchQuery.toLowerCase());
      return matchSearch && (deptFilter === 'All' || emp.dept_name === deptFilter) && (statusFilter === 'All' || emp.status.toLowerCase() === statusFilter.toLowerCase());
    });
  }, [data, searchQuery, deptFilter, statusFilter, isAdmin, user?.emp_id]);

  const stats = useMemo(() => {
    let salary = 0; let ot = 0; let night = 0; let draftCount = 0; let approvedCount = 0;
    filteredEmployees.forEach((emp: any) => {
      salary += Number(emp.net_salary || 0); ot += Number(emp.ot_amount || 0); night += Number(emp.night_shift_amount || 0);
      if (emp.status === 'Draft') draftCount++; if (emp.status === 'Approved') approvedCount++;
    });
    return { salary, ot, night, draftCount, approvedCount };
  }, [filteredEmployees]);

  const { deptDistribution, allowBreakdown } = useMemo(() => {
    const deptMap: Record<string, number> = {}; const allowMap: Record<string, number> = {};
    filteredEmployees.forEach((emp: any) => {
      const dept = emp.dept_name || 'ไม่มีแผนก';
      if (!deptMap[dept]) deptMap[dept] = 0;
      deptMap[dept] += Number(emp.net_salary || 0);
      if (emp.allowances_breakdown) {
        Object.entries(emp.allowances_breakdown).forEach(([k, v]) => {
          if (!allowMap[k]) allowMap[k] = 0; allowMap[k] += Number(v);
        });
      }
    });
    return {
      deptDistribution: Object.entries(deptMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      allowBreakdown: Object.entries(allowMap).map(([type_name, total_amount]) => ({ type_name, total_amount })).sort((a, b) => b.total_amount - a.total_amount)
    };
  }, [filteredEmployees]);

  const uniqueDepts = useMemo(() => {
    if (!data?.employees) return [];
    return Array.from(new Set(data?.employees?.map((e: any) => e.dept_name).filter(Boolean)));
  }, [data]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#cbd5e1'];

  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  const pagedEmployees = filteredEmployees.slice((page - 1) * perPage, page * perPage);

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">{isAdmin ? 'การเงินและรอบค่าจ้าง' : 'สลิปเงินเดือนของฉัน'}</h1>
            <p className="page-subtitle">{isAdmin ? 'จัดการรอบเงินเดือนแบบองค์รวม พร้อมเชื่อมต่อธนาคาร' : 'ตรวจสอบประวัติเงินเดือนและดาวน์โหลดสลิป'}</p>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <button className="btn-primary" onClick={() => setShowGenerateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                เริ่มรอบเงินเดือนใหม่
              </button>
              <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                ส่งออกไฟล์ธนาคาร (CSV)
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-card hover-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>ยอดสุทธิประเมิน</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>฿{stats.salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="glass-card hover-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>ค่าล่วงเวลารวม</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>฿{stats.ot.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="glass-card hover-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#faf5ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg></div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>ค่ากะดึกรวม</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>฿{stats.night.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>

          {isAdmin && (
            <div className={`pd-action-card hover-glow ${stats.draftCount === 0 && stats.approvedCount > 0 ? 'paid-ready' : stats.draftCount === 0 && stats.approvedCount === 0 ? 'empty' : ''}`}>
              {stats.draftCount > 0 ? (
                <>
                  <div className="ac-title">รออนุมัติสลิป</div>
                  <div className="ac-number">{stats.draftCount}</div>
                  <button onClick={() => handleBulkStatusUpdate('Draft', 'Approved')} disabled={isUpdatingStatus}>⭐ อนุมัติทั้งหมด (Approve All)</button>
                </>
              ) : stats.approvedCount > 0 ? (
                <>
                  <div className="ac-title text-green">รอสั่งจ่ายเงิน</div>
                  <div className="ac-number">{stats.approvedCount}</div>
                  <button className="btn-success" onClick={() => handleBulkStatusUpdate('Approved', 'Paid')} disabled={isUpdatingStatus}>💸 สั่งจ่ายแล้ว (Mark Paid)</button>
                </>
              ) : (
                <div className="ac-empty">
                  <div className="ac-icon">🎉</div>
                  <span>จบงานเดือนนี้แล้ว</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '24px', height: '340px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', flex: 2, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px 0', color: '#1e293b' }}>สัดส่วนรายจ่ายแยกรายแผนก</h3>
            <div className="custom-scroll" style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden' }}>
              <div style={{ minWidth: `${Math.max(100, deptDistribution.length * 120)}px`, height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptDistribution} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 500 }} tickFormatter={v => `${v / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px 0', color: '#1e293b' }}>สัดส่วนรายรับพิเศษ</h3>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 10 }}>
                  <Pie data={allowBreakdown} innerRadius="60%" outerRadius="85%" paddingAngle={4} dataKey="total_amount" nameKey="type_name" stroke="none">
                    {allowBreakdown.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500, color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="tb-header" style={{ padding: '24px', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>{isAdmin ? `รายชื่อพนักงาน (${filteredEmployees.length} คน)` : `ประวัติสลิปเงินเดือนของฉัน`}</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" className="search-input" placeholder="ค้นหาชื่อ, รหัส..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '40px', padding: '10px 16px 10px 40px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
              </div>
              <select className="search-input" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <option value="All">ทุกแผนก</option>
                {uniqueDepts.map((d: any) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="search-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <option value="All">ทุกสถานะ</option>
                <option value="Draft">ยังไม่อนุมัติ</option>
                <option value="Approved">อนุมัติแล้ว</option>
                <option value="Paid">จ่ายแล้ว</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }} className="custom-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>พนักงาน</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{isAdmin ? 'แผนก' : 'ประจำเดือน'}</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>ฐานรายได้</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>รับเพิ่ม</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>หักลบ</th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>สุทธิ</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>สถานะ</th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pagedEmployees.map((emp: any) => (
                  <tr key={emp.payroll_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', fontSize: '15px' }}>{emp.prefix}{emp.first_name_th} {emp.last_name_th}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{emp.emp_id}</div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      {isAdmin ? (
                        <span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0' }}>{emp.dept_name || 'ไม่มี'}</span>
                      ) : (
                        <span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#4F46E5', border: '1px solid #e0e7ff' }}>{MONTHS_TH[(emp.pay_month || 1) - 1]} {emp.pay_year}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>฿{Number(emp.base_salary).toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}><span style={{ color: emp.total_allowance > 0 ? '#10b981' : '#cbd5e1', fontWeight: 700, fontSize: '14px' }}>{emp.total_allowance > 0 ? `+฿${Number(emp.total_allowance).toLocaleString()}` : '-'}</span></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}><span style={{ color: emp.total_deduction > 0 ? '#ef4444' : '#cbd5e1', fontWeight: 700, fontSize: '14px' }}>{emp.total_deduction > 0 ? `-฿${Number(emp.total_deduction).toLocaleString()}` : '-'}</span></td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>฿{Number(emp.net_salary).toLocaleString()}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, background: emp.status === 'Paid' ? '#d1fae5' : emp.status === 'Approved' ? '#e0e7ff' : '#f1f5f9', color: emp.status === 'Paid' ? '#059669' : emp.status === 'Approved' ? '#4f46e5' : '#64748b', padding: '6px 12px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: emp.status === 'Paid' ? '#10b981' : emp.status === 'Approved' ? '#4f46e5' : '#94a3b8' }} />
                        {emp.status === 'Paid' ? 'จ่ายแล้ว' : emp.status === 'Approved' ? 'อนุมัติ' : 'ยังไม่อนุมัติ'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button className="btn-secondary" onClick={() => openDrawer(emp)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>{isAdmin ? 'แก้สลิป' : 'ดูสลิป'}</button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600 }}>ไม่มีข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {!isLoading && filteredEmployees.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                แสดง {(page - 1) * perPage + 1}-{Math.min(page * perPage, filteredEmployees.length)} จาก {filteredEmployees.length} รายการ
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#94a3b8' : '#334155', fontWeight: 600 }}>
                  ก่อนหน้า
                </button>
                {Array.from({ length: Math.ceil(filteredEmployees.length / perPage) }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: page === i + 1 ? 'none' : '1px solid #cbd5e1',
                      background: page === i + 1 ? '#3b82f6' : 'white',
                      color: page === i + 1 ? 'white' : '#334155'
                    }}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(Math.ceil(filteredEmployees.length / perPage), p + 1))} disabled={page === Math.max(1, Math.ceil(filteredEmployees.length / perPage))}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === Math.max(1, Math.ceil(filteredEmployees.length / perPage)) ? 'default' : 'pointer', fontSize: 13, color: page === Math.max(1, Math.ceil(filteredEmployees.length / perPage)) ? '#94a3b8' : '#334155', fontWeight: 600 }}>
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- Drawer --- */}
        {selectedRecord && (
          <div className="drawer-overlay" onClick={closeDrawer}>
            <div className="drawer-panel" onClick={e => e.stopPropagation()}>
              <div className="dr-header">
                <div>
                  <h2>{selectedRecord.prefix}{selectedRecord.first_name_th} {selectedRecord.last_name_th}</h2>
                  <p>รหัสพนักงาน: {selectedRecord.emp_id} • ฐานเดือนนี้ ฿{Number(selectedRecord.base_salary).toLocaleString()}</p>
                </div>
                <button className="btn-close" onClick={closeDrawer}>{CloseIcon}</button>
              </div>

              <div className="dr-body custom-scroll">
                {/* Allowances */}
                <div className="dr-section">
                  <div className="dr-sec-title green">
                    <h4>+ รายรับพิเศษ / โอที</h4>
                    {(isAdmin && !isAdding) && <button onClick={() => { setIsAdding(true); setAddType(allowanceTypes[0]?.id || '') }}>+ เพิ่ม</button>}
                  </div>
                  {isAdding && allowanceTypes.length > 0 && (
                    <div className="dr-add-form green">
                      <select value={addType} onChange={e => setAddType(e.target.value)}>
                        {allowanceTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                      </select>
                      <input type="number" placeholder="ยอดเงิน" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                      <input type="text" placeholder="หมายเหตุ" value={addRemark} onChange={e => setAddRemark(e.target.value)} />
                      <button className="btn-save green" onClick={() => handleAddDetail('allowance')}>{CheckIcon}</button>
                      <button className="btn-cancel" onClick={() => setIsAdding(false)}>{CloseIcon}</button>
                    </div>
                  )}
                  {allowances.map(a => (
                    <div key={a.id} className="dr-item">
                      <div>
                        <b>{a.type_name}</b>
                        {a.remark && <span>{a.remark}</span>}
                      </div>
                      <div className="dr-item-actions">
                        <strong className="c-green">+฿{Number(a.amount).toLocaleString()}</strong>
                        {isAdmin && <button onClick={() => handleDeleteDetail('allowance', a.id)} style={{ cursor: 'pointer' }}>{TrashIcon}</button>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Deductions */}
                <div className="dr-section">
                  <div className="dr-sec-title red">
                    <h4>- รายจ่าย / หักสาย / ภาษี</h4>
                    {(isAdmin && !isAdding) && <button onClick={() => { setIsAdding(true); setAddType(deductionTypes[0]?.id || '') }}>+ เพิ่ม</button>}
                  </div>
                  {isAdding && deductionTypes.length > 0 && (
                    <div className="dr-add-form red">
                      <select value={addType} onChange={e => setAddType(e.target.value)}>
                        {deductionTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                      </select>
                      <input type="number" placeholder="ยอดเงิน" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                      <input type="text" placeholder="หมายเหตุ" value={addRemark} onChange={e => setAddRemark(e.target.value)} />
                      <button className="btn-save red" onClick={() => handleAddDetail('deduction')}>{CheckIcon}</button>
                      <button className="btn-cancel" onClick={() => setIsAdding(false)}>{CloseIcon}</button>
                    </div>
                  )}
                  {deductions.map(d => (
                    <div key={d.id} className="dr-item">
                      <div>
                        <b>{d.type_name}</b>
                        {d.remark && <span>{d.remark}</span>}
                      </div>
                      <div className="dr-item-actions">
                        <strong className="c-red">-฿{Number(d.amount).toLocaleString()}</strong>
                        {isAdmin && <button onClick={() => handleDeleteDetail('deduction', d.id)} style={{ cursor: 'pointer' }}>{TrashIcon}</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dr-footer">
                <div className="dr-summary">
                  <span>ยอดประมวลผลสุทธิ</span>
                  <strong>฿{(
                    Number(selectedRecord.base_salary) +
                    allowances.reduce((s, a) => s + Number(a.amount), 0) -
                    deductions.reduce((s, d) => s + Number(d.amount), 0)
                  ).toLocaleString()}</strong>
                </div>
                <div className="dr-actions">
                  <button className="btn-outline-indigo" onClick={handlePrint}>{PrintIcon} ดูสลิป (PDF)</button>
                  <button className="btn-indigo" onClick={closeDrawer}>บันทึกและปิดหน้าต่าง</button>
                </div>
              </div>
              <PayslipTemplate ref={printRef} record={selectedRecord} allowances={allowances} deductions={deductions} month={String(selectedRecord?.pay_month || data?.targetMonth || '')} year={String(selectedRecord?.pay_year || data?.targetYear || '')} />
            </div>
          </div>
        )}

        {/* Modal Generator */}
        {showGenerateModal && (
          <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: '0 0 24px 0' }}>เริ่มรอบเงินเดือนใหม่</h2>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>เดือน</label>
                <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  {MONTHS_TH.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>ปี (ค.ศ.)</label>
                <input type="number" value={genYear} onChange={e => setGenYear(Number(e.target.value))} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1' }} />
              </div>
              <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                <button className="btn-cancel" onClick={() => setShowGenerateModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontWeight: 800 }}>ยกเลิก</button>
                <button className="btn-confirm" disabled={isGenerating} onClick={handleGenerate} style={{ flex: 2, padding: '12px', borderRadius: '12px', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800 }}>ยืนยันสร้าง</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}