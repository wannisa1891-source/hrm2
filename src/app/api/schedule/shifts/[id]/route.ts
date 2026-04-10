import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

// PUT /api/schedule/shifts/[id] - Update a shift type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    const { code, name, start_time, end_time, working_hours, allowance, color_code } = body;

    if (!code || !name || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query(
      `UPDATE tbl_shift_types 
       SET code = ?, name = ?, start_time = ?, end_time = ?, working_hours = ?, allowance = ?, color_code = ?
       WHERE id = ?`,
      [code, name, start_time, end_time, working_hours, allowance, color_code, id]
    );

    return NextResponse.json({ message: 'Shift type updated successfully' });
  } catch (error) {
    console.error('Error updating shift type:', error);
    return NextResponse.json({ error: 'Failed to update shift type' }, { status: 500 });
  }
}

// DELETE /api/schedule/shifts/[id] - Delete a shift type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Check if shift is in use (optional but recommended)
    // For now, we'll just delete it
    await pool.query('DELETE FROM tbl_shift_types WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Shift type deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift type:', error);
    return NextResponse.json({ error: 'Failed to delete shift type' }, { status: 500 });
  }
}
