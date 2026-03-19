'use client';

import React, { forwardRef } from 'react';

interface TransferRecord {
  transfer_id: string;
  order_no: string;
  order_date: string;
  effective_date: string;
  subject: string;
  transfer_type: string;
  emp_id: string;
  emp_name: string;
  old_dept_id: string;
  old_dept_name: string;
  new_dept_id: string;
  new_dept_name: string;
  old_position: string;
  new_position: string;
  old_level: string;
  new_level: string;
  old_pos_no: string;
  new_pos_no: string;
  old_salary: number;
  new_salary: number;
  remark: string;
}

interface OrderPdfTemplateProps {
  transfer: TransferRecord | null;
}

const OrderPdfTemplate = forwardRef<HTMLDivElement, OrderPdfTemplateProps>(({ transfer }, ref) => {
  if (!transfer) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '..............................';
    const d = new Date(dateStr);
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `วันที่ ${d.getDate()} เดือน ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  return (
    <div style={{ display: 'none' }}>
      <div 
        ref={ref} 
        style={{ 
          padding: '2cm 2.5cm', 
          width: '21cm', 
          minHeight: '29.7cm', 
          backgroundColor: '#fff', 
          color: '#000', 
          fontFamily: '"Sarabun", "TH Sarabun New", sans-serif', 
          fontSize: '16pt', 
          lineHeight: '1.5',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1cm' }}>
          {/* Placeholder for Garuda */}
          <div style={{ display: 'inline-block', width: '3cm', height: '3.5cm', border: '1px solid #ccc', borderRadius: '4px', lineHeight: '3.5cm', color: '#ccc', fontSize: '12pt' }}>
            (ตราครุฑ)
          </div>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20pt', marginBottom: '1cm' }}>
          คำสั่งโรงพยาบาล<br/>
          ที่ {transfer.order_no || '......../..................'}
        </div>

        <div style={{ fontWeight: 'bold', fontSize: '18pt', marginBottom: '1cm' }}>
          เรื่อง {transfer.subject || transfer.transfer_type}
        </div>

        <div style={{ marginBottom: '0.5cm' }}>
          <span style={{ paddingLeft: '2cm' }}></span>
          เพื่อให้การบริหารงานบุคคลของโรงพยาบาลเป็นไปด้วยความเรียบร้อยและมีประสิทธิภาพ อาศัยอำนาจตามระเบียบของกระทรวงสาธารณสุข จึงมีคำสั่ง{transfer.transfer_type} <strong>{transfer.emp_name}</strong> (รหัสพนักงาน: {transfer.emp_id}) ดังรายละเอียดต่อไปนี้
        </div>

        <div style={{ marginBottom: '1cm', marginTop: '1cm' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '30%' }}>รายการ</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '35%' }}>ตำแหน่งเดิม</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '35%' }}>ตำแหน่งใหม่</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>สังกัด / แผนก</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{transfer.old_dept_name || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{transfer.new_dept_name || '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>ตำแหน่ง</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{transfer.old_position || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{transfer.new_position || '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>ระดับ</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{transfer.old_level || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{transfer.new_level || '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>เลขที่ตำแหน่ง</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{transfer.old_pos_no || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{transfer.new_pos_no || '-'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #000', padding: '8px' }}>อัตราเงินเดือน</td>
                <td style={{ border: '1px solid #000', padding: '8px' }}>{transfer.old_salary ? transfer.old_salary.toLocaleString() : '-'} บาท</td>
                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{transfer.new_salary ? transfer.new_salary.toLocaleString() : '-'} บาท</td>
              </tr>
            </tbody>
          </table>
        </div>

        {transfer.remark && (
          <div style={{ marginBottom: '1cm' }}>
            <span style={{ fontWeight: 'bold' }}>หมายเหตุ:</span> {transfer.remark}
          </div>
        )}

        <div style={{ marginBottom: '2cm' }}>
          <span style={{ paddingLeft: '2cm' }}></span>
          ทั้งนี้ ตั้งแต่ {formatDate(transfer.effective_date)} เป็นต้นไป
        </div>

        <div style={{ marginTop: '3cm', textAlign: 'right', paddingRight: '2cm' }}>
          สั่ง ณ {formatDate(transfer.order_date)}<br/><br/><br/><br/>
          (.......................................................)<br/>
          ผู้อำนวยการโรงพยาบาล
        </div>
      </div>
    </div>
  );
});

OrderPdfTemplate.displayName = 'OrderPdfTemplate';

export default OrderPdfTemplate;
