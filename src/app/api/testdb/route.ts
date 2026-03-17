import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const [empsWithLicenses] = await pool.query('SELECT emp_id, prefix, first_name_th, last_name_th, license_name, license_type, license_issue_date FROM tbl_employees WHERE license_name IS NOT NULL AND license_name != "" LIMIT 5');
    const [licensesTableRows] = await pool.query('SELECT * FROM tbl_licenses LIMIT 5');

    return NextResponse.json({ 
      empsWithLicenses,
      licensesTableRows
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
