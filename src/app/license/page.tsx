'use client';

import React, { useState, useEffect } from 'react';
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
   pending: number;
   departmentStats: Record<string, { total: number, compliant: number, missing: number, expiring: number, pending: number }>;
   details: any[];
}

interface LicenseConfig {
   id: number;
   config_name: string;
   pos_id: string | null;
   dept_id: string | null;
   license_name: string;
   issuer: string | null;
   valid_years: number;
   warning_days: number;
}

// --- Helpers ---
function getStatus(l: License) {
   if (l.daysLeft < 0) return { label: `หมดอายุแล้ว (${Math.abs(l.daysLeft)} วัน)`, color: '#dc2626', bg: '#fee2e2' };
   if (l.verified_status !== 'Verified') return { label: 'รอการตรวจสอบ', color: '#7c3aed', bg: '#f5f3ff' };
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
   for (let key in COUNCIL_LINKS) {
      if (licenseName.includes(key) || key.includes(licenseName)) return COUNCIL_LINKS[key];
   }
   return null;
}

// --- Internal UI Components ---
function StatusBadge({ label, color, bg, fontSize = '11px', padding = '8px 20px' }: { label: string, color: string, bg: string, fontSize?: string, padding?: string }) {
   return (
      <span style={{ 
         padding, borderRadius: '50px', fontSize, fontWeight: 900, background: bg, color, 
         display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' 
      }}>
         {label}
      </span>
   );
}

function EmployeeSidebar({ emp, license, isView = false }: { emp: any, license?: License, isView?: boolean }) {
   if (!emp) return null;
   return (
      <div style={{ width: isView ? '320px' : '340px', background: '#fff', borderRight: '1px solid #e2e8f0', padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', overflowY: 'auto' }}>
         <div style={{ width: isView ? '160px' : '120px', height: isView ? '160px' : '120px', borderRadius: isView ? '40px' : '32px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: isView ? '8px solid #fff' : '4px solid #fff', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            {emp.image || emp.photo ? (
               <img src={`/uploads/${emp.image || emp.photo}`} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
               <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            )}
         </div>
         <div style={{ textAlign: 'center', width: '100%' }}>
            <h3 style={{ margin: 0, fontSize: isView ? '22px' : '18px', fontWeight: 800, color: '#0f172a' }}>{emp.first_name_th} {emp.last_name_th}</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{emp.emp_id}</p>
         </div>
         <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', background: '#f8fafc', padding: '24px', borderRadius: '28px', border: '1px solid #e2e8f0' }}>
            <div>
               <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>ตำแหน่ง</div>
               <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{emp.position_name || emp.pos_name || '-'}</div>
            </div>
            <div>
               <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>แผนก</div>
               <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{emp.dept_name || '-'}</div>
            </div>
         </div>
         {!isView && license && (
            <div style={{ background: '#fffbeb', padding: '24px', borderRadius: '24px', border: '1px solid #fde68a', width: '100%' }}>
               <div style={{ fontSize: '13px', fontWeight: 800, color: '#b45309', marginBottom: '16px' }}>ข้อมูลปัจจุบันในระบบ</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                     <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>เลขที่ใบอนุญาต</div>
                     <div style={{ fontSize: '16px', fontWeight: 900, fontFamily: 'monospace' }}>{license.license_no}</div>
                  </div>
                  <div>
                     <div style={{ fontSize: '11px', fontWeight: 800, color: '#d97706', marginBottom: '4px' }}>วันหมดอายุเดิม</div>
                     <div style={{ fontSize: '15px', fontWeight: 800 }}>{license.expires || '-'}</div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
}

function HistoryTable({ data, emptyText = 'ไม่พบประวัติย้อนหลัง' }: { data: License[], emptyText?: string }) {
   return (
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
         <thead>
            <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>
               <th style={{ padding: '0 16px' }}>เลขใบอนุญาต</th>
               <th style={{ width: '220px', whiteSpace: 'nowrap' }}>วิชาชีพ</th>
               <th>หมดอายุ</th>
               <th style={{ textAlign: 'right', paddingRight: '16px' }}>ไฟล์</th>
            </tr>
         </thead>
         <tbody>
            {data.map((h, idx) => {
               const dExp = h.expire_date ? new Date(h.expire_date) : null;
               const expStr = dExp ? dExp.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
               return (
                  <tr key={idx} style={{ background: '#fff', borderRadius: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                     <td style={{ padding: '16px', fontWeight: 800, fontFamily: 'monospace', fontSize: '14px', borderTopLeftRadius: '14px', borderBottomLeftRadius: '14px' }}>{h.license_no}</td>
                     <td style={{ fontWeight: 800, fontSize: '13px' }}>{h.license_name || h.type}</td>
                     <td style={{ fontWeight: 800, fontSize: '13px', color: '#dc2626' }}>{expStr}</td>
                     <td style={{ textAlign: 'right', paddingRight: '16px', borderTopRightRadius: '14px', borderBottomRightRadius: '14px', padding: '10px' }}>
                        {h.file_path && (
                           <a href={h.file_path} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 900, fontSize: '12px', background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none' }}>เปิดดู</a>
                        )}
                     </td>
                  </tr>
               );
            })}
            {data.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#fff', borderRadius: '16px' }}>{emptyText}</td></tr>}
         </tbody>
      </table>
   );
}

function ModernSelect({
   value, onChange, options, placeholder = 'เลือก...', style = {}
}: {
   value: string | number, onChange: (val: any) => void, options: { value: string | number, label: string }[], placeholder?: string, style?: React.CSSProperties
}) {
   const [isOpen, setIsOpen] = useState(false);
   const selectedOption = options.find(o => String(o.value) === String(value));
   return (
      <div style={{ position: 'relative', width: '100%', ...style }}>
         <div 
            onClick={() => setIsOpen(!isOpen)}
            style={{ 
               padding: '14px 24px', borderRadius: '40px', background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', 
               display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700, fontSize: '14px', 
               boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', transition: 'all 0.2s', minHeight: '48px' 
            }}
         >
            <span style={{ color: selectedOption ? '#0f172a' : '#94a3b8' }}>{selectedOption ? selectedOption.label : placeholder}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}><path d="m6 9 6 6 6-6" /></svg>
         </div>
         {isOpen && (
            <>
               <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3999 }} onClick={() => setIsOpen(false)} />
               <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)', zIndex: 9999, overflow: 'hidden', padding: '10px', border: '1px solid #f1f5f9', maxHeight: '300px', overflowY: 'auto' }}>
                  {options.map((opt, i) => (
                     <div key={i} onClick={() => { onChange(opt.value); setIsOpen(false); }} style={{ padding: '12px 16px', borderRadius: '14px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: String(opt.value) === String(value) ? '#2563eb' : '#475569', background: String(opt.value) === String(value) ? '#eff6ff' : 'transparent' }}>{opt.label}</div>
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
      config_name: '', pos_id: null, dept_id: null, license_name: '', issuer: null, valid_years: 5, warning_days: 90
   });

   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [submitting, setSubmitting] = useState(false);
   const [historyData, setHistoryData] = useState<License[]>([]);
   const [historyOpen, setHistoryOpen] = useState(false);
   const [statusDetailModal, setStatusDetailModal] = useState({ isOpen: false, status: '', label: '', color: '' });
   const [statusSearchTerm, setStatusSearchTerm] = useState('');

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
         params.append('v', Date.now().toString());
         const res = await fetch(`/api/licenses?${params.toString()}`, { cache: 'no-store' });
         setLicenses(await res.json());
      } catch (err) { console.error('Fetch Licenses Error:', err); } finally { setLoading(false); }
   };

   const fetchMonitorData = async () => {
      try {
         setLoading(true);
         const v = Date.now();
         const res = await fetch(`/api/licenses/monitor?v=${v}`, { cache: 'no-store' });
         setMonitorData(await res.json());
      } catch (err) { console.error('Fetch Monitor Error:', err); } finally { setLoading(false); }
   };

   const fetchConfigs = async () => {
      try {
         setLoading(true);
         const v = Date.now();
         const res = await fetch(`/api/licenses/configs?v=${v}`, { cache: 'no-store' });
         setConfigs(await res.json());
      } catch (err) { console.error('Fetch Configs Error:', err); } finally { setLoading(false); }
   };

   const handleConfigSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         setSubmitting(true);
         const res = await fetch('/api/licenses/configs', {
            method: selectedConfig ? 'PUT' : 'POST',
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

         const res = await fetch('/api/licenses/renew', { method: 'POST', body: fd });
         if (res.ok) {
            Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'บันทึกข้อมูลเรียบร้อยแล้ว', showConfirmButton: false, timer: 1000 });
            await fetchLicenses();
            setActiveModal('none');
            setSelectedFile(null);
         } else {
            const err = await res.json();
            throw new Error(err.error || 'Failed to save');
         }
      } catch (err: any) { Swal.fire('Error', err.message, 'error'); } finally { setSubmitting(false); }
   };

   const fetchHistoryData = async (empId: string, openModal = true) => {
      try {
         const v = Date.now();
         const res = await fetch(`/api/licenses/renew?emp_id=${empId}&history=true&v=${v}`, { cache: 'no-store' });
         if (res.ok) {
            setHistoryData(await res.json());
            if (openModal) setHistoryOpen(true);
         }
      } catch (err) { console.error('Fetch History Error:', err); }
   };

   const handleOpenModal = (type: any, data?: any) => {
      if (type === 'config') {
         setSelectedConfig(data || null);
         setConfigFormData(data || { config_name: '', pos_id: null, dept_id: null, license_name: '', issuer: null, valid_years: 5, warning_days: 90 });
      } else {
         setSelectedLicense(data || null);
         setSearchTermEmp('');
         setSelectedFile(null);
         if (data) {
            fetchHistoryData(data.emp_id, false);
            setFormData({
               license_no: data.license_no || '', expire_date: data.expire_date || data.expires || '', points: data.points || 0,
               emp_id: data.emp_id, license_name: data.license_name || '', license_type: data.license_type || '', institution: data.institution || '',
               issuer: data.issuer || '', issue_date: data.issue_date || '', remarks: data.remarks || '',
               warning_days_override: data.warning_days_override || 30, verified_status: data.verified_status || 'Pending', psv_checked: data.verified_status === 'Verified'
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
      const matchBoth = configs.find(c => c.dept_id === emp.dept_id && c.pos_id === emp.pos_id);
      if (matchBoth) return matchBoth;
      const matchDept = configs.find(c => c.dept_id === emp.dept_id && !c.pos_id);
      if (matchDept) return matchDept;
      const matchPos = configs.find(c => c.pos_id === emp.pos_id && !c.dept_id);
      if (matchPos) return matchPos;
      return null;
   };

   const cardStyle = { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };

   return (
      <AppLayout>
         <div className="license-page-root custom-scrollbar" style={{ padding: '32px', minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'Anuphan, Prompt, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
               <div>
                  <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: 0 }}>ทะเบียนใบประกอบวิชาชีพ</h1>
                  <p style={{ color: '#64748b', fontWeight: 600, marginTop: '4px' }}>การจัดการทะเบียน การต่ออายุ และการตรวจสอบความถูกต้องสากล</p>
               </div>
               <button onClick={() => handleOpenModal('add')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}>บันทึกข้อมูลใบประกอบ</button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: '#e2e8f0', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
               {[
                  { id: 'list', label: 'ทะเบียนบุคลากร' },
                  { id: 'monitor', label: 'สรุปผลภาพรวม' },
                  { id: 'settings', label: 'การตั้งค่าเกณฑ์' }
               ].filter(t => isAdmin || (isDeptHead && t.id === 'monitor') || t.id === 'list').map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{ padding: '12px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#64748b', boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>{tab.label}</button>
               ))}
            </div>

            {activeTab === 'list' && (
               <div style={cardStyle}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                     <div style={{ flex: 1, position: 'relative' }}><input placeholder="ค้นหาชื่อพนักงาน หรือ เลขที่ใบประกอบ..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '16px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontSize: '15px' }} /></div>
                     <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0 24px', borderRadius: '14px', border: '1px solid #e2e8f0', fontWeight: 700, background: '#fff', cursor: 'pointer', outline: 'none', minWidth: '180px' }}>
                        <option value="all">สถานะทั้งหมด</option>
                        <option value="expiring">ใกล้หมดอายุ</option>
                        <option value="expired">หมดอายุแล้ว</option>
                        <option value="Pending">รอการตรวจสอบ</option>
                     </select>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                           <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
                              <th style={{ padding: '16px' }}>รหัสพนักงาน</th>
                              <th>ชื่อ-นามสกุล</th>
                              <th style={{ width: "220px", whiteSpace: "nowrap" }}>วิชาชีพ</th>
                              <th>เลขใบอนุญาต</th>
                              <th>วันหมดอายุ</th>
                              <th>สถานะ</th>
                              <th style={{ textAlign: 'right', paddingRight: '16px' }}>ดำเนินการ</th>
                           </tr>
                        </thead>
                        <tbody>
                           {loading ? (
                              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '100px' }}>Loading...</td></tr>
                           ) : licenses.map(l => {
                              const stat = getStatus(l);
                              return (
                                 <tr key={l.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '20px 16px', color: '#64748b', fontWeight: 700 }}>{l.emp_id}</td>
                                    <td onClick={() => handleOpenModal('view', l)} style={{ fontWeight: 800, color: '#0f172a', cursor: 'pointer' }}>{l.name}</td>
                                    <td style={{ fontWeight: 700 }}>{l.type || l.license_name}</td>
                                    <td style={{ color: '#64748b', fontFamily: 'monospace' }}>{l.license_no || '-'}</td>
                                    <td style={{ fontWeight: 700 }}>{l.expires || '-'}</td>
                                    <td><StatusBadge {...stat} /></td>
                                    <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                                       <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                          <button onClick={() => fetchHistoryData(l.emp_id)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg></button>
                                          <button onClick={() => handleOpenModal('renew', l)} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}>จัดการ</button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'monitor' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {loading && !monitorData ? (
                     <div style={cardStyle}>กำลังโหลดข้อมูลสรุปผล...</div>
                  ) : monitorData ? (
                     <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px' }}>
                           {[
                              { label: 'พนักงานทั้งหมด', val: monitorData.totalEmployees, color: '#0f172a', statusKey: 'all' },
                              { label: 'ถูกต้องครบถ้วน', val: monitorData.compliant, color: '#16a34a', statusKey: 'Compliant' },
                              { label: 'ใกล้หมดอายุ', val: monitorData.expiring, color: '#ca8a04', statusKey: 'Expiring' },
                              { label: 'รอตรวจสอบ', val: monitorData.pending, color: '#7c3aed', statusKey: 'PendingAudit' },
                              { label: 'หมดอายุ', val: monitorData.missing, color: '#dc2626', statusKey: 'RedAlert' }
                           ].map((c, i) => (
                              <div key={i} style={cardStyle} onClick={() => setStatusDetailModal({ isOpen: true, status: c.statusKey, label: c.label, color: c.color })}>
                                 <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{c.label}</p>
                                 <h2 style={{ margin: '8px 0 0 0', fontSize: '36px', fontWeight: 900, color: c.color }}>{c.val}</h2>
                              </div>
                           ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px', minHeight: '400px' }}>
                           <div style={cardStyle}>
                              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สัดส่วนพนักงานตามสถานะ</h3>
                              <div style={{ height: '320px' }}>
                                 <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                       <Pie data={[{ name: 'ครบถ้วน', value: monitorData.compliant, color: '#16a34a' }, { name: 'ใกล้หมดอายุ', value: monitorData.expiring, color: '#ca8a04' }, { name: 'รอตรวจสอบ', value: monitorData.pending, color: '#7c3aed' }, { name: 'หมดอายุ', value: monitorData.missing, color: '#dc2626' }]} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                          {[ { color: '#16a34a' }, { color: '#ca8a04' }, { color: '#7c3aed' }, { color: '#dc2626' } ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                       </Pie>
                                       <Tooltip /><Legend />
                                    </PieChart>
                                 </ResponsiveContainer>
                              </div>
                           </div>
                           <div style={{ ...cardStyle, overflow: 'hidden' }}>
                              <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 800 }}>สถานะแยกตามภาคส่วน</h3>
                              <div className="custom-scrollbar" style={{ height: '320px', overflowX: 'auto' }}>
                                 <div style={{ minWidth: `${Math.max(800, Object.keys(monitorData.departmentStats).length * 80)}px`, height: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                       <BarChart data={Object.entries(monitorData.departmentStats).map(([dept, stats]) => ({ name: dept, ครบถ้วน: stats.compliant, ใกล้หมดอายุ: stats.expiring, รอตรวจสอบ: stats.pending, หมดอายุ: stats.missing }))}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" fontSize={10} angle={-35} textAnchor="end" height={80} /><YAxis fontSize={10} /><Tooltip />
                                          <Bar dataKey="ครบถ้วน" stackId="a" fill="#16a34a" barSize={30} /><Bar dataKey="ใกล้หมดอายุ" stackId="a" fill="#ca8a04" barSize={30} /><Bar dataKey="รอตรวจสอบ" stackId="a" fill="#7c3aed" barSize={30} /><Bar dataKey="หมดอายุ" stackId="a" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={30} />
                                       </BarChart>
                                    </ResponsiveContainer>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </>
                  ) : <div style={cardStyle}>ไม่พบข้อมูล</div>}
               </div>
            )}

            {activeTab === 'settings' && (
               <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                     <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>เกณฑ์มาตรฐานตามสายวิชาชีพ</h3>
                     <button onClick={() => handleOpenModal('config')} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>+ เพิ่มเกณฑ์</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                     <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                           <tr style={{ textAlign: 'left', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '12px' }}>
                              <th style={{ padding: '16px' }}>ชื่อเกณฑ์</th>
                              <th>วิชาชีพ</th>
                              <th>หน่วยงาน/สายงานที่บังคับ</th>
                              <th>อายุบัตร (ปี)</th>
                              <th>เตือน (วัน)</th>
                              <th>ตรวจสอบสภาฯ</th>
                              <th style={{ textAlign: 'right' }}>ดำเนินการ</th>
                           </tr>
                        </thead>
                        <tbody>
                           {configs.map(c => {
                              const link = (c as any).issuer ? COUNCIL_LINKS[(c as any).issuer] : findIssuerLink(c.license_name);
                              return (
                                 <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                    <td style={{ padding: '18px 16px', fontWeight: 800 }}>{c.config_name}</td>
                                    <td style={{ fontWeight: 700 }}>{c.license_name}</td>
                                    <td style={{ fontSize: '13px' }}>
                                       <div>{departments.find(d => d.dept_id === c.dept_id)?.dept_name || 'ทุกหน่วยงาน'}</div>
                                       <div style={{ color: '#64748b' }}>{positions.find(p => p.pos_id === c.pos_id)?.pos_name || 'ทุกสายงาน'}</div>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{c.valid_years}</td>
                                    <td style={{ color: '#ea580c', fontWeight: 700 }}>{c.warning_days}</td>
                                    <td>
                                       {link ? <a href={link} target="_blank" rel="noreferrer" style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textDecoration: 'none' }}>ตรวจสอบสภาฯ</a> : <span style={{ fontSize: '11px', color: '#cbd5e1' }}>ไม่พบลิงก์</span>}
                                    </td>
                                    <td style={{ textAlign: 'right' }}><button onClick={() => handleOpenModal('config', c)} style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer' }}>แก้ไข</button></td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {(activeModal === 'renew' || activeModal === 'add' || activeModal === 'edit') && (() => {
               const currentEmp = allEmployees.find(e => e.emp_id === (activeModal === 'add' ? formData.emp_id : selectedLicense?.emp_id));
               const filteredEmp = allEmployees.filter(e => e.first_name_th?.includes(searchTermEmp) || e.emp_id?.includes(searchTermEmp));
               return (
                  <div onClick={() => setActiveModal('none')} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                     <div onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', width: '1100px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                           <EmployeeSidebar emp={currentEmp} license={selectedLicense || undefined} />
                           <div style={{ flex: 1, padding: '48px 64px', overflowY: 'auto', background: '#f8fafc', position: 'relative' }}>
                              <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '32px', right: '32px', background: '#fff', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer', color: '#64748b' }}>×</button>
                              <div style={{ marginBottom: '40px' }}>
                                 <h2 style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>บันทึกข้อมูลใบอนุญาต</h2>
                                 <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '15px' }}>กรุณากรอกข้อมูลและอัปโหลดหลักฐานเพื่อดำเนินการตรวจสอบ</p>
                              </div>
                              <form onSubmit={handleLicenseSubmit}>
                                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', marginBottom: '32px' }}>
                                    {activeModal === 'add' && (
                                       <div style={{ gridColumn: 'span 2' }}>
                                          <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>เลือกพนักงาน <span style={{ color: '#ef4444' }}>*</span></label>
                                          <ModernSelect value={formData.emp_id} onChange={val => { setFormData({ ...formData, emp_id: val }); const req = checkRequirement(val); if (req) setFormData(f => ({ ...f, license_name: req.license_name, issuer: req.issuer || '' })); }} options={filteredEmp.map(e => ({ value: e.emp_id, label: `${e.emp_id} - ${e.first_name_th} ${e.last_name_th}` }))} />
                                       </div>
                                    )}
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>ประเภทใบอนุญาต <span style={{ color: '#ef4444' }}>*</span></label>
                                       <input required value={formData.license_name} onChange={e => setFormData({ ...formData, license_name: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>เลขที่ใบอนุญาต <span style={{ color: '#ef4444' }}>*</span></label>
                                       <input required value={formData.license_no} onChange={e => setFormData({ ...formData, license_no: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>วันออกบัตร</label>
                                       <input type="date" value={formData.issue_date} onChange={e => setFormData({ ...formData, issue_date: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                    <div>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>วันหมดอายุ <span style={{ color: '#ef4444' }}>*</span></label>
                                       <input type="date" required value={formData.expire_date} onChange={e => setFormData({ ...formData, expire_date: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>สภาวิชาชีพ (หน่วยงานที่ออกบัตร)</label>
                                       <ModernSelect value={formData.issuer} onChange={val => setFormData({ ...formData, issuer: val })} options={ISSUERS.map(i => ({ value: i, label: i }))} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                       <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: '#475569', marginBottom: '10px' }}>หลักฐานใบอนุญาต (.pdf, .jpg, .png)</label>
                                       <input type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '2px dashed #e2e8f0', background: '#fff' }} />
                                    </div>
                                 </div>
                                 <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                       <input type="checkbox" checked={formData.psv_checked} onChange={e => setFormData({ ...formData, psv_checked: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                                       <span style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>ข้าพเจ้าได้ตรวจสอบความถูกต้องของข้อมูลผ่านสภาวิชาชีพแล้ว</span>
                                    </label>
                                 </div>
                                 <div style={{ display: 'flex', gap: '16px' }}>
                                    <button type="button" onClick={() => setActiveModal('none')} style={{ flex: 1, padding: '16px', borderRadius: '40px', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>ยกเลิก</button>
                                    <button type="submit" disabled={submitting} style={{ flex: 2, padding: '16px', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer' }}>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลใบอนุญาต'}</button>
                                 </div>
                              </form>
                           </div>
                        </div>
                     </div>
                  </div>
               );
            })()}

            {activeModal === 'view' && selectedLicense && (
               <div onClick={() => setActiveModal('none')} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '900px', maxHeight: '90vh', borderRadius: '40px', overflow: 'hidden', display: 'flex', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.2)' }}>
                     <EmployeeSidebar emp={allEmployees.find(e => e.emp_id === selectedLicense.emp_id)} license={selectedLicense} isView={true} />
                     <div style={{ flex: 1, padding: '48px', overflowY: 'auto', position: 'relative' }}>
                        <button onClick={() => setActiveModal('none')} style={{ position: 'absolute', top: '32px', right: '32px', background: '#f8fafc', border: 'none', width: '36px', height: '36px', borderRadius: '12px', cursor: 'pointer' }}>×</button>
                        <h2 style={{ margin: '0 0 32px 0', fontSize: '24px', fontWeight: 900 }}>รายละเอียดใบอนุญาต</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                           <div><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>เลขที่ใบอนุญาต</div><div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}>{selectedLicense.license_no || '-'}</div></div>
                           <div><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>ประเภทวิชาชีพ</div><div style={{ fontSize: '16px', fontWeight: 800 }}>{selectedLicense.type || selectedLicense.license_name || '-'}</div></div>
                           <div><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>สภาวิชาชีพ</div><div style={{ fontSize: '16px', fontWeight: 800 }}>{selectedLicense.issuer || '-'}</div></div>
                           <div><div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>วันหมดอายุ</div><div style={{ fontSize: '16px', fontWeight: 800 }}>{selectedLicense.expires || '-'}</div></div>
                        </div>
                        {selectedLicense.file_path && (
                           <div style={{ marginBottom: '32px' }}>
                              <a href={selectedLicense.file_path} target="_blank" rel="noreferrer" style={{ display: 'block', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '24px', textAlign: 'center', textDecoration: 'none', color: '#2563eb', fontWeight: 800 }}>เปิดดูไฟล์สแกนใบอนุญาต</a>
                           </div>
                        )}
                        <h3 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '16px' }}>ประวัติย้อนหลัง</h3>
                        <HistoryTable data={historyData} />
                     </div>
                  </div>
               </div>
            )}

            {activeModal === 'config' && (
               <div onClick={() => setActiveModal('none')} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '48px', borderRadius: '40px', width: '600px', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.2)' }}>
                     <h2 style={{ margin: '0 0 32px 0', fontSize: '24px', fontWeight: 900 }}>ตั้งค่าเกณฑ์มาตรฐาน</h2>
                     <form onSubmit={handleConfigSubmit}>
                        <div style={{ display: 'grid', gap: '24px', marginBottom: '32px' }}>
                           <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>ชื่อเกณฑ์</label><input required value={configFormData.config_name} onChange={e => setConfigFormData({ ...configFormData, config_name: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0' }} /></div>
                           <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>ประเภทวิชาชีพ</label><input required value={configFormData.license_name} onChange={e => setConfigFormData({ ...configFormData, license_name: e.target.value })} style={{ width: '100%', padding: '14px 24px', borderRadius: '40px', border: '1px solid #e2e8f0' }} /></div>
                           <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>สภาวิชาชีพ</label><ModernSelect value={configFormData.issuer || ''} onChange={val => setConfigFormData({ ...configFormData, issuer: val })} options={ISSUERS.map(i => ({ value: i, label: i }))} /></div>
                           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>แผนก (ทุกแผนกละเว้น)</label><ModernSelect value={configFormData.dept_id || ''} onChange={val => setConfigFormData({ ...configFormData, dept_id: val })} options={departments.map(d => ({ value: d.dept_id, label: d.dept_name }))} /></div>
                              <div><label style={{ display: 'block', fontSize: '14px', fontWeight: 800, marginBottom: '8px' }}>ตำแหน่ง (ทุกตำแหน่งละเว้น)</label><ModernSelect value={configFormData.pos_id || ''} onChange={val => setConfigFormData({ ...configFormData, pos_id: val })} options={positions.map(p => ({ value: p.pos_id, label: p.pos_name }))} /></div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                           <button type="button" onClick={() => setActiveModal('none')} style={{ flex: 1, padding: '16px', borderRadius: '40px', background: '#f1f5f9', border: 'none', fontWeight: 800 }}>ยกเลิก</button>
                           <button type="submit" disabled={submitting} style={{ flex: 1, padding: '16px', borderRadius: '40px', background: '#0f172a', color: '#fff', border: 'none', fontWeight: 800 }}>{submitting ? 'กำลังบันทึก...' : 'บันทึกเกณฑ์'}</button>
                        </div>
                     </form>
                  </div>
               </div>
            )}

            {statusDetailModal.isOpen && (
               <div onClick={() => setStatusDetailModal({ ...statusDetailModal, isOpen: false })} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: '#f8fafc', width: '900px', maxHeight: '85vh', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px -15px rgba(0,0,0,0.2)' }}>
                     <div style={{ padding: '32px 48px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ color: statusDetailModal.color, fontSize: '12px', fontWeight: 900 }}>รายชื่อพนักงาน</div><h3 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{statusDetailModal.label}</h3></div>
                        <input type="text" placeholder="ค้นหาชื่อ หรือ รหัส..." value={statusSearchTerm} onChange={e => setStatusSearchTerm(e.target.value)} style={{ padding: '12px 24px', borderRadius: '40px', border: '1px solid #e2e8f0', outline: 'none' }} />
                     </div>
                     <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                           <thead><tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}><th>พนักงาน</th><th>ตำแหน่ง / แผนก</th><th>รายละเอียด</th></tr></thead>
                           <tbody>
                              {monitorData?.details.filter(emp => { if (statusDetailModal.status === 'RedAlert') { if (emp.status !== 'Missing' && emp.status !== 'Expired') return false; } else if (statusDetailModal.status !== 'all') { if (emp.status !== statusDetailModal.status) return false; } return !statusSearchTerm || emp.first_name_th?.includes(statusSearchTerm) || emp.emp_id?.includes(statusSearchTerm); }).map((emp, idx) => (
                                 <tr key={idx} style={{ background: '#fff', borderRadius: '20px' }}><td style={{ padding: '16px' }}>{emp.first_name_th} {emp.last_name_th} (ID: {emp.emp_id})</td><td>{emp.pos_name} / {emp.dept_name}</td><td style={{ textAlign: 'right' }}><button onClick={() => { const lic = licenses.find(lx => lx.emp_id === emp.emp_id); handleOpenModal('view', lic ? { ...lic, emp_id: emp.emp_id } : { emp_id: emp.emp_id }); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '12px', color: '#2563eb', fontWeight: 800 }}>ดูโปรไฟล์</button></td></tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </AppLayout>
   );
}
