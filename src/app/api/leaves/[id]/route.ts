import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();

    // Fetch emp_id first to notify
    const [leaveRows]: any = await pool.query('SELECT emp_id FROM tbl_leaves WHERE leave_id = ?', [params.id]);
    const emp_id = leaveRows[0]?.emp_id;

    await pool.query('UPDATE tbl_leaves SET status = ? WHERE leave_id = ?', [status, params.id]);

    if (emp_id) {
       const title = status === 'Approved' ? 'ใบลาของคุณได้รับอนุมัติแล้ว' : 'ใบลาของคุณไม่ได้รับอนุมัติ';
       const message = `คำขอลาที่รหัส ${params.id} ได้เปลี่ยนสถานะเป็น ${status === 'Approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}`;
       
       await pool.query(
         'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
         [emp_id, title, message]
       );
    }

    await logAudit(req.headers.get('x-user-id'), `อัปเดตสถานะการลา รหัส ${params.id} เป็น ${status}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
