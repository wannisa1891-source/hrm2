'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Swal from 'sweetalert2';
import { 
    Settings, 
    Clock, 
    Edit2, 
    Plus, 
    Briefcase, 
    DollarSign, 
    X, 
    Save, 
    Info, 
    Trash2 
} from 'lucide-react';

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
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
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

    const resetForm = () => {
        setForm({ code: '', name: '', start_time: '', end_time: '', working_hours: 8, allowance: 0, color_code: '#3b82f6' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (shift: ShiftType) => {
        setForm({
            code: shift.code,
            name: shift.name,
            start_time: shift.start_time.substring(0, 5),
            end_time: shift.end_time.substring(0, 5),
            working_hours: shift.working_hours,
            allowance: shift.allowance,
            color_code: shift.color_code
        });
        setIsEditing(true);
        setEditingId(shift.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบประเภทเวรนี้ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/schedule/shifts?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete');
                Swal.fire({ title: 'ลบสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
                fetchShifts();
            } catch (err: any) {
                Swal.fire('ข้อผิดพลาด', err.message, 'error');
            }
        }
    };

    const handleSave = async () => {
        try {
            if (!form.code || !form.name || !form.start_time || !form.end_time) {
                Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบถ้วน', 'warning');
                return;
            }

            const method = isEditing ? 'PUT' : 'POST';
            const body = isEditing ? { ...form, id: editingId } : form;

            const res = await fetch('/api/schedule/shifts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'save'}`);
            
            Swal.fire({ 
                title: isEditing ? 'อัปเดตสำเร็จ' : 'บันทึกสำเร็จ', 
                icon: 'success', 
                timer: 1500, 
                showConfirmButton: false 
            });
            
            resetForm();
            fetchShifts();
        } catch (err: any) {
            Swal.fire('ข้อผิดพลาด', err.message, 'error');
        }
    };

    return (
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
                        </div>
                    </div>
                </div>

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
                                    <label style={styles.label}>รหัสเวร (ตัวย่อ) <span style={{ color: '#f43f5e' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        value={form.code} 
                                        onChange={e => setForm({...form, code: e.target.value})} 
                                        style={styles.inputSimple} 
                                        placeholder="เช่น M, A, N" 
                                        maxLength={10}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>สีประจำเวร</label>
                                    <div style={styles.colorPickerWrapper}>
                                        <div style={{ ...styles.colorPreview, backgroundColor: form.color_code }}></div>
                                        <label htmlFor="colorInput" style={styles.colorText}>{form.color_code.toUpperCase()}</label>
                                        <input 
                                            id="colorInput"
                                            type="color" 
                                            value={form.color_code} 
                                            onChange={e => setForm({...form, color_code: e.target.value})} 
                                            style={styles.colorInput} 
                                        />
                                    </div>
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
                            </div>
                        </div>
                    </div>

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
                                                                {Number(shift.allowance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </AppLayout>
    );
}

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
        transition: 'all 0.2s',
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
        transition: 'all 0.2s'
    },
    deleteBtn: {
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid #fee2e2',
        background: '#fff5f5',
        color: '#ef4444',
        cursor: 'pointer',
        display: 'flex',
        transition: 'all 0.2s'
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
