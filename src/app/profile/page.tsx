'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

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
  const { user, isLoggedIn } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'leave' | 'payroll' | 'password'>('info');
  const router = useRouter();

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editData, setEditData] = useState({ phone: '', email: '', citizen_id: '', gender: 'ชาย', quota_vacation: 0, quota_sick: 0, quota_personal: 0 });

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
    if (!data?.profile) return;
    setEditData({
      phone: data.profile.mobile_no || (data.profile as any).phone || '',
      email: data.profile.email || '',
      citizen_id: data.profile.citizen_id || '',
      gender: data.profile.gender || 'ชาย',
      quota_vacation: data.profile.quota_vacation || 0,
      quota_sick: data.profile.quota_sick || 0,
      quota_personal: data.profile.quota_personal || 0
    });
    setIsEditingInfo(true);
  };

  const handleSaveInfo = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emp_id: data?.profile?.emp_id, updater_role: user?.role, ...editData })
      });
      const resData = await res.json();
      if (res.ok) {
        Swal.fire({ title: 'สำเร็จ!', text: 'อัปเดตข้อมูลเสร็จสมบูรณ์', icon: 'success', timer: 1500, showConfirmButton: false });
        setIsEditingInfo(false);
        setData(prev => {
          if(!prev) return prev;
          return {
            ...prev,
            profile: {
              ...prev.profile,
              mobile_no: editData.phone,
              email: editData.email,
              citizen_id: editData.citizen_id,
              gender: editData.gender,
              quota_vacation: editData.quota_vacation,
              quota_sick: editData.quota_sick,
              quota_personal: editData.quota_personal
            }
          };
        });
      } else {
        Swal.fire('เกิดข้อผิดพลาด', resData.error || 'บันทึกข้อมูลไม่สำเร็จ', 'error');
      }
    } catch(err) {
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    }
  };

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const employeeId = user?.emp_id || user?.username || (user as any)?.name;
    
    if (employeeId) {
      fetch(`/api/profile?emp_id=${employeeId}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setData(res.data);
          }
        })
        .finally(() => setLoading(false));
    } else if (isLoggedIn) {
      // Fail-safe to avoid infinite loading
      setLoading(false);
    }
  }, [user, isLoggedIn, router]);

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
          <div className="profile-avatar-wrap">
            <img 
              src={profile.image ? `/uploads/${profile.image}` : (profile.photo ? `/uploads/${profile.photo}` : 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png')} 
              alt="avatar" 
              className="profile-avatar"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }}
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
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 className="card-title" style={{ marginBottom: 0 }}>รายละเอียดส่วนตัว</h3>
                {!isEditingInfo ? (
                  <button onClick={handleEditInfoClick} style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#f1f5f9'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#f8fafc'}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    แก้ไขข้อมูล
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setIsEditingInfo(false)} style={{ padding: '8px 16px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                      ยกเลิก
                    </button>
                    <button onClick={handleSaveInfo} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)', transition: 'all 0.2s' }}>
                      บันทึกข้อมูล
                    </button>
                  </div>
                )}
              </div>
              
              <div className="info-grid">
                <div className="field">
                  <div className="field-label">เบอร์โทรศัพท์</div>
                  {isEditingInfo ? (
                    <input type="text" value={editData.phone} onChange={e=>setEditData({...editData, phone: e.target.value})} className="field-val" style={{ width: '100%', outline: 'none', border: '1px solid #3b82f6', background: 'white', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }} />
                  ) : (
                    <div className="field-val">{profile.mobile_no || (profile as any).phone || '—'}</div>
                  )}
                </div>
                <div className="field">
                  <div className="field-label">อีเมล</div>
                  {isEditingInfo ? (
                    <input type="email" value={editData.email} onChange={e=>setEditData({...editData, email: e.target.value})} className="field-val" style={{ width: '100%', outline: 'none', border: '1px solid #3b82f6', background: 'white', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }} />
                  ) : (
                    <div className="field-val">{profile.email || '—'}</div>
                  )}
                </div>
                <div className="field">
                  <div className="field-label">เลขบัตรประชาชน</div>
                  {isEditingInfo ? (
                    <input type="text" maxLength={13} value={editData.citizen_id} onChange={e=>setEditData({...editData, citizen_id: e.target.value})} className="field-val" style={{ width: '100%', outline: 'none', border: '1px solid #3b82f6', background: 'white', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }} />
                  ) : (
                    <div className="field-val">{profile.citizen_id || '—'}</div>
                  )}
                </div>
                <div className="field">
                  <div className="field-label">เพศ</div>
                  {isEditingInfo ? (
                    <select value={editData.gender} onChange={e=>setEditData({...editData, gender: e.target.value})} className="field-val" style={{ width: '100%', outline: 'none', border: '1px solid #3b82f6', background: 'white', cursor: 'pointer', appearance: 'none', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }}>
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </select>
                  ) : (
                    <div className="field-val">{profile.gender || '—'}</div>
                  )}
                </div>
                
                <h4 style={{ gridColumn: 'span 2', marginTop: 20, marginBottom: 12, fontSize: 13, color: '#64748b' }}>สิทธิ์การลาคงเหลือประจำปี</h4>
                <div className="leave-stats">
                  <div className="leave-stat">
                    {isEditingInfo && (user?.role === 'Admin' || user?.role === 'admin') ? (
                      <div style={{ marginBottom: '8px' }}><input type="number" min={0} value={editData.quota_vacation} onChange={e=>setEditData({...editData, quota_vacation: Number(e.target.value)})} style={{ width: '80px', fontSize: '28px', fontWeight: 800, color: '#2563eb', border: 'none', background: 'transparent', outline: 'none', borderBottom: '2px solid #3b82f6', textAlign: 'center', transition: 'all 0.2s' }} /></div>
                    ) : (
                      <div className="leave-stat-val">{profile.quota_vacation || 0}</div>
                    )}
                    <div className="leave-stat-label">ลาพักร้อนคงเหลือ (วัน)</div>
                  </div>
                  <div className="leave-stat">
                    {isEditingInfo && (user?.role === 'Admin' || user?.role === 'admin') ? (
                      <div style={{ marginBottom: '8px' }}><input type="number" min={0} value={editData.quota_sick} onChange={e=>setEditData({...editData, quota_sick: Number(e.target.value)})} style={{ width: '80px', fontSize: '28px', fontWeight: 800, color: '#2563eb', border: 'none', background: 'transparent', outline: 'none', borderBottom: '2px solid #3b82f6', textAlign: 'center', transition: 'all 0.2s' }} /></div>
                    ) : (
                      <div className="leave-stat-val">{profile.quota_sick || 0}</div>
                    )}
                    <div className="leave-stat-label">ลาป่วยคงเหลือ (วัน)</div>
                  </div>
                  <div className="leave-stat">
                    {isEditingInfo && (user?.role === 'Admin' || user?.role === 'admin') ? (
                      <div style={{ marginBottom: '8px' }}><input type="number" min={0} value={editData.quota_personal} onChange={e=>setEditData({...editData, quota_personal: Number(e.target.value)})} style={{ width: '80px', fontSize: '28px', fontWeight: 800, color: '#2563eb', border: 'none', background: 'transparent', outline: 'none', borderBottom: '2px solid #3b82f6', textAlign: 'center', transition: 'all 0.2s' }} /></div>
                    ) : (
                      <div className="leave-stat-val">{profile.quota_personal || 0}</div>
                    )}
                    <div className="leave-stat-label">ลากิจคงเหลือ (วัน)</div>
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
              <div style={{ maxWidth: '500px', background: '#f8fafc', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
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
    </AppLayout>
  );
}
