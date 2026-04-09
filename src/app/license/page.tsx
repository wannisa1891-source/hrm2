'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';

export const dynamic = 'force-dynamic';

// --- Constants ---
const COUNCIL_LINKS: Record<string, string> = {
   'สภาการพยาบาล': 'https://www.tnmc.or.th/index.php?component=check_license',
   'แพทยสภา': 'https://tmc.or.th/check_md/',
   'สภาเภสัชกรรม': 'https://www.pharmacycouncil.org/index.php?option=com_content&view=article&id=107&Itemid=125',
   'สภาเทคนิคการแพทย์': 'https://www.mtcouncil.org/search-member',
   'สภากายภาพบำบัด': 'https://pt.or.th/check-license',
   'ทันตแพทยสภา': 'https://www.dentcouncil.or.th/checklicense',
   'สภาวิศวกร': 'https://coe.or.th/search-license/',
   'คุรุสภา': 'https://www.ksp.or.th/service/check_license.php',
   'คณะกรรมการวิชาชีพสาขารังสีเทคนิค': 'https://www.rtcouncil.or.th/',
   'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)': 'https://www.niems.go.th/'
};

const ISSUERS = [
   'สภาการพยาบาล',
   'แพทยสภา',
   'สภาเภสัชกรรม',
   'สภาเทคนิคการแพทย์',
   'สภากายภาพบำบัด',
   'ทันตแพทยสภา',
   'คณะกรรมการวิชาชีพสาขารังสีเทคนิค',
   'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)',
   'คุรุสภา',
   'อื่นๆ'
];

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
  issuer?: string;
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
function getStatus(l: License) {
   if (l.verified_status === 'Pending') return { label: 'รอการตรวจสอบ', color: '#7c3aed', bg: '#f5f3ff' };
   if (l.daysLeft < 0) return { label: `หมดอายุแล้ว (${Math.abs(l.daysLeft)} วัน)`, color: '#dc2626', bg: '#fee2e2' };
   if (l.daysLeft <= 30) return { label: `วิกฤต (${l.daysLeft} วัน)`, color: '#ca8a04', bg: '#fef9c3' };
   if (l.daysLeft <= 90) return { label: `ใกล้หมดอายุ (${l.daysLeft} วัน)`, color: '#ea580c', bg: '#ffedd5' };
   return { label: 'ตรวจสอบแล้ว', color: '#16a34a', bg: '#dcfce7' };
}

function addYears(dateStr: string, years: number) {
   if (!dateStr) return '';
   const d = new Date(dateStr);
   d.setFullYear(d.getFullYear() + years);
   return d.toISOString().split('T')[0];
}

function findIssuerLink(licenseName: string) {
   if (!licenseName) return null;
   const name = licenseName.toLowerCase();
   if (name.includes('พยาบาล')) return COUNCIL_LINKS['สภาการพยาบาล'];
   if ((name.includes('แพทย์') || name.includes('เวชกรรม')) && !name.includes('เทคนิค') && !name.includes('รังสี') && !name.includes('แผนไทย')) return COUNCIL_LINKS['แพทยสภา'];
   if (name.includes('เภสัช')) return COUNCIL_LINKS['สภาเภสัชกรรม'];
   if (name.includes('เทคนิคการแพทย์')) return COUNCIL_LINKS['สภาเทคนิคการแพทย์'];
   if (name.includes('กายภาพบำบัด')) return COUNCIL_LINKS['สภากายภาพบำบัด'];
   if (name.includes('ทันต') || name.includes('ทันตกรรม')) return COUNCIL_LINKS['ทันตแพทยสภา'];
   if (name.includes('วิศวกร')) return COUNCIL_LINKS['สภาวิศวกร'];
   if (name.includes('ครู') || name.includes('สอน')) return COUNCIL_LINKS['คุรุสภา'];
   if (name.includes('รังสี')) return COUNCIL_LINKS['คณะกรรมการวิชาชีพสาขารังสีเทคนิค'];
   if (name.includes('ฉุกเฉิน') || name.includes('สพฉ')) return COUNCIL_LINKS['สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)'];

   for (const [key, url] of Object.entries(COUNCIL_LINKS)) {
      if (licenseName.includes(key.replace('สภา', '')) || licenseName.includes(key)) return url;
   }
   return null;
}

function ModernSelect({
   value,
   onChange,
   options,
   placeholder = 'เลือก...',
   style = {}
}: {
   value: string | number,
   onChange: (val: any) => void,
   options: { value: string | number, label: string }[],
   placeholder?: string,
   style?: React.CSSProperties
}) {
   const [isOpen, setIsOpen] = useState(false);
   const selectedOption = options.find(o => String(o.value) === String(value));

   return (
      <div style={{ position: 'relative', flex: 1, ...style }}>
         <div
            onClick={() => setIsOpen(!isOpen)}
            style={{
               padding: '14px 24px',
               borderRadius: '40px',
               background: '#fff',
               border: '1px solid #e2e8f0',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               fontWeight: 700,
               fontSize: '14px',
               boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
               transition: 'all 0.2s',
               minHeight: '48px'
            }}
         >
            <span style={{ color: selectedOption ? '#0f172a' : '#94a3b8' }}>
               {selectedOption ? selectedOption.label : placeholder}
            </span>
            <svg
               width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
            >
               <path d="m6 9 6 6 6-6" />
            </svg>
         </div>

         {isOpen && (
            <>
               <div
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3999 }}
                  onClick={() => setIsOpen(false)}
               />
               <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                  background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
                  zIndex: 4000, overflow: 'hidden', padding: '10px', border: '1px solid #f1f5f9',
                  maxHeight: '300px', overflowY: 'auto'
               }}>
                  {options.map((opt, i) => (
                     <div
                        key={i}
                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                        style={{
                           padding: '12px 16px', borderRadius: '14px', cursor: 'pointer', fontSize: '14px',
                           fontWeight: 600, color: String(opt.value) === String(value) ? '#2563eb' : '#475569',
                           background: String(opt.value) === String(value) ? '#eff6ff' : 'transparent',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = String(opt.value) === String(value) ? '#eff6ff' : '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.background = String(opt.value) === String(value) ? '#eff6ff' : 'transparent'}
                     >
                        {opt.label}
                     </div>
                  ))}
               </div>
            </>
         )}
      </div>
   );
}

// --- Main Page Component ---
export default function LicensePage() {
   const { user } = useAuth();
   const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'hr';
   const isDeptHead = user?.role === 'หัวหน้า';
   const isRegularUser = !isAdmin && !isDeptHead;

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

   const [activeModal, setActiveModal] = useState<'none' | 'renew' | 'edit' | 'add' | 'config' | 'view'>('none');
   const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
   const [selectedConfig, setSelectedConfig] = useState<LicenseConfig | null>(null);
   
   const [formData, setFormData] = useState({
     license_no: '', expire_date: '', points: 0, emp_id: '',
     license_name: '', license_type: '', institution: '', issue_date: '',
     remarks: '', verified_status: 'Pending', issuer: '', warning_days_override: 0, psv_checked: false
   });
   
   const [configFormData, setConfigFormData] = useState<Partial<LicenseConfig>>({
     config_name: '', pos_id: null, dept_id: null, license_name: '', valid_years: 5, warning_days: 90
   });

   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [submitting, setSubmitting] = useState(false);
   const [historyData, setHistoryData] = useState<License[]>([]);
   const [historyOpen, setHistoryOpen] = useState(false);
   const [isProfileExpanded, setIsProfileExpanded] = useState(false);

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
       const v = Date.now();
       const [deptRes, posRes, empRes] = await Promise.all([
         fetch(`/api/departments?v=${v}`, { cache: 'no-store' }),
         fetch(`/api/positions?v=${v}`, { cache: 'no-store' }),
         fetch(`/api/employees?v=${v}`, { cache: 'no-store' })
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
       if (isRegularUser && user?.emp_id) params.append('emp_id', user.emp_id);
       params.append('v', Date.now().toString());

       const res = await fetch(`/api/licenses?${params.toString()}`, { cache: 'no-store' });
       setLicenses(await res.json());
     } catch (err) { console.error(err); } finally { setLoading(false); }
   };

   const fetchMonitorData = async () => {
     try {
       setLoading(true);
       const v = Date.now();
       const res = await fetch(`/api/licenses/monitor?v=${v}`, { cache: 'no-store' });
       setMonitorData(await res.json());
     } catch (err) { console.error(err); } finally { setLoading(false); }
   };

   const fetchConfigs = async () => {
     try {
       setLoading(true);
       const v = Date.now();
       const res = await fetch(`/api/licenses/configs?v=${v}`, { cache: 'no-store' });
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
       Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกเกณฑ์เรียบร้อยแล้ว', showConfirmButton: false, timer: 1000 });
       fetchConfigs();
       setActiveModal('none');
     } catch (err: any) { Swal.fire('Error', err.message, 'error'); } finally { setSubmitting(false); }
   };

   const handleLicenseSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!formData.psv_checked && activeModal === 'renew') {
        Swal.fire('คำเตือน', 'กรุณายืนยันว่าได้ตรวจสอบข้อมูลกับสภาวิชาชีพเรียบร้อยแล้ว', 'warning');
        return;
     }

     try {
       setSubmitting(true);
       const fd = new FormData();
       const rawId = selectedLicense?.license_id || selectedLicense?.id || '';
       fd.append('license_id', rawId.toString());
       fd.append('emp_id', activeModal === 'add' ? formData.emp_id : selectedLicense?.emp_id || '');
       fd.append('expire_date', formData.expire_date);
       fd.append('license_no', formData.license_no);
       fd.append('license_name', formData.license_name);
       fd.append('license_type', formData.license_type);
       fd.append('institution', formData.institution);
       fd.append('issuer', formData.issuer);
       fd.append('issue_date', formData.issue_date);
       fd.append('points', formData.points.toString());
       fd.append('remarks', formData.remarks);
       fd.append('warning_days_override', formData.warning_days_override.toString());
       fd.append('verified_status', formData.psv_checked ? 'Verified' : 'Pending');
       if (selectedFile) fd.append('file', selectedFile);

       const res = await fetch('/api/licenses/renew', { method: 'POST', body: fd });
       if (res.ok) {
         Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', showConfirmButton: false, timer: 1000 });
         fetchLicenses();
         if (activeTab === 'monitor') fetchMonitorData();
         setActiveModal('none');
         setSelectedFile(null);
       } else {
         const err = await res.json();
         throw new Error(err.error || 'Failed to save');
       }
     } catch (err: any) { Swal.fire('Error', err.message, 'error'); } finally { setSubmitting(false); }
   };

   const fetchHistoryData = async (empId: string) => {
      try {
         const v = Date.now();
         const res = await fetch(`/api/licenses/renew?emp_id=${empId}&history=true&v=${v}`, { cache: 'no-store' });
         if (res.ok) {
            setHistoryData(await res.json());
            setHistoryOpen(true);
         }
      } catch (err) { console.error(err); }
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
               license_type: data.license_type || data.type || '',
               institution: data.institution || '',
               issuer: data.issuer || '',
               issue_date: data.issue_date || data.issued || '',
               remarks: data.remarks || '',
               warning_days_override: data.warning_days_override || 0,
               verified_status: data.verified_status || 'Pending',
               psv_checked: data.verified_status === 'Verified'
            });
         } else {
            setFormData({ license_no: '', expire_date: '', points: 0, emp_id: '', license_name: '', license_type: '', institution: '', issuer: '', issue_date: '', remarks: '', warning_days_override: 0, verified_status: 'Pending', psv_checked: false });
         }
      }
      setActiveModal(type);
   };

   const checkRequirement = (empId: string) => {
      const emp = allEmployees.find(e => e.emp_id === empId);
      if (!emp) return null;
      const empDept = departments.find(d => d.dept_id === emp.dept_id);
      if (!empDept) return null;

      const matchExact = configs.find(c => c.dept_id === emp.dept_id && (!c.pos_id || c.pos_id === emp.pos_id));
      if (matchExact) return matchExact;

      const matchGroup = configs.find(c => {
         const cDept = departments.find(d => d.dept_id === c.dept_id);
         return cDept && cDept.division === empDept.division && cDept.dept_name === empDept.dept_name && !cDept.sub_dept && (!c.pos_id || c.pos_id === emp.pos_id);
      });
      if (matchGroup) return matchGroup;

      const matchDiv = configs.find(c => {
         const cDept = departments.find(d => d.dept_id === c.dept_id);
         return cDept && cDept.division === empDept.division && !cDept.dept_name && (!c.pos_id || c.pos_id === emp.pos_id);
      });
      if (matchDiv) return matchDiv;

      const matchPos = configs.find(c => c.pos_id === emp.pos_id && !c.dept_id);
      if (matchPos) return matchPos;

      return null;
   };

   const getDeptName = (id: string) => {
      const dept = departments.find(d => String(d.dept_id) === String(id));
      if (!dept) return id || '-';
      return `${dept.division} > ${dept.dept_name}${dept.sub_dept ? ` > ${dept.sub_dept}` : ''}`;
   };
   const getPosName = (id: string) => positions.find(p => String(p.pos_id) === String(id))?.pos_name || id || '-';

   const divisions = (Array.from(new Set(departments.map(d => d.division?.trim()))).filter(Boolean) as string[]).sort((a, b) => a.localeCompare(b, 'th'));
   const getGroupsByDiv = (div: string) => Array.from(new Set(departments.filter(d => d.division?.trim() === div).map(d => d.dept_name?.trim()))).filter(Boolean).sort((a, b) => a.localeCompare(b, 'th'));
   const getSubsByGrp = (div: string, grp: string) => departments.filter(d => d.division?.trim() === div && d.dept_name?.trim() === grp).sort((a, b) => (a.sub_dept || '').localeCompare(b.sub_dept || '', 'th'));

   const cardStyle = {
      background: '#fff',
      borderRadius: '24px',
      padding: '32px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      border: '1px solid #f1f5f9'
   };

   // --- JSX Body ---
   return (
      <AppLayout>
         <div style={{ padding: '32px', minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: '"Anuphan", "Prompt", sans-serif' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <div>
                     <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: 0 }}>ทะเบียนใบประกอบวิชาชีพ</h1>
                     <p style={{ color: '#64748b', fontWeight: 600, marginTop: '4px' }}>การจัดการทะเบียน การต่ออายุ และการตรวจสอบความถูกต้องสากล</p>
                  </div>
                  {isAdmin && (
                     <button onClick={() => handleOpenModal('add')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
                        บันทึกข้อมูลใบประกอบ
                     </button>
                  )}
               </div>

               {(isAdmin || isDeptHead) && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
                     {[
                        { id: 'list', label: 'ทะเบียนบุคลากร' },
                        { id: 'monitor', label: 'สรุปผลภาพรวม' },
                        { id: 'settings', label: 'การตั้งค่าเกณฑ์' }
                     ].map(tab => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id as any)}
                           style={{
                              padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                              background: activeTab === tab.id ? '#fff' : 'transparent',
                              color: activeTab === tab.id ? '#0f172a' : '#64748b',
                              transition: 'all 0.2s',
                              boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                           }}
                        >
                           {tab.label}
                        </button>
                     ))}
                  </div>
               )}

               {activeTab === 'list' && (
                  <div style={cardStyle} className="fade-in">
                     <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                           <input 
                              placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน หรือเลขใบอนุญาต..." 
                              value={searchTerm} 
                              onChange={e => setSearchTerm(e.target.value)} 
                              style={{ width: '100%', padding: '16px 24px 16px 54px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '15px', fontWeight: 500, outline: 'none', transition: 'all 0.2s' }} 
                           />
                           <svg style={{ position: 'absolute', left: '20px', top: '18px', color: '#94a3b8' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        </div>
                        <select 
                           value={statusFilter} 
                           onChange={e => setStatusFilter(e.target.value)} 
                           style={{ padding: '0 24px', borderRadius: '16px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#475569', cursor: 'pointer', outline: 'none' }}
                        >
                           <option value="all">ทุกสถานะใบประกอบ</option>
                           <option value="expiring">ใกล้หมดอายุ</option>
                           <option value="expired">หมดอายุแล้ว</option>
                           <option value="Pending">รอตรวจสอบ</option>
                        </select>
                     </div>

                     <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
                        <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
                           <thead>
                              <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
                                 <th style={{ padding: '20px 16px' }}>รหัสพนักงาน</th>
                                 <th style={{ padding: '20px 16px' }}>ชื่อ-นามสกุล</th>
                                 <th style={{ padding: '20px 16px' }}>วิชาชีพ</th>
                                 <th style={{ padding: '20px 16px' }}>เลขใบอนุญาต</th>
                                 <th style={{ padding: '20px 16px' }}>วันหมดอายุ</th>
                                 <th style={{ padding: '20px 16px' }}>สถานะ</th>
                                 <th style={{ textAlign: 'right', padding: '20px 16px' }}>ดำเนินการ</th>
                              </tr>
                           </thead>
                           <tbody>
                              {licenses.map(l => {
                                 const stat = getStatus(l);
                                 return (
                                    <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                       <td style={{ padding: '20px 16px', color: '#64748b', fontWeight: 700 }}>{l.emp_id}</td>
                                       <td 
                                          onClick={() => handleOpenModal('view', l)}
                                          style={{ padding: '20px 16px', fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}
                                       >
                                          {l.name}
                                       </td>
                                       <td style={{ padding: '20px 16px', fontWeight: 700 }}>{l.type || l.license_name}</td>
                                       <td style={{ padding: '20px 16px', color: '#64748b', fontFamily: 'monospace' }}>{l.license_no || '-'}</td>
                                       <td style={{ padding: '20px 16px', fontWeight: 700 }}>{l.expires || '-'}</td>
                                       <td style={{ padding: '20px 16px' }}>
                                          <span style={{ padding: '8px 16px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: stat.bg, color: stat.color }}>{stat.label}</span>
                                       </td>
                                       <td style={{ textAlign: 'right', padding: '20px 16px' }}>
                                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                             <button onClick={() => fetchHistoryData(l.emp_id)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                                🕒
                                             </button>
                                             {isAdmin && (
                                                <button onClick={() => handleOpenModal('renew', l)} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>จัดการ</button>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                        {licenses.length === 0 && !loading && (
                           <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>ไม่พบข้อมูลใบประกอบวิชาชีพ</div>
                        )}
                     </div>
                  </div>
               )}

               {activeTab === 'monitor' && monitorData && (
                  <div className="fade-in">
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {[
                           { label: 'บุคลากรทั้งหมด', value: monitorData.totalEmployees, color: '#0f172a', icon: '👥' },
                           { label: 'ข้อมูลถูกต้องครบถ้วน', value: monitorData.compliant, color: '#16a34a', icon: '✅' },
                           { label: 'ใกล้หมดอายุ (90 วัน)', value: monitorData.expiring, color: '#ca8a04', icon: '⚠️' },
                           { label: 'หมดอายุ / ขาดข้อมูล', value: monitorData.missing, color: '#dc2626', icon: '❌' }
                        ].map((card, i) => (
                           <div key={i} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{card.icon}</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#64748b' }}>{card.label}</div>
                              <div style={{ fontSize: '32px', fontWeight: 900, color: card.color }}>{card.value}</div>
                           </div>
                        ))}
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                        <div style={cardStyle}>
                           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สรุปสถานะตามฝ่าย/แผนก</h3>
                           <div style={{ height: '400px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                 <BarChart data={Object.entries(monitorData.departmentStats).map(([name, s]) => ({ name, compliant: s.compliant, gap: s.missing + s.expiring }))}>
                                    <XAxis dataKey="name" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="compliant" stackId="a" fill="#0f172a" />
                                    <Bar dataKey="gap" stackId="a" fill="#ef4444" />
                                 </BarChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                        <div style={cardStyle}>
                           <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สัดส่วนพนักงานแยกตามสภาฯ</h3>
                           <div style={{ height: '400px' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie 
                                       data={Object.entries(monitorData.departmentStats).map(([name, s]) => ({ name, value: s.total }))} 
                                       cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value"
                                    >
                                       {Object.entries(monitorData.departmentStats).map((_, i) => (
                                          <Cell key={i} fill={[`#0f172a`, `#2563eb`, `#16a34a`, `#ca8a04`, `#dc2626`, `#9333ea`][i % 6]} />
                                       ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                 </PieChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {activeTab === 'settings' && (
                  <div style={cardStyle}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                           <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>เกณฑ์มาตรฐานใบอนุญาต</h3>
                           <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>กำหนดวิชาชีพที่บังคับสำหรับแต่ละฝ่าย กลุ่มงาน หรือตำแหน่ง</p>
                        </div>
                        <button onClick={() => handleOpenModal('config')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>+ เพิ่มเกณฑ์</button>
                     </div>

                     <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                           <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                              <th style={{ padding: '16px' }}>ชื่อเกณฑ์</th>
                              <th>วิชาชีพ</th>
                              <th>กลุ่มเป้าหมาย</th>
                              <th>อายุบัตร/แจ้งเตือน</th>
                              <th style={{ textAlign: 'right' }}>จัดการ</th>
                           </tr>
                        </thead>
                        <tbody>
                           {configs.map(c => (
                              <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                 <td style={{ padding: '16px', fontWeight: 800 }}>{c.config_name}</td>
                                 <td style={{ fontWeight: 700 }}>{c.license_name}</td>
                                 <td>
                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{getPosName(c.pos_id)}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{getDeptName(c.dept_id)}</div>
                                 </td>
                                 <td>
                                    <div style={{ fontSize: '13px' }}>{c.valid_years} ปี</div>
                                    <div style={{ fontSize: '11px', color: '#ea580c' }}>เตือนล่วงหน้า {c.warning_days} วัน</div>
                                 </td>
                                 <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => handleOpenModal('config', c)} style={{ color: '#2563eb', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>แก้ไข</button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}

               {/* --- MODALS --- */}

               {/* Registry Add/Renew/Edit Modal */}
               {(activeModal === 'renew' || activeModal === 'add' || activeModal === 'edit') && (() => {
                  const check = formData.emp_id ? checkRequirement(formData.emp_id) : null;
                  const currentEmp = allEmployees.find(e => e.emp_id === formData.emp_id);
                  const filteredEmp = allEmployees.filter(e => (e.first_name_th || '').includes(searchTermEmp) || (e.emp_id || '').includes(searchTermEmp));

                  return (
                     <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                        <div style={{ background: '#f8fafc', width: '1100px', maxHeight: '95vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>
                           <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                              
                              {/* Left Sidebar */}
                              <div style={{ width: '340px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '40px 32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                                 <div>
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#0d9488', textTransform: 'uppercase', marginBottom: '16px' }}>บุคลากรผู้ประกอบวิชาชีพ</div>
                                    {activeModal === 'add' && !formData.emp_id ? (
                                       <div style={{ position: 'relative' }}>
                                          <input 
                                             placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..." 
                                             value={searchTermEmp} 
                                             onChange={e => setSearchTermEmp(e.target.value)} 
                                             style={{ width: '100%', padding: '14px 20px', borderRadius: '15px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none' }} 
                                          />
                                          {searchTermEmp && filteredEmp.length > 0 && (
                                             <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '5px', padding: '8px', border: '1px solid #f1f5f9' }}>
                                                {filteredEmp.slice(0, 5).map(e => (
                                                   <div key={e.emp_id} onClick={() => { setFormData({...formData, emp_id: e.emp_id}); setSearchTermEmp(`${e.first_name_th} (${e.emp_id})`); }} style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '10px' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                      <div style={{ fontWeight: 800, fontSize: '13px' }}>{e.first_name_th} {e.last_name_th}</div>
                                                      <div style={{ fontSize: '11px', color: '#64748b' }}>{getDeptName(e.dept_id)}</div>
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    ) : (
                                       <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                             <div style={{ fontWeight: 900, fontSize: '18px' }}>{currentEmp?.first_name_th} {currentEmp?.last_name_th}</div>
                                             <div style={{ fontSize: '11px', p: '2px 8px', background: '#0f172a', color: '#fff', borderRadius: '50px' }}>{currentEmp?.emp_id}</div>
                                          </div>
                                          <div style={{ fontSize: '12px', color: '#64748b', mb: '4px' }}>แผนก: {getDeptName(currentEmp?.dept_id)}</div>
                                          <div style={{ fontSize: '12px', color: '#64748b' }}>ตำแหน่ง: {getPosName(currentEmp?.pos_id)}</div>
                                       </div>
                                    )}
                                 </div>

                                 {check && (
                                    <div style={{ background: '#ecfdf5', padding: '24px', borderRadius: '24px', border: '1px solid #def7ec', color: '#065f46' }}>
                                       <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>เกณฑ์บังคับใช้ (Requirement)</div>
                                       <div style={{ fontWeight: 800, fontSize: '15px' }}>{check.license_name}</div>
                                       <div style={{ fontSize: '12px', marginTop: '4px' }}>ระยะเวลาบังคับ: {check.valid_years} ปี</div>
                                    </div>
                                 )}

                                 <div style={{ marginTop: 'auto', background: '#f0f9ff', padding: '24px', borderRadius: '24px', border: '1px solid #bae6fd' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#0369a1', marginBottom: '10px' }}>อ้างอิงเว็บไซต์ตรวจสอบ</div>
                                    {Object.entries(COUNCIL_LINKS).slice(0, 5).map(([name, url]) => (
                                       <a key={name} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: '12px', color: '#0369a1', marginBottom: '6px', textDecoration: 'none' }}>• {name}</a>
                                    ))}
                                 </div>
                              </div>

                              {/* Right Content Form */}
                              <div style={{ flex: 1, padding: '48px 60px', overflowY: 'auto', position: 'relative' }}>
                                 <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '32px', right: '32px', background: '#fff', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer' }}>×</button>
                                 <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 40px 0', letterSpacing: '-0.03em' }}>{activeModal === 'renew' ? 'ต่ออายุใบประกอบวิชาชีพ' : 'บันทึกข้อมูลใบประกอบ'}</h2>
                                 
                                 <form onSubmit={handleLicenseSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>ผู้ออกใบอนุญาต / สภาวิชาชีพ</label>
                                       <ModernSelect 
                                          value={formData.issuer} 
                                          onChange={val => { const l = findIssuerLink(val); setFormData({...formData, issuer: val, license_name: val !== 'อื่นๆ' ? val : formData.license_name}); }} 
                                          options={ISSUERS.map(i => ({ value: i, label: i }))} 
                                          placeholder="เลือกสภาวิชาชีพ..."
                                       />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>ชื่อใบประกอบวิชาชีพ (ระบุฉบับเต็ม)</label>
                                       <input required value={formData.license_name} onChange={e => setFormData({...formData, license_name: e.target.value})} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>เลขที่ใบอนุญาต</label>
                                       <input required value={formData.license_no} onChange={e => setFormData({...formData, license_no: e.target.value})} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', fontWeight: 900 }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>หน่วยกิตสะสม (ถ้ามี)</label>
                                       <input type="number" step="0.01" value={formData.points} onChange={e => setFormData({...formData, points: parseFloat(e.target.value)})} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>วันออกบัตร</label>
                                       <input type="date" value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>วันหมดอายุใหม่</label>
                                       <div style={{ display: 'flex', gap: '8px' }}>
                                          <input required type="date" value={formData.expire_date} onChange={e => setFormData({...formData, expire_date: e.target.value})} style={{ flex: 1, padding: '14px 24px', borderRadius: '40px', border: '2px solid #0f172a', fontWeight: 900 }} />
                                          <button type="button" onClick={() => setFormData({...formData, expire_date: addYears(formData.issue_date || new Date().toISOString(), 5)})} style={{ padding: '0 20px', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>+ 5 ปี</button>
                                       </div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '10px', color: '#475569' }}>อัปโหลดหลักฐาน (PDF/JPG/PNG)</label>
                                       <div onClick={() => document.getElementById('f1')?.click()} style={{ border: '2px dashed #e2e8f0', borderRadius: '24px', padding: '30px', textAlign: 'center', cursor: 'pointer', background: selectedFile ? '#f0fdf4' : '#fff' }}>
                                          <input id="f1" type="file" hidden onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                          {selectedFile ? <span style={{ fontWeight: 800, color: '#16a34a' }}>✅ {selectedFile.name} (พร้อมอัปโหลด)</span> : <span style={{ color: '#94a3b8' }}>คลิกเพื่อเลือกไฟล์ หรือลากมาวางที่นี่</span>}
                                       </div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', background: '#f5f3ff', padding: '24px', borderRadius: '24px' }}>
                                       <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={formData.psv_checked} onChange={e => setFormData({...formData, psv_checked: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                                          <span style={{ fontWeight: 800, color: '#5b21b6' }}>ฉันขอยืนยันว่าได้ตรวจสอบข้อมูลความถูกต้องกับสภาวิชาชีพเรียบร้อยแล้ว (PSV)</span>
                                       </label>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px' }}>
                                       <button type="button" onClick={() => setActiveModal('none')} style={{ padding: '14px 32px', borderRadius: '40px', background: '#fff', border: '1px solid #cbd5e1', fontWeight: 800, color: '#64748b' }}>ยกเลิก</button>
                                       <button type="submit" disabled={submitting} style={{ padding: '14px 48px', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>{submitting ? 'กำลังบันทึก...' : 'บันทึกและยืนยันข้อมูล'}</button>
                                    </div>
                                 </form>
                              </div>

                           </div>
                        </div>
                     </div>
                  );
               })()}

               {/* Config Modal */}
               {activeModal === 'config' && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <div style={{ background: '#fff', width: '600px', borderRadius: '32px', padding: '48px', position: 'relative' }}>
                        <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '32px' }}>ตั้งค่าเกณฑ์มาตรฐาน</h2>
                        <form onSubmit={handleConfigSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           <div>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>ชื่อเกณฑ์ (เช่น เกณฑ์ฝ่ายการพยาบาล)</label>
                              <input required value={configFormData.config_name} onChange={e => setConfigFormData({...configFormData, config_name: e.target.value})} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                           </div>
                           <div>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>วิชาชีพที่บังคับ</label>
                              <input required value={configFormData.license_name} onChange={e => setConfigFormData({...configFormData, license_name: e.target.value})} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                           </div>
                           
                           <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <label style={{ fontWeight: 800, color: '#475569', fontSize: '13px', marginBottom: '-4px' }}>ขอบเขตหน่วยงานที่บังคับใช้ (Hierarchical)</label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                 <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>ฝ่าย</label>
                                    <select 
                                       value={departments.find(d => d.dept_id === configFormData.dept_id)?.division || ''} 
                                       onChange={e => {
                                          const div = e.target.value;
                                          if (!div) setConfigFormData({ ...configFormData, dept_id: null });
                                          else {
                                             const firstDept = departments.find(d => d.division === div);
                                             setConfigFormData({ ...configFormData, dept_id: firstDept?.dept_id });
                                          }
                                       }}
                                       style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                    >
                                       <option value="">-- Global --</option>
                                       {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                 </div>
                                 <div style={{ opacity: departments.find(d => d.dept_id === configFormData.dept_id)?.division ? 1 : 0.5 }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>กลุ่มงาน</label>
                                    <select 
                                       value={departments.find(d => d.dept_id === configFormData.dept_id)?.dept_name || ''} 
                                       onChange={e => {
                                          const grp = e.target.value;
                                          const div = departments.find(d => d.dept_id === configFormData.dept_id)?.division;
                                          const firstDept = departments.find(d => d.division === div && d.dept_name === grp);
                                          setConfigFormData({ ...configFormData, dept_id: firstDept?.dept_id });
                                       }}
                                       style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                    >
                                       <option value="">-- ทั้งฝ่าย --</option>
                                       {getGroupsByDiv(departments.find(d => d.dept_id === configFormData.dept_id)?.division || '').map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                 </div>
                                 <div style={{ opacity: departments.find(d => d.dept_id === configFormData.dept_id)?.dept_name ? 1 : 0.5 }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>หน่วยงาน</label>
                                    <select 
                                       value={configFormData.dept_id || ''} 
                                       onChange={e => setConfigFormData({ ...configFormData, dept_id: e.target.value || null })} 
                                       style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                    >
                                       <option value="">-- ทั้งกลุ่ม --</option>
                                       {getSubsByGrp(
                                          departments.find(d => d.dept_id === configFormData.dept_id)?.division || '',
                                          departments.find(d => d.dept_id === configFormData.dept_id)?.dept_name || ''
                                       ).map(s => <option key={s.dept_id} value={s.dept_id}>{s.sub_dept || '(หลัก)'}</option>)}
                                    </select>
                                 </div>
                              </div>
                           </div>

                           <div>
                              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#64748b', marginBottom: '8px' }}>ตำแหน่ง (ไม่ต้องระบุได้)</label>
                              <select value={configFormData.pos_id || ''} onChange={e => setConfigFormData({...configFormData, pos_id: e.target.value || null})} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                 <option value="">-- พนักงานทุกตำแหน่ง --</option>
                                 {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                              </select>
                           </div>

                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>อายุใบอนุญาต (ปี)</label>
                                 <input type="number" required value={configFormData.valid_years} onChange={e => setConfigFormData({...configFormData, valid_years: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                              </div>
                              <div>
                                 <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>แจ้งเตือนล่วงหน้า (วัน)</label>
                                 <input type="number" required value={configFormData.warning_days} onChange={e => setConfigFormData({...configFormData, warning_days: parseInt(e.target.value)})} style={{ width: '100%', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                              </div>
                           </div>
                           <button type="submit" style={{ marginTop: '20px', background: '#0f172a', color: '#fff', border: 'none', padding: '16px', borderRadius: '15px', fontWeight: 800, cursor: 'pointer' }}>บันทึกเกณฑ์มาตรฐาน</button>
                        </form>
                     </div>
                  </div>
               )}

               {/* Registry History Modal */}
               {historyOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
                     <div style={{ background: '#fff', width: '900px', maxHeight: '85vh', borderRadius: '32px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '32px 48px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div>
                              <div style={{ color: '#0d9488', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>Audit Detail</div>
                              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>ประวัติและผลการตรวจสอบย้อนหลัง</h3>
                           </div>
                           <button onClick={() => setHistoryOpen(false)} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '12px', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '40px', overflowY: 'auto' }}>
                           <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                              <thead>
                                 <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: 800 }}>
                                    <th style={{ padding: '0 20px' }}>เลขใบอนุญาต</th>
                                    <th>วิชาชีพ</th>
                                    <th>วันออก/หมดอายุ</th>
                                    <th>หน่วยกิต</th>
                                    <th>สถานะ</th>
                                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>หลักฐาน</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {historyData.map((h, i) => (
                                    <tr key={i} style={{ background: '#f8fafc', borderRadius: '15px' }}>
                                       <td style={{ padding: '20px', borderTopLeftRadius: '15px', borderBottomLeftRadius: '15px', fontWeight: 900, fontFamily: 'monospace' }}>{h.license_no}</td>
                                       <td style={{ fontWeight: 800 }}>{h.license_name}</td>
                                       <td>{h.issue_date || '-'} - {h.expire_date || '-'}</td>
                                       <td style={{ fontWeight: 900, color: '#2563eb' }}>{h.points || '0.00'}</td>
                                       <td>
                                          <span style={{ padding: '6px 12px', borderRadius: '50px', fontSize: '10px', fontWeight: 900, background: h.verified_status === 'Verified' ? '#dcfce7' : '#f1f5f9', color: h.verified_status === 'Verified' ? '#16a34a' : '#64748b' }}>
                                             {h.verified_status === 'Verified' ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                                          </span>
                                       </td>
                                       <td style={{ textAlign: 'right', paddingRight: '20px', borderTopRightRadius: '15px', borderBottomRightRadius: '15px' }}>
                                          {h.file_path && <a href={h.file_path} target="_blank" rel="noreferrer" style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', textDecoration: 'underline' }}>ดูไฟล์</a>}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                           {historyData.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบประวัติการขึ้นทะเบียน</div>}
                        </div>
                     </div>
                  </div>
               )}

               {/* Registry Detail View Modal (Premium) */}
               {activeModal === 'view' && selectedLicense && (() => {
                  const emp = allEmployees.find(e => e.emp_id === selectedLicense.emp_id);
                  const stat = getStatus(selectedLicense);
                  return (
                     <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                        <div style={{ background: '#fff', width: '900px', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.15)', display: 'flex' }}>
                           <div style={{ width: '320px', background: '#f8fafc', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', borderRight: '1px solid #e2e8f0' }}>
                              <div style={{ width: '160px', height: '160px', borderRadius: '40px', background: '#fff', border: '5px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                 {emp?.photo || emp?.image ? (
                                    <img src={`/uploads/${emp.photo || emp.image}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display='none'; e.currentTarget.parentElement!.innerHTML = '👤'; }} />
                                 ) : <span style={{ fontSize: '64px' }}>👤</span>}
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                 <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 900 }}>{emp?.first_name_th} {emp?.last_name_th}</h3>
                                 <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>{getPosName(emp?.pos_id)}</div>
                              </div>
                              <div style={{ background: '#0f172a', color: '#fff', padding: '8px 24px', borderRadius: '50px', fontSize: '13px', fontWeight: 800 }}>ID: {selectedLicense.emp_id}</div>
                           </div>
                           <div style={{ flex: 1, padding: '48px 54px', position: 'relative' }}>
                              <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '32px', right: '32px', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer' }}>×</button>
                              <div style={{ marginBottom: '40px' }}>
                                 <div style={{ fontSize: '11px', fontWeight: 900, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Professional Registry</div>
                                 <h2 style={{ fontSize: '28px', fontWeight: 900, margin: 0 }}>รายละเอียดใบประกอบวิชาชีพ</h2>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                 <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>วิชาชีพ / ผู้ออกใบอนุญาต</div>
                                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{selectedLicense.type || selectedLicense.license_name}</div>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>{selectedLicense.issuer || '-'}</div>
                                 </div>
                                 <div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>เลขที่ใบอนุญาต</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'monospace' }}>{selectedLicense.license_no || '-'}</div>
                                 </div>
                                 <div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>คะแนนสะสมหน่วยกิต</div>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>{selectedLicense.points || '0.00'}</div>
                                 </div>
                                 <div style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                       <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 800 }}>ระยะเวลาถือครองปัจจุบัน</div>
                                       <div style={{ fontSize: '16px', fontWeight: 800 }}>{selectedLicense.issued || selectedLicense.issue_date || '-'} ถึง {selectedLicense.expires || selectedLicense.expire_date || '-'}</div>
                                    </div>
                                    <span style={{ padding: '8px 20px', borderRadius: '50px', background: stat.bg, color: stat.color, fontWeight: 900, fontSize: '12px' }}>{stat.label}</span>
                                 </div>
                              </div>
                              <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                                 {selectedLicense.file_path && (
                                    <a href={selectedLicense.file_path} target="_blank" rel="noreferrer" style={{ flex: 1, background: '#0f172a', color: '#fff', textAlign: 'center', padding: '16px', borderRadius: '16px', fontWeight: 800, textDecoration: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>ดูเอกสารใบอนุญาต</a>
                                 )}
                                 <button onClick={() => setActiveModal('none')} style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '16px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }}>ปิดหน้าต่าง</button>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })()}

            </div>
         </div>
      </AppLayout>
   );
}
