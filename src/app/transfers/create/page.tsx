'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department { dept_id: string; dept_name: string; }
interface SearchResult {
  id: string; name: string; pos: string; pos_id?: string;
  dept: string; dept_id?: string; salary: number; level: string; pos_no: string;
}

const TRANSFER_TYPES = [
  { id: '01', label: '01 - บรรจุ/แต่งตั้ง' },
  { id: '02', label: '02 - เลื่อนตำแหน่ง' },
  { id: '03', label: '03 - ย้าย/สับเปลี่ยนตำแหน่ง' },
  { id: '04', label: '04 - โอน' },
  { id: '05', label: '05 - ช่วยราชการ' },
];

// ─── Validation ───────────────────────────────────────────────────────────────
interface FormErrors {
  empId?: string;
  orderNo?: string;
  orderDate?: string;
  effectDate?: string;
  title?: string;
  transferType?: string;
  newDeptId?: string;
  newSalary?: string;
  pdfFile?: string;
}

function validateForm(
  form: Record<string, any>,
  pdfFile: File | null
): FormErrors {
  const errors: FormErrors = {};
  if (!form.empId)                 errors.empId      = 'กรุณาเลือกพนักงาน';
  if (!form.orderNo?.trim())       errors.orderNo    = 'กรุณากรอกเลขที่คำสั่ง';
  if (!form.orderDate)             errors.orderDate  = 'กรุณาระบุวันที่ออกคำสั่ง';
  if (!form.effectDate)            errors.effectDate = 'กรุณาระบุวันที่มีผล';
  if (!form.title?.trim())         errors.title      = 'กรุณากรอกเรื่อง';
  if (!form.newDeptId)             errors.newDeptId  = 'กรุณาเลือกหน่วยงานใหม่';
  if (!pdfFile)                    errors.pdfFile    = 'กรุณาแนบไฟล์ PDF คำสั่ง';
  else if (!pdfFile.name.toLowerCase().endsWith('.pdf')) {
    errors.pdfFile = 'ไฟล์ต้องเป็น .pdf เท่านั้น';
  } else if (pdfFile.size > 5 * 1024 * 1024) {
    errors.pdfFile = 'ขนาดไฟล์ต้องไม่เกิน 5 MB';
  }
  if (form.newSalary && isNaN(Number(form.newSalary))) {
    errors.newSalary = 'เงินเดือนต้องเป็นตัวเลข';
  }
  return errors;
}

// ─── Field Error ──────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span className="cr-field-error" role="alert">
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
      {msg}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function TransferCreatePage() {
  const router      = useRouter();
  const { user }    = useAuth();
  const isAdmin     = ['Admin', 'admin', 'HR', 'หัวหน้า'].includes(user?.role ?? '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Redirect non-admin ────────────────────────────────────────────────────
  useEffect(() => {
    if (user && !isAdmin) {
      router.replace('/transfers');
    }
  }, [user, isAdmin, router]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [departments,    setDepartments]    = useState<Department[]>([]);
  const [searchQ,        setSearchQ]        = useState('');
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [selectedEmp,    setSelectedEmp]    = useState<SearchResult | null>(null);
  const [pdfFile,        setPdfFile]        = useState<File | null>(null);
  const [submitting,     setSubmitting]     = useState(false);
  const [errors,         setErrors]         = useState<FormErrors>({});
  const [touched,        setTouched]        = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    empId:        '',
    orderNo:      '',
    orderDate:    '',
    effectDate:   '',
    title:        '',
    transferType: '03',
    oldDeptId:    '',
    oldDept:      '',
    newDeptId:    '',
    oldPos:       '',
    oldPosName:   '',
    newPos:       '',
    oldLevel:     '',
    newLevel:     '',
    oldSalary:    0,
    newSalary:    '',
    remark:       '',
  });

  // ── Load departments ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(data => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }, []);

  // ── Real-time validation ──────────────────────────────────────────────────
  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm(form, pdfFile));
    }
  }, [form, pdfFile, touched]);

  // ── Field setter ──────────────────────────────────────────────────────────
  const setF = (k: string, v: unknown) => {
    setForm(f => ({ ...f, [k]: v }));
    setTouched(t => ({ ...t, [k]: true }));
  };
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  // ── Employee search ───────────────────────────────────────────────────────
  const searchEmployee = async () => {
    if (!searchQ.trim()) return;
    try {
      const res  = await fetch(`/api/staff-search?q=${encodeURIComponent(searchQ.trim())}`);
      const data = await res.json();
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchResults([]);
    }
  };

  const selectEmployee = (emp: SearchResult) => {
    setSelectedEmp(emp);
    setForm(f => ({
      ...f,
      empId:     emp.id,
      oldPos:    emp.pos_id || '',
      oldPosName: emp.pos,
      oldDeptId: emp.dept_id || '',
      oldDept:   emp.dept,
      oldSalary: emp.salary,
      oldLevel:  emp.level || '',
    }));
    setTouched(t => ({ ...t, empId: true }));
    setSearchResults([]);
    setSearchQ(emp.name);
  };

  // ── File change ──────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPdfFile(file);
    setTouched(t => ({ ...t, pdfFile: true }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all touched
    const allTouched = Object.fromEntries(
      ['empId','orderNo','orderDate','effectDate','title','newDeptId','pdfFile'].map(k => [k, true])
    );
    setTouched(allTouched);

    const errs = validateForm(form, pdfFile);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // Scroll to first error
      const firstErr = document.querySelector('.cr-field-error');
      firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify({
        ...form,
        newSalary: form.newSalary !== '' ? Number(form.newSalary) : 0,
      }));
      fd.append('order_file', pdfFile!);

      const res  = await fetch('/api/transfers', { method: 'POST', body: fd });
      const json = await res.json();

      if (!json.success) throw new Error(json.message || 'บันทึกไม่สำเร็จ');

      await Swal.fire({
        title: 'บันทึกสำเร็จ!',
        text: `สร้างคำสั่งย้าย ${form.orderNo} เรียบร้อยแล้ว`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
      });
      router.push('/transfers');
    } catch (err: any) {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: err.message || 'กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonText: 'ตกลง',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user && !isAdmin) return null; // while redirecting

  return (
    <AppLayout>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="cr-page">

        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              id="btn-back"
              className="cr-back-btn"
              type="button"
              title="กลับไปรายการโยกย้าย"
              aria-label="กลับไปรายการโยกย้าย"
              onClick={() => router.push('/transfers')}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="page-title">สร้างคำสั่งย้ายใหม่</h1>
              <p className="page-subtitle">กรอกข้อมูลคำสั่งและแนบไฟล์ PDF เพื่อบันทึกระบบ</p>
            </div>
          </div>
        </div>

        <form id="form-create-transfer" onSubmit={handleSubmit} noValidate>

          {/* ── SECTION 1: ข้อมูลคำสั่ง ──────────────────────────────── */}
          <div className="glass-card cr-section">
            <div className="cr-section-header">
              <div className="cr-section-num">1</div>
              <span>ข้อมูลคำสั่ง</span>
            </div>
            <div className="cr-section-body">

              <div className="cr-row tri">
                <div className="cr-fg">
                  <label htmlFor="field-orderNo" className="cr-label">เลขที่คำสั่ง <span className="cr-required">*</span></label>
                  <input
                    id="field-orderNo"
                    className={`cr-input ${errors.orderNo && touched.orderNo ? 'cr-input-err' : ''}`}
                    placeholder="เช่น สพ.0032/2567"
                    value={form.orderNo}
                    onChange={e => setF('orderNo', e.target.value)}
                    onBlur={() => touch('orderNo')}
                  />
                  <FieldError msg={touched.orderNo ? errors.orderNo : ''} />
                </div>
                <div className="cr-fg">
                  <label htmlFor="field-orderDate" className="cr-label">วันที่ออกคำสั่ง <span className="cr-required">*</span></label>
                  <input
                    id="field-orderDate"
                    type="date"
                    className={`cr-input ${errors.orderDate && touched.orderDate ? 'cr-input-err' : ''}`}
                    value={form.orderDate}
                    onChange={e => setF('orderDate', e.target.value)}
                    onBlur={() => touch('orderDate')}
                  />
                  <FieldError msg={touched.orderDate ? errors.orderDate : ''} />
                </div>
                <div className="cr-fg">
                  <label htmlFor="field-effectDate" className="cr-label">วันที่มีผล <span className="cr-required">*</span></label>
                  <input
                    id="field-effectDate"
                    type="date"
                    className={`cr-input ${errors.effectDate && touched.effectDate ? 'cr-input-err' : ''}`}
                    value={form.effectDate}
                    onChange={e => setF('effectDate', e.target.value)}
                    onBlur={() => touch('effectDate')}
                  />
                  <FieldError msg={touched.effectDate ? errors.effectDate : ''} />
                </div>
              </div>

              <div className="cr-row">
                <div className="cr-fg" style={{ gridColumn: '1/-1' }}>
                  <label htmlFor="field-title" className="cr-label">เรื่อง <span className="cr-required">*</span></label>
                  <input
                    id="field-title"
                    className={`cr-input ${errors.title && touched.title ? 'cr-input-err' : ''}`}
                    placeholder="เช่น คำสั่งแต่งตั้งข้าราชการ"
                    value={form.title}
                    onChange={e => setF('title', e.target.value)}
                    onBlur={() => touch('title')}
                  />
                  <FieldError msg={touched.title ? errors.title : ''} />
                </div>
              </div>

              <div className="cr-row single">
                <div className="cr-fg">
                  <label htmlFor="field-transferType" className="cr-label">ประเภทคำสั่ง</label>
                  <select
                    id="field-transferType"
                    className="cr-select"
                    value={form.transferType}
                    onChange={e => setF('transferType', e.target.value)}
                  >
                    {TRANSFER_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* ── SECTION 2: ผู้ถูกคำสั่ง ────────────────────────────────── */}
          <div className="glass-card cr-section">
            <div className="cr-section-header">
              <div className="cr-section-num">2</div>
              <span>รายละเอียดการเปลี่ยนแปลง</span>
            </div>
            <div className="cr-section-body">

              {/* Employee search */}
              <div className="cr-fg">
                <label className="cr-label">ผู้ถูกคำสั่ง <span className="cr-required">*</span></label>
                <div className="cr-search-row">
                  <input
                    id="field-emp-search"
                    className={`cr-input cr-search-input ${errors.empId && touched.empId ? 'cr-input-err' : ''}`}
                    placeholder="ค้นหาด้วยชื่อหรือรหัสพนักงาน..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), searchEmployee())}
                    onBlur={() => touch('empId')}
                  />
                  <button
                    id="btn-emp-search"
                    type="button"
                    className="btn-primary cr-search-btn"
                    onClick={searchEmployee}
                  >
                    ค้นหา
                  </button>
                </div>
                <FieldError msg={touched.empId ? errors.empId : ''} />

                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="cr-emp-dropdown">
                    {searchResults.map(emp => (
                      <div
                        key={emp.id}
                        id={`emp-option-${emp.id}`}
                        className="cr-emp-option"
                        onClick={() => selectEmployee(emp)}
                      >
                        <div className="cr-emp-name">{emp.name}</div>
                        <div className="cr-emp-sub">{emp.id} | {emp.pos} | {emp.dept}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected highlight */}
                {selectedEmp && (
                  <div className="cr-selected-emp">
                    <div className="cr-selected-avatar">{selectedEmp.name.charAt(0)}</div>
                    <div>
                      <div className="cr-selected-name">{selectedEmp.name}</div>
                      <div className="cr-selected-sub">{selectedEmp.id} | {selectedEmp.dept}</div>
                    </div>
                    <button
                      type="button"
                      className="cr-clear-emp"
                      title="ล้างการเลือกพนักงาน"
                      aria-label="ล้างการเลือกพนักงาน"
                      onClick={() => { setSelectedEmp(null); setSearchQ(''); setForm(f => ({ ...f, empId: '' })); }}
                    >✕</button>
                  </div>
                )}
              </div>

              {/* Comparison table */}
              <div className="cr-compare-table">
                <div className="cr-compare-head">
                  <span>รายการ</span>
                  <span>ข้อมูลเดิม (ปัจจุบัน)</span>
                  <span>ข้อมูลใหม่ (หลังคำสั่ง)</span>
                </div>

                {/* Dept */}
                <div className="cr-compare-row">
                  <span className="cr-compare-label">สังกัด / หน่วยงาน</span>
                  <span className="cr-compare-old">{selectedEmp ? (form.oldDept || '—') : '—'}</span>
                  <div className="cr-fg cr-no-mb">
                    <select
                      id="field-newDeptId"
                      aria-label="เลือกหน่วยงานใหม่"
                      title="เลือกหน่วยงานใหม่"
                      className={`cr-select ${errors.newDeptId && touched.newDeptId ? 'cr-input-err' : ''}`}
                      value={form.newDeptId}
                      onChange={e => setF('newDeptId', e.target.value)}
                      onBlur={() => touch('newDeptId')}
                    >
                      <option value="">— เลือกหน่วยงานใหม่ —</option>
                      {departments.map(d => (
                        <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>
                      ))}
                    </select>
                    <FieldError msg={touched.newDeptId ? errors.newDeptId : ''} />
                  </div>
                </div>

                {/* Level */}
                <div className="cr-compare-row">
                  <span className="cr-compare-label">ระดับ</span>
                  <span className="cr-compare-old">{selectedEmp ? (form.oldLevel || '—') : '—'}</span>
                  <input
                    id="field-newLevel"
                    className="cr-input"
                    placeholder="ระดับใหม่ (ถ้ามี)"
                    value={form.newLevel}
                    onChange={e => setF('newLevel', e.target.value)}
                  />
                </div>

                {/* Salary */}
                <div className="cr-compare-row">
                  <span className="cr-compare-label">เงินเดือน (บาท)</span>
                  <span className="cr-compare-old">
                    {selectedEmp ? form.oldSalary.toLocaleString() : '—'}
                  </span>
                  <div className="cr-fg cr-no-mb">
                    <input
                      id="field-newSalary"
                      type="number"
                      className={`cr-input ${errors.newSalary && touched.newSalary ? 'cr-input-err' : ''}`}
                      placeholder="เงินเดือนใหม่"
                      value={form.newSalary}
                      onChange={e => setF('newSalary', e.target.value)}
                      onBlur={() => touch('newSalary')}
                      min={0}
                    />
                    <FieldError msg={touched.newSalary ? errors.newSalary : ''} />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── SECTION 3: เอกสารแนบ ────────────────────────────────────── */}
          <div className="glass-card cr-section">
            <div className="cr-section-header">
              <div className="cr-section-num">3</div>
              <span>เอกสารแนบ</span>
            </div>
            <div className="cr-section-body">

              <div className="cr-fg">
                <label htmlFor="field-remark" className="cr-label">หมายเหตุ (ถ้ามี)</label>
                <input
                  id="field-remark"
                  className="cr-input"
                  placeholder="บันทึกเพิ่มเติม..."
                  value={form.remark}
                  onChange={e => setF('remark', e.target.value)}
                />
              </div>

              <div className="cr-fg">
                <label className="cr-label">
                  ไฟล์คำสั่ง (PDF) <span className="cr-required">*</span>
                  <span className="cr-hint"> — .pdf เท่านั้น, ขนาดไม่เกิน 5 MB</span>
                </label>
                <label
                  id="label-pdf-upload"
                  className={`cr-file-label ${pdfFile ? 'cr-file-ok' : ''} ${errors.pdfFile && touched.pdfFile ? 'cr-file-err' : ''}`}
                >
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {pdfFile
                      ? `${pdfFile.name}  (${(pdfFile.size / 1024).toFixed(0)} KB)`
                      : 'คลิกเพื่อเลือกหรือลากมาวางไฟล์ PDF ที่นี่'}
                  </span>
                  <input
                    ref={fileInputRef}
                    id="field-pdf-file"
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </label>
                <FieldError msg={touched.pdfFile ? errors.pdfFile : ''} />
              </div>

            </div>
          </div>

          {/* ── Footer Buttons ──────────────────────────────────────────── */}
          <div className="cr-footer">
            <button
              id="btn-cancel"
              type="button"
              className="cr-btn-cancel"
              onClick={() => router.push('/transfers')}
              disabled={submitting}
            >
              ยกเลิก
            </button>
            <button
              id="btn-submit"
              type="submit"
              className="cr-btn-submit"
              disabled={submitting}
              aria-busy={submitting ? 'true' : 'false'}
            >
              {submitting ? (
                <>
                  <span className="cr-spinner" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  บันทึกคำสั่งย้าย
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </AppLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  .cr-page { display: flex; flex-direction: column; gap: 20px; padding: 24px; min-height: calc(100vh - 65px); }

  /* Back button */
  .cr-back-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569; transition: all 0.2s; flex-shrink: 0; }
  .cr-back-btn:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }

  /* Section card */
  .cr-section { padding: 0; overflow: hidden; }
  .cr-section-header { display: flex; align-items: center; gap: 14px; padding: 20px 28px; border-bottom: 1px solid #f1f5f9; font-size: 17px; font-weight: 800; color: #0f172a; }
  .cr-section-num { width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg,#3b82f6,#6366f1); color: white; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cr-section-body { padding: 28px; display: flex; flex-direction: column; gap: 20px; }

  /* Form layout */
  .cr-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .cr-row.tri { grid-template-columns: 1fr 1fr 1fr; }
  .cr-row.single { grid-template-columns: 1fr; }
  .cr-fg { display: flex; flex-direction: column; gap: 8px; }
  .cr-no-mb { gap: 4px; }
  .cr-label { font-size: 13px; font-weight: 700; color: #475569; }
  .cr-required { color: #ef4444; }
  .cr-hint { font-size: 12px; font-weight: 500; color: #94a3b8; margin-left: 4px; }
  .cr-input, .cr-select { border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 13px 16px; font-size: 15px; color: #1e293b; outline: none; transition: border-color .2s, box-shadow .2s; background: #f8fafc; font-family: inherit; width: 100%; box-sizing: border-box; }
  .cr-input:focus, .cr-select:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
  .cr-input-err { border-color: #ef4444 !important; background: #fff5f5 !important; }
  .cr-field-error { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #ef4444; font-weight: 600; margin-top: 2px; }

  /* Employee search */
  .cr-search-row { display: flex; gap: 10px; }
  .cr-search-input { flex: 1; }
  .cr-search-btn { white-space: nowrap; padding: 13px 22px; }
  .cr-emp-dropdown { border: 1px solid #e2e8f0; border-radius: 16px; background: white; box-shadow: 0 8px 24px rgba(0,0,0,.1); overflow: hidden; max-height: 260px; overflow-y: auto; }
  .cr-emp-option { padding: 14px 20px; cursor: pointer; border-bottom: 1px solid #f8fafc; transition: background .15s; }
  .cr-emp-option:hover { background: #f8fafc; }
  .cr-emp-option:last-child { border-bottom: none; }
  .cr-emp-name { font-weight: 700; color: #0f172a; font-size: 15px; }
  .cr-emp-sub { font-size: 13px; color: #64748b; margin-top: 2px; }
  .cr-selected-emp { display: flex; align-items: center; gap: 14px; padding: 14px 18px; background: #eff6ff; border-radius: 14px; border: 1.5px solid #bfdbfe; }
  .cr-selected-avatar { width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg,#3b82f6,#6366f1); color: white; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cr-selected-name { font-weight: 700; color: #1e40af; font-size: 15px; }
  .cr-selected-sub { font-size: 13px; color: #60a5fa; margin-top: 2px; }
  .cr-clear-emp { margin-left: auto; background: none; border: none; font-size: 18px; cursor: pointer; color: #93c5fd; transition: color .2s; padding: 4px 8px; border-radius: 8px; }
  .cr-clear-emp:hover { color: #ef4444; background: #fee2e2; }

  /* Compare table */
  .cr-compare-table { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .cr-compare-head { display: grid; grid-template-columns: 160px 1fr 1fr; gap: 16px; padding: 12px 20px; background: #f8fafc; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e2e8f0; }
  .cr-compare-row { display: grid; grid-template-columns: 160px 1fr 1fr; gap: 16px; padding: 16px 20px; align-items: center; border-bottom: 1px solid #f1f5f9; }
  .cr-compare-row:last-child { border-bottom: none; }
  .cr-compare-label { font-size: 13px; font-weight: 700; color: #475569; }
  .cr-compare-old { font-size: 14px; color: #64748b; background: #f1f5f9; padding: 10px 14px; border-radius: 10px; text-align: center; }

  /* File upload */
  .cr-file-label { display: flex; align-items: center; gap: 14px; padding: 20px 24px; border: 2px dashed #cbd5e1; border-radius: 16px; cursor: pointer; background: #f8fafc; transition: all .3s; font-size: 15px; color: #475569; font-weight: 600; }
  .cr-file-label:hover { border-color: #3b82f6; color: #2563eb; background: #eff6ff; }
  .cr-file-ok { border-color: #10b981 !important; background: #ecfdf5 !important; color: #059669 !important; border-style: solid !important; }
  .cr-file-err { border-color: #ef4444 !important; background: #fff5f5 !important; }

  /* Footer */
  .cr-footer { display: flex; justify-content: flex-end; gap: 14px; padding: 8px 4px 16px; }
  .cr-btn-cancel { padding: 14px 28px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; background: white; color: #475569; border: 1.5px solid #e2e8f0; transition: all .2s; }
  .cr-btn-cancel:hover:not(:disabled) { background: #f1f5f9; border-color: #94a3b8; }
  .cr-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
  .cr-btn-submit { padding: 14px 32px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg,#10b981,#059669); color: white; border: none; transition: transform .2s, box-shadow .2s; box-shadow: 0 4px 14px rgba(16,185,129,.25); display: flex; align-items: center; gap: 8px; }
  .cr-btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(16,185,129,.35); }
  .cr-btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; box-shadow: none; }
  .cr-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,.3); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; flex-shrink: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .cr-row, .cr-row.tri { grid-template-columns: 1fr; }
    .cr-compare-head, .cr-compare-row { grid-template-columns: 120px 1fr 1fr; gap: 10px; }
    .cr-footer { flex-direction: column; }
    .cr-btn-cancel, .cr-btn-submit { width: 100%; justify-content: center; }
  }
`;
