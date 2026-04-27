'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useDepartments } from '@/hooks/useDepartments';
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

  // Generate fiscal year options (e.g. current - 2 to current + 10)
  const fyOptions = useMemo(() => {
    const options = [];
    for (let i = currentFY - 5; i <= currentFY + 30; i++) {
      options.push(i);
    }
    return options;
  }, [currentFY]);

  const positions = useMemo(() => {
    if (!data?.employees) return [];
    const unique = new Map();
    data.employees.forEach((emp: any) => {
      if (emp.pos_id && emp.pos_name) {
        if (!unique.has(emp.pos_id)) {
          unique.set(emp.pos_id, { pos_id: emp.pos_id, pos_name: emp.pos_name, count: 0 });
        }
        unique.get(emp.pos_id).count += 1;
      } else if (emp.pos_name) {
        if (!unique.has(emp.pos_name)) {
          unique.set(emp.pos_name, { pos_id: emp.pos_name, pos_name: emp.pos_name, count: 0 });
        }
        unique.get(emp.pos_name).count += 1;
      }
    });
    return Array.from(unique.values()) as any[];
  }, [data]);

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
      
      const searchStr = `${emp.first_name_th} ${emp.last_name_th} ${emp.pos_name || ''}`.toLowerCase();
      const matchSearch = !search || searchStr.includes(search.toLowerCase());

      return matchDept && matchPos && matchSearch;
    });
  }, [data, filterDiv, filterGrp, filterPos, search, departments]);

  const breakdownData = useMemo(() => {
    if (!data?.employees) return { divisions: [], departments: [] };
    const divCounts: { [key: string]: number } = {};
    const deptCounts: { [key: string]: number } = {};
    
    data.employees.forEach((emp: any) => {
      const dept = departments.find(d => d.dept_id === emp.dept_id);
      const divName = dept?.division || 'ไม่ระบุกลุ่มงาน';
      const deptName = dept?.dept_name || 'ไม่ระบุแผนก';
      
      divCounts[divName] = (divCounts[divName] || 0) + 1;
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    });
    
    const divisions = Object.entries(divCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const depts = Object.entries(deptCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    
    return { divisions, departments: depts };
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
      'วันเกิด': emp.birth_date ? new Date(emp.birth_date).toLocaleDateString('th-TH') : '-',
      'ปีงบประมาณที่เกษียณ': emp.retirement_year_be,
      'วันเกษียณอายุ': emp.retirement_date ? new Date(emp.retirement_date).toLocaleDateString('th-TH') : '-'
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

        {/* Breakdown Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '32px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '16px', background: '#3b82f6', borderRadius: '4px' }} />
              สถิติผู้เกษียณ แยกตามกลุ่มงาน
            </h4>
            {breakdownData.divisions.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>ไม่มีข้อมูล</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {breakdownData.divisions.map((div, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{div.name}</span>
                    <span style={{ fontWeight: 800, color: '#2563eb', fontSize: '16px' }}>{div.count} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>คน</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '4px', height: '16px', background: '#10b981', borderRadius: '4px' }} />
              สถิติผู้เกษียณ แยกตามแผนก
            </h4>
            {breakdownData.departments.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>ไม่มีข้อมูล</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                {breakdownData.departments.map((dept, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{dept.name}</span>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: '16px' }}>{dept.count} <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>คน</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
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

              {/* Searchable Position Dropdown */}
              <div style={{ position: 'relative', width: 'auto', minWidth: '180px' }}>
                <div 
                  className="form-select" 
                  onClick={() => setIsPosOpen(!isPosOpen)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'white', gap: '8px', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                >
                  <span style={{ fontSize: '14px', color: '#1e293b' }}>
                    {filterPos === 'all' ? 'ทุกตำแหน่ง' : (positions.find(p => p.pos_id === filterPos)?.pos_name || filterPos)}
                  </span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#475569" style={{ transform: isPosOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'all 0.2s' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {isPosOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)', zIndex: 100, padding: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="พิมพ์ชื่อตำแหน่ง..." 
                      value={posSearch} 
                      onChange={e => setPosSearch(e.target.value)} 
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', outline: 'none', marginBottom: '8px', background: '#f8fafc' }}
                    />
                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }} className="custom-scrollbar">
                      <div 
                        onClick={() => { setFilterPos('all'); setIsPosOpen(false); setPosSearch(''); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: filterPos === 'all' ? '#eff6ff' : 'transparent', color: filterPos === 'all' ? '#1d4ed8' : '#334155', fontWeight: filterPos === 'all' ? 700 : 500, fontSize: '13px', transition: 'all 0.1s' }}
                        onMouseEnter={e => { if(filterPos !== 'all') e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseLeave={e => { if(filterPos !== 'all') e.currentTarget.style.background = 'transparent'; }}
                      >
                        ทุกตำแหน่ง
                      </div>
                      {positions.filter(p => !posSearch || p.pos_name.toLowerCase().includes(posSearch.toLowerCase())).map((p: any) => (
                        <div 
                          key={p.pos_id}
                          onClick={() => { setFilterPos(p.pos_id); setIsPosOpen(false); setPosSearch(''); }}
                          style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: filterPos === p.pos_id ? '#eff6ff' : 'transparent', color: filterPos === p.pos_id ? '#1d4ed8' : '#334155', fontWeight: filterPos === p.pos_id ? 700 : 500, fontSize: '13px', transition: 'all 0.1s' }}
                          onMouseEnter={e => { if(filterPos !== p.pos_id) e.currentTarget.style.background = '#f1f5f9'; }}
                          onMouseLeave={e => { if(filterPos !== p.pos_id) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {p.pos_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    <th style={{ textAlign: 'center' }}>รหัสพนักงาน</th>
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
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ padding: '4px 8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'inline-block', fontWeight: 600, color: '#334155' }}>
                          {emp.emp_id}
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
    </AppLayout>
  );
}
