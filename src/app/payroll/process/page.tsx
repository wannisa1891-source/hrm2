'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useRouter, useSearchParams } from 'next/navigation';
import PayslipTemplate from '@/components/Payroll/PayslipTemplate';
import { useReactToPrint } from 'react-to-print';
import Swal from 'sweetalert2';

// ... (Interface และ Logic เดิมคงไว้เหมือนเดิมเป๊ะๆ เพื่อไม่ให้พัง) ...
interface PayrollRecord {
  payroll_id: string; emp_id: string; prefix: string; first_name_th: string; last_name_th: string;
  pos_name: string; dept_name: string; base_salary: number; total_allowance: number;
  total_deduction: number; net_salary: number; status: string;
}
interface AllowanceDeduction { id: number; type_name: string; amount: number; remark: string; }
const MONTHS_TH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
const BackIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>;
const PrintIcon = <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
const CloseIcon = <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

function PayrollProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [allowances, setAllowances] = useState<AllowanceDeduction[]>([]);
  const [deductions, setDeductions] = useState<AllowanceDeduction[]>([]);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Payslip_${selectedRecord?.emp_id}`
  });

  useEffect(() => {
    if (!month || !year) { router.push('/payroll'); return; }
    fetchRecords();
  }, [month, year]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      const data = await res.json();
      setRecords(data);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const openModal = async (record: PayrollRecord) => {
    setSelectedRecord(record);
    try {
      const [allowRes, deducRes] = await Promise.all([
        fetch(`/api/payroll/allowances?payroll_id=${record.payroll_id}`),
        fetch(`/api/payroll/deductions?payroll_id=${record.payroll_id}`)
      ]);
      setAllowances(await allowRes.json());
      setDeductions(await deducRes.json());
    } catch (e) { console.error(e); }
  };

  return (
    <AppLayout>
      <div className="aesthetic-container">
        {/* Iridescent background elements */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>

        <header className="glass-header">
          <button className="btn-icon-back" onClick={() => router.push('/payroll')}>{BackIcon}</button>
          <div className="header-text">
            <h1>Payroll Summary</h1>
            <p>{MONTHS_TH[Number(month) - 1]} <span>{year}</span></p>
          </div>
        </header>

        <main className="content-grid">
          {isLoading ? (
            <div className="loader">✨ Loading Magic...</div>
          ) : (
            records.map(r => (
              <div key={r.payroll_id} className="payroll-card" onClick={() => openModal(r)}>
                <div className="card-top">
                  <div className="avatar-box">{r.first_name_th[0]}</div>
                  <div className="user-info">
                    <h3>{r.first_name_th} {r.last_name_th}</h3>
                    <span className="badge-dept">{r.dept_name || 'Design'}</span>
                  </div>
                </div>
                <div className="card-amount">
                  <label>Net Salary</label>
                  <div className="amount">฿{Number(r.net_salary).toLocaleString()}</div>
                </div>
                <div className="card-footer">
                  <span className={`status-pill ${r.status.toLowerCase()}`}>{r.status}</span>
                  <div className="tap-hint">Tap to Edit →</div>
                </div>
              </div>
            ))
          )}
        </main>

        {selectedRecord && (
          <div className="aesthetic-modal" onClick={() => setSelectedRecord(null)}>
            <div className="modal-inner" onClick={e => e.stopPropagation()}>
              <div className="modal-glass-top">
                <button className="close-circle" onClick={() => setSelectedRecord(null)}>{CloseIcon}</button>
                <h2>Manage Detail</h2>
                <div className="modal-user-hero">
                  <div className="hero-avatar">{selectedRecord.first_name_th[0]}</div>
                  <h3>{selectedRecord.first_name_th} {selectedRecord.last_name_th}</h3>
                  <p>{selectedRecord.pos_name}</p>
                </div>
              </div>

              <div className="modal-scroll-area">
                <section className="detail-box">
                  <div className="section-title">Earnings <span className="plus">+</span></div>
                  {allowances.map(a => (
                    <div key={a.id} className="item-row">
                      <span>{a.type_name}</span>
                      <strong className="text-plus">฿{Number(a.amount).toLocaleString()}</strong>
                    </div>
                  ))}
                  <div className="item-row base">
                    <span>Base Salary</span>
                    <strong>฿{Number(selectedRecord.base_salary).toLocaleString()}</strong>
                  </div>
                </section>

                <section className="detail-box">
                  <div className="section-title">Deductions <span className="minus">-</span></div>
                  {deductions.map(d => (
                    <div key={d.id} className="item-row">
                      <span>{d.type_name}</span>
                      <strong className="text-minus">-฿{Number(d.amount).toLocaleString()}</strong>
                    </div>
                  ))}
                </section>
              </div>

              <div className="modal-glass-bottom">
                <div className="total-bar">
                  <div className="total-label">Total Net</div>
                  <div className="total-value">฿{Number(selectedRecord.net_salary).toLocaleString()}</div>
                </div>
                <div className="action-btns">
                  <button className="btn-print" onClick={handlePrint}>{PrintIcon} Export Slip</button>
                  <button className="btn-confirm" onClick={() => setSelectedRecord(null)}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&family=Sarabun:wght@400;700&display=swap');

        .aesthetic-container {
          padding: 60px 40px; min-height: 100vh; background: #F8FAFC; 
          font-family: 'Plus Jakarta Sans', 'Sarabun', sans-serif;
          position: relative; overflow: hidden;
        }

        /* Iridescent Background Blobs */
        .blob { position: absolute; filter: blur(80px); opacity: 0.4; z-index: 0; border-radius: 50%; }
        .blob-1 { width: 400px; height: 400px; background: #C7D2FE; top: -100px; right: -50px; }
        .blob-2 { width: 500px; height: 500px; background: #FDE68A; bottom: -100px; left: -100px; }
        .blob-3 { width: 300px; height: 300px; background: #FDA4AF; top: 40%; left: 30%; }

        /* Header */
        .glass-header { 
          position: relative; z-index: 10; display: flex; align-items: center; gap: 30px; margin-bottom: 50px;
        }
        .btn-icon-back {
          width: 50px; height: 50px; border-radius: 18px; border: none; background: white;
          box-shadow: 0 10px 20px rgba(0,0,0,0.05); cursor: pointer; color: #64748B;
          display: flex; align-items: center; justify-content: center; transition: 0.3s;
        }
        .btn-icon-back:hover { transform: scale(1.1); color: #6366F1; }
        .header-text h1 { font-size: 40px; font-weight: 800; color: #1E293B; margin: 0; letter-spacing: -1.5px; }
        .header-text p { font-size: 18px; color: #94A3B8; margin: 5px 0 0 0; }
        .header-text p span { font-weight: 800; color: #6366F1; background: #EEF2FF; padding: 2px 10px; border-radius: 8px; }

        /* Grid & Cards */
        .content-grid {
          position: relative; z-index: 10; display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px;
        }
        .payroll-card {
          background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.8); border-radius: 30px; padding: 25px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.02); cursor: pointer; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .payroll-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(99, 102, 241, 0.1); background: white; }
        
        .card-top { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
        .avatar-box {
          width: 50px; height: 50px; border-radius: 16px; background: linear-gradient(135deg, #E0E7FF, #C7D2FE);
          display: flex; align-items: center; justify-content: center; font-weight: 800; color: #6366F1;
        }
        .user-info h3 { margin: 0; font-size: 18px; color: #1E293B; }
        .badge-dept { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; }

        .card-amount label { font-size: 12px; font-weight: 600; color: #94A3B8; display: block; margin-bottom: 5px; }
        .amount { font-size: 28px; font-weight: 800; color: #1E293B; }

        .card-footer { margin-top: 25px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; pt: 20px; }
        .status-pill { padding: 6px 14px; border-radius: 12px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .status-pill.paid { background: #DCFCE7; color: #166534; }
        .status-pill.draft { background: #F1F5F9; color: #64748B; }
        .tap-hint { font-size: 12px; font-weight: 700; color: #6366F1; opacity: 0; transition: 0.3s; }
        .payroll-card:hover .tap-hint { opacity: 1; }

        /* Aesthetic Modal */
        .aesthetic-modal {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(10px);
          display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px;
        }
        .modal-inner {
          width: 100%; max-width: 500px; background: white; border-radius: 40px; 
          overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.2); animation: pop 0.4s ease;
        }
        @keyframes pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .modal-glass-top { padding: 40px; text-align: center; position: relative; background: #F8FAFC; }
        .close-circle { position: absolute; top: 20px; right: 20px; border: none; background: none; color: #CBD5E1; cursor: pointer; }
        .hero-avatar { 
          width: 80px; height: 80px; border-radius: 30px; background: #6366F1; color: white;
          font-size: 32px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;
        }
        .modal-glass-top h2 { margin: 0; font-size: 14px; color: #6366F1; text-transform: uppercase; letter-spacing: 2px; }
        .modal-user-hero h3 { font-size: 24px; margin: 10px 0 0 0; color: #1E293B; }

        .modal-scroll-area { padding: 0 40px 40px; max-height: 400px; overflow-y: auto; }
        .section-title { font-weight: 800; color: #1E293B; margin: 30px 0 15px; display: flex; justify-content: space-between; }
        .plus { color: #10B981; } .minus { color: #F43F5E; }
        
        .item-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed #E2E8F0; font-size: 15px; }
        .item-row.base { border: none; background: #F8FAFC; padding: 15px; border-radius: 15px; margin-top: 10px; }
        .text-plus { color: #10B981; } .text-minus { color: #F43F5E; }

        .modal-glass-bottom { padding: 40px; background: white; border-top: 1px solid #F1F5F9; }
        .total-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .total-label { font-weight: 800; color: #94A3B8; text-transform: uppercase; }
        .total-value { font-size: 36px; font-weight: 800; color: #6366F1; }

        .action-btns { display: flex; gap: 15px; }
        .btn-confirm { flex: 1; background: #1E293B; color: white; border: none; padding: 20px; border-radius: 20px; font-weight: 800; cursor: pointer; transition: 0.3s; }
        .btn-print { background: #EEF2FF; color: #6366F1; border: none; padding: 20px; border-radius: 20px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .btn-confirm:hover { background: #6366F1; transform: translateY(-3px); }
      `}} />
    </AppLayout>
  );
}

export default function PayrollProcessPage() {
  return (
    <Suspense fallback={<div>Loading Aesthetic...</div>}>
      <PayrollProcessContent />
    </Suspense>
  );
}