'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';

export default function EmployeesSplitPage() {
  const { employees, loading, loadEmployees } = useEmployees();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
<<<<<<< HEAD

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const filtered = employees.filter(e =>
    `${e.first_name_th} ${e.last_name_th}`.includes(search) || e.emp_id.includes(search)
  );

  const selectedEmp = employees.find(e => e.emp_id === selectedId) || filtered[0];

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].emp_id);
  }, [filtered, selectedId]);
=======
  const [filterDept, setFilterDept] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'other'>('personal');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, [loadEmployees, loadDepartments, loadPositions]);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  const filtered = employees.filter(e => {
    const matchSearch = !search || `${e.first_name_th} ${e.last_name_th}`.includes(search) || e.emp_id.includes(search);
    const matchDept = !filterDept || e.dept_id === filterDept;
    return matchSearch && matchDept;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEmployees = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['รหัส', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'แผนก', 'ตำแหน่ง', 'ประเภท', 'สถานะ'];
    const rows = filtered.map(e => [
      e.emp_id, e.prefix, e.first_name_th, e.last_name_th,
      getDeptName(e.dept_id), getPosName(e.pos_id), e.emp_type, e.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAdd = () => { 
    setFormData({ ...EMPTY_FORM }); 
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
    if (imageFile) fd.append('image', imageFile);
    setSaving(true);
    let ok: boolean;
    if (isEditing) {
      ok = await editEmployee(formData.emp_id!, fd);
      if (ok) alert('แก้ไขสำเร็จ');
      else alert('แก้ไขไม่สำเร็จ');
    } else {
      ok = await addEmployee(fd);
      if (ok) alert('เพิ่มสำเร็จ');
      else alert('เพิ่มไม่สำเร็จ');
    }
    setSaving(false);
    if (ok) setShowForm(false);
  };

  const handleDelete = async (emp_id: string) => {
    if (!confirm('ต้องการลบพนักงานนี้?')) return;
    await removeEmployee(emp_id);
  };

  const setField = (key: string, value: unknown) => setFormData(f => ({ ...f, [key]: value }));
>>>>>>> 63812e7ea3e311506e2cfc1e4043d667d74d49ab

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: '#f8fafc', margin: '-20px', overflow: 'hidden' }}>

<<<<<<< HEAD
        {/* --- ฝั่งซ้าย: รายชื่อ (Master List) --- */}
        <div style={{ width: '350px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px' }}>พนักงาน ({filtered.length})</h2>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="ค้นหาชื่อหรือรหัส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 35px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
=======
        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Filter & Export */}
        <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input value={search} onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} placeholder="ค้นหาชื่อ, รหัสพนักงาน..." />
            </div>
            <select className="form-select" style={{ width: 200 }} value={filterDept} onChange={e => {setFilterDept(e.target.value); setCurrentPage(1);}}>
              <option value="">ทุกแผนก</option>
              {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
            </select>
          </div>
          <button className="btn-outline" onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📥</span> Export CSV
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 15 }}>
            ⏳ กำลังโหลดข้อมูล...
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>ตำแหน่ง</th>
                  <th>แผนก</th>
                  <th>ประเภท</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEmployees.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#888' }}>ไม่พบข้อมูล</td></tr>
                ) : paginatedEmployees.map(emp => (
                  <tr key={emp.emp_id}>
                    <td><span style={{ background: '#f0f4ff', color: '#2563eb', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{emp.emp_id}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {emp.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`/uploads/${emp.image}`} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : emp.first_name_th[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.prefix}{emp.first_name_th} {emp.last_name_th}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>{emp.first_name_en} {emp.last_name_en}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 14 }}>{getPosName(emp.pos_id)}</td>
                    <td style={{ fontSize: 14 }}>{getDeptName(emp.dept_id)}</td>
                    <td><span className="badge badge-blue">{emp.emp_type}</span></td>
                    <td><span className={`badge ${emp.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{emp.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-outline" onClick={() => openEdit(emp)}>✏️ แก้ไข</button>
                        <button className="btn-danger" onClick={() => handleDelete(emp.emp_id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#334155' }}
                >
                  ก่อนหน้า
                </button>
                <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>
                  หน้า {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#334155' }}
                >
                  ถัดไป
                </button>
              </div>
            )}
            
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal-box" style={{ maxWidth: 800 }}>
              <div className="modal-header">
                <h3>{isEditing ? '✏️ แก้ไขข้อมูลพนักงาน' : '➕ เพิ่มพนักงานใหม่'}</h3>
                <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
                <button 
                  onClick={() => setActiveTab('personal')} 
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'personal' ? '3px solid #00695c' : '3px solid transparent', color: activeTab === 'personal' ? '#00695c' : '#64748b', fontWeight: activeTab === 'personal' ? 700 : 500, cursor: 'pointer', transition: '0.2s', fontSize: 15 }}
                >
                  👤 ข้อมูลส่วนตัว
                </button>
                <button 
                  onClick={() => setActiveTab('job')} 
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'job' ? '3px solid #00695c' : '3px solid transparent', color: activeTab === 'job' ? '#00695c' : '#64748b', fontWeight: activeTab === 'job' ? 700 : 500, cursor: 'pointer', transition: '0.2s', fontSize: 15 }}
                >
                  💼 ข้อมูลการทำงาน
                </button>
                <button 
                  onClick={() => setActiveTab('other')} 
                  style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: activeTab === 'other' ? '3px solid #00695c' : '3px solid transparent', color: activeTab === 'other' ? '#00695c' : '#64748b', fontWeight: activeTab === 'other' ? 700 : 500, cursor: 'pointer', transition: '0.2s', fontSize: 15 }}
                >
                  📞 ข้อมูลติดต่อ & รูปถ่าย
                </button>
              </div>

              <div className="form-grid">
                
                {/* Tab: Personal */}
                {activeTab === 'personal' && (
                  <>
                    <div className="form-group"><label className="form-label">คำนำหน้า</label>
                      <select className="form-select" value={formData.prefix || 'นาย'} onChange={e => setField('prefix', e.target.value)}>
                        {['นาย', 'นาง', 'นางสาว', 'ดร.', 'นพ.', 'พญ.'].map(p => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div></div> {/* Empty column for alignment */}
                    <div className="form-group"><label className="form-label">ชื่อ (ไทย) <span style={{color: 'red'}}>*</span></label><input className="form-input" value={formData.first_name_th || ''} onChange={e => setField('first_name_th', e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">นามสกุล (ไทย) <span style={{color: 'red'}}>*</span></label><input className="form-input" value={formData.last_name_th || ''} onChange={e => setField('last_name_th', e.target.value)} required /></div>
                    <div className="form-group"><label className="form-label">ชื่อ (English)</label><input className="form-input" value={formData.first_name_en || ''} onChange={e => setField('first_name_en', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">นามสกุล (English)</label><input className="form-input" value={formData.last_name_en || ''} onChange={e => setField('last_name_en', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">วันเกิด</label><input type="date" className="form-input" value={formData.birth_date?.toString().split('T')[0] || ''} onChange={e => setField('birth_date', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">เพศ</label>
                      <select className="form-select" value={formData.gender || 'ชาย'} onChange={e => setField('gender', e.target.value)}>
                        <option>ชาย</option><option>หญิง</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">เลขบัตรประชาชน</label><input className="form-input" value={formData.citizen_id || ''} onChange={e => setField('citizen_id', e.target.value)} maxLength={13} /></div>
                  </>
                )}

                {/* Tab: Job */}
                {activeTab === 'job' && (
                  <>
                    <div className="form-group"><label className="form-label">รหัสพนักงาน <span style={{color: 'red'}}>*</span></label><input className="form-input" value={formData.emp_id || ''} onChange={e => setField('emp_id', e.target.value)} disabled={isEditing} placeholder="เช่น EMP001" /></div>
                    <div className="form-group"><label className="form-label">แผนก <span style={{color: 'red'}}>*</span></label>
                      <select className="form-select" value={formData.dept_id || ''} onChange={e => setField('dept_id', e.target.value)}>
                        <option value="">-- เลือกแผนก --</option>
                        {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">ตำแหน่ง <span style={{color: 'red'}}>*</span></label>
                      <select className="form-select" value={formData.pos_id || ''} onChange={e => setField('pos_id', e.target.value)}>
                        <option value="">-- เลือกตำแหน่ง --</option>
                        {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">ประเภทพนักงาน</label>
                      <select className="form-select" value={formData.emp_type || 'พนักงานประจำ'} onChange={e => setField('emp_type', e.target.value)}>
                        {['พนักงานประจำ', 'พนักงานสัญญาจ้าง', 'พนักงานชั่วคราว', 'ลูกจ้าง'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">วันเริ่มงาน</label><input type="date" className="form-input" value={formData.start_date?.toString().split('T')[0] || ''} onChange={e => setField('start_date', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">เงินเดือนพื้นฐาน (บาท)</label><input type="number" className="form-input" value={formData.base_salary || 0} onChange={e => setField('base_salary', Number(e.target.value))} min={0} /></div>
                  </>
                )}

                {/* Tab: Other/Contact */}
                {activeTab === 'other' && (
                  <>
                    <div className="form-group"><label className="form-label">เบอร์โทรศัพท์ติดต่อ</label><input className="form-input" value={formData.phone || ''} onChange={e => setField('phone', e.target.value)} /></div>
                    <div className="form-group full"><label className="form-label">ที่อยู่ปัจจุบัน</label><textarea className="form-input" rows={3} value={formData.address || ''} onChange={e => setField('address', e.target.value)} placeholder="บ้านเลขที่, ถนน, ซอย, จังหวัด..." /></div>
                    
                    <div className="form-group full" style={{ marginTop: 12 }}>
                      <label className="form-label">รูปถ่ายพนักงาน (Preview)</label>
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center', background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                        
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                           {previewUrl ? (
                             // eslint-disable-next-line @next/next/no-img-element
                             <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           ) : (
                             <span style={{ fontSize: 32, color: '#94a3b8' }}>👤</span>
                           )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <input type="file" className="form-input" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ background: 'white' }} />
                          <p style={{ fontSize: 12, color: '#64748b', marginTop: 8, marginBottom: 0 }}>* รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB แนะนำรูปถ่ายหน้าตรงสุภาพ</p>
                        </div>

                      </div>
                    </div>
                  </>
                )}

              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
              </div>
>>>>>>> 63812e7ea3e311506e2cfc1e4043d667d74d49ab
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(emp => (
              <div
                key={emp.emp_id}
                onClick={() => setSelectedId(emp.emp_id)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f8fafc',
                  background: selectedId === emp.emp_id ? '#eff6ff' : 'transparent',
                  borderLeft: selectedId === emp.emp_id ? '4px solid #2563eb' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                    {emp.first_name_th[0]}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{emp.first_name_th} {emp.last_name_th}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>#{emp.emp_id} • {emp.emp_type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ฝั่งขวา: รายละเอียด (Detail View) --- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'white' }}>
          {selectedEmp ? (
            <div style={{ maxWidth: '800px' }}>
              {/* Header Profile */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: '#f1f5f9', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                    {selectedEmp.image ? <img src={`/uploads/${selectedEmp.image}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '26px', objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{selectedEmp.prefix}{selectedEmp.first_name_th} {selectedEmp.last_name_th}</h1>
                    <p style={{ color: '#64748b', fontSize: '16px', margin: '5px 0' }}>{selectedEmp.first_name_en} {selectedEmp.last_name_en}</p>
                    <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{selectedEmp.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>แก้ไขข้อมูล</button>
                  <button style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>ลบ</button>
                </div>
              </div>

              {/* Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
                <section>
                  <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>ข้อมูลการทำงาน</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <InfoItem label="แผนก" value={selectedEmp.dept_id} />
                    <InfoItem label="ตำแหน่ง" value={selectedEmp.pos_id} />
                    <InfoItem label="ประเภทการจ้างงาน" value={selectedEmp.emp_type} />
                    <InfoItem label="วันที่เริ่มงาน" value={selectedEmp.start_date} />
                  </div>
                </section>
                <section>
                  <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>ข้อมูลส่วนตัว</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <InfoItem label="เลขบัตรประชาชน" value={selectedEmp.citizen_id} />
                    <InfoItem label="เบอร์โทรศัพท์" value={selectedEmp.phone} />
                    <InfoItem label="เพศ" value={selectedEmp.gender} />
                    <InfoItem label="เงินเดือนพื้นฐาน" value={`฿${Number(selectedEmp.base_salary).toLocaleString()}`} />
                  </div>
                </section>
              </div>

              <div style={{ marginTop: '40px', padding: '20px', background: '#f8fafc', borderRadius: '15px' }}>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>ที่อยู่ปัจจุบัน</h3>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{selectedEmp.address || 'ไม่ได้ระบุข้อมูลที่อยู่'}</p>
              </div>

            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              กรุณาเลือกพนักงานเพื่อดูรายละเอียด
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 500 }}>{value || '-'}</div>
    </div>
  );
}