'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Swal from 'sweetalert2';
import EmployeeFormModal from '@/components/employees/EmployeeFormModal';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';

interface ProfileData {
  profile: {
    emp_id: string;
    prefix: string;
    first_name_th: string;
    last_name_th: string;
    first_name_en?: string;
    last_name_en?: string;
    image?: string;
    photo?: string;
    pos_name: string;
    dept_name: string;
    hire_date: string;
    mobile_no?: string;
    email?: string;
    citizen_id?: string;
    gender?: string;
    birth_date?: string;
    quota_personal?: number;
    quota_vacation?: number;
    quota_sick?: number;
  };
  leaves: any[];
  payroll: any[];
}

export default function MyProfilePage() {
  const { user, isLoggedIn, login } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'leave' | 'payroll' | 'password'>('info');
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  // Full data fetching for the Modal
  const { employees, editEmployee, loadEmployees } = useEmployees();
  const { departments } = useDepartments();
  const { positions } = usePositions();

  // Find the fully details of current user from employees array (contains licenses, address, etc)
  const fullProfile = employees.find((e: any) => e.emp_id === user?.emp_id) || null;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
    }
    if (newPassword !== confirmPassword) {
      return Swal.fire('รหัสผ่านไม่ตรงกัน', 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'error');
    }
    
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emp_id: data?.profile.emp_id,
          oldPassword,
          newPassword
        })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'เกิดข้อผิดพลาด');
      }
      Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Swal.fire('ข้อผิดพลาด', error.message, 'error');
    }
  };

  const handleResetPasswordViaEmail = async () => {
    if (!data?.profile?.emp_id) return;
    const result = await Swal.fire({
      title: 'ยืนยันการรีเซ็ตรหัสผ่าน',
      text: `คุณต้องการรีเซ็ตรหัสผ่านใหม่ ระบบจะสุ่มรหัสและส่งเข้าอีเมลของคุณ ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันการรีเซ็ต',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3085d6'
    });
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    try {
      const res = await fetch(`/api/employees/${data.profile.emp_id}/reset-password`, { method: 'POST' });
      const resData = await res.json();
      if (res.ok) {
        Swal.fire('สำเร็จ', resData.message, 'success');
      } else {
        Swal.fire('เกิดข้อผิดพลาด', resData.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้', 'error');
      }
    } catch (err) {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  const handleEditInfoClick = () => {
    setShowEditModal(true);
  };

  const fetchProfile = async () => {
    const targetId = user?.emp_id || user?.username;
    if (!targetId) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/profile?emp_id=${targetId}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        Swal.fire('เกิดข้อผิดพลาด', result.error, 'error');
      }
    } catch (err) {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProfile = async (fd: FormData, isEditing: boolean) => {
    if (!fullProfile?.emp_id) return { success: false, message: 'ไม่พบข้อมูลบัญชี' };
    const res = await editEmployee(fullProfile.emp_id, fd);
    if (res.success) {
      if (user) {
        login({ ...user, image: res.image || user.image });
      }
      setShowEditModal(false);
      await fetchProfile(); // Reload local profile API
      await loadEmployees(); // Reload extensive employees array
      Swal.fire({ title: 'สำเร็จ!', text: 'อัปเดตข้อมูลส่วนตัวเสร็จสมบูรณ์', icon: 'success', timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire('ข้อผิดพลาด', res.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    }
    return res;
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      loadEmployees();
      if (user) {
        fetchProfile();
      }
    }
  }, [isLoggedIn, router, user]);

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="spinner">กำลังโหลดข้อมูล...</div>
      </div>
    </AppLayout>
  );

  if (!data) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '50px' }}>ไม่พบข้อมูลโปรไฟล์</div>
    </AppLayout>
  );

  const { profile, leaves, payroll } = data;
  const fullName = `${profile.prefix || ''} ${profile.first_name_th} ${profile.last_name_th}`;

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-container { display: grid; grid-template-columns: 320px 1fr; gap: 24px; padding: 24px; max-width: 1400px; margin: 0 auto; }
        
        .profile-avatar-wrap { width: 140px; height: 140px; border-radius: 50%; margin: 0 auto 20px; padding: 4px; border: 4px solid #f8fafc; box-shadow: 0 10px 25px -10px rgba(0,0,0,0.1); position: relative; }
        .profile-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .profile-name { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .profile-title { color: #2563eb; font-weight: 700; font-size: 14px; margin-bottom: 20px; }
        .profile-meta { border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: left; }
        .meta-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #64748b; font-size: 14px; }
        .meta-val { color: #334155; font-weight: 600; }
        
        /* Right Column: Main Content */
        .profile-main { display: flex; flex-direction: column; gap: 24px; }
        .profile-tabs { display: flex; gap: 12px; background: #f8fafc; padding: 6px; border-radius: 12px; align-self: flex-start; border: 1px solid #e2e8f0; }
        .tab-btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; color: #64748b; background: none; }
        .tab-btn.active { background: white; color: #2563eb; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        
        /* Content Card */
        .card-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
        .card-title::before { content: ''; display: block; width: 4px; height: 20px; background: #2563eb; border-radius: 2px; }
        
        /* Grid Info */
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .field-label { font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .field-val { font-size: 15px; color: #1e293b; font-weight: 600; padding: 12px 16px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }

        /* Leve Stats */
        .leave-stats { grid-column: span 2; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
        .leave-stat { background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .leave-stat-val { font-size: 28px; font-weight: 800; color: #2563eb; }
        .leave-stat-label { font-size: 13px; color: #64748b; font-weight: 600; }

        /* Badges */
        .badge { padding: 6px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; display: inline-block; }
        .badge-success { background: #ecfdf5; color: #059669; }
        .badge-pending { background: #fffbeb; color: #d97706; }
        
        @media (max-width: 1024px) {
          .profile-container { grid-template-columns: 1fr; }
          .left-card { order: 1; }
          .profile-main { order: 2; }
          .info-grid { grid-template-columns: 1fr; }
          .leave-stats { grid-template-columns: 1fr; }
        }
      `}} />

      <div className="profile-container">
        {/* Left Column */}
        <div className="glass-card left-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div className="profile-avatar-wrap" style={{ overflow: 'hidden' }}>
            <Image 
              src={profile.image ? `/uploads/${profile.image}` : (profile.photo ? `/uploads/${profile.photo}` : 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png')} 
              alt="avatar" 
              className="profile-avatar"
              fill
              unoptimized
              onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }}
            />
          </div>
          <h2 className="profile-name">{fullName}</h2>
          <div className="profile-title">{profile.pos_name}</div>
          
          <div className="profile-meta">
            <div className="meta-item">
              <span className="icon">🆔</span>
              <span>รหัส: <span className="meta-val">{profile.emp_id}</span></span>
            </div>
            <div className="meta-item">
              <span className="icon">🏢</span>
              <span>สังกัด: <span className="meta-val">{profile.dept_name}</span></span>
            </div>
            <div className="meta-item">
              <span className="icon">📅</span>
              <span>เริ่มงาน: <span className="meta-val">{profile.hire_date?.split('T')[0] || '—'}</span></span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="profile-main">
          <div className="profile-tabs">
            <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>ข้อมูลทั่วไป</button>
            <button className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')}>ประวัติการลา</button>
            <button className={`tab-btn ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => setActiveTab('payroll')}>สรุปเงินเดือน</button>
            <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>เปลี่ยนรหัสผ่าน</button>
          </div>

          {activeTab === 'info' && (
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <h3 className="card-title" style={{ margin: 0 }}>รายละเอียดแฟ้มประวัติ (Profile Details)</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => router.push('/employee-card')} style={{ padding: '8px 20px', background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'all 0.2s' }} className="hover-glow">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10h2M6 14h2M15 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" /></svg>
                    บัตรพนักงาน
                  </button>
                  <button onClick={handleEditInfoClick} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.2)', transition: 'transform 0.2s' }} onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    แก้ไขประวัติส่วนตัว
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  
                  {/* Personal & Contact */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#2563eb' }}>▍</span> ข้อมูลการติดต่อ
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>เบอร์โทรศัพท์</span>
                          <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 500 }}>{fullProfile?.phone || profile.mobile_no || '—'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center' }}>
                          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>อีเมล</span>
                          <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 500 }}>{fullProfile?.email || profile.email || '—'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'flex-start' }}>
                          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>ที่อยู่ปัจจุบัน</span>
                          <span style={{ color: '#0f172a', fontSize: '14px', lineHeight: '1.6' }}>{fullProfile?.address || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#10b981' }}>▍</span> ข้อมูลส่วนบุคคล
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div className="field-label">เลขบัตรประจำตัวประชาชน</div>
                          <div className="field-val">{fullProfile?.citizen_id || profile.citizen_id || '—'}</div>
                        </div>
                        <div>
                          <div className="field-label">วัน/เดือน/ปีเกิด</div>
                          <div className="field-val">
                            {fullProfile?.birth_date ? new Date(fullProfile.birth_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                          </div>
                        </div>
                        <div>
                          <div className="field-label">เพศ</div>
                          <div className="field-val">{fullProfile?.gender || profile.gender || '—'}</div>
                        </div>
                        <div>
                          <div className="field-label">สถานะพนักงาน</div>
                          <div className="field-val" style={{ color: fullProfile?.status === 'Active' ? '#059669' : '#dc2626', fontWeight: 800 }}>
                            {fullProfile?.status || '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Licenses & Leave */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#8b5cf6' }}>▍</span> ใบประกอบวิชาชีพ
                        </div>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '12px', padding: '2px 10px', borderRadius: '20px' }}>
                          {fullProfile?.licenses?.length || 0} รายการ
                        </span>
                      </h4>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!fullProfile?.licenses || fullProfile.licenses.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            ไม่มีข้อมูลใบอนุญาตวิชาชีพ
                          </div>
                        ) : (
                          fullProfile.licenses.map((lic: any, idx: number) => (
                            <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{lic.license_no || 'ไม่ระบุเลขที่'}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{lic.institution || 'ไม่ระบุแพทยสภา'}</div>
                                {(lic.issue_date || lic.expire_date) && (
                                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', background: '#e2e8f0', display: 'inline-block', padding: '2px 8px', borderRadius: '10px' }}>
                                    {[lic.issue_date?.split('T')[0], lic.expire_date?.split('T')[0]].filter(Boolean).join(' ถึง ')}
                                  </div>
                                )}
                              </div>
                              {lic.status && (
                                <span className={`badge ${lic.status === 'Active' ? 'badge-success' : lic.status === 'Suspended' ? 'badge-pending' : ''}`} style={{ background: lic.status === 'Expired' ? '#fef2f2' : undefined, color: lic.status === 'Expired' ? '#ef4444' : undefined }}>
                                  {lic.status}
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
                      <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#f59e0b' }}>▍</span> สิทธิ์การลาคงเหลือประจำปี
                      </h4>
                      <div className="leave-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: 0 }}>
                        <div className="leave-stat" style={{ background: '#fff' }}>
                          <div className="leave-stat-val" style={{ color: '#059669' }}>{profile.quota_vacation || 0}</div>
                          <div className="leave-stat-label">พักร้อน</div>
                        </div>
                        <div className="leave-stat" style={{ background: '#fff' }}>
                          <div className="leave-stat-val" style={{ color: '#ef4444' }}>{profile.quota_sick || 0}</div>
                          <div className="leave-stat-label">ลาป่วย</div>
                        </div>
                        <div className="leave-stat" style={{ background: '#fff' }}>
                          <div className="leave-stat-val" style={{ color: '#f59e0b' }}>{profile.quota_personal || 0}</div>
                          <div className="leave-stat-label">ลากิจ</div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">ประวัติการลา 10 รายการล่าสุด</h3>
              <div style={{ overflowX: 'auto' }} className="custom-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>วันที่เริ่ม</th>
                      <th>สิ้นสุด</th>
                      <th>ประเภท</th>
                      <th>เหตุผล</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr><td colSpan={5} style={{textAlign:'center', padding:40, color:'#94a3b8'}}>ไม่พบรายการการลา</td></tr>
                    ) : (
                      leaves.map((l: any, i: number) => (
                        <tr key={i}>
                          <td>{l.start_date?.split('T')[0]}</td>
                          <td>{l.end_date?.split('T')[0]}</td>
                          <td>{l.leave_type_id}</td>
                          <td>{l.reason || '—'}</td>
                          <td>
                            <span className={`badge ${l.status === 'Approved' ? 'badge-success' : 'badge-pending'}`}>
                              {l.status === 'Approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">สรุปเงินเพิ่ม/ลด (12 เดือนล่าสุด)</h3>
              <div style={{ overflowX: 'auto' }} className="custom-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>งวดเดือน</th>
                      <th>เงินเดือน</th>
                      <th>รายได้พิเศษ</th>
                      <th>หักภาษี/อื่นๆ</th>
                      <th>สุทธิ</th>
                      <th>สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.length === 0 ? (
                      <tr><td colSpan={6} style={{textAlign:'center', padding:40, color:'#94a3b8'}}>ไม่พบข้อมูลการจ่ายเงิน</td></tr>
                    ) : (
                      payroll.map((p: any, i: number) => {
                        const base = Number(p.base_salary || 0);
                        const extra = Number(p.bonus || 0) + Number(p.overtime || 0) + Number(p.position_allowance || 0);
                        const deduct = Number(p.tax || 0) + Number(p.social_security || 0) + Number(p.other_deductions || 0);
                        return (
                          <tr key={i}>
                            <td style={{fontWeight:700}}>{p.pay_month}/{p.pay_year}</td>
                            <td>{base.toLocaleString()}</td>
                            <td style={{color:'#059669'}}>+{extra.toLocaleString()}</td>
                            <td style={{color:'#dc2626'}}>-{deduct.toLocaleString()}</td>
                            <td style={{fontWeight:800, color:'#2563eb'}}>{Number(p.net_salary || 0).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-pending'}`}>
                                {p.status === 'Paid' ? 'จ่ายแล้ว' : p.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">เปลี่ยนรหัสผ่าน</h3>
              
              {/* Manual Form */}
              <form onSubmit={handleChangePassword} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', background: '#f8fafc', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 600 }}>เปลี่ยนรหัสผ่านด้วยตนเอง</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>รหัสผ่านเดิม (หรือเลขบัตรประชาชนสำหรับเข้าสู่ระบบครั้งแรก)</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="form-input" placeholder="ป้อนรหัสผ่านเดิม..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>รหัสผ่านใหม่</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" placeholder="ป้อนรหัสผ่านใหม่..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>ยืนยันรหัสผ่านใหม่</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="form-input" placeholder="ป้อนรหัสผ่านใหม่อีกครั้ง..." />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '12px', padding: '12px', width: '100%' }}>
                  บันทึกรหัสผ่านใหม่
                </button>
              </form>

              <div style={{ maxWidth: '500px', background: '#f8fafc', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 600 }}>
                  รีเซ็ตรหัสผ่านแบบอัตโนมัติ
                </h4>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.6' }}>
                  ระบบจะดำเนินการสุ่มรหัสผ่านใหม่เพื่อความปลอดภัย 
                  และจัดส่งการแจ้งเตือนไปยังอีเมลของคุณ 
                  (โปรดตรวจสอบให้แน่ใจว่าอีเมลในประวัติส่วนตัวมีความถูกต้อง)
                </p>
                <button type="button" onClick={handleResetPasswordViaEmail} style={{ padding: '10px 20px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px', display: 'inline-flex', alignItems: 'center' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#0f172a'; }}>
                  รีเซ็ตรหัสผ่านและส่งเข้าอีเมล
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmployeeFormModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        employee={fullProfile}
        onSave={handleSaveProfile}
        viewMode={false}
        isProfileMode={true}
        departments={departments}
        positions={positions}
      />
    </AppLayout>
  );
}
