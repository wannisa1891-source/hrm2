'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee } from '@/services/apiService';

const EMPTY_FORM: Partial<Employee> = {
  emp_id: '', prefix: 'นาย', first_name_th: '', last_name_th: '',
  first_name_en: '', last_name_en: '', birth_date: '', gender: 'ชาย',
  address: '', citizen_id: '', phone: '', emp_type: 'พนักงานประจำ',
  dept_id: '', pos_id: '', start_date: '', base_salary: 0, image: '',
};

export default function EmployeesPage() {
  const { employees, loading, error, loadEmployees, addEmployee, editEmployee, removeEmployee } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

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

  const openAdd = () => { setFormData({ ...EMPTY_FORM }); setImageFile(null); setIsEditing(false); setShowForm(true); };
  const openEdit = (emp: Employee) => {
    setFormData({ ...emp, citizen_id: emp.citizen_id || '' });
    setImageFile(null); setIsEditing(true); setShowForm(true);
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

  return (
    <AppLayout>
      <div style={{ fontFamily: 'Sarabun, sans-serif' }}>
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">👥 รายชื่อพนักงาน</h1>
            <p className="page-subtitle">ทั้งหมด {employees.length} คน | แสดง {filtered.length} คน</p>
          </div>
          <button className="btn-primary" onClick={openAdd}>+ เพิ่มพนักงานใหม่</button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Filter */}
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ, รหัสพนักงาน..." />
          </div>
          <select className="form-select" style={{ width: 200 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
            <option value="">ทุกแผนก</option>
            {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
          </select>
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
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#888' }}>ไม่พบข้อมูล</td></tr>
                ) : filtered.map(emp => (
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
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal-box">
              <div className="modal-header">
                <h3>{isEditing ? '✏️ แก้ไขข้อมูลพนักงาน' : '➕ เพิ่มพนักงานใหม่'}</h3>
                <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
              </div>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">รหัสพนักงาน</label><input className="form-input" value={formData.emp_id || ''} onChange={e => setField('emp_id', e.target.value)} disabled={isEditing} /></div>
                <div className="form-group"><label className="form-label">คำนำหน้า</label>
                  <select className="form-select" value={formData.prefix || 'นาย'} onChange={e => setField('prefix', e.target.value)}>
                    {['นาย', 'นาง', 'นางสาว', 'ดร.', 'นพ.', 'พญ.'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">ชื่อ (ไทย)</label><input className="form-input" value={formData.first_name_th || ''} onChange={e => setField('first_name_th', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">นามสกุล (ไทย)</label><input className="form-input" value={formData.last_name_th || ''} onChange={e => setField('last_name_th', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">ชื่อ (English)</label><input className="form-input" value={formData.first_name_en || ''} onChange={e => setField('first_name_en', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">นามสกุล (English)</label><input className="form-input" value={formData.last_name_en || ''} onChange={e => setField('last_name_en', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">วันเกิด</label><input type="date" className="form-input" value={formData.birth_date?.toString().split('T')[0] || ''} onChange={e => setField('birth_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">เพศ</label>
                  <select className="form-select" value={formData.gender || 'ชาย'} onChange={e => setField('gender', e.target.value)}>
                    <option>ชาย</option><option>หญิง</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">เลขบัตรประชาชน</label><input className="form-input" value={formData.citizen_id || ''} onChange={e => setField('citizen_id', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">เบอร์โทร</label><input className="form-input" value={formData.phone || ''} onChange={e => setField('phone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">แผนก</label>
                  <select className="form-select" value={formData.dept_id || ''} onChange={e => setField('dept_id', e.target.value)}>
                    <option value="">-- เลือกแผนก --</option>
                    {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">ตำแหน่ง</label>
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
                <div className="form-group"><label className="form-label">เงินเดือนพื้นฐาน</label><input type="number" className="form-input" value={formData.base_salary || 0} onChange={e => setField('base_salary', Number(e.target.value))} /></div>
                <div className="form-group full"><label className="form-label">ที่อยู่</label><textarea className="form-input" rows={2} value={formData.address || ''} onChange={e => setField('address', e.target.value)} /></div>
                <div className="form-group full"><label className="form-label">รูปภาพ</label><input type="file" className="form-input" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} /></div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
