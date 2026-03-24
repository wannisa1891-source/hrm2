import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';

export async function GET() {
  try {
    const password = 'admin';
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Check if admin exists in tbl_users
    const [rows]: any = await pool.query("SELECT * FROM tbl_users WHERE username = 'admin'");
    
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO tbl_users (username, password_hash, role, status) VALUES ('admin', ?, 'Admin', 'Active')",
        [hash]
      );
      return NextResponse.json({ message: 'Admin user created successfully.' });
    } else {
      await pool.query(
        "UPDATE tbl_users SET password_hash = ?, role = 'Admin', status = 'Active' WHERE username = 'admin'",
        [hash]
      );
      return NextResponse.json({ message: 'Admin user updated successfully.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
