import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const license_no = params.id;

    // Fetch all versions of this license based on license_no
    const query = `
      SELECT * FROM tbl_employee_licenses 
      WHERE license_no = ? 
      ORDER BY id DESC
    `;
    const [rows] = await pool.query(query, [license_no]);

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error fetching license history:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}
