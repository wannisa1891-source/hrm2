'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import Swal from 'sweetalert2';

export default function DepartmentAndEmployeePage() {
  const { employees = [], loadEmployees, removeEmployee } = useEmployees();
  const { departments = [], loadDepartments } = useDepartments();
  const { positions = [], loadPositions } = usePositions();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { setPage(1); }, [search, selectedDeptId]);

  useEffect(() => {
    loadEmployees?.();
    loadDepartments?.();
    loadPositions?.();
  }, []);

  // กรองพนักงานตามแผนกและคำค้นหา
  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (selectedDeptId) {
      result = result.filter(emp => emp.dept_id === selectedDeptId);
    }
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(e =>
        `${e.first_name_th} ${e.last_name_th} ${e.emp_id}`.toLowerCase().includes(term)
      );
    }
    return result;
  }, [employees, selectedDeptId, search]);

  const selectedEmp = useMemo(() =>
    employees.find(e => e.emp_id === selectedEmpId),
    [selectedEmpId, employees]
  );

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || 'ไม่ระบุ';
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  const handleDeleteEmployee = async () => {
    if (!selectedEmp) return;
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันการลบพนักงาน?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบพนักงาน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) {
      removeEmployee?.(selectedEmp.emp_id);
      setSelectedEmpId(null);
      Swal.fire({ title: 'ลบสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
    }
  };

  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  const pagedEmployees = filteredEmployees.slice((page - 1) * perPage, page * perPage);

  return (
    <AppLayout>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>

        {/* --- 1. LEFT SIDEBAR (Department Selector) --- */}
        <div style={styles.leftSidebar}>
          <div style={{ padding: '24px', background: '#c8b8a0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#45322e', margin: 0 }}>โครงสร้างองค์กร</h2>
            <p style={{ fontSize: '12px', color: '#5d4037', margin: '4px 0 0' }}>เลือกแผนกเพื่อดูพนักงาน</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <div
              onClick={() => setSelectedDeptId('')}
              style={{
                ...styles.deptItem,
                background: selectedDeptId === '' ? '#fff' : 'transparent',
                fontWeight: selectedDeptId === '' ? 700 : 400,
                boxShadow: selectedDeptId === '' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              🌐 พนักงานทั้งหมด
            </div>

            <div style={{ margin: '20px 0 8px 12px', fontSize: '11px', fontWeight: 700, color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              กลุ่มงาน / แผนก
            </div>
            {departments.map(dept => (
              <div
                key={dept.dept_id}
                onClick={() => setSelectedDeptId(dept.dept_id)}
                style={{
                  ...styles.deptItem,
                  background: selectedDeptId === dept.dept_id ? '#fff' : 'transparent',
                  color: selectedDeptId === dept.dept_id ? '#2563eb' : '#45322e',
                  fontWeight: selectedDeptId === dept.dept_id ? 700 : 400,
                  boxShadow: selectedDeptId === dept.dept_id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                • {dept.dept_name}
              </div>
            ))}
          </div>
        </div>

        {/* --- 2. MAIN CONTENT (Employee Table) --- */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                {selectedDeptId ? getDeptName(selectedDeptId) : 'รายชื่อพนักงานทั้งหมด'}
              </h1>
              <p style={{ color: '#64748b', margin: '4px 0 0' }}>พบพนักงาน {filteredEmployees.length} ท่าน</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={styles.searchWrapper}>
                <span>🔍</span>
                <input
                  placeholder="ค้นหาชื่อ หรือ รหัส..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <button style={styles.addBtn}>+ เพิ่มพนักงาน</button>
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
                {pagedEmployees.map((emp) => (
                  <tr
                    key={emp.emp_id}
                    onClick={() => setSelectedEmpId(emp.emp_id)}
                    style={styles.tableRow}
                  >
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={styles.avatar}>{emp.first_name_th?.[0] || 'E'}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{emp.first_name_th} {emp.last_name_th}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {emp.emp_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 500, fontSize: '14px' }}>{getPosName(emp.pos_id)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{getDeptName(emp.dept_id)}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: emp.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                        color: emp.status === 'Active' ? '#166534' : '#64748b'
                      }}>
                        {emp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {filteredEmployees.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fff', borderRadius: '0 0 16px 16px', marginTop: '-16px' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                แสดง {(page - 1) * perPage + 1}-{Math.min(page * perPage, filteredEmployees.length)} จาก {filteredEmployees.length} ท่าน
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#94a3b8' : '#334155', fontWeight: 600 }}>
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: page === i + 1 ? 'none' : '1px solid #cbd5e1',
                      background: page === i + 1 ? '#3b82f6' : 'white',
                      color: page === i + 1 ? 'white' : '#334155'
                    }}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === totalPages || totalPages === 0 ? 'default' : 'pointer', fontSize: 13, color: page === totalPages || totalPages === 0 ? '#94a3b8' : '#334155', fontWeight: 600 }}>
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- 3. DETAIL SIDEBAR (Drawer) --- */}
        {/* Overlay กันการกดค้างด้านหลัง */}
        <div
          style={{
            ...styles.overlay,
            opacity: selectedEmpId ? 1 : 0,
            visibility: selectedEmpId ? 'visible' : 'hidden'
          }}
          onClick={() => setSelectedEmpId(null)}
        />

        <div style={{
          ...styles.detailSidebar,
          transform: selectedEmpId ? 'translateX(0)' : 'translateX(100%)',
          visibility: selectedEmpId ? 'visible' : 'hidden'
        }}>
          {selectedEmp && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

              {/* Sidebar Header */}
              <div style={styles.sideHeader}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>รายละเอียดข้อมูล</h3>
                <button onClick={() => setSelectedEmpId(null)} style={styles.closeBtn}>✕</button>
              </div>

              {/* Sidebar Body (Scrollable) */}
              <div style={styles.sideBody}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={styles.largeAvatar}>{selectedEmp.first_name_th?.[0] || '👤'}</div>
                  <h2 style={{ margin: '0', fontSize: '22px', fontWeight: 700 }}>
                    {selectedEmp.prefix || ''}{selectedEmp.first_name_th} {selectedEmp.last_name_th}
                  </h2>
                  <p style={{ color: '#6366f1', fontWeight: 600, margin: '4px 0' }}>{getPosName(selectedEmp.pos_id)}</p>
                  <span style={styles.empIdBadge}>{selectedEmp.emp_id}</span>
                </div>

                <div style={styles.sectionDivider}>ข้อมูลการทำงาน</div>
                <div style={styles.infoList}>
                  <InfoRow label="แผนก" value={getDeptName(selectedEmp.dept_id)} />
                  <InfoRow label="ประเภทพนักงาน" value={selectedEmp.emp_type || '-'} />
                  <InfoRow label="สถานะปัจจุบัน" value={selectedEmp.status} color={selectedEmp.status === 'Active' ? '#166534' : '#64748b'} />
                </div>

                <div style={styles.sectionDivider}>ข้อมูลการติดต่อ</div>
                <div style={styles.infoList}>
                  <InfoRow label="เบอร์โทรศัพท์" value={selectedEmp.phone || '-'} />
                  <InfoRow label="เลขบัตรประชาชน" value={selectedEmp.citizen_id || '-'} />
                  <InfoRow label="ที่อยู่ปัจจุบัน" value={selectedEmp.address || '-'} isLong />
                </div>
              </div>

              {/* Sidebar Footer (Fixed at bottom) */}
              <div style={styles.sideFooter}>
                <button style={styles.mainEditBtn}>แก้ไขข้อมูลพนักงาน</button>
                <button
                  onClick={handleDeleteEmployee}
                  style={styles.deleteBtn}
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// --- Sub-components ---
function InfoRow({ label, value, color = '#0f172a', isLong = false }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: isLong ? 'column' : 'row', justifyContent: 'space-between', gap: '4px', padding: '8px 0' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '14px', color: color, fontWeight: 600, textAlign: isLong ? 'left' : 'right' }}>{value}</span>
    </div>
  );
}

// --- Styles Object ---
const styles: Record<string, React.CSSProperties> = {
  leftSidebar: { width: '280px', background: '#d9cbb3', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10 },
  deptItem: { padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', marginBottom: '6px', transition: 'all 0.2s ease' },
  searchWrapper: { display: 'flex', alignItems: 'center', background: 'white', padding: '0 15px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px' },
  searchInput: { border: 'none', outline: 'none', padding: '12px 8px', flex: 1, fontSize: '14px' },
  addBtn: { background: '#0f172a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' },
  tableCard: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  th: { padding: '16px 24px', textAlign: 'left', fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '16px 24px', borderBottom: '1px solid #f1f5f9' },
  tableRow: { cursor: 'pointer', transition: 'background 0.2s' },
  avatar: { width: '36px', height: '36px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366f1' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 999, transition: 'opacity 0.3s ease' },
  detailSidebar: { position: 'fixed', right: 0, top: 0, width: '420px', height: '100vh', background: 'white', zIndex: 1000, transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' },
  sideHeader: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', color: '#64748b' },
  sideBody: { flex: 1, overflowY: 'auto', padding: '32px' },
  largeAvatar: { width: '90px', height: '90px', borderRadius: '28px', background: '#f1f5f9', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' },
  empIdBadge: { display: 'inline-block', padding: '4px 12px', borderRadius: '8px', background: '#eef2ff', fontSize: '12px', color: '#6366f1', fontWeight: 700 },
  sectionDivider: { fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '24px', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '4px' },
  sideFooter: { padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', background: 'white' },
  mainEditBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', fontWeight: 600, cursor: 'pointer' },
  deleteBtn: { padding: '12px', borderRadius: '12px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }
};