import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const empId = searchParams.get('emp_id') || '';
    const status = searchParams.get('status') || ''; // 'expiring', 'expired', 'normal'

    let query = `
      SELECT 
        e.emp_id, 
        e.prefix, 
        e.first_name_th, 
        e.last_name_th, 
        e.image,
        e.gender,
        e.cneu_cme_points,
        l.id as license_id,
        l.license_name,
        l.license_type,
        l.license_no,
        l.institution,
        l.issue_date,
        l.expire_date,
        l.status as license_status,
        l.file_path,
        l.verified_status,
        l.points,
        l.remarks,
        l.warning_days_override
      FROM tbl_employees e
      JOIN tbl_employee_licenses l ON e.emp_id = l.emp_id
      WHERE l.id IN (SELECT MAX(id) FROM tbl_employee_licenses GROUP BY emp_id, license_name)
    `;

    const queryParams: any[] = [];

    if (empId) {
      query += ` AND l.emp_id = ?`;
      queryParams.push(empId);
    }


    if (search) {
      query += ` AND (e.first_name_th LIKE ? OR e.last_name_th LIKE ? OR e.emp_id LIKE ? OR l.license_no LIKE ? OR l.license_name LIKE ?)`;
      const searchVal = `%${search}%`;
      queryParams.push(searchVal, searchVal, searchVal, searchVal, searchVal);
    }

    query += ` ORDER BY l.id DESC`;
    
    const [rows]: any = await pool.query(query, queryParams);

    // Calculate days left for each license
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let licenses = rows.map((row: any) => {
      let daysLeft = null;
      if (row.expire_date) {
        const expireDate = new Date(row.expire_date);
        expireDate.setHours(0, 0, 0, 0);
        const diffTime = expireDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: `L${row.license_id}`, // UI uses this as unique key
        license_id: row.license_id,
        emp_id: row.emp_id,
        name: `${row.prefix || ''}${row.first_name_th || ''} ${row.last_name_th || ''}`.trim() || 'ไม่ระบุชื่อ',
        image: row.image || null,
        gender: row.gender || 'ไม่ระบุ',
        type: row.license_name || row.license_type || 'ใบประกอบวิชาชีพ',
        license_no: row.license_no,
        issued: row.issue_date ? new Date(row.issue_date).toLocaleDateString('en-CA') : '-',
        expires: row.expire_date ? new Date(row.expire_date).toLocaleDateString('en-CA') : '-',
        daysLeft: daysLeft ?? 9999,
        points: row.points || row.cneu_cme_points || 0,
        status: row.license_status || 'Active',
        verified_status: row.verified_status || 'Pending',
        license_name: row.license_name || '',
        license_type: row.license_type || '',
        institution: row.institution || '',
        issue_date: row.issue_date ? new Date(row.issue_date).toLocaleDateString('en-CA') : '',
        file_path: row.file_path || null
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
