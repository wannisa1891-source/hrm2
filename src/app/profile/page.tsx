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
import { 
  User, Mail, Phone, MapPin, Calendar, Briefcase, 
  Award, ShieldCheck, Lock, CreditCard, FileText, 
  ChevronRight, Camera, Edit3, Fingerprint, Globe, Bell
} from 'lucide-react';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import Modal from '@/components/common/Modal';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

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
    admission_date?: string;
    retirement_date?: string;
    mobile_no?: string;
    email?: string;
    citizen_id?: string;
    gender?: string;
    birth_date?: string;
    quota_personal?: number;
    quota_vacation?: number;
    quota_sick?: number;
    accumulated_vacation?: number;
    emp_type: string;
    start_date: string;
  };
  leaves: any[];
  payroll: any[];
  trainings?: any[];
}

export default function MyProfilePage() {
  const { user, isLoggedIn, login } = useAuth();
  const isAdmin = ['Super Admin', 'Admin', 'admin', 'HR'].includes(user?.role || '');
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'leave' | 'payroll' | 'password' | 'certificates' | 'training'>('info');
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const { employees, editEmployee, loadEmployees } = useEmployees();
  const { departments } = useDepartments();
  const { positions } = usePositions();
  
  const { announcements } = useAnnouncements();
  const [selectedNews, setSelectedNews] = useState<any>(null);

  const fullProfile = employees.find((e: any) => e.emp_id === user?.emp_id) || null;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [newTraining, setNewTraining] = useState({ course_name: '', institution: '', start_date: '', end_date: '' });
  const [trainingFile, setTrainingFile] = useState<File | null>(null);

  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraining.course_name) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อหลักสูตร', 'warning');
    if (!data?.profile?.emp_id) return;

    Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const fd = new FormData();
    fd.append('emp_id', data.profile.emp_id);
    fd.append('course_name', newTraining.course_name);
    fd.append('institution', newTraining.institution);
    fd.append('start_date', newTraining.start_date);
    fd.append('end_date', newTraining.end_date);
    if (trainingFile) fd.append('certificate_file', trainingFile);

    try {
      const res = await fetch('/api/profile/trainings', { method: 'POST', body: fd });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'เกิดข้อผิดพลาด');
      Swal.fire('สำเร็จ', 'เพิ่มประวัติการอบรมแล้ว', 'success');
      setNewTraining({ course_name: '', institution: '', start_date: '', end_date: '' });
      setTrainingFile(null);
      fetchProfile();
    } catch (err: any) {
      Swal.fire('เกิดข้อผิดพลาด', err.message, 'error');
    }
  };

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
        body: JSON.stringify({ emp_id: data?.profile.emp_id, oldPassword, newPassword })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'เกิดข้อผิดพลาด');
      Swal.fire('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', 'success');
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error: any) { Swal.fire('ข้อผิดพลาด', error.message, 'error'); }
  };

  const handleResetPasswordViaEmail = async () => {
    if (!data?.profile?.emp_id) return;
    const result = await Swal.fire({ title: 'ยืนยันการรีเซ็ตรหัสผ่าน', text: `คุณต้องการรีเซ็ตรหัสผ่านใหม่ ใช่หรือไม่?`, icon: 'warning', showCancelButton: true });
    if (!result.isConfirmed) return;

    Swal.fire({ title: 'กำลังดำเนินการ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`/api/employees/${data.profile.emp_id}/reset-password`, { method: 'POST' });
      const resData = await res.json();
      if (res.ok) Swal.fire('สำเร็จ', resData.message, 'success');
      else Swal.fire('เกิดข้อผิดพลาด', resData.error || 'ไม่สามารถรีเซ็ตรหัสผ่านได้', 'error');
    } catch (err) { Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error'); }
  };

  const handleEditInfoClick = () => setShowEditModal(true);

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
        
        // Auto-show edit modal if profile is incomplete
        const p = result.data.profile;
        const isIncomplete = !p.mobile_no && !p.phone && !p.address && !p.birth_date;
        if (isIncomplete && !isAdmin) {
          setShowEditModal(true);
        }
      }
      else Swal.fire('เกิดข้อผิดพลาด', result.error, 'error');
    } catch (err) { Swal.fire('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error'); } finally { setLoading(false); }
  };

  const handleSaveProfile = async (fd: FormData, isEditing: boolean) => {
    if (!fullProfile?.emp_id) return { success: false, message: 'ไม่พบข้อมูลบัญชี' };
    const res = await editEmployee(fullProfile.emp_id, fd);
    if (res.success) {
      if (user) login({ ...user, image: res.image || user.image });
      setShowEditModal(false); await fetchProfile(); await loadEmployees();
      Swal.fire({ title: 'สำเร็จ!', text: 'อัปเดตข้อมูลส่วนตัวเสร็จสมบูรณ์', icon: 'success', timer: 1500, showConfirmButton: false });
    } else Swal.fire('ข้อผิดพลาด', res.message || 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    return res;
  };

  useEffect(() => {
    if (!isLoggedIn) router.push('/login');
    else { loadEmployees(); if (user) fetchProfile(); }
  }, [isLoggedIn, router, user]);

  if (loading) return <AppLayout><div style={{ textAlign: 'center', padding: '50px' }}>กำลังโหลดข้อมูล...</div></AppLayout>;
  if (!data) return <AppLayout><div style={{ textAlign: 'center', padding: '50px' }}>ไม่พบข้อมูลโปรไฟล์</div></AppLayout>;

  const { profile, leaves, payroll, trainings = [] } = data;
  const fullName = `${profile.prefix || ''} ${profile.first_name_th} ${profile.last_name_th}`;

  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', padding: '0 24px' }}>
        <DashboardHeader today={today} />
        
        <style dangerouslySetInnerHTML={{
          __html: `
        .profile-container { display: grid; grid-template-columns: 340px 1fr; gap: 24px; padding: 20px 0 32px; max-width: 1600px; margin: 0; min-height: calc(100vh - 100px); }
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.4); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05); transition: all 0.3s ease; }
        .left-card { position: sticky; top: 24px; height: fit-content; text-align: center; }
        .profile-avatar-wrap { width: 160px; height: 160px; border-radius: 40px; margin: 0 auto 24px; padding: 6px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); position: relative; transform: rotate(-3deg); transition: transform 0.3s; }
        .profile-avatar-wrap:hover { transform: rotate(0deg); }
        .profile-avatar { width: 100%; height: 100%; border-radius: 36px; object-fit: cover; border: 4px solid white; background: #f1f5f9; }
        .camera-btn { position: absolute; bottom: -10px; right: -10px; width: 40px; height: 40px; border-radius: 14px; background: white; color: #2563eb; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none; cursor: pointer; }
        
        .profile-name { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.5px; }
        .profile-title { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #2563eb; font-weight: 700; font-size: 13px; border-radius: 99px; margin-bottom: 24px; }
        
        .quick-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; text-align: left; }
        .stat-item { background: #f8fafc; padding: 12px; border-radius: 16px; border: 1px solid #f1f5f9; }
        .stat-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; display: block; }
        .stat-val { font-size: 14px; font-weight: 800; color: #334155; }
        
        .profile-meta { border-top: 1px dashed #e2e8f0; padding-top: 24px; text-align: left; }
        .meta-item { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; color: #64748b; font-size: 14px; }
        .meta-icon { width: 36px; height: 36px; border-radius: 10px; background: #f8fafc; color: #3b82f6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .meta-label { font-size: 12px; color: #94a3b8; display: block; }
        .meta-val { color: #334155; font-weight: 600; }
        
        .profile-main { display: flex; flex-direction: column; gap: 24px; }
        .profile-tabs { display: flex; gap: 8px; background: #f1f5f9; padding: 8px; border-radius: 20px; align-self: flex-start; margin-bottom: 8px; }
        .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; color: #64748b; background: transparent; }
        .tab-btn:hover { color: #3b82f6; }
        .tab-btn.active { background: white; color: #2563eb; box-shadow: 0 4px 15px -5px rgba(0,0,0,0.1); }
        
        .info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        .info-section { background: white; border-radius: 24px; padding: 24px; border: 1px solid #f1f5f9; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid #f8fafc; padding-bottom: 16px; }
        .section-icon { width: 40px; height: 40px; border-radius: 12px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; }
        .section-title { font-size: 16px; font-weight: 800; color: #0f172a; }
        
        .data-list { display: flex; flex-direction: column; gap: 16px; }
        .data-item { display: grid; grid-template-columns: 120px 1fr; gap: 12px; align-items: flex-start; }
        .data-label { font-size: 13px; color: #94a3b8; font-weight: 600; }
        .data-val { font-size: 14px; color: #334155; font-weight: 500; word-break: break-all; }
        
        .card-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .card-title-icon { color: #3b82f6; }
        
        .badge { padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 700; display: inline-flex; items-center; gap: 6px; }
        .badge-success { background: #ecfdf5; color: #10b981; }
        .badge-warning { background: #fff7ed; color: #f97316; }
        .badge-danger { background: #fef2f2; color: #ef4444; }
        .badge-info { background: #eff6ff; color: #3b82f6; }
        
        .payroll-item { display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; transition: all 0.2s; cursor: pointer; }
        .payroll-item:hover { border-color: #3b82f6; background: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-label { font-size: 14px; font-weight: 700; color: #475569; }
        .form-input { padding: 12px 16px; border-radius: 14px; border: 1px solid #e2e8f0; background: #f8fafc; outline: none; transition: all 0.2s; font-size: 14px; }
        .form-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .btn-primary { background: #2563eb; color: white; border: none; padding: 14px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
        .btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); }
        
        .leave-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
        .leave-stat { background: white; padding: 16px; border-radius: 16px; border: 1px solid #f1f5f9; text-align: center; }
        .leave-stat-val { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
        .leave-stat-label { font-size: 12px; color: #64748b; font-weight: 600; }

        @media (max-width: 1024px) {
          .profile-container { grid-template-columns: 1fr; }
          .left-card { position: static; }
        }
      `}} />

      <div className="profile-container">
        {/* Left Column */}
        <div className="glass-card left-card" style={{ padding: '32px 24px' }}>
          <div className="profile-avatar-wrap">
            <Image 
              src={profile.image ? `/uploads/${profile.image}` : (profile.photo ? `/uploads/${profile.photo}` : 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png')} 
              alt="Avatar" 
              className="profile-avatar" 
              fill
              unoptimized
            />
            <button className="camera-btn" onClick={handleEditInfoClick} title="แก้ไขโปรไฟล์">
              <Camera size={20} />
            </button>
          </div>
          
          <h2 className="profile-name">{fullName}</h2>
          <span className="profile-title">{profile.pos_name}</span>
          
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">รหัสพนักงาน</span>
              <span className="stat-val">{profile.emp_id}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">อายุงาน</span>
              <span className="stat-val">
                {profile.hire_date ? `${Math.floor((new Date().getTime() - new Date(profile.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} ปี` : '-'}
              </span>
            </div>
          </div>
          
          <div className="profile-meta">
            <div className="meta-item">
              <div className="meta-icon"><Mail size={18} /></div>
              <div>
                <span className="meta-label">อีเมล</span>
                <span className="meta-val">{profile.email || '-'}</span>
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-icon"><Phone size={18} /></div>
              <div>
                <span className="meta-label">เบอร์โทรศัพท์</span>
                <span className="meta-val">{profile.mobile_no || '-'}</span>
              </div>
            </div>
            <div className="meta-item">
              <div className="meta-icon"><MapPin size={18} /></div>
              <div>
                <span className="meta-label">แผนก</span>
                <span className="meta-val">{profile.dept_name}</span>
              </div>
            </div>
          </div>
          
          <button 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
            onClick={handleEditInfoClick}
          >
            <Edit3 size={18} /> แก้ไขข้อมูลส่วนตัว
          </button>
        </div>

        <div className="profile-main">
          {/* News Banner for Users */}
          {announcements.length > 0 && (
            <div className="glass-card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={20} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>ข่าวสารและประกาศล่าสุด</h3>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {announcements.slice(0, 2).map((news: any, i: number) => (
                  <div key={i} onClick={() => setSelectedNews(news)} style={{ cursor: 'pointer', background: 'white', borderRadius: '16px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '16px', transition: 'all 0.2s' }} className="hover-lift">
                    {news.image && (
                      <div style={{ width: '80px', height: '60px', borderRadius: '10px', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <Image src={news.image} alt={news.title} fill style={{ objectFit: 'cover' }} unoptimized />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{news.title}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{news.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="profile-tabs">
            <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
              <User size={16} /> ข้อมูลทั่วไป
            </button>
            <button className={`tab-btn ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')}>
              <Calendar size={16} /> ประวัติการลา
            </button>
            <button className={`tab-btn ${activeTab === 'certificates' ? 'active' : ''}`} onClick={() => setActiveTab('certificates')}>
              <Award size={16} /> ใบอนุญาต
            </button>
            <button className={`tab-btn ${activeTab === 'training' ? 'active' : ''}`} onClick={() => setActiveTab('training')}>
              <FileText size={16} /> ประวัติอบรม
            </button>
            <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
              <Lock size={16} /> ความปลอดภัย
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="info-grid">
              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon"><User size={20} /></div>
                  <h3 className="section-title">ข้อมูลส่วนบุคคล</h3>
                </div>
                <div className="data-list">
                  <div className="data-item">
                    <span className="data-label">ชื่อ-นามสกุล (TH)</span>
                    <span className="data-val">{profile.prefix} {profile.first_name_th} {profile.last_name_th}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">ชื่อ-นามสกุล (EN)</span>
                    <span className="data-val">{profile.first_name_en} {profile.last_name_en}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">เลขบัตรประชาชน</span>
                    <span className="data-val">{profile.citizen_id || '-'}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">วันเกิด</span>
                    <span className="data-val">{profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('th-TH') : '-'}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">เพศ</span>
                    <span className="data-val">{profile.gender || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <div className="section-header">
                  <div className="section-icon"><Briefcase size={20} /></div>
                  <h3 className="section-title">ข้อมูลการทำงาน</h3>
                </div>
                <div className="data-list">
                  <div className="data-item">
                    <span className="data-label">กลุ่มงาน/ฝ่าย</span>
                    <span className="data-val">{profile.dept_name}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">ตำแหน่ง</span>
                    <span className="data-val">{profile.pos_name}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">วันที่เริ่มงาน</span>
                    <span className="data-val">{profile.hire_date ? new Date(profile.hire_date).toLocaleDateString('th-TH') : '-'}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">วันที่บรรจุ</span>
                    <span className="data-val">{profile.admission_date ? new Date(profile.admission_date).toLocaleDateString('th-TH') : '-'}</span>
                  </div>
                  <div className="data-item">
                    <span className="data-label">วันที่เกษียณ</span>
                    <span className="data-val">{profile.retirement_date ? new Date(profile.retirement_date).toLocaleDateString('th-TH') : '-'}</span>
                  </div>
                </div>
                
                <div className="leave-stats" style={{ gridTemplateColumns: profile.accumulated_vacation ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)' }}>
                  <div className="leave-stat">
                    <div className="leave-stat-val" style={{ color: '#059669' }}>{profile.quota_vacation || 0}</div>
                    <div className="leave-stat-label">พักร้อน (ปีนี้)</div>
                  </div>
                  {profile.accumulated_vacation !== undefined && profile.accumulated_vacation > 0 && (
                    <div className="leave-stat">
                      <div className="leave-stat-val" style={{ color: '#10b981' }}>{profile.accumulated_vacation}</div>
                      <div className="leave-stat-label">พักร้อนสะสม</div>
                    </div>
                  )}
                  <div className="leave-stat">
                    <div className="leave-stat-val" style={{ color: '#ef4444' }}>{profile.quota_sick || 0}</div>
                    <div className="leave-stat-label">ลาป่วย</div>
                  </div>
                  <div className="leave-stat">
                    <div className="leave-stat-val" style={{ color: '#f59e0b' }}>{profile.quota_personal || 0}</div>
                    <div className="leave-stat-label">ลากิจ</div>
                  </div>
                </div>
              </div>

              <div className="info-section" style={{ gridColumn: 'span 2' }}>
                <div className="section-header">
                  <div className="section-icon"><MapPin size={20} /></div>
                  <h3 className="section-title">ข้อมูลที่อยู่</h3>
                </div>
                <div className="data-list">
                  <div className="data-item">
                    <span className="data-label">ที่อยู่ปัจจุบัน</span>
                    <div className="data-val">{fullProfile?.address || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">
                <Calendar className="card-title-icon" size={24} /> ประวัติการลางานล่าสุด
              </h3>
              {leaves?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <Calendar size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>ยังไม่มีประวัติการลางาน</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>วันที่ลา</th>
                        <th>ประเภทการลา</th>
                        <th>จำนวนวัน</th>
                        <th>เหตุผล</th>
                        <th>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaves.map((l: any, idx: number) => (
                        <tr key={idx}>
                          <td>{new Date(l.start_date).toLocaleDateString('th-TH')} - {new Date(l.end_date).toLocaleDateString('th-TH')}</td>
                          <td>{l.leave_type || l.leave_type_id}</td>
                          <td>{l.total_days} วัน</td>
                          <td>{l.reason || '—'}</td>
                          <td>
                            <span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                              {l.status === 'Approved' ? 'อนุมัติแล้ว' : l.status === 'Pending' ? 'รออนุมัติ' : 'ไม่อนุมัติ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}


          {activeTab === 'certificates' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">
                <Award className="card-title-icon" size={24} /> รายการใบอนุญาตและวุฒิบัตร
              </h3>
              {!fullProfile?.licenses || fullProfile.licenses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <Award size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>ยังไม่มีข้อมูลใบอนุญาต</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {fullProfile.licenses.map((lic: any, idx: number) => (
                    <div key={idx} style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{lic.license_name || lic.license_no || 'ใบอนุญาต'}</div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>ออกให้โดย: {lic.institution || '-'}</div>
                      {(lic.issue_date || lic.expire_date) && (
                        <div style={{ fontSize: '12px', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px', display: 'inline-block', fontWeight: 600 }}>
                          {[lic.issue_date?.split('T')[0], lic.expire_date?.split('T')[0]].filter(Boolean).join(' ถึง ')}
                        </div>
                      )}
                      {lic.status && (
                        <div style={{ marginTop: '8px' }}>
                          <span className={`badge ${lic.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            {lic.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'training' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">
                <FileText className="card-title-icon" size={24} /> ประวัติการฝึกอบรม
              </h3>
              
              <form onSubmit={handleAddTraining} style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#334155' }}>เพิ่มประวัติการอบรม</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ชื่อหลักสูตร / โครงการ</label>
                    <input type="text" value={newTraining.course_name} onChange={e => setNewTraining({ ...newTraining, course_name: e.target.value })} required className="form-input" placeholder="ระบุชื่อหลักสูตร..." />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">หน่วยงานที่จัดบรรยาย</label>
                    <input type="text" value={newTraining.institution} onChange={e => setNewTraining({ ...newTraining, institution: e.target.value })} className="form-input" placeholder="ระบุหน่วยงาน..." />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">วันที่เริ่มต้น</label>
                    <input type="date" value={newTraining.start_date} onChange={e => setNewTraining({ ...newTraining, start_date: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">วันที่สิ้นสุด</label>
                    <input type="date" value={newTraining.end_date} onChange={e => setNewTraining({ ...newTraining, end_date: e.target.value })} className="form-input" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">ไฟล์แนบเกียรติบัตร</label>
                    <input type="file" accept="image/*,.pdf" onChange={e => setTrainingFile(e.target.files?.[0] || null)} className="form-input" style={{ padding: '8px' }} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px' }}>
                  บันทึกประวัติ
                </button>
              </form>

              {!trainings || trainings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p>ยังไม่มีประวัติการอบรม</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {trainings.map((tr: any, idx: number) => (
                    <div key={idx} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '20px', overflow: 'hidden', transition: 'all 0.3s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      {tr.image_file && (
                        <div style={{ position: 'relative', width: '100%', height: '160px' }}>
                          <Image src={`/uploads/${tr.image_file}`} alt="Training" fill style={{ objectFit: 'cover' }} unoptimized />
                        </div>
                      )}
                      <div style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px', marginBottom: '8px' }}>{tr.course_name}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} /> {tr.location || '-'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={12} /> {tr.institution || '-'}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={12} /> 
                            {tr.start_date ? new Date(tr.start_date).toLocaleDateString('th-TH') : ''} 
                            {tr.end_date && tr.end_date !== tr.start_date ? ` - ${new Date(tr.end_date).toLocaleDateString('th-TH')}` : ''}
                          </div>
                        </div>
                        {tr.certificate_file && (
                          <a href={`/uploads/${tr.certificate_file}`} target="_blank" rel="noreferrer" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#2563eb', fontWeight: 700, textDecoration: 'none', background: '#eff6ff', padding: '8px 12px', borderRadius: '10px' }}>
                            <Award size={14} /> ดูเกียรติบัตร
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'password' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 className="card-title">
                <ShieldCheck className="card-title-icon" size={24} /> เปลี่ยนรหัสผ่านความปลอดภัย
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <form onSubmit={handleChangePassword} style={{ background: '#f8fafc', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 20px 0', fontWeight: 600 }}>เปลี่ยนรหัสผ่านด้วยตนเอง</h4>
                  <div className="form-group">
                    <label className="form-label">รหัสผ่านเดิม</label>
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="form-input" placeholder="ป้อนรหัสผ่านเดิม..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">รหัสผ่านใหม่</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" placeholder="อย่างน้อย 6 ตัวอักษร" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="form-input" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Fingerprint size={18} /> ยืนยันการเปลี่ยนรหัสผ่าน
                  </button>
                </form>

                <div style={{ background: '#f8fafc', padding: '24px 28px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '16px', color: '#0f172a', margin: '0 0 12px 0', fontWeight: 600 }}>
                    รีเซ็ตรหัสผ่านแบบอัตโนมัติ
                  </h4>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.6' }}>
                    ระบบจะดำเนินการสุ่มรหัสผ่านใหม่เพื่อความปลอดภัย
                    และจัดส่งการแจ้งเตือนไปยังอีเมลของคุณ
                    (โปรดตรวจสอบให้แน่ใจว่าอีเมลในประวัติส่วนตัวมีความถูกต้อง)
                  </p>
                  <button type="button" onClick={handleResetPasswordViaEmail} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#d97706' }}>
                    <Mail size={18} /> ส่งอีเมลรีเซ็ตรหัสผ่าน
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmployeeFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employee={fullProfile || data.profile}
        onSave={handleSaveProfile}
        isProfileMode={true}
        departments={departments}
        positions={positions}
      />

      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title="รายละเอียดข่าวประกาศ"
      >
        {selectedNews && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {selectedNews.image && (
              <div style={{ width: '100%', height: 240, position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#f1f5f9' }}>
                <Image fill unoptimized src={selectedNews.image} alt={selectedNews.title} style={{ objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: 20, color: '#0f172a', fontWeight: 800 }}>{selectedNews.title}</h3>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{selectedNews.date}</div>
            </div>
            <div style={{ padding: '20px', borderRadius: '16px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <p style={{ margin: 0, fontSize: 15, color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{selectedNews.content}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn-primary" onClick={() => setSelectedNews(null)} style={{ padding: '10px 32px' }}>
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </AppLayout>
  );
}