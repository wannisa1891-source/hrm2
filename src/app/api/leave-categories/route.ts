import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_leave_categories');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('🔥 FETCH LEAVE CATEGORIES ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
