'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Department { dept_id: string; dept_name: string; }
interface SearchResult { id: string; name: string; pos: string; dept: string; salary: number; }
interface TransferRecord {
  transfer_id: string;
  order_no: string;
  order_date: string;
  effective_date: string;
  subject: string;
  transfer_type: string;
  emp_id: string;
  emp_name: string;
  old_dept_name: string;
  new_dept_name: string;
  old_position: string;
  new_position: string;
  old_salary: number;
  new_salary: number;
  order_file: string | null;
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
  const [detailTransfer, setDetailTransfer] = useState<TransferRecord | null>(null);
  const [form, setForm] = useState({
    orderNo: '', orderDate: '', effectDate: '', title: '',
    transferType: '03', empId: '',
    oldDept: '', newDeptId: '',
    oldPos: '', newPos: '',
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
    setForm(f => ({ ...f, empId: emp.id, oldPos: emp.pos, oldDept: emp.dept, oldSalary: emp.salary }));
    setSearchResults([]);
    setSearchQ(emp.name);
  };

  const handleSave = async () => {
    if (!selected || !form.orderNo || !form.newDeptId) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('data', JSON.stringify({ ...form, oldDeptId: '' }));
    if (orderFile) fd.append('order_file', orderFile);
    const res = await fetch('/api/transfers', { method: 'POST', body: fd });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      alert('บันทึกคำสั่งย้ายสำเร็จ! \nข้อมูลพนักงานได้รับการอัปเดตเรียบร้อยแล้ว');
      setShowForm(false);
      setSelected(null); setSearchQ('');
      setForm({ orderNo: '', orderDate: '', effectDate: '', title: '', transferType: '03', empId: '', oldDept: '', newDeptId: '', oldPos: '', newPos: '', oldLevel: '', newLevel: '', oldPosNo: '', newPosNo: '', oldSalary: 0, newSalary: 0, remark: '' });
      loadTransfers();
    } else alert('เกิดข้อผิดพลาด: ' + (data.error || ''));
  };

  const setF = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const newDeptName = departments.find(d => d.dept_id === form.newDeptId)?.dept_name || '—';

  return (
    <AppLayout>
      <style>{`
        .tr-page { display: flex; flex-direction: column; gap: 24px; }

        /* Header */
        .tr-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
        .tr-header-title { font-size: 32px; font-weight: 700; color: #1e2433; margin: 0; }
        .tr-header-sub { font-size: 15px; color: #64748b; margin: 8px 0 0; }
        .btn-tr-new { display: flex; align-items: center; gap: 8px; background: #3b82f6; color:#fff; border:none; border-radius:12px; padding:12px 24px; font-size:15px; font-weight:600; cursor:pointer; transition:all .2s; }
        .btn-tr-new:hover { background: #2563eb; transform:translateY(-2px); }

        /* Stat cards */
        .tr-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .tr-stat { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); transition: transform 0.2s; }
        .tr-stat:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }
        .tr-stat-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; flex-shrink: 0; }
        .tr-stat-blue .tr-stat-icon { background: #eff6ff; color: #3b82f6; }
        .tr-stat-purple .tr-stat-icon { background: #faf5ff; color: #a855f7; }
        .tr-stat-teal .tr-stat-icon { background: #f0fdfa; color: #0d9488; }
        .tr-stat-count { color: #1e2433; font-size: 32px; font-weight: 800; line-height: 1; }
        .tr-stat-label { color: #64748b; font-size: 14px; margin-bottom: 4px; font-weight: 600; }
        .tr-stat-tag { font-size: 14px; color: #94a3b8; font-weight: 500; margin-left: 6px; }

        /* Table card */
        .tr-card { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .tr-card-header { padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: #ffffff; }
        .tr-card-title { font-size: 18px; font-weight: 700; color: #1e2433; }
        .tr-search-bar { display: flex; gap: 8px; align-items: center; }
        .tr-search-input { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; font-size: 14px; outline: none; transition: border-color .2s; background: #fff; width: 260px; }
        .tr-search-input:focus { border-color: #3b82f6; }
        .tr-table { width: 100%; border-collapse: collapse; }
        .tr-table thead tr { background: #f8fafc; }
        .tr-table th { padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .05em; text-align: left; white-space: nowrap; }
        .tr-table tbody tr { border-top: 1px solid #f1f5f9; transition: background .1s; }
        .tr-table tbody tr:hover { background: #f8fafc; }
        .tr-table td { padding: 14px 16px; font-size: 14px; color: #334155; vertical-align: middle; }
        .tr-empty td { text-align: center; padding: 48px !important; color: #94a3b8; font-size: 14px; }

        /* Form Layout Panel */
        .tr-form-panel { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }

        /* Clean Section Headers */
        .tr-section-header { padding: 20px 24px 10px; font-size: 18px; font-weight: 700; color: #1e2433; border-radius: 0; background: #fff; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #f1f5f9; }
        .tr-section-body { padding: 24px; }

        /* Form Inputs */
        .tr-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .tr-form-row.tri { grid-template-columns: 1fr 1fr 1fr; }
        .tr-form-row.single { grid-template-columns: 1fr; }
        .tr-fg { display: flex; flex-direction: column; gap: 6px; }
        .tr-fg.span2 { grid-column: span 2; }
        .tr-label { font-size: 14px; font-weight: 600; color: #334155; }
        .tr-input, .tr-select { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 16px; font-size: 15px; color: #1e293b; outline: none; transition: border-color .2s; background: #fff; width: 100%; box-sizing: border-box; }
        .tr-input:focus, .tr-select:focus { border-color: #3b82f6; }

        /* Employee search dropdown */
        .tr-emp-search-wrap { position: relative; }
        .tr-emp-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 50; margin-top: 6px; overflow: hidden; }
        .tr-emp-opt { padding: 12px 16px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background .1s; }
        .tr-emp-opt:hover { background: #f8fafc; }
        .tr-emp-opt-name { font-weight: 600; color: #1e2433; font-size: 15px; }
        .tr-emp-opt-sub  { font-size: 13px; color: #64748b; margin-top: 2px; }

        /* Comparison table */
        .tr-compare { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .tr-compare thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .tr-compare th { padding: 12px 16px; font-size: 13px; font-weight: 700; color: #475569; text-align: left; }
        .tr-compare tbody tr { border-bottom: 1px solid #f1f5f9; }
        .tr-compare tbody tr:hover { background: #f8fafc; }
        .tr-compare td { padding: 12px 16px; font-size: 14px; color: #334155; vertical-align: middle; }
        .tr-compare td:first-child { font-weight: 600; color: #1e293b; width: 180px; background: #fafbfc; }
        .tr-compare td.old-val { color: #64748b; }

        /* Footer buttons */
        .tr-form-footer { padding: 20px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 12px; background: #f8fafc; }
        .btn-tr-cancel { padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; background: #e2e8f0; color: #475569; border: none; transition: background .2s; }
        .btn-tr-cancel:hover { background: #cbd5e1; }
        .btn-tr-save { padding: 12px 28px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; background: #3b82f6; color: #fff; border: none; transition: all .2s; }
        .btn-tr-save:hover:not(:disabled) { background: #2563eb; }
        .btn-tr-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* File upload */
        .tr-file-label { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border: 2px dashed #cbd5e1; border-radius: 12px; cursor: pointer; background: #f8fafc; transition: all .2s; font-size: 14px; color: #64748b; font-weight: 500; }
        .tr-file-label:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }

        @media(max-width:640px){ .tr-stats { grid-template-columns:1fr; } .tr-form-row, .tr-form-row.tri { grid-template-columns:1fr; } }
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
              <div className="tr-stat-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <div>
                <div className="tr-stat-count">{transfers.length}</div>
                <div className="tr-stat-label">คำสั่งทั้งหมด</div>
              </div>
              <div className="tr-stat-tag">รายการ</div>
            </div>
            <div className="tr-stat tr-stat-purple">
              <div className="tr-stat-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <div>
                <div className="tr-stat-count">{transfers.filter(t => t.order_date?.startsWith(new Date().getFullYear().toString())).length}</div>
                <div className="tr-stat-label">โยกย้ายปีนี้</div>
              </div>
              <div className="tr-stat-tag">ปีนี้</div>
            </div>
            <div className="tr-stat tr-stat-teal">
              <div className="tr-stat-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
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
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลด...</td></tr>
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
                      <td style={{ fontSize: 13, color: '#475569' }}>{t.transfer_type || '—'}</td>
                      <td style={{ fontSize: 13, color: '#0284c7', fontWeight: 500 }}>{t.new_dept_name || '—'}</td>
                      <td><span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(20,184,166,0.12)', color: '#0f766e', border: '1px solid rgba(20,184,166,0.3)' }}>บันทึกแล้ว</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className="btn-tr-cancel" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => alert('แสดงรายละเอียดคำสั่ง ' + t.order_no)}>รายละเอียด</button>
                          <button className="btn-tr-save" style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => alert('ดาวน์โหลด PDF คำสั่ง ' + t.order_no)}>
                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            PDF
                          </button>
                        </div>
                      </td>
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
            <div className="tr-section-header tr-section-1">
              1. ข้อมูลคำสั่ง
            </div>
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
            <div className="tr-section-header tr-section-2">
              2. รายละเอียดการเปลี่ยนแปลง
            </div>
            <div className="tr-section-body">

              {/* Employee search */}
              <div className="tr-fg" style={{ marginBottom: 20 }}>
                <label className="tr-label">ผู้ถูกคำสั่ง</label>
                <div className="tr-emp-search-wrap">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="tr-input" style={{ flex: 1 }}
                      placeholder="ค้นหาด้วยชื่อหรือรหัสพนักงาน..."
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
            <div className="tr-section-header tr-section-3">
              3. เอกสารแนบ
            </div>
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
                  <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </span>
                  <span>{orderFile ? orderFile.name : 'อัปโหลดไฟล์คำสั่งฉบับจริง (Scan) .pdf'}</span>
                  <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="tr-form-footer">
              <button className="btn-tr-cancel" onClick={() => { setShowForm(false); setSelected(null); setSearchQ(''); }}>ยกเลิก</button>
              <button className="btn-tr-save" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
