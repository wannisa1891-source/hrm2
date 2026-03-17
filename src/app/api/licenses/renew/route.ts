import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function POST(req: NextRequest) {
  try {
    const { license_id, emp_id, expire_date, license_no } = await req.json();

    if (!expire_date) {
      return NextResponse.json({ error: 'Expiration date is required' }, { status: 400 });
    }

    if (license_id) {
      // Update existing license
      const query = `
        UPDATE tbl_licenses 
        SET expire_date = ?, license_no = COALESCE(?, license_no)
        WHERE license_id = ?
      `;
      await pool.query(query, [expire_date, license_no || null, license_id]);
      return NextResponse.json({ message: 'License renewed successfully' });
    } else if (emp_id) {
      // Create new license entry if they only existed in tbl_employees
      const query = `
        INSERT INTO tbl_licenses (emp_id, license_no, expire_date)
        VALUES (?, ?, ?)
      `;
      await pool.query(query, [emp_id, license_no || null, expire_date]);
      return NextResponse.json({ message: 'License created and renewed successfully' });
    } else {
      return NextResponse.json({ error: 'Either license_id or emp_id is required' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Error renewing license:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}
