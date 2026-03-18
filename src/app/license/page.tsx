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
}

function getStatus(days: number) {
  if (days < 0) return { label: 'หมดอายุแล้ว', cls: 'badge-red', icon: '❌' };
  if (days <= 30) return { label: `ใกล้หมด (ใน ${days} วัน)`, cls: 'badge-red', icon: '⚠️' };
  if (days <= 90) return { label: `เหลือ ${days} วัน`, cls: 'badge-yellow', icon: '⏳' };
  return { label: 'ปกติ', cls: 'badge-green', icon: '✅' };
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
      if (activeModal === 'renew') {
        res = await fetch('/api/licenses/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            license_id: selectedLicense?.license_id,
            emp_id: selectedLicense?.emp_id,
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
      alert('ไม่สามารถลบรายการนี้ได้ (เป็นข้อมูลพื้นฐานจากทะเบียนพนักงาน)');
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
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 ใบประกอบวิชาชีพ</h1>
          <p className="page-subtitle">จัดการและติดตามวันหมดอายุใบอนุญาตประกอบวิชาชีพ</p>
        </div>
        <button className="btn-primary" style={{ display: 'none' }} onClick={() => handleOpenModal('add')}>
          + เพิ่มใบประกอบ
        </button>
      </div>

      {/* Summary Cards */}
      <div className="license-summary-grid">
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>📋</div>
          <div className="summary-info">
            <h4>ทั้งหมด</h4>
            <div>{total} รายการ</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#fffbeb', color: '#b45309' }}>⏳</div>
          <div className="summary-info">
            <h4>ใกล้หมดอายุ</h4>
            <div>{expiringCount} รายการ</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon" style={{ background: '#fef2f2', color: '#b91c1c' }}>❌</div>
          <div className="summary-info">
            <h4>หมดอายุแล้ว</h4>
            <div>{expiredCount} รายการ</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '16px 24px' }}>
        <div className="filter-bar">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อพนักงาน, รหัส หรือเลขบรรจุ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: 160 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">ทั้งหมดทุกสถานะ</option>
            <option value="normal">ปกติ (เหลือเกิน 90 วัน)</option>
            <option value="expiring">ใกล้หมดอายุ (ภายใน 90 วัน)</option>
            <option value="expired">หมดอายุแล้ว</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>ประเภท</th>
              <th>เลขที่ใบอนุญาต</th>
              <th>คะแนน (CNEU/CME)</th>
              <th>หมดอายุ</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>กำลังค้นหาข้อมูล...</td></tr>
            ) : licenses.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>ไม่พบข้อมูลที่ตรงกับการค้นหา</td></tr>
            ) : (
              licenses.map(l => {
                const status = getStatus(l.daysLeft);
                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.name} <small style={{ display: 'block', fontWeight: 400, color: '#94a3b8' }}>ID: {l.emp_id}</small></td>
                    <td style={{ fontSize: 13 }}>{l.type}</td>
                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{l.license_no || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, color: l.points >= 50 ? '#16a34a' : '#1e293b' }}>{l.points}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{l.expires}</td>
                    <td><span className={`badge ${status.cls}`}>{status.icon} {status.label}</span></td>
                    <td>
                      <div className="action-btn-group">
                        <button 
                          onClick={() => handleOpenModal('renew', l)}
                          className={l.daysLeft <= 90 ? 'btn-renew-urgent' : 'btn-renew-normal'}
                          title="ต่ออายุ"
                        >
                          ต่ออายุ
                        </button>
                        <button onClick={() => handleOpenModal('edit', l)} className="icon-btn icon-btn-edit" title="แก้ไข">✏️</button>
                        <button onClick={() => handleDelete(l)} className="icon-btn icon-btn-delete" title="ลบ">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {activeModal !== 'none' && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: activeModal === 'renew' ? 500 : 550 }}>
            <div className="modal-header">
              <h3>
                {activeModal === 'renew' ? '🔄 ต่ออายุใบประกอบวิชาชีพ' : 
                 activeModal === 'edit' ? '✏️ แก้ไขข้อมูลใบประกอบ' : '➕ เพิ่มใบประกอบใหม่'}
              </h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>ชื่อ-นามสกุล:</span>
                <span style={{ fontWeight: 600 }}>{selectedLicense?.name}</span>
                <span style={{ color: '#64748b' }}>ประเภท:</span>
                <span style={{ fontWeight: 600 }}>{selectedLicense?.type}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">เลขที่ใบอนุญาต</label>
                  <input 
                    className="form-input" 
                    value={formData.license_no} 
                    onChange={e => setFormData({...formData, license_no: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">วันหมดอายุ <span style={{ color: 'red' }}>*</span></label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={formData.expire_date}
                    onChange={e => setFormData({...formData, expire_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">คะแนน CNEU/CME</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formData.points}
                    onChange={e => setFormData({...formData, points: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-outline" onClick={closeModal} disabled={submitting}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }} disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
