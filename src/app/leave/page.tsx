'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';

const LEAVE_TYPES = [
  { id: 'LT01', name: 'ลากิจ', color: '#6366f1' },
  { id: 'LT02', name: 'ลาพักร้อน', color: '#10b981' },
  { id: 'LT03', name: 'ลาป่วย', color: '#f59e0b' },
  { id: 'LT04', name: 'ลาคลอด', color: '#ec4899' },
];

export default function LeavePage() {
  const { leaves, loading, error, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();
  const { employees, loadEmployees } = useEmployees();

  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: 'LT01', start_date: '', end_date: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, [loadLeaves, loadEmployees]);

  const filtered = filterStatus ? leaves.filter(l => l.status === filterStatus) : leaves;

  // คำนวณ Stats สำหรับโชว์เป็น Card
  const stats = useMemo(() => ({
    total: leaves.length,
    pending: leaves.filter(l => l.status === 'Pending').length,
    approved: leaves.filter(l => l.status === 'Approved').length,
  }), [leaves]);

  const handleSubmit = async () => {
    if (!form.emp_id || !form.start_date || !form.end_date) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSaving(true);
    const ok = await addLeave(form);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setForm({ emp_id: '', leave_type_id: 'LT01', start_date: '', end_date: '', reason: '' });
    }
  };

  const statusBadge = (s: string) => {
    const config: Record<string, { bg: string, text: string, label: string }> = {
      Pending: { bg: '#fffbeb', text: '#b45309', label: 'รออนุมัติ' },
      Approved: { bg: '#f0fdf4', text: '#15803d', label: 'อนุมัติแล้ว' },
      Rejected: { bg: '#fef2f2', text: '#b91c1c', label: 'ไม่อนุมัติ' }
    };
    const style = config[s] || { bg: '#f8fafc', text: '#64748b', label: s };

    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.text,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: style.text }} />
        {style.label}
      </span>
    );
  };

  return (
    <AppLayout>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1e293b', margin: 0 }}>📅 ระบบจัดการการลา</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>ติดตามและตรวจสอบคำขอลาของพนักงาน</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}
          style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', padding: '10px 20px' }}>
          + สร้างใบลาใหม่
        </button>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'รายการทั้งหมด', value: stats.total, icon: '📄', color: '#f1f5f9' },
          { label: 'รออนุมัติ', value: stats.pending, icon: '⏳', color: '#fffbeb' },
          { label: 'อนุมัติแล้ว', value: stats.approved, icon: '✅', color: '#f0fdf4' },
        ].map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: 20, backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>{item.label}</span>
              <span>{item.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8, color: '#1e293b' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {['', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{
              padding: '8px 20px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              backgroundColor: filterStatus === s ? 'white' : 'transparent',
              color: filterStatus === s ? '#2563eb' : '#64748b',
              boxShadow: filterStatus === s ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}>
            {s === '' ? 'ทั้งหมด' : s === 'Pending' ? 'รออนุมัติ' : s === 'Approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
          </button>
        ))}
      </div>

      {/* Main Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table className="data-table">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '16px 20px' }}>พนักงาน</th>
              <th>ประเภท</th>
              <th>วันที่ลา</th>
              <th>เหตุผล</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>⏳ กำลังโหลดข้อมูล...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>ไม่พบข้อมูลรายการลา</td></tr>
            ) : filtered.map(l => (
              <tr key={l.leave_id} className="table-row-hover">
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{l.first_name_th} {l.last_name_th}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{l.dept_name}</div>
                </td>
                <td>
                  <span style={{ fontSize: 13, color: '#475569', background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>
                    {LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.name || 'ลาอื่นๆ'}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: '#475569' }}>
                  <div style={{ fontWeight: 500 }}>{l.start_date?.split('T')[0]}</div>
                  <div style={{ fontSize: 11, color: '#cbd5e1' }}>ถึง {l.end_date?.split('T')[0]}</div>
                </td>
                <td style={{ fontSize: 13, color: '#64748b', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {l.reason}
                </td>
                <td>{statusBadge(l.status)}</td>
                <td style={{ textAlign: 'right', paddingRight: 20 }}>
                  {l.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => changeLeaveStatus(l.leave_id, 'Approved')}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 600 }}>
                        อนุมัติ
                      </button>
                      <button onClick={() => changeLeaveStatus(l.leave_id, 'Rejected')}
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 600 }}>
                        ปฏิเสธ
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ปรับปรุง CSS เล็กน้อยในหัวข้อ Style tag หรือ Global CSS */}
      <style jsx>{`
        .table-row-hover:hover {
          background-color: #f8fafc;
          transition: background-color 0.2s;
        }
        .btn-primary:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Modal Form ยังคงเดิมแต่ปรับ Padding และ Border Radius ให้เข้าชุดกัน */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box" style={{ borderRadius: 20, padding: 32 }}>
            {/* ... Form Content ... */}
          </div>
        </div>
      )}
    </AppLayout>
  );
}