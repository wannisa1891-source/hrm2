'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useRouter } from 'next/navigation';

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

  const MONTHS_TH = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payroll/dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm(`คุณต้องการสร้างตั้งต้นรอบเงินเดือน ${MONTHS_TH[genMonth - 1]} ${genYear} หรือไม่?`)) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pay_month: genMonth, pay_year: genYear })
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        setShowGenerateModal(false);
        fetchDashboardData();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการสร้างรอบเงินเดือน');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkStatusUpdate = async (fromStatus: string, toStatus: string) => {
    const confirmMessage = toStatus === 'Approved' 
      ? 'คุณต้องการอนุมัติสลิป (Draft) ทั้งหมดของเดือนนี้ (เพื่อรอจ่ายเงิน) ใช่หรือไม่?' 
      : 'คุณต้องการเปลี่ยนสถานะเป็น "จ่ายแล้ว (Paid)" ทั้งหมดใช่หรือไม่? (*กรุณากดหลังจากโอนเงิน/ส่งไฟล์ธนาคารแล้ว)';
      
    if (!confirm(confirmMessage)) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch('/api/payroll/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          month: data.targetMonth, 
          year: data.targetYear, 
          fromStatus, 
          toStatus 
        })
      });
      const result = await res.json();
      if (res.ok) {
        alert(result.message);
        fetchDashboardData();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }
    
    // Create CSV content (BOM for Thai characters Excel support)
    const BOM = "\uFEFF";
    let csvContent = BOM + "รหัสพนักงาน,คำนำหน้า,ชื่อ,นามสกุล,แผนก,ฐานเงินเดือน,รายรับพิเศษ,รายการหัก,ยอดสุทธิโอนเข้าธนาคาร,สถานะ\n";

    filteredEmployees.forEach((emp: any) => {
      const row = [
        emp.emp_id,
        emp.prefix || '',
        emp.first_name_th,
        emp.last_name_th,
        emp.dept_name || 'ไม่มีแผนก',
        Number(emp.base_salary || 0).toFixed(2),
        Number(emp.total_allowance || 0).toFixed(2),
        Number(emp.total_deduction || 0).toFixed(2),
        Number(emp.net_salary || 0).toFixed(2),
        emp.status
      ];
      // Escape commas inside fields just in case
      csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bank_Export_${MONTHS_TH[data.targetMonth - 1]}_${data.targetYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#38bdf8', '#818cf8', '#facc15', '#f472b6', '#a78bfa', '#cbd5e1'];

  // 1. Filtered Employees Based on UI Inputs
  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    return data.employees.filter((emp: any) => {
      const matchSearch = (emp.first_name_th + ' ' + emp.last_name_th).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.emp_id.includes(searchQuery);
      const matchDept = deptFilter === 'All' || emp.dept_name === deptFilter;
      const matchStatus = statusFilter === 'All' || emp.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchDept && matchStatus;
    });
  }, [data, searchQuery, deptFilter, statusFilter]);

  // 2. Dynamic Stat Cards Calculation
  const stats = useMemo(() => {
    let salary = 0;
    let ot = 0;
    let night = 0;
    let draftCount = 0;
    let approvedCount = 0;

    filteredEmployees.forEach((emp: any) => {
      salary += Number(emp.net_salary || 0);
      ot += Number(emp.ot_amount || 0);
      night += Number(emp.night_shift_amount || 0);
      if (emp.status === 'Draft' || emp.status === 'Pending') draftCount++;
      if (emp.status === 'Approved') approvedCount++;
    });

    return { salary, ot, night, draftCount, approvedCount };
  }, [filteredEmployees]);

  // 3. Dynamic Charts Distribution Calculation
  const { deptDistribution, allowBreakdown } = useMemo(() => {
    const deptMap: Record<string, number> = {};
    const allowMap: Record<string, number> = {};

    filteredEmployees.forEach((emp: any) => {
      // Dept Map
      const dept = emp.dept_name || 'ไม่มีแผนก';
      if (!deptMap[dept]) deptMap[dept] = 0;
      deptMap[dept] += Number(emp.net_salary || 0);

      // Allowances Map
      if (emp.allowances_breakdown) {
        Object.entries(emp.allowances_breakdown).forEach(([k, v]) => {
          if (!allowMap[k]) allowMap[k] = 0;
          allowMap[k] += Number(v);
        });
      }
    });

    const deptDistribution = Object.entries(deptMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const allowBreakdown = Object.entries(allowMap)
      .map(([type_name, total_amount]) => ({ type_name, total_amount }))
      .sort((a, b) => b.total_amount - a.total_amount);

    return { deptDistribution, allowBreakdown };
  }, [filteredEmployees]);

  const uniqueDepts = useMemo(() => {
    if (!data?.employees) return [];
    const depts = new Set(data.employees.map((e: any) => e.dept_name).filter(Boolean));
    return Array.from(depts);
  }, [data]);

  // SVG Icons
  const SearchIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
  const PlusIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
  const ExportIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
  const MoneyIcon = <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const ClockIcon = <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const MoonIcon = <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
  const DocIcon = <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const FilterIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;

  const formatStatus = (status: string) => {
    if (status === 'Draft') return 'ยังไม่อนุมัติ';
    if (status === 'Approved') return 'อนุมัติแล้ว';
    if (status === 'Paid') return 'จ่ายแล้ว';
    return status;
  };

  return (
    <AppLayout>
      <div className="finance-dashboard custom-scroll">
        
        {/* Top Header Row */}
        <div className="fd-header">
          <h1 className="fd-title">ภาพรวมเงินเดือน (Payroll)</h1>
          <div className="fd-actions">
            <div className="search-bar">
              <span className="search-icon">{SearchIcon}</span>
              <input 
                type="text" 
                placeholder="ค้นหาชื่อพนักงาน หรือ รหัส..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button className="export-btn primary" onClick={() => setShowGenerateModal(true)}>
              <span className="icon">{PlusIcon}</span>
              <div className="btn-text">
                <strong style={{color:'white'}}>สร้างรอบเดือนใหม่</strong>
                <span style={{color:'#bfdbfe'}}>(New Payroll)</span>
              </div>
            </button>
            <button className="export-btn outline" onClick={handleExportCSV}>
              <span className="icon">{ExportIcon}</span>
              <div className="btn-text">
                <strong>ส่งออกไฟล์สั่งจ่าย</strong>
                <span>(Bank Export CSV)</span>
              </div>
            </button>
          </div>
        </div>

        {/* Highlight Cards Row */}
        <div className="fd-cards-row">
          <div className="stat-card">
            <div className="sc-header">
              <div className="sc-icon blue">{MoneyIcon}</div>
              <div className="sc-titles">
                <span className="sc-title-en">เงินเดือนรวมสุทธิ</span>
              </div>
            </div>
            <div className="sc-value">฿ {stats.salary.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="sc-trend positive">↗ 2.6% <span>จากเดือนที่แล้ว</span></div>
          </div>

          <div className="stat-card">
            <div className="sc-header">
              <div className="sc-icon orange">{ClockIcon}</div>
              <div className="sc-titles">
                <span className="sc-title-en">ค่าล่วงเวลารวม (OT)</span>
              </div>
            </div>
            <div className="sc-value">฿ {stats.ot.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="sc-trend negative">↘ 1.4% <span>จากเดือนที่แล้ว</span></div>
          </div>

          <div className="stat-card">
            <div className="sc-header">
              <div className="sc-icon purple">{MoonIcon}</div>
              <div className="sc-titles">
                <span className="sc-title-en">ค่ากะดึกรวม</span>
              </div>
            </div>
            <div className="sc-value">฿ {stats.night.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            <div className="sc-trend positive">↗ 1.2% <span>จากเดือนที่แล้ว</span></div>
          </div>

          <div className={`action-card ${stats.draftCount === 0 && stats.approvedCount > 0 ? 'paid-ready' : ''}`}>
            {stats.draftCount > 0 ? (
              <>
                <div className="ac-header">
                  <span className="ac-icon">{DocIcon}</span>
                  <div className="ac-badge">สิ่งที่ต้องทำ</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '10px', color: '#94a3b8', marginTop: '-10px', marginBottom: '10px' }}>
                  รอการอนุมัติเพื่อตั้งเป็นยอดค้างจ่าย
                </div>
                <div className="ac-title">รอการอนุมัติสลิป</div>
                <div className="ac-requests">
                  <div className="ac-big-num">{stats.draftCount} รายการ</div>
                  <div className="ac-sub-text">เป็นสถานะ Draft<br/>ที่ยังไม่ถูกอนุมัติ</div>
                </div>
                <button className="btn-review" onClick={() => handleBulkStatusUpdate('Draft', 'Approved')} disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? 'กำลังดำเนินการ...' : '⭐ อนุมัติทั้งหมด (Approve All)'}
                </button>
              </>
            ) : stats.approvedCount > 0 ? (
               <>
                <div className="ac-header">
                  <span className="ac-icon">{MoneyIcon}</span>
                  <div className="ac-badge green">ขั้นสุดท้าย</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '10px', color: '#94a3b8', marginTop: '-10px', marginBottom: '10px' }}>
                  หลังจากโอนเงิน/โหลตไฟล์อัปโหลดแบงค์แล้ว
                </div>
                <div className="ac-title">รอการสั่งจ่ายเงินเดือน</div>
                <div className="ac-requests">
                  <div className="ac-big-num">{stats.approvedCount} รายการ</div>
                  <div className="ac-sub-text">พร้อมสำหรับ<br/>โอนเงินเข้าบัญชี</div>
                </div>
                <button className="btn-review green" onClick={() => handleBulkStatusUpdate('Approved', 'Paid')} disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? 'กำลังดำเนินการ...' : '💸 สั่งจ่ายแล้ว (Mark as Paid)'}
                </button>
              </>
            ) : (
              <div style={{display:'flex', flexDirection:'column', height:'100%', justifyContent:'center', alignItems:'center', opacity:0.5}}>
                 <span style={{fontSize:'32px', marginBottom:'10px'}}>🎉</span>
                 <b style={{fontSize:'16px'}}>ดำเนินการจบแล้ว</b>
                 <small>ไม่มีสลิปรอตรวจสอบในเดือนนี้</small>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="fd-charts-row">
          {/* Bar Chart */}
          <div className="chart-card flex-2">
            <div className="chart-header">
              <div>
                <div className="ch-en">แจกแจงรายแผนก (ตามที่กรอง)</div>
                <div className="ch-th">สัดส่วนเงินเดือนแต่ละแผนก</div>
              </div>
              <div className="ch-filters">
                <span className="active">รายเดือน</span>
              </div>
            </div>
            <div className="chart-area" style={{ height: '260px' }}>
              {deptDistribution.length === 0 ? (
                <div className="empty-chart">ไม่พบข้อมูลในแผนกนี้</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptDistribution} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={v => `฿${v / 1000}k`} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" name="Net Salary" fill="#38bdf8" radius={[6, 6, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Donut Chart */}
          <div className="chart-card flex-1">
            <div className="chart-header">
              <div>
                <div className="ch-en">สัดส่วนรายรับพิเศษ</div>
                <div className="ch-th">แยกตามประเภทรายรับ</div>
              </div>
            </div>
            <div className="chart-area" style={{ height: '260px', position: 'relative' }}>
              {allowBreakdown.length === 0 ? (
                <div className="empty-chart">ไม่พบรายรับพิเศษ</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allowBreakdown}
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="total_amount"
                      nameKey="type_name"
                    >
                      {allowBreakdown.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="fd-table-card">
          <div className="tb-header">
            <div className="tb-header-left">
              <div>
                <div className="tb-title">รายการเงินเดือนพนักงาน</div>
                <div className="tb-subtitle">รายละเอียดแบบเจาะจงรายหัว</div>
              </div>
              <div className="tb-count">
                <span className="num">{filteredEmployees.length} <span>คน</span></span>
              </div>
            </div>
            
            <div className="tb-filters">
              <div className="filter-group">
                <span className="fg-icon">{FilterIcon}</span>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="All">ทุกแผนก</option>
                  {uniqueDepts.map((d: any) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <span className="fg-icon">{FilterIcon}</span>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="All">ทุกสถานะ</option>
                  <option value="Draft">ยังไม่อนุมัติ (Draft)</option>
                  <option value="Approved">อนุมัติแล้ว (Approved)</option>
                  <option value="Paid">จ่ายแล้ว (Paid)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tb-container">
            <table>
              <thead>
                <tr>
                  <th>ชื่อพนักงาน</th>
                  <th style={{ textAlign: 'center' }}>แผนก/ตำแหน่ง</th>
                  <th style={{ textAlign: 'right' }}>ฐานเงินเดือน</th>
                  <th style={{ textAlign: 'center' }}>ประเมินชม. OT</th>
                  <th style={{ textAlign: 'right' }}>กะดึก</th>
                  <th style={{ textAlign: 'right' }}>ยอดรวมสุทธิ</th>
                  <th style={{ textAlign: 'center' }}>สถานะ</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp: any) => (
                  <tr key={emp.payroll_id}>
                    <td>
                      <div className="emp-info">
                        <div className="emp-avatar">
                          {emp.image ? <img src={`/uploads/${emp.image}`} alt="avatar" /> : <div className="avatar-placeholder" />}
                        </div>
                        <div>
                          <div className="emp-name">{emp.prefix}{emp.first_name_th}</div>
                          <div className="emp-id">รหัส: {emp.emp_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="dept-badge">{emp.dept_name || '-'}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#64748b' }}>฿{Number(emp.base_salary).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      {/* Simple mock conversion: assume 150 THB per hr for visual sake */}
                      {Number(emp.ot_amount) > 0 ? (
                        <span className="ot-badge">{Math.ceil(Number(emp.ot_amount)/150)}h</span>
                      ) : <span style={{ color: '#cbd5e1' }}>-</span>}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: emp.night_shift_amount > 0 ? '#10b981' : 'inherit' }}>
                      {emp.night_shift_amount > 0 ? `฿${Number(emp.night_shift_amount).toLocaleString()}` : '฿0.00'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>฿{Number(emp.net_salary).toLocaleString()}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`status-text ${emp.status?.toLowerCase()}`}>
                        <span className="dot" /> {formatStatus(emp.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="action-btn" onClick={() => router.push(`/payroll/process?month=${data.targetMonth}&year=${data.targetYear}`)}>
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && !isLoading && (
                  <tr><td colSpan={8} className="empty-row">ไม่พบข้อมูลสำหรับตัวกรองที่เลือก</td></tr>
                )}
                {isLoading && (
                  <tr><td colSpan={8} className="empty-row">กำลังโหลดข้อมูล...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Modal */}
        {showGenerateModal && (
          <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">เริ่มรอบเงินเดือนใหม่</h2>
              <div className="modal-form-group">
                <label>เลือกเดือน</label>
                <select className="form-select" value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                  {MONTHS_TH.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="modal-form-group">
                <label>เลือกปี (ค.ศ.)</label>
                <input type="number" className="form-input" value={genYear} onChange={e => setGenYear(Number(e.target.value))} />
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowGenerateModal(false)}>ยกเลิก</button>
                <button className="btn-confirm" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'กำลังสร้าง...' : 'ยืนยันสร้างรอบเงินเดือน'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .finance-dashboard { padding: 40px; background: #eef2f6; min-height: 100vh; font-family: 'Inter', 'Sarabun', sans-serif; gap: 32px; display: flex; flex-direction: column; }
        
        .fd-header { display: flex; justify-content: space-between; align-items: center; }
        .fd-title { font-size: 30px; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
        .fd-actions { display: flex; gap: 16px; align-items: center; }
        
        .search-bar { display: flex; align-items: center; background: white; border-radius: 12px; padding: 10px 16px; width: 300px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: 0.2s; }
        .search-bar:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .search-icon { color: #94a3b8; display: flex; align-items: center; }
        .search-bar input { border: none; outline: none; margin-left: 10px; font-family: inherit; width: 100%; color: #334155; font-size: 14px; }
        
        .export-btn { display: flex; align-items: center; gap: 12px; border: none; border-radius: 12px; padding: 10px 20px; cursor: pointer; text-align: left; transition: 0.2s; }
        .export-btn.outline { background: white; color: #475569; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .export-btn.outline:hover { background: #f8fafc; }
        .export-btn.primary { background: #3b82f6; color: white; box-shadow: 0 4px 10px rgba(59,130,246,0.25); }
        .export-btn.primary:hover { background: #2563eb; }
        .export-btn .icon { font-size: 20px; display: flex; }
        .export-btn .btn-text strong { display: block; font-size: 14px; font-weight: 700; line-height: 1.2; }
        .export-btn .btn-text span { display: block; font-size: 10px; opacity: 0.8; }
        
        .fd-cards-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        .stat-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; display: flex; flex-direction: column; }
        .sc-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .sc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .sc-icon.blue { background: #e0f2fe; color: #0284c7; }
        .sc-icon.orange { background: #ffedd5; color: #c2410c; }
        .sc-icon.purple { background: #f3e8ff; color: #7e22ce; }
        .sc-titles { display: flex; flex-direction: column; gap: 2px; }
        .sc-title-en { font-size: 16px; font-weight: 800; color: #1e293b; letter-spacing: 0.5px; }
        .sc-title-th { font-size: 11px; color: #64748b; font-weight: 500; }
        .sc-value { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.5px; line-height: 1; }
        .sc-trend { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; display: inline-flex; align-items: center; align-self: flex-start; }
        .sc-trend.positive { background: #dcfce7; color: #16a34a; }
        .sc-trend.negative { background: #fee2e2; color: #ef4444; }
        .sc-trend span { color: #64748b; font-weight: 500; margin-left: 6px; }
        
        .action-card { background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 24px; color: white; position: relative; overflow: hidden; box-shadow: 0 10px 20px rgba(15,23,42,0.2); }
        .action-card.paid-ready { background: linear-gradient(135deg, #064e3b, #0f766e); }
        .ac-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .ac-icon { display: flex; color: #fbbf24; }
        .ac-badge { background: rgba(251, 191, 36, 0.2); color: #fbbf24; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.4); }
        .ac-badge.green { background: rgba(16, 185, 129, 0.2); color: #34d399; border-color: rgba(16, 185, 129, 0.4); }
        .ac-title { font-size: 15px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
        .action-card.paid-ready .ac-title { color: #a7f3d0; }
        .ac-requests { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; }
        .ac-big-num { font-size: 32px; font-weight: 800; color: white; line-height: 1; }
        .ac-sub-text { font-size: 11px; color: #94a3b8; text-align: right; line-height: 1.4; }
        .action-card.paid-ready .ac-sub-text { color: #a7f3d0; }
        .action-card.paid-ready .ac-icon { color: #34d399; }
        
        .btn-review { width: 100%; background: white; color: #0f172a; border: none; padding: 12px; border-radius: 12px; font-weight: 800; font-size: 15px; cursor: pointer; display: flex; flex-direction: column; align-items: center; line-height: 1.2; transition: 0.2s; }
        .btn-review:hover:not(:disabled) { background: #f8fafc; transform: translateY(-2px); }
        .btn-review.green { background: #10b981; color: white; }
        .btn-review.green:hover:not(:disabled) { background: #059669; }
        .btn-review.green span { color: #a7f3d0; }
        .btn-review:disabled { cursor: not-allowed; opacity: 0.7; }
        .btn-review span { font-size: 10px; font-weight: 600; color: #64748b; margin-top: 2px; }
        
        .fd-charts-row { display: flex; gap: 24px; }
        .flex-2 { flex: 2; }
        .flex-1 { flex: 1; }
        .chart-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .ch-th { font-size: 12px; color: #64748b; font-weight: 600; }
        .ch-en { font-size: 18px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
        .ch-filters { display: flex; background: #f1f5f9; border-radius: 8px; overflow: hidden; padding: 4px; }
        .ch-filters span { padding: 6px 16px; text-align: center; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 6px; }
        .ch-filters span.active { background: white; color: #0f172a; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .empty-chart { height: 100%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-weight: 600; }
        
        .fd-table-card { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .tb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .tb-header-left { display: flex; align-items: center; gap: 24px; }
        .tb-title { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .tb-subtitle { font-size: 13px; color: #64748b; font-weight: 500; }
        
        .tb-filters { display: flex; gap: 16px; align-items: center; }
        .tb-count { background: #f0f9ff; padding: 8px 16px; border-radius: 12px; border: 1px solid #bae6fd; display: flex; flex-direction: column; align-items: center; }
        .tb-count .num { font-size: 15px; font-weight: 800; color: #0284c7; }
        .tb-count .num span { font-weight: 600; font-size: 12px; }
        
        .filter-group { display: flex; align-items: center; background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 16px; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .fg-icon { color: #94a3b8; display: flex; }
        .filter-group select { border: none; font-size: 13px; font-weight: 600; font-family: inherit; color: #334155; outline: none; background: transparent; cursor: pointer; }
        
        .tb-container { overflow-x: auto; margin-top: 10px; }
        .tb-container table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px; }
        .tb-container th { text-align: left; padding: 16px; border-bottom: 2px solid #e2e8f0; font-size: 13px; font-weight: 800; color: #1e293b; }
        .tb-container th span { font-weight: 600; color: #1e293b; display: block; margin-top: 4px; }
        .tb-container td { padding: 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; vertical-align: middle; }
        .tb-container tbody tr { transition: background 0.2s; }
        .tb-container tbody tr:hover { background: #f8fafc; }
        .empty-row { text-align: center; padding: 60px !important; color: #94a3b8; font-weight: 500; }
        
        .emp-info { display: flex; align-items: center; gap: 16px; }
        .emp-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: #e2e8f0; flex-shrink: 0; }
        .emp-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .avatar-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #cbd5e1, #94a3b8); }
        .emp-name { font-weight: 700; color: #1e293b; font-size: 15px; }
        .emp-id { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px; }
        
        .dept-badge { background: #f1f5f9; color: #475569; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: inline-block; white-space: nowrap; }
        .ot-badge { background: #dbeafe; color: #2563eb; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block; box-shadow: inset 0 0 0 1px #bfdbfe; }
        
        .status-text { font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; text-transform: capitalize; }
        .status-text .dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-text.paid { color: #10b981; }
        .status-text.paid .dot { background: #10b981; box-shadow: 0 0 0 3px #d1fae5; }
        .status-text.approved { color: #3b82f6; }
        .status-text.approved .dot { background: #3b82f6; box-shadow: 0 0 0 3px #dbeafe; }
        .status-text.draft, .status-text.pending { color: #64748b; }
        .status-text.draft .dot, .status-text.pending .dot { background: #94a3b8; box-shadow: 0 0 0 3px #e2e8f0; }
        
        .action-btn { background: #f1f5f9; border: none; color: #64748b; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .action-btn:hover { background: #e2e8f0; color: #0f172a; }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: white; width: 440px; border-radius: 20px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .modal-title { font-size: 20px; font-weight: 800; margin: 0 0 24px 0; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; }
        .modal-form-group { margin-bottom: 20px; }
        .modal-form-group label { display: block; margin-bottom: 8px; font-size: 14px; font-weight: 700; color: #475569; }
        .form-select, .form-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 15px; font-family: inherit; background: #fff; transition: 0.2s; box-sizing: border-box; }
        .form-select:focus, .form-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .modal-actions { display: flex; gap: 12px; margin-top: 32px; }
        .btn-cancel { flex: 1; background: #f1f5f9; color: #475569; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-cancel:hover { background: #e2e8f0; }
        .btn-confirm { flex: 2; background: #3b82f6; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .btn-confirm:hover { background: #2563eb; }
        .btn-confirm:disabled { opacity: 0.7; cursor: not-allowed; }

        .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #eaebef; }
      `}} />
    </AppLayout>
  );
}