import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const query = `
      SELECT 
        e.emp_id, 
        e.prefix, 
        e.first_name_th, 
        e.last_name_th, 
        e.license_name, 
        e.license_type, 
        e.license_issue_date,
        l.license_id,
        l.license_no,
        l.expire_date
      FROM tbl_employees e
      LEFT JOIN tbl_licenses l ON e.emp_id = l.emp_id
      WHERE e.license_name IS NOT NULL AND e.license_name != ''
      ORDER BY l.expire_date ASC
    `;
    
    const [rows]: any = await pool.query(query);

    // Calculate days left for each license
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const licenses = rows.map((row: any) => {
      let daysLeft = null;
      if (row.expire_date) {
        const expireDate = new Date(row.expire_date);
        expireDate.setHours(0, 0, 0, 0);
        const diffTime = expireDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: row.license_id ? `L${row.license_id}` : `EMP-${row.emp_id}`, // unique identifier for the list
        license_id: row.license_id,
        emp_id: row.emp_id,
        name: `${row.prefix || ''}${row.first_name_th || ''} ${row.last_name_th || ''}`.trim() || 'ไม่ระบุชื่อ',
        type: row.license_name || row.license_type || 'ใบประกอบวิชาชีพ',
        license_no: row.license_no,
        issued: row.license_issue_date ? new Date(row.license_issue_date).toLocaleDateString('en-CA') : '-', // YYYY-MM-DD format
        expires: row.expire_date ? new Date(row.expire_date).toLocaleDateString('en-CA') : '-',
        daysLeft: daysLeft ?? 9999 // If no expiration date, treat as safe/infinite
      };
    });

    return NextResponse.json(licenses);
  } catch (err: any) {
    console.error('Error fetching licenses:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
