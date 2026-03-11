'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Leave {
  leave_id: string; emp_id: string; leave_type_id: string;
  start_date: string; end_date: string; reason: string; status: string;
  first_name_th: string; last_name_th: string; dept_name: string;
}
interface Employee { emp_id: string; prefix: string; first_name_th: string; last_name_th: string; }

const LEAVE_TYPES = [
  { id: 'LT01', name: 'ลากิจ' }, { id: 'LT02', name: 'ลาพักร้อน' },
  { id: 'LT03', name: 'ลาป่วย' }, { id: 'LT04', name: 'ลาคลอด' },
];

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ emp_id: '', leave_type_id: 'LT01', start_date: '', end_date: '', reason: '' });

  useEffect(() => {
    fetchLeaves();
    fetch('/api/employees').then(r => r.json()).then(data => setEmployees(Array.isArray(data) ? data : []));
  }, []);

  const fetchLeaves = () => fetch('/api/leaves').then(r => r.json()).then(data => setLeaves(Array.isArray(data) ? data : []));

  const filtered = filterStatus ? leaves.filter(l => l.status === filterStatus) : leaves;

  const handleSubmit = async () => {
    if (!form.emp_id || !form.start_date || !form.end_date) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
    const res = await fetch('/api/leaves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (data.success) { setShowForm(false); setForm({ emp_id: '', leave_type_id: 'LT01', start_date: '', end_date: '', reason: '' }); fetchLeaves(); }
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/leaves/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    fetchLeaves();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red' };
    const labels: Record<string, string> = { Pending: 'รออนุมัติ', Approved: 'อนุมัติแล้ว', Rejected: 'ไม่อนุมัติ' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{labels[s] || s}</span>;
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 ระบบการลา</h1>
          <p className="page-subtitle">ทั้งหมด {leaves.length} รายการ</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ บันทึกใบลาใหม่</button>
      </div>

      <div className="filter-bar">
        {['', 'Pending', 'Approved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={filterStatus === s ? 'btn-primary' : 'btn-outline'}
            style={{ padding: '8px 16px', borderRadius: 10 }}>
            {s === '' ? 'ทั้งหมด' : s === 'Pending' ? 'รออนุมัติ' : s === 'Approved' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
          </button>
        ))}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>รหัสใบลา</th><th>พนักงาน</th><th>แผนก</th>
              <th>ระหว่างวันที่</th><th>เหตุผล</th><th>สถานะ</th><th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#888' }}>ไม่พบข้อมูล</td></tr>
            ) : filtered.map(l => (
              <tr key={l.leave_id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.leave_id}</span></td>
                <td>{l.first_name_th} {l.last_name_th}</td>
                <td style={{ fontSize: 13, color: '#888' }}>{l.dept_name}</td>
                <td style={{ fontSize: 13 }}>{l.start_date?.split('T')[0]} — {l.end_date?.split('T')[0]}</td>
                <td style={{ fontSize: 13, maxWidth: 200 }}>{l.reason}</td>
                <td>{statusBadge(l.status)}</td>
                <td>
                  {l.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-outline" style={{ background: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' }} onClick={() => updateStatus(l.leave_id, 'Approved')}>✓ อนุมัติ</button>
                      <button className="btn-danger" onClick={() => updateStatus(l.leave_id, 'Rejected')}>✗ ไม่อนุมัติ</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>📋 บันทึกใบลาใหม่</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">พนักงาน</label>
                <select className="form-select" value={form.emp_id} onChange={e => setForm(f => ({ ...f, emp_id: e.target.value }))}>
                  <option value="">-- เลือกพนักงาน --</option>
                  {employees.map(e => <option key={e.emp_id} value={e.emp_id}>{e.prefix}{e.first_name_th} {e.last_name_th}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">ประเภทการลา</label>
                <select className="form-select" value={form.leave_type_id} onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))}>
                  {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">วันที่เริ่ม</label><input type="date" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">วันที่สิ้นสุด</label><input type="date" className="form-input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              <div className="form-group full"><label className="form-label">เหตุผล</label><textarea className="form-input" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn-primary" onClick={handleSubmit}>💾 บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
