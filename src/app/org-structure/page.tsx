'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';

export default function DepartmentAndEmployeePage() {
  // ดึงฟังก์ชันจัดการข้อมูลจาก Hook
  const { employees = [], loadEmployees, removeEmployee, addEmployee, updateEmployee } = useEmployees();
  const { departments = [], loadDepartments } = useDepartments();
  const { positions = [], loadPositions } = usePositions();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // --- เพิ่ม State สำหรับจัดการฟอร์ม ---
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadEmployees?.();
    loadDepartments?.();
    loadPositions?.();
  }, []);

  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (selectedDeptId) result = result.filter(emp => emp.dept_id === selectedDeptId);
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(e => `${e.first_name_th} ${e.last_name_th} ${e.emp_id}`.toLowerCase().includes(term));
    }
    return result;
  }, [employees, selectedDeptId, search]);

  const selectedEmp = useMemo(() => employees.find(e => e.emp_id === selectedEmpId), [selectedEmpId, employees]);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || 'ไม่ระบุ';
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  // --- Functions สำหรับจัดการการคลิก ---
  const handleOpenCreate = () => {
    setFormData({
      emp_id: '',
      prefix: 'นาย',
      first_name_th: '',
      last_name_th: '',
      dept_id: departments[0]?.dept_id || '',
      pos_id: positions[0]?.pos_id || '',
      status: 'Active',
      emp_type: 'Full-time'
    });
    setMode('create');
    setSelectedEmpId('NEW'); // สั่งเปิด sidebar
  };

  const handleOpenEdit = () => {
    setFormData({ ...selectedEmp });
    setMode('edit');
  };

  const handleSave = async () => {
    if (!formData.emp_id || !formData.first_name_th) {
      alert('กรุณากรอกรหัสพนักงานและชื่อ');
      return;
    }

    try {
      if (mode === 'create') {
        await addEmployee?.(formData);
      } else {
        await updateEmployee?.(formData.emp_id, formData);
      }
      loadEmployees?.(); // โหลดข้อมูลใหม่
      setSelectedEmpId(null); // ปิด Sidebar
      setMode('view');
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>

        {/* --- 1. LEFT SIDEBAR --- */}
        <div style={styles.leftSidebar}>
          <div style={{ padding: '24px', background: '#c8b8a0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#45322e', margin: 0 }}>โครงสร้างองค์กร</h2>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div onClick={() => setSelectedDeptId('')} style={{ ...styles.deptItem, background: selectedDeptId === '' ? '#fff' : 'transparent', fontWeight: selectedDeptId === '' ? 700 : 400 }}>
              🌐 พนักงานทั้งหมด
            </div>
            {departments.map(dept => (
              <div key={dept.dept_id} onClick={() => setSelectedDeptId(dept.dept_id)} style={{ ...styles.deptItem, background: selectedDeptId === dept.dept_id ? '#fff' : 'transparent', fontWeight: selectedDeptId === dept.dept_id ? 700 : 400 }}>
                • {dept.dept_name}
              </div>
            ))}
          </div>
        </div>

        {/* --- 2. MAIN CONTENT --- */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{selectedDeptId ? getDeptName(selectedDeptId) : 'รายชื่อพนักงาน'}</h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input placeholder="ค้นหา..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInputCustom} />
              <button style={styles.addBtn} onClick={handleOpenCreate}>+ เพิ่มพนักงาน</button>
            </div>
          </div>

          <div style={styles.tableCard}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={styles.th}>พนักงาน</th>
                  <th style={styles.th}>ตำแหน่ง / แผนก</th>
                  <th style={styles.th}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.emp_id} onClick={() => { setSelectedEmpId(emp.emp_id); setMode('view'); }} style={styles.tableRow}>
                    <td style={styles.td}>{emp.first_name_th} {emp.last_name_th}</td>
                    <td style={styles.td}>{getPosName(emp.pos_id)}</td>
                    <td style={styles.td}>{emp.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- 3. DETAIL & FORM SIDEBAR --- */}
        <div style={{ ...styles.overlay, opacity: selectedEmpId ? 1 : 0, visibility: selectedEmpId ? 'visible' : 'hidden' }} onClick={() => setSelectedEmpId(null)} />

        <div style={{ ...styles.detailSidebar, transform: selectedEmpId ? 'translateX(0)' : 'translateX(100%)', visibility: selectedEmpId ? 'visible' : 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={styles.sideHeader}>
              <h3>{mode === 'create' ? 'เพิ่มพนักงานใหม่' : mode === 'edit' ? 'แก้ไขข้อมูล' : 'รายละเอียดข้อมูล'}</h3>
              <button onClick={() => setSelectedEmpId(null)} style={styles.closeBtn}>✕</button>
            </div>

            <div style={styles.sideBody}>
              {mode === 'view' ? (
                // --- MODE: VIEW ---
                selectedEmp && (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                      <div style={styles.largeAvatar}>{selectedEmp.first_name_th?.[0]}</div>
                      <h2>{selectedEmp.first_name_th} {selectedEmp.last_name_th}</h2>
                    </div>
                    <InfoRow label="รหัสพนักงาน" value={selectedEmp.emp_id} />
                    <InfoRow label="แผนก" value={getDeptName(selectedEmp.dept_id)} />
                    <InfoRow label="เบอร์โทร" value={selectedEmp.phone || '-'} />
                    <InfoRow label="ที่อยู่" value={selectedEmp.address || '-'} isLong />
                  </>
                )
              ) : (
                // --- MODE: EDIT / CREATE ---
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <label style={styles.label}>รหัสพนักงาน *</label>
                  <input style={styles.formInput} disabled={mode === 'edit'} value={formData.emp_id} onChange={e => setFormData({ ...formData, emp_id: e.target.value })} />

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>ชื่อ (ไทย)</label>
                      <input style={styles.formInput} value={formData.first_name_th} onChange={e => setFormData({ ...formData, first_name_th: e.target.value })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={styles.label}>นามสกุล (ไทย)</label>
                      <input style={styles.formInput} value={formData.last_name_th} onChange={e => setFormData({ ...formData, last_name_th: e.target.value })} />
                    </div>
                  </div>

                  <label style={styles.label}>แผนก</label>
                  <select style={styles.formInput} value={formData.dept_id} onChange={e => setFormData({ ...formData, dept_id: e.target.value })}>
                    {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>

                  <label style={styles.label}>ตำแหน่ง</label>
                  <select style={styles.formInput} value={formData.pos_id} onChange={e => setFormData({ ...formData, pos_id: e.target.value })}>
                    {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                  </select>

                  <label style={styles.label}>ที่อยู่</label>
                  <textarea style={{ ...styles.formInput, height: '80px' }} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
              )}
            </div>

            <div style={styles.sideFooter}>
              {mode === 'view' ? (
                <>
                  <button style={styles.mainEditBtn} onClick={handleOpenEdit}>แก้ไขข้อมูล</button>
                  <button style={styles.deleteBtn} onClick={() => { if (confirm('ลบ?')) { removeEmployee?.(selectedEmpId!); setSelectedEmpId(null); } }}>🗑️</button>
                </>
              ) : (
                <>
                  <button style={{ ...styles.mainEditBtn, background: '#10b981' }} onClick={handleSave}>บันทึกข้อมูล</button>
                  <button style={{ ...styles.mainEditBtn, background: '#f1f5f9', color: '#64748b' }} onClick={() => mode === 'create' ? setSelectedEmpId(null) : setMode('view')}>ยกเลิก</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// --- Helper Components & Styles ---
function InfoRow({ label, value, isLong }: any) {
  return (
    <div style={{ marginBottom: '15px', display: 'flex', flexDirection: isLong ? 'column' : 'row', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  leftSidebar: { width: '280px', background: '#d9cbb3', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  deptItem: { padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', marginBottom: '4px' },
  searchInputCustom: { padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', width: '250px' },
  addBtn: { background: '#0f172a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' },
  tableCard: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' },
  th: { padding: '15px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', background: '#f8fafc' },
  td: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9' },
  tableRow: { cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 },
  detailSidebar: { position: 'fixed', right: 0, top: 0, width: '400px', height: '100vh', background: 'white', zIndex: 1000, transition: '0.3s ease' },
  sideHeader: { padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sideBody: { flex: 1, overflowY: 'auto', padding: '20px' },
  sideFooter: { padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px' },
  closeBtn: { border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' },
  largeAvatar: { width: '80px', height: '80px', borderRadius: '20px', background: '#f1f5f9', margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' },
  mainEditBtn: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer' },
  deleteBtn: { padding: '12px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' },
  label: { fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '5px' },
  formInput: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' }
};