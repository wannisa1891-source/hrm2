'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
  const [activeTab, setActiveTab] = useState<'info' | 'leave' | 'payroll'>('info');
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (user?.emp_id) {
      fetch(`/api/profile?emp_id=${user.emp_id}`)
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            setData(res.data);
          }
        })
        .finally(() => setLoading(false));
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
        .profile-container { display: grid; grid-template-columns: 320px 1fr; gap: 24px; padding: 20px; }
        
        /* Left Column: Side Card */
        .profile-side-card { background: white; border-radius: 20px; padding: 32px 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; text-align: center; }
        .profile-avatar-wrap { width: 140px; height: 140px; border-radius: 50%; margin: 0 auto 20px; padding: 4px; border: 4px solid #f8fafc; box-shadow: 0 10px 25px -10px rgba(0,0,0,0.1); position: relative; }
        .profile-avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .profile-name { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
        .profile-title { color: #2563eb; font-weight: 700; font-size: 14px; margin-bottom: 20px; }
        .profile-meta { border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: left; }
        .meta-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: #64748b; font-size: 14px; }
        .meta-val { color: #334155; font-weight: 600; }
        
        /* Right Column: Main Content */
        .profile-main { display: flex; flex-direction: column; gap: 24px; }
        .profile-tabs { display: flex; gap: 12px; background: #f1f5f9; padding: 6px; border-radius: 12px; align-self: flex-start; }
        .tab-btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; color: #64748b; background: none; }
        .tab-btn.active { background: white; color: #2563eb; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        
        /* Content Card */
        .content-card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); border: 1px solid #f1f5f9; }
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

        /* Tables */
        .profile-table { width: 100%; border-collapse: collapse; }
        .profile-table th { text-align: left; padding: 14px 12px; font-size: 13px; color: #64748b; border-bottom: 2px solid #f1f5f9; }
        .profile-table td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
        .badge { padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
        .badge-success { background: #ecfdf5; color: #059669; }
        .badge-pending { background: #fffbeb; color: #d97706; }
        
        @media (max-width: 1024px) {
          .profile-container { grid-template-columns: 1fr; }
          .profile-side-card { order: 1; }
          .profile-main { order: 2; }
          .info-grid { grid-template-columns: 1fr; }
          .leave-stats { grid-template-columns: 1fr; }
        }
      `}} />

      <div className="profile-container">
        {/* Left Column */}
        <div className="profile-side-card">
          <div className="profile-avatar-wrap">
            <img 
              src={profile.image || profile.photo || 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png'} 
              alt="avatar" 
              className="profile-avatar"
              onError={(e) => { e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png'; }}
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
          </div>

          {activeTab === 'info' && (
            <div className="content-card">
              <h3 className="card-title">รายละเอียดส่วนตัว</h3>
              <div className="info-grid">
                <div className="field">
                  <div className="field-label">เบอร์โทรศัพท์</div>
                  <div className="field-val">{profile.mobile_no || '—'}</div>
                </div>
                <div className="field">
                  <div className="field-label">อีเมล</div>
                  <div className="field-val">{profile.email || '—'}</div>
                </div>
                <div className="field">
                  <div className="field-label">เลขบัตรประชาชน</div>
                  <div className="field-val">{profile.citizen_id || '—'}</div>
                </div>
                <div className="field">
                  <div className="field-label">เพศ</div>
                  <div className="field-val">{profile.gender || '—'}</div>
                </div>
                
                <h4 style={{ gridColumn: 'span 2', marginTop: 20, marginBottom: 12, fontSize: 13, color: '#64748b' }}>สิทธิ์การลาคงเหลือประจำปี</h4>
                <div className="leave-stats">
                  <div className="leave-stat">
                    <div className="leave-stat-val">{profile.quota_vacation || 0}</div>
                    <div className="leave-stat-label">ลาพักร้อนคงเหลือ (วัน)</div>
                  </div>
                  <div className="leave-stat">
                    <div className="leave-stat-val">{profile.quota_sick || 0}</div>
                    <div className="leave-stat-label">ลาป่วยคงเหลือ (วัน)</div>
                  </div>
                  <div className="leave-stat">
                    <div className="leave-stat-val">{profile.quota_personal || 0}</div>
                    <div className="leave-stat-label">ลากิจคงเหลือ (วัน)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="content-card">
              <h3 className="card-title">ประวัติการลา 10 รายการล่าสุด</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="profile-table">
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
            <div className="content-card">
              <h3 className="card-title">สรุปเงินเพิ่ม/ลด (12 เดือนล่าสุด)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="profile-table">
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
        </div>
      </div>
    </AppLayout>
  );
}
