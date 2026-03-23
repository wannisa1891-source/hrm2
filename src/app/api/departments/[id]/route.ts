import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const dept_id = params.id;
    const body = await req.json();
    const { dept_name, description, head_emp_id, phone, org_chart_url, sop_url, rules_url } = body;

    if (!dept_name) {
      return NextResponse.json({ error: 'Missing department name' }, { status: 400 });
    }

    const [result] = await pool.query(
      'UPDATE tbl_departments SET dept_name = ?, description = ?, head_emp_id = ?, phone = ?, org_chart_url = ?, sop_url = ?, rules_url = ? WHERE dept_id = ?',
      [dept_name, description || null, head_emp_id || null, phone || null, org_chart_url || null, sop_url || null, rules_url || null, dept_id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Department updated successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const dept_id = params.id;

    // Optional: Check if there are employees in this department before deleting. For now, just delete.
    const [result] = await pool.query(
      'DELETE FROM tbl_departments WHERE dept_id = ?',
      [dept_id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    // Handle foreign key constraint errors
    if (message.includes('foreign key constraint fails') || message.includes('ER_ROW_IS_REFERENCED_2')) {
       return NextResponse.json({ error: 'ไม่สามารถลบแผนกได้ เนื่องจากยังมีข้อมูลพนักงานอ้างอิงถึงแผนกนี้อยู่' }, { status: 400 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
