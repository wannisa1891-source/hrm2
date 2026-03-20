'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useReactToPrint } from 'react-to-print';
import OrderPdfTemplate from '@/components/Transfer/OrderPdfTemplate';
import Swal from 'sweetalert2';

interface Department { dept_id: string; dept_name: string; }
interface Position { pos_id: string; pos_name: string; }
interface SearchResult { id: string; name: string; pos: string; pos_id?: string; dept: string; dept_id?: string; salary: number; level: string; pos_no: string; }
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
  old_pos_name?: string;
  new_position: string;
  new_pos_name?: string;
  old_level: string;
  new_level: string;
  old_pos_no: string;
  new_pos_no: string;
  old_salary: number;
  new_salary: number;
  remark: string;
  order_file: string | null;
  status: string;
}

const TRANSFER_TYPES = [
  { id: '01', label: '01 - บรรจุ/แต่งตั้ง' },
  { id: '02', label: '02 - เลื่อนตำแหน่ง' },
  { id: '03', label: '03 - ย้าย/สับเปลี่ยนตำแหน่ง' },
  { id: '04', label: '04 - โอน' },
  { id: '05', label: '05 - ช่วยราชการ' },
];

export default function TransferPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listSearch, setListSearch] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [detailTransfer, setDetailTransfer] = useState<TransferRecord | null>(null);
  const [viewingTransfer, setViewingTransfer] = useState<TransferRecord | null>(null);
  const [printTransfer, setPrintTransfer] = useState<TransferRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleRealPrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: printTransfer?.order_no ? `Transfer_Order_${printTransfer.order_no.replace(/\//g, '-')}` : 'Transfer_Order',
  });

  const handlePrint = (t: TransferRecord) => {
    setPrintTransfer(t);
    setTimeout(() => {
      handleRealPrint();
    }, 150);
  };

  const [form, setForm] = useState({
    transfer_id: '',
    orderNo: '', orderDate: '', effectDate: '', title: '',
    transferType: '03', empId: '',
    oldDeptId: '', oldDept: '', newDeptId: '',
    oldPos: '', oldPosName: '', newPos: '',
    oldLevel: '', newLevel: '',
    oldPosNo: '', newPosNo: '',
    oldSalary: 0, newSalary: 0,
    remark: '',
  });

  const loadTransfers = async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/transfers');
      const data = await res.json();
      setTransfers(Array.isArray(data) ? data : []);
    } catch { setTransfers([]); }
    setLoadingList(false);
  };

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
    fetch('/api/positions').then(r => r.json()).then(setPositions);
    loadTransfers();
  }, []);

  useEffect(() => { setPage(1); }, [listSearch]);

  const search = async () => {
    if (!searchQ.trim()) return;
    const res = await fetch(`/api/staff-search?q=${encodeURIComponent(searchQ)}`);
    setSearchResults(await res.json());
  };

  const selectEmployee = (emp: SearchResult) => {
    setSelected(emp);
    setForm(f => ({ 
      ...f, 
      empId: emp.id, 
      oldPos: emp.pos_id || '', 
      oldPosName: emp.pos,
      oldDeptId: emp.dept_id || '',
      oldDept: emp.dept, 
      oldSalary: emp.salary,
      oldLevel: emp.level || '',
      oldPosNo: emp.pos_no || ''
    }));
    setSearchResults([]);
    setSearchQ(emp.name);
  };

  const handleEdit = (t: TransferRecord) => {
    setForm({
      transfer_id: t.transfer_id,
      orderNo: t.order_no,
      orderDate: t.order_date?.split('T')[0] || '',
      effectDate: t.effective_date?.split('T')[0] || '',
      title: t.subject,
      transferType: TRANSFER_TYPES.find(x => x.label.includes(t.transfer_type || ''))?.id || '03',
      empId: t.emp_id,
      oldDeptId: t.old_dept_id,
      oldDept: t.old_dept_name,
      newDeptId: t.new_dept_id,
      oldPos: t.old_position,
      oldPosName: t.old_pos_name || t.old_position,
      newPos: t.new_position,
      oldLevel: t.old_level,
      newLevel: t.new_level,
      oldPosNo: t.old_pos_no,
      newPosNo: t.new_pos_no,
      oldSalary: t.old_salary || 0,
      newSalary: t.new_salary || 0,
      remark: t.remark || '',
    });
    setSelected({ id: t.emp_id, name: t.emp_name, pos: t.old_position, dept: t.old_dept_name, salary: t.old_salary, level: t.old_level, pos_no: t.old_pos_no });
    setSearchQ(t.emp_name);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: 'ยืนยันการลบคำสั่งย้ายนี้?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444'
    });
    if (!result.isConfirmed) return;
    
    const res = await fetch(`/api/transfers?id=${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { 
      Swal.fire({ title: 'ลบสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
      loadTransfers(); 
    }
    else Swal.fire('เกิดข้อผิดพลาด', data.error, 'error');
  };

  const setTransferStatus = async (t: TransferRecord, newStatus: string) => {
    const actionName = newStatus === 'Approved' ? 'อนุมัติ' : 'ไม่อนุมัติ';
    const result = await Swal.fire({
      title: `ยืนยันการ${actionName}`,
      text: `ยืนยันการ${actionName}คำสั่งย้ายนี้?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: newStatus === 'Approved' ? '#10b981' : '#ef4444'
    });
    if (!result.isConfirmed) return;
    
    // Convert to update form format
    const updForm = {
      transfer_id: t.transfer_id,
      orderNo: t.order_no,
      orderDate: t.order_date?.split('T')[0] || '',
      effectDate: t.effective_date?.split('T')[0] || '',
      title: t.subject,
      transferType: TRANSFER_TYPES.find(x => x.label.includes(t.transfer_type || ''))?.id || '03',
      empId: t.emp_id,
      newDeptId: t.new_dept_id,
      newPos: t.new_position,
      newLevel: t.new_level,
      newPosNo: t.new_pos_no,
      newSalary: t.new_salary || 0,
      remark: t.remark || '',
      status: newStatus
    };
    
    const fd = new FormData();
    fd.append('data', JSON.stringify(updForm));
    const res = await fetch('/api/transfers', { method: 'PUT', body: fd });
    const data = await res.json();
    if (data.success) {
      const actionName = newStatus === 'Approved' ? 'อนุมัติ' : 'ไม่อนุมัติ';
      Swal.fire({ title: 'สำเร็จ!', text: `อัปเดตสถานะเป็น ${actionName} สำเร็จ`, icon: 'success', timer: 1500, showConfirmButton: false });
      loadTransfers();
    } else Swal.fire('Error', data.error, 'error');
  };

  const chartData = useMemo(() => {
    const counts = transfers.reduce((acc, t) => {
      const type = t.transfer_type || 'อื่นๆ';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [transfers]);

  const handleSave = async () => {
    if (!selected || !form.orderNo || !form.newDeptId) { 
      Swal.fire('ข้อความแจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ', 'warning'); 
      return; 
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('data', JSON.stringify(form));
    if (orderFile) fd.append('order_file', orderFile);
    
    const method = form.transfer_id ? 'PUT' : 'POST';
    const res = await fetch('/api/transfers', { method, body: fd });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      Swal.fire({
        title: 'สำเร็จ!', 
        text: `${form.transfer_id ? 'แก้ไข' : 'บันทึก'}คำสั่งย้ายสำเร็จ! \nข้อมูลพนักงานได้รับการอัปเดตเรียบร้อยแล้ว`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      setShowForm(false);
      setSelected(null); setSearchQ('');
      setForm({ transfer_id: '', orderNo: '', orderDate: '', effectDate: '', title: '', transferType: '03', empId: '', oldDeptId: '', oldDept: '', newDeptId: '', oldPos: '', oldPosName: '', newPos: '', oldLevel: '', newLevel: '', oldPosNo: '', newPosNo: '', oldSalary: 0, newSalary: 0, remark: '' });
      loadTransfers();
    } else Swal.fire('เกิดข้อผิดพลาด', data.error || '', 'error');
  };

  const setF = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const newDeptName = departments.find(d => d.dept_id === form.newDeptId)?.dept_name || '—';

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        .tr-page { display: flex; flex-direction: column; gap: 28px; padding: 12px; }

        /* Header */
        .tr-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; }
        .tr-header-title { font-size: 36px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
        .tr-header-sub { font-size: 16px; color: #64748b; margin: 6px 0 0; font-weight: 500; }
        .btn-tr-new { display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; border: none; border-radius: 14px; padding: 12px 28px; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-tr-new:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); background: linear-gradient(135deg, #1d4ed8, #2563eb); }

        /* Premium Stat Cards */
        .tr-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .tr-stat { background: #ffffff; border: 1px solid rgba(226, 232, 240, 0.7); border-radius: 24px; padding: 28px; display: flex; align-items: center; gap: 22px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden; }
        .tr-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: transparent; transition: all 0.3s; }
        .tr-stat-blue::before { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
        .tr-stat-purple::before { background: linear-gradient(90deg, #8b5cf6, #a855f7); }
        .tr-stat-teal::before { background: linear-gradient(90deg, #0d9488, #14b8a6); }
        .tr-stat:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06); }
        .tr-stat-icon { width: 68px; height: 68px; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tr-stat-blue .tr-stat-icon { background: linear-gradient(135deg, #eff6ff, #dbeafe); color: #2563eb; }
        .tr-stat-purple .tr-stat-icon { background: linear-gradient(135deg, #faf5ff, #f3e8ff); color: #7c3aed; }
        .tr-stat-teal .tr-stat-icon { background: linear-gradient(135deg, #f0fdfa, #ccfbf1); color: #0d9488; }
        .tr-stat-count { color: #0f172a; font-size: 34px; font-weight: 800; line-height: 1.1; margin-bottom: 4px; }
        .tr-stat-label { color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
        .tr-stat-tag { position: absolute; bottom: 24px; right: 24px; font-size: 13px; font-weight: 700; padding: 4px 10px; border-radius: 12px; background: #f1f5f9; color: #475569; }

        /* Table Card */
        .tr-card { background: #ffffff; border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 24px; box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05); overflow: hidden; }
        .tr-card-header { padding: 24px 28px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); }
        .tr-card-title { font-size: 20px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; }
        .tr-card-title::before { content: ''; display: block; width: 6px; height: 24px; background: #3b82f6; border-radius: 4px; }
        .tr-search-bar { display: flex; gap: 8px; align-items: center; position: relative; }
        .tr-search-icon { position: absolute; left: 14px; color: #94a3b8; pointer-events: none; }
        .tr-search-input { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px 12px 42px; font-size: 15px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: #f8fafc; width: 300px; max-width: 100%; color: #1e293b; }
        .tr-search-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .tr-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tr-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 1000px; }
        .tr-table thead th { background: #f8fafc; padding: 16px 24px; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; white-space: nowrap; border-bottom: 1px solid #e2e8f0; }
        .tr-table tbody tr { transition: all 0.2s; }
        .tr-table tbody tr:hover { background: #f8fafc; }
        .tr-table td { padding: 18px 24px; font-size: 15px; color: #475569; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
        .tr-table tbody tr:last-child td { border-bottom: none; }

        /* Status Badge */
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; border: 1px solid transparent; }
        .badge-pending { background: #fffbeb; color: #d97706; border-color: rgba(245, 158, 11, 0.2); }
        .badge-approved { background: #ecfdf5; color: #059669; border-color: rgba(16, 185, 129, 0.2); }
        .badge-rejected { background: #fef2f2; color: #dc2626; border-color: rgba(239, 68, 68, 0.2); }
        .dept-tag { font-weight: 700; color: #2563eb; background: #eff6ff; padding: 6px 12px; border-radius: 8px; display: inline-block; }

        /* Action Buttons (No Emojis) */
        .tr-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
        .action-btn { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; }
        .action-btn svg { width: 18px; height: 18px; }
        .action-view { background: #f1f5f9; color: #475569; }
        .action-view:hover { background: #e2e8f0; color: #0f172a; }
        .action-edit { background: #eff6ff; color: #2563eb; }
        .action-edit:hover { background: #dbeafe; color: #1d4ed8; }
        .action-file { background: #fdf4ff; color: #9333ea; text-decoration: none; }
        .action-file:hover { background: #f3e8ff; color: #7e22ce; }
        .action-del { background: #fef2f2; color: #dc2626; }
        .action-del:hover { background: #fee2e2; color: #b91c1c; }
        .action-approve { background: #ecfdf5; color: #059669; }
        .action-approve:hover { background: #d1fae5; color: #047857; }
        .action-print { background: #fff7ed; color: #ea580c; }
        .action-print:hover { background: #ffedd5; color: #c2410c; }

        /* Form Layout Panel */
        .tr-form-panel { background: #ffffff; border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 24px; box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .tr-section-header { padding: 24px 32px 14px; font-size: 18px; font-weight: 800; color: #0f172a; background: #fff; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f1f5f9; }
        .tr-section-header::before { content: ''; display: inline-block; width: 32px; height: 32px; background: #eff6ff; color: #2563eb; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .tr-section-1::before { content: '1'; } .tr-section-2::before { content: '2'; } .tr-section-3::before { content: '3'; }
        .tr-section-body { padding: 28px 32px; }

        /* Form Inputs */
        .tr-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .tr-form-row.tri { grid-template-columns: 1fr 1fr 1fr; }
        .tr-form-row.single { grid-template-columns: 1fr; }
        .tr-fg { display: flex; flex-direction: column; gap: 8px; }
        .tr-label { font-size: 14px; font-weight: 700; color: #475569; }
        .tr-input, .tr-select { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 16px; font-size: 15px; color: #1e293b; outline: none; transition: border-color .2s, box-shadow .2s; background: #f8fafc; font-family: inherit; }
        .tr-input:focus, .tr-select:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

        /* Employee search dropdown */
        .tr-emp-search-wrap { position: relative; }
        .tr-search-btn { padding: 0 24px; border-radius: 12px; background: #0f172a; color: #fff; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
        .tr-search-btn:hover { background: #334155; }
        .tr-emp-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 50; margin-top: 8px; overflow: hidden; max-height: 300px; overflow-y: auto; }
        .tr-emp-opt { padding: 14px 20px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background .1s; display: flex; flex-direction: column; gap: 4px; }
        .tr-emp-opt:hover { background: #f8fafc; padding-left: 24px; }
        .tr-emp-opt-name { font-weight: 700; color: #0f172a; font-size: 15px; }
        .tr-emp-opt-sub  { font-size: 13px; color: #64748b; }

        /* Comparison table */
        .tr-compare { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
        .tr-compare thead th { background: #f8fafc; padding: 14px 20px; font-size: 13px; font-weight: 800; color: #475569; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .tr-compare tbody tr td { border-bottom: 1px solid #f1f5f9; }
        .tr-compare tbody tr:last-child td { border-bottom: none; }
        .tr-compare tbody tr:hover td { background: #fafbfc; }
        .tr-compare td { padding: 14px 20px; font-size: 14px; color: #1e293b; vertical-align: middle; transition: background 0.2s; }
        .tr-compare td:first-child { font-weight: 700; color: #334155; background: #f8fafc; width: 180px; border-right: 1px solid #f1f5f9; }

        /* Footer buttons */
        .tr-form-footer { padding: 24px 32px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 16px; background: #f8fafc; }
        .btn-tr-cancel { padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; background: #ffffff; color: #475569; border: 1px solid #cbd5e1; transition: all .2s; }
        .btn-tr-cancel:hover { background: #f1f5f9; border-color: #94a3b8; }
        .btn-tr-save { padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2); }
        .btn-tr-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3); }
        .btn-tr-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        /* File upload */
        .tr-file-label { display: flex; align-items: center; gap: 14px; padding: 18px 24px; border: 2px dashed #cbd5e1; border-radius: 16px; cursor: pointer; background: #f8fafc; transition: all .3s; font-size: 15px; color: #475569; font-weight: 600; }
        .tr-file-label:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }

        /* Modal */
        .tr-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(8px); animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .tr-modal { background: #fff; border-radius: 24px; width: 90%; max-width: 750px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .tr-modal-header { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; position: sticky; top: 0; z-index: 10; }
        .tr-modal-title { font-size: 22px; font-weight: 800; color: #0f172a; }
        .btn-close { background: #e2e8f0; border: none; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all 0.2s; }
        .btn-close:hover { background: #ef4444; color: #fff; }
        .tr-modal-body { padding: 32px; }
        .tr-modal-footer { padding: 20px 32px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; background: #f8fafc; }
        
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .detail-item { display: flex; flex-direction: column; gap: 6px; }
        .detail-label { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; }
        .detail-value { font-size: 16px; color: #0f172a; font-weight: 600; padding: 10px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
        .detail-compare { background: #ffffff; border-radius: 20px; padding: 28px; margin-top: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .compare-row { display: grid; grid-template-columns: 1fr 1.2fr 1.2fr; gap: 16px; padding: 14px 0; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .compare-row:last-child { border: none; padding-bottom: 0; }
        .compare-val-box { padding: 10px 14px; border-radius: 10px; font-size: 15px; font-weight: 600; }
        .cv-old { background: #f1f5f9; color: #475569; }
        .cv-new { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

        @media(max-width:640px){ .tr-stats { grid-template-columns:1fr; } .tr-form-row, .tr-form-row.tri { grid-template-columns:1fr; } .detail-grid { grid-template-columns:1fr; } }
      `}} />

      <div className="tr-page">

        {/* ── Header ── */}
        <div className="tr-header">
          <div>
            <h1 className="tr-header-title">ระบบการโยกย้าย</h1>
            <p className="tr-header-sub">บันทึกคำสั่งแต่งตั้ง / โยกย้าย / เลื่อนตำแหน่ง</p>
          </div>
          {!showForm && (
            <button className="btn-tr-new" onClick={() => setShowForm(true)}>
              <span style={{ fontSize: 18 }}>+</span> สร้างคำสั่งย้ายใหม่
            </button>
          )}
        </div>

        {/* ── Stat Cards ── */}
        {!showForm && (
          <div className="tr-stats">
            <div className="tr-stat tr-stat-blue">
              <div className="tr-stat-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <div>
                <div className="tr-stat-count">{transfers.length}</div>
                <div className="tr-stat-label">คำสั่งทั้งหมด</div>
              </div>
              <div className="tr-stat-tag">รายการ</div>
            </div>
            <div className="tr-stat tr-stat-purple">
              <div className="tr-stat-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              </div>
              <div>
                <div className="tr-stat-count">{transfers.filter(t => t.order_date?.startsWith(new Date().getFullYear().toString())).length}</div>
                <div className="tr-stat-label">โยกย้ายปีนี้</div>
              </div>
              <div className="tr-stat-tag">ปีนี้</div>
            </div>
            <div className="tr-stat tr-stat-teal">
              <div className="tr-stat-icon">
                <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              </div>
              <div>
                <div className="tr-stat-count">{transfers.filter(t => t.transfer_type?.includes('เลื่อน') && t.order_date?.startsWith(new Date().getFullYear().toString())).length}</div>
                <div className="tr-stat-label">เลื่อนตำแหน่งปีนี้</div>
              </div>
              <div className="tr-stat-tag">ปีนี้</div>
            </div>
          </div>
        )}

        {/* ── Analytics & Charts ── */}
        {!showForm && transfers.length > 0 && (
          <div className="tr-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" color="#3b82f6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              สถิติประเภทการย้าย/แต่งตั้ง
            </h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 13 }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 13 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── List Table (when form is hidden) ── */}
        {!showForm && (
          <div className="tr-card">
            <div className="tr-card-header">
              <span className="tr-card-title">ประวัติการย้าย</span>
              <div className="tr-search-bar">
                <input
                  className="tr-search-input"
                  placeholder="ค้นหา ชื่อ / เลขที่คำสั่ง..."
                  value={listSearch}
                  onChange={e => setListSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="tr-table-wrap custom-scroll">
              <table className="tr-table">
              <thead>
                <tr>
                  <th>เลขที่คำสั่ง</th>
                  <th>วันที่มีผล</th>
                  <th>ข้าราชการ / พนง.</th>
                  <th>ประเภท</th>
                  <th>หน่วยงานใหม่</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>กำลังโหลด...</td></tr>
                ) : (() => {
                  const q = listSearch.toLowerCase();
                  const filtered = q
                    ? transfers.filter(t =>
                        t.order_no?.toLowerCase().includes(q) ||
                        t.emp_name?.toLowerCase().includes(q) ||
                        t.new_dept_name?.toLowerCase().includes(q)
                      )
                    : transfers;

                  const totalPages = Math.ceil(filtered.length / perPage);
                  const paged = filtered.slice((page - 1) * perPage, page * perPage);

                  return filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 }}>ยังไม่มีประวัติการย้าย — กด <strong>สร้างคำสั่งย้ายใหม่</strong> เพื่อเริ่มต้น</td></tr>
                  ) : paged.map(t => (
                    <tr key={t.transfer_id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#64748b' }}>{t.order_no}</span></td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{t.effective_date?.split('T')[0] || '—'}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.emp_name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.old_pos_name || t.old_position || '—'} → {t.new_pos_name || t.new_position || '—'}</div>
                      </td>
                      <td style={{ fontSize: 13, color: '#475569' }}>{t.transfer_type || '—'}</td>
                      <td style={{ fontSize: 13, color: '#0284c7', fontWeight: 500 }}>{t.new_dept_name || '—'}</td>
                      <td>
                        {t.status === 'Approved' ? (
                          <span className="status-badge badge-approved"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg> อนุมัติแล้ว</span>
                        ) : t.status === 'Rejected' ? (
                          <span className="status-badge badge-rejected"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/></svg> ไม่อนุมัติ</span>
                        ) : (
                          <span className="status-badge badge-pending"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> รออนุมัติ</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="tr-actions">
                          {t.status === 'Pending' && (
                            <>
                              <button className="action-btn action-approve" title="อนุมัติการย้าย" onClick={() => setTransferStatus(t, 'Approved')}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              </button>
                              <button className="action-btn action-del" title="ไม่อนุมัติ" onClick={() => setTransferStatus(t, 'Rejected')}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </>
                          )}
                          <button className="action-btn action-view" title="ดูรายละเอียด" onClick={() => setViewingTransfer(t)}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          {t.status === 'Approved' && (
                            <button className="action-btn action-print" title="พิมพ์หนังสือคำสั่ง (PDF)" onClick={() => handlePrint(t)}>
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </button>
                          )}
                          {t.status !== 'Approved' && (
                            <button className="action-btn action-edit" title="แก้ไข" onClick={() => handleEdit(t)}>
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                          )}
                          {t.order_file && (
                            <a href={`/uploads/${t.order_file}`} target="_blank" rel="noreferrer" className="action-btn action-file" title="ดูไฟล์แนบ">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </a>
                          )}
                          <button className="action-btn action-del" title="ลบ" onClick={() => handleDelete(t.transfer_id)}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {!loadingList && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>
                แสดง {(page - 1) * perPage + 1}-{Math.min(page * perPage, listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length)} จาก {listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length} รายการ
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13, color: page === 1 ? '#94a3b8' : '#334155', fontWeight: 600 }}>
                  ก่อนหน้า
                </button>
                {Array.from({ length: Math.ceil((listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length) / perPage) }, (_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)}
                    style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      border: page === i + 1 ? 'none' : '1px solid #cbd5e1',
                      background: page === i + 1 ? '#3b82f6' : 'white',
                      color: page === i + 1 ? 'white' : '#334155'
                    }}>{i + 1}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(Math.ceil((listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length) / perPage), p + 1))} disabled={page === Math.max(1, Math.ceil((listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length) / perPage))}
                  style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: page === Math.max(1, Math.ceil((listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length) / perPage)) ? 'default' : 'pointer', fontSize: 13, color: page === Math.max(1, Math.ceil((listSearch ? transfers.filter(t => t.order_no?.toLowerCase().includes(listSearch.toLowerCase()) || t.emp_name?.toLowerCase().includes(listSearch.toLowerCase()) || t.new_dept_name?.toLowerCase().includes(listSearch.toLowerCase())).length : transfers.length) / perPage)) ? '#94a3b8' : '#334155', fontWeight: 600 }}>
                  ถัดไป
                </button>
              </div>
            </div>
          )}
          </div>
        )}

        {/* ── FORM (3 sections) ── */}
        {showForm && (
          <div className="tr-form-panel">

            {/* ─── SECTION 1: ข้อมูลคำสั่ง ─── */}
            <div className="tr-section-header tr-section-1">
              1. ข้อมูลคำสั่ง
            </div>
            <div className="tr-section-body">
              <div className="tr-form-row tri">
                <div className="tr-fg">
                  <label className="tr-label">เลขที่คำสั่ง</label>
                  <input className="tr-input" placeholder="เช่น สพ.0032/2567" value={form.orderNo} onChange={e => setF('orderNo', e.target.value)} />
                </div>
                <div className="tr-fg">
                  <label className="tr-label">ลงวันที่</label>
                  <input type="date" className="tr-input" value={form.orderDate} onChange={e => setF('orderDate', e.target.value)} />
                </div>
                <div className="tr-fg">
                  <label className="tr-label">วันที่มีผล</label>
                  <input type="date" className="tr-input" value={form.effectDate} onChange={e => setF('effectDate', e.target.value)} />
                </div>
              </div>
              <div className="tr-form-row">
                <div className="tr-fg tr-fg span2" style={{ gridColumn: '1 / -1' }}>
                  <label className="tr-label">เรื่อง</label>
                  <input className="tr-input" placeholder="เช่น คำสั่งแต่งตั้งข้าราชการ" value={form.title} onChange={e => setF('title', e.target.value)} />
                </div>
              </div>
              <div className="tr-form-row single">
                <div className="tr-fg">
                  <label className="tr-label">ประเภท</label>
                  <select className="tr-select" value={form.transferType} onChange={e => setF('transferType', e.target.value)}>
                    {TRANSFER_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* ─── SECTION 2: รายละเอียดการเปลี่ยนแปลง ─── */}
            <div className="tr-section-header tr-section-2">
              2. รายละเอียดการเปลี่ยนแปลง
            </div>
            <div className="tr-section-body">

              {/* Employee search */}
              <div className="tr-fg" style={{ marginBottom: 20 }}>
                <label className="tr-label">ผู้ถูกคำสั่ง</label>
                <div className="tr-emp-search-wrap">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="tr-input" style={{ flex: 1 }}
                      placeholder="ค้นหาด้วยชื่อหรือรหัสพนักงาน..."
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && search()}
                    />
                    <button className="btn-tr-save" style={{ whiteSpace: 'nowrap' }} onClick={search}>ค้นหา</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="tr-emp-dropdown">
                      {searchResults.map(r => (
                        <div key={r.id} className="tr-emp-opt" onClick={() => selectEmployee(r)}>
                          <div className="tr-emp-opt-name">{r.name}</div>
                          <div className="tr-emp-opt-sub">{r.id} | {r.pos} | {r.dept}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Comparison table */}
              <table className="tr-compare">
                <thead>
                  <tr>
                    <th>รายการ</th>
                    <th>ข้อมูลปัจจุบัน (เดิม)</th>
                    <th>ข้อมูลใหม่ (ที่ย้ายไป)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>สังกัด/หน่วยงาน</td>
                    <td className="old-val">{selected ? form.oldDept || '—' : '—'}</td>
                    <td className="new-val">
                      <select className="tr-select" style={{ padding: '6px 10px', fontSize: 13 }} value={form.newDeptId} onChange={e => setF('newDeptId', e.target.value)}>
                        <option value="">— เลือกหน่วยงาน —</option>
                        {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>ตำแหน่งสายงาน</td>
                    <td className="old-val">{selected ? form.oldPosName || form.oldPos || '—' : '—'}</td>
                    <td className="new-val">
                      <select className="tr-select" style={{ padding: '6px 10px', fontSize: 13, width: '100%' }} value={form.newPos} onChange={e => setF('newPos', e.target.value)}>
                        <option value="">— เลือกตำแหน่ง —</option>
                        {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>ระดับ</td>
                    <td className="old-val">{selected ? form.oldLevel || '—' : '—'}</td>
                    <td className="new-val">
                      <input className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="ระดับใหม่" value={form.newLevel} onChange={e => setF('newLevel', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>เลขที่ตำแหน่ง</td>
                    <td className="old-val">{selected ? form.oldPosNo || '—' : '—'}</td>
                    <td className="new-val">
                      <input className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="เลขที่ตำแหน่งใหม่" value={form.newPosNo} onChange={e => setF('newPosNo', e.target.value)} />
                    </td>
                  </tr>
                  <tr>
                    <td>เงินเดือน (บาท)</td>
                    <td className="old-val">{selected ? form.oldSalary.toLocaleString() : '—'}</td>
                    <td className="new-val">
                      <input type="number" className="tr-input" style={{ padding: '6px 10px', fontSize: 13 }} placeholder="เงินเดือนใหม่" value={form.newSalary || ''} onChange={e => setF('newSalary', Number(e.target.value))} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ─── SECTION 3: เอกสารแนบ ─── */}
            <div className="tr-section-header tr-section-3">
              3. เอกสารแนบ
            </div>
            <div className="tr-section-body">
              <div className="tr-form-row single">
                <div className="tr-fg">
                  <label className="tr-label">หมายเหตุ</label>
                  <input className="tr-input" placeholder="บันทึกเพิ่มเติม (ถ้ามี)" value={form.remark} onChange={e => setF('remark', e.target.value)} />
                </div>
              </div>
              <div className="tr-fg">
                <label className="tr-label">ไฟล์แนบ PDF</label>
                <label className="tr-file-label">
                  <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </span>
                  <span>{orderFile ? orderFile.name : 'อัปโหลดไฟล์คำสั่งฉบับจริง (Scan) .pdf'}</span>
                  <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={e => setOrderFile(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="tr-form-footer">
              <button className="btn-tr-cancel" onClick={() => { setShowForm(false); setSelected(null); setSearchQ(''); }}>ยกเลิก</button>
              <button className="btn-tr-save" onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </div>
        )}

        {/* ── Modal: รายละเอียดคำสั่ง ── */}
        {viewingTransfer && (
          <div className="tr-modal-overlay" onClick={() => setViewingTransfer(null)}>
            <div className="tr-modal" onClick={e => e.stopPropagation()}>
              <div className="tr-modal-header">
                <span className="tr-modal-title">รายละเอียดคำสั่งย้าย</span>
                <button onClick={() => setViewingTransfer(null)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#94a3b8' }}>&times;</button>
              </div>
              <div className="tr-modal-body">
                <div className="detail-grid" style={{ marginBottom: 28 }}>
                  <div className="detail-item">
                    <span className="detail-label">เลขที่คำสั่ง</span>
                    <span className="detail-value">{viewingTransfer.order_no}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">วันที่มีผล</span>
                    <span className="detail-value">{viewingTransfer.effective_date?.split('T')[0] || '—'}</span>
                  </div>
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">เรื่อง</span>
                    <span className="detail-value">{viewingTransfer.subject}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ชื่อผู้ถูกคำสั่ง</span>
                    <span className="detail-value" style={{ color: '#2563eb' }}>{viewingTransfer.emp_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">ประเภทคำสั่ง</span>
                    <span className="detail-value">{viewingTransfer.transfer_type}</span>
                  </div>
                </div>

                <div className="detail-compare">
                  <div className="compare-row" style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 16, marginBottom: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>รายการเปลี่ยนแปลง</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#64748b' }}>ข้อมูลเดิม</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#3b82f6' }}>ข้อมูลอัปเดตใหม่</span>
                  </div>
                  <div className="compare-row">
                    <span className="detail-label">สังกัด/แผนก</span>
                    <span className="compare-val-box cv-old">{viewingTransfer.old_dept_name || '—'}</span>
                    <span className="compare-val-box cv-new">{viewingTransfer.new_dept_name || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="detail-label">ตำแหน่ง</span>
                    <span className="compare-val-box cv-old">{viewingTransfer.old_position || '—'}</span>
                    <span className="compare-val-box cv-new">{viewingTransfer.new_position || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="detail-label">ระดับ</span>
                    <span className="compare-val-box cv-old">{viewingTransfer.old_level || '—'}</span>
                    <span className="compare-val-box cv-new">{viewingTransfer.new_level || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="detail-label">เลขที่ตำแหน่ง</span>
                    <span className="compare-val-box cv-old">{viewingTransfer.old_pos_no || '—'}</span>
                    <span className="compare-val-box cv-new">{viewingTransfer.new_pos_no || '—'}</span>
                  </div>
                  <div className="compare-row">
                    <span className="detail-label">เงินเดือน</span>
                    <span className="compare-val-box cv-old">{viewingTransfer.old_salary?.toLocaleString() || '0'}</span>
                    <span className="compare-val-box cv-new">{viewingTransfer.new_salary?.toLocaleString() || '0'}</span>
                  </div>
                </div>

                {viewingTransfer.remark && (
                  <div style={{ marginTop: 24, padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                    <span className="detail-label">หมายเหตุ</span>
                    <p style={{ margin: '8px 0 0', fontSize: 15, color: '#334155' }}>{viewingTransfer.remark}</p>
                  </div>
                )}

                {viewingTransfer.order_file && (
                  <div style={{ marginTop: 24 }}>
                    <a href={`/uploads/${viewingTransfer.order_file}`} target="_blank" rel="noreferrer" 
                      style={{ background: '#eff6ff', padding: '12px 20px', borderRadius: '12px', color: '#2563eb', fontSize: 15, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#dbeafe'}
                      onMouseOut={e => e.currentTarget.style.background = '#eff6ff'}>
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      เปิดไฟล์เอกสารแนบคำสั่ง (PDF)
                    </a>
                  </div>
                )}
              </div>
              <div className="tr-modal-footer">
                <button className="btn-tr-cancel" style={{ padding: '12px 32px' }} onClick={() => setViewingTransfer(null)}>ปิดหน้าต่าง</button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden PDF Component */}
        <OrderPdfTemplate ref={printRef} transfer={printTransfer} />
      </div>
    </AppLayout>
  );
}
