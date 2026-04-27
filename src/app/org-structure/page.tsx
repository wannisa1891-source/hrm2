'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import {
  Users, Search, Plus, Edit2, Trash2, X, UserIcon,
  ChevronRight, Briefcase, MapPin, Phone, Building, Contact, SearchCode, FileText
} from '@/components/Icons';
import Image from 'next/image';

export default function DepartmentAndEmployeePage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const { employees = [], loadEmployees, removeEmployee, editEmployee } = useEmployees();
  const { departments = [], loadDepartments, addDepartment, editDepartment, removeDepartment } = useDepartments();
  const { positions = [], loadPositions } = usePositions();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDiv, setSelectedDiv] = useState<string>('');
  const [selectedGrp, setSelectedGrp] = useState<string>('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Accordion State
  const [expandedDivs, setExpandedDivs] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const isHead = user?.role?.toLowerCase() === 'head';
  const isStandardUser = !isAdmin && !isHead;
  const userEmp = useMemo(() => employees.find(e => e.emp_id === user?.emp_id), [employees, user?.emp_id]);
  const userDeptId = userEmp?.dept_id;

  // Hierarchical Data Structure
  const hierarchy = useMemo(() => {
    const tree: any = {};
    departments.forEach(dept => {
      const div = dept.division?.trim() || 'ชุดอื่นๆ';
      const grp = dept.dept_name?.trim() || 'ทั่วไป';
      if (!tree[div]) tree[div] = {};
      if (!tree[div][grp]) tree[div][grp] = [];
      tree[div][grp].push(dept);
    });
    return tree;
  }, [departments]);

  const toggleDiv = (div: string) => {
    setExpandedDivs(prev => prev.includes(div) ? prev.filter(d => d !== div) : [...prev, div]);
  };

  const toggleGrp = (grp: string) => {
    setExpandedGroups(prev => prev.includes(grp) ? prev.filter(g => g !== grp) : [...prev, grp]);
  };

  // Auto-select user's department for standard users
  useEffect(() => {
    if (isStandardUser && userDeptId && !selectedDeptId) {
      const dept = departments.find(d => d.dept_id === userDeptId);
      if (dept) {
        setSelectedDiv(dept.division || '');
        setSelectedGrp(dept.dept_name || '');
        setSelectedDeptId(userDeptId);
        setExpandedDivs([dept.division || '']);
        setExpandedGroups([dept.dept_name || '']);
      }
    }
  }, [isStandardUser, userDeptId, selectedDeptId, departments]);

  // Dept Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [deptForm, setDeptForm] = useState({
    id: '', name: '', division: '', isEdit: false,
    sub_dept: '', capacity: 0,
    description: '', head_emp_id: '', phone: '', org_chart_url: '', sop_url: '', rules_url: ''
  });
  const [showDeptEmployees, setShowDeptEmployees] = useState(false);
  const [showDeptInterns, setShowDeptInterns] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => { setPage(1); }, [search, selectedDeptId, selectedDiv, selectedGrp]);

  useEffect(() => {
    loadEmployees?.();
    loadDepartments?.();
    loadPositions?.();
  }, [loadEmployees, loadDepartments, loadPositions]);

  const { regularStaff, internStaff } = useMemo(() => {
    let base = employees;
    if (selectedDeptId === 'interns') {
      return { regularStaff: [], internStaff: base.filter(emp => emp.emp_type === 'นักศึกษาฝึกงาน') };
    } else if (selectedDeptId || selectedGrp || selectedDiv) {
      base = base.filter(emp => {
        const dept = departments.find(d => d.dept_id === emp.dept_id);
        if (!dept) return false;
        if (selectedDeptId) return emp.dept_id === selectedDeptId;
        if (selectedGrp) return dept.dept_name?.trim() === selectedGrp && (dept.division?.trim() === selectedDiv);
        if (selectedDiv) return dept.division?.trim() === selectedDiv;
        return true;
      });
    }

    if (search) {
      const term = search.toLowerCase();
      base = base.filter(e => {
        const dept = departments.find(d => d.dept_id === e.dept_id);
        const deptName = dept?.dept_name || '';
        const divName = dept?.division || '';
        const subDept = dept?.sub_dept || '';
        return `${e.first_name_th || ''} ${e.last_name_th || ''} ${e.emp_id || ''} ${deptName} ${divName} ${subDept}`.toLowerCase().includes(term);
      });
    }

    return {
      regularStaff: base.filter(emp => emp.emp_type !== 'นักศึกษาฝึกงาน'),
      internStaff: base.filter(emp => emp.emp_type === 'นักศึกษาฝึกงาน')
    };
  }, [employees, selectedDeptId, selectedDiv, selectedGrp, search, departments]);

  const filteredEmployees = useMemo(() => [...regularStaff, ...internStaff], [regularStaff, internStaff]);

  const selectedEmp = useMemo(() =>
    employees.find(e => e.emp_id === selectedEmpId),
    [selectedEmpId, employees]
  );

  const getDeptName = (id: string) => {
    const dept = departments.find(d => String(d.dept_id) === String(id));
    if (!dept) return id || '-';
    return `${dept.division} > ${dept.dept_name}${dept.sub_dept ? ` > ${dept.sub_dept}` : ''}`;
  };
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;
  const formatPosName = (posName: string, gender?: string, prefix?: string) => {
    if (posName.includes(' / ') && (gender || prefix)) {
      const parts = posName.split(' / ');
      const isFemale = gender === 'หญิง' || prefix === 'นาง' || prefix === 'นางสาว' || prefix === 'พญ.' || prefix === 'ดญ.';
      return isFemale ? (parts[1] || parts[0]) : parts[0];
    }
    return posName;
  };

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
    const deptData = {
      division: deptForm.division,
      sub_dept: deptForm.sub_dept,
      capacity: Number(deptForm.capacity || 0),
      description: deptForm.description,
      head_emp_id: deptForm.head_emp_id,
      phone: deptForm.phone,
      org_chart_url: deptForm.org_chart_url,
      sop_url: deptForm.sop_url,
      rules_url: deptForm.rules_url
    };

    const res = deptForm.isEdit
      ? await editDepartment(deptForm.id, { dept_name: deptForm.name, ...deptData })
      : await addDepartment({ dept_id: deptForm.id, dept_name: deptForm.name, ...deptData });

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

  const openDeptModal = (dept: any = null, mode: 'view' | 'edit' | 'create' = 'view') => {
    if (dept) {
      setModalMode(mode);
      setDeptForm({
        id: dept.dept_id, name: dept.dept_name, division: dept.division || '', isEdit: true,
        sub_dept: dept.sub_dept || '',
        capacity: dept.capacity || 0,
        description: dept.description || '',
        head_emp_id: dept.head_emp_id || '',
        phone: dept.phone || '',
        org_chart_url: dept.org_chart_url || '',
        sop_url: dept.sop_url || '',
        rules_url: dept.rules_url || ''
      });
    } else {
      setModalMode('create');
      setDeptForm({
        id: '', name: '', division: '', isEdit: false,
        sub_dept: '', capacity: 0,
        description: '', head_emp_id: '', phone: '', org_chart_url: '', sop_url: '', rules_url: ''
      });
    }
    setShowDeptEmployees(false);
    setShowDeptInterns(false);
    setIsDeptModalOpen(true);
  };

  const totalPages = Math.ceil(filteredEmployees.length / perPage);
  const pagedEmployees = filteredEmployees.slice((page - 1) * perPage, page * perPage);

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', 'Sarabun', sans-serif" }}>

        {/* --- 1. LEFT SIDEBAR (Department Selector) --- */}
        <div style={styles.leftSidebar}>
          <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={24} color="#4f46e5" />
              โครงสร้างองค์กร
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0 32px' }}>จัดการกลุ่มงานและบุคลากร</p>
          </div>

          <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
            {!isStandardUser && (
              <>
                <div
                  onClick={() => setSelectedDeptId('')}
                  style={{
                    ...styles.deptItem,
                    background: selectedDeptId === '' ? 'linear-gradient(90deg, #eef2ff 0%, #ffffff 100%)' : 'transparent',
                    color: selectedDeptId === '' ? '#4f46e5' : '#64748b',
                    fontWeight: selectedDeptId === '' ? 700 : 500,
                    borderLeft: selectedDeptId === '' ? '4px solid #4f46e5' : '4px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={20} />
                    <span>พนักงานทั้งหมด</span>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedDeptId('interns')}
                  style={{
                    ...styles.deptItem,
                    background: selectedDeptId === 'interns' ? 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%)' : 'transparent',
                    color: selectedDeptId === 'interns' ? '#10b981' : '#64748b',
                    fontWeight: selectedDeptId === 'interns' ? 700 : 500,
                    borderLeft: selectedDeptId === 'interns' ? '4px solid #10b981' : '4px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Contact size={20} />
                    <span>นักศึกษาฝึกงาน</span>
                  </div>
                </div>
              </>
            )}

            <div style={{ margin: '24px 0 12px 12px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px' }}>
              <span>รายชื่อแผนก</span>
              {isAdmin && (
                <button
                  onClick={() => openDeptModal()}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6366f1', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }}
                  title="เพิ่มแผนกใหม่"
                  onMouseOver={e => e.currentTarget.style.background = '#eef2ff'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              )}
            </div>

            {Object.keys(hierarchy).sort().map(divName => {
              const isDivExpanded = expandedDivs.includes(divName);
              const groups = hierarchy[divName];

              return (
                <div key={divName} style={{ marginBottom: '8px' }}>
                  <div
                    onClick={() => {
                      toggleDiv(divName);
                      setSelectedDiv(divName);
                      setSelectedGrp('');
                      setSelectedDeptId('');
                    }}
                    style={{
                      ...styles.divHeader,
                      background: selectedDiv === divName && !selectedGrp ? 'linear-gradient(90deg, #eef2ff 0%, #ffffff 100%)' : 'transparent',
                      color: selectedDiv === divName ? '#4f46e5' : '#475569',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700 }}>{divName}</span>
                    </div>
                    <ChevronRight size={20} style={{ transform: isDivExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </div>

                  {isDivExpanded && (
                    <div style={{ paddingLeft: '12px', marginTop: '4px' }}>
                      {Object.keys(groups).sort().map(grpName => {
                        const isGrpExpanded = expandedGroups.includes(`${divName}-${grpName}`);
                        const units = groups[grpName];
                        const hasSubDepts = units.some((u: any) => u.sub_dept);

                        return (
                          <div key={grpName} style={{ marginBottom: '4px' }}>
                            <div
                              onClick={() => {
                                toggleGrp(`${divName}-${grpName}`);
                                setSelectedDiv(divName);
                                setSelectedGrp(grpName);
                                setSelectedDeptId('');
                              }}
                              style={{
                                ...styles.grpHeader,
                                background: selectedGrp === grpName && selectedDiv === divName && !selectedDeptId ? '#f8fafc' : 'transparent',
                                color: selectedGrp === grpName && selectedDiv === divName ? '#4f46e5' : '#64748b',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                <span style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{grpName}</span>
                              </div>
                              {hasSubDepts && (
                                <ChevronRight size={18} style={{ transform: isGrpExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                              )}
                            </div>

                            {isGrpExpanded && hasSubDepts && (
                              <div style={{ paddingLeft: '20px', marginTop: '2px' }}>
                                {units.sort((a: any, b: any) => (a.sub_dept || '').localeCompare(b.sub_dept || '', 'th')).map((unit: any) => (
                                  <div
                                    key={unit.dept_id}
                                    onClick={() => {
                                      setSelectedDiv(divName);
                                      setSelectedGrp(grpName);
                                      setSelectedDeptId(unit.dept_id);
                                      openDeptModal(unit);
                                    }}
                                    style={{
                                      ...styles.unitItem,
                                      background: selectedDeptId === unit.dept_id ? '#eff6ff' : 'transparent',
                                      color: selectedDeptId === unit.dept_id ? '#2563eb' : '#94a3b8',
                                    }}
                                  >
                                    <span style={{ fontSize: '12px' }}>{unit.sub_dept || 'ฝ่ายบริหาร'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- 2. MAIN CONTENT (Employee Table) --- */}
        <div className="no-scrollbar" style={{ flex: 1, padding: '32px 40px 180px', overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px' }}>
            <div style={{ minWidth: '300px' }}>
              <h1 style={{
                display: 'inline-block',
                fontSize: '32px',
                fontWeight: 800,
                margin: 0,
                lineHeight: '1.6',
                padding: '10px 0',
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #1e293b 0%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {selectedDeptId === 'interns' ? 'รายชื่อนักศึกษาฝึกงานทั้งหมด' : (selectedDeptId ? `${getDeptName(selectedDeptId)} (${departments.find(d => d.dept_id === selectedDeptId)?.sub_dept || ''})` : selectedGrp ? selectedGrp : selectedDiv ? selectedDiv : 'รายชื่อบุคลากรทั้งหมด')}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', margin: '8px 0 0', fontSize: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '4px 12px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
                  <Users size={14} color="#4f46e5" />
                  <span>พนักงาน: <strong>{regularStaff.length}</strong> ท่าน</span>
                </div>
                {internStaff.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', padding: '4px 12px', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                    <Contact size={14} color="#10b981" />
                    <span>นศ.ฝึกงาน: <strong>{internStaff.length}</strong> ท่าน</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
              <div style={styles.searchWrapper}>
                <Search size={18} color="#94a3b8" />
                <input
                  placeholder="ค้นหาชื่อ, เลขประจำตำแหน่ง..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              {isAdmin && (
                <button style={styles.addBtn} onClick={() => router.push('/employees')}>
                  <Plus size={20} />
                  เพิ่มพนักงานใหม่
                </button>
              )}
            </div>
          </div>

          {/* --- Regular Staff Section --- */}
          {(selectedDeptId !== 'interns') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', marginTop: '8px' }}>
                <Users size={20} color="#4f46e5" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>รายชื่อพนักงานประจำ</h2>
              </div>
              <div style={styles.tableCard}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ ...styles.th, width: '80px' }}>รูปภาพ</th>
                      <th style={{ ...styles.th, width: '100px' }}>เลขประจำตำแหน่ง</th>
                      <th style={styles.th}>ชื่อ-สกุล</th>
                      <th style={styles.th}>ชื่อเล่น</th>
                      <th style={styles.th}>กลุ่มงาน</th>
                      <th style={styles.th}>หน่วยงาน</th>
                      <th style={styles.th}>ตำแหน่ง</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'center' }}>สถานะ</th>
                      <th style={{ ...styles.th, width: '80px', textAlign: 'right' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regularStaff.slice((page - 1) * perPage, page * perPage).map((emp) => (
                      <EmployeeRow key={emp.emp_id} emp={emp} isAdmin={isAdmin} departments={departments} positions={positions} setSelectedEmpId={setSelectedEmpId} getPosName={getPosName} getDeptName={getDeptName} formatPosName={formatPosName} user={user} editEmployee={editEmployee} />
                    ))}
                    {regularStaff.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>ไม่มีพนักงานในแผนกนี้</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination for regular staff */}
              {regularStaff.length > perPage && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', marginBottom: '24px' }}>
                  <Pagination page={page} setPage={setPage} totalItems={regularStaff.length} perPage={perPage} />
                </div>
              )}
            </>
          )}

          {/* --- Intern Section --- */}
          {(internStaff.length > 0 || selectedDeptId === 'interns') && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', marginTop: '32px' }}>
                <Contact size={20} color="#10b981" />
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: 0 }}>รายชื่อนักศึกษาฝึกงาน</h2>
              </div>
              <div style={{ ...styles.tableCard, borderTop: '4px solid #10b981' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ ...styles.th, width: '80px' }}>รูปภาพ</th>
                      <th style={{ ...styles.th, width: '100px' }}>เลขประจำตำแหน่ง</th>
                      <th style={styles.th}>ชื่อ-สกุล</th>
                      <th style={styles.th}>ชื่อเล่น</th>
                      <th style={styles.th}>กลุ่มงาน</th>
                      <th style={styles.th}>หน่วยงาน</th>
                      <th style={styles.th}>ตำแหน่ง</th>
                      <th style={{ ...styles.th, width: '120px', textAlign: 'center' }}>สถานะ</th>
                      <th style={{ ...styles.th, width: '80px', textAlign: 'right' }}>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {internStaff.map((emp) => (
                      <EmployeeRow key={emp.emp_id} emp={emp} isAdmin={isAdmin} departments={departments} positions={positions} setSelectedEmpId={setSelectedEmpId} getPosName={getPosName} getDeptName={getDeptName} formatPosName={formatPosName} user={user} editEmployee={editEmployee} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>ข้อมูลรายละเอียด</h3>
                <button onClick={() => setSelectedEmpId(null)} style={styles.closeBtn}><X size={20} /></button>
              </div>

              <div style={styles.sideBody}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={styles.largeAvatar}>
                    {selectedEmp.image ? (
                      <Image fill unoptimized src={`/uploads/${selectedEmp.image}`} alt="pic" style={{ objectFit: 'cover', borderRadius: '32px' }} />
                    ) : (
                      <UserIcon size={48} color="#6366f1" />
                    )}
                  </div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedEmp.prefix || ''}{selectedEmp.first_name_th} {selectedEmp.last_name_th}
                  </h2>
                  <p style={{ color: '#4f46e5', fontWeight: 600, margin: '0 0 12px', fontSize: '15px' }}>{formatPosName(getPosName(selectedEmp.pos_id), selectedEmp.gender, selectedEmp.prefix)}</p>
                  <span style={styles.empIdBadge}>ID: {selectedEmp.emp_id}</span>
                </div>

                <div style={styles.sectionDivider}>
                  <Briefcase size={16} /> ข้อมูลปฏิบัติงาน
                </div>
                <div style={styles.infoBox}>
                  <InfoRow label="แผนก/หน่วยงาน" value={getDeptName(selectedEmp.dept_id)} />
                  <InfoRow label="ประเภทจ้างงาน" value={selectedEmp.emp_type || 'ไม่มีระบุ'} />
                  <InfoRow label="สถานะพนักงาน" value={selectedEmp.status} color={(selectedEmp.status === 'Active' || selectedEmp.status === 'ทำงานปกติ') ? '#16a34a' : '#64748b'} />
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
                {isAdmin && (
                  <>
                    <button style={styles.mainEditBtn} onClick={() => router.push(`/employees?q=${selectedEmp.emp_id}`)}>
                      <Edit2 size={18} /> แก้ไขแฟ้มประวัติ
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Department Modal --- */}
      {isDeptModalOpen && (
        <div onClick={() => setIsDeptModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1, transition: 'all 0.3s ease', cursor: 'pointer' }}>
          <div className="custom-scrollbar" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '540px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '32px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', cursor: 'default' }}>

            {modalMode === 'view' ? (() => {
              const deptHeadEmp = employees.find(e => e.emp_id === deptForm.head_emp_id);
              const deptEmployeesList = employees.filter(e => e.dept_id === deptForm.id);
              return (
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '18px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', flexShrink: 0, boxShadow: '0 8px 16px rgba(99, 102, 241, 0.15)' }}>
                        <Briefcase size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1', letterSpacing: '0.05em', marginBottom: '2px', textTransform: 'uppercase' }}>รหัสแผนก: {deptForm.id}</div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{deptForm.name}</h2>
                        {deptForm.description && <p style={{ margin: '6px 0 0', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>{deptForm.description}</p>}
                      </div>
                    </div>
                    <button onClick={() => setIsDeptModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '8px', borderRadius: '50%', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-8px', marginRight: '-8px' }} onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }} onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}>
                      <X size={22} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                    {/* Dept Head */}
                    <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <UserIcon size={16} /> หัวหน้าแผนก
                      </div>
                      {deptHeadEmp ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '64px', height: '64px', position: 'relative', borderRadius: '20px', background: '#e0e7ff', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            {deptHeadEmp.image ? (
                              <Image fill unoptimized src={`/uploads/${deptHeadEmp.image}`} alt="head" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 800, fontSize: '24px' }}>{deptHeadEmp.first_name_th?.[0] || 'U'}</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>{deptHeadEmp.prefix}{deptHeadEmp.first_name_th} {deptHeadEmp.last_name_th}</div>
                            <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{getPosName(deptHeadEmp.pos_id)}</div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}><Phone size={14} color="#6366f1" /> {deptHeadEmp.phone || 'ไม่ระบุเบอร์โทร'}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', background: '#fff', padding: '16px', borderRadius: '16px', textAlign: 'center' }}>ยังไม่ได้ระบุหัวหน้าแผนก</div>
                      )}
                    </div>

                    {/* Contact & Docs */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                      {deptForm.phone && (
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                          <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><Contact size={20} /></div>
                          <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>เบอร์ติดต่อแผนก</div>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>{deptForm.phone}</div>
                          </div>
                        </div>
                      )}

                      {(deptForm.org_chart_url || deptForm.sop_url || deptForm.rules_url) ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {deptForm.org_chart_url && (
                            <a href={deptForm.org_chart_url} target="_blank" rel="noreferrer" style={{ padding: '12px 20px', background: '#fff', borderRadius: '16px', fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}><FileText size={16} /> Org Chart</a>
                          )}
                          {deptForm.sop_url && (
                            <a href={deptForm.sop_url} target="_blank" rel="noreferrer" style={{ padding: '12px 20px', background: '#fff', borderRadius: '16px', fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}><FileText size={16} /> SOP</a>
                          )}
                          {deptForm.rules_url && (
                            <a href={deptForm.rules_url} target="_blank" rel="noreferrer" style={{ padding: '12px 20px', background: '#fff', borderRadius: '16px', fontSize: '14px', color: '#4f46e5', textDecoration: 'none', fontWeight: 700, border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={e => { e.currentTarget.style.background = '#e0e7ff'; e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'translateY(0)' }}><FileText size={16} /> Rules</a>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Employee List Section */}
                  <div style={{ marginBottom: '16px' }}>
                    {(() => {
                      const regularEmployees = deptEmployeesList.filter(e => e.emp_type !== 'นักศึกษาฝึกงาน');
                      return (
                        <>
                          <div
                            onClick={() => setShowDeptEmployees(!showDeptEmployees)}
                            style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '16px 20px', background: '#f8fafc', borderRadius: '20px', transition: 'all 0.2s', border: '1px solid transparent' }}
                            onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'transparent'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <Users size={20} color="#6366f1" />
                              <span>ดูรายชื่อพนักงาน ({regularEmployees.length} คน)</span>
                            </div>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                              <ChevronRight size={18} color="#64748b" style={{ transform: showDeptEmployees ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </div>
                          </div>

                          {showDeptEmployees && (
                            <div style={{ marginBottom: '12px' }}>
                              {regularEmployees.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                  {regularEmployees.map(emp => {
                                    const canViewEmployeeDetails = isAdmin || user?.emp_id === deptForm.head_emp_id;
                                    return (
                                      <div
                                        key={emp.emp_id}
                                        onClick={() => {
                                          if (canViewEmployeeDetails) {
                                            setSelectedEmpId(emp.emp_id);
                                            setIsDeptModalOpen(false);
                                          }
                                        }}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9',
                                          cursor: canViewEmployeeDetails ? 'pointer' : 'default',
                                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                        }}
                                        onMouseOver={e => { if (canViewEmployeeDetails) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                                        onMouseOut={e => { if (canViewEmployeeDetails) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#f1f5f9'; } }}
                                      >
                                        <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '14px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                                          {emp.image ? (
                                            <Image fill unoptimized src={`/uploads/${emp.image}`} alt="emp" style={{ objectFit: 'cover' }} />
                                          ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, fontSize: '18px' }}>{emp.first_name_th?.[0] || 'U'}</div>
                                          )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.first_name_th} {emp.last_name_th}</div>
                                          <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px', fontWeight: 500 }}>
                                            {formatPosName(getPosName(emp.pos_id), emp.gender, emp.prefix) || 'พนักงาน'} {emp.phone ? ` • โทร: ${emp.phone}` : ''}
                                          </div>
                                        </div>
                                        {canViewEmployeeDetails && <ChevronRight size={18} color="#cbd5e1" />}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', padding: '24px', background: '#f8fafc', borderRadius: '20px', textAlign: 'center' }}>ไม่มีพนักงานปกติในแผนกนี้</div>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Interns Section */}
                  {(() => {
                    const internsList = deptEmployeesList.filter(e => e.emp_type === 'นักศึกษาฝึกงาน');
                    if (internsList.length === 0) return null;
                    return (
                      <div style={{ marginBottom: '32px' }}>
                        <div
                          onClick={() => setShowDeptInterns(!showDeptInterns)}
                          style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '16px 20px', background: '#f0fdf4', borderRadius: '20px', transition: 'all 0.2s', border: '1px solid transparent' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.borderColor = '#bbf7d0'; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Contact size={20} color="#10b981" />
                            <span>ดูรายชื่อนักศึกษาฝึกงาน ({internsList.length} คน)</span>
                          </div>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <ChevronRight size={18} color="#64748b" style={{ transform: showDeptInterns ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                          </div>
                        </div>

                        {showDeptInterns && (
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                              {internsList.map(emp => {
                                const canViewEmployeeDetails = isAdmin || user?.emp_id === deptForm.head_emp_id;
                                return (
                                  <div
                                    key={emp.emp_id}
                                    onClick={() => {
                                      if (canViewEmployeeDetails) {
                                        setSelectedEmpId(emp.emp_id);
                                        setIsDeptModalOpen(false);
                                      }
                                    }}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '16px', background: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9',
                                      cursor: canViewEmployeeDetails ? 'pointer' : 'default',
                                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseOver={e => { if (canViewEmployeeDetails) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#e2e8f0'; } }}
                                    onMouseOut={e => { if (canViewEmployeeDetails) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#f1f5f9'; } }}
                                  >
                                    <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '14px', background: '#f1f5f9', overflow: 'hidden', flexShrink: 0 }}>
                                      {emp.image ? (
                                        <Image fill unoptimized src={`/uploads/${emp.image}`} alt="emp" style={{ objectFit: 'cover' }} />
                                      ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, fontSize: '18px' }}>{emp.first_name_th?.[0] || 'U'}</div>
                                      )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.first_name_th} {emp.last_name_th}</div>
                                      <div style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px', fontWeight: 500 }}>
                                        {formatPosName(getPosName(emp.pos_id), emp.gender, emp.prefix) || 'นักศึกษาฝึกงาน'} {emp.phone ? ` • โทร: ${emp.phone}` : ''}
                                      </div>
                                    </div>
                                    {canViewEmployeeDetails && <ChevronRight size={18} color="#cbd5e1" />}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => setModalMode('edit')}
                        style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#0f172a', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}
                        onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
                        onMouseOut={e => e.currentTarget.style.background = '#0f172a'}
                      >
                        <Edit2 size={16} /> แก้ไขข้อมูลแผนก
                      </button>
                    </div>
                  )}
                </div>
              );
            })() : (
              // Edit / Create Form
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                    {deptForm.isEdit ? 'แก้ไขแผนก' : 'สร้างแผนกใหม่'}
                  </h2>
                  <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                    <Briefcase size={24} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>รหัสแผนก <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={deptForm.id}
                    onChange={(e) => setDeptForm({ ...deptForm, id: e.target.value })}
                    disabled={deptForm.isEdit}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', background: deptForm.isEdit ? '#f8fafc' : '#fff', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: deptForm.isEdit ? '#64748b' : '#0f172a' }}
                    placeholder="เช่น D01, HR, IT"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>กลุ่มงาน (Division) <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    list="division-options"
                    value={deptForm.division}
                    onChange={(e) => setDeptForm({ ...deptForm, division: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                    placeholder="เช่น กลุ่มงานบริหารทั่วไป"
                  />
                  <datalist id="division-options">
                    {Array.from(new Set(departments.map(d => String(d.division || '').trim()))).filter(Boolean).sort().map(div => (
                      <option key={div} value={div} />
                    ))}
                  </datalist>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>ชื่อแผนก <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                    placeholder="เช่น ฝ่ายทรัพยากรบุคคล"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>แผนกย่อย / หน่วยงานย่อย</label>
                    <input
                      type="text"
                      value={deptForm.sub_dept || ''}
                      onChange={(e) => setDeptForm({ ...deptForm, sub_dept: e.target.value })}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                      placeholder="เช่น OPD"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>อัตรากำลัง</label>
                    <input
                      type="number"
                      value={deptForm.capacity || ''}
                      onChange={(e) => setDeptForm({ ...deptForm, capacity: e.target.value ? parseInt(e.target.value, 10) : 0 })}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>คำอธิบายแผนก</label>
                  <textarea
                    rows={2}
                    value={deptForm.description}
                    onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a', resize: 'vertical' }}
                    placeholder="รายละเอียดหน้าที่รับผิดชอบของแผนก..."
                  />
                </div>

                {isAdmin && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>หัวหน้าแผนก (สิทธิ์แอดมิน)</label>
                    <select
                      value={deptForm.head_emp_id}
                      onChange={(e) => setDeptForm({ ...deptForm, head_emp_id: e.target.value })}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #6366f1', background: '#f8fafc', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                    >
                      <option value="">-- ไม่ระบุ --</option>
                      {employees.filter(emp => emp.dept_id === deptForm.id || (deptForm.head_emp_id && emp.emp_id === deptForm.head_emp_id)).map(emp => (
                        <option key={emp.emp_id} value={emp.emp_id}>{emp.first_name_th} {emp.last_name_th} ({formatPosName(getPosName(emp.pos_id), emp.gender, emp.prefix)})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>ช่องทางติดต่อ</label>
                    <input
                      type="text"
                      value={deptForm.phone}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setDeptForm({ ...deptForm, phone: val });
                      }}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s', color: '#0f172a' }}
                      placeholder="08X-XXXXXXX"
                    />
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '16px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>เอกสารแนบส่วนแผนก (ระบุลิงก์ URL)</label>

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>ผังโครงสร้าง (Org Chart)</span>
                    <input type="text" value={deptForm.org_chart_url} onChange={(e) => setDeptForm({ ...deptForm, org_chart_url: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} placeholder="https://..." />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>คู่มือปฏิบัติงาน (SOP)</span>
                    <input type="text" value={deptForm.sop_url} onChange={(e) => setDeptForm({ ...deptForm, sop_url: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} placeholder="https://..." />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>ระเบียบปฏิบัติ (Rules)</span>
                    <input type="text" value={deptForm.rules_url} onChange={(e) => setDeptForm({ ...deptForm, rules_url: e.target.value })} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }} placeholder="https://..." />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setIsDeptModalOpen(false)}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveDepartment}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', transition: 'all 0.2s' }}
                  >
                    บันทึกข้อมูล
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}



// --- Styles Object (ฉบับปรับสีตามรูปภาพที่ส่งมา) ---
const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: 'flex',
    height: 'calc(100vh - 64px)',
    background: '#a0c1e2ff', // สีพื้นหลังเทานวลๆ แบบในรูป
    overflow: 'hidden',
    position: 'relative',
    fontFamily: "'Inter', 'Sarabun', sans-serif"
  },
  leftSidebar: {
    width: '320px',
    background: '#fff',
    borderRight: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 10
  },
  sidebarHeader: { padding: '28px 24px 20px', borderBottom: '1px solid #f1f5f9' },
  sidebarTitle: { fontSize: '20px', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
  sidebarSubtitle: { fontSize: '13px', color: '#80a9b1ff', margin: '6px 0 0 32px' },
  deptItem: {
    padding: '14px 16px', margin: '4px 0', borderRadius: '12px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px', transition: 'all 0.2s'
  },
  deptLabelContainer: {
    margin: '24px 0 12px 12px', fontSize: '12px', fontWeight: 700, color: '#94a3b8',
    textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '8px'
  },
  smallAddBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6' },
  divHeader: {
    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', fontSize: '15px', transition: 'all 0.2s', marginBottom: '4px'
  },
  grpHeader: {
    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', fontSize: '14px', transition: 'all 0.2s', fontWeight: 600
  },
  unitItem: {
    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
    gap: '8px', fontSize: '13px', transition: 'all 0.2s', fontWeight: 500
  },
  mainContent: { flex: 1, padding: '32px 40px', overflowY: 'auto' },
  mainHeader: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px' },
  mainTitle: { fontSize: '32px', fontWeight: 800, margin: 0, color: '#1e293b' },
  countBadge: { display: 'flex', alignItems: 'center', gap: '8px', color: '#87c2c2ff', margin: '8px 0 0', fontSize: '15px' },
  iconBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '6px', background: '#e2e8f0', color: '#475569' },
  searchWrapper: {
    position: 'relative', display: 'flex', alignItems: 'center', background: '#fff',
    padding: '0 16px', borderRadius: '16px', border: '1px solid #e2e8f0', width: '300px'
  },
  searchInput: { border: 'none', padding: '12px 10px', fontSize: '14px', width: '100%', outline: 'none' },

  // ปุ่มเพิ่มพนักงานสีเทาเข้ม (Slate) ตามรูป
  addBtn: {
    background: '#94a3b8',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },

  tableCard: { background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9', overflow: 'visible' },
  th: { padding: '20px 24px', textAlign: 'center', fontSize: '14px', fontWeight: 600, color: '#64748b', background: '#fff' },
  td: { padding: '16px 24px', borderBottom: '1px solid #f8fafc', textAlign: 'center', verticalAlign: 'middle' },
  tableRow: { transition: '0.2s' },

  avatar: {
    width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', position: 'relative', overflow: 'hidden'
  },

  // Badge รหัสแผนก (D002) สีเทาอ่อนขอบเส้น
  deptBadge: {
    padding: '4px 12px', background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: '8px', color: '#64748b', fontWeight: 600, fontSize: '12px'
  },

  // สีสถานะ Active เขียวสว่างตามรูป
  statusBadge: {
    padding: '4px 14px', background: '#dcfce7', color: '#22c55e',
    borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center'
  },

  // --- ชุดสีปุ่มจัดการ 4 สี (Copy ตามรูปภาพเป๊ะๆ) ---
  actionGroup: { display: 'flex', gap: '8px', justifyContent: 'center' },

  // 1. สีฟ้า (ดูข้อมูล/บัตร)
  btnBlue: {
    width: 36, height: 36, borderRadius: '10px', border: 'none',
    background: '#e0f2fe', color: '#0ea5e9', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  // 2. สีเหลือง (กุญแจ/รหัส)
  btnYellow: {
    width: 36, height: 36, borderRadius: '10px', border: 'none',
    background: '#fef3c7', color: '#d97706', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  // 3. สีน้ำเงิน/ม่วง (แก้ไข)
  btnIndigo: {
    width: 36, height: 36, borderRadius: '10px', border: 'none',
    background: '#e0e7ff', color: '#4f46e5', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  // 4. สีแดง (ลบ)
  btnRed: {
    width: 36, height: 36, borderRadius: '10px', border: 'none',
    background: '#fee2e2', color: '#ef4444', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },

  paginationContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' },
  pageBtn: { padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, background: '#fff' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(2px)', zIndex: 40 },
  detailSidebar: {
    position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px',
    background: '#fff', zIndex: 50, boxShadow: '-10px 0 30px rgba(0,0,0,0.05)'
  },
  sideHeader: { padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' },
  closeBtn: { background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '10px', cursor: 'pointer' },
  sideBody: { flex: 1, overflowY: 'auto', padding: '32px' },
  largeAvatar: { width: '120px', height: '120px', borderRadius: '50%', background: '#f1f5f9', margin: '0 auto 20px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  empIdBadge: { padding: '4px 12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#64748b' },
  sectionDivider: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: '32px 0 16px' },
  infoBox: { background: '#f8fafc', borderRadius: '20px', padding: '8px 20px', border: '1px solid #f1f5f9' },
  sideFooter: { padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' },
  mainEditBtn: { flex: 1, padding: '14px', borderRadius: '16px', background: '#1e293b', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none' },
  deleteBtn: { padding: '14px', borderRadius: '16px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { background: '#fff', width: '540px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '32px', padding: '40px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  deptIconBox: { width: 56, height: 56, borderRadius: '18px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' },
  deptIdLabel: { fontSize: '13px', fontWeight: 800, color: '#0ea5e9' },
  modalTitleText: { margin: 0, fontSize: '24px', fontWeight: 800, color: '#1e293b' },
  modalCloseBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  headSection: { background: '#f8fafc', borderRadius: '24px', padding: '24px', marginBottom: '20px', border: '1px solid #f1f5f9' },
  sectionSmallLabel: { fontSize: '13px', fontWeight: 800, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  headAvatar: { width: 64, height: 64, borderRadius: '50%', background: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  noDataBox: { padding: '16px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' },
  deptEmployeesAccordion: { padding: '16px 20px', background: '#f8fafc', borderRadius: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', border: '1px solid #f1f5f9' },
  accordionList: { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' },
  accordionItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#fff' },
  smallAvatar: { width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalFooter: { display: 'flex', gap: '12px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', marginTop: '20px' },
  editDeptBtn: { flex: 1, padding: '14px', borderRadius: '16px', background: '#4f46e5', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none' },
  deleteDeptBtn: { padding: '14px', borderRadius: '16px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inputLabel: { fontSize: '14px', fontWeight: 700, color: '#475569' },
  modalInput: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' },
  cancelBtn: { flex: 1, padding: '14px', borderRadius: '16px', background: '#f1f5f9', border: 'none', fontWeight: 700, cursor: 'pointer', color: '#64748b' },
  saveBtn: { flex: 2, padding: '14px', borderRadius: '16px', background: '#4f46e5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }
};

// --- Sub-components (defined for cleaner code) ---

function EmployeeRow({
  emp, isAdmin, departments, positions, setSelectedEmpId,
  getPosName, getDeptName, formatPosName, user, editEmployee
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <tr
      key={emp.emp_id}
      onClick={() => {
        const currentDept = departments.find((d: any) => d.dept_id === emp.dept_id);
        const canView = isAdmin || (currentDept && user?.emp_id === currentDept.head_emp_id);
        if (canView) {
          setSelectedEmpId(emp.emp_id);
        } else {
          Swal.fire({ title: 'ไม่มีสิทธิ์เข้าถึง', text: 'เฉพาะแอดมินหรือหัวหน้าแผนกเท่านั้นที่จะดูข้อมูลได้', icon: 'error' });
        }
      }}
      style={styles.tableRow}
    >
      <td style={styles.td}>
        <div style={styles.avatar}>
          {emp.image ? (
            <Image fill unoptimized src={`/uploads/${emp.image}`} alt="pic" style={{ objectFit: 'cover', borderRadius: '12px' }} />
          ) : (
            <span>{emp.first_name_th?.[0] || 'U'}</span>
          )}
        </div>
      </td>
      <td style={{ ...styles.td, fontWeight: 700, color: '#475569' }}>
        {emp.position_no || emp.emp_id}
      </td>
      <td style={styles.td}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {emp.first_name_th} {emp.last_name_th}
          {(() => {
            if (!emp.birth_date) return null;
            const bDate = new Date(emp.birth_date);
            if (isNaN(bDate.getTime())) return null;
            const birthYear = bDate.getFullYear();
            const currentYear = new Date().getFullYear();
            if (birthYear + 60 !== currentYear) return null;
            const month = bDate.getMonth();
            if (month >= 9) {
              return <span style={{ color: '#f97316', fontSize: '14px', fontWeight: 900, cursor: 'help' }} title="เกษียณปีถัดไปตามงบประมาณ">*</span>;
            }
            return null;
          })()}
        </div>
      </td>
      <td style={{ ...styles.td, color: '#334155' }}>
        {emp.nickname || '-'}
      </td>
      <td style={{ ...styles.td, color: '#4f46e5', fontSize: '14px', fontWeight: 600 }}>
        {departments.find((d: any) => String(d.dept_id) === String(emp.dept_id))?.division || '-'}
      </td>
      <td style={{ ...styles.td, color: '#64748b', fontSize: '14px' }}>
        {(() => {
          const dept = departments.find((d: any) => String(d.dept_id) === String(emp.dept_id));
          if (!dept) return '-';
          return dept.dept_name || '-';
        })()}
      </td>
      <td style={{ ...styles.td, fontWeight: 600, color: '#334155', fontSize: '14px' }}>
        {formatPosName(getPosName(emp.pos_id), emp.gender, emp.prefix)}
      </td>
      <td style={{ ...styles.td, textAlign: 'center', position: 'relative', zIndex: isOpen ? 50 : 1 }}>
        <StatusPicker emp={emp} isAdmin={isAdmin} editEmployee={editEmployee} isOpen={isOpen} setIsOpen={setIsOpen} />
      </td>
      <td style={{ ...styles.td, textAlign: 'right' }}>
        <ChevronRight size={18} color="#cbd5e1" />
      </td>
    </tr>
  );
}

function Pagination({ page, setPage, totalItems, perPage }: any) {
  const totalPages = Math.ceil(totalItems / perPage);
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}
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
      <button onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
        style={{ ...styles.pageBtn, opacity: page === totalPages || totalPages === 0 ? 0.5 : 1, cursor: page === totalPages || totalPages === 0 ? 'default' : 'pointer' }}>
        ถัดไป
      </button>
    </div>
  );
}

function StatusPicker({ emp, isAdmin, editEmployee, isOpen, setIsOpen }: any) {
  const [selectedStatus, setSelectedStatus] = useState(emp.status);
  const containerRef = useRef<HTMLDivElement>(null);
  const [openUp, setOpenUp] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedStatus(emp.status);
  }, [isOpen, emp.status]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 250px below, open upwards
      setOpenUp(spaceBelow < 250);
    }
  }, [isOpen]);
  const statusOptions = [
    { value: 'ทำงานปกติ', label: 'ทำงานปกติ', color: '#16a34a', bg: '#dcfce7' },
    { value: 'ทดลองงาน', label: 'ทดลองงาน', color: '#a16207', bg: '#fef9c3' },
    { value: 'หยุดปฏิบัติงาน', label: 'หยุดปฏิบัติงาน', color: '#64748b', bg: '#f1f5f9' },
    { value: 'ลาออก/พ้นสภาพ', label: 'ลาออก/พ้นสภาพ', color: '#ef4444', bg: '#fee2e2' },
    { value: 'ให้ออก', label: 'ให้ออก', color: '#7f1d1d', bg: '#fecaca' },
  ];

  // Map legacy English values to Thai labels for display
  const statusMapping: { [key: string]: string } = {
    'Active': 'ทำงานปกติ',
    'Probation': 'ทดลองงาน',
    'Inactive': 'หยุดปฏิบัติงาน',
    'Resigned': 'ลาออก/พ้นสภาพ',
    'Terminated': 'ให้ออก'
  };

  const currentStatus = statusOptions.find(o => o.value === emp.status || o.label === emp.status) ||
    statusOptions.find(o => o.value === statusMapping[emp.status]) ||
    statusOptions[0];

  const handleUpdate = async (newStatus: string) => {
    if (newStatus === emp.status) {
      setIsOpen(false);
      return;
    }
    const formData = new FormData();
    formData.append('status', newStatus);
    const res = await editEmployee(emp.emp_id, formData);
    if (res.success) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onClick={(e) => {
          if (!isAdmin) return;
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          padding: '6px 14px', borderRadius: '14px', fontSize: '13px', fontWeight: 800,
          background: currentStatus.bg,
          color: currentStatus.color,
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          cursor: isAdmin ? 'pointer' : 'default',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid transparent',
          userSelect: 'none'
        }}
        onMouseOver={e => { if (isAdmin) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = currentStatus.color + '44'; } }}
        onMouseOut={e => { if (isAdmin) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'transparent'; } }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: currentStatus.color }} />
        {currentStatus.label}
      </div>

      {isOpen && (
        <>
          <div
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          />
          <div style={{
            position: 'absolute',
            [openUp ? 'bottom' : 'top']: '100%',
            left: '50%',
            transform: `translateX(-50%) ${openUp ? 'translateY(-12px)' : 'translateY(12px)'}`,
            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)',
            borderRadius: '20px', border: '1px solid rgba(241, 245, 249, 1)',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.12)',
            padding: '10px', zIndex: 101, width: '180px',
            animation: openUp ? 'slideDownSelect 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideUpSelect 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <style>{`
              @keyframes slideUpSelect {
                from { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateX(-50%) translateY(12px) scale(1); }
              }
              @keyframes slideDownSelect {
                from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.95); }
                to { opacity: 1; transform: translateX(-50%) translateY(-12px) scale(1); }
              }
            `}</style>
            <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>เลือกสถานะใหม่</div>
            {statusOptions.map(opt => (
              <div
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); setSelectedStatus(opt.value); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedStatus === opt.value ? '#f1f5f9' : 'transparent',
                  color: selectedStatus === opt.value ? '#0f172a' : '#64748b'
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={e => { if (selectedStatus !== opt.value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } else { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; } }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />
                <span style={{ fontSize: '14px', fontWeight: selectedStatus === opt.value ? 700 : 500 }}>{opt.label}</span>
              </div>
            ))}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleUpdate(selectedStatus); }}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '8px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
              }}
            >
              บันทึกสถานะ
            </button>
          </div>
        </>
      )}
    </div>
  );
}

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