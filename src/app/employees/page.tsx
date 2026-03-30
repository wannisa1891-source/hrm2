'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee, ProfessionalLicense } from '@/services/apiService';
import { useSearchParams, useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeFormModal from '@/components/employees/EmployeeFormModal';
import Image from 'next/image';

const EMPTY_FORM: Partial<Employee> = {
  prefix: 'นาย', first_name_th: '', last_name_th: '', first_name_en: '', last_name_en: '',
  birth_date: '', gender: 'ชาย', citizen_id: '',
  emp_id: '', dept_id: '', pos_id: '', emp_type: 'พนักงานประจำ', start_date: '', base_salary: 0,
  phone: '', address: '', status: 'Active',
  addr_no: '', addr_moo: '', addr_village: '', addr_soi: '', addr_road: '', addr_province: '', addr_district: '', addr_subdistrict: '', addr_zipcode: '',
  has_license: false, email: '', password: '', role: 'User', cneu_cme_points: 0, licenses: []
};

function EmployeesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role || '');
  
  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isAdmin, router]);

  const { employees, loading, error, loadEmployees, addEmployee, editEmployee, removeEmployee } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filterDept, setFilterDept] = useState('all');
  const [filterPos, setFilterPos] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLicense, setFilterLicense] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee> | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [selectedEmpForCard, setSelectedEmpForCard] = useState<Employee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPrinting, setIsBulkPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Employee_ID_Card',
  });

  const handleResetPassword = async (emp: Employee) => {
    const result = await Swal.fire({
      title: 'ยืนยันการรีเซ็ตรหัสผ่าน',
      text: `คุณต้องการรีเซ็ตรหัสผ่านและส่งอีเมลแจ้ง ${emp.first_name_th} ${emp.last_name_th} ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3085d6'
    });
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`/api/employees/${emp.emp_id}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        Swal.fire('สำเร็จ', data.message, 'success');
      } else {
        Swal.fire(' เกิดข้อผิดพลาด', data.error, 'error');
      }
    } catch (err) {
      Swal.fire(' เกิดข้อผิดพลาด', 'ข้อผิดพลาดในการเชื่อมต่อ', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawJsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      if (rawJsonData.length === 0) {
        Swal.fire('แจ้งเตือน', 'ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า', 'warning');
        return;
      }

      // Clean up headers (trim whitespace and invisible characters)
      const jsonData = rawJsonData.map(row => {
        const cleanRow: any = {};
        Object.keys(row).forEach(k => {
          const cleanKey = k.replace(/^\ufeff/g, '').trim(); // Remove BOM and trim
          const val = row[k];
          cleanRow[cleanKey] = typeof val === 'string' ? val.trim() : val;
        });
        return cleanRow;
      });

      // Map Thai headers from our normal export template
      const mappedData = jsonData.map((row, index) => {
        // Fix matching when names have extra spaces
        const deptName = row['แผนก']?.toString().trim() || row['แผนก/สังกัด']?.toString().trim() || '';
        const dept = departments.find(d => d.dept_name.trim() === deptName || d.dept_id === deptName);

        const posName = row['ตำแหน่ง']?.toString().trim() || '';
        const pos = positions.find(p => p.pos_name.trim() === posName || p.pos_id === posName);

        return {
          emp_id: row['รหัสพนักงาน'] || row['emp_id'] || '',
          prefix: row['คำนำหน้า'] || row['prefix'] || '',
          first_name_th: row['ชื่อ (TH)'] || row['ชื่อ(TH)'] || row['ชื่อ'] || row['first_name_th'] || '',
          last_name_th: row['นามสกุล (TH)'] || row['นามสกุล(TH)'] || row['นามสกุล'] || row['last_name_th'] || '',
          first_name_en: row['ชื่อ (EN)'] || row['first_name_en'] || '',
          last_name_en: row['นามสกุล (EN)'] || row['last_name_en'] || '',
          gender: row['เพศ'] || row['gender'] || 'ชาย',
          birth_date: row['วัน/เดือน/ปีเกิด'] || row['วันเกิด'] || row['birth_date'] || null,
          citizen_id: row['บัตรประชาชน'] || row['เลขบัตรประชาชน'] || row['citizen_id'] || '',
          phone: row['เบอร์โทร'] || row['เบอร์โทรศัพท์'] || row['phone'] || '',
          email: row['อีเมล'] || row['อีเมลล์'] || row['email'] || '',
          address: row['ที่อยู่'] || row['address'] || '',
          emp_type: row['ประเภทพนักงาน'] || row['ประเภทการจ้างงาน'] || row['emp_type'] || 'พนักงานประจำ',
          start_date: row['วันที่เริ่มงาน'] || row['start_date'] || null,
          base_salary: row['เงินเดือน'] || row['ฐานเงินเดือน'] || row['base_salary'] || 0,
          dept_id: dept ? dept.dept_id : null,
          pos_id: pos ? pos.pos_id : null,
        };
      }).filter(r => r.emp_id || r.first_name_th); // Filter out empty rows often generated by excel

      // Simple validation for the first row to ensure they used correct headers
      const firstRow = mappedData[0];
      if (!firstRow.emp_id && !firstRow.first_name_th) {
        Swal.fire('ข้อผิดพลาด', 'ตรวจสอบพบว่าหัวคอลัมน์ในไฟล์ Excel ไม่ตรงกับรูปแบบที่ระบบต้องการครับ (ต้องมี รหัสพนักงาน, ชื่อ (TH), แผนก, ตำแหน่ง)', 'error');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const res = await fetch('/api/employees/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedData)
      });
      const resData = await res.json();
      if (res.ok) {
        if (resData.successCount === 0 && resData.errorCount > 0) {
          Swal.fire({
            title: 'นำเข้าล้มเหลว!',
            html: `
              <div style="margin-bottom: 12px;">ไม่สามารถนำเข้าข้อมูลได้เลย</div>
              <div style="margin-bottom: 16px;">ผิดพลาด: <b>${resData.errorCount}</b> รายการ</div>
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 0 24px; color: #dc2626; font-size: 13px; text-align: center; align-items: center; max-height: 200px; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px;">
                ${resData.errors?.map((err: string) => `<div>• ${err}</div>`).join('') || ''}
              </div>
            `,
            icon: 'error'
          });
        } else if (resData.errorCount > 0 && resData.successCount > 0) {
          Swal.fire({
            title: 'นำเข้าสำเร็จบางส่วน',
            html: `
              <div style="margin-bottom: 12px;">สำเร็จ: <b>${resData.successCount}</b> รายการ</div>
              <div style="margin-bottom: 16px;">ผิดพลาด: <b>${resData.errorCount}</b> รายการ</div>
              <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px; margin: 0 24px; color: #d97706; font-size: 13px; text-align: center; align-items: center; max-height: 200px; overflow-y: auto; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px;">
                ${resData.errors?.map((err: string) => `<div>• ${err}</div>`).join('') || ''}
              </div>
            `,
            icon: 'warning'
          });
          loadEmployees();
        } else {
          Swal.fire({
            title: 'นำเข้าสำเร็จสมบูรณ์!',
            html: `นำเข้าข้อมูลพนักงาน <b>${resData.successCount}</b> รายการเรียบร้อยแล้ว`,
            icon: 'success'
          });
          loadEmployees();
        }
      } else {
        Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการรัน API: ' + resData.error, 'error');
      }
    } catch (err: any) {
      Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอ่านไฟล์เอ็กเซล: ' + err.message, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, [loadEmployees, loadDepartments, loadPositions]);

  const getDeptName = (id: string) => departments.find(d => d.dept_name === id)?.dept_name || id;
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  const filteredData = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = `${e.first_name_th} ${e.last_name_th} ${e.emp_id}`.toLowerCase().includes(search.toLowerCase());
      const matchDept = filterDept === 'all' || e.dept_id === filterDept;
      const matchPos = filterPos === 'all' || e.pos_id === filterPos;
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;

      const primaryStatus = e.license_status;
      const matchLicense = filterLicense === 'all' || primaryStatus === filterLicense || (!primaryStatus && filterLicense === 'None');

      return matchSearch && matchDept && matchPos && matchStatus && matchLicense;
    });
  }, [employees, search, filterDept, filterPos, filterStatus, filterLicense]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, emp_id: '', licenses: [{ status: 'Active' }] });
    setIsEditing(false);
    setViewMode(false);
    setShowForm(true);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(currentData.map(emp => emp.emp_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (emp_id: string) => {
    setSelectedIds(prev =>
      prev.includes(emp_id) ? prev.filter(id => id !== emp_id) : [...prev, emp_id]
    );
  };

  const handleBulkPrint = () => {
    setIsBulkPrinting(true);
    setShowIdCard(true);
  };

  const openEdit = (emp: Employee) => {
    setFormData({ ...emp, citizen_id: emp.citizen_id || '', licenses: emp.licenses || [] });
    setIsEditing(true);
    setViewMode(false);
    setShowForm(true);
  };

  const openView = (emp: Employee) => {
    const isOwnProfile = user?.emp_id === emp.emp_id || user?.username === emp.emp_id || (user as any)?.name === emp.emp_id;
    if (!isAdmin && !isOwnProfile) {
      Swal.fire('ปฏิเสธการเข้าถึง', 'คุณไม่มีสิทธิ์เข้าดูรายละเอียดของพนักงานท่านอื่น', 'warning');
      return;
    }
    setFormData({ ...emp, citizen_id: emp.citizen_id || '', licenses: emp.licenses || [] });
    setIsEditing(false);
    setViewMode(true);
    setShowForm(true);
  };

  const handleSaveWrapper = async (fd: FormData, editing: boolean, empId?: string) => {
    let res: { success: boolean, message?: string };
    if (editing) {
      if (!empId) return { success: false, message: 'Employee ID is missing for editing.' };
      res = await editEmployee(empId, fd);
    } else {
      res = await addEmployee(fd);
    }

    if (res.success) {
      setShowForm(false);
      Swal.fire({ title: 'สำเร็จ!', text: res.message || (editing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มพนักงานสำเร็จ'), icon: 'success', timer: 1500, showConfirmButton: false });
      loadEmployees();
    } else {
      Swal.fire('ข้อผิดพลาด', res.message || 'บันทึกไม่สำเร็จ', 'error');
    }
    return res;
  };

  const handleDelete = async (emp_id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันลบข้อมูลพนักงาน ระบบจะไม่สามารถกู้คืนได้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;

    await removeEmployee(emp_id);
    Swal.fire({ title: 'ลบสำเร็จ', text: 'ข้อมูลพนักงานถูกลบออกจากระบบแล้ว', icon: 'success', timer: 1500, showConfirmButton: false });
  };



  const exportToCSV = () => {
    const headers = [
      'รหัสพนักงาน', 'คำนำหน้า', 'ชื่อ (TH)', 'นามสกุล (TH)', 'ชื่อ (EN)', 'นามสกุล (EN)',
      'เพศ', 'วัน/เดือน/ปีเกิด', 'บัตรประชาชน', 'เบอร์โทรศัพท์', 'อีเมล', 'ที่อยู่',
      'แผนก', 'ตำแหน่ง', 'ประเภทพนักงาน', 'วันที่เริ่มงาน', 'เงินเดือน',
      'สถานะการทำงาน', 'คะแนน CNEU/CME', 'ข้อมูลใบอนุญาต'
    ];
    
    const rows = filteredData.map(e => {
      const licText = e.licenses && e.licenses.length > 0 ? e.licenses.map(l => `${l.license_name || ''} เลขที่:${l.license_no || '-'} (${l.status || ''})`).join(' | ') : 'ไม่มี';
      const rowData = [
        e.emp_id || '',
        e.prefix || '',
        e.first_name_th || '',
        e.last_name_th || '',
        e.first_name_en || '',
        e.last_name_en || '',
        e.gender || '',
        e.birth_date ? new Date(e.birth_date).toLocaleDateString('en-GB') : '',
        e.citizen_id || '',
        e.phone || '',
        e.email || '',
        (e.address || '').replace(/"/g, '""'),
        getDeptName(e.dept_id) || '',
        getPosName(e.pos_id) || '',
        e.emp_type || '',
        e.start_date ? new Date(e.start_date).toLocaleDateString('en-GB') : '',
        e.base_salary || 0,
        e.status || '',
        e.cneu_cme_points || 0,
        licText.replace(/"/g, '""')
      ];
      // Wrap each field in quotes to safely handle commas and spaces
      return rowData.map(value => `"${value}"`);
    });

    const csvContent = "\uFEFF" + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employees_list_full.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (user && !isAdmin) {
    return null; // Return nothing while redirecting
  }

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">ทะเบียนบุคลากร</h1>
            <div className="page-subtitle">จัดการรายชื่อและข้อมูลส่วนตัวของพนักงานทั้งหมดในระบบ</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {isAdmin && (
              <>
                <button className="btn-outline hover-glow" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ดาวน์โหลด EXCEL
                </button>
                <button className="btn-outline hover-glow" onClick={() => fileInputRef.current?.click()} disabled={isImporting} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {isImporting ? 'กำลังนำเข้า...' : 'นำเข้าจาก EXCEL'}
                </button>
                <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  เพิ่มพนักงานใหม่
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div className="filter-bar">
            <div className="search-input-wrap" style={{ flex: '1 1 300px' }}>
              <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="ค้นหาชื่อหรือรหัสพนักงาน..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="all">ทุกแผนก</option>
              {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterPos} onChange={e => setFilterPos(e.target.value)}>
              <option value="all">ทุกตำแหน่ง</option>
              {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">สถานะการทำงาน: ทั้งหมด</option>
              <option value="Active">Active (ทำงานอยู่)</option>
              <option value="Inactive">Inactive (พ้นสภาพ)</option>
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={filterLicense} onChange={e => setFilterLicense(e.target.value)}>
              <option value="all">ใบประกอบฯ: ทั้งหมด</option>
              <option value="Active">ปกติ (Active)</option>
              <option value="Expiring Soon">ใกล้หมดอายุ</option>
              <option value="Expired">หมดอายุแล้ว</option>
              <option value="Suspended">พักใช้/ระงับ</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '80px' }}>รูปภาพ</th>
                  <th>ชื่อ-สกุลพนักงาน</th>
                  <th>ตำแหน่ง</th>
                  <th>แผนก/งาน</th>
                  <th style={{ textAlign: 'center' }}>สถานะ</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูลพนักงาน...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>ไม่มีข้อมูลพนักงานที่ตรงกับการค้นหา</td></tr>
                ) : (
                  currentData.map((emp) => (
                    <tr
                      key={emp.emp_id}
                      onClick={() => openView(emp)}
                      style={{ background: emp.license_status === 'Expired' ? '#fff5f5' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = emp.license_status === 'Expired' ? '#fff5f5' : 'transparent'}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '14px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '0 auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                          {emp.image ? <Image fill src={`/uploads/${emp.image}`} alt="" style={{ objectFit: 'cover' }} unoptimized onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }} /> : <span style={{ color: '#94a3b8', fontSize: '20px' }}>👤</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                          {emp.prefix}{emp.first_name_th} {emp.last_name_th}
                          {emp.license_status === 'Expired' && <span className="badge badge-red" title="ใบประกอบวิชาชีพหมดอายุ">หมดอายุ</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>รหัส: {emp.emp_id}</div>
                      </td>
                      <td style={{ color: '#334155', fontWeight: 500 }}>{getPosName(emp.pos_id)}</td>
                      <td style={{ color: '#334155' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                          {getDeptName(emp.dept_id)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${emp.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button className="icon-btn hover-glow" onClick={() => { setIsBulkPrinting(false); setSelectedEmpForCard(emp); setShowIdCard(true); }} title="พิมพ์บัตรพนักงาน" style={{ color: '#0ea5e9', background: '#f0f9ff' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                          </button>
                          {isAdmin && (
                            <>
                              <button className="icon-btn hover-glow" onClick={() => handleResetPassword(emp)} title="ส่งอีเมลรีเซ็ตรหัสผ่าน" style={{ color: '#d97706', background: '#fefce8' }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                              </button>
                              <button className="icon-btn hover-glow" onClick={() => openEdit(emp)} title="แก้ไขข้อมูล" style={{ color: '#3b82f6' }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button className="icon-btn hover-glow" onClick={() => handleDelete(emp.emp_id)} title="ลบข้อมูล" style={{ color: '#ef4444', background: '#fef2f2' }}>
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>แสดงรายการจากทั้งหมด {filteredData.length} รายการ</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  หน้าก่อน
                </button>
                <div style={{ background: '#f1f5f9', padding: '6px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                  {currentPage} / {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  หน้าถัดไป
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Shared Full Functionality Edit/Add Modal */}
      <EmployeeFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        employee={formData}
        onSave={async (fd, editing) => await handleSaveWrapper(fd, editing, formData?.emp_id)}
        viewMode={viewMode}
        isProfileMode={false}
        departments={departments}
        positions={positions}
      />

      {/* ID Card Modal */}
      {showIdCard && (isBulkPrinting ? selectedIds.length > 0 : selectedEmpForCard) && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100 }}>
          <div className="modal-box" style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', width: isBulkPrinting ? '700px' : '360px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{isBulkPrinting ? 'บัตรพนักงาน (จำนวนมาก)' : 'บัตรพนักงาน'}</h3>
              <button type="button" onClick={() => setShowIdCard(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ flex: 1, width: '100%', overflowY: 'auto', display: 'block' }} className="custom-scrollbar">
              <div
                ref={printRef}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '40px',
                  padding: '16px',
                  background: 'white',
                  width: isBulkPrinting ? '210mm' : 'auto', // A4 width approximately
                  margin: '0 auto',
                  alignItems: 'center'
                }}
              >
                {(isBulkPrinting ? currentData.filter(emp => selectedIds.includes(emp.emp_id)) : [selectedEmpForCard!]).map((empForCard) => (
                  <div key={empForCard.emp_id} style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', pageBreakInside: 'avoid', margin: '0 auto', width: '100%' }}>

                    {/* --- Front Card --- */}
                    <div style={{ width: '300px', height: '480px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', color: '#1e293b', flexShrink: 0 }}>

                      {/* Abstract blobs */}
                      <div style={{ position: 'absolute', top: '-40px', left: '-20px', width: '280px', height: '260px', background: '#0f172a', borderRadius: '0 0 60% 40% / 0 0 50% 70%', zIndex: 2 }} />
                      <div style={{ position: 'absolute', top: 0, right: '-60px', width: '200px', height: '280px', background: '#f59e0b', borderRadius: '0 0 40% 60%', zIndex: 1 }} />
                      <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', background: '#f59e0b', borderRadius: '50%', zIndex: 1 }} />

                      {/* Logo / Tagline */}
                      <div style={{ position: 'relative', zIndex: 3, padding: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#f59e0b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: '12px', height: '12px', border: '2px solid #0f172a', borderRadius: '50%' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1 }}>HRM SYSTEM</div>
                          <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '2px', letterSpacing: '0.5px' }}>EMPLOYEE ID CARD</div>
                        </div>
                      </div>

                      {/* Image */}
                      <div style={{ position: 'relative', zIndex: 3, marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '130px', height: '130px', position: 'relative', borderRadius: '50%', border: '6px solid #ffffff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', background: '#f1f5f9', overflow: 'hidden' }}>
                          <Image fill src={empForCard.image ? `/uploads/${empForCard.image}` : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>`} alt="Employee" style={{ objectFit: 'cover' }} unoptimized onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }} />
                        </div>
                      </div>

                      {/* Name & Title */}
                      <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', marginTop: '16px', padding: '0 20px' }}>
                        <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{empForCard.first_name_en || (empForCard.first_name_th + ' ' + empForCard.last_name_th)}</h2>
                        {empForCard.first_name_en && empForCard.last_name_en && (
                          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{empForCard.last_name_en}</h2>
                        )}
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{getPosName(empForCard.pos_id)}</p>
                      </div>

                      {/* Details Info Grid */}
                      <div style={{ position: 'relative', zIndex: 3, marginTop: '24px', padding: '0 32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '6px 8px', fontSize: '11px' }}>
                          <div style={{ color: '#64748b', fontWeight: 600 }}>ID</div>
                          <div style={{ color: '#0f172a', fontWeight: 700 }}>: {empForCard.emp_id}</div>
                          <div style={{ color: '#64748b', fontWeight: 600 }}>DOB</div>
                          <div style={{ color: '#0f172a', fontWeight: 700 }}>: {empForCard.birth_date ? new Date(empForCard.birth_date).toLocaleDateString('en-GB') : '-'}</div>
                          <div style={{ color: '#64748b', fontWeight: 600 }}>Phone</div>
                          <div style={{ color: '#0f172a', fontWeight: 700 }}>: {empForCard.phone || '-'}</div>
                          <div style={{ color: '#64748b', fontWeight: 600 }}>Email</div>
                          <div style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>: {empForCard.email || '-'}</div>
                        </div>
                      </div>

                      {/* Barcode/QR wrapper */}
                      <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', zIndex: 3 }}>
                        <QRCodeSVG value={empForCard.emp_id} size={48} level="M" />
                      </div>

                    </div>

                    {/* --- Back Card --- */}
                    <div style={{ width: '300px', height: '480px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', color: '#1e293b', flexShrink: 0 }}>

                      {/* Blobs Back */}
                      <div style={{ position: 'absolute', top: '-60px', left: '-20px', width: '360px', height: '180px', background: '#0f172a', borderRadius: '0 0 50% 50%', zIndex: 2 }} />
                      <div style={{ position: 'absolute', top: 0, right: '-40px', width: '160px', height: '160px', background: '#f59e0b', borderRadius: '0 0 0 60%', zIndex: 1 }} />
                      <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', background: '#f59e0b', borderRadius: '50%', zIndex: 1 }} />

                      {/* Logo / Tagline */}
                      <div style={{ position: 'relative', zIndex: 3, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', background: '#f59e0b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '10px', height: '10px', border: '2px solid #0f172a', borderRadius: '50%' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1 }}>HRM SYSTEM</div>
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ position: 'relative', zIndex: 3, padding: '20px 28px', marginTop: '40px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '0 0 20px 0', letterSpacing: '0.5px' }}>ข้อกำหนดและเงื่อนไข</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '4px' }} />
                            <div>บัตรนี้เป็นทรัพย์สินของบริษัทและต้องคืนเมื่อสิ้นสุดการจ้างงาน</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '4px' }} />
                            <div>ท่านต้องสวมบัตรประจำตัวนี้ให้เห็นชัดเจนตลอดเวลาขณะอยู่ในบริเวณบริษัท</div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '4px' }} />
                            <div>หากพบเห็นโปรดส่งคืนฝ่ายทรัพยากรบุคคลทันที</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                          <div>
                            <div style={{ marginBottom: '6px' }}>วันที่เริ่มงาน &nbsp;: <span style={{ color: '#0f172a' }}>{empForCard.start_date ? new Date(empForCard.start_date).toLocaleDateString('en-GB') : '-'}</span></div>
                            <div>วันหมดอายุ &nbsp;: <span style={{ color: '#0f172a' }}>{empForCard.start_date ? new Date(new Date(empForCard.start_date).setFullYear(new Date(empForCard.start_date).getFullYear() + 5)).toLocaleDateString('en-GB') : '-'}</span></div>
                          </div>
                        </div>

                        {/* Signature */}
                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                          <div style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive", fontSize: '24px', color: '#0f172a', margin: '0', lineHeight: 1, height: '24px' }}>Wannisa</div>
                          <div style={{ borderTop: '1px solid #cbd5e1', margin: '8px auto 0', width: '140px', paddingTop: '6px' }} />
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>ลายมือชื่อผู้มีอำนาจ</div>
                        </div>

                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={() => handlePrint()} style={{ marginTop: '24px', width: isBulkPrinting ? '300px' : '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              บัตรพนักงาน {isBulkPrinting ? `(${selectedIds.length} ใบ)` : ''}
            </button>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

export default function EmployeesSplitPage() {
  return (
    <Suspense fallback={<AppLayout><div style={{ padding: 20 }}>กำลังโหลด...</div></AppLayout>}>
      <EmployeesContent />
    </Suspense>
  );
}