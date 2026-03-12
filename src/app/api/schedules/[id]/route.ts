import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrn_db';

// PUT /api/schedules/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { nurseName, shift, department, note } = await req.json();
    const { id } = params;

    if (!nurseName || !shift || !department) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
    }

    await pool.query(
      'UPDATE tbl_schedules SET nurse_name=?, shift=?, department=?, note=? WHERE id=?',
      [nurseName.trim(), shift, department, note || '', id]
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/schedules/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await pool.query('DELETE FROM tbl_schedules WHERE id=?', [id]);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
