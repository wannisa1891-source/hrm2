import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        pay_month, 
        pay_year, 
        COUNT(emp_id) as total_employees,
        SUM(net_salary) as total_net_salary,
        SUM(total_allowance) as total_allowances,
        SUM(total_deduction) as total_deductions,
        SUM(base_salary) as total_base_salary
      FROM tbl_payroll
      GROUP BY pay_month, pay_year
      ORDER BY pay_year DESC, pay_month DESC
    `);
    
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
