import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `SELECT l.*, 
        e.first_name_th, e.last_name_th, e.photo,
        e.quota_personal, e.quota_vacation, e.quota_sick,
        d.dept_name 
      FROM tbl_leaves l 
      LEFT JOIN tbl_employees e ON l.emp_id = e.emp_id 
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id 
      ORDER BY l.start_date DESC`;
    const [rows] = await pool.query(sql);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { emp_id, leave_type_id, start_date, end_date, reason } = await req.json();
    const leave_id = 'L' + Date.now().toString().slice(-4);
    await pool.query(
      "INSERT INTO tbl_leaves (leave_id, emp_id, leave_type_id, start_date, end_date, reason, status) VALUES (?,?,?,?,?,?,'Pending')",
      [leave_id, emp_id, leave_type_id, start_date, end_date, reason]
    );

    // Notify Admins
    await pool.query(
      "INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)",
      ['admin', 'ยื่นขอลาใหม่', `พนักงานรหัส ${emp_id} ได้ยื่นขอลาตั้งแต่วันที่ ${start_date} ถึง ${end_date}`]
    );

    await logAudit(req.headers.get('x-user-id'), `ยื่นขอลาพักผ่อน/หยุดงาน: พนักงาน ${emp_id} รหัสการลา ${leave_id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'บัญชีนี้ยังไม่ได้ผูกกับประวัติพนักงานในระบบ (HR) จึงไม่สามารถยื่นใบลาได้' },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
