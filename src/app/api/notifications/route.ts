import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(request: Request) {
  try {
    // Auto-setup DB tables if not exist to prevent 500 errors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try {
      await pool.query("ALTER TABLE tbl_transfers ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'");
    } catch(e) {}

    const { searchParams } = new URL(request.url);
    const empId = searchParams.get('emp_id');

    let query = 'SELECT * FROM tbl_notifications ORDER BY created_at DESC LIMIT 50';
    let params: any[] = [];
    if (empId) {
      query = 'SELECT * FROM tbl_notifications WHERE emp_id = ? ORDER BY created_at DESC LIMIT 50';
      params = [empId];
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
    const { emp_id, title, message } = await request.json();
    await pool.query(
      'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
      [emp_id || 'system', title, message]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
