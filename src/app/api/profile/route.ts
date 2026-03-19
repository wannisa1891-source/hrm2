import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emp_id = searchParams.get('emp_id');

    if (!emp_id) {
      return NextResponse.json({ error: 'Missing emp_id' }, { status: 400 });
    }

    // 1. Fetch Employee Details
    const [empRows]: any = await pool.query(
      `SELECT e.*, d.dept_name, p.pos_name 
       FROM tbl_employees e
       LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
       LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
       WHERE e.emp_id = ?`,
      [emp_id]
    );

    if (empRows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = empRows[0];

    // 2. Fetch Leave History
    const [leaveRows]: any = await pool.query(
      `SELECT * FROM tbl_leaves WHERE emp_id = ? ORDER BY start_date DESC LIMIT 10`,
      [emp_id]
    );

    // 3. Fetch Payroll History
    const [payrollRows]: any = await pool.query(
      `SELECT * FROM tbl_payroll WHERE emp_id = ? ORDER BY pay_year DESC, pay_month DESC LIMIT 12`,
      [emp_id]
    );

    return NextResponse.json({
      success: true,
      data: {
        profile: employee,
        leaves: leaveRows,
        payroll: payrollRows
      }
    });

  } catch (error: any) {
    console.error('Profile API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
