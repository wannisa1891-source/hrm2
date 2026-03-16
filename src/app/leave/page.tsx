'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useLeaves } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';

// ✅ แก้ไข ID ให้ตรงกับฐานข้อมูล (เอาตัว T ออก)
const LEAVE_TYPES = [
  { id: 'L01', name: 'ลาป่วย' },
  { id: 'L02', name: 'ลากิจ (รับค่าจ้าง)' },
  { id: 'L03', name: 'ลาพักผ่อน (พักร้อน)' },
  { id: 'L04', name: 'ลาคลอด' },
  { id: 'L05', name: 'ลาไปช่วยเหลือภริยาที่คลอดบุตร' },
  { id: 'L06', name: 'ลาอุปสมบท / ลาไปประกอบพิธีฮัจญ์' },
  { id: 'L07', name: 'ลาไปศึกษา ฝึกอบรม' },
];

export default function LeavePage() {
  const { leaves, loading, error, loadLeaves, addLeave, changeLeaveStatus } = useLeaves();
  const { employees, loadEmployees } = useEmployees();

  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);

  // ✅ แก้ไข leave_type_id เริ่มต้นเป็น 'L01'
  const [form, setForm] = useState({
    emp_id: '',
    leave_type_id: 'L01',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [certFile, setCertFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Simulated Quota Logic
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getQuota = (empId: string, typeId: string) => {
    if (!empId) return { used: 0, total: 0 };
    // Mock quota logic
    if (typeId === 'L01') return { used: 5, total: 30 }; // ลาป่วย
    if (typeId === 'L03') return { used: 2, total: 10 }; // พักร้อน
    return { used: 0, total: 15 };
  };

  useEffect(() => {
    loadLeaves();
    loadEmployees();
  }, [loadLeaves, loadEmployees]);

  const pending = leaves.filter(l => l.status === 'Pending');
  const approved = leaves.filter(l => l.status === 'Approved');
  const sickToday = leaves.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return l.status === 'Approved' && l.start_date?.split('T')[0] <= today && l.end_date?.split('T')[0] >= today;
  });

  const filtered = filterStatus ? leaves.filter(l => l.status === filterStatus) : leaves;

  const handleSubmit = async () => {
    if (!form.emp_id || !form.start_date || !form.end_date) {
      alert('กรุณากรอกข้อมูลวันที่และพนักงานให้ครบ');
      return;
    }
    if (form.start_date > form.end_date) {
      alert('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
      return;
    }
    
    // Check if sick leave > 2 days needs certificate
    const duration = calculateDuration(form.start_date, form.end_date);
    if (form.leave_type_id === 'L01' && duration > 2 && !certFile) {
      alert('การลาป่วยเกิน 2 วัน ต้องแนบใบรับรองแพทย์');
      return;
    }

    setSaving(true);
    // Note: If using a real API, `form` should be converted to FormData to include `certFile`
    const ok = await addLeave(form);
    setSaving(false);
    if (ok) {
      setShowForm(false);
      setForm({ emp_id: '', leave_type_id: 'L01', start_date: '', end_date: '', reason: '' });
      setCertFile(null);
    }
  };

  const statusBadge = (s: string) => {
    const styles: Record<string, React.CSSProperties> = {
      Pending: { background: 'rgba(251,191,36,0.15)', color: '#d97706', border: '1px solid rgba(251,191,36,0.4)' },
      Approved: { background: 'rgba(34,197,94,0.15)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.4)' },
      Rejected: { background: 'rgba(239,68,68,0.15)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.4)' },
    };
    const labels: Record<string, string> = { Pending: 'รออนุมัติ', Approved: 'อนุมัติแล้ว', Rejected: 'ไม่อนุมัติ' };
    return (
      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, ...styles[s] }}>
        {labels[s] || s}
      </span>
    );
  };

  return (
    <AppLayout>
      <style>{`
        .leave-page { display: flex; flex-direction: column; gap: 24px; }
        .leave-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .leave-header-title { font-size: 26px; font-weight: 700; color: #1e293b; margin: 0; }
        .leave-header-sub { font-size: 14px; color: #64748b; margin: 4px 0 0; }
        .btn-new-leave {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; border: none; border-radius: 12px;
          padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer;
          box-shadow: 0 4px 14px rgba(99,102,241,0.4);
          transition: transform .15s, box-shadow .15s;
        }
        .btn-new-leave:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.5); }
        .leave-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .stat-card {
          border-radius: 18px; padding: 24px 22px;
          display: flex; align-items: center; gap: 18px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          cursor: pointer; transition: transform .15s, box-shadow .15s;
        }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
        .stat-card.active { outline: 2px solid rgba(255,255,255,0.6); outline-offset: -2px; }
        .stat-card-sick { background: linear-gradient(135deg, #f472b6, #ec4899); color: #fff; }
        .stat-card-pending { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #fff; }
        .stat-card-approved { background: linear-gradient(135deg, #34d399, #10b981); color: #fff; }
        .stat-card-icon { width: 54px; height: 54px; border-radius: 14px; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
        .stat-card-body { flex: 1; }
        .stat-card-count { font-size: 32px; font-weight: 800; line-height: 1; }
        .stat-card-label { font-size: 13px; opacity: .88; margin-top: 4px; font-weight: 500; }
        .stat-card-sub { position: absolute; bottom: 12px; right: 16px; font-size: 11px; opacity: .7; font-weight: 500; background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 20px; }
        .leave-filter-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .filter-label { font-size: 13px; color: #64748b; font-weight: 600; margin-right: 4px; }
        .filter-chip { padding: 6px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b; transition: all .15s; }
        .filter-chip:hover { border-color: #6366f1; color: #6366f1; }
        .filter-chip.active-all { background: #1e293b; color: #fff; border-color: #1e293b; }
        .filter-chip.active-pending { background: #f59e0b; color: #fff; border-color: #f59e0b; }
        .filter-chip.active-approved { background: #10b981; color: #fff; border-color: #10b981; }
        .filter-chip.active-rejected { background: #ef4444; color: #fff; border-color: #ef4444; }
        .leave-table-card { background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .leave-table-card-header { padding: 18px 24px 14px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
        .leave-table-card-title { font-size: 15px; font-weight: 700; color: #1e293b; }
        .leave-table-card-count { font-size: 13px; color: #94a3b8; }
        .leave-table { width: 100%; border-collapse: collapse; }
        .leave-table thead tr { background: #f8fafc; }
        .leave-table th { padding: 12px 16px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; text-align: left; white-space: nowrap; }
        .leave-table tbody tr { border-top: 1px solid #f1f5f9; transition: background .1s; }
        .leave-table tbody tr:hover { background: #fafbff; }
        .leave-table td { padding: 14px 16px; font-size: 14px; color: #334155; vertical-align: middle; }
        .leave-emp-name { font-weight: 600; color: #1e293b; }
        .leave-emp-dept { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .leave-date-range { font-size: 13px; color: #64748b; }
        .leave-reason { font-size: 13px; color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .leave-actions { display: flex; gap: 6px; }
        .btn-approve { padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(16,185,129,0.1); color: #059669; border: 1px solid rgba(16,185,129,0.3); transition: all .15s; }
        .btn-approve:hover { background: #10b981; color: #fff; }
        .btn-reject { padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(239,68,68,0.1); color: #dc2626; border: 1px solid rgba(239,68,68,0.3); transition: all .15s; }
        .btn-reject:hover { background: #ef4444; color: #fff; }
        .leave-id-chip { font-family: monospace; font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }
        .empty-row td { text-align: center; padding: 48px !important; color: #94a3b8; font-size: 14px; }
        .lv-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .lv-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 25px 60px rgba(0,0,0,0.2); overflow: hidden; }
        .lv-modal-header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
        .lv-modal-header h3 { color: #fff; font-size: 17px; font-weight: 700; margin: 0; }
        .lv-modal-close { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; transition: background .15s; }
        .lv-modal-close:hover { background: rgba(255,255,255,0.35); }
        .lv-modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .lv-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .lv-form-group { display: flex; flex-direction: column; gap: 6px; }
        .lv-form-group.full { grid-column: 1/-1; }
        .lv-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
        .lv-input, .lv-select, .lv-textarea { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 14px; color: #1e293b; outline: none; transition: border-color .15s; background: #f8fafc; width: 100%; box-sizing: border-box; }
        .lv-input:focus, .lv-select:focus, .lv-textarea:focus { border-color: #6366f1; background: #fff; }
        .lv-textarea { resize: vertical; min-height: 80px; }
        .lv-modal-footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
        .btn-cancel-lv { padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; background: #f1f5f9; color: #64748b; border: none; transition: background .15s; }
        .btn-cancel-lv:hover { background: #e2e8f0; }
        .btn-save-lv { padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; border: none; box-shadow: 0 4px 14px rgba(99,102,241,0.4); transition: all .15s; }
        .btn-save-lv:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.5); }
        .btn-save-lv:disabled { opacity: .6; cursor: not-allowed; }
        
        .date-range-container { display: flex; align-items: center; gap: 8px; }
        .date-range-separator { color: #94a3b8; font-weight: 700; }
        .quota-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .quota-text { font-size: 13px; color: #475569; }
        .quota-highlight { font-weight: 700; color: #6366f1; font-size: 15px; }
      `}</style>

      <div className="leave-page">
        <div className="leave-header">
          <div>
            <h1 className="leave-header-title">ระบบการลา</h1>
            <p className="leave-header-sub">จัดการใบลาพนักงานทั้งหมด {leaves.length} รายการ</p>
          </div>
          <button className="btn-new-leave" onClick={() => setShowForm(true)}>
            <span style={{ fontSize: 18 }}>+</span> บันทึกใบลาใหม่
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 18px', color: '#dc2626', fontSize: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <div className="leave-stats">
          <div className={`stat-card stat-card-sick`} onClick={() => setFilterStatus('')}>
            <div className="stat-card-icon">🤒</div>
            <div className="stat-card-body">
              <div className="stat-card-count">{sickToday.length}</div>
              <div className="stat-card-label">ลาวันนี้</div>
            </div>
            <div className="stat-card-sub">วันนี้</div>
          </div>

          <div className={`stat-card stat-card-pending ${filterStatus === 'Pending' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'Pending' ? '' : 'Pending')}>
            <div className="stat-card-icon">⏳</div>
            <div className="stat-card-body">
              <div className="stat-card-count">{pending.length}</div>
              <div className="stat-card-label">รออนุมัติ</div>
            </div>
            <div className="stat-card-sub">รายการ</div>
          </div>

          <div className={`stat-card stat-card-approved ${filterStatus === 'Approved' ? 'active' : ''}`} onClick={() => setFilterStatus(filterStatus === 'Approved' ? '' : 'Approved')}>
            <div className="stat-card-icon">✅</div>
            <div className="stat-card-body">
              <div className="stat-card-count">{approved.length}</div>
              <div className="stat-card-label">อนุมัติแล้ว</div>
            </div>
            <div className="stat-card-sub">เดือนนี้</div>
          </div>
        </div>

        <div className="leave-filter-bar">
          <span className="filter-label">กรอง:</span>
          {[
            { val: '', label: 'ทั้งหมด', cls: 'active-all' },
            { val: 'Pending', label: 'รออนุมัติ', cls: 'active-pending' },
            { val: 'Approved', label: 'อนุมัติแล้ว', cls: 'active-approved' },
            { val: 'Rejected', label: 'ไม่อนุมัติ', cls: 'active-rejected' },
          ].map(({ val, label, cls }) => (
            <button key={val} className={`filter-chip ${filterStatus === val ? cls : ''}`} onClick={() => setFilterStatus(val)}>
              {label}
            </button>
          ))}
        </div>

        <div className="leave-table-card">
          <div className="leave-table-card-header">
            <span className="leave-table-card-title">รายการใบลา</span>
            <span className="leave-table-card-count">{filtered.length} รายการ</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8', fontSize: 15 }}>⏳ กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="leave-table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>พนักงาน</th>
                  <th>ประเภท</th>
                  <th>ช่วงวันที่</th>
                  <th>เหตุผล</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="empty-row"><td colSpan={7}>ไม่พบรายการใบลา</td></tr>
                ) : filtered.map(l => (
                  <tr key={l.leave_id}>
                    <td><span className="leave-id-chip">{l.leave_id}</span></td>
                    <td>
                      <div className="leave-emp-name">{l.first_name_th} {l.last_name_th}</div>
                      <div className="leave-emp-dept">{l.dept_name}</div>
                    </td>
                    <td style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      {LEAVE_TYPES.find(t => t.id === l.leave_type_id)?.name || l.leave_type_id}
                    </td>
                    <td>
                      <div className="leave-date-range">{l.start_date?.split('T')[0]}</div>
                      <div className="leave-date-range">↓ {l.end_date?.split('T')[0]}</div>
                    </td>
                    <td><span className="leave-reason">{l.reason || '—'}</span></td>
                    <td>{statusBadge(l.status)}</td>
                    <td>
                      {l.status === 'Pending' ? (
                        <div className="leave-actions">
                          <button className="btn-approve" onClick={() => changeLeaveStatus(l.leave_id, 'Approved')}>✓ อนุมัติ</button>
                          <button className="btn-reject" onClick={() => changeLeaveStatus(l.leave_id, 'Rejected')}>✗ ปฏิเสธ</button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showForm && (
        <div className="lv-modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="lv-modal">
            <div className="lv-modal-header">
              <h3>บันทึกใบลาใหม่</h3>
              <button className="lv-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div className="lv-modal-body">
              {form.emp_id && form.leave_type_id && (
                <div className="quota-box">
                  <div className="quota-text">
                    โควตา <b>{LEAVE_TYPES.find(t => t.id === form.leave_type_id)?.name}</b>: ใช้ไปแล้ว <span className="quota-highlight">{getQuota(form.emp_id, form.leave_type_id).used}</span> / {getQuota(form.emp_id, form.leave_type_id).total} วัน
                  </div>
                  {calculateDuration(form.start_date, form.end_date) > 0 && (
                    <div style={{ fontSize: 13, color: '#059669', fontWeight: 600, background: '#d1fae5', padding: '4px 10px', borderRadius: 8 }}>
                      ลาครั้งนี้: {calculateDuration(form.start_date, form.end_date)} วัน
                    </div>
                  )}
                </div>
              )}
            
              <div className="lv-form-row">
                <div className="lv-form-group full">
                  <label className="lv-label">พนักงาน</label>
                  <select className="lv-select" value={form.emp_id} onChange={e => setForm(f => ({ ...f, emp_id: e.target.value }))}>
                    <option value="">— เลือกพนักงาน —</option>
                    {employees.map(e => <option key={e.emp_id} value={e.emp_id}>{e.prefix}{e.first_name_th} {e.last_name_th}</option>)}
                  </select>
                </div>
                <div className="lv-form-group full">
                  <label className="lv-label">ประเภทการลา</label>
                  <select className="lv-select" value={form.leave_type_id} onChange={e => setForm(f => ({ ...f, leave_type_id: e.target.value }))}>
                    {LEAVE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                
                <div className="lv-form-group full">
                  <label className="lv-label">ช่วงวันที่ลา</label>
                  <div className="date-range-container">
                    <input type="date" className="lv-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ flex: 1 }} />
                    <span className="date-range-separator">→</span>
                    <input type="date" className="lv-input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ flex: 1 }} min={form.start_date} />
                  </div>
                </div>

                {form.leave_type_id === 'L01' && calculateDuration(form.start_date, form.end_date) > 2 && (
                  <div className="lv-form-group full" style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: 12, borderRadius: 10 }}>
                    <label className="lv-label" style={{ color: '#d97706' }}>แนบใบรับรองแพทย์ (ลาป่วยเกิน 2 วัน)</label>
                    <input type="file" className="lv-input" style={{ background: '#fff' }} onChange={e => setCertFile(e.target.files?.[0] || null)} />
                  </div>
                )}

                <div className="lv-form-group full">
                  <label className="lv-label">เหตุผล</label>
                  <textarea className="lv-textarea" rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="ระบุเหตุผลการลา..." />
                </div>
              </div>
            </div>
            <div className="lv-modal-footer">
              <button className="btn-cancel-lv" onClick={() => setShowForm(false)}>ยกเลิก</button>
              <button className="btn-save-lv" onClick={handleSubmit} disabled={saving}>
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกใบลา'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}