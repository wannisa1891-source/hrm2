import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [users] = await pool.query('SELECT emp_id, username, role FROM tbl_employees LIMIT 10');
    const [emps] = await pool.query('SELECT emp_id, first_name_th FROM tbl_employees LIMIT 10');
    return NextResponse.json({ users, emps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
