'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Swal from 'sweetalert2';

interface ShiftRequest {
    id: number;
    requester_id: string;
    request_type: 'Swap' | 'Leave';
    request_date: string;
    target_shift_id?: number;
    swap_with_emp_id?: string;
    target_swap_shift_id?: number;
    status: 'Pending' | 'Accepted' | 'Approved' | 'Rejected';
    reason: string;
    created_at: string;
}

export default function RequestsPage() {
    const [requests, setRequests] = useState<ShiftRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const MOCK_CURRENT_USER = "EMP001";

    useEffect(() => {
        fetchRequests();
    }, []);

    // ฟังก์ชันสำหรับเช็คว่าวันที่ "ผ่านไปแล้วหรือยัง"
    const isPastDate = (dateString: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเพื่อเทียบแค่วันที่
        const targetDate = new Date(dateString);
        return targetDate < today;
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/schedule/requests');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: number, action: 'Approved' | 'Rejected', requestDate: string) => {
        // --- FIXED: ป้องกันการจัดการย้อนหลัง ---
        if (isPastDate(requestDate)) {
            Swal.fire({
                title: 'ไม่สามารถทำรายการได้',
                text: 'วันที่ของคำขอนี้ผ่านไปแล้ว ไม่สามารถแก้ไขสถานะย้อนหลังได้',
                icon: 'error',
                confirmButtonColor: '#64748b'
            });
            return;
        }

        const actionText = action === 'Approved' ? 'อนุมัติ' : 'ปฏิเสธ';
        const result = await Swal.fire({
            title: `ยืนยันการ${actionText}`,
            text: `ยืนยันการ${actionText}คำขอนี้?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: action === 'Approved' ? '#10b981' : '#ef4444'
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch('/api/schedule/requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: action, approver_id: MOCK_CURRENT_USER })
            });

            if (!res.ok) throw new Error('Failed to update request');

            Swal.fire({
                title: 'สำเร็จ',
                text: `ทำการ${actionText}เรียบร้อยแล้ว`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            fetchRequests();
        } catch (err: any) {
            Swal.fire('ข้อผิดพลาด', err.message, 'error');
        }
    };

    return (
        <AppLayout>
            <div className="p-6 md:p-8 max-w-[1280px] w-full mx-auto min-h-screen">
                <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
                    <div className="text-gray-600 bg-gray-100 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Staff Requests</h1>
                        <p className="text-sm text-gray-500 font-medium">จัดการคำขออนุมัติแลกเวรและการขอหยุดพัก</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                            <h3 className="text-sm font-semibold text-gray-800">รายการคำขอทั้งหมด</h3>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                            <p className="mt-4 text-gray-400 text-sm italic">กำลังดึงข้อมูลคำขอ...</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {requests.map(req => {
                                const expired = isPastDate(req.request_date);
                                return (
                                    <div key={req.id} className={`p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-4 md:items-center justify-between ${expired && req.status === 'Pending' ? 'opacity-70 bg-gray-50/50' : ''}`}>
                                        <div className="flex gap-4 items-start">
                                            <div className={`mt-1 flex items-center justify-center shrink-0 w-10 h-10 rounded-lg border ${req.request_type === 'Swap' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                {req.request_type === 'Swap' ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900 text-sm">{req.requester_id}</span>
                                                    <span className="text-gray-500 text-xs">ขอ{req.request_type === 'Swap' ? 'แลกเวรกับ' : 'ลาหยุด'}</span>
                                                    {req.request_type === 'Swap' && <span className="font-bold text-indigo-600 text-sm">{req.swap_with_emp_id}</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                    สำหรับวันที่: <span className={`font-semibold ${expired ? 'text-red-500' : 'text-gray-700'}`}>{new Date(req.request_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                                    {expired && req.status === 'Pending' && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Expired</span>}
                                                </div>
                                                {req.reason && (
                                                    <div className="bg-gray-100 rounded-md px-3 py-1.5 text-[12px] text-gray-600 border-l-2 border-gray-300">
                                                        "{req.reason}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:items-end gap-3 shrink-0">
                                            <div className={`px-3 py-1 text-xs font-bold rounded-full border w-fit ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {req.status === 'Pending' ? '⏳ รออนุมัติ' : req.status === 'Approved' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธแล้ว'}
                                            </div>

                                            {req.status === 'Pending' && (
                                                <div className="flex gap-2">
                                                    {/* ถ้าเป็นอดีต จะกดปุ่มไม่ได้และแสดงข้อความแทน */}
                                                    {!expired ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction(req.id, 'Approved', req.request_date)}
                                                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95"
                                                            >
                                                                อนุมัติ
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction(req.id, 'Rejected', req.request_date)}
                                                                className="px-4 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-all"
                                                            >
                                                                ปฏิเสธ
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[11px] text-red-400 font-medium italic bg-red-50 px-3 py-1 rounded-md border border-red-100">
                                                            เกินกำหนดจัดการย้อนหลัง
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {requests.length === 0 && (
                                <div className="py-20 text-center">
                                    <p className="text-gray-400 text-sm">ยังไม่มีคำขอรอการตรวจสอบในขณะนี้</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}