import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('emp_id');
    const isAdmin = searchParams.get('is_admin') === 'true';

    let query = 'SELECT * FROM tbl_notifications ORDER BY created_at DESC LIMIT 50';
    let params: any[] = [];
    if (empId) {
      if (isAdmin) {
        query = "SELECT * FROM tbl_notifications WHERE emp_id = ? OR emp_id = 'admin' ORDER BY created_at DESC LIMIT 50";
        params = [empId];
      } else {
        query = 'SELECT * FROM tbl_notifications WHERE emp_id = ? ORDER BY created_at DESC LIMIT 50';
        params = [empId];
      }
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, is_read } = await request.json();
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await pool.query('UPDATE tbl_notifications SET is_read = ? WHERE id = ?', [is_read ? 1 : 0, id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { emp_id, title, message, metadata } = await request.json();
    await pool.query(
      'INSERT INTO tbl_notifications (emp_id, title, message, metadata) VALUES (?, ?, ?, ?)',
      [emp_id || 'system', title, message, metadata ? JSON.stringify(metadata) : null]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
