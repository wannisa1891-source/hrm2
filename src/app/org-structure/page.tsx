'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import Swal from 'sweetalert2';
import { 
  Users, Search, Plus, Edit2, Trash2, X, User as UserIcon, 
  ChevronRight, Briefcase, MapPin, Phone, Building, Contact, SearchCode
} from 'lucide-react';

export default function DepartmentAndEmployeePage() {
  const { employees = [], loadEmployees, removeEmployee } = useEmployees();
  const { departments = [], loadDepartments, addDepartment, editDepartment, removeDepartment } = useDepartments();
  const { positions = [], loadPositions } = usePositions();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ id: '', name: '', isEdit: false });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { setPage(1); }, [search, selectedDeptId]);

  useEffect(() => {
    loadEmployees?.();
    loadDepartments?.();
    loadPositions?.();
  }, [loadEmployees, loadDepartments, loadPositions]);

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

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || 'ไม่ระบุคะ';
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  const handleDeleteEmployee = async () => {
    if (!selectedEmp) return;
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันการลบพนักงานท่านี้หรือไม่?',
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

  const handleSaveDepartment = async () => {
    if (!deptForm.id || !deptForm.name) {
      Swal.fire({ title: 'กรุณากรอกข้อมูลให้ครบ', icon: 'warning' });
      return;
    }
    const res = deptForm.isEdit 
      ? await editDepartment(deptForm.id, deptForm.name)
      : await addDepartment(deptForm.id, deptForm.name);

    if (res.success) {
       Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
       setIsDeptModalOpen(false);
       if (!deptForm.isEdit) setSelectedDeptId(deptForm.id);
    } else {
       Swal.fire({ title: 'เกิดข้อผิดพลาด', text: res.error, icon: 'error' });
    }
  };

  const handleDeleteDepartment = async (dept_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: 'ยืนยันการลบแผนก',
      text: 'ลบแผนกนี้หรือไม่? พนักงานที่คงอยู่ในแผนกอาจได้รับผลกระทบ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบทิ้ง',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (result.isConfirmed) {
      const res = await removeDepartment(dept_id);
      if (res.success) {
        Swal.fire({ title: 'ลบแผนกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
        if (selectedDeptId === dept_id) setSelectedDeptId('');
      } else {
        Swal.fire({ title: 'เกิดข้อผิดพลาด', text: res.error, icon: 'error' });
      }
    }
  };

  const openDeptModal = (dept: any = null) => {
    if (dept) {
      setDeptForm({ id: dept.dept_id, name: dept.dept_name, isEdit: true });
    } else {
      setDeptForm({ id: '', name: '', isEdit: false });
    }
    setIsDeptModalOpen(true);
  };

  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  const pagedEmployees = filteredEmployees.slice((page - 1) * perPage, page * perPage);

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#f4f7fe', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', 'Sarabun', sans-serif" }}>

        {/* --- 1. LEFT SIDEBAR (Department Selector) --- */}
        <div style={styles.leftSidebar}>
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={24} color="#4f46e5" />
              โครงสร้างองค์กร
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 32px' }}>จัดการกลุ่มงานและบุคลากร</p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            <div
              onClick={() => setSelectedDeptId('')}
              style={{
                ...styles.deptItem,
                background: selectedDeptId === '' ? '#e0e7ff' : 'transparent',
                color: selectedDeptId === '' ? '#4338ca' : '#475569',
                fontWeight: selectedDeptId === '' ? 700 : 500,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} />
                <span>พนักงานทั้งหมด</span>
              </div>
            </div>

            <div style={{ margin: '24px 0 12px 12px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px' }}>
              <span>รายชื่อแผนก</span>
              <button 
                onClick={() => openDeptModal()} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }} 
                title="เพิ่มแผนกใหม่"
                onMouseOver={e => e.currentTarget.style.background = '#eef2ff'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>

            {departments.map(dept => (
              <div
                key={dept.dept_id}
                onClick={() => setSelectedDeptId(dept.dept_id)}
                style={{
                  ...styles.deptItem,
                  background: selectedDeptId === dept.dept_id ? '#e0e7ff' : 'transparent',
                  color: selectedDeptId === dept.dept_id ? '#4338ca' : '#475569',
                  fontWeight: selectedDeptId === dept.dept_id ? 700 : 500,
                }}
              >
                <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                  {dept.dept_name}
                </span>
                
                <div style={{ display: 'flex', gap: '6px', opacity: selectedDeptId === dept.dept_id ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                   <button onClick={(e) => { e.stopPropagation(); openDeptModal(dept); }} style={styles.iconBtn} title="แก้ไข">
                     <Edit2 size={14} />
                   </button>
                   <button onClick={(e) => handleDeleteDepartment(dept.dept_id, e)} style={{ ...styles.iconBtn, color: '#ef4444' }} title="ลบ">
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- 2. MAIN CONTENT (Employee Table) --- */}
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.5px' }}>
                {selectedDeptId ? getDeptName(selectedDeptId) : 'รายชื่อพนักงานทั้งหมด'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', margin: '8px 0 0', fontSize: '14px' }}>
                <Users size={16} />
                <span>จำนวนบุคลากรทั้งหมด {filteredEmployees.length} ท่าน</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={styles.searchWrapper}>
                <Search size={18} color="#94a3b8" />
                <input
                  placeholder="ค้นหาชื่อ, รหัสพนักงาน..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <button style={styles.addBtn}>
                <Plus size={20} />
                เพิ่มพนักงานใหม่
              </button>
            </div>
          </div>

          <div style={styles.tableCard}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={styles.th}>โปรไฟล์พนักงาน</th>
                  <th style={styles.th}>ตำแหน่ง / สายงาน</th>
                  <th style={styles.th}>สถานะ</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>จัดการ</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={styles.avatar}>
                          {emp.image ? (
                             <img src={emp.image} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                          ) : (
                             <span>{emp.first_name_th?.[0] || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{emp.first_name_th} {emp.last_name_th}</div>
                          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>รหัส: {emp.emp_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#334155' }}>{getPosName(emp.pos_id)}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{getDeptName(emp.dept_id)}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: emp.status === 'Active' ? '#dcfce7' : '#f1f5f9',
                        color: emp.status === 'Active' ? '#16a34a' : '#64748b',
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: emp.status === 'Active' ? '#16a34a' : '#94a3b8' }} />
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                       <ChevronRight size={20} color="#cbd5e1" />
                    </td>
                  </tr>
                ))}
                {pagedEmployees.length === 0 && (
                   <tr>
                     <td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                       <SearchCode size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                       <p style={{ fontSize: '16px', fontWeight: 500 }}>ไม่พบข้อมูลพนักงาน</p>
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredEmployees.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: 'transparent', marginTop: '16px' }}>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                แสดง <span style={{color: '#0f172a', fontWeight: 700}}>{(page - 1) * perPage + 1}</span> ถึง <span style={{color: '#0f172a', fontWeight: 700}}>{Math.min(page * perPage, filteredEmployees.length)}</span> จากทั้งหมด {filteredEmployees.length} ท่าน
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ ...styles.pageBtn, opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'default' : 'pointer' }}>
                  ก่อนหน้า
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    style={{
                      ...styles.pageBtn,
                      border: page === i + 1 ? 'none' : '1px solid #e2e8f0',
                      background: page === i + 1 ? '#4f46e5' : 'white',
                      color: page === i + 1 ? 'white' : '#475569',
                      boxShadow: page === i + 1 ? '0 4px 6px -1px rgba(79, 70, 229, 0.2)' : 'none'
                    }}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  style={{ ...styles.pageBtn, opacity: page === totalPages || totalPages === 0 ? 0.5 : 1, cursor: page === totalPages || totalPages === 0 ? 'default' : 'pointer' }}>
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>

        {/* --- 3. DETAIL SIDEBAR (Drawer) --- */}
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
              <div style={styles.sideHeader}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>ฟอร์มรายละเอียด</h3>
                <button onClick={() => setSelectedEmpId(null)} style={styles.closeBtn}><X size={20} /></button>
              </div>

              <div style={styles.sideBody}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={styles.largeAvatar}>
                     {selectedEmp.image ? (
                        <img src={selectedEmp.image} alt="pic" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '32px' }} />
                     ) : (
                       <UserIcon size={48} color="#6366f1" />
                     )}
                  </div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedEmp.prefix || ''}{selectedEmp.first_name_th} {selectedEmp.last_name_th}
                  </h2>
                  <p style={{ color: '#4f46e5', fontWeight: 600, margin: '0 0 12px', fontSize: '15px' }}>{getPosName(selectedEmp.pos_id)}</p>
                  <span style={styles.empIdBadge}>ID: {selectedEmp.emp_id}</span>
                </div>

                <div style={styles.sectionDivider}>
                  <Briefcase size={16} /> ข้อมูลปฏิบัติงาน
                </div>
                <div style={styles.infoBox}>
                  <InfoRow label="สังกัดส่วนงาน" value={getDeptName(selectedEmp.dept_id)} />
                  <InfoRow label="ประเภทจ้างงาน" value={selectedEmp.emp_type || 'ไม่มีระบุ'} />
                  <InfoRow label="สถานะพนักงาน" value={selectedEmp.status} color={selectedEmp.status === 'Active' ? '#16a34a' : '#64748b'} />
                </div>

                <div style={styles.sectionDivider}>
                  <Contact size={16} /> ช่องทางติดต่อ
                </div>
                <div style={styles.infoBox}>
                  <InfoRow label="เบอร์โทรศัพท์" value={selectedEmp.phone || 'ไม่ระบุ'} icon={<Phone size={14} />} />
                  <InfoRow label="เลขบัตรปชช." value={selectedEmp.citizen_id || 'ไม่ระบุ'} />
                  <InfoRow label="ที่อยู่ปัจจุบัน" value={selectedEmp.address || 'ไม่ระบุ'} isLong icon={<MapPin size={14} />} />
                </div>
              </div>

              <div style={styles.sideFooter}>
                <button style={styles.mainEditBtn}>
                  <Edit2 size={18} /> แก้ไขแฟ้มประวัติ
                </button>
                <button onClick={handleDeleteEmployee} style={styles.deleteBtn} title="ลบข้อมูล">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Department Modal --- */}
      {isDeptModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1, transition: 'all 0.3s ease' }}>
           <div style={{ background: '#fff', width: '420px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                  {deptForm.isEdit ? 'แก้ไขแผนก' : 'สร้างแผนกใหม่'}
                </h2>
                <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                   <Briefcase size={24} />
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>รหัสแผนก <span style={{color: '#ef4444'}}>*</span></label>
                <input 
                  type="text" 
                  value={deptForm.id}
                  onChange={(e) => setDeptForm({...deptForm, id: e.target.value})}
                  disabled={deptForm.isEdit}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: deptForm.isEdit ? '#f8fafc' : '#fff', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: deptForm.isEdit ? '#64748b' : '#0f172a' }}
                  placeholder="เช่น D01, HR, IT"
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>ชื่อแผนก <span style={{color: '#ef4444'}}>*</span></label>
                <input 
                  type="text" 
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({...deptForm, name: e.target.value})}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                  placeholder="เช่น ฝ่ายทรัพยากรบุคคล"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => setIsDeptModalOpen(false)}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = '#fff'}
                >
                  ยกเลิก
                </button>
                <button 
                  onClick={handleSaveDepartment}
                  style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  บันทึกข้อมูล
                </button>
              </div>
           </div>
        </div>
      )}
    </AppLayout>
  );
}

// --- Sub-components ---
function InfoRow({ label, value, color = '#0f172a', isLong = false, icon = null }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: isLong ? 'column' : 'row', justifyContent: 'space-between', gap: isLong ? '6px' : '16px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '14px', color: color, fontWeight: 600, textAlign: isLong ? 'left' : 'right', lineHeight: '1.6' }}>{value}</span>
    </div>
  );
}

// --- Styles Object ---
const styles: Record<string, React.CSSProperties> = {
  leftSidebar: { width: '320px', background: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '4px 0 24px rgba(0,0,0,0.02)' },
  deptItem: { padding: '14px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', marginBottom: '8px', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: 'background 0.2s, color 0.2s' },
  searchWrapper: { display: 'flex', alignItems: 'center', background: '#ffffff', padding: '0 16px', borderRadius: '14px', border: '1px solid #e2e8f0', width: '320px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', gap: '10px', transition: 'border-color 0.2s' },
  searchInput: { border: 'none', outline: 'none', padding: '12px 0', flex: 1, fontSize: '14px', color: '#0f172a', background: 'transparent' },
  addBtn: { background: '#0f172a', color: 'white', border: 'none', padding: '0 24px', borderRadius: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)', transition: 'transform 0.2s, background 0.2s' },
  tableCard: { background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.02)' },
  th: { padding: '18px 24px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '20px 24px', borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' },
  tableRow: { cursor: 'pointer', background: '#ffffff' },
  avatar: { width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#4f46e5', fontSize: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  pageBtn: { padding: '8px 16px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 600, color: '#475569', transition: 'all 0.2s' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(4px)', zIndex: 999, transition: 'opacity 0.4s ease' },
  detailSidebar: { position: 'fixed', right: 0, top: 0, width: '460px', height: '100vh', background: '#ffffff', zIndex: 1000, transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)', boxShadow: '-20px 0 40px rgba(0,0,0,0.1)' },
  sideHeader: { padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { border: 'none', background: '#f8fafc', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, color 0.2s' },
  sideBody: { flex: 1, overflowY: 'auto', padding: '32px' },
  largeAvatar: { width: '100px', height: '100px', borderRadius: '32px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.3)' },
  empIdBadge: { display: 'inline-block', padding: '6px 16px', borderRadius: '12px', background: '#f1f5f9', fontSize: '13px', color: '#475569', fontWeight: 700, letterSpacing: '0.05em' },
  sectionDivider: { fontSize: '13px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em', marginTop: '32px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  infoBox: { background: '#f8fafc', borderRadius: '16px', padding: '8px 20px' },
  sideFooter: { padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px', background: '#ffffff' },
  mainEditBtn: { flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)', transition: 'all 0.2s' },
  deleteBtn: { width: '56px', borderRadius: '16px', border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }
};