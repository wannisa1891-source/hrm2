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
      <div ref={ref} className="payslip-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .payslip-container { padding: 40px; font-family: 'Sarabun', sans-serif; color: #000; width: 210mm; margin: 0 auto; box-sizing: border-box; }
          .ps-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .ps-title { font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 1px; }
          .ps-subtitle { font-size: 16px; margin: 5px 0; }
          
          .ps-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; margin-bottom: 20px; line-height: 1.8; }
          .ps-info-item { display: flex; }
          .ps-info-label { width: 120px; font-weight: bold; }
          
          .ps-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; border: 1px solid #000; }
          .ps-table th, .ps-table td { border: 1px solid #000; padding: 8px 12px; }
          .ps-table th { background: #f0f0f0; text-align: center; }
          .ps-col-title { font-weight: bold; text-align: center; background: #e5e5e5 !important; }
          
          .ps-footer { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; font-size: 14px; line-height: 1.6; }
          .signature-box { border-bottom: 1px dashed #000; width: 200px; margin: 0 auto 10px auto; height: 30px; }
        `}} />

        <div className="ps-header">
          <h1 className="ps-title">ใบรับรองเงินเดือน (PAYSLIP)</h1>
          <p className="ps-subtitle">บริษัท ระบบทรัพยากรบุคคล จำกัด (HRM System Co., Ltd.)</p>
          <p style={{ fontWeight: 'bold', marginTop: '10px' }}>ประจำเดือน: {MONTHS_TH[Number(month)-1]} {year}</p>
        </div>

        <div className="ps-info-grid">
          <div>
            <div className="ps-info-item"><div className="ps-info-label">รหัสพนักงาน:</div><div>{record.emp_id}</div></div>
            <div className="ps-info-item"><div className="ps-info-label">ชื่อ-นามสกุล:</div><div>{record.prefix}{record.first_name_th} {record.last_name_th}</div></div>
          </div>
          <div>
            <div className="ps-info-item"><div className="ps-info-label">ตำแหน่ง:</div><div>{record.pos_name || '-'}</div></div>
            <div className="ps-info-item"><div className="ps-info-label">แผนก:</div><div>{record.dept_name || '-'}</div></div>
          </div>
        </div>

        <table className="ps-table">
          <thead>
            <tr>
              <th colSpan={2} style={{ width: '50%' }}>รายรับ (Earnings)</th>
              <th colSpan={2} style={{ width: '50%' }}>รายการหัก (Deductions)</th>
            </tr>
            <tr>
              <th style={{ width: '35%' }}>รายการ</th>
              <th style={{ width: '15%', textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
              <th style={{ width: '35%' }}>รายการ</th>
              <th style={{ width: '15%', textAlign: 'right' }}>จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>เงินเดือนพื้นฐาน (Base Salary)</td>
              <td style={{ textAlign: 'right' }}>{formatNumber(record.base_salary)}</td>
              { deductions.length > 0 ? (
                <>
                  <td>{deductions[0].type_name} {deductions[0].remark && `(${deductions[0].remark})`}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(deductions[0].amount)}</td>
                </>
              ) : (
                <><td></td><td></td></>
              )}
            </tr>
            
            {/* Loop through the max items between allowances and deductions (excluding the first deduction which is on the base_salary row if any) */}
            {Array.from({ length: Math.max(allowances.length, deductions.length > 1 ? deductions.length - 1 : 0) }).map((_, i) => {
              const a = allowances[i];
              const d = deductions[i + 1];
              return (
                <tr key={i}>
                  <td>{a ? `${a.type_name} ${a.remark ? '('+a.remark+')' : ''}` : ''}</td>
                  <td style={{ textAlign: 'right' }}>{a ? formatNumber(a.amount) : ''}</td>
                  <td>{d ? `${d.type_name} ${d.remark ? '('+d.remark+')' : ''}` : ''}</td>
                  <td style={{ textAlign: 'right' }}>{d ? formatNumber(d.amount) : ''}</td>
                </tr>
              );
            })}

            {/* Empty padding rows to make it look standard */}
            <tr style={{ height: '30px' }}><td></td><td></td><td></td><td></td></tr>

            <tr>
              <td style={{ fontWeight: 'bold' }}>รวมรายรับ (Total Earnings)</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(Number(record.base_salary) + totalAllowances)}</td>
              <td style={{ fontWeight: 'bold' }}>รวมรายการหัก (Total Deductions)</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatNumber(totalDeductions)}</td>
            </tr>
            
            <tr>
              <td colSpan={2} style={{ backgroundColor: '#f9fafb', fontSize: '16px', fontWeight: 'bold', textAlign: 'right', paddingRight: '20px' }}>รายรับสุทธิ (Net Pay)</td>
              <td colSpan={2} style={{ backgroundColor: '#f9fafb', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
                ฿ {formatNumber(netSalary)}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="ps-footer">
          <div>
            <div className="signature-box"></div>
            <div>( ผู้จ่ายเงิน / Employer )</div>
            <div>วันที่: ........./........./.........</div>
          </div>
          <div>
            <div className="signature-box"></div>
            <div>( ผู้รับเงิน / Employee )</div>
            <div>วันที่: ........./........./.........</div>
          </div>
        </div>
      </div>
    </div>
  );
});

PayslipTemplate.displayName = 'PayslipTemplate';
export default PayslipTemplate;
