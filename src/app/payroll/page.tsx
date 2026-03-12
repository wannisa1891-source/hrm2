'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';

// --- Interfaces & Types ---
interface Employee { emp_id: string; prefix: string; first_name_th: string; last_name_th: string; base_salary: number; emp_type: string; dept_id: string; }
interface Department { dept_id: string; dept_name: string; }

const TAX_RATE = 0.05;
const SSF_RATE = 0.05;

function calcPayroll(salary: number) {
  const tax = Math.round(salary * TAX_RATE);
  const ssf = Math.round(salary * SSF_RATE);
  const net = salary - tax - ssf;
  return { tax, ssf, net };
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(data => setEmployees(Array.isArray(data) ? data : []));
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
  }, []);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchDept = filterDept ? e.dept_id === filterDept : true;
      const fullName = `${e.first_name_th} ${e.last_name_th}`.toLowerCase();
      const matchSearch = fullName.includes(searchQuery.toLowerCase()) || e.emp_id.includes(searchQuery);
      return matchDept && matchSearch;
    });
  }, [employees, filterDept, searchQuery]);

  const totalNet = filtered.reduce((sum, e) => sum + calcPayroll(e.base_salary).net, 0);

  const deptStats = useMemo(() => {
    const stats = departments.map(d => {
      const amount = employees.filter(e => e.dept_id === d.dept_id).reduce((s, e) => s + e.base_salary, 0);
      return { name: d.dept_name, amount };
    });
    const max = Math.max(...stats.map(s => s.amount)) || 1;
    return stats.map(s => ({ ...s, percent: (s.amount / max) * 100 }));
  }, [employees, departments]);

  return (
    <AppLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>

        {/* 1. Header & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Analytics Dashboard</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>จัดการเงินเดือนและวิเคราะห์งบประมาณพนักงาน</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="ค้นหาพนักงาน..."
                style={{ width: '280px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', outline: 'none' }}
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              <option value="">ทุกแผนก</option>
              {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
            </select>
          </div>
        </div>

        {/* 2. Key Stats & Analytics Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '30px' }}>

          {/* Total Budget Card */}
          <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)' }}>
            <span style={{ fontSize: '16px', opacity: 0.8, marginBottom: '8px' }}>งบประมาณสุทธิรวม (รายเดือน)</span>
            <h2 style={{ fontSize: '36px', fontWeight: 800 }}>฿{totalNet.toLocaleString()}</h2>
            <div style={{ marginTop: '20px', padding: '8px 16px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', width: 'fit-content', fontSize: '12px' }}>
              ⚡ อัปเดตล่าสุดวันนี้
            </div>
          </div>

          {/* Department Chart Card */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '20px' }}>สัดส่วนงบประมาณตามแผนก</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '140px' }}>
              {deptStats.map(ds => (
                <div key={ds.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '100%', backgroundColor: '#f8fafc', borderRadius: '8px', height: '100px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${ds.percent}%`, background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px', transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{ds.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Modern Data Table */}
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>พนักงาน</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>แผนก</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>เงินเดือน</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>รับสุทธิ</th>
                <th style={{ padding: '16px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const { net } = calcPayroll(e.base_salary);
                return (
                  <tr key={e.emp_id} className="table-row-hover" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{e.prefix}{e.first_name_th} {e.last_name_th}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>#{e.emp_id}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                        {getDeptName(e.dept_id)}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', color: '#1e293b', fontWeight: 500 }}>
                      {e.base_salary.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>฿{net.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button onClick={() => openEditModal(e)} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => { if (confirm('ลบ?')) setEmployees(prev => prev.filter(x => x.emp_id !== e.emp_id)) }} style={{ border: 'none', background: '#fff1f2', color: '#f43f5e', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Modern Modal */}
        {isModalOpen && editingEmp && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>แก้ไขข้อมูลรายได้</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>{editingEmp.prefix}{editingEmp.first_name_th} {editingEmp.last_name_th}</p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>เงินเดือนพื้นฐาน (THB)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '16px' }}
                  value={editingEmp.base_salary}
                  onChange={ev => setEditingEmp({ ...editingEmp, base_salary: Number(ev.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>ยกเลิก</button>
                <button onClick={() => {
                  setEmployees(prev => prev.map(e => e.emp_id === editingEmp.emp_id ? editingEmp : e));
                  setIsModalOpen(false);
                }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer' }}>บันทึกข้อมูล</button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          .table-row-hover:hover { background-color: #f8fafc; }
        `}</style>
      </div>
    </AppLayout>
  );
}