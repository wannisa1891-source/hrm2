'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee } from '@/services/apiService';
import { useSearchParams } from 'next/navigation';

const EMPTY_FORM: Partial<Employee> = {
  prefix: 'นาย', first_name_th: '', last_name_th: '', first_name_en: '', last_name_en: '',
  birth_date: '', gender: 'ชาย', citizen_id: '',
  emp_id: '', dept_id: '', pos_id: '', emp_type: 'พนักงานประจำ', start_date: '', base_salary: 0,
  phone: '', address: '', status: 'Active',
  addr_no: '', addr_moo: '', addr_village: '', addr_soi: '', addr_road: '', addr_province: '', addr_district: '', addr_subdistrict: '', addr_zipcode: '',
  has_license: false, license_no: '', license_expire: '', email: '', password: '', role: 'User',
  license_name: '', license_type: '', license_institution: '', license_issue_date: '', license_status: 'Active', cneu_cme_points: 0
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [licenseFileState, setLicenseFileState] = useState<File | null>(null);
  const [licensePreviewUrl, setLicensePreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'job'>('personal');

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
      const matchLicense = filterLicense === 'all' || e.license_status === filterLicense || (!e.license_status && filterLicense === 'None');
      return matchSearch && matchDept && matchPos && matchStatus && matchLicense;
    });
  }, [employees, search, filterDept, filterPos, filterStatus, filterLicense]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, emp_id: '' });
    setImageFile(null);
    setPreviewUrl(null);
    setLicenseFileState(null);
    setLicensePreviewUrl(null);
    setIsEditing(false);
    setShowForm(true);
    setActiveTab('personal');
  };

  const openEdit = (emp: Employee) => {
    setFormData({ ...emp, citizen_id: emp.citizen_id || '' });
    setImageFile(null);
    setPreviewUrl(emp.image ? `/uploads/${emp.image}` : null);
    setLicenseFileState(null);
    setLicensePreviewUrl(emp.license_file ? `/uploads/${emp.license_file}` : null);
    setIsEditing(true);
    setShowForm(true);
    setActiveTab('personal');
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

    Object.entries(finalFormData).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
    if (imageFile) fd.append('image', imageFile);
    if (licenseFileState) fd.append('license_file', licenseFileState);
    
    setSaving(true);
    let ok: boolean;
    if (isEditing) {
      ok = await editEmployee(formData.emp_id!, fd);
    } else {
      ok = await addEmployee(fd);
    }
    setSaving(false);
    
    if (ok) {
      setShowForm(false);
      alert(isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มพนักงานสำเร็จ');
      loadEmployees(); // reload after save
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const handleDelete = async (emp_id: string) => {
    if (!confirm('ยืนยันลบข้อมูลพนักงานระบบจะไม่สามารถกู้คืนได้?')) return;
    await removeEmployee(emp_id);
  };

  const setField = (key: keyof Employee, value: any) => setFormData(f => ({ ...f, [key]: value }));

  const exportToCSV = () => {
    const headers = ['รหัสพนักงาน', 'คำนำหน้า', 'ชื่อ (TH)', 'นามสกุล (TH)', 'แผนก', 'ตำแหน่ง', 'สถานะการทำงาน', 'วันหมดอายุใบอนุญาต', 'สถานะใบอนุญาต'];
    const rows = filteredData.map(e => [
      e.emp_id, e.prefix, e.first_name_th, e.last_name_th, getDeptName(e.dept_id), getPosName(e.pos_id), e.status,
      e.license_expire ? e.license_expire.substring(0, 10) : 'ไม่มี', e.license_status || 'ไม่มี'
    ]);
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
      <div style={{ padding: '20px', background: '#f8fafc', minHeight: 'calc(100vh - 65px)' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0, textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>ทะเบียนบุคลากร</h1>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อหรือรหัส..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '8px 12px 8px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
              </div>
              <button 
                onClick={openAdd}
                style={{ padding: '8px 16px', background: '#9d8461', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                + เพิ่มพนักงานใหม่
              </button>
              <button 
                onClick={exportToCSV}
                style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
              >
                ดาวน์โหลด EXCEL
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>ตัวกรอง:</label>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="all">ทุกแผนก</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select value={filterPos} onChange={e => setFilterPos(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="all">ทุกตำแหน่ง</option>
                {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="all">สถานะพนักงาน: ทั้งหมด</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select value={filterLicense} onChange={e => setFilterLicense(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white' }}>
                <option value="all">ใบประกอบฯ: ทั้งหมด</option>
                <option value="Active">ปกติ (Active)</option>
                <option value="Expiring Soon">ใกล้หมดอายุ</option>
                <option value="Expired">หมดอายุแล้ว</option>
                <option value="Suspended">พักใช้ใบอนุญาต</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div style={{ overflowX: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#bc9c72', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'center', borderTopLeftRadius: '10px' }}>รูปภาพ</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>ชื่อ-สกุล</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>ตำแหน่ง</th>
                  <th style={{ padding: '15px', textAlign: 'left' }}>แผนก</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>สถานะ</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderTopRightRadius: '10px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลดข้อมูล...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>ไม่พบข้อมูลพนักงาน</td></tr>
                ) : (
                  currentData.map((emp) => (
                    <tr key={emp.emp_id} style={{ borderBottom: '1px solid #f1f5f9', background: emp.license_status === 'Expired' ? '#fbf1f1' : 'transparent' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          {emp.image ? <img src={`/uploads/${emp.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 'รูป'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {emp.prefix}{emp.first_name_th} {emp.last_name_th} 
                          {emp.license_status === 'Expired' && <span style={{ color: '#ef4444', fontSize: '12px', cursor: 'help', fontWeight: 600, border: '1px solid #ef4444', padding: '2px 6px', borderRadius: '4px' }} title="ใบประกอบวิชาชีพหมดอายุ">หมดอายุ</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>รหัส: {emp.emp_id}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#475569' }}>{getPosName(emp.pos_id)}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{getDeptName(emp.dept_id)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          background: emp.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                          color: emp.status === 'Active' ? '#166534' : '#64748b'
                        }}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => openEdit(emp)} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} title="แก้ไขข้อมูล">แก้ไข</button>
                          <button onClick={() => handleDelete(emp.emp_id)} style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }} title="ลบข้อมูล">ลบ</button>
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
          <div className="modal-box" style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)', border: 'none', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', zIndex: 20, borderBottom: '1px solid #f1f5f9' }}>
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
            
            <form onSubmit={handleSave} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
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
                      {previewUrl ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover'}} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}><span style={{fontSize: '12px', fontWeight: 500}}>อัปโหลดรูปภาพ</span></div>}
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
                      <input type="text" value={formData.addr_province || ''} onChange={e => setField('addr_province', e.target.value)} style={addrInputStyle} placeholder="โปรดระบุจังหวัด" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>อำเภอ / เขต</span>
                      <input type="text" value={formData.addr_district || ''} onChange={e => setField('addr_district', e.target.value)} style={addrInputStyle} placeholder="โปรดระบุอำเภอ" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>ตำบล / แขวง</span>
                      <input type="text" value={formData.addr_subdistrict || ''} onChange={e => setField('addr_subdistrict', e.target.value)} style={addrInputStyle} placeholder="โปรดระบุตำบล" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>รหัสไปรษณีย์</span>
                      <input type="text" value={formData.addr_zipcode || ''} onChange={e => setField('addr_zipcode', e.target.value)} style={addrInputStyle} placeholder="10xxx" />
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
                  <span style={{ fontSize: '20px' }}>💼</span> ข้อมูลการทำงานและวิชาชีพ (Job & Professional Info)
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

                {/* Professional License Sub-section */}
                <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>ข้อมูลใบประกอบวิชาชีพ (Professional License)</label>
                    <div style={{ display: 'flex', gap: '15px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: formData.has_license === true || (formData.has_license as any) === 1 ? '#0f172a' : '#64748b' }}>
                        <input type="radio" checked={formData.has_license === true || (formData.has_license as any) === 1} onChange={() => setField('has_license', true)} style={{ width: '16px', height: '16px' }} />
                        มีใบประกอบฯ
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', color: (formData.has_license !== true && (formData.has_license as any) !== 1) ? '#0f172a' : '#64748b' }}>
                        <input type="radio" checked={formData.has_license !== true && (formData.has_license as any) !== 1} onChange={() => setField('has_license', false)} style={{ width: '16px', height: '16px' }} />
                        ไม่มี / ไม่ระบุ
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: (formData.has_license === true || (formData.has_license as any) === 1) ? 1 : 0.5, pointerEvents: (formData.has_license === true || (formData.has_license as any) === 1) ? 'auto' : 'none', transition: 'all 0.3s' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>ชื่อใบอนุญาต</label>
                        <input type="text" placeholder="เช่น ใบประกอบวิชาชีพเวชกรรม" value={formData.license_name || ''} onChange={e => setField('license_name', e.target.value)} style={addrInputStyle} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>ประเภทวิชาชีพ</label>
                        <select value={formData.license_type || ''} onChange={e => setField('license_type', e.target.value)} style={addrInputStyle}>
                          <option value="">[ เลือกประเภท ]</option>
                          <option value="พยาบาล (RN)">พยาบาล (RN)</option>
                          <option value="พยาบาลเทคนิค (PN)">พยาบาลเทคนิค (PN)</option>
                          <option value="แพทย์ (MD)">แพทย์ (MD)</option>
                          <option value="เภสัชกร">เภสัชกร</option>
                          <option value="นักเทคนิคการแพทย์">นักเทคนิคการแพทย์</option>
                          <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>เลขที่ใบประกอบวิชาชีพ</label>
                        <input type="text" placeholder="ระบุเลขที่..." value={formData.license_no || ''} onChange={e => setField('license_no', e.target.value)} style={addrInputStyle} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>สถาบันที่ออกให้</label>
                        <input type="text" placeholder="เช่น สภาการพยาบาล" value={formData.license_institution || ''} onChange={e => setField('license_institution', e.target.value)} style={addrInputStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>วันที่ออกใบอนุญาต</label>
                        <input type="date" value={formData.license_issue_date ? formData.license_issue_date.substring(0, 10) : ''} onChange={e => setField('license_issue_date', e.target.value)} style={addrInputStyle} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>วันหมดอายุ (Expire Date)</label>
                        <input type="date" value={formData.license_expire ? formData.license_expire.substring(0, 10) : ''} onChange={e => setField('license_expire', e.target.value)} style={addrInputStyle} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>สถานะใบอนุญาต</label>
                        <select value={formData.license_status || 'Active'} onChange={e => setField('license_status', e.target.value)} style={{ ...addrInputStyle, background: formData.license_status === 'Expired' ? '#fef2f2' : formData.license_status === 'Suspended' ? '#fffbeb' : '#ffffff' }}>
                          <option value="Active">ปกติ (Active)</option>
                          <option value="Expiring Soon">ใกล้หมดอายุ</option>
                          <option value="Expired">หมดอายุแล้ว</option>
                          <option value="Suspended">พักใช้ใบอนุญาต</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b' }}>คะแนนหน่วยกิต (CNEU/CME)</label>
                        <input type="number" step="0.5" min="0" placeholder="0" value={formData.cneu_cme_points || ''} onChange={e => setField('cneu_cme_points', parseFloat(e.target.value))} style={addrInputStyle} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      <label style={{ fontSize: '12px', color: '#64748b' }}>ไฟล์แนบหลักฐาน (Digital Copy)</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button type="button" onClick={() => document.getElementById('licenseUpload')?.click()} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          อัปโหลดไฟล์
                        </button>
                        <input id="licenseUpload" type="file" accept="image/*,.pdf" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) { setLicenseFileState(file); if(file.type.startsWith('image/')) setLicensePreviewUrl(URL.createObjectURL(file)); else setLicensePreviewUrl(null); }
                        }} style={{ display: 'none' }} />
                        {(licenseFileState || licensePreviewUrl) && (
                           <span style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             {licenseFileState ? licenseFileState.name : 'มีไฟล์แนบอัปโหลดแล้วอ้างอิงจากระบบ'}
                           </span>
                        )}
                      </div>
                      {licensePreviewUrl && licensePreviewUrl.startsWith('blob:') && (
                        <div style={{ marginTop: '10px', width: '200px', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={licensePreviewUrl} alt="License Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#f8fafc' }} />
                        </div>
                      )}
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
                  ยกเลิก (Cancel)
                </button>
                <button type="submit" disabled={saving} style={{ padding: '12px 40px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: saving ? 'wait' : 'pointer', fontWeight: 600, fontSize: '15px', display: 'flex', gap: '8px', alignItems: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s', opacity: saving ? 0.8 : 1 }}>
                  {saving ? 'กำลังประมวลผล...' : 'บันทึกข้อมูล (Save & Complete)'}
                </button>
              </div>
            </form>
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