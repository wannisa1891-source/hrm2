import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'expiring', 'expired', 'normal'

    let query = `
      SELECT 
        e.emp_id, 
        e.prefix, 
        e.first_name_th, 
        e.last_name_th, 
        e.license_name, 
        e.license_type, 
        e.license_issue_date,
        l.license_id,
        l.license_no AS record_license_no,
        e.license_no AS emp_license_no,
        l.expire_date AS record_expire_date,
        e.license_expire AS emp_expire_date,
        l.cneu_cme_points
      FROM tbl_employees e
      LEFT JOIN tbl_licenses l ON e.emp_id = l.emp_id
      WHERE (e.license_name IS NOT NULL AND e.license_name != '')
         OR (l.license_id IS NOT NULL)
    `;

    const queryParams: any[] = [];

    if (search) {
      query += ` AND (e.first_name_th LIKE ? OR e.last_name_th LIKE ? OR e.emp_id LIKE ? OR e.license_no LIKE ? OR l.license_no LIKE ?)`;
      const searchVal = `%${search}%`;
      queryParams.push(searchVal, searchVal, searchVal, searchVal, searchVal);
    }

    query += ` ORDER BY COALESCE(l.expire_date, e.license_expire) ASC`;
    
    const [rows]: any = await pool.query(query, queryParams);

    // Calculate days left for each license
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let licenses = rows.map((row: any) => {
      const expireDateVal = row.record_expire_date || row.emp_expire_date;
      let daysLeft = null;
      if (expireDateVal) {
        const expireDate = new Date(expireDateVal);
        expireDate.setHours(0, 0, 0, 0);
        const diffTime = expireDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: row.license_id ? `L${row.license_id}` : `EMP-${row.emp_id}`,
        license_id: row.license_id,
        emp_id: row.emp_id,
        name: `${row.prefix || ''}${row.first_name_th || ''} ${row.last_name_th || ''}`.trim() || 'ไม่ระบุชื่อ',
        type: row.license_name || row.license_type || 'ใบประกอบวิชาชีพ',
        license_no: row.record_license_no || row.emp_license_no,
        issued: row.license_issue_date ? new Date(row.license_issue_date).toLocaleDateString('en-CA') : '-',
        expires: expireDateVal ? new Date(expireDateVal).toLocaleDateString('en-CA') : '-',
        daysLeft: daysLeft ?? 9999,
        points: row.cneu_cme_points || 0
      };
    });

    if (status === 'expiring') {
      licenses = licenses.filter((l: any) => l.daysLeft >= 0 && l.daysLeft <= 90);
    } else if (status === 'expired') {
      licenses = licenses.filter((l: any) => l.daysLeft < 0);
    } else if (status === 'normal') {
      licenses = licenses.filter((l: any) => l.daysLeft > 90);
    }

    return NextResponse.json(licenses);
  } catch (err: any) {
    console.error('Error fetching licenses:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
