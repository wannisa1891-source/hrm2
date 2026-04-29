'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import Image from 'next/image';
import { Calendar, Users, Briefcase, Award, ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function RetirementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = ['Admin', 'HR', 'หัวหน้า'].includes(user?.role || '');

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  // Calculate current fiscal year
  const today = new Date();
  let currentFY = today.getFullYear() + 543;
  if (today.getMonth() >= 9) { // Oct
    currentFY += 1;
  }

  const [fiscalYear, setFiscalYear] = useState<number>(currentFY);
  const [filterDiv, setFilterDiv] = useState<string>('all');
  const [filterGrp, setFilterGrp] = useState<string>('all');
  const [filterPos, setFilterPos] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [posSearch, setPosSearch] = useState<string>('');
  const [isPosOpen, setIsPosOpen] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fyOptions = useMemo(() => {
    const options = [];
    for (let i = 2560; i <= 2600; i++) {
      options.push(i);
    }
    return options;
  }, []);



  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const fetchRetirementData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/retirement?fiscal_year=${fiscalYear}`);
      const resData = await res.json();
      setData(resData);
    } catch (err) {
      console.error('Error fetching retirement data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetirementData();
  }, [fiscalYear]);

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    return data.employees.filter((emp: any) => {
      const dept = departments.find(d => d.dept_id === emp.dept_id);
      const matchDept = (filterDiv === 'all' || dept?.division === filterDiv) &&
        (filterGrp === 'all' || dept?.dept_name === filterGrp);
      const matchPos = filterPos === 'all' || emp.pos_id === filterPos || emp.pos_name === filterPos;

      const matchSearch = !search
        ? true
        : search.length === 1
          ? (emp.first_name_th?.toLowerCase().startsWith(search.toLowerCase()) ||
            emp.last_name_th?.toLowerCase().startsWith(search.toLowerCase()) ||
            emp.emp_id?.toLowerCase().startsWith(search.toLowerCase()) ||
            emp.pos_name?.toLowerCase().startsWith(search.toLowerCase()))
          : `${emp.first_name_th} ${emp.last_name_th} ${emp.pos_name || ''}`.toLowerCase().includes(search.toLowerCase());

      return matchDept && matchPos && matchSearch;
    });
  }, [data, filterDiv, filterGrp, filterPos, search, departments]);

  const breakdownData = useMemo(() => {
    if (!data?.employees) return [];
    const hierarchy: { [key: string]: { count: number, departments: { [key: string]: number } } } = {};

    data.employees.forEach((emp: any) => {
      const dept = departments.find(d => d.dept_id === emp.dept_id);
      const divName = dept?.division || 'ไม่ระบุกลุ่มงาน';
      const deptName = dept?.dept_name || 'ไม่ระบุแผนก';

      if (!hierarchy[divName]) {
        hierarchy[divName] = { count: 0, departments: {} };
      }
      hierarchy[divName].count += 1;
      hierarchy[divName].departments[deptName] = (hierarchy[divName].departments[deptName] || 0) + 1;
    });

    return Object.entries(hierarchy).map(([divName, details]) => ({
      name: divName,
      count: details.count,
      departments: Object.entries(details.departments).map(([deptName, count]) => ({
        name: deptName,
        count
      })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => b.count - a.count);
  }, [data, departments]);

  const exportToExcel = () => {
    if (!filteredEmployees.length) return;

    const exportData = filteredEmployees.map((emp: any) => ({
      'รหัสพนักงาน': emp.emp_id,
      'คำนำหน้า': emp.prefix,
      'ชื่อ': emp.first_name_th,
      'นามสกุล': emp.last_name_th,
      'ตำแหน่ง': emp.pos_name || '-',
      'หน่วยงาน': emp.dept_name || '-',
      'วันเกิด': emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
      'ปีงบประมาณที่เกษียณ': emp.retirement_year_be,
      'วันเกษียณอายุ': emp.retirement_date ? new Date(emp.retirement_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Retirement');
    XLSX.writeFile(workbook, `retirement_report_FY${fiscalYear}.xlsx`);
  };

  if (user && !isAdmin) {
    return null;
  }

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header" style={{ marginBottom: '32px' }}>
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer', marginBottom: '12px' }}
            >
              <ArrowLeft size={18} /> ย้อนกลับไปหน้าแดชบอร์ด
            </button>
            <h1 className="page-title">รายงานการเกษียณอายุ</h1>
            <div className="page-subtitle">ตรวจสอบข้อมูลบุคลากรที่จะเกษียณอายุตามปีงบประมาณ</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>ปีงบประมาณ (พ.ศ.):</span>
              <select
                className="form-select"
                style={{ width: 'auto', minWidth: '120px' }}
                value={fiscalYear}
                onChange={(e) => setFiscalYear(Number(e.target.value))}
              >
                {fyOptions.map(fy => (
                  <option key={fy} value={fy}>{fy}</option>
                ))}
              </select>
            </div>
            <button
              className="btn-outline hover-glow"
              onClick={exportToExcel}
              disabled={filteredEmployees.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={18} /> ดาวน์โหลด EXCEL
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div
            className="glass-card hover-glow"
            onClick={() => { setFilterDiv('all'); setFilterGrp('all'); setFilterPos('all'); }}
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ padding: '16px', background: '#e0f2fe', color: '#0284c7', borderRadius: '16px' }}>
              <Users size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>เกษียณอายุทั้งหมด</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{data?.total_retiring || 0} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>คน</span></div>
            </div>
          </div>

          <div
            className="glass-card hover-glow"
            onClick={() => { setFilterDiv('all'); setFilterGrp('all'); setFilterPos('all'); }}
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ padding: '16px', background: '#dcfce7', color: '#16a34a', borderRadius: '16px' }}>
              <Calendar size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>ปีงบประมาณที่เลือก</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>พ.ศ. {fiscalYear}</div>
            </div>
          </div>

          <div
            className="glass-card hover-glow"
            onClick={() => { setFilterDiv('all'); setFilterGrp('all'); setFilterPos('all'); }}
            style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}
          >
            <div style={{ padding: '16px', background: '#fef9c3', color: '#ca8a04', borderRadius: '16px' }}>
              <Briefcase size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>หน่วยงานที่มีผู้เกษียณ</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{data?.summary_by_dept?.length || 0} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>แผนก</span></div>
            </div>
          </div>
        </div>

        {/* Split Container: Breakdown on Left, Table on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px', alignItems: 'start', marginBottom: '32px' }}>
          {/* Left Column: Group/Dept breakdown */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '4px' }} />
              สัดส่วนผู้เกษียณ แยกตามกลุ่มงานและแผนก (ปีงบประมาณ {fiscalYear})
            </h4>
            {breakdownData.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>ไม่มีข้อมูล</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto' }} className="custom-scrollbar">
                {breakdownData.map((div: any, idx: number) => (
                  <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{div.name}</span>
                      <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '16px' }}>รวม {div.count} คน</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {div.departments.map((dept: any, didx: number) => (
                        <div key={didx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: 'white', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>• {dept.name}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>{dept.count} คน</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Filters and Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>รายชื่อผู้เกษียณอายุ</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-input-wrap" style={{ flex: '1 1 200px', minWidth: '220px', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', alignItems: 'center', padding: '0 12px', background: 'white', height: '42px' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#64748b" style={{ marginRight: '8px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ หรือตำแหน่ง..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ border: 'none', outline: 'none', width: '100%', padding: '10px 0', fontSize: '14px', background: 'transparent' }}
                  />
                </div>
                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '140px' }}
                  value={filterDiv}
                  onChange={e => { setFilterDiv(e.target.value); setFilterGrp('all'); }}
                >
                  <option value="all">ทุกกลุ่มงาน</option>
                  {Array.from(new Set(departments.map(d => String(d.division || '').trim())))
                    .filter(Boolean)
                    .sort((a, b) => {
                      const numA = parseInt(a.match(/^\d+/)?.[0] || '999');
                      const numB = parseInt(b.match(/^\d+/)?.[0] || '999');
                      return numA - numB || a.localeCompare(b, 'th');
                    })
                    .map(div => (
                      <option key={div as string} value={div as string}>{div as string}</option>
                    ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '140px' }}
                  value={filterGrp}
                  onChange={e => setFilterGrp(e.target.value)}
                  disabled={filterDiv === 'all'}
                >
                  <option value="all">ทุกแผนก</option>
                  {Array.from(new Set(departments.filter(d => String(d.division || '').trim() === filterDiv).map(d => String(d.dept_name || '').trim())))
                    .filter(Boolean)
                    .sort((a, b) => a.localeCompare(b, 'th'))
                    .map(grp => (
                      <option key={grp as string} value={grp as string}>{grp as string}</option>
                    ))}
                </select>

                {/* Custom Searchable Typeable Dropdown */}
                <div style={{ position: 'relative', width: 'auto', minWidth: '220px' }}>
                  <input
                    type="text"
                    className="form-select"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', background: 'white' }}
                    placeholder="พิมพ์ค้นหาตำแหน่ง..."
                    value={posSearch || (filterPos === 'all' ? '' : (positions.find(p => p.pos_id === filterPos)?.pos_name || filterPos))}
                    onFocus={() => setIsPosOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPosSearch(val);
                      setIsPosOpen(true);

                      const found = positions.find(p => p.pos_name === val);
                      if (found) {
                        setFilterPos(found.pos_id);
                      } else if (val === '') {
                        setFilterPos('all');
                      }
                    }}
                  />
                  {isPosOpen && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)', zIndex: 100, padding: '6px' }}>
                      <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }} className="custom-scrollbar">
                        <div
                          onClick={() => { setFilterPos('all'); setPosSearch(''); setIsPosOpen(false); }}
                          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: filterPos === 'all' ? '#eff6ff' : 'transparent', color: filterPos === 'all' ? '#1d4ed8' : '#334155', fontWeight: filterPos === 'all' ? 700 : 500, fontSize: '13px' }}
                          onMouseEnter={e => { if (filterPos !== 'all') e.currentTarget.style.background = '#f1f5f9'; }}
                          onMouseLeave={e => { if (filterPos !== 'all') e.currentTarget.style.background = 'transparent'; }}
                        >
                          ทุกตำแหน่ง
                        </div>
                        {positions
                          .filter((p: any) => !posSearch || p.pos_name.toLowerCase().includes(posSearch.toLowerCase()))
                          .map((p: any) => (
                            <div
                              key={p.pos_id}
                              onClick={() => { setFilterPos(p.pos_id); setPosSearch(p.pos_name); setIsPosOpen(false); }}
                              style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: filterPos === p.pos_id ? '#eff6ff' : 'transparent', color: filterPos === p.pos_id ? '#1d4ed8' : '#334155', fontWeight: filterPos === p.pos_id ? 700 : 500, fontSize: '13px' }}
                              onMouseEnter={e => { if (filterPos !== p.pos_id) e.currentTarget.style.background = '#f1f5f9'; }}
                              onMouseLeave={e => { if (filterPos !== p.pos_id) e.currentTarget.style.background = 'transparent'; }}
                            >
                              {p.pos_name}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  {/* Clicking outside closes popup */}
                  {isPosOpen && <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 90 }} onClick={() => setIsPosOpen(false)} />}
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
            ) : filteredEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>ไม่มีข้อมูลผู้เกษียณอายุในปีงบประมาณนี้</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center', width: '80px' }}>รูปภาพ</th>
                      <th>ชื่อ-สกุล</th>
                      <th>ตำแหน่ง</th>
                      <th>หน่วยงาน</th>
                      <th style={{ textAlign: 'center' }}>วันเกิด</th>
                      <th style={{ textAlign: 'center' }}>วันเกษียณอายุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp: any) => (
                      <tr
                        key={emp.emp_id}
                        onClick={() => router.push(`/profile?emp_id=${emp.emp_id}`)}
                        style={{ transition: 'all 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ width: '40px', height: '40px', position: 'relative', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            {emp.image ? (
                              <Image fill src={`/uploads/${emp.image}`} alt="" style={{ objectFit: 'cover' }} unoptimized />
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '16px' }}>👤</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>
                            {emp.prefix}{emp.first_name_th} {emp.last_name_th}
                          </div>
                        </td>
                        <td style={{ color: '#334155', fontWeight: 500 }}>{emp.pos_name || '-'}</td>
                        <td>{emp.dept_name || '-'}</td>
                        <td style={{ textAlign: 'center', color: '#64748b' }}>
                          {emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ padding: '4px 12px', background: '#fee2e2', color: '#dc2626', borderRadius: '20px', fontWeight: 700, fontSize: '13px', display: 'inline-block' }}>
                            1 ตุลาคม {emp.retirement_year_be}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
