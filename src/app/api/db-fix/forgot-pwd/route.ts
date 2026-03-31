import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    // 1. Add reset_token_hash (ใช้สำหรับเก็บ Hash ของ Token)
    await pool.query(
      `ALTER TABLE tbl_employees ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255) DEFAULT NULL;`
    );

    // 2. Add reset_token_expiry (ใช้สำหรับเก็บเวลาหมดอายุของ Token เป็นชนิด DATETIME)
    await pool.query(
      `ALTER TABLE tbl_employees ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME DEFAULT NULL;`
    );

    return NextResponse.json({ success: true, message: 'Updated tbl_employees schema successfully' });
  } catch (error: any) {
    console.error('DB Update Error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update schema', error: error.message }, { status: 500 });
  }
}
