'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';

// --- Interfaces & Types ---
interface Employee {
  emp_id: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  base_salary: number;
  emp_type: string;
  dept_id: string;
}

interface Department {
  dept_id: string;
  dept_name: string;
}

const TAX_RATE = 0.05;
const SSF_RATE = 0.05;

// ฟังก์ชันคำนวณเงินเดือน
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

  // Load Data
  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(data => setEmployees(Array.isArray(data) ? data : []));
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
  }, []);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;

  // Filter Logic
  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchDept = filterDept ? e.dept_id === filterDept : true;
      const fullName = `${e.first_name_th} ${e.last_name_th}`.toLowerCase();
      const matchSearch = fullName.includes(searchQuery.toLowerCase()) || e.emp_id.includes(searchQuery);
      return matchDept && matchSearch;
    });
  }, [employees, filterDept, searchQuery]);

  const totalNet = filtered.reduce((sum, e) => sum + calcPayroll(e.base_salary).net, 0);

  // Analytics Logic (กราฟ)
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: "'Sarabun', sans-serif" }}>

        {/* 1. Header & Search Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>Payroll Analytics</h1>
            <p style={{ color: '#64748b', fontSize: '14px' }}>ระบบจัดการงบประมาณและข้อมูลบุคลากร</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อ หรือรหัส..."
              style={{ width: '280px', padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
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

        {/* 2. Key Stats & Professional Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '20px', marginBottom: '30px' }}>

          {/* Total Budget Card */}
          <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '24px', padding: '30px', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '15px', opacity: 0.7, marginBottom: '8px' }}>งบประมาณจ่ายสุทธิรวม</span>
            <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px' }}>฿{totalNet.toLocaleString()}</h2>
            <div style={{ marginTop: '20px', padding: '6px 14px', background: 'rgba(255,255,255,0.15)', borderRadius: '100px', width: 'fit-content', fontSize: '12px', color: '#fbbf24' }}>
              ● Live Analytics
            </div>
          </div>

          {/* Improved Department Chart (แก้ปัญหาความยาว) */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>งบประมาณรายแผนก</h4>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Unit: THB</span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '15px',
              height: '180px',
              overflowX: 'auto',
              paddingBottom: '15px',
              scrollbarWidth: 'thin'
            }}>
              {deptStats.map(ds => (
                <div key={ds.name} style={{
                  minWidth: '85px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}>
                  {/* ตัวเลขหัวกราฟที่จัดฟอร์แมตใหม่ */}
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#3b82f6', marginBottom: '6px' }}>
                    {ds.amount > 0 ? (
                      ds.amount >= 1000000
                        ? (ds.amount / 1000000).toFixed(1) + 'M'
                        : ds.amount >= 1000
                          ? (ds.amount / 1000).toFixed(0) + 'K'
                          : ds.amount
                    ) : ''}
                  </span>

                  <div
                    className="chart-bar"
                    style={{
                      width: '35px',
                      height: `${ds.percent}%`,
                      background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
                      borderRadius: '8px 8px 4px 4px',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
                      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    title={`${ds.name}: ${ds.amount.toLocaleString()} บาท`}
                  >
                    <div style={{ position: 'absolute', top: '4px', left: '20%', width: '60%', height: '15%', background: 'rgba(255,255,255,0.2)', borderRadius: '20px' }}></div>
                  </div>

                  {/* ชื่อแผนกแบบตัดคำ (Ellipsis) */}
                  <span style={{
                    fontSize: '11px',
                    color: '#64748b',
                    fontWeight: 500,
                    marginTop: '12px',
                    textAlign: 'center',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={ds.name}>
                    {ds.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Modern Data Table */}
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '18px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>พนักงาน</th>
                <th style={{ padding: '18px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600 }}>แผนก</th>
                <th style={{ padding: '18px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>เงินเดือน</th>
                <th style={{ padding: '18px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'right' }}>รับสุทธิ</th>
                <th style={{ padding: '18px 24px', color: '#64748b', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const { net } = calcPayroll(e.base_salary);
                return (
                  <tr key={e.emp_id} className="table-row" style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{e.prefix}{e.first_name_th} {e.last_name_th}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>#{e.emp_id}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px', color: '#475569', fontWeight: 500 }}>
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
                        <button onClick={() => { setEditingEmp({ ...e }); setIsModalOpen(true); }} style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => { if (confirm('ลบข้อมูลพนักงานคนนี้?')) setEmployees(prev => prev.filter(x => x.emp_id !== e.emp_id)) }} style={{ border: 'none', background: '#fff1f2', color: '#f43f5e', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. Glassmorphism Modal */}
        {isModalOpen && editingEmp && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '400px', borderRadius: '28px', padding: '35px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: '#1e293b' }}>แก้ไขรายได้</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>พนักงาน: {editingEmp.first_name_th} {editingEmp.last_name_th}</p>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>เงินเดือนพื้นฐาน (THB)</label>
                <input
                  type="number"
                  style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '16px', fontWeight: 600 }}
                  value={editingEmp.base_salary}
                  onChange={ev => setEditingEmp({ ...editingEmp, base_salary: Number(ev.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>ยกเลิก</button>
                <button onClick={() => {
                  setEmployees(prev => prev.map(e => e.emp_id === editingEmp.emp_id ? editingEmp : e));
                  setIsModalOpen(false);
                }} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>บันทึกข้อมูล</button>
              </div>
            </div>
          </div>
        )}

        {/* Global CSS */}
        <style jsx>{`
          .table-row:hover { background-color: #f8fafc; }
          .chart-bar:hover {
            transform: scaleX(1.1) translateY(-5px);
            filter: brightness(1.1);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4) !important;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}