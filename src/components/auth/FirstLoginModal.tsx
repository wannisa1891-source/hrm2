'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import CustomSelect from '@/components/CustomSelect';

export default function FirstLoginModal() {
  const { isFirstLogin, user, setFirstLogin } = useAuth();
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    prefix: 'นาย',
    first_name_th: '',
    last_name_th: '',
    nickname: '',
    phone: '',
    email: '',
    birth_date: '',
    gender: 'ชาย',
    addr_no: '',
    addr_moo: '',
    addr_village: '',
    addr_soi: '',
    addr_road: '',
    addr_province: '',
    addr_district: '',
    addr_subdistrict: '',
    addr_zipcode: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thaiAddressData, setThaiAddressData] = useState<any[]>([]);

  useEffect(() => {
    if (isFirstLogin) {
      setShow(true);
      fetch('/data/thai_address.json')
        .then(r => r.json())
        .then(data => setThaiAddressData(Array.isArray(data) ? data : []))
        .catch(err => console.error('Failed to load address data', err));
    }
  }, [isFirstLogin]);

  const provinces = Array.from(new Set(thaiAddressData.map((d: any) => d.province))).sort();
  const amphoes = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province).map((d: any) => d.amphoe))).sort();
  const districts = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province && d.amphoe === formData.addr_district).map((d: any) => d.district))).sort();
  const zipcodes = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province && d.amphoe === formData.addr_district && d.district === formData.addr_subdistrict).map((d: any) => d.zipcode)));

  const setField = (key: string, value: any) => setFormData((f: any) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name_th || !formData.last_name_th || !formData.phone) {
      Swal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'warning');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (imageFile) fd.append('image', imageFile);

      // Group address
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
      
      const fullAddress = addrParts.join(' ');

      Object.entries(formData).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, String(v));
      });
      fd.append('address', fullAddress);

      const res = await fetch(`/api/employees/${user?.emp_id}`, {
        method: 'PUT',
        body: fd,
      });

      if (res.ok) {
        Swal.fire({
          title: 'บันทึกสำเร็จ!',
          text: 'ยินดีต้อนรับสู่ระบบบริหารจัดการบุคลากร',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        setFirstLogin(false);
        setShow(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  const inputStyle = { width: '100%', padding: '10px 16px', borderRadius: '14px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'all 0.2s', fontSize: '14px' };
  const addrInputStyle = { width: '100%', padding: '8px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#ffffff', outline: 'none', transition: 'all 0.2s', fontSize: '13px' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, animation: 'fadeIn 0.2s ease-out', padding: '20px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-box { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />

      <div className="modal-box" style={{ background: '#ffffff', borderRadius: '32px', width: '100%', maxWidth: '900px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
               <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>ยินดีต้อนรับ! กรุณาอัปเดตข้อมูลส่วนตัว</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>กรุณากรอกข้อมูลรายละเอียดของคุณให้ครบถ้วนเพื่อเริ่มใช้งานระบบ</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="no-scrollbar">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* SECTION 01 */}
            <div style={{ background: '#f8fafc', borderRadius: '28px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#3b82f6', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}>SECTION 01</div>
              <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>ข้อมูลส่วนบุคคล</h4>
              
              <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Photo Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '140px', height: '160px', borderRadius: '24px', background: '#ffffff', border: '2px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('imageUploadFirst')?.click()}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>อัปโหลดรูปภาพ</span>
                      </div>
                    )}
                  </div>
                  <input id="imageUploadFirst" type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                  }} style={{ display: 'none' }} />
                </div>

                {/* Fields */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>คำนำหน้า</label>
                    <CustomSelect
                      value={formData.prefix}
                      onChange={val => setField('prefix', val)}
                      options={[{value:'นาย',label:'นาย'},{value:'นาง',label:'นาง'},{value:'นางสาว',label:'นางสาว'}]}
                      minWidth="100%"
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ชื่อ (ภาษาไทย) *</label>
                    <input type="text" value={formData.first_name_th} onChange={e => setField('first_name_th', e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>นามสกุล (ภาษาไทย) *</label>
                    <input type="text" value={formData.last_name_th} onChange={e => setField('last_name_th', e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>ชื่อเล่น</label>
                    <input type="text" value={formData.nickname} onChange={e => setField('nickname', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เบอร์โทรศัพท์ *</label>
                    <input type="text" value={formData.phone} onChange={e => setField('phone', e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>อีเมล</label>
                    <input type="email" value={formData.email} onChange={e => setField('email', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>วัน/เดือน/ปีเกิด *</label>
                    <input type="date" value={formData.birth_date} onChange={e => setField('birth_date', e.target.value)} required style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>เพศ</label>
                    <CustomSelect
                      value={formData.gender}
                      onChange={val => setField('gender', val)}
                      options={[{value:'ชาย',label:'ชาย'},{value:'หญิง',label:'หญิง'}]}
                      minWidth="100%"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 02 */}
            <div style={{ background: '#f8fafc', borderRadius: '28px', padding: '28px', border: '1px solid #e2e8f0', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-14px', left: '24px', background: '#10b981', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}>SECTION 02</div>
              <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>ข้อมูลที่อยู่</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>เลขที่</span>
                  <input type="text" value={formData.addr_no} onChange={e => setField('addr_no', e.target.value)} style={addrInputStyle} placeholder="เช่น 123/4" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>หมู่ที่</span>
                  <input type="text" value={formData.addr_moo} onChange={e => setField('addr_moo', e.target.value)} style={addrInputStyle} placeholder="เช่น ม.5" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>หมู่บ้าน / อาคาร</span>
                  <input type="text" value={formData.addr_village} onChange={e => setField('addr_village', e.target.value)} style={addrInputStyle} placeholder="ชื่อหมู่บ้านหรือคอนโด" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>ซอย</span>
                  <input type="text" value={formData.addr_soi} onChange={e => setField('addr_soi', e.target.value)} style={addrInputStyle} placeholder="ซอย..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>ถนน</span>
                  <input type="text" value={formData.addr_road} onChange={e => setField('addr_road', e.target.value)} style={addrInputStyle} placeholder="ถนน..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>จังหวัด</span>
                  <input type="text" list="prov-list-first" value={formData.addr_province} onChange={e => {
                    setField('addr_province', e.target.value); setField('addr_district', ''); setField('addr_subdistrict', ''); setField('addr_zipcode', '');
                  }} style={addrInputStyle} placeholder="เลือกจังหวัด" />
                  <datalist id="prov-list-first">{provinces.map(p => <option key={p} value={p} />)}</datalist>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>อำเภอ / เขต</span>
                  <select value={formData.addr_district} disabled={!formData.addr_province} onChange={e => {
                    setField('addr_district', e.target.value); setField('addr_subdistrict', ''); setField('addr_zipcode', '');
                  }} style={{ ...addrInputStyle, opacity: formData.addr_province ? 1 : 0.6 }}>
                    <option value="">เลือกอำเภอ</option>
                    {amphoes.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>ตำบล / แขวง</span>
                  <select value={formData.addr_subdistrict} disabled={!formData.addr_district} onChange={e => {
                    setField('addr_subdistrict', e.target.value);
                    const mz = Array.from(new Set(thaiAddressData.filter((d: any) => d.province === formData.addr_province && d.amphoe === formData.addr_district && d.district === e.target.value).map((d: any) => d.zipcode)));
                    if (mz.length === 1) setField('addr_zipcode', String(mz[0])); else setField('addr_zipcode', '');
                  }} style={{ ...addrInputStyle, opacity: formData.addr_district ? 1 : 0.6 }}>
                    <option value="">เลือกตำบล</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>รหัสไปรษณีย์</span>
                  <input type="text" value={formData.addr_zipcode} onChange={e => setField('addr_zipcode', e.target.value)} style={addrInputStyle} placeholder="10xxx" />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9' }}>
          <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: '12px 32px', borderRadius: '50px', fontWeight: 600, background: '#3b82f6', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)', fontSize: '16px' }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลและเริ่มใช้งาน'}
          </button>
        </div>
      </div>
    </div>
  );
}
