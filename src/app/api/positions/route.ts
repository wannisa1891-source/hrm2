import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_positions');
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
