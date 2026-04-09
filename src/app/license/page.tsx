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

// --- Constants ---
const ISSUERS = [
   'สภาการพยาบาล',
   'แพทยสภา',
   'สภาเทคนิคการแพทย์',
   'สภาเภสัชกรรม',
   'สภากายภาพบำบัด',
   'ทันตแพทยสภา',
   'สภาการแพทย์แผนไทย',
   'คณะกรรมการวิชาชีพสาขารังสีเทคนิค',
   'คุรุสภา',
   'สภาวิศวกร',
   'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)',
   'กรมสนับสนุนบริการสุขภาพ'
];

const COUNCIL_LINKS: Record<string, string> = {
   'สภาการพยาบาล': 'https://services.tnmc.or.th/',
   'แพทยสภา': 'https://checkmd.tmc.or.th/',
   'สภาเทคนิคการแพทย์': 'https://www.mtcouncil.org/',
   'สภาเภสัชกรรม': 'https://www.pharmacycouncil.org/',
   'สภากายภาพบำบัด': 'https://www.pt.or.th/',
   'ทันตแพทยสภา': 'https://www.dentalcouncil.or.th/check_list/',
   'คุรุสภา': 'https://www.ksp.or.th/service/license_search.php',
   'สภาวิศวกร': 'https://service.coe.or.th/verify_license',
   'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (สพฉ.)': 'https://www.niems.go.th/',
   'กรมสนับสนุนบริการสุขภาพ': 'https://hss-db.hss.moph.go.th/',
   'คณะกรรมการวิชาชีพสาขารังสีเทคนิค': 'https://mrd.hss.moph.go.th/mrd1_hss/?cat=66'
};

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
   verified_at?: string;
   verified_by?: string;
   issuer?: string;
   warning_days_override?: number;
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
   is_mandatory: number;
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

// Helper to find issuer link based on license string
function findIssuerLink(licenseName: string) {
   const name = (licenseName || '').toLowerCase();
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
      if (name.includes(key.replace('สภา', '')) || name.includes(key)) return url;
   }
   return null;
}

// --- Custom UI Components ---
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

// --- Styles ---
const cardStyle = {
   background: '#fff',
   borderRadius: '24px',
   padding: '32px',
   boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
   border: '1px solid #f1f5f9'
};

const sectionHeaderStyle = {
   fontSize: '14px',
   fontWeight: 800,
   color: '#64748b',
   paddingBottom: '12px',
   borderBottom: '2px solid #f1f5f9',
   marginBottom: '24px',
   display: 'flex',
   alignItems: 'center',
   gap: '8px'
};

export default function LicensePage() {
   useEffect(() => {
      const style = document.createElement('style');
      style.textContent = `
         @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
         }
         @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
         }
         .glass-panel {
            background: rgba(255, 255, 255, 0.7) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
         }
         .premium-gradient {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%) !important;
            background-size: 200% auto !important;
            transition: 0.3s !important;
         }
         .premium-gradient:hover {
            background-position: right center !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3) !important;
         }
         .fade-in-up {
            animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
         }
         .hover-scale {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
         }
         .hover-scale:hover {
            transform: scale(1.02) !important;
         }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
   }, []);

   const { user } = useAuth();
   const isSuperAdmin = user?.role?.toLowerCase() === 'admin';
   const isAdmin = user?.role?.toLowerCase() === 'hr';
   const isDeptHead = user?.role === 'หัวหน้า';
   const isRegularUser = !isAdmin && !isDeptHead && !isSuperAdmin;

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
      license_name: '', license_type: '', institution: '', issuer: '', issue_date: '',
      remarks: '', warning_days_override: 30, verified_status: 'Pending',
      psv_checked: false
   });

   const [configFormData, setConfigFormData] = useState<Partial<LicenseConfig>>({
      config_name: '', pos_id: null, dept_id: null, license_name: '', valid_years: 5, warning_days: 90
   });

   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [submitting, setSubmitting] = useState(false);
   const [historyData, setHistoryData] = useState<License[]>([]);
   const [historyOpen, setHistoryOpen] = useState(false);
   const [isProfileExpanded, setIsProfileExpanded] = useState(false);

   const getDeptName = (id: string) => {
      const dept = departments.find(d => String(d.dept_id) === String(id));
      if (!dept) return id || '-';
      return `${dept.division} > ${dept.dept_name}${dept.sub_dept ? ` > ${dept.sub_dept}` : ''}`;
   };
   const getPosName = (id: string) => positions.find(p => String(p.pos_id) === String(id))?.pos_name || id || '-';

   // Hierarchical Helpers
   const divisions = Array.from(new Set(departments.map(d => d.division))).filter(Boolean) as string[];
   const getGroupsByDiv = (div: string) => Array.from(new Set(departments.filter(d => d.division === div).map(d => d.dept_name)));
   const getSubsByGrp = (div: string, grp: string) => departments.filter(d => d.division === div && d.dept_name === grp);

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
      } catch (err) { console.error('Fetch Initial Error:', err); }
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
         const data = await res.json();
         setLicenses(data);
      } catch (err) { console.error('Fetch Licenses Error:', err); } finally { setLoading(false); }
   };

   const fetchMonitorData = async () => {
      try {
         setLoading(true);
         const v = Date.now();
         const res = await fetch(`/api/licenses/monitor?v=${v}`, { cache: 'no-store' });
         const data = await res.json();
         setMonitorData(data);
      } catch (err) { console.error('Fetch Monitor Error:', err); } finally { setLoading(false); }
   };

   const fetchConfigs = async () => {
      try {
         setLoading(true);
         const v = Date.now();
         const res = await fetch(`/api/licenses/configs?v=${v}`, { cache: 'no-store' });
         const data = await res.json();
         setConfigs(data);
      } catch (err) { console.error('Fetch Configs Error:', err); } finally { setLoading(false); }
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
         await fetchConfigs();
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

         const res = await fetch('/api/licenses/renew', {
            method: 'POST',
            body: fd
         });
         if (res.ok) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', showConfirmButton: false, timer: 1000 });
            await fetchLicenses();
            if (activeTab === 'monitor') await fetchMonitorData();
            setActiveModal('none');
            setSelectedFile(null);
         } else {
            const err = await res.json();
            throw new Error(err.error || 'Failed to save');
         }
      } catch (err: any) {
         console.error('Submit Error:', err);
         Swal.fire('Error', err.message, 'error');
      } finally { setSubmitting(false); }
   };

   const fetchHistoryData = async (empId: string) => {
      try {
         const v = Date.now();
         const res = await fetch(`/api/licenses/renew?emp_id=${empId}&history=true&v=${v}`, { cache: 'no-store' });
         if (res.ok) {
            const data = await res.json();
            setHistoryData(data);
            setHistoryOpen(true);
         }
      } catch (err) { console.error('Fetch History Error:', err); }
   };

   const handleOpenModal = (type: any, data?: any) => {
      if (type === 'config') {
         setSelectedConfig(data || null);
         setConfigFormData(data || { config_name: '', pos_id: null, dept_id: null, license_name: '', valid_years: 5, warning_days: 90 });
      } else {
         setSelectedLicense(data || null);
         setSearchTermEmp('');
         setSelectedFile(null);
         if (data) {
            setFormData({
               license_no: data.license_no || '',
               expire_date: data.expire_date || data.expires || '',
               points: data.points || 0,
               emp_id: data.emp_id,
               license_name: data.license_name || '',
               license_type: data.license_type || '',
               institution: data.institution || '',
               issuer: data.issuer || '',
               issue_date: data.issue_date || '',
               remarks: data.remarks || '',
               warning_days_override: data.warning_days_override || 30,
               verified_status: data.verified_status || 'Pending',
               psv_checked: data.verified_status === 'Verified'
            });
         } else {
            setFormData({ license_no: '', expire_date: '', points: 0, emp_id: '', license_name: '', license_type: '', institution: '', issuer: '', issue_date: '', remarks: '', warning_days_override: 30, verified_status: 'Pending', psv_checked: false });
         }
      }
      setActiveModal(type);
   };

   const checkRequirement = (empId: string) => {
      const emp = allEmployees.find(e => e.emp_id === empId);
      if (!emp) return null;

      const empDept = departments.find(d => d.dept_id === emp.dept_id);
      if (!empDept) return null;

      // Hierarchical Matching Priority:
      // 1. Exact Unit Match (dept_id)
      const matchExact = configs.find(c => c.dept_id === emp.dept_id && (!c.pos_id || c.pos_id === emp.pos_id));
      if (matchExact) return matchExact;

      // 2. Group Level Match
      const matchGroup = configs.find(c => {
         const cDept = departments.find(d => d.dept_id === c.dept_id);
         return cDept && cDept.division === empDept.division && cDept.dept_name === empDept.dept_name && !cDept.sub_dept && (!c.pos_id || c.pos_id === emp.pos_id);
      });
      if (matchGroup) return matchGroup;

      // 3. Division Level Match
      const matchDiv = configs.find(c => {
         const cDept = departments.find(d => d.dept_id === c.dept_id);
         return cDept && cDept.division === empDept.division && !cDept.dept_name && (!c.pos_id || c.pos_id === emp.pos_id);
      });
      if (matchDiv) return matchDiv;

      // 4. Position only Match (Global)
      const matchPos = configs.find(c => c.pos_id === emp.pos_id && !c.dept_id);
      if (matchPos) return matchPos;

      return null;
   };

   return (
      <AppLayout>
         <div style={{ padding: '32px', minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: '"Anuphan", "Prompt", sans-serif' }}>
            <div style={{ maxWidth: '1440px', margin: '0 auto' }}>

               {/* Main Header */}
               <div style={{ marginBottom: '40px' }} className="fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                     <div>
                        <h1 style={{ fontSize: '42px', fontWeight: 950, color: '#0f172a', margin: 0, letterSpacing: '-0.04em' }}>
                           ทะเบียนใบประกอบวิชาชีพ<span style={{ color: '#2563eb' }}>.</span>
                        </h1>
                        <p style={{ color: '#64748b', fontSize: '18px', marginTop: '12px', fontWeight: 500 }}>การจัดการทะเบียน การต่ออายุ และการตรวจสอบความถูกต้องสากล</p>
                     </div>
                     {(isAdmin || isSuperAdmin) && (
                        <button
                           onClick={() => handleOpenModal('add')}
                           className="premium-gradient"
                           style={{ color: '#fff', border: 'none', padding: '16px 32px', borderRadius: '18px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.1)' }}
                        >
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                           บันทึกข้อมูลใบประกอบ
                        </button>
                     )}
                  </div>
               </div>

               {(isAdmin || isSuperAdmin || isDeptHead) && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
                     {[
                        { id: 'list', label: 'ทะเบียนบุคลากร' },
                        { id: 'monitor', label: 'สรุปผลภาพรวม' },
                        { id: 'settings', label: 'การตั้งค่าเกณฑ์' }
                     ].filter(t => (isAdmin || isSuperAdmin) || (isDeptHead && t.id === 'monitor') || t.id === 'list').map(tab => (
                        <button
                           key={tab.id}
                           onClick={() => setActiveTab(tab.id as any)}
                           style={{
                              padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer',
                              background: activeTab === tab.id ? '#fff' : 'transparent',
                              color: activeTab === tab.id ? '#0f172a' : '#64748b',
                              boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                              transition: 'all 0.2s'
                           }}
                        >
                           {tab.label}
                        </button>
                     ))}
                  </div>
               )}

               {activeTab === 'list' && (
                  <div style={cardStyle} className="fade-in-up">
                     <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                           <input placeholder="ค้นหาชื่อพนักงาน หรือ เลขที่ใบประกอบ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '16px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontSize: '15px' }} />
                        </div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0 24px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 700, background: '#fff', cursor: 'pointer', outline: 'none', minWidth: '240px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                           <option value="all">สถานะทั้งหมด (All Status)</option>
                           <option value="expiring">ใกล้หมดอายุ (Expiring)</option>
                           <option value="expired">หมดอายุแล้ว (Expired)</option>
                           <option value="Pending">รอการตรวจสอบ (Pending)</option>
                           <option value="normal">ตรวจสอบแล้ว (Active / Normal)</option>
                        </select>
                     </div>

                     <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
                        <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
                           <thead>
                              <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
                                 <th style={{ padding: '20px 16px', width: '120px', whiteSpace: 'nowrap' }}>รหัสพนักงาน</th>
                                 <th style={{ padding: "20px 16px", width: "220px", whiteSpace: "nowrap" }}>ชื่อ-นามสกุล</th>
                                 <th style={{ padding: "20px 16px", width: "250px", whiteSpace: "nowrap" }}>วิชาชีพ</th>
                                 <th style={{ padding: "20px 16px", width: "150px", whiteSpace: "nowrap" }}>เลขใบอนุญาต</th>
                                 <th style={{ padding: "20px 16px", width: "140px", whiteSpace: "nowrap" }}>วันหมดอายุ</th>
                                 <th style={{ padding: "20px 16px", width: "160px", whiteSpace: "nowrap" }}>สถานะ</th>
                                 {(isAdmin || isSuperAdmin || isDeptHead) && (
                                    <th style={{ textAlign: 'right', padding: '20px 16px', width: '160px', whiteSpace: 'nowrap' }}>ดำเนินการ</th>
                                 )}
                              </tr>
                           </thead>
                           <tbody>
                              {licenses.map(l => {
                                 const stat = getStatus(l);
                                 return (
                                    <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.2s' }}>
                                       <td style={{ padding: '20px 16px', width: '120px', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>{l.emp_id}</td>
                                       <td
                                          onClick={() => {
                                             setIsProfileExpanded(false);
                                             handleOpenModal('view', l);
                                          }}
                                          style={{ padding: '20px 16px', width: '220px', fontWeight: 800, color: '#0f172a', cursor: 'pointer', transition: 'color 0.2s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                          onMouseOver={e => e.currentTarget.style.color = '#2563eb'}
                                          onMouseOut={e => e.currentTarget.style.color = '#0f172a'}
                                       >
                                          {l.name}
                                       </td>
                                       <td style={{ padding: '20px 16px', width: '250px', fontWeight: 700 }}>{l.type || l.license_name}</td>
                                       <td style={{ padding: '20px 16px', width: '150px', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.license_no || '-'}</td>
                                       <td style={{ padding: '20px 16px', width: '140px', fontWeight: 700, whiteSpace: 'nowrap' }}>{l.expires || '-'}</td>
                                       <td style={{ padding: '20px 16px', width: '140px' }}>
                                          <span style={{ padding: '8px 20px', borderRadius: '50px', fontSize: '11px', fontWeight: 900, background: stat.bg, color: stat.color, whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>{stat.label}</span>
                                       </td>
                                       {(isAdmin || isSuperAdmin || isDeptHead) && (
                                          <td style={{ textAlign: 'right', padding: '20px 16px', width: '160px' }}>
                                             <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button
                                                   onClick={() => {
                                                      setIsProfileExpanded(false);
                                                      fetchHistoryData(l.emp_id);
                                                   }}
                                                   title="ดูประวัติการต่ออายุ"
                                                   className="hover-scale"
                                                   style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                                                   onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                                                   onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                                                >
                                                   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                                </button>
                                                <button 
                                                   onClick={() => {
                                                      setIsProfileExpanded(false);
                                                      handleOpenModal('renew', l);
                                                   }} 
                                                   className="premium-gradient"
                                                   style={{ color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '14px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)' }}
                                                >
                                                   จัดการ
                                                </button>
                                             </div>
                                          </td>
                                       )}
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {activeTab === 'monitor' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="fade-in-up">
                     {loading && !monitorData ? (
                        <div style={cardStyle}>กำลังโหลดข้อมูลสรุปผล...</div>
                     ) : monitorData ? (
                        <>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                              {[
                                 { label: 'พนักงานทั้งหมด', val: monitorData.totalEmployees, color: '#0f172a' },
                                 { label: 'ถูกต้องครบถ้วน', val: monitorData.compliant, color: '#16a34a' },
                                 { label: 'ใกล้หมดอายุ', val: monitorData.expiring, color: '#ca8a04' },
                                 { label: 'รอตรวจสอบ / หมดอายุ', val: monitorData.missing, color: '#dc2626' }
                              ].map((c, i) => (
                                 <div key={i} style={cardStyle} className="hover-scale">
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{c.label}</p>
                                    <h2 style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: 900, color: c.color }}>{c.val}</h2>
                                 </div>
                              ))}
                           </div>

                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                              <div style={cardStyle}>
                                 <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สัดส่วนพนักงานตามสถานะ</h3>
                                 <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                       <PieChart>
                                          <Pie
                                             data={[
                                                { name: 'ครบถ้วน', value: monitorData.compliant, color: '#16a34a' },
                                                { name: 'ใกล้หมดอายุ', value: monitorData.expiring, color: '#ca8a04' },
                                                { name: 'รอตรวจสอบ/หมดอายุ', value: monitorData.missing, color: '#dc2626' }
                                             ]}
                                             innerRadius={60}
                                             outerRadius={80}
                                             paddingAngle={5}
                                             dataKey="value"
                                          >
                                             {[
                                                { color: '#16a34a' }, { color: '#ca8a04' }, { color: '#dc2626' }
                                             ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                          </Pie>
                                          <Tooltip />
                                          <Legend />
                                       </PieChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>

                              <div style={cardStyle}>
                                 <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สถานะแยกตามภาคส่วน (5 อันดับแรก)</h3>
                                 <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={Object.entries(monitorData.departmentStats).slice(0, 5).map(([dept, stats]) => ({
                                          name: dept,
                                          ครบถ้วน: stats.compliant,
                                          ใกล้หมดอายุ: stats.expiring,
                                          หมดอายุ: stats.missing
                                       }))}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                          <XAxis dataKey="name" fontSize={10} interval={0} />
                                          <YAxis fontSize={10} />
                                          <Tooltip />
                                          <Legend />
                                          <Bar dataKey="ครบถ้วน" stackId="a" fill="#16a34a" />
                                          <Bar dataKey="ใกล้หมดอายุ" stackId="a" fill="#ca8a04" />
                                          <Bar dataKey="หมดอายุ" stackId="a" fill="#dc2626" />
                                       </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>
                           </div>
                        </>
                     ) : (
                        <div style={cardStyle}>ไม่พบข้อมูลสำหรับการวิเคราะห์</div>
                     )}
                  </div>
               )}

               {activeTab === 'settings' && (
                  <div style={cardStyle} className="fade-in-up">
                     <div style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <div style={{ background: '#f0f9ff', padding: '24px', borderRadius: '24px', border: '1px solid #bae6fd' }}>
                           <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                              มาตรฐานใบอนุญาต (อายุ 5 ปี)
                           </h4>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px 20px', fontSize: '13px', color: '#0c4a6e' }}>
                              <div style={{ fontWeight: 800 }}>พยาบาลวิชาชีพ:</div> <div><a href={COUNCIL_LINKS['สภาการพยาบาล']} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>สภาการพยาบาล</a></div>
                              <div style={{ fontWeight: 800 }}>แพทย์ (หมอ):</div> <div><a href={COUNCIL_LINKS['แพทยสภา']} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>แพทยสภา</a></div>
                              <div style={{ fontWeight: 800 }}>เภสัชกร:</div> <div><a href={COUNCIL_LINKS['สภาเภสัชกรรม']} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>สภาเภสัชกรรม</a></div>
                              <div style={{ fontWeight: 800 }}>นักเทคนิคการแพทย์:</div> <div><a href={COUNCIL_LINKS['สภาเทคนิคการแพทย์']} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>สภาเทคนิคการแพทย์</a></div>
                              <div style={{ fontWeight: 800 }}>นักกายภาพบำบัด:</div> <div><a href={COUNCIL_LINKS['สภากายภาพบำบัด']} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>สภากายภาพบำบัด</a></div>
                              <div style={{ fontWeight: 800 }}>นักรังสีการแพทย์:</div> <div><a href={COUNCIL_LINKS['คณะกรรมการวิชาชีพสาขารังสีเทคนิค']} target="_blank" rel="noreferrer" style={{ color: '#0369a1', textDecoration: 'underline' }}>คณะกรรมการวิชาชีพสาขารังสีเทคนิค</a></div>
                           </div>
                        </div>
                        <div style={{ background: '#f5f3ff', padding: '24px', borderRadius: '24px', border: '1px solid #ddd6fe' }}>
                           <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: '#5b21b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                              การตรวจสอบและคะแนน (CNEU/CME)
                           </h4>
                           <p style={{ margin: 0, fontSize: '13px', color: '#4c1d95', lineHeight: '1.6', fontWeight: 500 }}>
                              โปรดตรวจสอบคะแนนสะสมหน่วยกิตวิชาชีพให้ครบตามเกณฑ์ของแต่ละสภาฯ ก่อนดำเนินการต่ออายุ <br/><br/>
                              ท่านสามารถคลิกที่ <strong>"ชื่อวิชาชีพ"</strong> ในตารางด้านล่าง หรือกดปุ่ม <strong>"ตรวจสอบสภาฯ"</strong> ในหน้าบันทึกข้อมูล เพื่อลิงก์ไปยังเว็บไซต์ตรวจสอบสถานะใบอนุญาตของสภาวิชาชีพโดยตรง
                           </p>
                        </div>
                     </div>

                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>เกณฑ์มาตรฐานตามสายวิชาชีพ</h3>
                        <button onClick={() => handleOpenModal('config')} className="premium-gradient" style={{ color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>+ เพิ่มเกณฑ์</button>
                     </div>
                     <div style={{ overflowX: 'auto', paddingBottom: '12px' }}>
                        <table style={{ width: '100%', minWidth: '1200px', borderCollapse: 'collapse' }}>
                           <thead>
                              <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
                                 <th style={{ padding: '16px' }}>ชื่อเกณฑ์</th>
                                  <th style={{ padding: "20px 16px", width: "250px", whiteSpace: "nowrap" }}>วิชาชีพ</th>
                                 <th>บังคับแผนก/ตำแหน่ง</th>
                                 <th>อายุบัตร (ปี)</th>
                                 <th>เตือน (วัน)</th>
                                 <th style={{ textAlign: 'right' }}>ดำเนินการ</th>
                              </tr>
                           </thead>
                           <tbody>
                              {configs.map(c => {
                                 const link = findIssuerLink(c.license_name);
                                 return (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                       <td style={{ padding: '18px 16px', fontWeight: 800 }}>{c.config_name}</td>
                                       <td style={{ fontWeight: 700 }}>
                                          {link ? (
                                             <a href={link} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{c.license_name}</a>
                                          ) : c.license_name}
                                       </td>
                                       <td style={{ fontSize: '13px' }}>
                                          {(!c.dept_id && !c.pos_id) ? (
                                             <div style={{ fontWeight: 800, color: '#0f172a' }}>บุคลากรทุกคน (ทุกภาคส่วน)</div>
                                          ) : (
                                             <>
                                                <div style={{ fontWeight: 800, color: '#0f172a' }}>
                                                   {positions.find(p => p.pos_id === c.pos_id)?.pos_name || 'พนักงานทุกตำแหน่ง'}
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                   <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                                   {departments.find(d => d.dept_id === c.dept_id)?.dept_name || 'ทุกแผนกในโรงพยาบาล'}
                                                </div>
                                             </>
                                          )}
                                       </td>
                                       <td style={{ fontWeight: 700 }}>{c.valid_years}</td>
                                       <td style={{ color: '#ea580c', fontWeight: 700 }}>{c.warning_days}</td>
                                       <td style={{ textAlign: 'right' }}>
                                          <button onClick={() => handleOpenModal('config', c)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer' }}>แก้ไข</button>
                                       </td>
                                    </tr>
                                 );
                              })}
                              {configs.length === 0 && (
                                 <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ยังไม่มีการตั้งค่าเกณฑ์มาตรฐาน</td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {(activeModal === 'renew' || activeModal === 'add' || activeModal === 'edit') && (() => {
                  const currentEmp = allEmployees.find(e => e.emp_id === (activeModal === 'add' ? formData.emp_id : selectedLicense?.emp_id));
                  const checkLink = COUNCIL_LINKS[formData.issuer] || '';
                  const filteredEmp = allEmployees.filter(e => e.first_name_th?.includes(searchTermEmp) || e.emp_id?.includes(searchTermEmp));

                  return (
                     <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                        <div style={{ background: '#f8fafc', width: '1100px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid #fff' }} className="glass-panel">

                           <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                              {/* Sidebar (Left) */}
                              <div style={{ width: '340px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '48px 32px', display: 'flex', flexDirection: 'column', gap: '28px', overflowY: 'auto' }}>
                                 <div style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0d9488', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>รายละเอียดผู้ประกอบ</div>
                                    <div style={{ width: '120px', height: '120px', borderRadius: '32px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '4px solid #fff', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                       {currentEmp?.image || currentEmp?.photo ? (
                                          <img
                                             src={`/uploads/${currentEmp.image || currentEmp.photo}`}
                                             alt="profile"
                                             style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                             onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }}
                                          />
                                       ) : (
                                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                       )}
                                    </div>
                                    {activeModal === 'add' && !formData.emp_id ? (
                                       <div style={{ position: 'relative' }}>
                                          <input
                                             placeholder="พิมพ์ชื่อหรือรหัสพนักงานเพื่อค้นหา..."
                                             value={searchTermEmp}
                                             onChange={e => setSearchTermEmp(e.target.value)}
                                             style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', fontWeight: 700, outline: 'none', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                                          />
                                          {searchTermEmp && !formData.emp_id && filteredEmp.length > 0 && (
                                             <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '8px', overflow: 'hidden', border: '1px solid #f1f5f9', padding: '8px' }}>
                                                {filteredEmp.map(e => (
                                                   <div key={e.emp_id} onClick={() => {
                                                      const req = checkRequirement(e.emp_id);
                                                      setFormData({ ...formData, emp_id: e.emp_id, license_name: req?.license_name || '' });
                                                      setSearchTermEmp(`${e.first_name_th} ${e.last_name_th} (${e.emp_id})`);
                                                   }} style={{ padding: '12px 20px', cursor: 'pointer', borderRadius: '16px', fontSize: '13px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                      <div style={{ fontWeight: 800 }}>{e.first_name_th} {e.last_name_th}</div>
                                                      <div style={{ fontSize: '11px', color: '#64748b' }}>{getDeptName(e.dept_id)} • {e.emp_id}</div>
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    ) : (
                                       <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                             <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '18px' }}>{currentEmp?.first_name_th} {currentEmp?.last_name_th}</div>
                                             <div style={{ fontSize: '12px', fontWeight: 800, background: '#0f172a', color: '#fff', padding: '4px 12px', borderRadius: '50px' }}>{currentEmp?.emp_id}</div>
                                          </div>
                                          
                                          <button 
                                             onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                                             style={{ width: '100%', background: '#fff', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '15px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#64748b' }}
                                          >
                                             {isProfileExpanded ? 'ซ่อนข้อมูลส่วนตัว' : 'ดูข้อมูลเพิ่มเติม'}
                                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transition: 'transform 0.3s', transform: isProfileExpanded ? 'rotate(180deg)' : 'none' }}><path d="m6 9 6 6 6-6"/></svg>
                                          </button>

                                          {isProfileExpanded && (
                                             <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                                                {[
                                                   { label: 'แผนก/สังกัด', val: getDeptName(currentEmp?.dept_id) },
                                                   { label: 'ตำแหน่ง', val: getPosName(currentEmp?.pos_id) },
                                                   { label: 'เบอร์โทรศัพท์', val: currentEmp?.phone || '-' },
                                                   { label: 'อีเมล', val: currentEmp?.email || '-' },
                                                   { label: 'คะแนน CNEU', val: currentEmp?.cneu_cme_points || '0.00' }
                                                ].map((item, idx) => (
                                                   <div key={idx}>
                                                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>{item.label}</div>
                                                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>{item.val}</div>
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    )}
                                 </div>

                                 {activeModal !== 'add' && selectedLicense && (
                                    <div style={{ background: '#fffbeb', padding: '24px', borderRadius: '24px', border: '1px solid #fde68a' }}>
                                       <div style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span>ข้อมูลปัจจุบันในระบบ</span>
                                       </div>
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                          <div>
                                             <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>สภาวิชาชีพเดิม</div>
                                             <div style={{ fontSize: '14px', fontWeight: 700 }}>{selectedLicense.issuer || selectedLicense.institution || '-'}</div>
                                          </div>
                                          <div>
                                             <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>เลขที่ใบอนุญาต</div>
                                             <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace' }}>{selectedLicense.license_no}</div>
                                          </div>
                                          <div>
                                             <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>วันหมดอายุ</div>
                                             <div style={{ fontSize: '15px', fontWeight: 800 }}>{selectedLicense.expires || '-'}</div>
                                          </div>
                                       </div>
                                    </div>
                                 )}

                                 <div style={{ background: '#f0f9ff', padding: '24px', borderRadius: '24px', border: '1px solid #bae6fd', marginTop: 'auto' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#0369a1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                       ตารางอ้างอิงมาตรฐาน (5 ปี)
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#0c4a6e' }}>
                                       <div style={{ fontWeight: 800 }}>พยาบาล:</div> <div>สภาการพยาบาล</div>
                                       <div style={{ fontWeight: 800 }}>แพทย์:</div> <div>แพทยสภา</div>
                                       <div style={{ fontWeight: 800 }}>เภสัช:</div> <div>สภาเภสัชกรรม</div>
                                       <div style={{ fontWeight: 800 }}>เทคนิคการแพทย์:</div> <div>สภาเทคนิคฯ</div>
                                       <div style={{ fontWeight: 800 }}>กายภาพ:</div> <div>สภากายภาพฯ</div>
                                       <div style={{ fontWeight: 800 }}>รังสี:</div> <div>คณะกรรมการวิชาชีพฯ</div>
                                    </div>
                                 </div>
                              </div>

                              {/* Main Content (Right) */}
                              <div style={{ flex: 1, padding: '48px 64px', overflowY: 'auto', background: '#f8fafc', position: 'relative' }}>
                                 <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '32px', right: '32px', background: '#fff', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>×</button>

                                 <div style={{ marginBottom: '40px' }}>
                                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>บันทึกข้อมูลใบอนุญาตใหม่</h2>
                                    <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '15px', fontWeight: 500 }}>กรุณากรอกข้อมูลและอัปโหลดหลักฐานตามจริงเพื่อดำเนินการตรวจสอบสถานะ</p>
                                 </div>

                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '32px' }}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px', paddingLeft: '12px' }}>หน่วยงานสภาวิชาชีพ / ผู้ออกใบอนุญาต</label>
                                       <div style={{ display: 'flex', gap: '12px' }}>
                                          <ModernSelect
                                             value={formData.issuer}
                                             onChange={val => setFormData({ ...formData, issuer: val })}
                                             options={ISSUERS.map(i => ({ value: i, label: i }))}
                                             placeholder="เลือกสภาวิชาชีพ..."
                                          />
                                          {checkLink && (
                                             <a href={checkLink} target="_blank" rel="noreferrer" className="premium-gradient" style={{ color: '#fff', padding: '0 32px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>ตรวจสอบสภาฯ</a>
                                          )}
                                       </div>
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px', paddingLeft: '12px' }}>เลขที่ใบอนุญาตใหม่</label>
                                       <input required value={formData.license_no} onChange={e => setFormData({ ...formData, license_no: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', fontWeight: 900, fontSize: '16px', outline: 'none', background: '#fff' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px', paddingLeft: '12px' }}>หน่วยกิตสะสมล่าสุด</label>
                                       <input type="number" step="0.01" value={formData.points} onChange={e => setFormData({ ...formData, points: parseFloat(e.target.value) })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', fontWeight: 900, fontSize: '16px', outline: 'none', background: '#fff' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px', paddingLeft: '12px' }}>วันที่ได้รับใบอนุญาต / วันออกบัตร</label>
                                       <input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none', background: '#fff', fontWeight: 700 }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px', paddingLeft: '12px' }}>วันหมดอายุใหม่</label>
                                       <div style={{ display: 'flex', gap: '12px' }}>
                                          <input required type="date" value={formData.expire_date} onChange={e => setFormData({ ...formData, expire_date: e.target.value })} style={{ flex: 1, padding: '14px 24px', borderRadius: '40px', border: '2px solid #0f172a', fontWeight: 900, outline: 'none', background: '#fff' }} />
                                          <button type="button" onClick={() => setFormData({ ...formData, expire_date: addYears(formData.issue_date || new Date().toISOString(), 5) })} style={{ padding: '0 24px', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}>+ 5 ปี</button>
                                       </div>
                                    </div>

                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px', paddingLeft: '12px' }}>ไฟล์หลักฐาน/ใบอนุญาต (PDF, JPG, PNG)</label>
                                       <div onClick={() => document.getElementById('fileX')?.click()} style={{ border: '2px dashed #e2e8f0', borderRadius: '32px', padding: '40px', textAlign: 'center', cursor: 'pointer', background: '#fff', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#cbd5e1'} onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                                          <input id="fileX" type="file" hidden onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                          {selectedFile ? (
                                             <div style={{ fontWeight: 800, color: '#0d9488', fontSize: '16px' }}>✅ {selectedFile.name}</div>
                                          ) : (
                                             <div>
                                                <div style={{ color: '#64748b', fontWeight: 700, fontSize: '15px' }}>คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์มาวางที่นี่</div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>ขนาดไม่เกิน 10MB</div>
                                             </div>
                                          )}
                                       </div>
                                    </div>

                                    <div style={{ gridColumn: 'span 2', background: '#f5f3ff', padding: '24px', borderRadius: '24px', border: '1px solid #ddd6fe' }}>
                                       <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={formData.psv_checked} onChange={e => setFormData({ ...formData, psv_checked: e.target.checked })} style={{ width: '22px', height: '22px', border: '2px solid #7c3aed' }} />
                                          <span style={{ fontWeight: 800, color: '#5b21b6', fontSize: '15px' }}>ยืนยันว่าข้อมูลถูกต้องและได้ตรวจสอบกับสภาวิชาชีพแล้ว</span>
                                       </label>
                                    </div>
                                 </div>

                                 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                    <button onClick={() => setActiveModal('none')} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '14px 32px', borderRadius: '40px', fontWeight: 800, color: '#64748b', cursor: 'pointer' }}>ยกเลิก</button>
                                    <button onClick={handleLicenseSubmit} disabled={submitting} className="premium-gradient" style={{ color: '#fff', border: 'none', padding: '14px 48px', borderRadius: '40px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)', cursor: 'pointer' }}>
                                       {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและยืนยัน'}
                                    </button>
                                 </div>
                              </div>

                           </div>
                        </div>
                     </div>
                  );
               })()}

               {/* --- Registry Detail View Modal (Premium Style) --- */}
               {activeModal === 'view' && selectedLicense && (() => {
                  const currentEmp = allEmployees.find(e => e.emp_id === selectedLicense.emp_id);
                  const stat = getStatus(selectedLicense);
                  const councilLink = findIssuerLink(selectedLicense.issuer || '');

                  return (
                     <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                        <div style={{ background: '#f8fafc', width: '1100px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', border: '1px solid #fff' }} className="glass-panel">

                           <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                              <div style={{ width: '320px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                                 <div style={{ width: '160px', height: '160px', borderRadius: '40px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '8px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                    {currentEmp?.image || currentEmp?.photo ? (
                                       <img
                                          src={`/uploads/${currentEmp.image || currentEmp.photo}`}
                                          alt="profile"
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }}
                                       />
                                    ) : (
                                       <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    )}
                                 </div>

                                 <div style={{ textAlign: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{currentEmp?.first_name_th} {currentEmp?.last_name_th}</h3>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>รูปภาพโปรไฟล์ผู้ประกอบวิชาชีพ</p>
                                 </div>

                                 <div style={{ marginTop: 'auto', background: '#ecfdf5', padding: '20px', borderRadius: '24px', border: '1px solid #def7ec' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                                       <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }}></div>
                                       </div>
                                       <span style={{ fontSize: '14px', fontWeight: 800, color: '#065f46' }}>ข้อมูลการตรวจสอบสารสนเทศ</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#047857', lineHeight: '1.6', fontWeight: 500 }}>ใช้สำหรับยืนยันข้อมูลเบื้องต้นของผู้ประกอบวิชาชีพจากฐานข้อมูลปัจจุบัน</p>
                                 </div>
                              </div>

                              <div style={{ flex: 1, padding: '48px 64px', overflowY: 'auto', background: '#f8fafc', position: 'relative' }}>
                                 <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '32px', right: '32px', background: '#fff', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>×</button>

                                 <div style={{ marginBottom: '40px' }}>
                                    <div style={{ color: '#0d9488', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Professional Credential</div>
                                    <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>รายละเอียดใบอนุญาต</h2>
                                 </div>

                                 <div style={{ position: 'absolute', top: '104px', right: '64px', background: '#fff', padding: '12px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>สถานะปัจจุบัน</div>
                                    <div style={{ color: stat.color, fontWeight: 900, fontSize: '14px' }}>{stat.label}</div>
                                 </div>

                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                       <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '8px' }}>ชื่อ - นามสกุล</div>
                                       <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{currentEmp?.first_name_th} {currentEmp?.last_name_th}</div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                       <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '8px' }}>เลขที่ใบอนุญาต</div>
                                       <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{selectedLicense.license_no || '-'}</div>
                                    </div>
                                    <div style={{ gridColumn: 'span 2', background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                                       <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '8px' }}>ระยะเวลาบัตร</div>
                                       <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{selectedLicense.issue_date || '-'} - {selectedLicense.expires || '-'}</div>
                                    </div>
                                 </div>

                                 <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                                    {councilLink && (
                                       <a href={councilLink} target="_blank" rel="noreferrer" className="premium-gradient" style={{ color: '#fff', padding: '14px 28px', borderRadius: '16px', textDecoration: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.2)' }}>
                                          ตรวจสอบที่สภาวิชาชีพ
                                       </a>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })()}

               {/* Audit / History Modal (Simplified & Premium) */}
               {historyOpen && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                     <div style={{ background: '#fff', width: '950px', maxHeight: '85vh', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.2)' }} className="glass-panel">
                        <div style={{ padding: '32px 48px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                           <div>
                              <div style={{ color: '#0d9488', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Audit Log History</div>
                              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>ประวัติและผลการตรวจสอบย้อนหลัง</h3>
                           </div>
                           <button onClick={() => setHistoryOpen(false)} style={{ border: '1px solid #e2e8f0', background: '#fff', width: '40px', height: '40px', borderRadius: '15px', cursor: 'pointer', fontSize: '20px', fontWeight: 300, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                        
                        <div style={{ padding: '48px', overflowY: 'auto' }}>
                           <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                              <thead>
                                 <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                                    <th style={{ padding: '0 20px', width: '60px' }}>ลำดับ</th>
                                    <th style={{ width: '150px' }}>เลขที่ใบอนุญาต</th>
                                    <th style={{ padding: '20px 16px', width: '250px', whiteSpace: 'nowrap' }}>วิชาชีพ</th>
                                    <th>วันที่ต่ออายุ</th>
                                    <th style={{ padding: '20px 16px', width: '140px', whiteSpace: 'nowrap' }}>วันหมดอายุ</th>
                                    <th>คะแนน</th>
                                    <th style={{ padding: '20px 16px', width: '160px', whiteSpace: 'nowrap' }}>สถานะ</th>
                                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>หลักฐาน</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {historyData.map((h, i) => {
                                    const dExp = h.expire_date || h.expires ? new Date(h.expire_date || h.expires) : null;
                                    const dIss = h.issue_date || h.issued ? new Date(h.issue_date || h.issued) : null;
                                    const expStr = dExp ? dExp.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                    const issStr = dIss ? dIss.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                                    
                                    return (
                                       <tr key={i} style={{ background: '#f8fafc', borderRadius: '20px', transition: 'transform 0.2s' }} className="hover-scale">
                                          <td style={{ padding: '20px', borderRadius: '20px 0 0 20px', fontWeight: 900, color: '#94a3b8', fontSize: '14px' }}>
                                             {historyData.length - i}
                                          </td>
                                          <td style={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '15px', color: '#0f172a' }}>{h.license_no}</td>
                                          <td style={{ fontWeight: 800, color: '#475569' }}>{h.license_name || h.type}</td>
                                          <td style={{ fontWeight: 800, color: '#0d9488' }}>{issStr}</td>
                                          <td style={{ fontWeight: 800, color: '#0f172a' }}>{expStr}</td>
                                          <td style={{ fontWeight: 900, color: '#2563eb' }}>{h.points || '0.00'}</td>
                                          <td>
                                             <span style={{ padding: '8px 16px', borderRadius: '50px', fontSize: '11px', background: h.verified_status === 'Verified' ? '#dcfce7' : '#f1f5f9', color: h.verified_status === 'Verified' ? '#16a34a' : '#64748b', fontWeight: 900 }}>
                                                {h.verified_status === 'Verified' ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}
                                             </span>
                                          </td>
                                          <td style={{ textAlign: 'right', paddingRight: '20px', borderRadius: '0 20px 20px 0' }}>
                                             {h.file_path ? (
                                                <a href={h.file_path} target="_blank" rel="noreferrer" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', padding: '8px 16px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none', fontSize: '12px' }}>เปิดดูไฟล์</a>
                                             ) : (
                                                <span style={{ fontSize: '12px', color: '#cbd5e1' }}>ไม่มีไฟล์</span>
                                             )}
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

               {/* Config Modal */}
               {activeModal === 'config' && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                     <div style={{ background: '#fff', width: '600px', borderRadius: '24px', padding: '40px' }} className="glass-panel">
                        <h2 style={{ margin: '0 0 32px 0', fontSize: '24px', fontWeight: 900 }}>ตั้งค่าเกณฑ์มาตรฐาน</h2>
                        <form onSubmit={handleConfigSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           <div>
                              <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: '#475569', fontSize: '13px' }}>ชื่อเกณฑ์มาตรฐาน</label>
                              <input required value={configFormData.config_name} onChange={e => setConfigFormData({ ...configFormData, config_name: e.target.value })} placeholder="เช่น เกณฑ์สำหรับ พยาบาลวิภาชีพ ER" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                           </div>
                           <div>
                              <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: '#475569', fontSize: '13px' }}>รายการวิชาชีพ</label>
                              <input required value={configFormData.license_name} onChange={e => setConfigFormData({ ...configFormData, license_name: e.target.value })} placeholder="ระบุชื่อเต็มของใบประกอบ..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                           </div>

                           <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                              <label style={{ fontWeight: 800, color: '#475569', fontSize: '13px' }}>ขอบเขตหน่วยงานที่บังคับใช้</label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
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
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                                 >
                                    <option value="">-- ฝ่าย --</option>
                                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                 </select>
                                 <select 
                                    value={departments.find(d => d.dept_id === configFormData.dept_id)?.dept_name || ''} 
                                    onChange={e => {
                                       const grp = e.target.value;
                                       const div = departments.find(d => d.dept_id === configFormData.dept_id)?.division;
                                       const firstDept = departments.find(d => d.division === div && d.dept_name === grp);
                                       setConfigFormData({ ...configFormData, dept_id: firstDept?.dept_id });
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                                 >
                                    <option value="">-- กลุ่มงาน --</option>
                                    {getGroupsByDiv(departments.find(d => d.dept_id === configFormData.dept_id)?.division || '').map(g => <option key={g} value={g}>{g}</option>)}
                                 </select>
                                 <select 
                                    value={configFormData.dept_id || ''} 
                                    onChange={e => setConfigFormData({ ...configFormData, dept_id: e.target.value || null })} 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                                 >
                                    <option value="">-- แผนกย่อย --</option>
                                    {getSubsByGrp(
                                       departments.find(d => d.dept_id === configFormData.dept_id)?.division || '',
                                       departments.find(d => d.dept_id === configFormData.dept_id)?.dept_name || ''
                                    ).map(s => <option key={s.dept_id} value={s.dept_id}>{s.sub_dept || '(ไม่มีแผนกย่อย)'}</option>)}
                                 </select>
                              </div>

                              <div>
                                 <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: '#475569', fontSize: '13px' }}>ตำแหน่งที่บังคับใช้</label>
                                 <select value={configFormData.pos_id || ''} onChange={e => setConfigFormData({ ...configFormData, pos_id: e.target.value || null })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#fff' }}>
                                    <option value="">-- พนักงานทุกตำแหน่ง --</option>
                                    {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                                 </select>
                              </div>
                           </div>

                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                              <div>
                                 <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: '#475569', fontSize: '13px' }}>อายุบัตร (ปี)</label>
                                 <input type="number" required value={isNaN(configFormData.valid_years!) ? '' : configFormData.valid_years} onChange={e => setConfigFormData({ ...configFormData, valid_years: e.target.value === '' ? 0 : parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                              </div>
                              <div>
                                 <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: '#475569', fontSize: '13px' }}>เตือนล่วงหน้า (วัน)</label>
                                 <input type="number" required value={isNaN(configFormData.warning_days!) ? '' : configFormData.warning_days} onChange={e => setConfigFormData({ ...configFormData, warning_days: e.target.value === '' ? 0 : parseInt(e.target.value) })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }} />
                              </div>
                           </div>

                           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: 12 }}>
                              <button type="button" onClick={() => setActiveModal('none')} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>ยกเลิก</button>
                              <button type="submit" className="premium-gradient" style={{ color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>บันทึกเกณฑ์</button>
                           </div>
                        </form>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </AppLayout>
   );
}
