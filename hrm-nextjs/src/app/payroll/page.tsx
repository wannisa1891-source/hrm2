'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';

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
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(data => setEmployees(Array.isArray(data) ? data : []));
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
  }, []);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;
  const filtered = filter ? employees.filter(e => e.dept_id === filter) : employees;
  const totalNet = filtered.reduce((sum, e) => sum + calcPayroll(e.base_salary).net, 0);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 ระบบเงินเดือน</h1>
          <p className="page-subtitle">ยอดรวมสุทธิ: <strong style={{ color: '#16a34a' }}>{totalNet.toLocaleString()} บาท</strong></p>
        </div>
        <select className="form-select" style={{ width: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">ทุกแผนก</option>
          {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>รหัส</th><th>ชื่อ-นามสกุล</th><th>แผนก</th>
              <th style={{ textAlign: 'right' }}>เงินเดือน</th>
              <th style={{ textAlign: 'right' }}>ภาษี (5%)</th>
              <th style={{ textAlign: 'right' }}>ประกันสังคม (5%)</th>
              <th style={{ textAlign: 'right' }}>สุทธิ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const { tax, ssf, net } = calcPayroll(e.base_salary);
              return (
                <tr key={e.emp_id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.emp_id}</span></td>
                  <td style={{ fontWeight: 600 }}>{e.prefix}{e.first_name_th} {e.last_name_th}</td>
                  <td style={{ fontSize: 13, color: '#888' }}>{getDeptName(e.dept_id)}</td>
                  <td style={{ textAlign: 'right' }}>{e.base_salary.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-{tax.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>-{ssf.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{net.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
