import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    // 1. Add status column to tbl_transfers
    try {
      await pool.query("ALTER TABLE tbl_transfers ADD COLUMN status VARCHAR(50) DEFAULT 'Pending'");
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
    }

    // 2. Create tbl_notifications
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

    return NextResponse.json({ success: true, message: 'DB setup complete' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
