import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

const shiftMap: Record<string, number> = {
    'Morning': 1,
    'Afternoon': 2,
    'Night': 3
};

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

    const shift_type_id = shiftMap[shift] || 1;

    await pool.query(
      'UPDATE tbl_schedules SET emp_id=?, shift_type_id=?, role=?, notes=? WHERE id=?',
      [nurseName.trim(), shift_type_id, department, note || '', id]
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
