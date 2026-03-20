'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import PayslipTemplate from '@/components/Payroll/PayslipTemplate';
import { useRouter } from 'next/navigation';

const CloseIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const CheckIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const TrashIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const PrintIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;

export default function PayrollDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
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
    documentTitle: selectedRecord ? `Payslip_${selectedRecord.emp_id}_${data?.targetMonth}_${data?.targetYear}` : 'Payslip',
  });

  const MONTHS_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  useEffect(() => {
    fetchDashboardData();
    fetchMasterData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/dashboard');
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/payroll/master');
      const mst = await res.json();
      setAllowanceTypes(mst.allowances || []);
      setDeductionTypes(mst.deductions || []);
    } catch (e) { console.error(e); }
  };

  const handleGenerate = async () => {
    if (!confirm(`ยืนยันสร้างรอบเงินเดือน ${MONTHS_TH[genMonth - 1]} ${genYear}?`)) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_month: genMonth, pay_year: genYear })
      });
      if (res.ok) {
        setShowGenerateModal(false);
        fetchDashboardData();
      } else {
        alert('Error: ' + (await res.json()).error);
      }
    } finally { setIsGenerating(false); }
  };

  const handleBulkStatusUpdate = async (fromStatus: string, toStatus: string) => {
    const msg = toStatus === 'Approved' ? 'ยืนยันอนุมัติสลิป?' : 'ยืนยันเปลี่ยนเป็นจ่ายแล้ว?';
    if (!confirm(msg)) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/payroll/status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: data.targetMonth, year: data.targetYear, fromStatus, toStatus })
      });
      if (res.ok) fetchDashboardData();
    } finally { setIsUpdatingStatus(false); }
  };

  const handleExportCSV = () => {
    if (!filteredEmployees.length) return alert('ไม่มีข้อมูล');
    const BOM = "\uFEFF";
    let csvContent = BOM + "รหัสพนักงาน,ชื่อ-นามสกุล,แผนก,ฐานเงินเดือน,รายรับ+,รายหัก-,ยอดโอนสุทธิ,สถานะ\n";
    filteredEmployees.forEach((emp: any) => {
      const row = [ emp.emp_id, `${emp.prefix}${emp.first_name_th} ${emp.last_name_th}`, emp.dept_name || 'ไม่มีแผนก',
        emp.base_salary, emp.total_allowance, emp.total_deduction, emp.net_salary, emp.status ];
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
      const body = { payroll_id: selectedRecord.payroll_id, amount: Number(addAmount), remark: addRemark, 
        ...(kind==='allowance' ? {allowance_type_id: addType} : {deduction_type_id: addType}) };
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
    if (!confirm('ยืนยันลบรายการนี้?')) return;
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
    return data.employees.filter((emp: any) => {
      const matchSearch = (emp.first_name_th + ' ' + emp.last_name_th).toLowerCase().includes(searchQuery.toLowerCase()) || emp.emp_id.includes(searchQuery);
      return matchSearch && (deptFilter === 'All' || emp.dept_name === deptFilter) && (statusFilter === 'All' || emp.status.toLowerCase() === statusFilter.toLowerCase());
    });
  }, [data, searchQuery, deptFilter, statusFilter]);

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
    return Array.from(new Set(data.employees.map((e: any) => e.dept_name).filter(Boolean)));
  }, [data]);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#cbd5e1'];

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">การเงินและรอบค่าจ้าง</h1>
            <p className="page-subtitle">จัดการรอบเงินเดือนแบบองค์รวม พร้อมเชื่อมต่อธนาคาร</p>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn-primary" onClick={() => setShowGenerateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg> 
              เริ่มรอบเงินเดือนใหม่
            </button>
            <button className="btn-secondary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> 
              ส่งออกไฟล์ธนาคาร (CSV)
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' }}>
          <div className="glass-card hover-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>ยอดสุทธิประเมิน</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>฿{stats.salary.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div className="glass-card hover-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>ค่าล่วงเวลารวม</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>฿{stats.ot.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div className="glass-card hover-glow" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#faf5ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg></div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>ค่ากะดึกรวม</div>
            <div style={{ fontSize: '30px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>฿{stats.night.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          
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
        </div>

        <div style={{ display: 'flex', gap: '24px', height: '340px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', flex: 2, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 20px 0', color: '#1e293b' }}>สัดส่วนรายจ่ายแยกลายแผนก</h3>
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
          <div className="filter-bar" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>รายชื่อพนักงาน ({filteredEmployees.length} คน)</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" className="search-input" placeholder="ค้นหาชื่อ, รหัส..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '40px' }} />
              </div>
              <select className="search-input" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="All">ทุกแผนก</option>
                {uniqueDepts.map((d: any) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="search-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">ทุกสถานะ</option>
                <option value="Draft">ยังไม่อนุมัติ</option>
                <option value="Approved">อนุมัติแล้ว</option>
                <option value="Paid">จ่ายแล้ว</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }} className="custom-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>พนักงาน</th>
                  <th style={{textAlign:'center'}}>แผนก</th>
                  <th style={{textAlign:'right'}}>ฐานรายได้</th>
                  <th style={{textAlign:'right'}}>รับเพิ่ม</th>
                  <th style={{textAlign:'right'}}>หักลบ</th>
                  <th style={{textAlign:'right'}}>สุทธิ</th>
                  <th style={{textAlign:'center'}}>สถานะ</th>
                  <th style={{textAlign:'center'}}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                 {filteredEmployees.map((emp: any) => (
                    <tr key={emp.payroll_id}>
                      <td>
                         <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', fontSize: '15px' }}>{emp.prefix}{emp.first_name_th} {emp.last_name_th}</div>
                         <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{emp.emp_id}</div>
                      </td>
                      <td style={{textAlign:'center'}}><span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0' }}>{emp.dept_name || 'ไม่มี'}</span></td>
                      <td style={{textAlign:'right', fontWeight: 600, color: '#475569' }}>฿{Number(emp.base_salary).toLocaleString()}</td>
                      <td style={{textAlign:'right'}}><span style={{ color: emp.total_allowance > 0 ? '#10b981' : '#cbd5e1', fontWeight: 700, fontSize: '14px' }}>{emp.total_allowance > 0 ? `+฿${Number(emp.total_allowance).toLocaleString()}` : '-'}</span></td>
                      <td style={{textAlign:'right'}}><span style={{ color: emp.total_deduction > 0 ? '#ef4444' : '#cbd5e1', fontWeight: 700, fontSize: '14px' }}>{emp.total_deduction > 0 ? `-฿${Number(emp.total_deduction).toLocaleString()}` : '-'}</span></td>
                      <td style={{textAlign:'right', fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>฿{Number(emp.net_salary).toLocaleString()}</td>
                      <td style={{textAlign:'center'}}>
                         <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, background: emp.status === 'Paid' ? '#d1fae5' : emp.status === 'Approved' ? '#e0e7ff' : '#f1f5f9', color: emp.status === 'Paid' ? '#059669' : emp.status === 'Approved' ? '#4f46e5' : '#64748b', padding: '6px 12px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: emp.status === 'Paid' ? '#10b981' : emp.status === 'Approved' ? '#4f46e5' : '#94a3b8' }} />
                            {emp.status === 'Paid' ? 'จ่ายแล้ว' : emp.status === 'Approved' ? 'อนุมัติ' : 'ยังไม่อนุมัติ'}
                         </span>
                      </td>
                      <td style={{textAlign:'center'}}>
                         <button className="btn-secondary" onClick={() => openDrawer(emp)} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>แก้สลิป</button>
                      </td>
                    </tr>
                 ))}
                 {filteredEmployees.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontWeight: 600 }}>ไม่มีข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
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
                     {!isAdding && <button onClick={() => {setIsAdding(true); setAddType(allowanceTypes[0]?.id || '')}}>+ เพิ่ม</button>}
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
                         <button onClick={() => handleDeleteDetail('allowance', a.id)}>{TrashIcon}</button>
                       </div>
                     </div>
                   ))}
                </div>

                {/* Deductions */}
                <div className="dr-section mt-4">
                   <div className="dr-sec-title red">
                     <h4>- รายจ่าย / หักสาย / ภาษี</h4>
                     {!isAdding && <button onClick={() => {setIsAdding(true); setAddType(deductionTypes[0]?.id || '')}}>+ เพิ่ม</button>}
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
                         <button onClick={() => handleDeleteDetail('deduction', d.id)}>{TrashIcon}</button>
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
              <PayslipTemplate ref={printRef} record={selectedRecord} allowances={allowances} deductions={deductions} month={data?.targetMonth as string} year={data?.targetYear as string} />
            </div>
          </div>
        )}

        {/* Modal Generator */}
        {showGenerateModal && (
          <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <h2>เริ่มรอบเงินเดือนใหม่</h2>
              <div className="form-group">
                <label>เดือน</label>
                <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                  {MONTHS_TH.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group mt-3">
                <label>ปี (ค.ศ.)</label>
                <input type="number" value={genYear} onChange={e => setGenYear(Number(e.target.value))} />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowGenerateModal(false)}>ยกเลิก</button>
                <button className="btn-confirm" disabled={isGenerating} onClick={handleGenerate}>ยืนยันสร้าง</button>
              </div>
            </div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Sarabun:wght@400;500;600;700;800&display=swap');
        .spa-payroll * { box-sizing: border-box; }
        .spa-payroll { font-family: 'Inter', 'Sarabun', sans-serif; background: #f8fafc; min-height: 100vh; color: #1e293b; }
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; border: 2px solid #f8fafc; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        .pd-wrapper { padding: 40px; max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px; }
        
        /* Header */
        .pd-header { display: flex; justify-content: space-between; align-items: flex-end; }
        .pd-title-box h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
        .pd-title-box p { color: #64748b; font-size: 15px; margin: 6px 0 0; }
        .pd-actions { display: flex; gap: 16px; }
        .btn-primary { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 99px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); background: #4338ca; box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4); }
        .btn-secondary { background: white; color: #334155; border: 1px solid #cbd5e1; padding: 12px 24px; border-radius: 99px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
        .btn-secondary:hover { background: #f1f5f9; border-color: #94a3b8; }
        
        /* Stats */
        .pd-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .pd-stat-card { background: white; border-radius: 24px; padding: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px; transition: 0.2s; }
        .pd-stat-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); transform: translateY(-2px); }
        .stat-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.bg-blue { background: #eff6ff; color: #3b82f6; }
        .stat-icon.bg-amber { background: #fffbeb; color: #f59e0b; }
        .stat-icon.bg-purple { background: #faf5ff; color: #a855f7; }
        .stat-label { font-size: 14px; font-weight: 700; color: #64748b; }
        .stat-value { font-size: 30px; font-weight: 900; color: #0f172a; letter-spacing: -1px; line-height: 1; }
        
        /* Action Card */
        .pd-action-card { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 24px; padding: 24px; color: white; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 20px rgba(15,23,42,0.25); position: relative; overflow: hidden; }
        .pd-action-card.paid-ready { background: linear-gradient(135deg, #065f46, #047857); box-shadow: 0 10px 20px rgba(4,120,87,0.3); }
        .pd-action-card.empty { background: linear-gradient(135deg, #64748b, #475569); box-shadow: none; justify-content: center; align-items: center; }
        .ac-title { font-size: 14px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .pd-action-card.paid-ready .ac-title { color: #a7f3d0; }
        .ac-number { font-size: 40px; font-weight: 900; line-height: 1; margin: 8px 0 16px; }
        .pd-action-card button { background: white; color: #0f172a; border: none; padding: 14px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 15px; }
        .pd-action-card button:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.9; }
        .pd-action-card button.btn-success { background: #10b981; color: white; }
        .ac-empty { text-align: center; opacity: 0.8; }
        .ac-empty .ac-icon { font-size: 32px; margin-bottom: 8px; }
        .ac-empty span { font-weight: 700; font-size: 16px; }

        /* Charts */
        .pd-charts-row { display: flex; gap: 24px; height: 340px; }
        .pd-chart-box { background: white; border-radius: 24px; padding: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); display: flex; flex-direction: column; }
        .flex-2 { flex: 2; } .flex-1 { flex: 1; }
        .pd-chart-box h3 { font-size: 16px; font-weight: 800; margin: 0 0 20px 0; color: #1e293b; }
        .chart-inner { flex: 1; min-height: 0; }
        
        /* Table */
        .pd-table-box { background: white; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); overflow: hidden; }
        .tb-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; border-bottom: 1px solid #f1f5f9; background: #fafafa; gap: 16px; flex-wrap: wrap; }
        .tb-header h3 { font-size: 18px; font-weight: 800; margin: 0; color: #0f172a; white-space: nowrap; flex-shrink: 0; }
        .tb-filters { display: flex; gap: 12px; flex-wrap: wrap; }
        .tb-filters input, .tb-filters select { padding: 10px 16px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: inherit; font-size: 14px; font-weight: 500; outline: none; transition: 0.2s; min-width: 140px; }
        .tb-filters input:focus, .tb-filters select:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .tb-body { overflow-x: auto; }
        .tb-body table { width: 100%; border-collapse: collapse; min-width: 1050px; }
        .tb-body th { padding: 16px 24px; text-align: left; font-size: 12px; text-transform: uppercase; font-weight: 800; color: #64748b; border-bottom: 1px solid #f1f5f9; background: #fafafa; white-space: nowrap; }
        .tb-body td { padding: 16px 24px; vertical-align: middle; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 14px; transition: 0.2s; }
        .tb-body tr:hover td { background: #f8fafc; }
        
        .emp-name { font-weight: 700; color: #0f172a; white-space: nowrap; }
        .emp-id { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px; }
        .col-base { font-weight: 600; color: #64748b; white-space: nowrap; }
        .col-net { font-size: 16px; font-weight: 900; color: #0f172a; white-space: nowrap; }
        
        .dept-badge { background: #f1f5f9; px: 10px; py: 4px; border-radius: 8px; font-size: 12px; font-weight: 700; color: #475569; padding: 6px 10px; white-space: nowrap; display: inline-block; }
        .amt-badge { font-weight: 700; font-size: 13px; color: #cbd5e1; white-space: nowrap; }
        .amt-badge.plus { color: #10b981; background: #ecfdf5; padding: 4px 8px; border-radius: 8px; }
        .amt-badge.minus { color: #ef4444; background: #fef2f2; padding: 4px 8px; border-radius: 8px; }
        
        .status-dot { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; background: #f1f5f9; padding: 6px 12px; border-radius: 99px; white-space: nowrap; }
        .status-dot .dot { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
        .status-dot.approved { color: #4f46e5; background: #e0e7ff; }
        .status-dot.approved .dot { background: #4f46e5; }
        .status-dot.paid { color: #10b981; background: #d1fae5; }
        .status-dot.paid .dot { background: #10b981; }
        
        .btn-edit-row { background: white; border: 1px solid #cbd5e1; color: #4f46e5; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); white-space: nowrap; }
        .btn-edit-row:hover { background: #4f46e5; color: white; border-color: #4f46e5; }
        .empty-row { text-align: center; padding: 40px !important; color: #94a3b8; font-weight: 600; }
        
        /* Drawer */
        .drawer-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(4px); z-index: 100; display: flex; justify-content: flex-end; }
        .drawer-panel { width: 560px; max-width: 100%; background: #f8fafc; height: 100vh; box-shadow: -20px 0 50px rgba(0,0,0,0.1); display: flex; flex-direction: column; animation: slideIn 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .dr-header { padding: 32px; background: white; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; }
        .dr-header h2 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; line-height: 1.3; }
        .dr-header p { font-size: 13px; font-weight: 600; color: #64748b; margin: 0; }
        .btn-close { background: #f1f5f9; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; }
        .btn-close:hover { background: #e2e8f0; color: #0f172a; }
        
        .dr-body { padding: 32px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 32px; }
        .dr-section { display: flex; flex-direction: column; gap: 16px; }
        .dr-sec-title { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .dr-sec-title.green h4 { color: #10b981; } .dr-sec-title.red h4 { color: #ef4444; }
        .dr-sec-title h4 { font-size: 16px; font-weight: 800; margin: 0; }
        .dr-sec-title button { background: white; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; transition: 0.2s; }
        .dr-sec-title.green button { color: #10b981; border-color: #10b981; } .dr-sec-title.green button:hover { background: #ecfdf5; }
        .dr-sec-title.red button { color: #ef4444; border-color: #ef4444; } .dr-sec-title.red button:hover { background: #fef2f2; }
        
        .dr-add-form { display: flex; gap: 8px; padding: 16px; border-radius: 12px; background: white; border: 1px solid #e2e8f0; }
        .dr-add-form.green { background: #ecfdf5; border-color: #a7f3d0; }
        .dr-add-form.red { background: #fef2f2; border-color: #fecaca; }
        .dr-add-form select, .dr-add-form input { flex: 1; min-width: 0; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 13px; outline: none; }
        .dr-add-form select:focus, .dr-add-form input:focus { border-color: #4f46e5; }
        .btn-save, .btn-cancel { width: 36px; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; color: white; display: flex; justify-content: center; align-items: center; }
        .btn-save.green { background: #10b981; } .btn-save.green:hover { background: #059669; }
        .btn-save.red { background: #ef4444; } .btn-save.red:hover { background: #dc2626; }
        .btn-cancel { background: white; color: #64748b; border: 1px solid #cbd5e1; } .btn-cancel:hover { background: #f1f5f9; }
        
        .dr-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: 0.2s; }
        .dr-item:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.04); }
        .dr-item b { font-size: 14px; color: #1e293b; display: block; }
        .dr-item span { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .dr-item-actions { display: flex; align-items: center; gap: 16px; }
        .dr-item-actions strong { font-size: 16px; font-weight: 800; }
        .c-green { color: #10b981; } .c-red { color: #ef4444; }
        .dr-item-actions button { background: #f1f5f9; border: none; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; transition: 0.2s; opacity: 0; color: #94a3b8; }
        .dr-item:hover .dr-item-actions button { opacity: 1; }
        .dr-item-actions button:hover { background: #fee2e2; color: #ef4444; }
        
        .dr-footer { background: white; padding: 24px 32px; border-top: 1px solid #f1f5f9; box-shadow: 0 -10px 30px rgba(0,0,0,0.03); z-index: 10; }
        .dr-summary { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 16px 20px; border-radius: 12px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
        .dr-summary span { font-size: 14px; font-weight: 700; color: #64748b; }
        .dr-summary strong { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; line-height: 1; }
        .dr-actions { display: flex; gap: 12px; }
        .btn-outline-indigo, .btn-indigo { flex: 1; border-radius: 10px; font-weight: 700; font-size: 14px; padding: 12px; cursor: pointer; transition: 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .btn-outline-indigo { background: white; border: 2px solid #e0e7ff; color: #4f46e5; } .btn-outline-indigo:hover { background: #f5f8ff; border-color: #c7d2fe; }
        .btn-indigo { background: #4f46e5; border: none; color: white; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); } .btn-indigo:hover { background: #4338ca; transform: translateY(-2px); }

        /* Modal Generate */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); z-index: 200; display: flex; justify-content: center; align-items: center; }
        .modal-box { background: white; padding: 32px; border-radius: 24px; width: 400px; max-width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: popIn 0.3s cubic-bezier(0.16,1,0.3,1); }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .modal-box h2 { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 24px 0; }
        .form-group label { display: block; font-size: 14px; font-weight: 800; color: #64748b; margin-bottom: 8px; }
        .form-group select, .form-group input { w-full; padding: 12px 16px; width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 15px; font-weight: 600; outline: none; }
        .form-group select:focus, .form-group input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
        .mt-3 { margin-top: 16px; }
        .modal-actions { display: flex; gap: 12px; margin-top: 32px; }
        .btn-cancel { flex: 1; background: #f1f5f9; color: #64748b; border: none; border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer; } .btn-cancel:hover { background: #e2e8f0; }
        .btn-confirm { flex: 2; background: #4f46e5; color: white; border: none; border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); } .btn-confirm:hover:not(:disabled) { background: #4338ca; }
        .btn-confirm:disabled { opacity: 0.7; cursor: not-allowed; }
      `}} />
    </AppLayout>
  );
}