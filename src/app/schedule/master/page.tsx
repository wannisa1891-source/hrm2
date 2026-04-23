'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Swal from 'sweetalert2';
import {
    Settings, Plus, Edit2, Trash2, Clock, DollarSign,
    Palette, Info, Save, X, ChevronRight, Briefcase
} from '@/components/Icons';

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
        code: '', name: '', start_time: '', end_time: '', working_hours: 8, allowance: 0, color_code: '#4f46e5'
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
        if (!form.code || !form.name || !form.start_time || !form.end_time) {
            Swal.fire({ title: 'กรุณากรอกข้อมูลให้ครบ', icon: 'warning' });
            return;
        }

        try {
            const url = isEditing && editingId ? `/api/schedule/shifts/${editingId}` : '/api/schedule/shifts';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error('Failed to save');

            resetForm();
            Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchShifts();
        } catch (err: any) {
            Swal.fire('ข้อผิดพลาด', err.message, 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: 'คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเวรนี้?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ลบทิ้ง',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#ef4444'
        });

        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/schedule/shifts/${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete');
                Swal.fire({ title: 'ลบสำเร็จ', icon: 'success', timer: 1500, showConfirmButton: false });
                fetchShifts();
            } catch (err: any) {
                Swal.fire('ข้อผิดพลาด', err.message, 'error');
            }
        }
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

    const resetForm = () => {
        setForm({ code: '', name: '', start_time: '', end_time: '', working_hours: 8, allowance: 0, color_code: '#4f46e5' });
        setIsEditing(false);
        setEditingId(null);
    };

    return (
        <AppLayout hideScrollbar={false}>
            <div style={styles.container}>
                {/* HEADER */}
                <div style={styles.headerSection}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={styles.iconBox}>
                            <Settings size={28} />
                        </div>
                        <div>
                            <h1 style={styles.title}>Shift Master Settings</h1>
                            <p style={styles.subtitle}>จัดการประเภทเวรและโครงสร้างเวลาการทำงาน</p>
                        </div>
                    </div>
                </div>

                <div style={styles.mainGrid}>
                    {/* LEFT: FORM */}
                    <div style={styles.formCard}>
                        <div style={styles.cardHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {isEditing ? <Edit2 size={18} color="#4f46e5" /> : <Plus size={20} color="#4f46e5" />}
                                <h2 style={styles.cardTitle}>{isEditing ? 'แก้ไขข้อมูลเวร' : 'เพิ่มประเภทเวรใหม่'}</h2>
                            </div>
                        </div>

                        <div style={styles.cardBody}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>ชื่อประเภทเวร <span style={{ color: '#ef4444' }}>*</span></label>
                                <div style={styles.inputWrapper}>
                                    <div style={styles.inputIcon}><Briefcase size={16} /></div>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        style={styles.input}
                                        placeholder="เช่น เวรเช้า, เวรบ่าย"
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>รหัสเวร (ตัวย่อ) <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value })}
                                        style={styles.inputSimple}
                                        placeholder="ช, บ, ด"
                                        maxLength={10}
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>สีประจำเวร</label>
                                    <div style={styles.colorPickerWrapper}>
                                        <div style={{ ...styles.colorPreview, background: form.color_code }} />
                                        <input
                                            type="color"
                                            value={form.color_code}
                                            onChange={e => setForm({ ...form, color_code: e.target.value })}
                                            style={styles.colorInput}
                                        />
                                        <span style={styles.colorText}>{form.color_code.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>เวลาเริ่มงาน <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.inputIcon}><Clock size={16} /></div>
                                        <input
                                            type="time"
                                            value={form.start_time}
                                            onChange={e => setForm({ ...form, start_time: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>เวลาออกงาน <span style={{ color: '#ef4444' }}>*</span></label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.inputIcon}><Clock size={16} /></div>
                                        <input
                                            type="time"
                                            value={form.end_time}
                                            onChange={e => setForm({ ...form, end_time: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>ชั่วโมงทำงาน</label>
                                    <input
                                        type="number"
                                        value={form.working_hours}
                                        onChange={e => setForm({ ...form, working_hours: Number(e.target.value) })}
                                        style={styles.inputSimple}
                                        placeholder="8"
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>ค่าเบี้ยเลี้ยง / ค่าเวร (฿)</label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.inputIcon}><DollarSign size={16} /></div>
                                        <input
                                            type="number"
                                            value={form.allowance}
                                            onChange={e => setForm({ ...form, allowance: Number(e.target.value) })}
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
                                <button onClick={handleSave} style={styles.saveBtn}>
                                    <Save size={18} /> {isEditing ? 'อัปเดตข้อมูล' : 'บันทึกประเภทเวร'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: LIST */}
                    <div style={styles.tableCard}>
                        <div style={styles.cardHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Info size={18} color="#4f46e5" />
                                <h2 style={styles.cardTitle}>รายการเวรในระบบ ({shifts.length})</h2>
                            </div>
                        </div>

                        <div style={styles.cardBodyTable}>
                            {loading ? (
                                <div style={styles.loadingBox}>
                                    <div className="animate-spin" style={styles.spinner}></div>
                                    <p>กำลังโหลดข้อมูล...</p>
                                </div>
                            ) : (
                                <div style={styles.tableWrapper}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>ประเภทเวร</th>
                                                <th style={styles.th}>ช่วงเวลา</th>
                                                <th style={styles.th}>ค่าตอบแทน</th>
                                                <th style={{ ...styles.th, textAlign: 'right' }}>จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shifts.map((shift) => (
                                                <tr key={shift.id} style={styles.tr}>
                                                    <td style={styles.td}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{ ...styles.colorDot, background: shift.color_code }} />
                                                            <div>
                                                                <div style={styles.shiftName}>{shift.name}</div>
                                                                <div style={styles.shiftCode}>{shift.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={styles.timeLabel}>
                                                            <Clock size={12} />
                                                            {shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}
                                                        </div>
                                                        <div style={styles.hourLabel}>{shift.working_hours} ชม.</div>
                                                    </td>
                                                    <td style={styles.td}>
                                                        <div style={styles.allowanceText}>
                                                            ฿{shift.allowance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td style={{ ...styles.td, textAlign: 'right' }}>
                                                        <div style={styles.btnGroup}>
                                                            <button onClick={() => handleEdit(shift)} style={styles.editBtn} title="แก้ไข">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(shift.id)} style={styles.deleteBtn} title="ลบ">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {shifts.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} style={styles.emptyTd}>ยังไม่มีข้อมูลประเภทเวรในระบบ</td>
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
        </AppLayout>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '32px 40px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        minHeight: 'calc(100vh - 64px)',
        fontFamily: "'Inter', 'Sarabun', sans-serif"
    },
    headerSection: {
        marginBottom: '32px'
    },
    iconBox: {
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: '#fff',
        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4f46e5'
    },
    title: {
        fontSize: '28px',
        fontWeight: 800,
        color: '#0f172a',
        margin: 0,
        letterSpacing: '-0.02em'
    },
    subtitle: {
        fontSize: '15px',
        color: '#64748b',
        margin: '4px 0 0',
        fontWeight: 500
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '32px',
        alignItems: 'start'
    },
    formCard: {
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
    },
    tableCard: {
        background: '#fff',
        borderRadius: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
    },
    cardHeader: {
        padding: '24px 32px',
        borderBottom: '1px solid #f1f5f9',
        background: '#fff'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 700,
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
        marginBottom: '20px',
        flex: 1
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 600,
        color: '#475569',
        marginBottom: '8px'
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputIcon: {
        position: 'absolute',
        left: '14px',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center'
    },
    input: {
        width: '100%',
        padding: '12px 14px 12px 42px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '15px',
        color: '#0f172a',
        outline: 'none',
        transition: 'all 0.2s'
    },
    inputSimple: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '15px',
        color: '#0f172a',
        outline: 'none',
        transition: 'all 0.2s'
    },
    formRow: {
        display: 'flex',
        gap: '16px'
    },
    colorPickerWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: '#f8fafc',
        padding: '8px 12px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
    },
    colorPreview: {
        width: '24px',
        height: '24px',
        borderRadius: '6px',
        border: '1px solid rgba(0,0,0,0.1)'
    },
    colorInput: {
        width: '32px',
        height: '32px',
        border: 'none',
        padding: 0,
        background: 'transparent',
        cursor: 'pointer'
    },
    colorText: {
        fontSize: '13px',
        fontWeight: 700,
        color: '#64748b',
        fontFamily: 'monospace'
    },
    actionRow: {
        display: 'flex',
        gap: '12px',
        marginTop: '32px'
    },
    saveBtn: {
        flex: 1,
        padding: '14px',
        background: '#4f46e5',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
        transition: 'all 0.2s'
    },
    cancelBtn: {
        padding: '14px 20px',
        background: '#fff',
        color: '#64748b',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    },
    tableWrapper: {
        width: '100%',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse'
    },
    th: {
        padding: '16px 32px',
        textAlign: 'left',
        fontSize: '13px',
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: '#f8fafc',
        borderBottom: '1px solid #f1f5f9'
    },
    tr: {
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.2s'
    },
    td: {
        padding: '20px 32px',
        verticalAlign: 'middle'
    },
    colorDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        boxShadow: '0 0 0 4px rgba(0,0,0,0.03)'
    },
    shiftName: {
        fontSize: '15px',
        fontWeight: 700,
        color: '#0f172a'
    },
    shiftCode: {
        fontSize: '12px',
        color: '#64748b',
        fontWeight: 500,
        marginTop: '2px'
    },
    timeLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '14px',
        fontWeight: 600,
        color: '#334155'
    },
    hourLabel: {
        fontSize: '12px',
        color: '#94a3b8',
        marginTop: '4px'
    },
    allowanceText: {
        fontSize: '16px',
        fontWeight: 800,
        color: '#10b981'
    },
    btnGroup: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
    },
    editBtn: {
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        color: '#64748b',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    deleteBtn: {
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #fee2e2',
        background: '#fff',
        color: '#ef4444',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    loadingBox: {
        padding: '64px',
        textAlign: 'center',
        color: '#64748b'
    },
    spinner: {
        width: '32px',
        height: '32px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #4f46e5',
        borderRadius: '50%',
        margin: '0 auto 16px'
    },
    emptyTd: {
        padding: '64px',
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '15px'
    }
};
