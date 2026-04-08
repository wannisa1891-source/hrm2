'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

export const dynamic = 'force-dynamic';

// --- Interfaces ---
interface License {
  id: string;
  license_id: number | null;
  emp_id: string;
  name: string;
  type: string;
  license_no: string | null;
  issued: string;
  expires: string;
  daysLeft: number;
  points: number;
  status: string;
  license_name?: string;
  license_type?: string;
  institution?: string;
  issue_date?: string;
  expire_date?: string;
  file_path?: string;
  dept_name?: string;
  pos_name?: string;
  dept_id?: string;
  pos_id?: string;
  remarks?: string;
  verified_status?: string;
}

interface MonitorData {
  totalEmployees: number;
  compliant: number;
  missing: number;
  expiring: number;
  departmentStats: Record<string, { total: number, compliant: number, missing: number, expiring: number }>;
  details: any[];
}

interface LicenseConfig {
  id: number;
  config_name: string;
  pos_id: string | null;
  dept_id: string | null;
  license_name: string;
  valid_years: number;
  warning_days: number;
}

// --- Helpers ---
function getStatus(days: number) {
  if (days < 0) return { label: `หมดอายุ (${Math.abs(days)} วัน)`, color: '#dc2626', bg: '#fee2e2' };
  if (days <= 30) return { label: `วิกฤต (${days} วัน)`, color: '#ea580c', bg: '#ffedd5' };
  if (days <= 90) return { label: `ใกล้หมดอายุ (${days} วัน)`, color: '#ca8a04', bg: '#fef9c3' };
  return { label: `ยังใช้งานได้ (อีก ${days} วัน)`, color: '#16a34a', bg: '#dcfce7' };
}

export default function LicensePage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'hr';
  const isDeptHead = user?.role === 'หัวหน้า';
  
  const [activeTab, setActiveTab] = useState<'list' | 'monitor' | 'settings'>('list');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [configs, setConfigs] = useState<LicenseConfig[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTermEmp, setSearchTermEmp] = useState('');

  const [activeModal, setActiveModal] = useState<'none' | 'renew' | 'edit' | 'add' | 'config'>('none');
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<LicenseConfig | null>(null);
  
  const [formData, setFormData] = useState({
    license_no: '', expire_date: '', points: 0, emp_id: '',
    license_name: '', license_type: '', institution: '', issue_date: '',
    remarks: '', verified_status: 'Pending'
  });
  
  const [configFormData, setConfigFormData] = useState<Partial<LicenseConfig>>({
    config_name: '', pos_id: null, dept_id: null, license_name: '', valid_years: 5, warning_days: 90
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [historyData, setHistoryData] = useState<License[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') fetchLicenses();
    if (activeTab === 'monitor') fetchMonitorData();
    if (activeTab === 'settings') fetchConfigs();
  }, [activeTab, searchTerm, statusFilter]);

  const fetchInitialData = async () => {
    try {
      const [deptRes, posRes, empRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/positions'),
        fetch('/api/employees')
      ]);
      setDepartments(await deptRes.json());
      setPositions(await posRes.json());
      setAllEmployees(await empRes.json());
    } catch (err) { console.error(err); }
  };

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await fetch(`/api/licenses?${params.toString()}`);
      setLicenses(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchMonitorData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/licenses/monitor');
      setMonitorData(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/licenses/configs');
      setConfigs(await res.json());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const method = selectedConfig ? 'PUT' : 'POST';
      const res = await fetch('/api/licenses/configs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...configFormData, id: selectedConfig?.id })
      });
      if (!res.ok) throw new Error('Failed to save');
      Swal.fire('สำเร็จ', 'บันทึกเกณฑ์เรียบร้อยแล้ว', 'success');
      fetchConfigs();
      setActiveModal('none');
    } catch (err: any) { Swal.fire('Error', err.message, 'error'); } finally { setSubmitting(false); }
  };

  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append('license_id', selectedLicense?.license_id?.toString() || selectedLicense?.id || '');
      fd.append('emp_id', activeModal === 'add' ? formData.emp_id : selectedLicense?.emp_id || '');
      fd.append('expire_date', formData.expire_date);
      fd.append('license_no', formData.license_no);
      fd.append('license_name', formData.license_name);
      fd.append('license_type', formData.license_type);
      fd.append('institution', formData.institution);
      fd.append('issue_date', formData.issue_date);
      fd.append('remarks', formData.remarks);
      fd.append('verified_status', formData.verified_status);
      if (selectedFile) fd.append('file', selectedFile);

      const res = await fetch('/api/licenses/renew', {
        method: 'POST',
        body: fd
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลและอัปโหลดไฟล์เรียบร้อยแล้ว', showConfirmButton: false, timer: 1500 });
        fetchLicenses();
        setActiveModal('none');
        setSelectedFile(null);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err: any) { Swal.fire('Error', err.message, 'error'); } finally { setSubmitting(false); }
  };

  const fetchHistory = async (empId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/licenses/renew?emp_id=${empId}&history=true`);
      if (res.ok) {
        setHistoryData(await res.json());
        setHistoryModalOpen(true);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleOpenModal = (type: any, data?: any) => {
    if (type === 'config') {
      setSelectedConfig(data || null);
      setConfigFormData(data || { config_name: '', pos_id: null, dept_id: null, license_name: '', valid_years: 5, warning_days: 90 });
    } else {
      setSelectedLicense(data || null);
      setSearchTermEmp('');
      if (data) {
        setFormData({
          license_no: data.license_no || '',
          expire_date: data.expire_date || data.expires || '',
          points: data.points || 0,
          emp_id: data.emp_id,
          license_name: data.license_name || '',
          license_type: data.license_type || '',
          institution: data.institution || '',
          issue_date: data.issue_date || '',
          remarks: data.remarks || '',
          verified_status: data.verified_status || 'Pending'
        });
      } else {
        setFormData({ license_no: '', expire_date: '', points: 0, emp_id: '', license_name: '', license_type: '', institution: '', issue_date: '', remarks: '', verified_status: 'Pending' });
      }
    }
    setActiveModal(type);
  };

  const COLORS = ['#1e293b', '#3b82f6', '#ef4444'];
  
  const checkEmployeeRequirement = (empId: string) => {
    const emp = allEmployees.find(e => e.emp_id === empId);
    if (!emp) return null;
    return configs.find(c => (!c.dept_id || c.dept_id === emp.dept_id) && (!c.pos_id || c.pos_id === emp.pos_id));
  };

  return (
    <AppLayout>
      <div style={{ padding: '32px', minHeight: '100vh', background: '#f1f5f9', color: '#1e293b', fontFamily: '"Inter", "Prompt", sans-serif' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
               License Governance System 
               <span style={{ fontSize: '12px', background: '#0f172a', color: '#fff', padding: '4px 12px', borderRadius: '20px', marginLeft: '12px', verticalAlign: 'middle' }}>V4 ENTERPRISE</span>
            </h1>
            <p style={{ color: '#64748b', fontSize: '16px', marginTop: '4px' }}>การจัดการและตรวจสอบใบประกอบวิชาชีพตามมาตรฐานสูงสุด</p>
          </div>
          <button 
            onClick={() => handleOpenModal('add')} 
            style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}
          >
            + บันทึกข้อมูลใบประกอบ
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#e2e8f0', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
          {[
             { id: 'list', label: 'ทะเบียนบุคลากร' },
             { id: 'monitor', label: 'Dashboard สรุปผล' },
             { id: 'settings', label: 'การตั้งค่าเกณฑ์' }
          ].filter(t => isAdmin || (isDeptHead && t.id === 'monitor') || t.id === 'list').map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 32px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#0f172a' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <div className="fade-in">
             <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                   <input placeholder="ค้นหาชื่อ หรือ เลขใบประกอบ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                   <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                      <option value="all">ทุกสถานะ</option>
                      <option value="expiring">ใกล้หมดอายุ</option>
                      <option value="expired">หมดอายุ</option>
                   </select>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                   <thead>
                      <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
                         <th style={{ padding: '0 20px 12px 20px' }}>ชื่อ-นามสกุล / รหัสพนักงาน</th>
                         <th>วิชาชีพ / เลขที่ใบอนุญาต</th>
                         <th>วันหมดอายุ</th>
                         <th>สถานะคงเหลือ</th>
                         <th style={{ textAlign: 'right', padding: '0 20px 12px 0' }}>ดำเนินการ</th>
                      </tr>
                   </thead>
                   <tbody>
                      {licenses.map(l => {
                        const stat = getStatus(l.daysLeft);
                        return (
                          <tr key={l.id} style={{ background: '#fff' }}>
                             <td style={{ padding: '20px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', border: '1px solid #f1f5f9', borderRight: 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{l.name?.[0]}</div>
                                   <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                         <div style={{ fontWeight: 800, color: '#0f172a' }}>{l.name}</div>
                                         <button onClick={() => fetchHistory(l.emp_id)} title="ดูประวัติการต่ออายุ" style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>🕒</button>
                                      </div>
                                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {l.emp_id}</div>
                                   </div>
                                </div>
                             </td>
                             <td style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontWeight: 700 }}>{l.type || l.license_name}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{l.license_no || '-'}</div>
                             </td>
                             <td style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{l.expires || '-'}</td>
                             <td style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, background: stat.bg, color: stat.color }}>{stat.label}</span>
                             </td>
                             <td style={{ padding: '20px', borderTopRightRadius: '12px', borderBottomRightRadius: '12px', border: '1px solid #f1f5f9', borderLeft: 'none', textAlign: 'right' }}>
                                <button onClick={() => handleOpenModal('renew', l)} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>จัดการ / ต่ออายุ</button>
                             </td>
                          </tr>
                        );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* Dashboard Content */}
        {activeTab === 'monitor' && monitorData && (
           <div className="fade-in">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                 {[
                   { label: 'บุคลากรทั้งหมด', val: monitorData.totalEmployees, color: '#0f172a', filter: 'all' },
                   { label: 'ถูกต้องครบถ้วน', val: monitorData.compliant, color: '#16a34a', filter: 'all' },
                   { label: 'ใกล้หมดอายุ', val: monitorData.expiring, color: '#ca8a04', filter: 'expiring' },
                   { label: 'หมดอายุ / ขาดข้อมูล', val: monitorData.missing, color: '#ef4444', filter: 'expired' }
                 ].map((c, i) => (
                   <div 
                     key={i} 
                     onClick={() => { setStatusFilter(c.filter); setActiveTab('list'); }}
                     style={{ 
                       background: '#fff', padding: '32px', borderRadius: '20px', border: '1px solid #e2e8f0', cursor: 'pointer',
                       transition: 'all 0.2s ease', 
                       boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                     }}
                     className="hover-card"
                   >
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#64748b' }}>{c.label}</p>
                      <h2 style={{ margin: '8px 0 0 0', fontSize: '40px', fontWeight: 800, color: c.color }}>{c.val}</h2>
                   </div>
                 ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                 <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สถิติตามแผนก (Department Compliance)</h3>
                    <div style={{ height: '350px' }}>
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={Object.entries(monitorData.departmentStats).map(([name, s]) => ({ name, compliant: s.compliant, missing: s.missing + s.expiring }))}>
                             <XAxis dataKey="name" fontSize={10} />
                             <YAxis fontSize={10} />
                             <Tooltip />
                             <Bar dataKey="compliant" fill="#0f172a" stackId="a" radius={[0, 0, 0, 0]} />
                             <Bar dataKey="missing" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
                 <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สัดส่วนสถานะใบประกอบ</h3>
                    <div style={{ flex: 1, minHeight: '300px' }}>
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                                data={[
                                  { name: 'ถูกต้อง', value: monitorData.compliant },
                                  { name: 'ใกล้หมดอายุ', value: monitorData.expiring },
                                  { name: 'หมดอายุ/ขาด', value: monitorData.missing }
                                ]}
                                cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value"
                             >
                                {[
                                  { color: '#16a34a' },
                                  { color: '#ca8a04' },
                                  { color: '#ef4444' }
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                             </Pie>
                             <Tooltip />
                             <Legend verticalAlign="bottom" align="center" />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
           <div className="fade-in">
              <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                       <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>เกณฑ์มาตรฐานตามสายงาน</h3>
                       <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>กำหนดใบประกอบวิชาชีพที่บังคับสำรับแต่ละแผนกและตำแหน่ง</p>
                    </div>
                    <button onClick={() => handleOpenModal('config')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}>+ เพิ่มเกณฑ์มาตรฐาน</button>
                 </div>
                 
                 <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                             <th style={{ padding: '16px 20px' }}>ชื่อเกณฑ์ / กลุ่มเป้าหมาย</th>
                             <th>ใบประกอบที่บังคับ</th>
                             <th>อายุบัตร (ปี)</th>
                             <th>เตือนล่วงหน้า</th>
                             <th style={{ textAlign: 'right', paddingRight: '20px' }}>จัดการ</th>
                          </tr>
                       </thead>
                       <tbody>
                          {configs.map(c => {
                            const dept = departments.find(d => d.dept_id === c.dept_id)?.dept_name || 'ทุกแผนก';
                            const pos = positions.find(p => p.pos_id === c.pos_id)?.pos_name || 'ทุกตำแหน่ง';
                            return (
                             <tr 
                               key={c.id} 
                               onClick={() => handleOpenModal('config', c)}
                               style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', transition: 'background 0.2s' }}
                               onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                               onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                             >
                                <td style={{ padding: '16px 20px' }}>
                                   <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.config_name}</div>
                                   <div style={{ fontSize: '12px', color: '#64748b' }}>{dept} | {pos}</div>
                                </td>
                                <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.license_name}</td>
                                <td style={{ fontWeight: 700 }}>{c.valid_years}</td>
                                <td>
                                   <span style={{ padding: '4px 12px', borderRadius: '6px', background: '#fef9c3', color: '#a16207', fontSize: '12px', fontWeight: 800 }}>{c.warning_days} วัน</span>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                   <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: '13px' }}>ดูรายละเอียด/แก้ไข</span>
                                </td>
                             </tr>
                            );
                          })}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* Professional License Entry Modal */}
        {(activeModal === 'renew' || activeModal === 'add' || activeModal === 'edit') && (() => {
           const selection = formData.emp_id ? checkEmployeeRequirement(formData.emp_id) : null;
           const employee = allEmployees.find(e => e.emp_id === formData.emp_id);
           
           return (
           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
              <div style={{ background: '#fff', width: '1000px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ padding: '32px 40px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                       <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>จัดการข้อมูลใบประกอบวิชาชีพ</h2>
                       <p style={{ margin: '4px 0 0 0', opacity: 0.6, fontSize: '14px' }}>การบันทึกข้อมูลเพื่อเข้าสู่ระบบประวัติและการกำกับดูแลมาตรฐานสากล</p>
                    </div>
                    {selection && <div style={{ background: '#16a34a', padding: '8px 20px', borderRadius: '30px', fontSize: '12px', fontWeight: 800 }}>เกณฑ์บังคับ: {selection.license_name}</div>}
                 </div>

                 <div style={{ padding: '40px' }}>
                    <form onSubmit={handleLicenseSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px' }}>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                             <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>1. ข้อมูลบุคลากร</label>
                             {activeModal === 'add' ? (
                                <div style={{ position: 'relative' }}>
                                   <input placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..." value={searchTermEmp} onChange={e => { setSearchTermEmp(e.target.value); setFormData({...formData, emp_id: ''}); }} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                                   {searchTermEmp && !formData.emp_id && (
                                      <div style={{ position: 'absolute', top: '100%', left:0, right:0, background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', marginTop:'4px', zIndex:100, maxHeight:'200px', overflowY:'auto' }}>
                                         {allEmployees.filter(e => e.first_name_th?.includes(searchTermEmp) || e.emp_id?.includes(searchTermEmp)).slice(0, 5).map(e => (
                                            <div key={e.emp_id} onClick={() => {
                                               const req = checkEmployeeRequirement(e.emp_id);
                                               setFormData({...formData, emp_id: e.emp_id, license_name: req?.license_name || ''});
                                               setSearchTermEmp(`${e.first_name_th} ${e.last_name_th} (${e.emp_id})`);
                                            }} style={{ padding:'12px', cursor:'pointer', borderBottom:'1px solid #f1f5f9' }}>
                                               <div style={{ fontWeight:700 }}>{e.first_name_th} {e.last_name_th}</div>
                                               <div style={{ fontSize:'11px', color:'#64748b' }}>{e.pos_name}</div>
                                            </div>
                                         ))}
                                      </div>
                                   )}
                                </div>
                             ) : (
                                <div style={{ fontWeight: 800, fontSize: '18px' }}>{selectedLicense?.name} ({selectedLicense?.emp_id})</div>
                             )}
                          </div>
                          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                             <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '12px' }}>2. อัปโหลดไฟล์หลักฐาน (PDF/PNG/JPG)</label>
                             <div 
                                onClick={() => document.getElementById('fileInput')?.click()}
                                style={{ height: '150px', border: '2px dashed #cbd5e1', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s', background: selectedFile ? '#f0fdf4' : 'transparent' }}
                             >
                                <input id="fileInput" type="file" hidden onChange={e => setSelectedFile(e.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg" />
                                <div style={{ fontSize: '32px' }}>{selectedFile ? '✅' : '📁'}</div>
                                <div style={{ fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
                                   {selectedFile ? <strong>{selectedFile.name}</strong> : 'คลิกเพื่อเลือกไฟล์ หรือลากวางที่นี่'}
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                             <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '13px', fontWeight: 800 }}>ชื่อใบประกอบวิชาชีพ</label>
                                <input required value={formData.license_name} onChange={e => setFormData({...formData, license_name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '13px', fontWeight: 800 }}>เลขที่ใบอนุญาต</label>
                                <input required value={formData.license_no} onChange={e => setFormData({...formData, license_no: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '13px', fontWeight: 800 }}>ประเภท/สาขา</label>
                                <input value={formData.license_type} onChange={e => setFormData({...formData, license_type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '13px', fontWeight: 800 }}>วันที่ออกบัตร</label>
                                <input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '13px', fontWeight: 800 }}>วันที่หมดอายุ</label>
                                <input required type="date" value={formData.expire_date} onChange={e => setFormData({...formData, expire_date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                             </div>
                          </div>
                          <div>
                             <label style={{ fontSize: '13px', fontWeight: 800 }}>สถาบันที่ออกให้</label>
                             <input value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                          </div>
                          <div>
                             <label style={{ fontSize: '13px', fontWeight: 800 }}>หมายเหตุ (ถ้ามี)</label>
                             <textarea value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', height: '80px', resize: 'none' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px' }}>
                             <button type="button" onClick={() => setActiveModal('none')} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>ยกเลิก</button>
                             <button type="submit" disabled={submitting} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 40px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและเก็บประวัติ'}</button>
                          </div>
                       </div>
                    </form>
                 </div>
              </div>
           </div>
           );
        })()}

        {/* History Modal */}
        {historyModalOpen && (
           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', width: '800px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                 <div style={{ padding: '24px 32px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>ประวัติการถือครองใบประกอบวิชาชีพ</h3>
                    <button onClick={() => setHistoryModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>ปิด</button>
                 </div>
                 <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                       <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                             <th style={{ padding: '12px' }}>ช่วงเวลา</th>
                             <th>วิชาชีพ / เลขที่ใบอนุญาต</th>
                             <th>สถานะ</th>
                          </tr>
                       </thead>
                       <tbody>
                          {historyData.map(h => (
                             <tr key={h.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ padding: '16px' }}>{h.issue_date || '-'} ถึง {h.expire_date || '-'}</td>
                                <td>{h.license_name}<br/><span style={{ fontSize:'11px', color:'#94a3b8' }}>{h.license_no}</span></td>
                                <td>
                                   {h.file_path ? (
                                      <a href={h.file_path} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 800, textDecoration: 'none' }}>เปิดดูเอกสาร</a>
                                   ) : (
                                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>ไม่มีไฟล์</span>
                                   )}
                                </td>
                                <td>
                                   <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, background: h.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: h.status === 'Active' ? '#16a34a' : '#64748b' }}>
                                      {h.status === 'Active' ? 'ใบปัจจุบัน' : 'ประวัติใบเดิม'}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {/* Config Modal */}
        {activeModal === 'config' && (
           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.95)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', width: '500px', borderRadius: '24px', padding: '40px' }}>
                 <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 800 }}>ตั้งค่าเกณฑ์มาตรฐาน</h2>
                 <form onSubmit={handleConfigSubmit}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                       <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>ชื่อเกณฑ์</label>
                          <input required value={configFormData.config_name} onChange={e => setConfigFormData({...configFormData, config_name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                       </div>
                       <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>วิชาชีพที่บังคับ</label>
                          <input required value={configFormData.license_name} onChange={e => setConfigFormData({...configFormData, license_name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                       </div>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                             <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>อายุใบอนุญาต (ปี)</label>
                             <input type="number" value={configFormData.valid_years} onChange={e => setConfigFormData({...configFormData, valid_years: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                          </div>
                          <div>
                             <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>เตือนล่วงหน้า (วัน)</label>
                             <input type="number" value={configFormData.warning_days} onChange={e => setConfigFormData({...configFormData, warning_days: parseInt(e.target.value)})} style={{ width: '100', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
                          </div>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                          <button type="button" onClick={() => setActiveModal('none')} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>ยกเลิก</button>
                          <button type="submit" style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}>บันทึกเกณฑ์</button>
                       </div>
                    </div>
                 </form>
              </div>
           </div>
        )}

      </div>
    </AppLayout>
  );
}
