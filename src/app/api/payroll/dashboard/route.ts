import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const month = url.searchParams.get('month');
    const year = url.searchParams.get('year');

    // If month/year not provided, get the latest month
    let targetMonth = month ? Number(month) : null;
    let targetYear = year ? Number(year) : null;

    if (!targetMonth || !targetYear) {
      const [latest] = await pool.query(`SELECT pay_month, pay_year FROM tbl_payroll ORDER BY pay_year DESC, pay_month DESC LIMIT 1`);
      if ((latest as any[]).length > 0) {
        targetMonth = (latest as any[])[0].pay_month;
        targetYear = (latest as any[])[0].pay_year;
      } else {
        const d = new Date();
        targetMonth = d.getMonth() + 1;
        targetYear = d.getFullYear();
      }
    }

    // Fetch Base Employees
    const [employeesResult] = await pool.query(`
      SELECT 
        p.payroll_id, p.emp_id, p.base_salary, p.net_salary, p.status, p.total_allowance, p.total_deduction,
        e.prefix, e.first_name_th, e.last_name_th, e.image,
        COALESCE(d.dept_name, 'ไม่มีแผนก') as dept_name
      FROM tbl_payroll p
      JOIN tbl_employees e ON p.emp_id = e.emp_id
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
      WHERE p.pay_month = ? AND p.pay_year = ?
      ORDER BY p.net_salary DESC
    `, [targetMonth, targetYear]);

    // Fetch Allowances for the target month
    const [allowancesData] = await pool.query(`
      SELECT 
        pa.payroll_id, pa.amount, t.type_name
      FROM tbl_payroll_allowances pa
      JOIN tbl_payroll p ON pa.payroll_id = p.payroll_id
      JOIN tbl_allowance_types t ON pa.allowance_type_id = t.id
      WHERE p.pay_month = ? AND p.pay_year = ?
    `, [targetMonth, targetYear]);

    // Group allowances by payroll_id to determine OT and Night Shift
    const allowanceMap: Record<string, { ot: number, night: number, breakdown: Record<string, number> }> = {};
    (allowancesData as any[]).forEach(a => {
      const pid = a.payroll_id;
      if (!allowanceMap[pid]) {
        allowanceMap[pid] = { ot: 0, night: 0, breakdown: {} };
      }
      
      const name = a.type_name.toLowerCase();
      const amt = Number(a.amount);
      
      if (!allowanceMap[pid].breakdown[a.type_name]) allowanceMap[pid].breakdown[a.type_name] = 0;
      allowanceMap[pid].breakdown[a.type_name] += amt;

      if (name.includes('ot') || name.includes('ล่วงเวลา') || name.includes('overtime')) {
        allowanceMap[pid].ot += amt;
      } else if (name.includes('ดึก') || name.includes('night') || name.includes('เวร')) {
        allowanceMap[pid].night += amt;
      } else {
        allowanceMap[pid].ot += amt; // Default to OT for demo if it's some other generic allowance
      }
    });

    // Attach allowances to employees
    const employees = (employeesResult as any[]).map(emp => {
      const al = allowanceMap[emp.payroll_id] || { ot: 0, night: 0, breakdown: {} };
      return {
        ...emp,
        ot_amount: al.ot,
        night_shift_amount: al.night,
        allowances_breakdown: al.breakdown
      };
    });

    return NextResponse.json({
      targetMonth,
      targetYear,
      employees
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
