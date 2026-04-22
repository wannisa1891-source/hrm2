'use client';

import React, { forwardRef } from 'react';

interface PayslipProps {
  record: any;
  allowances: any[];
  deductions: any[];
  month: string;
  year: string;
}

const formatNumber = (num: number) => Number(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const PayslipTemplate = forwardRef<HTMLDivElement, PayslipProps>(({ record, allowances, deductions, month, year }, ref) => {
  if (!record) return null;

  const totalAllowances = allowances.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const totalDeductions = deductions.reduce((acc, curr) => acc + Number(curr.amount), 0);
  const netSalary = Number(record.base_salary) + totalAllowances - totalDeductions;

  return (
    <div style={{ display: 'none' }}>
      <div ref={ref} className="modern-payslip">
        <style dangerouslySetInnerHTML={{
          __html: `
          @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap');
          
          .modern-payslip { 
            padding: 60px; 
            font-family: 'Prompt', sans-serif; 
            color: #2d3748; 
            width: 210mm; 
            margin: 0 auto; 
            background: #fff;
          }

          .header-grid { display: grid; grid-template-columns: 1fr 1fr; margin-bottom: 40px; align-items: center; }
          .brand-name { font-size: 22px; font-weight: 600; color: #4a5568; }
          .doc-type { text-align: right; font-size: 14px; color: #a0aec0; letter-spacing: 2px; }

          .hero-card { 
            background: #f7fafc; 
            border-radius: 16px; 
            padding: 30px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            margin-bottom: 40px;
            border: 1px solid #edf2f7;
          }
          .hero-label { font-size: 14px; color: #718096; margin-bottom: 5px; }
          .hero-value { font-size: 32px; font-weight: 600; color: #2d3748; }
          .period-badge { background: #2d3748; color: #fff; padding: 6px 16px; border-radius: 99px; font-size: 13px; }

          .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; padding: 0 10px; }
          .info-box span { display: block; }
          .label { font-size: 11px; color: #a0aec0; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 14px; font-weight: 500; color: #4a5568; }

          .section-title { font-size: 14px; font-weight: 600; color: #718096; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #edf2f7; }
          
          .data-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
          .data-row.total { border-top: 1px dashed #e2e8f0; margin-top: 10px; font-weight: 600; }
          
          .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }

          .footer-sig { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; }
          .sig-box { border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 12px; color: #a0aec0; }
        `}} />

        <div className="header-grid">
          <div className="brand-name">HRM SYSTEM CO., LTD.</div>
          <div className="doc-type">PAYSLIP / ใบแจ้งเงินเดือน</div>
        </div>

        <div className="hero-card">
          <div>
            <div className="hero-label">ยอดเงินโอนสุทธิ (Net Salary)</div>
            <div className="hero-value">฿ {formatNumber(netSalary)}</div>
          </div>
          <div className="period-badge">
            รอบเดือน {MONTHS_TH[Number(month) - 1]} {year}
          </div>
        </div>

        <div className="info-grid">
          <div className="info-box"><span className="label">Employee ID</span><span className="value">{record.emp_id}</span></div>
          <div className="info-box"><span className="label">Name</span><span className="value">{record.prefix}{record.first_name_th} {record.last_name_th}</span></div>
          <div className="info-box"><span className="label">Position</span><span className="value">{record.pos_name || '-'}</span></div>
          <div className="info-box"><span className="label">Department</span><span className="value">{record.dept_name || '-'}</span></div>
        </div>

        <div className="grid-container">
          {/* Earnings Column */}
          <div>
            <div className="section-title">รายรับ (EARNINGS)</div>
            <div className="data-row">
              <span>เงินเดือนพื้นฐาน (Base Salary)</span>
              <span>{formatNumber(record.base_salary)}</span>
            </div>
            {allowances.map((a, i) => (
              <div className="data-row" key={i}>
                <span>{a.type_name} {a.remark && `(${a.remark})`}</span>
                <span>{formatNumber(a.amount)}</span>
              </div>
            ))}
            <div className="data-row total">
              <span>รวมรายรับ</span>
              <span>{formatNumber(Number(record.base_salary) + totalAllowances)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div>
            <div className="section-title">รายหัก (DEDUCTIONS)</div>
            {deductions.length > 0 ? deductions.map((d, i) => (
              <div className="data-row" key={i}>
                <span>{d.type_name} {d.remark && `(${d.remark})`}</span>
                <span>-{formatNumber(d.amount)}</span>
              </div>
            )) : (
              <div className="data-row" style={{ color: '#cbd5e0' }}><span>ไม่มีรายการหัก</span><span>0.00</span></div>
            )}
            <div className="data-row total" style={{ color: '#e53e3e' }}>
              <span>รวมรายหัก</span>
              <span>-{formatNumber(totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className="footer-sig">
          <div className="sig-box">ลายมือชื่อพนักงาน (Employee Signature)</div>
          <div className="sig-box">ผู้มีอำนาจลงนาม (Authorized Person)</div>
        </div>
      </div>
    </div>
  );
});

PayslipTemplate.displayName = 'PayslipTemplate';
export default PayslipTemplate;