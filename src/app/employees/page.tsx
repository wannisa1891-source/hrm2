'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee } from '@/services/apiService';

const EMPTY_FORM: Partial<Employee> = {
  prefix: 'นาย', first_name_th: '', last_name_th: '', first_name_en: '', last_name_en: '',
  birth_date: '', gender: 'ชาย', citizen_id: '',
  emp_id: '', dept_id: '', pos_id: '', emp_type: 'พนักงานประจำ', start_date: '', base_salary: 0,
  phone: '', address: '', status: 'Active'
};

export default function EmployeesSplitPage() {
  const { employees, loading, error, loadEmployees, addEmployee, editEmployee, removeEmployee } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'job' | 'other'>('personal');

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, [loadEmployees, loadDepartments, loadPositions]);

  const filtered = employees.filter(e =>
    `${e.first_name_th} ${e.last_name_th}`.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_id.toLowerCase().includes(search.toLowerCase())
  );

  const selectedEmp = employees.find(e => e.emp_id === selectedId) || filtered[0];

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].emp_id);
  }, [filtered, selectedId]);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

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

  const handleSave = async () => {
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
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
      alert(isEditing ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ');
    } else {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (emp_id: string) => {
    if (!confirm('ต้องการลบพนักงานนี้?')) return;
    await removeEmployee(emp_id);
    setSelectedId(null);
  };

  const setField = (key: string, value: unknown) => setFormData(f => ({ ...f, [key]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)', background: '#f8fafc', margin: '-20px', overflow: 'hidden' }}>

        {/* --- ฝั่งซ้าย: Master List --- */}
        <div style={{ width: '350px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>พนักงาน ({filtered.length})</h2>
              <button onClick={openAdd} style={{ padding: '4px 8px', borderRadius: '6px', background: '#00695c', color: 'white', border: 'none', cursor: 'pointer', fontSize: '12px' }}>+ เพิ่ม</button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="ค้นหาชื่อหรือรหัส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 35px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? <div style={{ padding: 20, textAlign: 'center' }}>กำลังโหลด...</div> : filtered.map(emp => (
              <div
                key={emp.emp_id}
                onClick={() => setSelectedId(emp.emp_id)}
                style={{
                  padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #f8fafc',
                  background: selectedId === emp.emp_id ? '#eff6ff' : 'transparent',
                  borderLeft: selectedId === emp.emp_id ? '4px solid #2563eb' : '4px solid transparent'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {emp.image ? <img src={`/uploads/${emp.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emp.first_name_th[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{emp.first_name_th} {emp.last_name_th}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>#{emp.emp_id} • {getDeptName(emp.dept_id)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ฝั่งขวา: Detail View --- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'white' }}>
          {selectedEmp ? (
            <div style={{ maxWidth: '800px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', overflow: 'hidden' }}>
                    {selectedEmp.image ? <img src={`/uploads/${selectedEmp.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{selectedEmp.prefix}{selectedEmp.first_name_th} {selectedEmp.last_name_th}</h1>
                    <p style={{ color: '#64748b', fontSize: '16px', margin: '5px 0' }}>{selectedEmp.first_name_en} {selectedEmp.last_name_en}</p>
                    <span className={`badge ${selectedEmp.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>{selectedEmp.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => openEdit(selectedEmp)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>✏️ แก้ไขข้อมูล</button>
                  <button onClick={() => handleDelete(selectedEmp.emp_id)} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>🗑️ ลบ</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
                <section>
                  <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>ข้อมูลการทำงาน</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <InfoItem label="แผนก" value={getDeptName(selectedEmp.dept_id)} />
                    <InfoItem label="ตำแหน่ง" value={getPosName(selectedEmp.pos_id)} />
                    <InfoItem label="ประเภทการจ้างงาน" value={selectedEmp.emp_type} />
                    <InfoItem label="วันที่เริ่มงาน" value={selectedEmp.start_date} />
                  </div>
                </section>
                <section>
                  <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '15px' }}>ข้อมูลส่วนตัว</h3>
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
          ) : <div style={{ textAlign: 'center', marginTop: 100, color: '#94a3b8' }}>กรุณาเลือกพนักงาน</div>}
        </div>
      </div>

      {/* Modal Form (จากอันแรก) */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box" style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3>{isEditing ? '✏️ แก้ไขข้อมูลพนักงาน' : '➕ เพิ่มพนักงานใหม่'}</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {/* ... (Copy ส่วน Tabs และ form-grid จากโค้ดอันแรกของคุณมาใส่ตรงนี้ได้เลยครับ เพื่อความประหยัดพื้นที่) ... */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
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