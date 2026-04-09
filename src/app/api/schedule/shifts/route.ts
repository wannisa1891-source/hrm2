import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

// GET all shift types
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_shift_types ORDER BY id ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching shift types:', error);
    return NextResponse.json({ error: 'Failed to fetch shift types' }, { status: 500 });
  }
}

// POST create a new shift type
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, start_time, end_time, working_hours, allowance, color_code } = body;

    if (!code || !name || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [result] = await pool.query(
      `INSERT INTO tbl_shift_types (code, name, start_time, end_time, working_hours, allowance, color_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, name, start_time, end_time, working_hours || 8, allowance || 0, color_code || '#000000']
    );

    return NextResponse.json({ message: 'Shift type created successfully', id: (result as any).insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift type:', error);
    return NextResponse.json({ error: 'Failed to create shift type' }, { status: 500 });
  }
}

// PUT update an existing shift type
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, code, name, start_time, end_time, working_hours, allowance, color_code } = body;

    if (!id || !code || !name || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query(
      `UPDATE tbl_shift_types SET code = ?, name = ?, start_time = ?, end_time = ?, working_hours = ?, allowance = ?, color_code = ?
       WHERE id = ?`,
      [code, name, start_time, end_time, working_hours, allowance, color_code, id]
    );

    return NextResponse.json({ message: 'Shift type updated successfully' });
  } catch (error) {
    console.error('Error updating shift type:', error);
    return NextResponse.json({ error: 'Failed to update shift type' }, { status: 500 });
  }
}

// DELETE a shift type
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM tbl_shift_types WHERE id = ?', [id]);

    return NextResponse.json({ message: 'Shift type deleted successfully' });
  } catch (error) {
    console.error('Error deleting shift type:', error);
    return NextResponse.json({ error: 'Failed to delete shift type' }, { status: 500 });
  }
}
