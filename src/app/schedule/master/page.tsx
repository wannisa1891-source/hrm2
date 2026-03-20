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
                        </div>
                    </div>
                </div>

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
                                </div>
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="block text-sm font-semibold text-gray-700 mb-1 md:hidden">สีและบันทึก</label>
                                <div className="flex gap-3">
                                    <div className="shrink-0 relative overflow-hidden h-[42px] w-[50px] rounded-lg border border-gray-300 shadow-sm">
                                        <input type="color" value={form.color_code} onChange={e => setForm({...form, color_code: e.target.value})} className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" title="เลือกสีประจำเวร" />
                                    </div>
                                    <button onClick={handleSave} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
                                        บันทึก
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

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
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
