import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');
    const emp_id = url.searchParams.get('emp_id');

    let query = `
      SELECT p.*, e.prefix, e.first_name_th, e.last_name_th, e.image, pos.pos_name, d.dept_name
      FROM tbl_payroll p
      JOIN tbl_employees e ON p.emp_id = e.emp_id
      LEFT JOIN tbl_positions pos ON e.pos_id = pos.pos_id
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (month && year) {
      query += ` AND p.pay_month = ? AND p.pay_year = ?`;
      params.push(parseInt(month), parseInt(year));
    }
    
    if (emp_id) {
      query += ` AND p.emp_id = ?`;
      params.push(emp_id);
    }
    
    query += ` ORDER BY p.emp_id ASC`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
     const { payroll_id, status, payment_date } = await req.json();
     if (!payroll_id) {
       return NextResponse.json({ error: 'Missing payroll_id' }, { status: 400 });
     }
     
     const params: any[] = [status || 'Draft'];
     let setClause = `status = ?`;
     
     if (payment_date !== undefined) {
         setClause += `, payment_date = ?`;
         params.push(payment_date ? payment_date : null);
     }
     
     params.push(payroll_id);

     await pool.query(`UPDATE tbl_payroll SET ${setClause} WHERE payroll_id = ?`, params);
     return NextResponse.json({ message: 'Update successful' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
