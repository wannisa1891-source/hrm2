import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [users]: any = await pool.query('DESCRIBE tbl_employees');
    return NextResponse.json({ tbl_employees: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
