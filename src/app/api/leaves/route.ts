import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

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
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
