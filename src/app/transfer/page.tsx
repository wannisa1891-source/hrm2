'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Department { dept_id: string; dept_name: string; }
interface SearchResult { id: string; name: string; pos: string; dept: string; salary: number; dept_id: string; pos_id: string; }
interface TransferRecord {
  transfer_id: string;
  order_no: string;
  order_date: string;
  effective_date: string;
  subject: string;
  transfer_type: string;
  emp_name: string;
  old_dept_name: string;
  new_dept_name: string;
  old_position: string;
  new_position: string;
}

const TRANSFER_TYPES = [
  { id: '01', label: '01 - บรรจุ/แต่งตั้ง' },
  { id: '02', label: '02 - เลื่อนตำแหน่ง' },
  { id: '03', label: '03 - ย้าย/สับเปลี่ยนตำแหน่ง' },
  { id: '04', label: '04 - โอน' },
  { id: '05', label: '05 - ช่วยราชการ' },
];

export default function TransferPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listSearch, setListSearch] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    orderNo: '', orderDate: '', effectDate: '', title: '',
    transferType: '03', empId: '',
    oldDept: '', oldDeptId: '', newDeptId: '',
    oldPos: '', oldPosId: '', newPos: '',
    oldLevel: '', newLevel: '',
    oldPosNo: '', newPosNo: '',
    oldSalary: 0, newSalary: 0,
    remark: '',
  });

  const loadTransfers = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/transfers');
      const data = await res.json();
      setTransfers(Array.isArray(data) ? data : []);
    } catch { setTransfers([]); }
    setLoadingList(false);
  };

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
    loadTransfers();
  }, []);

  const search = async () => {
    if (!searchQ.trim()) return;
    const res = await fetch(`/api/staff-search?q=${encodeURIComponent(searchQ)}`);
    setSearchResults(await res.json());
  };

  const selectEmployee = (emp: SearchResult) => {
    setSelected(emp);
    setForm(f => ({ ...f, empId: emp.id, oldPos: emp.pos, oldDept: emp.dept, oldSalary: emp.salary, oldDeptId: emp.dept_id, oldPosId: emp.pos_id }));
    setSearchResults([]);
    setSearchQ(emp.name);
  };

  const handleSave = async () => {
    if (!selected || !form.orderNo || !form.newDeptId || !form.effectDate) { alert('กรุณากรอกข้อมูลให้ครบ (รวมถึงวันที่มีผล)'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('data', JSON.stringify(form));
    if (orderFile) fd.append('order_file', orderFile);
    const res = await fetch('/api/transfers', { method: 'POST', body: fd });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      alert('✅ บันทึกคำสั่งย้ายสำเร็จ!');
      setShowForm(false);
      setSelected(null); setSearchQ('');
      setForm({ orderNo: '', orderDate: '', effectDate: '', title: '', transferType: '03', empId: '', oldDept: '', oldDeptId: '', newDeptId: '', oldPos: '', oldPosId: '', newPos: '', oldLevel: '', newLevel: '', oldPosNo: '', newPosNo: '', oldSalary: 0, newSalary: 0, remark: '' });
      loadTransfers(); // ✅ โหลดรายการใหม่หลังบันทึก
    } else alert('เกิดข้อผิดพลาด');
  };

  const setF = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const newDeptName = departments.find(d => d.dept_id === form.newDeptId)?.dept_name || '—';

  return (
    <AppLayout>
      <style>{`
        .tr-page { display: flex; flex-direction: column; gap: 24px; }

        /* Header */
        .tr-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .tr-header-title { font-size: 26px; font-weight: 700; color: #1e293b; margin: 0; }
        .tr-header-sub { font-size: 14px; color: #64748b; margin: 4px 0 0; }
        .btn-tr-new { display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff; border:none; border-radius:12px; padding:10px 20px; font-size:14px; font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(14,165,233,0.4); transition:transform .15s,box-shadow .15s; }
        .btn-tr-new:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(14,165,233,0.5); }

        /* Stat cards */
        .tr-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .tr-stat { border-radius: 18px; padding: 22px 20px; display: flex; align-items: center; gap: 16px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
        .tr-stat-blue   { background: linear-gradient(135deg,#38bdf8,#0ea5e9); color:#fff; }
        .tr-stat-purple { background: linear-gradient(135deg,#a78bfa,#7c3aed); color:#fff; }
        .tr-stat-teal   { background: linear-gradient(135deg,#2dd4bf,#0d9488); color:#fff; }
        .tr-stat-icon { width:50px; height:50px; border-radius:13px; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0; }
        .tr-stat-count { font-size:30px; font-weight:800; line-height:1; }
        .tr-stat-label { font-size:13px; opacity:.9; margin-top:4px; font-weight:500; }
        .tr-stat-tag { position:absolute; bottom:10px; right:14px; font-size:11px; background:rgba(255,255,255,0.2); padding:2px 10px; border-radius:20px; opacity:.8; }

        /* Table card */
        .tr-card { background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06); }
        .tr-card-header { padding:18px 24px 14px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .tr-card-title { font-size:15px; font-weight:700; color:#1e293b; }
        .tr-search-bar { display:flex; gap:8px; align-items:center; }
        .tr-search-input { border:1.5px solid #e2e8f0; border-radius:10px; padding:7px 14px; font-size:13px; outline:none; transition:border-color .15s; background:#f8fafc; width:220px; }
        .tr-search-input:focus { border-color:#0ea5e9; background:#fff; }
        .tr-table { width:100%; border-collapse:collapse; }
        .tr-table thead tr { background:#f8fafc; }
        .tr-table th { padding:11px 16px; font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; text-align:left; white-space:nowrap; }
        .tr-table tbody tr { border-top:1px solid #f1f5f9; transition:background .1s; }
        .tr-table tbody tr:hover { background:#f0f9ff; }
        .tr-table td { padding:13px 16px; font-size:14px; color:#334155; vertical-align:middle; }
        .tr-emp-name { font-weight:600; color:#1e293b; }
        .tr-emp-sub  { font-size:12px; color:#94a3b8; margin-top:2px; }
        .tr-empty td { text-align:center; padding:48px !important; color:#94a3b8; font-size:14px; }

        /* Status badge */
        .tr-badge { padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; }
        .tr-badge-done { background:rgba(20,184,166,0.12); color:#0f766e; border:1px solid rgba(20,184,166,0.3); }
        .tr-badge-pending { background:rgba(245,158,11,0.12); color:#b45309; border:1px solid rgba(245,158,11,0.3); }

        /* ===== FORM PANEL ===== */
        .tr-form-panel { background:#fff; border-radius:18px; box-shadow:0 4px 24px rgba(0,0,0,0.07); overflow:hidden; }

        /* Section header */
        .tr-section-header { padding:14px 22px; font-size:14px; font-weight:700; color:#fff; border-radius: 0; }
        .tr-section-1 { background: linear-gradient(90deg,#0ea5e9,#38bdf8); }
        .tr-section-2 { background: linear-gradient(90deg,#7c3aed,#a78bfa); }
        .tr-section-3 { background: linear-gradient(90deg,#0d9488,#2dd4bf); }
        .tr-section-body { padding:20px 24px; }

        /* Inline form grid */
        .tr-form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
        .tr-form-row.tri { grid-template-columns:1fr 1fr 1fr; }
        .tr-form-row.single { grid-template-columns:1fr; }
        .tr-fg { display:flex; flex-direction:column; gap:5px; }
        .tr-fg.span2 { grid-column: span 2; }
        .tr-label { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; }
        .tr-input, .tr-select { border:1.5px solid #e2e8f0; border-radius:10px; padding:9px 13px; font-size:14px; color:#1e293b; outline:none; transition:border-color .15s; background:#f8fafc; width:100%; box-sizing:border-box; }
        .tr-input:focus, .tr-select:focus { border-color:#0ea5e9; background:#fff; }

        /* Comparison table */
        .tr-compare { width:100%; border-collapse:collapse; border-radius:12px; overflow:hidden; }
        .tr-compare thead tr { background:#f1f5f9; }
        .tr-compare th { padding:10px 16px; font-size:12px; font-weight:700; color:#64748b; text-align:left; }
        .tr-compare tbody tr { border-top:1px solid #f1f5f9; }
        .tr-compare tbody tr:hover { background:#fafbff; }
        .tr-compare td { padding:11px 16px; font-size:14px; color:#334155; }
        .tr-compare td:first-child { font-weight:600; color:#475569; width:160px; }
        .tr-compare td.old-val { color:#94a3b8; }
        .tr-compare td.new-val { color:#0284c7; font-weight:600; }

        /* Employee search dropdown */
        .tr-emp-search-wrap { position:relative; }
        .tr-emp-dropdown { position:absolute; top:100%; left:0; right:0; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.1); z-index:50; margin-top:4px; overflow:hidden; }
        .tr-emp-opt { padding:12px 16px; cursor:pointer; border-bottom:1px solid #f1f5f9; transition:background .1s; }
        .tr-emp-opt:hover { background:#f0f9ff; }
        .tr-emp-opt-name { font-weight:600; color:#1e293b; font-size:14px; }
        .tr-emp-opt-sub  { font-size:12px; color:#94a3b8; }

        /* Footer buttons */
        .tr-form-footer { padding:16px 24px; border-top:1px solid #f1f5f9; display:flex; justify-content:flex-end; gap:10px; }
        .btn-tr-cancel { padding:10px 22px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; background:#f1f5f9; color:#64748b; border:none; transition:background .15s; }
        .btn-tr-cancel:hover { background:#e2e8f0; }
        .btn-tr-save { padding:10px 28px; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; background:linear-gradient(135deg,#0ea5e9,#0284c7); color:#fff; border:none; box-shadow:0 4px 14px rgba(14,165,233,0.4); transition:all .15s; }
        .btn-tr-save:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(14,165,233,0.5); }
        .btn-tr-save:disabled { opacity:.6; cursor:not-allowed; }

        /* File upload */
        .tr-file-label { display:flex; align-items:center; gap:10px; padding:10px 16px; border:1.5px dashed #cbd5e1; border-radius:10px; cursor:pointer; background:#f8fafc; transition:border-color .15s; font-size:13px; color:#64748b; }
        .tr-file-label:hover { border-color:#0ea5e9; color:#0284c7; }

        @media(max-width:640px){ .tr-stats { grid-template-columns:1fr; } .tr-form-row { grid-template-columns:1fr; } .tr-form-row.tri { grid-template-columns:1fr; } }
      `}</style>

      <div className="tr-page">

        {/* ── Header ── */}
        <div className="tr-header">
          <div>
            <h1 className="tr-header-title">ระบบการโยกย้าย</h1>
            <p className="tr-header-sub">บันทึกคำสั่งแต่งตั้ง / โยกย้าย / เลื่อนตำแหน่ง</p>
          </div>
          {!showForm && (
            <button className="btn-tr-new" onClick={() => setShowForm(true)}>
              <span style={{ fontSize: 18 }}>+</span> สร้างคำสั่งย้ายใหม่
            </button>
          )}
        </div>

        {/* ── Stat Cards ── */}
        {!showForm && (
          <div className="tr-stats">
            <div className="tr-stat tr-stat-blue">
              <div className="tr-stat-icon">📋</div>
              <div>
                <div className="tr-stat-count">{transfers.length}</div>
                <div className="tr-stat-label">คำสั่งทั้งหมด</div>
              </div>
              <div className="tr-stat-tag">รายการ</div>
            </div>
            <div className="tr-stat tr-stat-purple">
              <div className="tr-stat-icon">🔄</div>
              <div>
                <div className="tr-stat-count">{transfers.filter(t => t.order_date?.startsWith(new Date().getFullYear().toString())).length}</div>
                <div className="tr-stat-label">โยกย้ายปีนี้</div>
              </div>
              <div className="tr-stat-tag">ปีนี้</div>
            </div>
            <div className="tr-stat tr-stat-teal">
              <div className="tr-stat-icon">⬆️</div>
              <div>
                <div className="tr-stat-count">{transfers.filter(t => t.transfer_type?.includes('เลื่อน') && t.order_date?.startsWith(new Date().getFullYear().toString())).length}</div>
                <div className="tr-stat-label">เลื่อนตำแหน่งปีนี้</div>
              </div>
              <div className="tr-stat-tag">ปีนี้</div>
            </div>
          </div>
        )}

        {/* ── List Table (when form is hidden) ── */}
        {!showForm && (
          <div className="tr-card">
            <div className="tr-card-header">
              <span className="tr-card-title">ประวัติการย้าย</span>
              <div className="tr-search-bar">
                <input
                  className="tr-search-input"
                  placeholder="ค้นหา ชื่อ / เลขที่คำสั่ง..."
                  value={listSearch}
                  onChange={e => setListSearch(e.target.value)}
                />
              </div>
            </div>
            <table className="tr-table">
              <thead>
                <tr>
                  <th>เลขที่คำสั่ง</th>
                  <th>วันที่มีผล</th>
                  <th>ข้าราชการ / พนง.</th>
                  <th>ประเภท</th>
                  <th>หน่วยงานใหม่</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>⏳ กำลังโหลด...</td></tr>
                ) : (() => {
                  const q = listSearch.toLowerCase();
                  const filtered = q
                    ? transfers.filter(t =>
                        t.order_no?.toLowerCase().includes(q) ||
                        t.emp_name?.toLowerCase().includes(q) ||
                        t.new_dept_name?.toLowerCase().includes(q)
                      )
                    : transfers;
                  return filtered.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 }}>ยังไม่มีประวัติการย้าย — กด <strong>สร้างคำสั่งย้ายใหม่</strong> เพื่อเริ่มต้น</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.transfer_id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#64748b' }}>{t.order_no}</span></td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{t.effective_date?.split('T')[0] || '—'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.emp_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.old_position} → {t.new_position}</div>
                      </td>
                      <td style={{ fontSize: 13, color: '#475569' }}>
                        {TRANSFER_TYPES.find(type => type.id === t.transfer_type)?.label || t.transfer_type || '—'}
                      </td>
                      <td style={{ fontSize: 13, color: '#0284c7', fontWeight: 500 }}>{t.new_dept_name || '—'}</td>
                      <td><span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(20,184,166,0.12)', color: '#0f766e', border: '1px solid rgba(20,184,166,0.3)' }}>บันทึกแล้ว</span></td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}

        {/* ── FORM (3 sections) ── */}
        {showForm && (
          <div className="tr-form-panel">

            {/* ─── SECTION 1: ข้อมูลคำสั่ง ─── */}
            <div className="tr-section-header tr-section-1">1. ข้อมูลคำสั่ง</div>
            <div className="tr-section-body">
              <div className="tr-form-row tri">
                <div className="tr-fg">
                  <label className="tr-label">เลขที่คำสั่ง</label>
                  <input className="tr-input" placeholder="เช่น สพ.0032/2567" value={form.orderNo} onChange={e => setF('orderNo', e.target.value)} />
                </div>
                <div className="tr-fg">
                  <label className="tr-label">ลงวันที่</label>
                  <input type="date" className="tr-input" value={form.orderDate} onChange={e => setF('orderDate', e.target.value)} />
                </div>
                <div className="tr-fg">
                  <label className="tr-label">วันที่มีผล</label>
                  <input type="date" className="tr-input" value={form.effectDate} onChange={e => setF('effectDate', e.target.value)} />
                </div>
              </div>
              <div className="tr-form-row">
                <div className="tr-fg tr-fg span2" style={{ gridColumn: '1 / -1' }}>
                  <label className="tr-label">เรื่อง</label>
                  <input className="tr-input" placeholder="เช่น คำสั่งแต่งตั้งข้าราชการ" value={form.title} onChange={e => setF('title', e.target.value)} />
                </div>
              </div>
              <div className="tr-form-row single">
                <div className="tr-fg">
                  <label className="tr-label">ประเภท</label>
                  <select className="tr-select" value={form.transferType} onChange={e => setF('transferType', e.target.value)}>
                    {TRANSFER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ─── SECTION 2: รายละเอียดการเปลี่ยนแปลง ─── */}
            <div className="tr-section-header tr-section-2">2. รายละเอียดการเปลี่ยนแปลง</div>
            <div className="tr-section-body">

              {/* Employee search */}
              <div className="tr-fg" style={{ marginBottom: 20 }}>
                <label className="tr-label">ผู้ถูกคำสั่ง</label>
                <div className="tr-emp-search-wrap">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="tr-input" style={{ flex: 1 }}
                      placeholder="🔍 ค้นหาด้วยชื่อหรือรหัสพนักงาน..."
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && search()}
                    />
                    <button className="btn-tr-save" style={{ whiteSpace: 'nowrap' }} onClick={search}>ค้นหา</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="tr-emp-dropdown">
                      {searchResults.map(r => (
                        <div key={r.id} className="tr-emp-opt" onClick={() => selectEmployee(r)}>
                          <div className="tr-emp-opt-name">{r.name}</div>
                          <div className="tr-emp-opt-sub">{r.id} | {r.pos} | {r.dept}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison table */}
              <table className="tr-compare">
                <thead>
                  <tr>
                    <th>รายการ</th>
                    <th>ข้อมูลปัจจุบัน (เดิม)</th>
                    <th>ข้อมูลใหม่ (ที่ย้ายไป)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>สังกัด/หน่วยงาน</td>
                    <td className="old-val">{selected ? form.oldDept || '—' : '—'}</td>
                    <td className="new-val">
                      <select className="tr-select" style={{ padding: '6px 10px', fontSize: 13 }} value={form.newDeptId} onChange={e => setF('newDeptId', e.target.value)}>
                        <option value="">— เลือกหน่วยงาน —</option>
                        {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>ตำแหน่งสายงาน</td>
                    <td className="old-val">{selected ? form.oldPos || '—' : '—'}</td>
                    <td className="new-val">
                      <input className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="ตำแหน่งใหม่" value={form.newPos} onChange={e => setF('newPos', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>ระดับ</td>
                    <td className="old-val">{selected ? form.oldLevel || '—' : '—'}</td>
                    <td className="new-val">
                      <input className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="ระดับใหม่" value={form.newLevel} onChange={e => setF('newLevel', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>เลขที่ตำแหน่ง</td>
                    <td className="old-val">{selected ? form.oldPosNo || '—' : '—'}</td>
                    <td className="new-val">
                      <input className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="เลขที่ตำแหน่งใหม่" value={form.newPosNo} onChange={e => setF('newPosNo', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>เงินเดือน (บาท)</td>
                    <td className="old-val">{selected ? form.oldSalary.toLocaleString() : '—'}</td>
                    <td className="new-val">
                      <input type="number" className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="เงินเดือนใหม่" value={form.newSalary || ''} onChange={e => setF('newSalary', Number(e.target.value))} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ─── SECTION 3: เอกสารแนบ ─── */}
            <div className="tr-section-header tr-section-3">3. เอกสารแนบ</div>
            <div className="tr-section-body">
              <div className="tr-form-row single">
                <div className="tr-fg">
                  <label className="tr-label">หมายเหตุ</label>
                  <input className="tr-input" placeholder="บันทึกเพิ่มเติม (ถ้ามี)" value={form.remark} onChange={e => setF('remark', e.target.value)} />
                </div>
              </div>
              <div className="tr-fg">
                <label className="tr-label">ไฟล์แนบ PDF</label>
                <label className="tr-file-label">
                  <span style={{ fontSize: 20 }}>📎</span>
                  <span>{orderFile ? orderFile.name : 'อัปโหลดไฟล์คำสั่งฉบับจริง (Scan) .pdf'}</span>
                  <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="tr-form-footer">
              <button className="btn-tr-cancel" onClick={() => { setShowForm(false); setSelected(null); setSearchQ(''); }}>ยกเลิก</button>
              <button className="btn-tr-save" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
