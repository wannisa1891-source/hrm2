import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [result] = await pool.query(
      "UPDATE tbl_employees SET dept_id = 'D002' WHERE pos_id = 'P001' AND dept_id = 'D001'"
    );
    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message, originalError: err }, { status: 200 });
  }
}
