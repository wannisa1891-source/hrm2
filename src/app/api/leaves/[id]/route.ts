import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    await pool.query('UPDATE tbl_leaves SET status = ? WHERE leave_id = ?', [status, params.id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
