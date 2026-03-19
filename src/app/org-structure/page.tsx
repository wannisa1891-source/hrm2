'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';

export default function PremiumEmployeePage() {
  // ดึงข้อมูลจาก Hook (เช็คชื่อฟังก์ชันให้ตรงกับที่คุณมีในไฟล์ hook นะครับ)
  const { employees = [], loadEmployees, removeEmployee, updateEmployee, addEmployee } = useEmployees();
  const { departments = [], loadDepartments } = useDepartments();
  const { positions = [], loadPositions } = usePositions();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');
  const [formData, setFormData] = useState<any>(null);

  // โหลดข้อมูลเมื่อเข้าหน้าจอ
  useEffect(() => {
    if (loadEmployees) loadEmployees();
    if (loadDepartments) loadDepartments();
    if (loadPositions) loadPositions();
  }, []);

  // ระบบค้นหา
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return (employees || []).filter(e => {
      const deptName = departments?.find(d => d.dept_id === e.dept_id)?.dept_name || '';
      const fullName = `${e.first_name_th || ''} ${e.last_name_th || ''}`.toLowerCase();
      return fullName.includes(term) || (e.emp_id || '').toLowerCase().includes(term) || deptName.toLowerCase().includes(term);
    });
  }, [search, employees, departments]);

  const selectedEmp = (employees || []).find(e => e.emp_id === selectedId);

  // --- Functions ---
  const handleOpenCreate = () => {
    setFormData({
      emp_id: '',
      first_name_th: '',
      last_name_th: '',
      phone: '',
      dept_id: departments?.[0]?.dept_id || '',
      pos_id: positions?.[0]?.pos_id || '',
      status: 'Active',
      address: ''
    });
    setMode('create');
    setSelectedId('NEW');
  };

  const handleOpenEdit = (emp: any) => {
    setFormData({ ...emp });
    setMode('edit');
    setSelectedId(emp.emp_id);
  };

  const handleSave = async () => {
    if (!formData?.emp_id || !formData?.first_name_th) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (รหัสพนักงาน และชื่อ)');
      return;
    }

    try {
      if (mode === 'create') {
        if (addEmployee) await addEmployee(formData);
      } else {
        if (updateEmployee) await updateEmployee(formData.emp_id, formData);
      }
      closeSidebar();
      if (loadEmployees) await loadEmployees();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  const closeSidebar = () => {
    setSelectedId(null);
    setMode('view');
    setFormData(null);
  };

  return (
    <AppLayout>
      <div style={styles.pageContainer}>

        {/* Header Section */}
        <div style={styles.headerSection}>
          <div>
            <h1 style={styles.mainTitle}>Workforce <span style={{ color: '#6366f1' }}>Hub</span></h1>
            <p style={styles.subTitle}>ระบบจัดการข้อมูลพนักงานระดับมืออาชีพ</p>
          </div>
          <button style={styles.addBtnStyle} onClick={handleOpenCreate}>+ New Member</button>
        </div>

        {/* Stats Section */}
        <div style={styles.statsWrapper}>
          <div style={{ ...styles.statCard, borderLeft: '5px solid #6366f1' }}>
            <div style={{ fontSize: '24px', marginRight: '15px' }}>👥</div>
            <div>
              <div style={styles.statLabel}>Total Staff</div>
              <div style={styles.statValue}>{employees?.length || 0}</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '5px solid #10b981' }}>
            <div style={{ fontSize: '24px', marginRight: '15px' }}>🏢</div>
            <div>
              <div style={styles.statLabel}>Departments</div>
              <div style={styles.statValue}>{departments?.length || 0}</div>
            </div>
          </div>
          <div style={{ ...styles.statCard, borderLeft: '5px solid #f59e0b' }}>
            <div style={{ fontSize: '24px', marginRight: '15px' }}>🎯</div>
            <div>
              <div style={styles.statLabel}>Positions</div>
              <div style={styles.statValue}>{positions?.length || 0}</div>
            </div>
          </div>
        </div>

        {/* Search & Table Section */}
        <div style={styles.contentCard}>
          <div style={styles.searchContainer}>
            <span style={{ marginRight: '10px' }}>🔍</span>
            <input
              style={styles.inputField}
              placeholder="ค้นหาพนักงานด้วยชื่อ หรือแผนก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.modernTable}>
              <thead>
                <tr style={styles.tableHeaderRow}>
                  <th style={styles.tableHeadTd}>EMPLOYEE</th>
                  <th style={styles.tableHeadTd}>DEPT & POSITION</th>
                  <th style={styles.tableHeadTd}>STATUS</th>
                  <th style={{ ...styles.tableHeadTd, textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr
                    key={emp.emp_id}
                    style={{ ...styles.tableRow, backgroundColor: selectedId === emp.emp_id ? '#f8faff' : 'transparent' }}
                    onClick={() => { setSelectedId(emp.emp_id); setMode('view'); }}
                  >
                    <td style={styles.tableCell}>
                      <div style={styles.userProfileGroup}>
                        <div style={styles.avatarCircle}>{emp.first_name_th?.[0] || '?'}</div>
                        <div>
                          <div style={styles.nameTextTh}>{emp.first_name_th} {emp.last_name_th}</div>
                          <div style={styles.nameTextEn}>{emp.emp_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {departments?.find(d => d.dept_id === emp.dept_id)?.dept_name || '-'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {positions?.find(p => p.pos_id === emp.pos_id)?.pos_name || '-'}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        background: emp.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                        color: emp.status === 'Active' ? '#15803d' : '#64748b'
                      }}>
                        {emp.status || 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...styles.tableCell, textAlign: 'right' }}>
                      <button
                        style={styles.iconBtn}
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(emp); }}
                      >✎</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Panel */}
        {selectedId && (
          <div style={styles.overlayBg} onClick={closeSidebar}>
            <div style={styles.sidePanel} onClick={e => e.stopPropagation()}>
              <div style={styles.sideHeaderSticky}>
                <h3 style={{ margin: 0 }}>
                  {mode === 'view' ? 'Employee Details' : mode === 'edit' ? 'Edit Profile' : 'New Employee'}
                </h3>
                <button style={styles.closeBtn} onClick={closeSidebar}>✕</button>
              </div>

              <div style={styles.sideContentScroll}>
                {mode === 'view' && selectedEmp ? (
                  <>
                    <div style={styles.detailHeader}>
                      <div style={styles.largeAvatar}>{selectedEmp.first_name_th?.[0]}</div>
                      <h2 style={{ margin: '0 0 5px 0' }}>{selectedEmp.first_name_th} {selectedEmp.last_name_th}</h2>
                      <span style={styles.statusBadge}>{selectedEmp.emp_id}</span>
                    </div>
                    <div style={styles.infoSection}>
                      <div style={styles.infoRow}><strong>🏢 แผนก:</strong> {departments?.find(d => d.dept_id === selectedEmp.dept_id)?.dept_name || '-'}</div>
                      <div style={styles.infoRow}><strong>🎯 ตำแหน่ง:</strong> {positions?.find(p => p.pos_id === selectedEmp.pos_id)?.pos_name || '-'}</div>
                      <div style={styles.infoRow}><strong>📞 โทรศัพท์:</strong> {selectedEmp.phone || '-'}</div>
                      <div style={styles.infoRow}><strong>📍 ที่อยู่:</strong> {selectedEmp.address || '-'}</div>
                    </div>
                  </>
                ) : (
                  <div style={styles.editFormStyle}>
                    <div style={styles.inputGroup}>
                      <label style={styles.labelStyle}>Employee ID *</label>
                      <input
                        style={styles.formInput}
                        disabled={mode === 'edit'}
                        value={formData?.emp_id || ''}
                        onChange={e => setFormData({ ...formData, emp_id: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={styles.labelStyle}>ชื่อ (ไทย)</label>
                        <input style={styles.formInput} value={formData?.first_name_th || ''} onChange={e => setFormData({ ...formData, first_name_th: e.target.value })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={styles.labelStyle}>นามสกุล (ไทย)</label>
                        <input style={styles.formInput} value={formData?.last_name_th || ''} onChange={e => setFormData({ ...formData, last_name_th: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label style={styles.labelStyle}>แผนก</label>
                      <select style={styles.formInput} value={formData?.dept_id || ''} onChange={e => setFormData({ ...formData, dept_id: e.target.value })}>
                        {departments?.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={styles.labelStyle}>ตำแหน่ง</label>
                      <select style={styles.formInput} value={formData?.pos_id || ''} onChange={e => setFormData({ ...formData, pos_id: e.target.value })}>
                        {positions?.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.sideFooterSticky}>
                {mode === 'view' ? (
                  <>
                    <button style={styles.btnEditActive} onClick={() => handleOpenEdit(selectedEmp)}>Edit Profile</button>
                    <button style={styles.btnDelete} onClick={() => { if (confirm('Are you sure?')) { removeEmployee?.(selectedId); closeSidebar(); } }}>Delete</button>
                  </>
                ) : (
                  <>
                    <button style={styles.btnSave} onClick={handleSave}>Save Data</button>
                    <button style={styles.btnCancel} onClick={() => mode === 'create' ? closeSidebar() : setMode('view')}>Cancel</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// --- Styles (Fixed & All-In-One) ---
const styles: Record<string, React.CSSProperties> = {
  pageContainer: { padding: '40px', background: '#f8fafc', minHeight: '100vh' },
  headerSection: { display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' },
  mainTitle: { fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-1px' },
  subTitle: { color: '#64748b' },
  addBtnStyle: { background: '#111827', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 },
  statsWrapper: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' },
  statCard: { background: 'white', padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  statLabel: { color: '#64748b', fontSize: '12px', fontWeight: 600 },
  statValue: { fontSize: '24px', fontWeight: 800, color: '#1e293b' },
  contentCard: { background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  searchContainer: { display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px' },
  inputField: { background: 'transparent', border: 'none', outline: 'none', width: '100%', marginLeft: '10px' },
  modernTable: { width: '100%', borderCollapse: 'collapse' },
  tableHeaderRow: { borderBottom: '1px solid #f1f5f9' },
  tableHeadTd: { padding: '12px', textAlign: 'left', fontSize: '11px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' },
  tableRow: { cursor: 'pointer', borderBottom: '1px solid #f8fafc' },
  tableCell: { padding: '16px 12px' },
  userProfileGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatarCircle: { width: '38px', height: '38px', background: '#6366f1', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  nameTextTh: { fontWeight: 700, fontSize: '14px', color: '#1e293b' },
  nameTextEn: { fontSize: '12px', color: '#94a3b8' },
  iconBtn: { background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: '#6366f1' },
  overlayBg: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'flex-end', zIndex: 1000 },
  sidePanel: { width: '450px', background: 'white', height: '100vh', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 25px -5px rgba(0,0,0,0.1)' },
  sideHeaderSticky: { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' },
  sideContentScroll: { flex: 1, overflowY: 'auto', padding: '24px' },
  sideFooterSticky: { padding: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' },
  detailHeader: { textAlign: 'center', marginBottom: '32px' },
  largeAvatar: { width: '100px', height: '100px', background: '#6366f1', color: 'white', margin: '0 auto 16px', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 700 },
  statusBadge: { background: '#e0e7ff', color: '#4338ca', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 },
  infoSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow: { padding: '16px', background: '#f8fafc', borderRadius: '16px', fontSize: '14px' },
  editFormStyle: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  labelStyle: { fontSize: '13px', fontWeight: 700, color: '#475569' },
  formInput: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' },
  btnEditActive: { flex: 1, padding: '14px', borderRadius: '12px', background: '#6366f1', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' },
  btnSave: { flex: 2, padding: '14px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', border: 'none', fontWeight: 700, cursor: 'pointer' },
  btnDelete: { padding: '14px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', fontWeight: 700, cursor: 'pointer' },
};