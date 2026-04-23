import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_leave_types ORDER BY leave_type_id ASC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('🔥 FETCH LEAVE TYPES ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
