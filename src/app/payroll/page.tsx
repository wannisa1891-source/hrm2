'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Employee {
  emp_id: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  base_salary: number | string;
  dept_id: string | number;
}

interface Department {
  dept_id: string | number;
  dept_name: string;
}

const TAX_RATE = 0.05;
const SSF_RATE = 0.05;
const SSF_MAX = 750;

function calcPayroll(salary: number) {
  const tax = Math.round(salary * TAX_RATE);
  const ssf = Math.min(Math.round(salary * SSF_RATE), SSF_MAX);
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
    Promise.all([
      fetch('/api/employees').then(r => r.json()),
      fetch('/api/departments').then(r => r.json())
    ]).then(([empData, deptData]) => {
      setEmployees(Array.isArray(empData) ? empData : []);
      setDepartments(Array.isArray(deptData) ? deptData : []);
    }).catch(err => {
      console.error('Failed to fetch payroll data:', err);
      setEmployees([]);
      setDepartments([]);
    });
  }, []);

  const getDeptName = (id: string | number) =>
    departments.find(d => String(d.dept_id) === String(id))?.dept_name || id;

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchDept = filterDept ? String(e.dept_id) === String(filterDept) : true;
      const fullName = `${e.first_name_th} ${e.last_name_th}`.toLowerCase();
      return (fullName.includes(searchQuery.toLowerCase()) || e.emp_id.includes(searchQuery)) && matchDept;
    });
  }, [employees, filterDept, searchQuery]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, e) => {
      const salary = Number(e.base_salary) || 0;
      const { tax, ssf, net } = calcPayroll(salary);
      return { base: acc.base + salary, tax: acc.tax + tax, ssf: acc.ssf + ssf, net: acc.net + net };
    }, { base: 0, tax: 0, ssf: 0, net: 0 });
  }, [filtered]);

  const deptStats = useMemo(() => {
    const stats = departments.map(d => {
      const amount = employees
        .filter(e => String(e.dept_id) === String(d.dept_id))
        .reduce((sum, e) => sum + (Number(e.base_salary) || 0), 0);
      return { name: d.dept_name, amount };
    }).sort((a, b) => b.amount - a.amount);
    const max = Math.max(...stats.map(s => s.amount), 0) || 1;
    return stats.map(s => ({ ...s, percent: (s.amount / max) * 100 }));
  }, [employees, departments]);

  return (
    <AppLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '15px', fontFamily: "'Sarabun', sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Payroll Analytics</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="ค้นหา..." style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <select style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">ทุกแผนก</option>
              {departments.map(d => <option key={String(d.dept_id)} value={String(d.dept_id)}>{d.dept_name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '15px', marginBottom: '15px' }}>
          {/* Summary Card */}
          <div style={{ background: '#0f172a', borderRadius: '15px', padding: '20px', color: 'white' }}>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>สุทธิรวม</span>
            <h2 style={{ fontSize: '22px', color: '#10b981', margin: '5px 0' }}>฿{totals.net.toLocaleString()}</h2>
            <div style={{ borderTop: '1px solid #334155', marginTop: '10px', paddingTop: '10px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Base:</span><span>{totals.base.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Deduct:</span><span>{(totals.tax + totals.ssf).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Chart Area with Horizontal Scroll */}
          <div style={{ background: 'white', borderRadius: '15px', padding: '15px', border: '1px solid #eee', overflow: 'hidden' }}>
            <h4 style={{ fontSize: '13px', margin: '0 0 10px 0' }}>งบประมาณรายแผนก (เลื่อนขวาเพื่อดูเพิ่ม)</h4>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '120px', overflowX: 'auto', paddingBottom: '10px' }} className="custom-scroll">
              {deptStats.map(ds => (
                <div key={ds.name} style={{ flex: '0 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#3b82f6', marginBottom: '4px', fontWeight: 700 }}>{ds.amount > 0 ? (ds.amount / 1000).toFixed(0) + 'K' : ''}</span>
                  <div style={{ width: '24px', height: `${ds.percent}%`, minHeight: ds.amount > 0 ? '3px' : '0', background: '#2563eb', borderRadius: '4px 4px 1px 1px' }} />
                  <span style={{ fontSize: '9px', marginTop: '6px', color: '#64748b', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Area with Vertical Scroll */}
        <div style={{ background: 'white', borderRadius: '15px', border: '1px solid #eee', overflow: 'hidden' }}>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="custom-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>พนักงาน</th>
                  <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #eee' }}>แผนก</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #eee' }}>สุทธิ</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #eee' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const { net } = calcPayroll(Number(e.base_salary) || 0);
                  return (
                    <tr key={e.emp_id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                      <td style={{ padding: '8px 15px' }}>
                        <div style={{ fontWeight: 600 }}>{e.first_name_th} {e.last_name_th}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>#{e.emp_id}</div>
                      </td>
                      <td style={{ padding: '8px 15px' }}><span style={{ fontSize: '11px', color: '#64748b' }}>{getDeptName(e.dept_id)}</span></td>
                      <td style={{ padding: '8px 15px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>฿{net.toLocaleString()}</td>
                      <td style={{ padding: '8px 15px', textAlign: 'center' }}>
                        <button onClick={() => { setEditingEmp(e); setIsModalOpen(true); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>✏️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <style jsx>{`
          .custom-scroll::-webkit-scrollbar { height: 6px; width: 6px; }
          .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
          .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
          .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        `}</style>

        {/* Modal (คงเดิม) */}
        {isModalOpen && editingEmp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ background: 'white', width: '300px', borderRadius: '15px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', margin: '0 0 15px 0' }}>แก้ไขรายได้</h3>
              <input type="number" style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' }} value={editingEmp.base_salary} onChange={ev => setEditingEmp({ ...editingEmp, base_salary: ev.target.value })} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '8px', border: 'none', background: '#eee', borderRadius: '8px' }}>ยกเลิก</button>
                <button onClick={() => { setEmployees(prev => prev.map(e => e.emp_id === editingEmp.emp_id ? editingEmp : e)); setIsModalOpen(false); }} style={{ flex: 1, padding: '8px', border: 'none', background: '#2563eb', color: 'white', borderRadius: '8px' }}>บันทึก</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}