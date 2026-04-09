'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Swal from 'sweetalert2';

interface ShiftType {
    id: number;
    code: string;
    name: string;
    start_time: string;
    end_time: string;
    working_hours: number;
    allowance: number;
    color_code: string;
}

export default function MasterPage() {
    const [shifts, setShifts] = useState<ShiftType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        code: '', name: '', start_time: '', end_time: '', working_hours: 8, allowance: 0, color_code: '#3b82f6'
    });

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/schedule/shifts');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setShifts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/schedule/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Failed to save');
            setForm({ code: '', name: '', start_time: '', end_time: '', working_hours: 8, allowance: 0, color_code: '#3b82f6' });
            Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchShifts();
        } catch (err: any) {
            Swal.fire('ข้อผิดพลาด', err.message, 'error');
        }
    };

    return (
<<<<<<< HEAD
        <AppLayout hideScrollbar={false}>
            <div style={styles.container}>
                {/* HEADER SECTION */}
                <div style={styles.headerSection}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="hover-lift" style={styles.iconBox}>
                            <Settings size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 style={styles.title}>Shift Master <span style={{ color: '#6366f1' }}>Settings</span></h1>
                            <p style={styles.subtitle}>จัดการโครงสร้างช่วงเวลาทำงานและประเภทเวรในระบบ</p>
=======
        <AppLayout>
            <div className="p-6 md:p-8 max-w-[1400px] w-full mx-auto min-h-screen">
                <div className="mb-6 pb-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-gray-600 bg-gray-100 p-2 rounded-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Shift Settings</h1>
                            <p className="text-sm text-gray-500 mt-1">ตั้งค่าโครงสร้างและประเภทเวร</p>
>>>>>>> 4d1eab8b1e1666b0f95255ccd5d21d0ec05c3dae
                        </div>
                    </div>
                </div>

<<<<<<< HEAD
                <div style={styles.mainGrid}>
                    {/* LEFT SIDE: FORM CARD */}
                    <div className="hover-glow" style={styles.formCard}>
                        <div style={styles.cardHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    padding: '8px', 
                                    borderRadius: '10px', 
                                    background: isEditing ? '#eef2ff' : '#f0fdf4',
                                    color: isEditing ? '#4f46e5' : '#10b981'
                                }}>
                                    {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <h2 style={styles.cardTitle}>{isEditing ? 'แก้ไขข้อมูลประเภทเวร' : 'สร้างประเภทเวรใหม่'}</h2>
                            </div>
                        </div>

                        <div style={styles.cardBody}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>ชื่อประเภทเวร <span style={{ color: '#f43f5e' }}>*</span></label>
                                <div style={styles.inputWrapper}>
                                    <div style={styles.inputIcon}><Briefcase size={18} /></div>
                                    <input 
                                        type="text" 
                                        value={form.name} 
                                        onChange={e => setForm({...form, name: e.target.value})} 
                                        style={styles.input} 
                                        placeholder="เช่น เวรเช้า (Morning Shift)" 
                                    />
                                </div>
                            </div>

                            <div style={styles.formRowTwo}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>รหัสเวร <span style={{ color: '#f43f5e' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        value={form.code} 
                                        onChange={e => setForm({...form, code: e.target.value})} 
                                        style={styles.inputSimple} 
                                        placeholder="เช่น M, A, N" 
                                        maxLength={10}
                                    />
=======
                <div className="space-y-6">
                    {/* Add Form (Full Width but Grid) */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-800 mb-6 flex items-center border-b pb-3 border-gray-100">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            ฟอร์มสำหรับเพิ่มประเภทเวร (Add New Shift)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">ตัวย่อเวร</label>
                                <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm text-sm" placeholder="เช่น ช, บ, ด" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อเต็มเวร</label>
                                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm text-sm" placeholder="เช้า, บ่าย" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">เวลาเริ่ม และ เวลาจบ</label>
                                <div className="flex bg-gray-50 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                                    <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-1/2 px-2 py-2.5 border-none bg-transparent focus:ring-0 text-sm" />
                                    <div className="w-px bg-gray-300"></div>
                                    <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-1/2 px-2 py-2.5 border-none bg-transparent focus:ring-0 text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">จำนวน ชม. | ค่าเวร (฿)</label>
                                <div className="flex gap-2">
                                    <input type="number" value={form.working_hours} onChange={e => setForm({...form, working_hours: Number(e.target.value)})} className="w-1/2 px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 shadow-sm text-sm" placeholder="ชม." />
                                    <input type="number" value={form.allowance} onChange={e => setForm({...form, allowance: Number(e.target.value)})} className="w-1/2 px-3 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 shadow-sm text-sm" placeholder="฿" />
>>>>>>> 4d1eab8b1e1666b0f95255ccd5d21d0ec05c3dae
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="block text-sm font-semibold text-gray-700 mb-1 md:hidden">สีและบันทึก</label>
                                <div className="flex gap-3">
                                    <div className="shrink-0 relative overflow-hidden h-[42px] w-[50px] rounded-lg border border-gray-300 shadow-sm">
                                        <input type="color" value={form.color_code} onChange={e => setForm({...form, color_code: e.target.value})} className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" title="เลือกสีประจำเวร" />
                                    </div>
<<<<<<< HEAD
                                </div>
                            </div>

                            <div style={styles.formRowTwo}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>เวลาเริ่มงาน <span style={{ color: '#f43f5e' }}>*</span></label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.inputIcon}><Clock size={16} /></div>
                                        <input 
                                            type="time" 
                                            value={form.start_time} 
                                            onChange={e => setForm({...form, start_time: e.target.value})} 
                                            style={styles.input} 
                                        />
                                    </div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>เวลาสิ้นสุด <span style={{ color: '#f43f5e' }}>*</span></label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.inputIcon}><Clock size={16} /></div>
                                        <input 
                                            type="time" 
                                            value={form.end_time} 
                                            onChange={e => setForm({...form, end_time: e.target.value})} 
                                            style={styles.input} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.formRowTwo}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>ชั่วโมงทำงาน</label>
                                    <input 
                                        type="number" 
                                        value={form.working_hours} 
                                        onChange={e => setForm({...form, working_hours: Number(e.target.value)})} 
                                        style={styles.inputSimple} 
                                        placeholder="8" 
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>ค่าเบี้ยเลี้ยง (฿)</label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.inputIcon}><DollarSign size={16} /></div>
                                        <input 
                                            type="number" 
                                            value={form.allowance} 
                                            onChange={e => setForm({...form, allowance: Number(e.target.value)})} 
                                            style={styles.input} 
                                            placeholder="0.00" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.actionRow}>
                                {isEditing && (
                                    <button onClick={resetForm} style={styles.cancelBtn}>
                                        <X size={18} /> ยกเลิก
                                    </button>
                                )}
                                <button onClick={handleSave} style={isEditing ? styles.updateBtn : styles.saveBtn}>
                                    {isEditing ? <Save size={18} /> : <Plus size={18} />}
                                    {isEditing ? 'อัปเดตข้อมูล' : 'บันทึกประเภทเวร'}
                                </button>
=======
                                    <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                                        บันทึก
                                    </button>
                                </div>
>>>>>>> 4d1eab8b1e1666b0f95255ccd5d21d0ec05c3dae
                            </div>
                        </div>
                    </div>

<<<<<<< HEAD
                    {/* RIGHT SIDE: TABLE CARD */}
                    <div style={styles.tableCard}>
                        <div style={styles.cardHeaderTable}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={styles.infoIconBox}>
                                    <Info size={18} />
                                </div>
                                <div>
                                    <h2 style={styles.cardTitle}>รายการเวรในระบบ</h2>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>ทั้งหมด {shifts.length} รายการ</p>
                                </div>
                            </div>
                        </div>

                        <div style={styles.cardBodyTable}>
                            {loading ? (
                                <div style={styles.loadingBox}>
                                    <div className="animate-spin" style={styles.spinner}></div>
                                    <p style={{ fontWeight: 600, color: '#6366f1' }}>กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : (
                                <div style={styles.tableWrapper}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>ประเภทเวร</th>
                                                <th style={styles.th}>โครงสร้างเวลา</th>
                                                <th style={styles.th}>ค่าตอบแทน</th>
                                                <th style={{ ...styles.th, textAlign: 'right' }}>เครื่องมือ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shifts.map((shift) => (
                                                <tr key={shift.id} className="group" style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                            <div style={{ 
                                                                ...styles.colorBadge, 
                                                                background: `${shift.color_code}15`,
                                                                borderColor: shift.color_code,
                                                                color: shift.color_code
                                                            }}>
                                                                {shift.code}
                                                            </div>
                                                            <div>
                                                                <div style={styles.shiftName}>{shift.name}</div>
                                                                <div style={styles.shiftCodeText}>รหัส: {shift.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={styles.timeLabel}>
                                                            <div style={{ 
                                                                padding: '6px 10px', 
                                                                background: '#f8fafc', 
                                                                borderRadius: '8px',
                                                                border: '1px solid #edf2f7',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}>
                                                                <Clock size={14} color="#6366f1" />
                                                                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                                                    {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={styles.hourLabel}>ระยะเวลา: {shift.working_hours} ชั่วโมง</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={styles.allowanceContainer}>
                                                            <span style={styles.currency}>฿</span>
                                                            <span style={styles.allowanceText}>
                                                                {shift.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ ...styles.td, textAlign: 'right' }}>
                                                        <div style={styles.btnGroup}>
                                                            <button 
                                                                onClick={() => handleEdit(shift)} 
                                                                style={styles.editBtn} 
                                                                title="แก้ไขข้อมูล"
                                                                className="hover-lift"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(shift.id)} 
                                                                style={styles.deleteBtn} 
                                                                title="ลบรายการ"
                                                                className="hover-lift"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {shifts.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} style={styles.emptyTd}>
                                                        <div style={{ opacity: 0.5, marginBottom: '12px' }}>
                                                            <Settings size={48} />
                                                        </div>
                                                        ยังไม่มีข้อมูลประเภทเวรในระบบ
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
=======
                    {/* Table (Full Width Below) */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                            รายการเวรในระบบ
                        </h3>
                        
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-lg border border-gray-100"></div>)}
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr className="border-b border-gray-200 text-left">
                                            <th className="py-3 px-4 font-bold text-gray-600 w-1/4">ประเภทเวร</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 w-1/4">ช่วงเวลา (เริ่ม - จบ)</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 w-1/4">ชั่วโมงทำงาน</th>
                                            <th className="py-3 px-4 font-bold text-gray-600 w-1/4">ค่าตอบแทนต่อเวร</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {shifts.map(shift => (
                                            <tr key={shift.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: shift.color_code }}></span>
                                                        <span className="font-bold text-gray-800">{shift.name} <span className="text-gray-400 font-normal">({shift.code})</span></span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600 font-medium tracking-wide">
                                                    {shift.start_time.substring(0,5)} <span className="text-gray-400 mx-1">-</span> {shift.end_time.substring(0,5)}
                                                </td>
                                                <td className="py-4 px-4 text-gray-600">{shift.working_hours} ชม.</td>
                                                <td className="py-4 px-4 font-medium text-emerald-600">฿ {shift.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                        {shifts.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-gray-400 font-medium bg-gray-50/50">ยังไม่มีข้อมูลในระบบ</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
>>>>>>> 4d1eab8b1e1666b0f95255ccd5d21d0ec05c3dae
                    </div>
                </div>
            </div>

            <style jsx>{`
                .hover-lift {
                    transition: all 0.2s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                }
                .hover-glow {
                    transition: all 0.3s ease;
                }
                .hover-glow:hover {
                    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.1);
                    border-color: rgba(99, 102, 241, 0.2);
                }
                .group:hover td {
                    background: #fcfdfe !important;
                }
            `}</style>
        </AppLayout>
    );
}
<<<<<<< HEAD

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '40px 48px',
        background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #e8edff 100%)',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Inter', 'Sarabun', sans-serif",
        position: 'relative',
        overflow: 'hidden'
    },
    headerSection: {
        marginBottom: '40px',
        position: 'relative',
        zIndex: 5
    },
    iconBox: {
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: '#fff',
        boxShadow: '0 12px 24px rgba(99, 102, 241, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4f46e5',
        cursor: 'pointer'
    },
    title: {
        fontSize: '32px',
        fontWeight: 900,
        color: '#0f172a',
        margin: 0,
        letterSpacing: '-0.03em',
        lineHeight: 1.1
    },
    subtitle: {
        fontSize: '16px',
        color: '#64748b',
        margin: '8px 0 0',
        fontWeight: 500
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(380px, 420px) 1fr',
        gap: '40px',
        alignItems: 'start',
        position: 'relative',
        zIndex: 5
    },
    formCard: {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderRadius: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        border: '1px solid rgba(255,255,255,0.8)',
        overflow: 'hidden',
        transition: 'all 0.3s'
    },
    tableCard: {
        background: '#fff',
        borderRadius: '30px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
    },
    cardHeader: {
        padding: '28px 32px',
        borderBottom: '1px solid rgba(241, 245, 249, 0.7)',
        background: 'transparent'
    },
    cardHeaderTable: {
        padding: '28px 32px',
        borderBottom: '1px solid #f1f5f9',
        background: 'linear-gradient(to right, #ffffff, #fcfdfe)'
    },
    infoIconBox: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: '#f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4f46e5'
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: 800,
        color: '#1e293b',
        margin: 0
    },
    cardBody: {
        padding: '32px'
    },
    cardBodyTable: {
        padding: '0'
    },
    formGroup: {
        marginBottom: '24px',
        flex: 1
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 700,
        color: '#475569',
        marginBottom: '10px',
        marginLeft: '4px'
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputIcon: {
        position: 'absolute',
        left: '16px',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none'
    },
    input: {
        width: '100%',
        padding: '14px 16px 14px 48px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        fontSize: '15px',
        color: '#0f172a',
        background: '#fff',
        outline: 'none',
        transition: 'all 0.2s focus',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    inputSimple: {
        width: '100%',
        padding: '14px 18px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        fontSize: '15px',
        color: '#0f172a',
        background: '#fff',
        outline: 'none',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    formRowTwo: {
        display: 'flex',
        gap: '20px'
    },
    colorPickerWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#fff',
        padding: '8px 14px',
        borderRadius: '16px',
        border: '1.5px solid #e2e8f0',
        height: '51px'
    },
    colorPreview: {
        width: '28px',
        height: '28px',
        borderRadius: '8px',
        border: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    colorInput: {
        width: '0',
        height: '0',
        border: 'none',
        padding: 0,
        visibility: 'hidden' as any,
        position: 'absolute'
    },
    colorText: {
        fontSize: '13px',
        fontWeight: 800,
        color: '#64748b',
        fontFamily: 'monospace',
        letterSpacing: '0.02em',
        cursor: 'pointer'
    },
    actionRow: {
        display: 'flex',
        gap: '14px',
        marginTop: '36px'
    },
    saveBtn: {
        flex: 1,
        padding: '16px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '18px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: '0 10px 20px rgba(79, 70, 229, 0.3)',
        transition: 'all 0.2s'
    },
    updateBtn: {
        flex: 1,
        padding: '16px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: '#fff',
        border: 'none',
        borderRadius: '18px',
        fontSize: '16px',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: '0 10px 20px rgba(16, 185, 129, 0.3)',
        transition: 'all 0.2s'
    },
    cancelBtn: {
        padding: '16px 24px',
        background: '#fff',
        color: '#64748b',
        border: '1.5px solid #e2e8f0',
        borderRadius: '18px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        transition: 'all 0.2s'
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0
    },
    th: {
        padding: '20px 32px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 800,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        background: '#fff',
        borderBottom: '1px solid #f1f5f9'
    },
    tr: {
        transition: 'all 0.2s ease',
    },
    td: {
        padding: '24px 32px',
        verticalAlign: 'middle',
        borderBottom: '1px solid #f8fafc'
    },
    colorBadge: {
        padding: '6px 12px',
        borderRadius: '10px',
        fontSize: '12px',
        fontWeight: 900,
        border: '1px solid',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '40px'
    },
    shiftName: {
        fontSize: '16px',
        fontWeight: 800,
        color: '#1e293b'
    },
    shiftCodeText: {
        fontSize: '12px',
        color: '#94a3b8',
        fontWeight: 600,
        marginTop: '4px'
    },
    timeLabel: {
        marginBottom: '6px'
    },
    hourLabel: {
        fontSize: '12px',
        color: '#64748b',
        fontWeight: 500,
        marginLeft: '4px'
    },
    allowanceContainer: {
        display: 'flex',
        alignItems: 'baseline',
        gap: '4px'
    },
    currency: {
        fontSize: '14px',
        fontWeight: 700,
        color: '#10b981'
    },
    allowanceText: {
        fontSize: '20px',
        fontWeight: 900,
        color: '#10b981',
        letterSpacing: '-0.02em'
    },
    btnGroup: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
    },
    editBtn: {
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        color: '#4f46e5',
        cursor: 'pointer',
        display: 'flex',
        transition: 'all 0.2s hover'
    },
    deleteBtn: {
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
        background: '#fff5f5',
        color: '#ef4444',
        cursor: 'pointer',
        display: 'flex'
    },
    loadingBox: {
        padding: '100px 32px',
        textAlign: 'center',
        color: '#64748b'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #6366f1',
        borderRadius: '50%',
        margin: '0 auto 20px'
    },
    emptyTd: {
        padding: '100px 32px',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '16px',
        fontWeight: 500
    }
};
=======
>>>>>>> 4d1eab8b1e1666b0f95255ccd5d21d0ec05c3dae
