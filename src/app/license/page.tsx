'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

<<<<<<< HEAD
interface License {
  id: string; // unique string for key
  license_id: number | null;
  emp_id: string;
  name: string;
  type: string;
  license_no: string | null;
  issued: string;
  expires: string;
  daysLeft: number;
}
=======
const licenses = [
  { id: 'LC001', name: 'นพ.สมชาย รักษาคน', type: 'ใบประกอบวิชาชีพเวชกรรม', issued: '2021-05-01', expires: '2026-04-30' },
  { id: 'LC002', name: 'นางพิม ใจดี', type: 'ใบอนุญาตพยาบาลวิชาชีพ', issued: '2023-01-15', expires: '2026-04-15' },
  { id: 'LC003', name: 'นายอนันต์ สุขใจ', type: 'ใบอนุญาตเภสัชกรรม', issued: '2022-06-20', expires: '2026-06-19' },
  { id: 'LC004', name: 'นางสาวมณี แก้วใส', type: 'ใบอนุญาตพยาบาลวิชาชีพ', issued: '2020-03-10', expires: '2026-03-09' },
  { id: 'LC005', name: 'นพ.วิชัย ดีมาก', type: 'ใบประกอบวิชาชีพเวชกรรม', issued: '2022-09-01', expires: '2027-08-31' },
];
>>>>>>> c2159edae8da8b26ce95499e557d1df33ac890b5

function getStatus(days: number) {
  if (days < 0) return { label: 'หมดอายุแล้ว', cls: 'badge-red' };
  if (days <= 30) return { label: `หมดใน ${days} วัน`, cls: 'badge-red' };
  if (days <= 90) return { label: `หมดใน ${days} วัน`, cls: 'badge-yellow' };
  return { label: 'ปกติ', cls: 'badge-green' };
}

export default function LicensePage() {
<<<<<<< HEAD
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [newExpireDate, setNewExpireDate] = useState('');
  const [newLicenseNo, setNewLicenseNo] = useState('');
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/licenses');
      if (!res.ok) throw new Error('Failed to fetch licenses');
      const data = await res.json();
      setLicenses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (license: License) => {
    setSelectedLicense(license);
    // Remove default dash when editing
    setNewExpireDate('');
    setNewLicenseNo(license.license_no && license.license_no !== '-' ? license.license_no : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLicense(null);
  };

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicense || !newExpireDate) return;

    try {
      setRenewing(true);
      const res = await fetch('/api/licenses/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_id: selectedLicense.license_id,
          emp_id: selectedLicense.emp_id,
          expire_date: newExpireDate,
          license_no: newLicenseNo || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to renew license');
      }

      await fetchLicenses();
      closeModal();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRenewing(false);
    }
  };

  const expiring = licenses.filter(l => l.daysLeft <= 90);
=======
  const calcDaysLeft = (expDate: string) => {
    const timeDiff = new Date(expDate).getTime() - new Date().getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const processedData = licenses.map(l => ({ ...l, daysLeft: calcDaysLeft(l.expires) })).sort((a,b) => a.daysLeft - b.daysLeft);
  const expiring = processedData.filter(l => l.daysLeft <= 90);
>>>>>>> c2159edae8da8b26ce95499e557d1df33ac890b5

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 ใบประกอบวิชาชีพ</h1>
          <p className="page-subtitle">
            {expiring.length} รายการใกล้หมดอายุหรือหมดแล้ว
          </p>
        </div>
      </div>

<<<<<<< HEAD
      {error && (
        <div style={{ color: 'red', marginBottom: 20 }}>Error: {error}</div>
      )}

      {!loading && !error && expiring.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #4A5644, #2d3436)', borderRadius: 20, padding: '20px 24px', color: 'white', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>🔔 System Alert</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>มีใบประกอบวิชาชีพใกล้หมดอายุ {expiring.length} รายการ</div>
=======
      {expiring.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 20, padding: '24px 28px', color: 'white', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>System Alert</div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>พบใบประกอบวิชาชีพใกล้หมดอายุ {expiring.length} รายการ</div>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>กรุณาดำเนินการแจ้งพนักงานเพื่อต่ออายุเอกสารโดยด่วน (เหลือน้อยกว่า 90 วัน)</div>
            </div>
>>>>>>> c2159edae8da8b26ce95499e557d1df33ac890b5
          </div>
          <button style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            ส่งอีเมลแจ้งเตือนทั้งหมด
          </button>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อพนักงาน</th>
              <th>ประเภทใบประกอบ</th>
              <th>เลขที่ใบอนุญาต</th>
              <th>วันออก</th>
              <th>หมดอายุ</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
<<<<<<< HEAD
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>กำลังโหลดข้อมูล...</td></tr>
            ) : licenses.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 20 }}>ไม่พบข้อมูลใบประกอบวิชาชีพ</td></tr>
            ) : (
              licenses.map(l => {
                const { label, cls } = getStatus(l.daysLeft);
                const isExpiring = l.daysLeft <= 90;
                return (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.name}</td>
                    <td style={{ fontSize: 13, color: '#666' }}>{l.type}</td>
                    <td style={{ fontSize: 13, fontFamily: 'monospace' }}>{l.license_no || '-'}</td>
                    <td style={{ fontSize: 13 }}>{l.issued}</td>
                    <td style={{ fontSize: 13 }}>{l.expires}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleOpenModal(l)}
                        style={{
                          background: isExpiring ? '#C5A073' : '#e2e8f0',
                          color: isExpiring ? 'white' : '#475569',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isExpiring ? '0 2px 4px rgba(197, 160, 115, 0.3)' : 'none'
                        }}
                        onMouseOver={(e) => {
                          if(!isExpiring) e.currentTarget.style.background = '#cbd5e1';
                        }}
                        onMouseOut={(e) => {
                          if(!isExpiring) e.currentTarget.style.background = '#e2e8f0';
                        }}
                      >
                        ต่ออายุ
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
=======
            {processedData.map(l => {
              const { label, cls } = getStatus(l.daysLeft);
              return (
                <tr key={l.id} style={{ background: l.daysLeft < 0 ? '#fef2f2' : l.daysLeft <= 30 ? '#fff5f5' : l.daysLeft <= 90 ? '#fefce8' : 'transparent', transition: 'background 0.2s' }}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, color: '#475569' }}>{l.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{l.name}</div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{l.type}</td>
                  <td style={{ fontSize: 13, color: '#475569' }}>{l.issued}</td>
                  <td style={{ fontSize: 13, color: l.daysLeft <= 90 ? '#ef4444' : '#475569', fontWeight: l.daysLeft <= 90 ? 700 : 400 }}>{l.expires}</td>
                  <td><span className={`badge ${cls}`}>{label}</span></td>
                </tr>
              );
            })}
>>>>>>> c2159edae8da8b26ce95499e557d1df33ac890b5
          </tbody>
        </table>
      </div>

      {/* Renew Modal */}
      {isModalOpen && selectedLicense && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, margin: 0
        }}>
          <div className="glass-card" style={{ 
            width: '100%', maxWidth: 500, padding: 32,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            background: 'white'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
              ต่ออายุใบประกอบวิชาชีพ
            </h2>
            
            <div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, fontSize: 14 }}>
                <div style={{ color: '#64748b' }}>ชื่อ-นามสกุล:</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedLicense.name}</div>
                <div style={{ color: '#64748b' }}>ประเภท:</div>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedLicense.type}</div>
                <div style={{ color: '#64748b' }}>วันหมดอายุเดิม:</div>
                <div style={{ fontWeight: 600, color: '#ef4444' }}>{selectedLicense.expires}</div>
              </div>
            </div>

            <form onSubmit={handleRenew}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#475569' }}>
                  เลขที่ใบอนุญาต
                </label>
                <input 
                  type="text" 
                  value={newLicenseNo}
                  onChange={(e) => setNewLicenseNo(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
                  placeholder="กรอกเลขที่ใบอนุญาตใหม่ (ถ้ามี)"
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: '#475569' }}>
                  วันหมดอายุใหม่ <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="date" 
                  required
                  value={newExpireDate}
                  onChange={(e) => setNewExpireDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={renewing}
                  style={{
                    padding: '10px 20px', borderRadius: 8, border: '1px solid #cbd5e1',
                    background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={renewing || !newExpireDate}
                  style={{
                    padding: '10px 24px', borderRadius: 8, border: 'none',
                    background: renewing || !newExpireDate ? '#94a3b8' : '#3b82f6', 
                    color: 'white', fontWeight: 600, cursor: renewing || !newExpireDate ? 'not-allowed' : 'pointer',
                    boxShadow: renewing || !newExpireDate ? 'none' : '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  {renewing ? 'กำลังบันทึก...' : 'บันทึกการต่ออายุ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
