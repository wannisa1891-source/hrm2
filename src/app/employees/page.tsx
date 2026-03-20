'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee, ProfessionalLicense } from '@/services/apiService';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

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
  const { employees, loading, error, loadEmployees, addEmployee, editEmployee, removeEmployee } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filterDept, setFilterDept] = useState('all');
  const [filterPos, setFilterPos] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLicense, setFilterLicense] = useState('all');

  const [thaiAddressData, setThaiAddressData] = useState<any[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'job'>('personal');

  const [isImporting, setIsImporting] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [selectedEmpForCard, setSelectedEmpForCard] = useState<Employee | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Employee_ID_Card',
  });

  const handleResetPassword = async (emp: Employee) => {
    if (!confirm(`คุณต้องการรีเซ็ตรหัสผ่านและส่งอีเมลแจ้ง ${emp.first_name_th} ${emp.last_name_th} ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/employees/${emp.emp_id}/reset-password`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
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
        alert('ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า');
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
        const deptName = row['แผนก']?.toString() || '';
        const dept = departments.find(d => d.dept_name.trim() === deptName);

        const posName = row['ตำแหน่ง']?.toString() || '';
        const pos = positions.find(p => p.pos_name.trim() === posName);

        return {
          emp_id: row['รหัสพนักงาน'] || row['emp_id'] || '',
          prefix: row['คำนำหน้า'] || row['prefix'] || '',
          first_name_th: row['ชื่อ (TH)'] || row['ชื่อ(TH)'] || row['ชื่อ'] || row['first_name_th'] || '',
          last_name_th: row['นามสกุล (TH)'] || row['นามสกุล(TH)'] || row['นามสกุล'] || row['last_name_th'] || '',
          citizen_id: row['บัตรประชาชน'] || row['เลขบัตรประชาชน'] || row['citizen_id'] || '',
          phone: row['เบอร์โทร'] || row['เบอร์โทรศัพท์'] || row['phone'] || '',
          email: row['อีเมล'] || row['อีเมลล์'] || row['email'] || '',
          base_salary: row['เงินเดือน'] || row['ฐานเงินเดือน'] || row['base_salary'] || 0,
          dept_id: dept ? dept.dept_id : null,
          pos_id: pos ? pos.pos_id : null,
        };
      }).filter(r => r.emp_id || r.first_name_th); // Filter out empty rows often generated by excel

      // Simple validation for the first row to ensure they used correct headers
      const firstRow = mappedData[0];
      if (!firstRow.emp_id && !firstRow.first_name_th) {
        alert('ตรวจสอบพบว่าหัวคอลัมน์ในไฟล์ Excel ไม่ตรงกับรูปแบบที่ระบบต้องการครับ (ต้องมี รหัสพนักงาน, ชื่อ (TH), แผนก, ตำแหน่ง)');
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
        alert(`นำเข้าข้อมูลสำเร็จ ${resData.successCount} รายการ, ผิดพลาด ${resData.errorCount} รายการ\n${resData.errors?.join('\n') || ''}`);
        loadEmployees();
      } else {
        alert('เกิดข้อผิดพลาดในการรัน API: ' + resData.error);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์เอ็กเซล: ' + err.message);
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

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;
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

  useEffect(() => {
    fetch('/data/thai_address.json')
      .then(res => res.json())
      .then(data => setThaiAddressData(data))
      .catch(err => console.error('Failed to load thai address data:', err));
  }, []);

  const provinces = useMemo(() => {
    return Array.from(new Set(thaiAddressData.map((d:any) => d.province))).sort() as string[];
  }, [thaiAddressData]);

  const amphoes = useMemo(() => {
    if (!formData.addr_province) return [];
    return Array.from(new Set(thaiAddressData.filter((d:any) => d.province === formData.addr_province).map((d:any) => d.amphoe))).sort() as string[];
  }, [thaiAddressData, formData.addr_province]);

  const districts = useMemo(() => {
    if (!formData.addr_province || !formData.addr_district) return [];
    return Array.from(new Set(thaiAddressData.filter((d:any) => d.province === formData.addr_province && d.amphoe === formData.addr_district).map((d:any) => d.district))).sort() as string[];
  }, [thaiAddressData, formData.addr_province, formData.addr_district]);

  const zipcodes = useMemo(() => {
    if (!formData.addr_province || !formData.addr_district || !formData.addr_subdistrict) return [];
    return Array.from(new Set(thaiAddressData.filter((d:any) => d.province === formData.addr_province && d.amphoe === formData.addr_district && d.district === formData.addr_subdistrict).map((d:any) => d.zipcode))).sort() as number[];
  }, [thaiAddressData, formData.addr_province, formData.addr_district, formData.addr_subdistrict]);

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, emp_id: '', licenses: [{ status: 'Active' }] });
    setImageFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
    setShowForm(true);
    setActiveTab('personal');
  };

  const openEdit = (emp: Employee) => {
    setFormData({ ...emp, citizen_id: emp.citizen_id || '', licenses: emp.licenses || [] });
    setImageFile(null);
    setPreviewUrl(emp.image ? `/uploads/${emp.image}` : null);
    setIsEditing(true);
    setShowForm(true);
    setActiveTab('personal');
  };

  const handleAddLicense = () => {
    setFormData(prev => ({
      ...prev,
      licenses: [...(prev.licenses || []), { status: 'Active' }]
    }));
  };

  const handleRemoveLicense = (index: number) => {
    setFormData(prev => {
      const newLics = [...(prev.licenses || [])];
      newLics.splice(index, 1);
      return { ...prev, licenses: newLics };
    });
  };

  const setLicenseField = (index: number, key: keyof ProfessionalLicense, value: any) => {
    setFormData(prev => {
      const newLics = [...(prev.licenses || [])];
      newLics[index] = { ...newLics[index], [key]: value };
      return { ...prev, licenses: newLics };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();

    // Combine address parts
    const combinedAddress = [
      formData.addr_no ? `เลขที่ ${formData.addr_no}` : '',
      formData.addr_moo ? `หมู่ ${formData.addr_moo}` : '',
      formData.addr_village ? `หมู่บ้าน/อาคาร ${formData.addr_village}` : '',
      formData.addr_soi ? `ซอย ${formData.addr_soi}` : '',
      formData.addr_road ? `ถนน ${formData.addr_road}` : '',
      formData.addr_subdistrict ? `ตำบล/แขวง ${formData.addr_subdistrict}` : '',
      formData.addr_district ? `อำเภอ/เขต ${formData.addr_district}` : '',
      formData.addr_province ? `จังหวัด ${formData.addr_province}` : '',
      formData.addr_zipcode ? `รหัสไปรษณีย์ ${formData.addr_zipcode}` : '',
    ].filter(Boolean).join(' ');

    const finalFormData = { ...formData };
    if (combinedAddress.trim().length > 0) {
      finalFormData.address = combinedAddress;
    }

    if (imageFile) fd.append('image', imageFile);

    // Filter relevant licenses
    let finalLicenses = finalFormData.licenses || [];
    if (!finalFormData.has_license && finalFormData.has_license !== 1) {
      finalLicenses = []; // user unchecked "has_license", send empty
    }

    // append json payload
    const payloadLicenses = finalLicenses.map(l => {
      const { file, previewUrl, ...rest } = l;
      return rest;
    });
    fd.append('licenses_data', JSON.stringify(payloadLicenses));

    // append files
    finalLicenses.forEach((l, idx) => {
      if (l.file) {
        fd.append(`license_file_${idx}`, l.file);
      }
    });

    Object.entries(finalFormData).forEach(([k, v]) => {
      // exclude these keys from string appending
      if (k !== 'licenses' && k !== 'license_name' && k !== 'license_type' && k !== 'license_no' && k !== 'license_institution' && k !== 'license_issue_date' && k !== 'license_expire' && k !== 'license_status' && k !== 'license_file' && v !== null && v !== undefined) {
        fd.append(k, String(v));
      }
    });

    setSaving(true);
    let res: { success: boolean, message?: string };
    if (isEditing) {
      res = await editEmployee(formData.emp_id!, fd);
    } else {
      res = await addEmployee(fd);
    }
    setSaving(false);

    if (res.success) {
      setShowForm(false);
      alert(res.message || (isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มพนักงานสำเร็จ'));
      loadEmployees(); // reload after save
    } else {
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${res.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    }
  };

  const handleDelete = async (emp_id: string) => {
    if (!confirm('ยืนยันลบข้อมูลพนักงานระบบจะไม่สามารถกู้คืนได้?')) return;
    await removeEmployee(emp_id);
  };

  const setField = (key: keyof Employee, value: any) => setFormData(f => ({ ...f, [key]: value }));

  const exportToCSV = () => {
    const headers = ['รหัสพนักงาน', 'คำนำหน้า', 'ชื่อ (TH)', 'นามสกุล (TH)', 'แผนก', 'ตำแหน่ง', 'สถานะการทำงาน', 'ข้อมูลใบอนุญาต'];
    const rows = filteredData.map(e => {
      const licText = e.licenses && e.licenses.length > 0 ? e.licenses.map(l => `${l.license_name || ''} (${l.status || ''})`).join(' | ') : 'ไม่มี';
      return [
        e.emp_id, e.prefix, e.first_name_th, e.last_name_th, getDeptName(e.dept_id), getPosName(e.pos_id), e.status, licText
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'employees_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inputStyle = { width: '100%', padding: '10px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px' };
  const addrInputStyle = { width: '100%', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '13px' };

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">ทะเบียนบุคลากร</h1>
            <div className="page-subtitle">จัดการรายชื่อและข้อมูลส่วนตัวของพนักงานทั้งหมดในระบบ</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
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
                    <tr key={emp.emp_id} style={{ background: emp.license_status === 'Expired' ? '#fff5f5' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '0 auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                          {emp.image ? <img src={`/uploads/${emp.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }} /> : <span style={{ color: '#94a3b8', fontSize: '20px' }}>👤</span>}
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
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button className="icon-btn hover-glow" onClick={() => { setSelectedEmpForCard(emp); setShowIdCard(true); }} title="พิมพ์บัตรพนักงาน" style={{ color: '#0ea5e9', background: '#f0f9ff' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                          </button>
                          <button className="icon-btn hover-glow" onClick={() => handleResetPassword(emp)} title="ส่งอีเมลรีเซ็ตรหัสผ่าน" style={{ color: '#d97706', background: '#fefce8' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          </button>
                          <button className="icon-btn hover-glow" onClick={() => openEdit(emp)} title="แก้ไขข้อมูล" style={{ color: '#3b82f6' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button className="icon-btn hover-glow" onClick={() => handleDelete(emp.emp_id)} title="ลบข้อมูล" style={{ color: '#ef4444', background: '#fef2f2' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
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

      {/* Beautiful High-End Edit/Add Modal */}
      {showForm && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
          <div className="modal-box" style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '960px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)', border: 'none', position: 'relative', overflow: 'hidden' }}>

            {/* Modal Header */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isEditing ? '#fff7ed' : '#f0fdf4', color: isEditing ? '#f97316' : '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  {isEditing ? '✏️' : '✨'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>{isEditing ? 'แก้ไขข้อมูลบุคลากร' : 'ลงทะเบียนบุคลากรใหม่'}</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>กรอกข้อมูลรายละเอียดของพนักงานให้ครบถ้วนเพื่อบันทึกลงในระบบ</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="no-scrollbar">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                {/* === Section 1: ข้อมูลส่วนตัว === */}
                <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#3b82f6', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
                    SECTION 01
                  </div>
                  <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    ข้อมูลส่วนบุคคล (Personal Information)
                  </h4>

                  <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Avatar Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '140px', height: '160px', borderRadius: '16px', background: '#ffffff', border: '2px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)' }} onClick={() => document.getElementById('imageUpload')?.click()}>
                        {previewUrl ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}><span style={{ fontSize: '12px', fontWeight: 500 }}>อัปโหลดรูปภาพ</span></div>}
                      </div>
                      <input id="imageUpload" type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                      }} style={{ display: 'none' }} />
                    </div>

                    {/* Main Inputs Grid */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>คำนำหน้า</label>
                        <select value={formData.prefix || ''} onChange={e => setField('prefix', e.target.value)} required style={inputStyle}>
                          <option value="">[ เลือกคำนำหน้า ]</option>
                          <option value="นาย">นาย</option>
                          <option value="นาง">นาง</option>
                          <option value="นางสาว">นางสาว</option>
                          <option value="นพ.">นพ.</option>
                          <option value="พญ.">พญ.</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>รหัสบัตรประชาชน 13 หลัก</label>
                        <input type="text" placeholder="X-XXXX-XXXXX-XX-X" value={formData.citizen_id || ''} onChange={e => setField('citizen_id', e.target.value)} required maxLength={13} style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ชื่อ (ภาษาไทย)</label>
                        <input type="text" placeholder="ระบุชื่อย่อไทย" value={formData.first_name_th || ''} onChange={e => setField('first_name_th', e.target.value)} required style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>นามสกุล (ภาษาไทย)</label>
                        <input type="text" placeholder="ระบุนามสกุลไทย" value={formData.last_name_th || ''} onChange={e => setField('last_name_th', e.target.value)} required style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ชื่อ (English)</label>
                        <input type="text" placeholder="First Name" value={formData.first_name_en || ''} onChange={e => setField('first_name_en', e.target.value)} style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>นามสกุล (English)</label>
                        <input type="text" placeholder="Last Name" value={formData.last_name_en || ''} onChange={e => setField('last_name_en', e.target.value)} style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>วัน/เดือน/ปีเกิด</label>
                        <input type="date" value={formData.birth_date ? formData.birth_date.substring(0, 10) : ''} onChange={e => setField('birth_date', e.target.value)} required style={inputStyle} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เพศ</label>
                        <select value={formData.gender || ''} onChange={e => setField('gender', e.target.value)} required style={inputStyle}>
                          <option value="ชาย">ชาย</option>
                          <option value="หญิง">หญิง</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Address Box */}
                  <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>ที่อยู่ปัจจุบันตามทะเบียนบ้าน</label>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>เลขที่</span>
                        <input type="text" value={formData.addr_no || ''} onChange={e => setField('addr_no', e.target.value)} style={addrInputStyle} placeholder="เช่น 123/4" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>หมู่ที่</span>
                        <input type="text" value={formData.addr_moo || ''} onChange={e => setField('addr_moo', e.target.value)} style={addrInputStyle} placeholder="เช่น ม.5" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>หมู่บ้าน / อาคาร</span>
                        <input type="text" value={formData.addr_village || ''} onChange={e => setField('addr_village', e.target.value)} style={addrInputStyle} placeholder="ชื่อหมู่บ้านหรือคอนโด" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>ซอย</span>
                        <input type="text" value={formData.addr_soi || ''} onChange={e => setField('addr_soi', e.target.value)} style={addrInputStyle} placeholder="เช่น ซอย 2" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>ถนน</span>
                        <input type="text" value={formData.addr_road || ''} onChange={e => setField('addr_road', e.target.value)} style={addrInputStyle} placeholder="เช่น ถ.สุขุมวิท" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>จังหวัด</span>
                        <input
                          type="text"
                          list="province-list"
                          value={formData.addr_province || ''}
                          onChange={e => {
                            setField('addr_province', e.target.value);
                            setField('addr_district', '');
                            setField('addr_subdistrict', '');
                            setField('addr_zipcode', '');
                          }}
                          style={addrInputStyle}
                          placeholder="พิมพ์หรือเลือกจังหวัด"
                        />
                        <datalist id="province-list">
                          {provinces.map(p => <option key={p} value={p} />)}
                        </datalist>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>อำเภอ / เขต</span>
                        <select value={formData.addr_district || ''} disabled={!formData.addr_province} onChange={e => {
                          setField('addr_district', e.target.value);
                          setField('addr_subdistrict', '');
                          setField('addr_zipcode', '');
                        }} style={{ ...addrInputStyle, cursor: formData.addr_province ? 'pointer' : 'not-allowed', opacity: formData.addr_province ? 1 : 0.6 }}>
                          <option value="">[ เลือกอำเภอ ]</option>
                          {amphoes.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>ตำบล / แขวง</span>
                        <select value={formData.addr_subdistrict || ''} disabled={!formData.addr_district} onChange={e => {
                          setField('addr_subdistrict', e.target.value);
                          
                          // Auto-fill zipcode
                          const matchedZipcodes = Array.from(new Set(thaiAddressData.filter((d:any) => d.province === formData.addr_province && d.amphoe === formData.addr_district && d.district === e.target.value).map((d:any) => d.zipcode)));
                          if (matchedZipcodes.length === 1) {
                            setField('addr_zipcode', String(matchedZipcodes[0]));
                          } else {
                            setField('addr_zipcode', '');
                          }
                        }} style={{ ...addrInputStyle, cursor: formData.addr_district ? 'pointer' : 'not-allowed', opacity: formData.addr_district ? 1 : 0.6 }}>
                          <option value="">[ เลือกตำบล ]</option>
                          {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>รหัสไปรษณีย์</span>
                        {zipcodes.length > 1 ? (
                          <select value={formData.addr_zipcode || ''} disabled={!formData.addr_subdistrict} onChange={e => setField('addr_zipcode', e.target.value)} style={{ ...addrInputStyle, cursor: formData.addr_subdistrict ? 'pointer' : 'not-allowed', opacity: formData.addr_subdistrict ? 1 : 0.6 }}>
                            <option value="">[ เลือกรหัส ]</option>
                            {zipcodes.map(z => <option key={z} value={z}>{z}</option>)}
                          </select>
                        ) : (
                          <input type="text" value={formData.addr_zipcode || ''} onChange={e => setField('addr_zipcode', e.target.value)} style={addrInputStyle} placeholder="10xxx" readOnly={zipcodes.length === 1} />
                        )}
                      </div>
                    </div>

                    {isEditing && formData.address && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                        <span style={{ fontSize: '12px', color: '#f97316', fontWeight: 600 }}>⚠️ ข้อมูลที่อยู่ดั้งเดิม (Old Address Data)</span>
                        <textarea rows={2} value={formData.address || ''} readOnly style={{ ...addrInputStyle, background: '#fff7ed', border: '1px solid #fdba74' }}></textarea>
                      </div>
                    )}
                  </div>
                </div>

                {/* === Section 2: ข้อมูลการทำงานและวิชาชีพ === */}
                <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#10b981', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
                    SECTION 02
                  </div>
                  <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}></span> ข้อมูลการทำงานและวิชาชีพ (Job & Professional Info)
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>รหัสพนักงาน</label>
                      <input type="text" placeholder="ระบุรหัสพนักงานใหม่" value={formData.emp_id || ''} onChange={e => setField('emp_id', e.target.value)} required readOnly={isEditing} style={{ ...inputStyle, background: isEditing ? '#f1f5f9' : '#ffffff', color: isEditing ? '#64748b' : '#0f172a', cursor: isEditing ? 'not-allowed' : 'text', border: isEditing ? '1px solid #e2e8f0' : inputStyle.border }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>วันที่เริ่มงาน</label>
                      <input type="date" value={formData.start_date ? formData.start_date.substring(0, 10) : ''} onChange={e => setField('start_date', e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ประเภทการจ้างงาน</label>
                      <select value={formData.emp_type || ''} onChange={e => setField('emp_type', e.target.value)} style={inputStyle}>
                        <option value="ข้าราชการ">ข้าราชการ</option>
                        <option value="พนักงานประจำ">พนักงานประจำ</option>
                        <option value="พาร์ทไทม์">พาร์ทไทม์</option>
                        <option value="สัญญาจ้าง">สัญญาจ้าง</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>สถานะพนักงาน</label>
                      <select value={formData.status || ''} onChange={e => setField('status', e.target.value)} style={inputStyle}>
                        <option value="Active">ทำงานอยู่ (Active)</option>
                        <option value="Inactive">พ้นสภาพ (Inactive)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>สังกัดกลุ่มงาน</label>
                      <select value={formData.dept_id || ''} onChange={e => setField('dept_id', e.target.value)} required style={inputStyle}>
                        <option value="">[ เลือกสังกัด / แผนก ]</option>
                        {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ตำแหน่งงาน</label>
                      <select value={formData.pos_id || ''} onChange={e => setField('pos_id', e.target.value)} required style={inputStyle}>
                        <option value="">[ เลือกตำแหน่ง ]</option>
                        {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เงินเดือน (Base Salary)</label>
                      <input type="number" value={formData.base_salary || ''} onChange={e => setField('base_salary', Number(e.target.value))} required min={0} placeholder="฿0.00" style={inputStyle} />
                    </div>
                  </div>

                  {/* Professional Licenses Dynamic List Sub-section */}
                  <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '16px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>ข้อมูลใบประกอบวิชาชีพและวุฒิบัตร (Professional Licenses / Certificates)</label>
                      <div style={{ display: 'flex', gap: '15px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: formData.has_license === true || (formData.has_license as any) === 1 ? '#0f172a' : '#64748b' }}>
                          <input type="radio" checked={formData.has_license === true || (formData.has_license as any) === 1} onChange={() => setField('has_license', true)} style={{ width: '16px', height: '16px' }} />
                          มีใบประกอบฯ / ใบประกาศ
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: (formData.has_license !== true && (formData.has_license as any) !== 1) ? '#0f172a' : '#64748b' }}>
                          <input type="radio" checked={formData.has_license !== true && (formData.has_license as any) !== 1} onChange={() => { setField('has_license', false); }} style={{ width: '16px', height: '16px' }} />
                          ไม่มี / ไม่ระบุ
                        </label>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: (formData.has_license === true || (formData.has_license as any) === 1) ? 1 : 0.5, pointerEvents: (formData.has_license === true || (formData.has_license as any) === 1) ? 'auto' : 'none', transition: 'all 0.3s' }}>

                      {/* General CNEU points for the employee */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', maxWidth: '300px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>🌟 คะแนนหน่วยกิตสะสมรวม (CNEU/CME/CCPE Points)</label>
                        <input type="number" step="0.5" min="0" placeholder="0" value={formData.cneu_cme_points || ''} onChange={e => setField('cneu_cme_points', parseFloat(e.target.value))} style={addrInputStyle} />
                      </div>

                      {(formData.licenses || []).map((lic, index) => (
                        <div key={index} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', marginBottom: '10px', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                              ใบรับรองที่ {index + 1}
                            </span>
                            <button type="button" onClick={() => handleRemoveLicense(index)} style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                              ลบทิ้ง
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>ชื่อใบอนุญาต / วุฒิบัตร</label>
                              <input type="text" placeholder="เช่น ใบประกอบวิชาชีพเวชกรรม" value={lic.license_name || ''} onChange={e => setLicenseField(index, 'license_name', e.target.value)} style={addrInputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>ประเภทวิชาชีพ</label>
                              <select value={lic.license_type || ''} onChange={e => setLicenseField(index, 'license_type', e.target.value)} style={addrInputStyle}>
                                <option value="">[ เลือกประเภท ]</option>
                                <option value="พยาบาล (RN)">พยาบาล (RN)</option>
                                <option value="พยาบาลเทคนิค (PN)">พยาบาลเทคนิค (PN)</option>
                                <option value="แพทย์ (MD)">แพทย์ (MD)</option>
                                <option value="เภสัชกร">เภสัชกร</option>
                                <option value="นักเทคนิคการแพทย์">นักเทคนิคการแพทย์</option>
                                <option value="วุฒิบัตรสนับสนุน (NA/นักประดาน้ำ ฯลฯ)">วุฒิบัตรสนับสนุน (NA/นักประดาน้ำ ฯลฯ)</option>
                                <option value="อื่นๆ">อื่นๆ</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>เลขที่ใบอนุญาต</label>
                              <input type="text" placeholder="ระบุเลขที่..." value={lic.license_no || ''} onChange={e => setLicenseField(index, 'license_no', e.target.value)} style={addrInputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>สถาบัน/แพทยสภาที่ออกให้</label>
                              <input type="text" placeholder="เช่น สภาการพยาบาล" value={lic.institution || ''} onChange={e => setLicenseField(index, 'institution', e.target.value)} style={addrInputStyle} />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>วันที่ออกบัตร</label>
                              <input type="date" value={lic.issue_date ? lic.issue_date.substring(0, 10) : ''} onChange={e => setLicenseField(index, 'issue_date', e.target.value)} style={addrInputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>วันหมดอายุ (Expire Date)</label>
                              <input type="date" value={lic.expire_date ? lic.expire_date.substring(0, 10) : ''} onChange={e => setLicenseField(index, 'expire_date', e.target.value)} style={addrInputStyle} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '12px', color: '#64748b' }}>สถานะใบอนุญาต</label>
                              <select value={lic.status || 'Active'} onChange={e => setLicenseField(index, 'status', e.target.value)} style={{ ...addrInputStyle, background: lic.status === 'Expired' ? '#fef2f2' : lic.status === 'Suspended' ? '#fffbeb' : '#ffffff' }}>
                                <option value="Active">ปกติ (Active)</option>
                                <option value="Expiring Soon">ใกล้หมดอายุ</option>
                                <option value="Expired">หมดอายุแล้ว</option>
                                <option value="Suspended">พักใช้ใบอนุญาต</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                            <label style={{ fontSize: '12px', color: '#64748b' }}>ไฟล์ภาพอ้างอิง (Image / PDF Copy)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <button type="button" onClick={() => document.getElementById(`licenseFile_${index}`)?.click()} style={{ padding: '6px 14px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                                เลือกไฟล์แนบ
                              </button>
                              <input id={`licenseFile_${index}`} type="file" accept="image/*,.pdf" onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  setLicenseField(index, 'file', f);
                                  if (f.type.startsWith('image/')) setLicenseField(index, 'previewUrl', URL.createObjectURL(f));
                                }
                              }} style={{ display: 'none' }} />

                              {(lic.file || lic.file_path) && (
                                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500, display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  ✓ {lic.file ? lic.file.name : 'มีไฟล์ข้อมูลอยู่ในระบบชิ้นเดิมแล้ว'}
                                </span>
                              )}
                            </div>
                            {(lic.previewUrl || (lic.file_path && !lic.file)) && (
                              <div style={{ marginTop: '10px', width: '200px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1', background: '#fff' }}>
                                <img src={lic.previewUrl || `/uploads/${lic.file_path}`} alt="License" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="20" x="50" y="55" text-anchor="middle">No Image</text></svg>'; }} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      <div>
                        <button type="button" onClick={handleAddLicense} style={{ padding: '8px 16px', background: 'transparent', border: '1px dashed #10b981', color: '#10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          + เพิ่มใบอนุญาต/วุฒิบัตร (Add License)
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* === Section 3: การติดต่อ === */}
                <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#8b5cf6', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)' }}>
                    SECTION 03
                  </div>
                  <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    ข้อมูลการติดต่อ และการเข้าสู่ระบบ (Contact & Account)
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เบอร์โทรศัพท์มือถือ</label>
                      <input type="tel" placeholder="08X-XXX-XXXX" value={formData.phone || ''} onChange={e => setField('phone', e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>อีเมลบริษัท (Corporate Email)</label>
                      <input type="email" placeholder="example@chaam-hosp.go.th" value={formData.email || ''} onChange={e => setField('email', e.target.value)} style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>รหัสผ่านเริ่มต้น (Default Password)</label>
                      <input type="text" placeholder="กำหนดรหัสผ่านเบื้องต้น" value={formData.password || ''} onChange={e => setField('password', e.target.value)} style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>สิทธิ์การใช้งานระบบ (System Role)</label>
                      <select value={formData.role || ''} onChange={e => setField('role', e.target.value)} style={inputStyle}>
                        <option value="User">พนักงานทั่วไป (User)</option>
                        <option value="Head">หัวหน้าแผนก (Head)</option>
                        <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                  <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 32px', background: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '15px', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={saving} style={{ padding: '12px 40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: saving ? 'wait' : 'pointer', fontWeight: 600, fontSize: '15px', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s', opacity: saving ? 0.8 : 1 }}>
                    {saving ? 'กำลังประมวลผล...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {showIdCard && selectedEmpForCard && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100 }}>
          <div className="modal-box" style={{ background: '#ffffff', borderRadius: '24px', padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }}>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button type="button" onClick={() => setShowIdCard(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Card Content to Print */}
            <div ref={printRef} style={{ width: '320px', height: '500px', background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', borderRadius: '16px', padding: '24px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)', position: 'relative', overflow: 'hidden' }}>
              {/* Background Decoration */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', bottom: '-80px', left: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

              <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: 700, letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>EMPLOYEE ID</h2>

              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'white', padding: '4px', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)' }}>
                <img
                  src={selectedEmpForCard.image ? `/uploads/${selectedEmpForCard.image}` : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'}
                  alt="Employee"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }}
                />
              </div>

              <div style={{ textAlign: 'center', zIndex: 1 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>{selectedEmpForCard.prefix}{selectedEmpForCard.first_name_th} {selectedEmpForCard.last_name_th}</h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', opacity: 0.9 }}>{getPosName(selectedEmpForCard.pos_id)}</p>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', display: 'inline-block', marginBottom: '20px', backdropFilter: 'blur(4px)' }}>
                  ID: {selectedEmpForCard.emp_id}
                </div>
              </div>

              <div style={{ marginTop: 'auto', background: 'white', padding: '8px', borderRadius: '12px', zIndex: 1 }}>
                <QRCodeSVG value={selectedEmpForCard.emp_id} size={80} level="M" />
              </div>
            </div>

            <button className="btn-primary" onClick={() => handlePrint()} style={{ marginTop: '24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              พิมพ์บัตรพนักงาน
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