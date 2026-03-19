import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    await pool.query('UPDATE tbl_leaves SET status = ? WHERE leave_id = ?', [status, params.id]);
    await logAudit(req.headers.get('x-user-id'), `อัปเดตสถานะการลา รหัส ${params.id} เป็น ${status}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
