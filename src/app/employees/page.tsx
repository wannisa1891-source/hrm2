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
  has_license: false, license_no: '', license_expire: '', email: '', password: '', role: 'User'
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      return matchSearch && matchDept && matchPos && matchStatus;
    });
  }, [employees, search, filterDept, filterPos, filterStatus]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openAdd = () => {
    setFormData({ ...EMPTY_FORM, emp_id: `EMP${Date.now().toString().slice(-4)}` });
    setImageFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
    setShowForm(true);
    setActiveTab('personal');
  };

  const openEdit = (emp: Employee) => {
    setFormData({ ...emp, citizen_id: emp.citizen_id || '' });
    setImageFile(null);
    setPreviewUrl(emp.image ? `/uploads/${emp.image}` : null);
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
    const headers = ['รหัสพนักงาน', 'คำนำหน้า', 'ชื่อ (TH)', 'นามสกุล (TH)', 'แผนก', 'ตำแหน่ง', 'สถานะ'];
    const rows = filteredData.map(e => [
      e.emp_id, e.prefix, e.first_name_th, e.last_name_th, getDeptName(e.dept_id), getPosName(e.pos_id), e.status
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

  return (
    <AppLayout>
      <div style={{ padding: '20px', background: '#f8fafc', minHeight: 'calc(100vh - 65px)' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>ทะเบียนบุคลากร</h1>
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
                <option value="all">สถานะ: ทั้งหมด</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
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
                    <tr key={emp.emp_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                          {emp.image ? <img src={`/uploads/${emp.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{emp.prefix}{emp.first_name_th} {emp.last_name_th}</div>
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
                          <button onClick={() => openEdit(emp)} style={{ padding: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }} title="แก้ไขข้อมูล">✏️</button>
                          <button onClick={() => handleDelete(emp.emp_id)} style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }} title="ลบข้อมูล">🗑️</button>
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

      {/* Full Edit/Add Modal */}
      {showForm && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, padding: '20px' }}>
          <div className="modal-box" style={{ background: '#cbd5e1', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '4px solid white' }}>
            <div style={{ padding: '20px 25px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10, margin: '15px 15px 0 15px', borderRadius: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>{isEditing ? 'ฟอร์มแก้ไขข้อมูลพนักงาน' : 'ฟอร์มลงทะเบียนพนักงานใหม่'}</h3>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', right: '20px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Section 1: ข้อมูลส่วนตัว */}
              <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>1. ข้อมูลส่วนตัว</h4>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  {/* Image Block */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '120px', height: '140px', borderRadius: '12px', background: 'white', border: '2px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('imageUpload')?.click()}>
                      {previewUrl ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover'}} /> : <span style={{fontSize: '16px', color: '#64748b', fontWeight: 500}}>Image</span>}
                    </div>
                    <input id="imageUpload" type="file" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                    }} style={{ display: 'none' }} />
                  </div>

                  {/* Info Block */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ minWidth: '120px', fontWeight: 500, fontSize: '14px' }}>คำนำหน้า (วิชาชีพ) :</span>
                      <select value={formData.prefix || ''} onChange={e => setField('prefix', e.target.value)} required style={{ flex: 1, maxWidth: '250px', padding: '6px 12px', borderRadius: '20px', border: '1px solid #94a3b8', background: '#e2e8f0' }}>
                        <option value="">[ เลือก (นพ./พญ./ทน./นาง/นาย...) ]</option>
                        <option value="นาย">นาย</option>
                        <option value="นาง">นาง</option>
                        <option value="นางสาว">นางสาว</option>
                        <option value="นพ.">นพ.</option>
                        <option value="พญ.">พญ.</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ minWidth: '120px', fontWeight: 500, fontSize: '14px' }}>ชื่อ (ไทย):</span>
                        <input type="text" value={formData.first_name_th || ''} onChange={e => setField('first_name_th', e.target.value)} required style={{ flex: 1, padding: '6px 12px', borderRadius: '20px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ minWidth: '100px', fontWeight: 500, fontSize: '14px' }}>นามสกุล (ไทย):</span>
                        <input type="text" value={formData.last_name_th || ''} onChange={e => setField('last_name_th', e.target.value)} required style={{ flex: 1, padding: '6px 12px', borderRadius: '20px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ minWidth: '120px', fontWeight: 500, fontSize: '14px' }}>ชื่อ (Eng):</span>
                        <input type="text" value={formData.first_name_en || ''} onChange={e => setField('first_name_en', e.target.value)} style={{ flex: 1, padding: '6px 12px', borderRadius: '20px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ minWidth: '100px', fontWeight: 500, fontSize: '14px' }}>นามสกุล (Eng):</span>
                        <input type="text" value={formData.last_name_en || ''} onChange={e => setField('last_name_en', e.target.value)} style={{ flex: 1, padding: '6px 12px', borderRadius: '20px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>เลขบัตรประชาชน (13 หลัก)</span>
                        <input type="text" placeholder="[ x-xxxx-xxxxx-xx-x ]" value={formData.citizen_id || ''} onChange={e => setField('citizen_id', e.target.value)} required maxLength={13} style={{ width: '80%', padding: '6px 12px', borderRadius: '20px', border: 'none', background: 'transparent', borderBottom: '1px dashed #94a3b8' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, marginTop: '25px' }}>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>วันเกิด:</span>
                        <input type="date" value={formData.birth_date ? formData.birth_date.substring(0, 10) : ''} onChange={e => setField('birth_date', e.target.value)} required style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #94a3b8', background: '#e2e8f0', color: '#64748b' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>ที่อยู่ปัจจุบัน</span>
                  
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>เลขที่ :</span>
                      <input type="text" value={formData.addr_no || ''} onChange={e => setField('addr_no', e.target.value)} style={{ width: '60px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>หมู่ที่:</span>
                      <input type="text" value={formData.addr_moo || ''} onChange={e => setField('addr_moo', e.target.value)} style={{ width: '40px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>ชื่อหมู่บ้าน/อาคาร:</span>
                      <input type="text" value={formData.addr_village || ''} onChange={e => setField('addr_village', e.target.value)} style={{ width: '120px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>ซอย:</span>
                      <input type="text" value={formData.addr_soi || ''} onChange={e => setField('addr_soi', e.target.value)} style={{ width: '100px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>ถนน:</span>
                      <input type="text" value={formData.addr_road || ''} onChange={e => setField('addr_road', e.target.value)} style={{ width: '100px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>จังหวัด:</span>
                      <select value={formData.addr_province || ''} onChange={e => setField('addr_province', e.target.value)} style={{ width: '120px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0', color: formData.addr_province ? '#000' : '#64748b' }}>
                        <option value="">[ เลือกจังหวัด ]</option>
                        <option value="กรุงเทพมหานคร">กรุงเทพมหานคร</option>
                        <option value="เชียงใหม่">เชียงใหม่</option>
                        {/* More options could be added here */}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>อำเภอ/เขต:</span>
                      <select value={formData.addr_district || ''} onChange={e => setField('addr_district', e.target.value)} style={{ width: '120px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0', color: formData.addr_district ? '#000' : '#64748b' }}>
                        <option value="">[ เลือกอำเภอ ]</option>
                        <option value="เมือง">เมือง</option>
                        {/* More options could be added here */}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>ตำบล/แขวง:</span>
                      <select value={formData.addr_subdistrict || ''} onChange={e => setField('addr_subdistrict', e.target.value)} style={{ width: '120px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0', color: formData.addr_subdistrict ? '#000' : '#64748b' }}>
                        <option value="">[ เลือกตำบล ]</option>
                        <option value="บางกะปิ">บางกะปิ</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '14px' }}>รหัสไปรษณีย์:</span>
                      <input type="text" value={formData.addr_zipcode || ''} onChange={e => setField('addr_zipcode', e.target.value)} style={{ width: '100px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                    </div>
                  </div>
                  
                  {isEditing && (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>(สำหรับข้อมูลเดิม) ที่อยู่เต็ม:</span>
                      <textarea rows={2} value={formData.address || ''} onChange={e => setField('address', e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
                    </div>
                  )}

                </div>
              </div>

              {/* Section 2: ข้อมูลการทำงานและวิชาชีพ */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>2 ข้อมูลการทำงานและวิชาชีพ</h4>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>รหัสพนักงาน:</span>
                    <input type="text" value={formData.emp_id || ''} onChange={e => setField('emp_id', e.target.value)} required readOnly={isEditing} style={{ width: '120px', padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: '#e2e8f0' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>วันที่เริ่มงาน:</span>
                    <input type="date" value={formData.start_date ? formData.start_date.substring(0, 10) : ''} onChange={e => setField('start_date', e.target.value)} required style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>ประเภทการจ้าง:</span>
                    <select value={formData.emp_type || ''} onChange={e => setField('emp_type', e.target.value)} style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white', color: '#64748b' }}>
                      <option value="ข้าราชการ">[ ข้าราชการ ]</option>
                      <option value="พนักงานประจำ">พนักงานประจำ</option>
                      <option value="พาร์ทไทม์">พาร์ทไทม์</option>
                      <option value="สัญญาจ้าง">สัญญาจ้าง</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>สังกัดกลุ่มงาน:</span>
                    <select value={formData.dept_id || ''} onChange={e => setField('dept_id', e.target.value)} required style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white', color: formData.dept_id ? '#000' : '#64748b' }}>
                      <option value="">[ เลือก ]</option>
                      {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>แผนก:</span>
                    <select value={formData.dept_id || ''} onChange={e => setField('dept_id', e.target.value)} style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white', color: formData.dept_id ? '#000' : '#64748b' }}>
                      <option value="">[ เลือก ]</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>ตำแหน่ง:</span>
                    <select value={formData.pos_id || ''} onChange={e => setField('pos_id', e.target.value)} required style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white', color: formData.pos_id ? '#000' : '#64748b' }}>
                      <option value="">[ เลือก ]</option>
                      {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>ข้อมูลใบประกอบวิชาชีพ :</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.has_license} onChange={e => setField('has_license', e.target.checked)} />
                    แนบไฟล์
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!formData.has_license} onChange={e => setField('has_license', !e.target.checked)} />
                    ไม่ระบุ
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>เลขที่ใบประกอบฯ:</span>
                    <input type="text" placeholder="[ .................. ]" value={formData.license_no || ''} onChange={e => setField('license_no', e.target.value)} disabled={!formData.has_license} style={{ padding: '4px 8px', border: 'none', background: 'transparent', borderBottom: '1px dashed #94a3b8', opacity: formData.has_license ? 1 : 0.5 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>วันหมดอายุใบประกอบฯ:</span>
                    <input type="date" value={formData.license_expire ? formData.license_expire.substring(0, 10) : ''} onChange={e => setField('license_expire', e.target.value)} disabled={!formData.has_license} style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white', color: '#64748b', opacity: formData.has_license ? 1 : 0.5 }} />
                  </div>
                </div>
              </div>

              {/* Section 3: การติดต่อ */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' }}>3. การติดต่อ</h4>
                
                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>เบอร์โทรศัพท์มือถือ :</span>
                    <input type="tel" placeholder="[ 0xx-xxx-xxxx ]" value={formData.phone || ''} onChange={e => setField('phone', e.target.value)} required style={{ padding: '4px 8px', border: 'none', background: 'transparent', borderBottom: '1px dashed #94a3b8', fontSize: '14px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>อีเมล (สำหรับ Login) :</span>
                    <input type="email" placeholder="[ .........@chaam-hosp.go.th ]" value={formData.email || ''} onChange={e => setField('email', e.target.value)} style={{ padding: '4px 8px', border: 'none', background: 'transparent', borderBottom: '1px dashed #94a3b8', fontSize: '14px', minWidth: '220px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '30px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>กำหนดรหัสผ่านเบื้องต้น:</span>
                    <input type="text" placeholder="[ *********** ]" value={formData.password || ''} onChange={e => setField('password', e.target.value)} style={{ padding: '4px 8px', border: 'none', background: 'transparent', borderBottom: '1px dashed #94a3b8', fontSize: '14px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>สิทธิ์การใช้งาน :</span>
                    <select value={formData.role || ''} onChange={e => setField('role', e.target.value)} style={{ padding: '4px 8px', borderRadius: '15px', border: '1px solid #94a3b8', background: 'white', color: '#64748b' }}>
                      <option value="User">[ User / Head / Admin ]</option>
                      <option value="User">User</option>
                      <option value="Head">Head</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px', paddingBottom: '10px' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 40px', background: '#d4a373', color: 'black', border: 'border: 2px solid #b8865c', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }}>
                  ยกเลิก
                </button>
                <button type="submit" disabled={saving} style={{ padding: '10px 40px', background: '#65c953', color: 'black', border: 'border: 2px solid #55ac45', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '16px', boxShadow: '2px 2px 5px rgba(0,0,0,0.2)' }}>
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
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