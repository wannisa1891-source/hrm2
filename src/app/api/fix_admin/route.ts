import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';

export async function GET() {
  try {
    const password = 'admin';
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Check if admin exists in tbl_employees
    const [rows]: any = await pool.query("SELECT * FROM tbl_employees WHERE username = 'admin' OR emp_id = 'admin'");
    
    if (rows.length === 0) {
      await pool.query(
        "INSERT INTO tbl_employees (emp_id, username, password, first_name_th, last_name_th, role, status, dept_id, pos_id, citizen_id) VALUES ('admin', 'admin', ?, 'System', 'Admin', 'Admin', 'Active', 'ADM-FIN', 'P001', 'ADMIN-ID')",
        [hash]
      );
      return NextResponse.json({ message: 'Admin user created successfully in tbl_employees.' });
    } else {
      await pool.query(
        "UPDATE tbl_employees SET password = ?, role = 'Admin', status = 'Active', username = 'admin' WHERE emp_id = ? OR username = 'admin'",
        [hash, rows[0].emp_id]
      );
      return NextResponse.json({ message: 'Admin user updated successfully in tbl_employees.' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
