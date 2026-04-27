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
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Generate fiscal year options (e.g. current - 2 to current + 10)
  const fyOptions = useMemo(() => {
    const options = [];
    for (let i = currentFY - 2; i <= currentFY + 10; i++) {
      options.push(i);
    }
    return options;
  }, [currentFY]);

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
    if (selectedDept === 'all') return data.employees;
    return data.employees.filter((emp: any) => emp.dept_id === selectedDept);
  }, [data, selectedDept]);

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
          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#e0f2fe', color: '#0284c7', borderRadius: '16px' }}>
              <Users size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>เกษียณอายุทั้งหมด</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{data?.total_retiring || 0} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>คน</span></div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#dcfce7', color: '#16a34a', borderRadius: '16px' }}>
              <Calendar size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>ปีงบประมาณที่เลือก</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>พ.ศ. {fiscalYear}</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '16px', background: '#fef9c3', color: '#ca8a04', borderRadius: '16px' }}>
              <Briefcase size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>หน่วยงานที่มีผู้เกษียณ</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a' }}>{data?.summary_by_dept?.length || 0} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>แผนก</span></div>
            </div>
          </div>
        </div>

        {/* Filters and Table */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>รายชื่อผู้เกษียณอายุ</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 600, color: '#334155' }}>กรองตามแผนก:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', minWidth: '200px' }} 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="all">ทุกแผนก</option>
                {data?.summary_by_dept?.map((dept: any) => (
                  <option key={dept.dept_id} value={dept.dept_id}>{dept.dept_name} ({dept.count} คน)</option>
                ))}
              </select>
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
                    <tr key={emp.emp_id} style={{ transition: 'all 0.2s' }}>
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
