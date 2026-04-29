'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Employee, ProfessionalLicense, Department, Position } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import CustomSelect from '@/components/CustomSelect';
import ThaiDateInput from '@/components/ThaiDateInput';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Partial<Employee> | null;
  onSave: (fd: FormData, isEditing: boolean) => Promise<{ success: boolean; message?: string }>;
  viewMode?: boolean;
  isProfileMode?: boolean;
  departments: Department[];
  positions: Position[];
}

export default function EmployeeFormModal({
  isOpen, onClose, employee, onSave, viewMode = false, isProfileMode = false, departments, positions
}: EmployeeFormModalProps) {
  const { user } = useAuth();
  const role = user?.role || 'User';
  const isSuperAdmin = ['Super Admin', 'Admin', 'admin'].includes(role);
  const isHR = role === 'HR';
  const isHead = ['Head', 'หัวหน้า'].includes(role);
  const isManagement = isSuperAdmin || isHR || isHead;
  const isAdmin = isSuperAdmin || isHR; // Admin functions for Super Admin and HR

  const EMPTY_FORM: Partial<Employee> = {
    prefix: 'นาย', first_name_th: '', last_name_th: '', nickname: '',
    birth_date: '', gender: 'ชาย', citizen_id: '',
    emp_id: '', dept_id: '', pos_id: '', emp_type: 'พนักงานราชการ', start_date: '',
    phone: '', address: '', status: 'ทำงานปกติ', retirement_date: '',
    addr_no: '', addr_moo: '', addr_village: '', addr_soi: '', addr_road: '', addr_province: '', addr_district: '', addr_subdistrict: '', addr_zipcode: '',
    has_license: false, email: '', password: '', role: 'User', licenses: [], position_no: ''
  };

  const isEditing = !!employee?.emp_id;
  const [formData, setFormData] = useState<Partial<Employee>>(employee || { ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(employee?.image ? `/uploads/${employee.image}` : null);
  const [saving, setSaving] = useState(false);

  // License History State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLicenseName, setHistoryLicenseName] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [customPosName, setCustomPosName] = useState('');
  const [posSearch, setPosSearch] = useState('');
  const [isPosOpen, setIsPosOpen] = useState(false);

  const fetchLicenseHistory = async (licenseNo: string, licenseName: string) => {
    if (!licenseNo) return;
    try {
      const res = await fetch(`/api/licenses/history/${licenseNo}`);
      const data = await res.json();
      setHistoryData(data);
      setHistoryLicenseName(licenseName);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error('Error fetching license history:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const data = employee || { ...EMPTY_FORM };

      // If split address fields are empty but full address exists, try to parse it
      if (data.address && !data.addr_province) {
        const addr = data.address;
        const noMatch = addr.match(/เลขที่\s*([^\s]+)/);
        const mooMatch = addr.match(/หมู่\s*(\d+)/);
        const villageMatch = addr.match(/หมู่บ้าน\s*([^\s]+)/) || addr.match(/หมู่\s*([^\u0E00-\u0E7F\w]+)/); // Try to catch name if not number
        const soiMatch = addr.match(/ซอย\s*([^\s]+)/);
        const roadMatch = addr.match(/ถนน\s*([^\s]+)/);
        const subMatch = addr.match(/ตำบล\/แขวง\s*([^\s]+)/);
        const distMatch = addr.match(/อำเภอ\/เขต\s*([^\s]+)/);
        const provMatch = addr.match(/จังหวัด\s*([^\s]+)/);
        const zipMatch = addr.match(/(\d{5})/);

        if (noMatch) data.addr_no = noMatch[1];
        if (mooMatch) data.addr_moo = mooMatch[1];
        if (villageMatch && !mooMatch) data.addr_village = villageMatch[1];
        if (soiMatch) data.addr_soi = soiMatch[1];
        if (roadMatch) data.addr_road = roadMatch[1];
        if (subMatch) data.addr_subdistrict = subMatch[1];
        if (distMatch) data.addr_district = distMatch[1];
        if (provMatch) data.addr_province = provMatch[1];
        if (zipMatch) data.addr_zipcode = zipMatch[1];
      }

      setFormData(data);
      setPreviewUrl(employee?.image ? `/uploads/${employee.image}` : null);
      setImageFile(null);

      if (data.dept_id && departments && departments.length > 0) {
        const div = departments.find(d => d.dept_id === data.dept_id)?.division || '';
        setSelectedDivision(div);
      } else {
        setSelectedDivision('');
      }
      setPosSearch('');
      setIsPosOpen(false);
    }
  }, [employee, isOpen, departments]);

  // Auto-calculate Retirement Date (Age 60)
  useEffect(() => {
    if (formData.birth_date && !viewMode) {
      const bDate = new Date(formData.birth_date);
      if (!isNaN(bDate.getTime())) {
        let retirementYear = bDate.getFullYear() + 60;
        // Rule: Born between Jan 1 - Sep 30 retire that year, Oct 1 onwards retire next year
        // Month is 0-indexed, so Oct is 9.
        const month = bDate.getMonth();
        if (month >= 9) {
          retirementYear += 1;
        }
        const rDate = `${retirementYear}-09-30`;
        if (formData.retirement_date !== rDate) {
          setField('retirement_date', rDate);
        }
      }
    }
  }, [formData.birth_date, viewMode]);

  // Address Data State
  const [thaiAddressData, setThaiAddressData] = useState<any[]>([]);
  useEffect(() => {
    fetch('/data/thai_address.json')
      .then(r => {
        if (!r.ok) throw new Error('Network response was not ok');
        return r.json();
      })
      .then(data => setThaiAddressData(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load thai address data', err));
  }, []);

  const provinces = Array.from(new Set(thaiAddressData.map((d: any) => d.province))).sort();
  const amphoes = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province).map((d: any) => d.amphoe))).sort();
  const districts = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province && d.amphoe === formData.addr_district).map((d: any) => d.district))).sort();
  const zipcodes = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province && d.amphoe === formData.addr_district && d.district === formData.addr_subdistrict).map((d: any) => d.zipcode)));

  const setField = (key: keyof Employee, value: any) => setFormData(f => ({ ...f, [key]: value }));

  const setLicenseField = (index: number, key: keyof ProfessionalLicense, value: any) => {
    setFormData(f => {
      const updated = [...(f.licenses || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...f, licenses: updated };
    });
  };

  const handleAddLicense = () => {
    setFormData(f => {
      const current = f.licenses || [];
      return { ...f, licenses: [...current, { license_name: '', license_type: '', license_no: '', institution: '', issue_date: '', expire_date: '', status: 'ปกติ' }] };
    });
  };
  const handleRemoveLicense = (index: number) => {
    setFormData(f => {
      const updated = [...(f.licenses || [])];
      updated.splice(index, 1);
      return { ...f, licenses: updated };
    });
  };

  const handleSaveSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();

    // --- Validation ---
    if (!formData.first_name_th || !formData.last_name_th) {
      const Swal = (await import('sweetalert2')).default;
      Swal.fire('ข้อผิดพลาด', 'กรุณาระบุชื่อและนามสกุลพนักงาน', 'error');
      return;
    }
    if (!formData.dept_id) {
      const Swal = (await import('sweetalert2')).default;
      Swal.fire('ข้อผิดพลาด', 'กรุณาเลือกกลุ่มงาน/แผนก', 'error');
      return;
    }
    if (!formData.pos_id) {
      const Swal = (await import('sweetalert2')).default;
      Swal.fire('ข้อผิดพลาด', 'กรุณาระบุตำแหน่งงาน', 'error');
      return;
    }

    let finalPosId = formData.pos_id;
    const isOtherSelected = positions.find(p => p.pos_id === formData.pos_id)?.pos_name === 'อื่นๆ';
    if (isOtherSelected) {
      if (!customPosName.trim()) {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire('ข้อผิดพลาด', 'กรุณาระบุตำแหน่งงานเพิ่มเติม', 'error');
        return;
      }
      try {
        const posRes = await fetch('/api/positions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pos_name: customPosName.trim() })
        });
        const posData = await posRes.json();
        if (posData.pos_id) {
          finalPosId = posData.pos_id;
        } else {
          throw new Error(posData.error || 'Failed to create custom position');
        }
      } catch (error: any) {
        const Swal = (await import('sweetalert2')).default;
        Swal.fire('ข้อผิดพลาด', `เกิดข้อผิดพลาดในการบันทึกตำแหน่งงานใหม่: ${error.message}`, 'error');
        return;
      }
    }

    const fd = new FormData();
    if (imageFile) fd.append('image', imageFile);

    const finalFormData: any = { ...formData, pos_id: finalPosId };

    // Group address fields into full string
    const addrParts = [];
    if (formData.addr_no) addrParts.push(`เลขที่ ${formData.addr_no}`);
    if (formData.addr_moo) addrParts.push(`หมู่ ${formData.addr_moo}`);
    if (formData.addr_village) addrParts.push(`${formData.addr_village}`);
    if (formData.addr_soi) addrParts.push(`ซอย ${formData.addr_soi}`);
    if (formData.addr_road) addrParts.push(`ถนน ${formData.addr_road}`);
    if (formData.addr_subdistrict) addrParts.push(`ตำบล/แขวง ${formData.addr_subdistrict}`);
    if (formData.addr_district) addrParts.push(`อำเภอ/เขต ${formData.addr_district}`);
    if (formData.addr_province) addrParts.push(`จังหวัด ${formData.addr_province}`);
    if (formData.addr_zipcode) addrParts.push(`${formData.addr_zipcode}`);
    finalFormData.address = addrParts.join(' ');

    const filteredLicenses = (formData.licenses || []).filter(l => l.license_name && l.license_no);
    fd.append('licenses_data', JSON.stringify(filteredLicenses.map(l => {
      const { file, files, previewUrl, ...rest } = l as any;
      return rest;
    })));

    filteredLicenses.forEach((l: any, idx) => {
      if (l.files && l.files.length > 0) {
        l.files.forEach((f: File, fIdx: number) => {
          fd.append(`license_file_${idx}_${fIdx}`, f);
        });
        fd.append(`license_file_count_${idx}`, String(l.files.length));
      } else if (l.file) {
        fd.append(`license_file_${idx}_0`, l.file);
        fd.append(`license_file_count_${idx}`, '1');
      }
    });

    Object.entries(finalFormData).forEach(([k, v]) => {
      if (k !== 'licenses' && k !== 'license_file' && v !== null && v !== undefined) {
        fd.append(k, String(v));
      }
    });

    setSaving(true);
    await onSave(fd, isEditing);
    setSaving(false);
  };

  // Hierarchical Helpers
  const divisions = (Array.from(new Set(departments.map(d => d.division?.trim()))).filter(Boolean) as string[]).sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || '999');
    const numB = parseInt(b.match(/^\d+/)?.[0] || '999');
    return numA - numB || a.localeCompare(b, 'th');
  });

  if (!isOpen) return null;

  const inputStyle = { width: '100%', padding: '10px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '14px' };
  const addrInputStyle = { width: '100%', padding: '8px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'border-color 0.2s', fontSize: '13px' };

  return (
    <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', zIndex: 1000, padding: '20px', animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal-box" style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '960px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1)', border: 'none', position: 'relative', overflow: 'hidden' }}>

        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: viewMode ? '#eff6ff' : isEditing ? '#fff7ed' : '#f0fdf4', color: viewMode ? '#3b82f6' : isEditing ? '#f97316' : '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {viewMode ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              ) : isEditing ? (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>{viewMode ? 'ข้อมูลบุคลากร' : isEditing ? 'แก้ไขข้อมูลบุคลากร' : 'ลงทะเบียนบุคลากรใหม่'}</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>{viewMode ? 'รายละเอียดข้อมูลพนักงานในระบบ' : 'กรอกข้อมูลรายละเอียดของพนักงานให้ครบถ้วนเพื่อบันทึกลงในระบบ'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="no-scrollbar">
          <form onSubmit={handleSaveSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault(); }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <fieldset disabled={viewMode} style={{ border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* === Section 1: ข้อมูลส่วนตัว === */}
              <div style={{ background: '#f8fafc', borderRadius: '28px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#3b82f6', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>
                  SECTION 01
                </div>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  ข้อมูลส่วนบุคคล
                </h4>

                <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '140px', height: '160px', position: 'relative', borderRadius: '24px', background: '#ffffff', border: '2px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)' }} onClick={() => document.getElementById('imageUpload')?.click()}>
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e: any) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>';
                          }}
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>อัปโหลดรูปภาพ</span>
                        </div>
                      )}
                    </div>
                    <input id="imageUpload" type="file" accept="image/*" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                    }} style={{ display: 'none' }} />
                  </div>

                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>คำนำหน้า</label>
                      <CustomSelect
                        value={formData.prefix || ''}
                        onChange={val => setField('prefix', val)}
                        options={[
                          { value: 'นาย', label: 'นาย' },
                          { value: 'นาง', label: 'นาง' },
                          { value: 'นางสาว', label: 'นางสาว' },
                          { value: 'นพ.', label: 'นพ.' },
                          { value: 'พญ.', label: 'พญ.' }
                        ]}
                        placeholder="เลือกคำนำหน้า"
                        minWidth="100%"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>รหัสบัตรประชาชน</label>
                      <input type="text" placeholder="X-XXXX-XXXXX-XX-X" value={formData.citizen_id || ''} onChange={e => setField('citizen_id', e.target.value)} maxLength={13} style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ชื่อ (ภาษาไทย) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="ระบุชื่อย่อไทย" value={formData.first_name_th || ''} onChange={e => setField('first_name_th', e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>นามสกุล (ภาษาไทย) <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" placeholder="ระบุนามสกุลไทย" value={formData.last_name_th || ''} onChange={e => setField('last_name_th', e.target.value)} required style={inputStyle} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ชื่อเล่น</label>
                      <input type="text" placeholder="ระบุชื่อเล่น" value={formData.nickname || ''} onChange={e => setField('nickname', e.target.value)} style={inputStyle} />
                    </div>


                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เบอร์โทรศัพท์</label>
                      <input
                        type="text"
                        placeholder="08X-XXXXXXX"
                        value={formData.phone || ''}
                        maxLength={10}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setField('phone', val);
                        }}
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>อีเมล</label>
                      <input type="email" placeholder="example@email.com" value={formData.email || ''} onChange={e => setField('email', e.target.value)} style={inputStyle} />
                    </div>



                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <ThaiDateInput
                        label="วัน/เดือน/ปีเกิด"
                        value={String(formData.birth_date || '')}
                        onChange={(val: string) => setField('birth_date', val)}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เพศ</label>
                      <CustomSelect
                        value={formData.gender || ''}
                        onChange={val => setField('gender', val)}
                        options={[
                          { value: 'ชาย', label: 'ชาย' },
                          { value: 'หญิง', label: 'หญิง' }
                        ]}
                        minWidth="100%"
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '24px', padding: '20px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>ที่อยู่ปัจจุบันตามทะเบียนบ้าน</label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>เลขที่</span>
                      <input type="text" value={formData.addr_no || ''} onChange={e => setField('addr_no', e.target.value)} style={addrInputStyle} placeholder="เช่น 123/4" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>หมู่ที่</span>
                      <input type="text" value={formData.addr_moo || ''} onChange={e => setField('addr_moo', e.target.value)} style={addrInputStyle} placeholder="เช่น ม.5" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>หมู่บ้าน / อาคาร</span>
                      <input type="text" value={formData.addr_village || ''} onChange={e => setField('addr_village', e.target.value)} style={addrInputStyle} placeholder="ชื่อหมู่บ้านหรือคอนโด" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>ซอย</span>
                      <input type="text" value={formData.addr_soi || ''} onChange={e => setField('addr_soi', e.target.value)} style={addrInputStyle} placeholder="เช่น ซอย 2" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>ถนน</span>
                      <input type="text" value={formData.addr_road || ''} onChange={e => setField('addr_road', e.target.value)} style={addrInputStyle} placeholder="เช่น ถ.สุขุมวิท" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>จังหวัด</span>
                      <input type="text" list="prov-list" value={formData.addr_province || ''} onChange={e => {
                        setField('addr_province', e.target.value); setField('addr_district', ''); setField('addr_subdistrict', ''); setField('addr_zipcode', '');
                      }} style={addrInputStyle} placeholder="พิมพ์หรือเลือกจังหวัด" />
                      <datalist id="prov-list">{provinces.map(p => <option key={p as string} value={p as string} />)}</datalist>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>อำเภอ / เขต</span>
                      <select value={formData.addr_district || ''} disabled={!formData.addr_province} onChange={e => {
                        setField('addr_district', e.target.value); setField('addr_subdistrict', ''); setField('addr_zipcode', '');
                      }} style={{ ...addrInputStyle, cursor: formData.addr_province ? 'pointer' : 'not-allowed', opacity: formData.addr_province ? 1 : 0.6 }}>
                        <option value="">เลือกอำเภอ</option>
                        {amphoes.map(a => <option key={a as string} value={a as string}>{a as string}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>ตำบล / แขวง</span>
                      <select value={formData.addr_subdistrict || ''} disabled={!formData.addr_district} onChange={e => {
                        setField('addr_subdistrict', e.target.value);
                        const matchedZipcodes = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province && d.amphoe === formData.addr_district && d.district === e.target.value).map((d: any) => d.zipcode)));
                        if (matchedZipcodes.length === 1) setField('addr_zipcode', String(matchedZipcodes[0])); else setField('addr_zipcode', '');
                      }} style={{ ...addrInputStyle, cursor: formData.addr_district ? 'pointer' : 'not-allowed', opacity: formData.addr_district ? 1 : 0.6 }}>
                        <option value="">เลือกตำบล</option>
                        {districts.map(d => <option key={d as string} value={d as string}>{d as string}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>รหัสไปรษณีย์</span>
                      {zipcodes.length > 1 ? (
                        <select value={formData.addr_zipcode || ''} disabled={!formData.addr_subdistrict} onChange={e => setField('addr_zipcode', e.target.value)} style={{ ...addrInputStyle, cursor: formData.addr_subdistrict ? 'pointer' : 'not-allowed', opacity: formData.addr_subdistrict ? 1 : 0.6 }}>
                          <option value="">เลือกรหัส</option>{zipcodes.map(z => <option key={z as string} value={z as string}>{z as string}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={formData.addr_zipcode || ''} onChange={e => setField('addr_zipcode', e.target.value)} style={addrInputStyle} placeholder="10xxx" readOnly={zipcodes.length === 1} />
                      )}
                    </div>
                  </div>
                  {isEditing && formData.address && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                      <span style={{ fontSize: '12px', color: '#f97316', fontWeight: 600 }}>⚠️ ข้อมูลที่อยู่ดั้งเดิม (Old Address Data)</span>
                      <textarea rows={2} value={formData.address || ''} readOnly style={{ ...addrInputStyle, background: '#fff7ed', border: '1px solid #fdba74' }}></textarea>
                    </div>
                  )}
                </div>
              </div>

              {/* === Section 2: ข้อมูลการทำงาน === */}
              <div style={{ background: '#f8fafc', borderRadius: '28px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative', marginTop: '32px' }}>
                <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#10b981', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>
                  SECTION 02
                </div>
                <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  ข้อมูลการทำงานและวิชาชีพ
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เลขประจำตำแหน่ง</label>
                    <input type="text" value={formData.position_no || ''} onChange={e => setField('position_no', e.target.value)} style={inputStyle} placeholder="ระบุเลขประจำตำแหน่ง" />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ThaiDateInput
                      label="วันที่เริ่มงาน"
                      value={String(formData.start_date || '')}
                      onChange={(val: string) => setField('start_date', val)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ThaiDateInput
                      label="วันที่เกษียณ (ออโต้)"
                      value={String(formData.retirement_date || '')}
                      onChange={(val: string) => setField('retirement_date', val)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ประเภทการจ้างงาน</label>
                    <CustomSelect
                      value={formData.emp_type || ''}
                      onChange={val => setField('emp_type', val)}
                      options={[
                        { value: 'ข้าราชการ', label: 'ข้าราชการ' },
                        { value: 'ลูกจ้างประจำ', label: 'ลูกจ้างประจำ' },
                        { value: 'พนักงานราชการ', label: 'พนักงานราชการ' },
                        { value: 'พนักงานกระทรวงสาธารณสุข', label: 'พนักงานกระทรวงสาธารณสุข' },
                        { value: 'ลูกจ้างรายเดือน', label: 'ลูกจ้างรายเดือน' },
                        { value: 'ลูกจ้างรายวัน', label: 'ลูกจ้างรายวัน' },
                        { value: 'ลูกจ้างเหมาบริการ', label: 'ลูกจ้างเหมาบริการ' },
                        { value: 'ลูกจ้างแบ่งเปอร์เซนต์', label: 'ลูกจ้างแบ่งเปอร์เซนต์' },
                        { value: 'ลูกจ้างชั่วคราวที่อายุ 60 ปี', label: 'ลูกจ้างชั่วคราวที่อายุ 60 ปี' },
                        { value: 'นักศึกษาฝึกงาน', label: 'นักศึกษาฝึกงาน' }
                      ]}
                      minWidth="100%"
                    />

                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>สถานะพนักงาน</label>
                    <CustomSelect
                      value={formData.status || ''}
                      onChange={val => setField('status', val)}
                      options={[
                        { value: 'ทำงานปกติ', label: 'ทำงานปกติ' },
                        { value: 'ทดลองงาน', label: 'ทดลองงาน' },
                        { value: 'ลาศึกษา', label: 'ลาศึกษา' },
                        { value: 'หยุดปฏิบัติงาน', label: 'หยุดปฏิบัติงาน' },
                        { value: 'เกษียณอายุ 60 ปีขึ้นไป', label: 'เกษียณอายุ 60 ปีขึ้นไป' },
                        { value: 'ให้ออก', label: 'ให้ออก' }
                      ]}
                      minWidth="100%"
                    />
                  </div>
                  {isAdmin && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>สิทธิ์ผู้ใช้งาน</label>
                        <CustomSelect
                          value={formData.role || 'User'}
                          onChange={val => setField('role', val)}
                          options={[
                            { value: 'User', label: 'User (พนักงานทั่วไป)' },
                            { value: 'Head', label: 'Head (หัวหน้าแผนก)' },
                            { value: 'Admin', label: 'Admin (ผู้ดูแลระบบ)' }
                          ]}
                          minWidth="100%"
                        />
                      </div>
                    </>
                  )}
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 800, color: '#475569', fontSize: '13px', marginBottom: '-8px' }}>กลุ่มงาน และ ตำแหน่งงาน</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>กลุ่มงาน <span style={{ color: '#ef4444' }}>*</span></label>
                        <CustomSelect
                          value={selectedDivision}
                          onChange={div => {
                            setSelectedDivision(div);
                            setField('dept_id', '');
                          }}
                          options={[
                            { value: '', label: 'เลือกกลุ่มงาน' },
                            ...divisions.map(d => ({ value: d, label: d }))
                          ]}
                          minWidth="100%"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>แผนก <span style={{ color: '#ef4444' }}>*</span></label>
                        <CustomSelect
                          value={formData.dept_id || ''}
                          onChange={val => setField('dept_id', val)}
                          options={[
                            { value: '', label: 'เลือกแผนก' },
                            ...(() => {
                              const filtered = departments.filter(d => d.division?.trim() === selectedDivision?.trim());
                              // Filter by unique name to avoid duplicates in the UI
                              const uniqueDepts = filtered.filter((d, idx, self) => 
                                idx === self.findIndex((t) => t.dept_name?.trim() === d.dept_name?.trim())
                              );
                              return uniqueDepts.map(s => ({ value: s.dept_id, label: s.dept_name }));
                            })()
                          ]}
                          minWidth="100%"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                          ตำแหน่งงาน <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative', width: '100%' }}>
                          <input 
                            type="text" 
                            style={{ ...inputStyle }} 
                            placeholder="พิมพ์ค้นหาตำแหน่ง..."
                            value={posSearch || (positions.find(p => p.pos_id === formData.pos_id)?.pos_name || '')}
                            onFocus={() => setIsPosOpen(true)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setPosSearch(val);
                              setIsPosOpen(true);
                              
                              const found = positions.find(p => p.pos_name === val);
                              if (found) {
                                setField('pos_id', found.pos_id);
                              } else if (val === '') {
                                setField('pos_id', '');
                              }
                            }} 
                          />
                          {isPosOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)', zIndex: 100, padding: '6px' }}>
                              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }} className="custom-scrollbar">
                                {positions
                                  .filter(p => !posSearch || p.pos_name.toLowerCase().includes(posSearch.toLowerCase()))
                                  .map((p: any) => (
                                    <div 
                                      key={p.pos_id}
                                      onClick={() => { setField('pos_id', p.pos_id); setPosSearch(p.pos_name); setIsPosOpen(false); }}
                                      style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: formData.pos_id === p.pos_id ? '#eff6ff' : 'transparent', color: formData.pos_id === p.pos_id ? '#1d4ed8' : '#334155', fontWeight: formData.pos_id === p.pos_id ? 700 : 500, fontSize: '13px' }}
                                      onMouseEnter={e => { if(formData.pos_id !== p.pos_id) e.currentTarget.style.background = '#f1f5f9'; }}
                                      onMouseLeave={e => { if(formData.pos_id !== p.pos_id) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                      {p.pos_name}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                          {isPosOpen && <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 90 }} onClick={() => setIsPosOpen(false)} />}
                        </div>
                        {positions.find(p => p.pos_id === formData.pos_id)?.pos_name === 'อื่นๆ' && (
                          <div style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', display: 'block', marginBottom: '4px' }}>
                              ระบุตำแหน่งงานเพิ่มเติม <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={customPosName}
                              onChange={e => setCustomPosName(e.target.value)}
                              style={inputStyle}
                              placeholder="เช่น พนักงานขับรถ"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ปฏิบัติงานที่</label>
                    <input type="text" value={formData.working_at || ''} onChange={e => setField('working_at', e.target.value)} style={inputStyle} placeholder="ระบุสถานที่ปฏิบัติงาน" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ThaiDateInput
                      label="วันที่บรรจุ (Admission Date)"
                      value={String(formData.admission_date || '')}
                      onChange={(val: string) => setField('admission_date', val)}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <ThaiDateInput
                      label="วันที่เกษียณ (Retirement Date)"
                      value={String(formData.retirement_date || '')}
                      onChange={(val: string) => setField('retirement_date', val)}
                    />
                  </div>
                </div>


                {/* Professional Licenses Sub-section */}
                <div style={{ marginTop: '24px', background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>ข้อมูลใบประกอบวิชาชีพ</label>
                    <div style={{ display: 'flex', gap: '15px', background: '#f1f5f9', padding: '6px 12px', borderRadius: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" checked={formData.has_license === true || (formData.has_license as any) === 1} onChange={() => setField('has_license', true)} style={{ width: '16px', height: '16px' }} />
                        มีใบประกอบวิชาชีพ / ใบรับรอง
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" checked={formData.has_license !== true && (formData.has_license as any) !== 1} onChange={() => setField('has_license', false)} style={{ width: '16px', height: '16px' }} />
                        ไม่มี
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: (formData.has_license === true || (formData.has_license as any) === 1) ? 1 : 0.5, pointerEvents: (formData.has_license === true || (formData.has_license as any) === 1) ? 'auto' : 'none', transition: 'all 0.3s' }}>


                    {(formData.licenses || []).map((lic, index) => (
                      <div key={index} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>ใบรับรองที่ {index + 1}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {lic.license_no && (
                              <button type="button" onClick={() => fetchLicenseHistory(lic.license_no!, lic.license_name || '')} style={{ padding: '4px 10px', fontSize: '12px', color: '#3b82f6', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                🕒 ประวัติ
                              </button>
                            )}
                            <button type="button" onClick={() => handleRemoveLicense(index)} style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>ลบทิ้ง</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: '#64748b' }}>ชื่อใบประกอบวิชาชีพ</label>
                            <input type="text" value={lic.license_name || ''} onChange={e => setLicenseField(index, 'license_name', e.target.value)} style={addrInputStyle} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: '#64748b' }}>ประเภทวิชาชีพ</label>
                            <input type="text" value={lic.license_type || ''} onChange={e => setLicenseField(index, 'license_type', e.target.value)} style={addrInputStyle} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '12px', color: '#64748b' }}>เลขที่ใบประกอบวิชาชีพ</label>
                            <input type="text" value={lic.license_no || ''} onChange={e => setLicenseField(index, 'license_no', e.target.value)} style={addrInputStyle} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <ThaiDateInput
                              label="วันที่ออกบัตร"
                              value={String(lic.issue_date || '')}
                              onChange={(val: string) => setLicenseField(index, 'issue_date', val)}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <ThaiDateInput
                              label="วันหมดอายุ (Expire Date)"
                              value={String(lic.expire_date || '')}
                              onChange={(val: string) => setLicenseField(index, 'expire_date', val)}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                          <label style={{ fontSize: '12px', color: '#64748b' }}>ไฟล์ภาพอ้างอิง (Image / PDF)</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <button type="button" onClick={() => document.getElementById(`licenseFile_${index}`)?.click()} style={{ padding: '6px 14px', background: '#cbd5e1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>เลือกไฟล์แนบ</button>
                              <input id={`licenseFile_${index}`} type="file" multiple accept="image/*,.pdf" onChange={e => {
                                const newFiles = Array.from(e.target.files || []);
                                if (newFiles.length > 0) {
                                  const existingFiles = (lic as any).files || [];
                                  const mergedFiles = [...existingFiles, ...newFiles];
                                  setLicenseField(index, 'files', mergedFiles);
                                  setLicenseField(index, 'file', mergedFiles[0]); // fallback
                                }
                                e.target.value = ''; // Reset input to allow selecting the same file again
                              }} style={{ display: 'none' }} />
                            </div>

                            {/* แสดงไฟล์ที่เพิ่งเลือก (New files) */}
                            {((lic as any).files && (lic as any).files.length > 0) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>ไฟล์ที่เลือกใหม่:</span>
                                {Array.from((lic as any).files as File[]).map((f, fi) => (
                                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <a href={URL.createObjectURL(f)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      📄 {f.name}
                                    </a>
                                    <button type="button" onClick={() => {
                                      const updated = [...(lic as any).files];
                                      updated.splice(fi, 1);
                                      setLicenseField(index, 'files', updated);
                                      if (updated.length > 0) setLicenseField(index, 'file', updated[0]);
                                      else setLicenseField(index, 'file', null);
                                    }} style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>ลบ</button>
                                  </div>
                                ))}
                              </div>
                            ) : (lic as any).file ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>ไฟล์ที่เลือกใหม่:</span>
                                <a href={URL.createObjectURL((lic as any).file)} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#10b981', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  📄 {(lic as any).file.name}
                                </a>
                              </div>
                            ) : null}

                            {/* แสดงไฟล์เดิมในระบบ (Existing files) */}
                            {!((lic as any).files && (lic as any).files.length > 0) && !(lic as any).file && lic.file_path && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>ไฟล์ในระบบ:</span>
                                {(() => {
                                  let fileList: string[] = [];
                                  try {
                                    if (typeof lic.file_path === 'string' && lic.file_path.startsWith('[')) {
                                      const parsed = JSON.parse(lic.file_path);
                                      if (Array.isArray(parsed)) fileList = parsed;
                                      else fileList = [lic.file_path as string];
                                    } else if (Array.isArray(lic.file_path)) {
                                      fileList = lic.file_path;
                                    } else if (lic.file_path) {
                                      fileList = [lic.file_path as string];
                                    }
                                  } catch (e) {
                                    fileList = typeof lic.file_path === 'string' ? [lic.file_path] : (lic.file_path || []);
                                  }

                                  return fileList.map((fPath, fi) => (
                                    <a key={fi} href={`/uploads/${fPath}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      📎 ไฟล์แนบที่ {fi + 1}
                                    </a>
                                  ));
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={handleAddLicense} style={{ padding: '10px', background: '#eff6ff', color: '#3b82f6', border: '1px dashed #93c5fd', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', marginTop: '10px' }}>+ เพิ่มใบประกอบวิชาชีพ</button>
                  </div>
                </div>

              </div>
            </fieldset>
          </form>
        </div>

        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#ffffff', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ padding: '10px 24px', borderRadius: '50px', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer' }}>ยกเลิก</button>
          {!viewMode && (
            <button type="button" onClick={handleSaveSubmit} disabled={saving} style={{ padding: '10px 24px', borderRadius: '50px', fontWeight: 600, background: '#3b82f6', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          )}
        </div>

      </div>

      {/* --- License History Sub-Modal --- */}
      {historyModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>ประวัติการต่ออายุ: {historyLicenseName}</h4>
              <button onClick={() => setHistoryModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ลำดับ</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>เลขที่ใบประกอบวิชาชีพ</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>วันหมดอายุ</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>สถานะ</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>ปรับปรุงเมื่อ</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((h, i) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{historyData.length - i}</td>
                      <td style={{ padding: '12px' }}>{h.license_no}</td>
                      <td style={{ padding: '12px' }}>{h.expire_date ? new Date(h.expire_date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                          background: (h.status === 'Active' || h.status === 'ทำงานปกติ' || h.status === 'ปกติ') ? '#dcfce7' : h.status === 'Renewed' ? '#dbeafe' : '#fee2e2',
                          color: (h.status === 'Active' || h.status === 'ทำงานปกติ' || h.status === 'ปกติ') ? '#166534' : h.status === 'Renewed' ? '#1e40af' : '#991b1b'
                        }}>
                          {h.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{h.created_at ? new Date(h.created_at).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    </tr>
                  ))}
                  {historyData.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>ไม่พบข้อมูลประวัติ</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #eee', textAlign: 'right' }}>
              <button onClick={() => setHistoryModalOpen(false)} style={{ padding: '8px 20px', background: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
