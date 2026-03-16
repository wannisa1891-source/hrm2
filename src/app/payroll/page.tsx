'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Employee { 
  emp_id: string; 
  prefix: string; 
  first_name_th: string; 
  last_name_th: string; 
  base_salary: number; 
  emp_type: string; 
  dept_id: string; 
}
interface Department { dept_id: string; dept_name: string; }

// Dynamic Payroll config
const CONFIG = {
  tax_rate: 0.05,
  ssf_rate: 0.05,
};

function calcPayroll(salary: number, ot: number = 0, allowance: number = 0, lateDeduct: number = 0) {
  const gross = salary + ot + allowance;
  const tax = Math.round(gross * CONFIG.tax_rate);
  const ssf = Math.round(salary * CONFIG.ssf_rate); // SSF usually based on base salary
  const totalDeduct = tax + ssf + lateDeduct;
  const net = gross - totalDeduct;
  return { gross, tax, ssf, lateDeduct, totalDeduct, net, ot, allowance };
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filter, setFilter] = useState('');
  
  // States for dynamic inputs mapped by emp_id
  const [otData, setOtData] = useState<Record<string, number>>({});
  const [allowanceData, setAllowanceData] = useState<Record<string, number>>({});
  const [lateData, setLateData] = useState<Record<string, number>>({});
  
  // Payslip Modal
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(data => setEmployees(Array.isArray(data) ? data : []));
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
  }, []);

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;
  const filtered = filter ? employees.filter(e => e.dept_id === filter) : employees;
  
  const totalNet = filtered.reduce((sum, e) => sum + calcPayroll(e.base_salary, otData[e.emp_id] || 0, allowanceData[e.emp_id] || 0, lateData[e.emp_id] || 0).net, 0);
  const totalGross = filtered.reduce((sum, e) => sum + calcPayroll(e.base_salary, otData[e.emp_id] || 0, allowanceData[e.emp_id] || 0, lateData[e.emp_id] || 0).gross, 0);
  const totalDeduct = filtered.reduce((sum, e) => sum + calcPayroll(e.base_salary, otData[e.emp_id] || 0, allowanceData[e.emp_id] || 0, lateData[e.emp_id] || 0).totalDeduct, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <style>{`
        .pr-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); overflow: hidden; }
        .pr-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .pr-stat { padding: 24px; border-radius: 18px; color: #fff; position: relative; overflow: hidden; }
        .pr-stat-1 { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
        .pr-stat-2 { background: linear-gradient(135deg, #ef4444, #b91c1c); }
        .pr-stat-3 { background: linear-gradient(135deg, #22c55e, #16a34a); }
        .pr-stat-val { font-size: 32px; font-weight: 800; margin-bottom: 4px; }
        .pr-stat-label { font-size: 14px; opacity: 0.9; font-weight: 500; }
        
        .pr-input { width: 80px; padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 8px; text-align: right; font-size: 13px; outline: none; transition: border-color .15s; }
        .pr-input:focus { border-color: #0ea5e9; }
        
        .btn-payslip { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; background: rgba(14,165,233,0.1); color: #0284c7; border: 1px solid rgba(14,165,233,0.3); transition: all .15s; }
        .btn-payslip:hover { background: #0ea5e9; color: #fff; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .payslip-box { background: #fff; width: 100%; max-width: 600px; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
        .payslip-header { padding: 24px; border-bottom: 2px dashed #e2e8f0; text-align: center; }
        .payslip-body { padding: 24px; }
        .payslip-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .payslip-row.total { font-weight: 700; font-size: 16px; border-top: 2px solid #e2e8f0; border-bottom: none; margin-top: 10px; padding-top: 16px; }
        .payslip-sub { font-size: 12px; color: #64748b; }
        
        @media print {
          body * { visibility: hidden; }
          .payslip-box, .payslip-box * { visibility: visible; }
          .payslip-box { position: absolute; left: 0; top: 0; width: 100%; max-width: none; box-shadow: none; border-radius: 0; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">💰 สรุปบัญชีเงินเดือน</h1>
          <p className="page-subtitle">แสดงข้อมูลการประมวลผลเงินเดือนประจำเดือนนี้</p>
        </div>
        <select className="form-select" style={{ width: 200 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">ทุกแผนก</option>
          {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
        </select>
      </div>

      <div className="pr-summary no-print">
        <div className="pr-stat pr-stat-1">
          <div className="pr-stat-val">฿{totalGross.toLocaleString()}</div>
          <div className="pr-stat-label">รวมรายได้ (Gross)</div>
        </div>
        <div className="pr-stat pr-stat-2">
          <div className="pr-stat-val">฿{totalDeduct.toLocaleString()}</div>
          <div className="pr-stat-label">รวมรายการหัก (Deductions)</div>
        </div>
        <div className="pr-stat pr-stat-3">
          <div className="pr-stat-val">฿{totalNet.toLocaleString()}</div>
          <div className="pr-stat-label">ยอดจ่ายสุทธิ (Net Pay)</div>
        </div>
      </div>

      <div className="pr-card no-print">
        <table className="data-table">
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>พนักงาน</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 13, color: '#64748b' }}>ฐานเงินเดือน</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 13, color: '#64748b' }}>OT / เบี้ยเลี้ยง</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 13, color: '#64748b' }}>สาย/ขาด (หัก)</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 13, color: '#ef4444' }}>รวมหัก (ภาษี+ปกส)</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 13, color: '#22c55e' }}>สุทธิ</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 13, color: '#64748b' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const ot = otData[e.emp_id] || 0;
              const allow = allowanceData[e.emp_id] || 0;
              const late = lateData[e.emp_id] || 0;
              const { tax, ssf, totalDeduct, net } = calcPayroll(e.base_salary, ot, allow, late);
              return (
                <tr key={e.emp_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{e.prefix}{e.first_name_th} {e.last_name_th}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{e.emp_id} | {getDeptName(e.dept_id)}</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#475569' }}>{e.base_salary.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <input type="number" className="pr-input" placeholder="OT" value={ot || ''} onChange={ev => setOtData(p => ({ ...p, [e.emp_id]: Number(ev.target.value) }))} />
                      <input type="number" className="pr-input" placeholder="เบี้ยเลี้ยง" value={allow || ''} onChange={ev => setAllowanceData(p => ({ ...p, [e.emp_id]: Number(ev.target.value) }))} />
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                     <input type="number" className="pr-input" style={{ borderColor: late > 0 ? '#fca5a5' : '' }} placeholder="หักสาย" value={late || ''} onChange={ev => setLateData(p => ({ ...p, [e.emp_id]: Number(ev.target.value) }))} />
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', color: '#dc2626' }}>
                    <div style={{ fontWeight: 600 }}>-{totalDeduct.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>(ภาษี {tax} + ปกส {ssf} + หัก {late})</div>
                  </td>
                  <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 700, color: '#16a34a', fontSize: 15 }}>{net.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                    <button className="btn-payslip" onClick={() => setSelectedEmp(e)}>📄 สลิป</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedEmp && (
        <div className="modal-overlay no-print" onClick={e => e.target === e.currentTarget && setSelectedEmp(null)}>
          <div className="payslip-box">
            <div className="payslip-header">
              <h2 style={{ margin: 0, color: '#1e293b' }}>บริษัท ตัวอย่าง จำกัด</h2>
              <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>สลิปเงินเดือน (Payslip)</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>ประจำเดือน {new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' })}</div>
            </div>
            
            <div className="payslip-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedEmp.prefix}{selectedEmp.first_name_th} {selectedEmp.last_name_th}</div>
                  <div className="payslip-sub">รหัสพนักงาน: {selectedEmp.emp_id}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{getDeptName(selectedEmp.dept_id)}</div>
                  <div className="payslip-sub">ประเภท: {selectedEmp.emp_type}</div>
                </div>
              </div>

              {(() => {
                const { gross, tax, ssf, lateDeduct, totalDeduct, net, ot, allowance } = calcPayroll(selectedEmp.base_salary, otData[selectedEmp.emp_id] || 0, allowanceData[selectedEmp.emp_id] || 0, lateData[selectedEmp.emp_id] || 0);
                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                      
                      {/* รายได้ */}
                      <div>
                        <div style={{ fontWeight: 700, color: '#0ea5e9', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 8 }}>รายได้ (Earnings)</div>
                        <div className="payslip-row">
                          <span>เงินเดือนพื้นฐาน</span><span>{selectedEmp.base_salary.toLocaleString()}</span>
                        </div>
                        <div className="payslip-row">
                          <span>ล่วงเวลา (OT)</span><span>{ot.toLocaleString()}</span>
                        </div>
                        <div className="payslip-row">
                          <span>เบี้ยเลี้ยง</span><span>{allowance.toLocaleString()}</span>
                        </div>
                        <div className="payslip-row total" style={{ color: '#0ea5e9' }}>
                          <span>รวมรายได้</span><span>{gross.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* รายการหัก */}
                      <div>
                        <div style={{ fontWeight: 700, color: '#ef4444', borderBottom: '1px solid #e2e8f0', paddingBottom: 8, marginBottom: 8 }}>รายการหัก (Deductions)</div>
                        <div className="payslip-row">
                          <span>ภาษีหัก ณ ที่จ่าย (5%)</span><span>{tax.toLocaleString()}</span>
                        </div>
                        <div className="payslip-row">
                          <span>ประกันสังคม (5%)</span><span>{ssf.toLocaleString()}</span>
                        </div>
                        <div className="payslip-row">
                          <span>หักมาสาย/ขาด/ลา</span><span>{lateDeduct.toLocaleString()}</span>
                        </div>
                        <div className="payslip-row total" style={{ color: '#ef4444' }}>
                          <span>รวมรายการหัก</span><span>{totalDeduct.toLocaleString()}</span>
                        </div>
                      </div>

                    </div>

                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 20, borderRadius: 12, marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#166534' }}>รายรับสุทธิ (Net Pay)</span>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#15803d' }}>฿ {net.toLocaleString()}</span>
                    </div>

                  </div>
                );
              })()}
            </div>
            
            <div className="payslip-header no-print" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px' }}>
              <button className="btn-tr-cancel" onClick={() => setSelectedEmp(null)}>ปิดหน้าต่าง</button>
              <button className="btn-tr-save" style={{ background: '#10b981', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }} onClick={handlePrint}>🖨️ พิมพ์สลิป</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
