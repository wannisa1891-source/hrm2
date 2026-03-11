'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Department { dept_id: string; dept_name: string; }
interface Employee { emp_id: string; prefix: string; first_name_th: string; last_name_th: string; dept_id: string; pos_id: string; base_salary: number; }
interface SearchResult { id: string; name: string; pos: string; dept: string; salary: number; }

export default function TransferPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    orderNo: '', orderDate: '', title: '', empId: '',
    oldDeptId: '', newDeptId: '', oldPos: '', newPos: '',
    oldSalary: 0, newSalary: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
  }, []);

  const search = async () => {
    if (!searchQ.trim()) return;
    const res = await fetch(`/api/staff-search?q=${encodeURIComponent(searchQ)}`);
    setSearchResults(await res.json());
  };

  const selectEmployee = (emp: SearchResult) => {
    setSelected(emp);
    setForm(f => ({ ...f, empId: emp.id, oldPos: emp.pos, oldSalary: emp.salary }));
    setSearchResults([]);
    setSearchQ(emp.name);
  };

  const handleSave = async () => {
    if (!selected || !form.orderNo || !form.newDeptId) { alert('กรุณากรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('data', JSON.stringify(form));
    if (orderFile) fd.append('order_file', orderFile);
    const res = await fetch('/api/transfers', { method: 'POST', body: fd });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      alert('✅ บันทึกคำสั่งย้ายสำเร็จ!');
      setSelected(null); setSearchQ('');
      setForm({ orderNo: '', orderDate: '', title: '', empId: '', oldDeptId: '', newDeptId: '', oldPos: '', newPos: '', oldSalary: 0, newSalary: 0 });
    } else alert('เกิดข้อผิดพลาด');
  };

  const setF = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AppLayout>
      <div style={{ fontFamily: 'Sarabun, sans-serif' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">📋 ระบบการโยกย้าย</h1>
            <p className="page-subtitle">บันทึกคำสั่งแต่งตั้ง / โยกย้าย / เลื่อนตำแหน่ง</p>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: 20, fontWeight: 700 }}>📄 บันทึกคำสั่ง</h3>

          {/* Order Info */}
          <div className="form-grid">
            <div className="form-group"><label className="form-label">เลขที่คำสั่ง</label><input className="form-input" value={form.orderNo} onChange={e => setF('orderNo', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">วันที่คำสั่ง</label><input type="date" className="form-input" value={form.orderDate} onChange={e => setF('orderDate', e.target.value)} /></div>
            <div className="form-group full"><label className="form-label">เรื่อง</label><input className="form-input" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="เช่น คำสั่งแต่งตั้งข้าราชการ" /></div>
          </div>

          {/* Employee Search */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label">ค้นหาพนักงาน</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="form-input" style={{ flex: 1 }} value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="ใส่ชื่อหรือรหัสพนักงาน..." />
              <button className="btn-primary" onClick={search}>🔍 ค้นหา</button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, marginTop: 8, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                {searchResults.map(r => (
                  <div key={r.id} onClick={() => selectEmployee(r)}
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'white'}
                  >
                    <div style={{ fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{r.pos} | {r.dept}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transfer Details */}
          {selected && (
            <div style={{ background: '#f8fafc', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>รายละเอียดการย้าย: {selected.name}</h4>
              <div className="form-grid">
                <div className="form-group"><label className="form-label">ตำแหน่งเดิม</label><input className="form-input" value={form.oldPos} onChange={e => setF('oldPos', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">ตำแหน่งใหม่</label><input className="form-input" value={form.newPos} onChange={e => setF('newPos', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">แผนกใหม่</label>
                  <select className="form-select" value={form.newDeptId} onChange={e => setF('newDeptId', e.target.value)}>
                    <option value="">-- เลือกแผนกใหม่ --</option>
                    {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">เงินเดือนใหม่</label><input type="number" className="form-input" value={form.newSalary} onChange={e => setF('newSalary', Number(e.target.value))} /></div>
                <div className="form-group full"><label className="form-label">ไฟล์คำสั่ง (PDF)</label><input type="file" className="form-input" accept=".pdf,.jpg,.png" onChange={e => setOrderFile(e.target.files?.[0] || null)} /></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกคำสั่งย้าย'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
