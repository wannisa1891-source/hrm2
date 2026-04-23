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

    const payrollPromise = pool.query(
      `SELECT * FROM tbl_payroll WHERE emp_id = ? ORDER BY pay_year DESC, pay_month DESC LIMIT 12`,
      [emp_id]
    ).catch(err => {
      console.warn('Payroll table error:', err.message);
      return [[]]; // Return empty rows on error
    });

    const [
      empResult,
      leaveResult,
      payrollResult,
      trainingResult
    ] = await Promise.all([
      pool.query(
        `SELECT e.*, d.dept_name, p.pos_name 
         FROM tbl_employees e
         LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
         LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
         WHERE e.emp_id = ?`,
        [emp_id]
      ),
      pool.query(
        `SELECT * FROM tbl_leaves WHERE emp_id = ? ORDER BY start_date DESC LIMIT 10`,
        [emp_id]
      ),
      payrollPromise,
      pool.query(
        `SELECT * FROM tbl_employee_trainings WHERE emp_id = ? ORDER BY start_date DESC`,
        [emp_id]
      )
    ]);

    const empRows = empResult[0] as any[];
    
    let employee = null;
    if (empRows.length === 0) {
      return NextResponse.json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 });
    } else {
      employee = empRows[0];
    }
    const leaveRows = leaveResult[0] as any[];
    const payrollRows = payrollResult[0] as any[];
    const trainingRows = trainingResult[0] as any[];

    return NextResponse.json({
      success: true,
      data: {
        profile: employee,
        leaves: leaveRows,
        payroll: payrollRows,
        trainings: trainingRows
      }
    });

  } catch (error: any) {
    console.error('Profile API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { emp_id, phone, email, citizen_id, gender, quota_vacation, quota_sick, quota_personal, updater_role } = body;

    if (!emp_id) {
      return NextResponse.json({ error: 'Missing emp_id' }, { status: 400 });
    }

    if (updater_role === 'Admin' || updater_role === 'admin') {
      await pool.query(
        `UPDATE tbl_employees SET phone = ?, email = ?, citizen_id = ?, gender = ?, quota_vacation = ?, quota_sick = ?, quota_personal = ? WHERE emp_id = ?`,
        [phone, email, citizen_id, gender, quota_vacation, quota_sick, quota_personal, emp_id]
      );
    } else {
      await pool.query(
        `UPDATE tbl_employees SET phone = ?, email = ?, citizen_id = ?, gender = ? WHERE emp_id = ?`,
        [phone, email, citizen_id, gender, emp_id]
      );
    }

    return NextResponse.json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (error: any) {
    console.error('Profile Update API Error:', error);
    return NextResponse.json({ error: error.message || 'Error updating profile' }, { status: 500 });
  }
}
