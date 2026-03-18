'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

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
  image: string | null;
  gender: string;
  status: string;
}

function getStatus(days: number) {
  if (days < 0) return { label: 'หมดอายุแล้ว', cls: 'status-expired', color: '#dc2626', bg: '#fee2e2' };
  if (days <= 30) return { label: `ใกล้หมด (ใน ${days} วัน)`, cls: 'status-urgent', color: '#ea580c', bg: '#ffedd5' };
  if (days <= 90) return { label: `เหลือ ${days} วัน`, cls: 'status-warning', color: '#ca8a04', bg: '#fef9c3' };
  return { label: 'ปกติ', cls: 'status-normal', color: '#16a34a', bg: '#dcfce7' };
}

export default function LicensePage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [activeModal, setActiveModal] = useState<'none' | 'renew' | 'edit' | 'add'>('none');
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [formData, setFormData] = useState({
    license_no: '',
    expire_date: '',
    points: 0,
    emp_id: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, [searchTerm, statusFilter]);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const res = await fetch(`/api/licenses?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch licenses');
      const data = await res.json();
      setLicenses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type: 'renew' | 'edit' | 'add', license?: License) => {
    setSelectedLicense(license || null);
    if (license) {
      setFormData({
        license_no: license.license_no || '',
        expire_date: license.expires !== '-' ? license.expires : '',
        points: license.points || 0,
        emp_id: license.emp_id,
      });
    } else {
      setFormData({ license_no: '', expire_date: '', points: 0, emp_id: '' });
    }
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal('none');
    setSelectedLicense(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expire_date) {
      alert('กรุณาระบุวันหมดอายุ');
      return;
    }

    try {
      setSubmitting(true);
      let res;
      if (activeModal === 'renew' || activeModal === 'add') {
        res = await fetch('/api/licenses/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_id: selectedLicense?.license_id,
            emp_id: activeModal === 'add' ? formData.emp_id : selectedLicense?.emp_id,
            expire_date: formData.expire_date,
            license_no: formData.license_no,
          }),
        });
      } else if (activeModal === 'edit') {
        res = await fetch(`/api/licenses/${selectedLicense?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_no: formData.license_no,
            expire_date: formData.expire_date,
            cneu_cme_points: formData.points,
          }),
        });
      }

      if (res && !res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Operation failed');
      }

      await fetchLicenses();
      closeModal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (license: License) => {
    if (!license.license_id) {
      alert('ไม่สามารถลบรายการนี้ได้');
      return;
    }
    if (!confirm('ยืนยันการลบข้อมูลใบประกอบวิชาชีพรายการนี้หรือไม่?')) return;

    try {
      const res = await fetch(`/api/licenses/${license.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchLicenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Summary counts
  const total = licenses.length;
  const expiringCount = licenses.filter(l => l.daysLeft >= 0 && l.daysLeft <= 90).length;
  const expiredCount = licenses.filter(l => l.daysLeft < 0).length;

  return (
    <AppLayout>
      {/* Header Section with Gradient Background */}
      <div className="premium-header-banner" style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '24px',
        padding: '32px 40px',
        color: '#fff',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.5)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
            ใบประกอบวิชาชีพ
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: '#94a3b8', maxWidth: '500px' }}>
            จัดการและติดตามวันหมดอายุใบอนุญาตประกอบวิชาชีพของบุคลากรภายในองค์กร
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal('add')}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 10px 20px -10px rgba(37, 99, 235, 0.6)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative',
            zIndex: 50
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มใบประกอบ
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {[
          { title: 'ทั้งหมด', count: total, color: '#3b82f6', bg: '#eff6ff', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { title: 'ใกล้หมดอายุ', count: expiringCount, color: '#ca8a04', bg: '#fef9c3', iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { title: 'หมดอายุแล้ว', count: expiredCount, color: '#dc2626', bg: '#fef2f2', iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' }
        ].map((card, i) => (
          <div key={i} style={{
            background: 'white',
            borderRadius: '20px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
            border: '1px solid #f1f5f9',
            transition: 'transform 0.2s',
            cursor: 'default'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px', background: card.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.iconPath} />
              </svg>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{card.title}</div>
              <div style={{ color: '#0f172a', fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>{card.count} <span style={{fontSize: '14px', color: '#94a3b8', fontWeight: 500}}>รายการ</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Glass Panel */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)',
        overflow: 'hidden'
      }}>
        {/* Filter Bar */}
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '16px', backgroundColor: '#ffffff' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อพนักงาน, รหัส หรือเลขใบรับรอง..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              fontSize: '15px',
              fontWeight: 500,
              color: '#334155',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '200px'
            }}
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="normal">ปกติ (เหลือเกิน 90 วัน)</option>
            <option value="expiring">ใกล้หมดอายุ (ภายใน 90 วัน)</option>
            <option value="expired">หมดอายุแล้ว</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#ffffff' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>พนักงาน</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>ประเภทใบประกอบ</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>เลขที่ใบอนุญาต</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'center' }}>คะแนนสะสม</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>วันหมดอายุ</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>สถานะ</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>กำลังค้นหาข้อมูล...</td></tr>
              ) : licenses.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>ไม่พบข้อมูลที่ตรงกับการค้นหา</td></tr>
              ) : (
                licenses.map(l => {
                  const status = getStatus(l.daysLeft);
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#e2e8f0', backgroundImage: `url(${l.image ? `/uploads/${l.image}` : (l.gender === 'หญิง' ? '/avatar2.jpg' : '/avatar1.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>{l.name}</div>
                            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>รหัส: {l.emp_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#334155', fontSize: '14px', fontWeight: 500 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px', color: '#475569' }}>
                          {l.type}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', color: '#1e293b' }}>
                        {l.license_no || '-'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ 
                          display: 'inline-block',
                          fontWeight: 700, 
                          fontSize: '15px',
                          color: l.points >= 50 ? '#16a34a' : '#1e293b',
                          background: l.points >= 50 ? '#dcfce7' : '#f1f5f9',
                          padding: '4px 12px',
                          borderRadius: '20px'
                        }}>
                          {l.points}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#334155', fontWeight: 500 }}>{l.expires}</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          display: 'inline-flex', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                          backgroundColor: status.bg, color: status.color, alignItems: 'center', gap: '6px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status.color }}></span>
                          {status.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative', zIndex: 50 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', position: 'relative', zIndex: 50 }}>
                          <button 
                            onClick={() => handleOpenModal('renew', l)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: 'none',
                              background: l.daysLeft <= 90 ? '#ef4444' : '#f1f5f9',
                              color: l.daysLeft <= 90 ? '#ffffff' : '#475569',
                              transition: 'all 0.2s',
                              boxShadow: l.daysLeft <= 90 ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' : 'none'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
                            onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
                          >
                            ต่ออายุ
                          </button>
                          
                          <button 
                            onClick={() => handleOpenModal('edit', l)}
                            style={{ position: 'relative', zIndex: 50, width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(l)}
                            style={{ position: 'relative', zIndex: 50, width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {activeModal !== 'none' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: activeModal === 'renew' ? '#bfdbfe' : activeModal === 'edit' ? '#fef3c7' : '#dcfce7', color: activeModal === 'renew' ? '#2563eb' : activeModal === 'edit' ? '#d97706' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeModal === 'renew' ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : 
                   activeModal === 'edit' ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> : 
                   <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>}
                </div>
                {activeModal === 'renew' ? 'ต่ออายุใบประกอบวิชาชีพ' : activeModal === 'edit' ? 'แก้ไขข้อมูลใบประกอบ' : 'เพิ่มใบประกอบใหม่'}
              </h3>
              <button 
                onClick={closeModal} 
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.background = '#e2e8f0'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div style={{ padding: '32px' }}>
              {activeModal !== 'add' && selectedLicense && (
                <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundImage: `url(${selectedLicense.image ? `/uploads/${selectedLicense.image}` : (selectedLicense.gender === 'หญิง' ? '/avatar2.jpg' : '/avatar1.jpg')})`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '15px' }}>{selectedLicense.name}</div>
                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{selectedLicense.type}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {activeModal === 'add' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>รหัสพนักงาน (EMP-ID) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="เช่น EMP001"
                      style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', outline: 'none', transition: 'border 0.2s', background: '#fff' }}
                      value={formData.emp_id} 
                      onChange={e => setFormData({...formData, emp_id: e.target.value})}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                    />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>เลขที่ใบอนุญาต</label>
                  <input 
                    type="text" 
                    placeholder="กรอกเลขที่ใบรับรอง (ถ้ามี)"
                    style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', outline: 'none', transition: 'border 0.2s', background: '#fff' }}
                    value={formData.license_no} 
                    onChange={e => setFormData({...formData, license_no: e.target.value})}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2 }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>วันหมดอายุ <span style={{ color: '#ef4444' }}>*</span></label>
                    <input 
                      type="date" 
                      required 
                      style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', outline: 'none', transition: 'border 0.2s', background: '#fff' }}
                      value={formData.expire_date}
                      onChange={e => setFormData({...formData, expire_date: e.target.value})}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                    />
                  </div>
                  
                  {activeModal === 'edit' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>คะแนนสะสม</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', width: '100%', outline: 'none', transition: 'border 0.2s', background: '#fff', textAlign: 'center' }}
                        value={formData.points}
                        onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button type="button" onClick={closeModal} disabled={submitting} style={{
                    padding: '12px 24px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
                    ยกเลิก
                  </button>
                  <button type="submit" disabled={submitting} style={{
                    padding: '12px 28px', borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                  }} onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.4)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)'}>
                    {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
