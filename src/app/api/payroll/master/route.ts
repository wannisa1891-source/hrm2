import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [allowances] = await pool.query(`SELECT * FROM tbl_allowance_types`);
    const [deductions] = await pool.query(`SELECT * FROM tbl_deduction_types`);
    return NextResponse.json({ allowances, deductions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
