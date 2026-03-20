'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter, useSearchParams } from 'next/navigation';
import PayslipTemplate from '@/components/Payroll/PayslipTemplate';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';

interface PayrollRecord {
  payroll_id: string;
  emp_id: string;
  prefix: string;
  first_name_th: string;
  last_name_th: string;
  pos_name: string;
  dept_name: string;
  base_salary: number;
  total_allowance: number;
  total_deduction: number;
  net_salary: number;
  status: string;
}

interface AllowanceDeduction {
  id: number;
  type_name: string;
  amount: number;
  remark: string;
}

const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const BackIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const PrintIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const TrashIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CheckIcon = <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>;
const CloseIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PlusIcon = <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;

function PayrollProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Master Types
  const [allowanceTypes, setAllowanceTypes] = useState<any[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<any[]>([]);

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [allowances, setAllowances] = useState<AllowanceDeduction[]>([]);
  const [deductions, setDeductions] = useState<AllowanceDeduction[]>([]);
  
  // Add Form State
  const [addType, setAddType] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addRemark, setAddRemark] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Printing
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: selectedRecord ? `Payslip_${selectedRecord.emp_id}_${month}_${year}` : 'Payslip',
  });

  useEffect(() => {
    if (!month || !year) {
      router.push('/payroll');
      return;
    }
    fetchMasterData();
    fetchRecords();
  }, [month, year]);

  const fetchMasterData = async () => {
    try {
      const res = await fetch('/api/payroll/master');
      const data = await res.json();
      setAllowanceTypes(data.allowances || []);
      setDeductionTypes(data.deductions || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = async (record: PayrollRecord) => {
    setSelectedRecord(record);
    await fetchDetails(record.payroll_id);
  };

  const fetchDetails = async (payroll_id: string) => {
    try {
      const [allowRes, deducRes] = await Promise.all([
        fetch(`/api/payroll/allowances?payroll_id=${payroll_id}`),
        fetch(`/api/payroll/deductions?payroll_id=${payroll_id}`)
      ]);
      setAllowances(await allowRes.json());
      setDeductions(await deducRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const closeModal = () => {
    setSelectedRecord(null);
    setAddType('');
    setAddAmount('');
    setAddRemark('');
    setIsAdding(false);
    fetchRecords();
  };

  const handleAddDetail = async (kind: 'allowance' | 'deduction') => {
    if (!addType || !addAmount) return;
    
    try {
      const endpoint = kind === 'allowance' ? '/api/payroll/allowances' : '/api/payroll/deductions';
      const body = kind === 'allowance' 
        ? { payroll_id: selectedRecord!.payroll_id, allowance_type_id: addType, amount: Number(addAmount), remark: addRemark }
        : { payroll_id: selectedRecord!.payroll_id, deduction_type_id: addType, amount: Number(addAmount), remark: addRemark };
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        setAddType(''); setAddAmount(''); setAddRemark(''); setIsAdding(false);
        fetchDetails(selectedRecord!.payroll_id); // Refresh modal lists
      } else {
        const error = await res.json();
        Swal.fire('ข้อผิดพลาด', error.error, 'error');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDetail = async (kind: 'allowance' | 'deduction', id: number) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันการลบรายการนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;
    try {
      const endpoint = kind === 'allowance' ? '/api/payroll/allowances' : '/api/payroll/deductions';
      const res = await fetch(`${endpoint}?id=${id}&payroll_id=${selectedRecord!.payroll_id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchDetails(selectedRecord!.payroll_id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatStatus = (status: string) => {
    if (status === 'Draft') return 'ยังไม่อนุมัติ';
    if (status === 'Approved') return 'อนุมัติแล้ว';
    if (status === 'Paid') return 'จ่ายแล้ว';
    return status;
  };

  return (
    <AppLayout>
      <div className="process-page custom-scroll">
        <div className="ps-header-wrapper">
          <div className="ps-header">
            <button className="btn-back" onClick={() => router.push('/payroll')}>
              {BackIcon} ย้อนกลับ
            </button>
            <div>
              <h1 className="pd-title">จัดการเงินเดือนพนักงาน</h1>
              <p className="pd-subtitle">
                ประจำเดือน: <strong>{MONTHS_TH[Number(month) - 1]} {year}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="pd-summary-list">
          {isLoading ? (
            <div className="loading-state">กำลังโหลดข้อมูลพนักงาน...</div>
          ) : (
            <div className="pd-table-container">
              <table className="pd-table">
                <thead>
                  <tr>
                    <th>ชื่อพนักงาน<span>(Employee)</span></th>
                    <th>แผนก/ตำแหน่ง<span>(Department)</span></th>
                    <th style={{ textAlign: 'right' }}>ฐานเงินเดือน<span>(Base)</span></th>
                    <th style={{ textAlign: 'right' }}>รายรับพิเศษ<span>(Allowances)</span></th>
                    <th style={{ textAlign: 'right' }}>รายการหัก<span>(Deductions)</span></th>
                    <th style={{ textAlign: 'right' }}>สุทธิ (บาท)<span>(Net Salary)</span></th>
                    <th style={{ textAlign: 'center' }}>สถานะ<span>(Status)</span></th>
                    <th style={{ textAlign: 'center' }}>จัดการ<span>(Action)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.payroll_id}>
                      <td>
                        <div className="emp-name-main">{r.prefix}{r.first_name_th} {r.last_name_th}</div>
                        <div className="emp-id-sub">รหัส: {r.emp_id}</div>
                      </td>
                      <td>
                        <div className="dept-badge">{r.dept_name || 'ไม่มีแผนก'}</div>
                        <div className="pos-sub">{r.pos_name || '-'}</div>
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>฿{Number(r.base_salary).toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="amt-plus">{r.total_allowance > 0 ? `+฿${Number(r.total_allowance).toLocaleString()}` : '-'}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="amt-minus">{r.total_deduction > 0 ? `-฿${Number(r.total_deduction).toLocaleString()}` : '-'}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a', fontSize: '15px' }}>
                        ฿{Number(r.net_salary).toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                         <span className={`status-badge ${r.status.toLowerCase()}`}>
                           <span className="dot" />{formatStatus(r.status)}
                         </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn-manage" onClick={() => openModal(r)}>
                          จัดการรับ/หัก ➜
                        </button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={8} className="empty-state">ไม่มีข้อมูลพนักงานดร้าฟต์ในเดือนนี้</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail/Edit Modal */}
        {selectedRecord && (
          <div className="modal-overlay" onClick={closeModal} style={{ zIndex: 1000 }}>
            <div className="modal-panel custom-scroll" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 className="modal-emp-title">
                    {selectedRecord.prefix}{selectedRecord.first_name_th} {selectedRecord.last_name_th}
                  </h2>
                  <p className="modal-emp-sub">
                    รหัส: {selectedRecord.emp_id} <span>•</span> ฐานเงินเดือน: ฿{Number(selectedRecord.base_salary).toLocaleString()}
                  </p>
                </div>
                <button className="btn-close" onClick={closeModal}>{CloseIcon}</button>
              </div>

              <div className="modal-body">
                {/* Allowances */}
                <div className="detail-section">
                  <div className="ds-header">
                    <h3>รายรับพิเศษ (รวม OT)</h3>
                    {!isAdding && <button className="btn-add-sm" onClick={() => { setIsAdding(true); setAddType(allowanceTypes[0]?.id || ''); }}>{PlusIcon} เพิ่มรายรับ</button>}
                  </div>
                  
                  {isAdding && allowanceTypes.length > 0 && (
                    <div className="add-form">
                      <select className="form-select flex-2" value={addType} onChange={e => setAddType(e.target.value)}>
                        <option value="" disabled>-- เลือกประเภท --</option>
                        {allowanceTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                      </select>
                      <input type="number" className="form-input flex-1" placeholder="จำนวนเงิน" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                      <input type="text" className="form-input flex-2" placeholder="หมายเหตุ" value={addRemark} onChange={e => setAddRemark(e.target.value)} />
                      <button className="btn-save-sm" onClick={() => handleAddDetail('allowance')}>{CheckIcon}</button>
                      <button className="btn-cancel-sm" onClick={() => setIsAdding(false)}>{CloseIcon}</button>
                    </div>
                  )}

                  {allowances.map(a => (
                    <div key={a.id} className="detail-item">
                      <div>
                        <div className="di-name">{a.type_name}</div>
                        {a.remark && <div className="di-remark">{a.remark}</div>}
                      </div>
                      <div className="di-actions">
                        <span className="di-amt plus">+฿{Number(a.amount).toLocaleString()}</span>
                        <button className="btn-del-sm" onClick={() => handleDeleteDetail('allowance', a.id)}>{TrashIcon}</button>
                      </div>
                    </div>
                  ))}
                  {allowances.length === 0 && !isAdding && <div className="empty-detail">ไม่มีรายการรายรับเพิ่มเติม</div>}
                </div>

                {/* Deductions */}
                <div className="detail-section" style={{ marginTop: '32px' }}>
                  <div className="ds-header">
                    <h3 className="red">รายการหัก (ลบ)</h3>
                    {!isAdding && <button className="btn-add-sm red" onClick={() => { setIsAdding(true); setAddType(deductionTypes[0]?.id || ''); }}>{PlusIcon} เพิ่มรายการหัก</button>}
                  </div>
                  
                  {isAdding && deductionTypes.length > 0 && (
                    <div className="add-form red-form">
                      <select className="form-select flex-2" value={addType} onChange={e => setAddType(e.target.value)}>
                        <option value="" disabled>-- เลือกประเภท --</option>
                        {deductionTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                      </select>
                      <input type="number" className="form-input flex-1" placeholder="จำนวนเงิน" value={addAmount} onChange={e => setAddAmount(e.target.value)} />
                      <input type="text" className="form-input flex-2" placeholder="หมายเหตุ" value={addRemark} onChange={e => setAddRemark(e.target.value)} />
                      <button className="btn-save-sm red" onClick={() => handleAddDetail('deduction')}>{CheckIcon}</button>
                      <button className="btn-cancel-sm" onClick={() => setIsAdding(false)}>{CloseIcon}</button>
                    </div>
                  )}

                  {deductions.map(d => (
                    <div key={d.id} className="detail-item red-item">
                      <div>
                        <div className="di-name">{d.type_name}</div>
                        {d.remark && <div className="di-remark">{d.remark}</div>}
                      </div>
                      <div className="di-actions">
                        <span className="di-amt minus">-฿{Number(d.amount).toLocaleString()}</span>
                        <button className="btn-del-sm red" onClick={() => handleDeleteDetail('deduction', d.id)}>{TrashIcon}</button>
                      </div>
                    </div>
                  ))}
                  {deductions.length === 0 && !isAdding && <div className="empty-detail">ไม่มีรายการหักเพิ่มเติม</div>}
                </div>

              </div>

              {/* Modal Footer / Summary */}
              <div className="modal-footer">
                <div className="mf-summary">
                  <span>รายรับสุทธิ (Net Salary)</span>
                  <span className="mf-total">
                    ฿{(
                      Number(selectedRecord.base_salary) +
                      allowances.reduce((s, a) => s + Number(a.amount), 0) -
                      deductions.reduce((s, d) => s + Number(d.amount), 0)
                    ).toLocaleString()}
                  </span>
                </div>
                
                <div className="mf-actions">
                  <button className="btn-payslip" onClick={handlePrint}>{PrintIcon} PDF สลิปเงินเดือน</button>
                  <button className="btn-done" onClick={closeModal}>{CheckIcon} บันทึกสำเร็จ</button>
                </div>
              </div>
              
              {/* Hidden template for printing */}
              {selectedRecord && (
                <PayslipTemplate 
                  ref={printRef} 
                  record={selectedRecord} 
                  allowances={allowances} 
                  deductions={deductions} 
                  month={month as string} 
                  year={year as string} 
                />
              )}
            </div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .process-page { padding: 40px; background: #eef2f6; min-height: 100vh; font-family: 'Inter', 'Sarabun', sans-serif; gap: 32px; display: flex; flex-direction: column; }
        
        .ps-header-wrapper { display: flex; justify-content: space-between; align-items: flex-end; }
        .ps-header { display: flex; align-items: flex-start; gap: 24px; }
        .btn-back { display: flex; align-items: center; gap: 8px; background: white; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 12px; font-weight: 700; color: #475569; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .btn-back:hover { background: #f8fafc; color: #0f172a; transform: translateX(-4px); }
        
        .pd-title { font-size: 30px; font-weight: 800; color: #1e293b; margin: 0; letter-spacing: -0.5px; }
        .pd-subtitle { font-size: 14px; color: #64748b; margin: 6px 0 0 0; }
        .pd-subtitle strong { color: #3b82f6; }
        
        .pd-summary-list { background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .loading-state, .empty-state { text-align: center; padding: 60px !important; color: #94a3b8; font-weight: 500; font-size: 15px; }
        
        .pd-table-container { overflow-x: auto; }
        .pd-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px; }
        .pd-table th { text-align: left; padding: 16px; border-bottom: 2px solid #e2e8f0; font-size: 13px; font-weight: 800; color: #1e293b; }
        .pd-table th span { font-weight: 600; color: #64748b; display: block; margin-top: 4px; font-size: 11px; }
        .pd-table td { padding: 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .pd-table tbody tr { transition: background 0.2s; }
        .pd-table tbody tr:hover { background: #f8fafc; }
        
        .emp-name-main { font-weight: 700; color: #1e293b; }
        .emp-id-sub { font-size: 12px; color: #64748b; font-weight: 500; margin-top: 2px; }
        
        .dept-badge { background: #f1f5f9; color: #475569; padding: 4px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; display: inline-block; }
        .pos-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        
        .amt-plus { color: #10b981; font-weight: 700; background: #ecfdf5; padding: 4px 8px; border-radius: 6px; }
        .amt-minus { color: #ef4444; font-weight: 700; background: #fef2f2; padding: 4px 8px; border-radius: 6px; }
        
        .status-badge { font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: transparent; padding: 0; }
        .status-badge .dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-badge.paid { color: #10b981; }
        .status-badge.paid .dot { background: #10b981; box-shadow: 0 0 0 3px #d1fae5; }
        .status-badge.approved { color: #3b82f6; }
        .status-badge.approved .dot { background: #3b82f6; box-shadow: 0 0 0 3px #dbeafe; }
        .status-badge.draft { color: #64748b; }
        .status-badge.draft .dot { background: #94a3b8; box-shadow: 0 0 0 3px #e2e8f0; }
        
        .btn-manage { background: white; color: #3b82f6; border: 1px solid #bfdbfe; padding: 8px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 2px rgba(59,130,246,0.1); }
        .btn-manage:hover { background: #eff6ff; border-color: #93c5fd; box-shadow: 0 2px 4px rgba(59,130,246,0.15); }

        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; justify-content: flex-end; }
        .modal-panel { background: #f8fafc; width: 640px; height: 100vh; animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; box-shadow: -15px 0 40px rgba(0,0,0,0.15); overflow-y: auto; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        
        .modal-header { padding: 32px 32px 24px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
        .modal-emp-title { font-size: 24px; font-weight: 800; margin: 0; color: #0f172a; line-height: 1.2; }
        .modal-emp-sub { margin: 8px 0 0 0; font-size: 13px; color: #64748b; font-weight: 500; }
        .modal-emp-sub span { margin: 0 8px; color: #cbd5e1; }
        .btn-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .btn-close:hover { background: #e2e8f0; color: #0f172a; }
        
        .modal-body { padding: 32px; flex: 1; }
        .detail-section h3 { font-size: 15px; font-weight: 800; color: #10b981; margin: 0; }
        .detail-section h3.red { color: #ef4444; }
        .ds-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px; }
        
        .btn-add-sm { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #10b981; color: #10b981; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 2px rgba(16,185,129,0.1); }
        .btn-add-sm:hover { background: #ecfdf5; }
        .btn-add-sm.red { border-color: #ef4444; color: #ef4444; box-shadow: 0 1px 2px rgba(239,68,68,0.1); }
        .btn-add-sm.red:hover { background: #fef2f2; }
        
        .add-form { display: flex; gap: 10px; margin-bottom: 20px; background: white; padding: 16px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .add-form.red-form { border-color: #fee2e2; }
        .flex-1 { flex: 1; min-width: 0; }
        .flex-2 { flex: 2; min-width: 0; }
        .form-select, .form-input { padding: 10px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; font-family: inherit; transition: 0.2s; }
        .form-select:focus, .form-input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .btn-save-sm { background: #10b981; color: white; border: none; padding: 0 14px; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-save-sm:hover { background: #059669; }
        .btn-save-sm.red { background: #ef4444; }
        .btn-save-sm.red:hover { background: #dc2626; }
        .btn-cancel-sm { background: #f1f5f9; color: #64748b; border: none; padding: 0 12px; border-radius: 8px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-cancel-sm:hover { background: #e2e8f0; color: #0f172a; }
        
        .detail-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .detail-item:hover { border-color: #cbd5e1; box-shadow: 0 4px 6px rgba(0,0,0,0.04); }
        .di-name { font-weight: 700; color: #1e293b; font-size: 14px; }
        .di-remark { font-size: 12px; color: #94a3b8; margin-top: 4px; }
        .di-actions { display: flex; align-items: center; gap: 16px; }
        .di-amt { font-weight: 800; font-size: 15px; }
        .di-amt.plus { color: #10b981; }
        .di-amt.minus { color: #ef4444; }
        
        .btn-del-sm { background: #f1f5f9; color: #94a3b8; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
        .btn-del-sm:hover { background: #fee2e2; color: #ef4444; }
        .btn-del-sm.red:hover { background: #fee2e2; color: #ef4444; }
        
        .empty-detail { font-size: 13px; color: #cbd5e1; padding: 16px 0; text-align: center; font-weight: 600; }
        
        .modal-footer { padding: 32px; border-top: 1px solid #e2e8f0; background: white; }
        .mf-summary { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: #f8fafc; padding: 16px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .mf-summary span:first-child { font-size: 14px; color: #475569; font-weight: 700; }
        .mf-total { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        
        .mf-actions { display: flex; gap: 16px; }
        .btn-done { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: #3b82f6; color: white; border: none; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 800; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(59,130,246,0.3); }
        .btn-done:hover { background: #2563eb; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(59,130,246,0.4); }
        .btn-payslip { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: white; color: #475569; border: 1px solid #cbd5e1; padding: 14px; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .btn-payslip:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }
        
        .custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid white; }
        .modal-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 2px solid #f8fafc; }
      `}} />
    </AppLayout>
  );
}

export default function PayrollProcessPage() {
  return (
    <Suspense fallback={<div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>}>
      <PayrollProcessContent />
    </Suspense>
  );
}
