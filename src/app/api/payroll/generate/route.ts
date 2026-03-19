import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function POST(req: NextRequest) {
  let connection;
  try {
    const { pay_month, pay_year } = await req.json();

    if (!pay_month || !pay_year) {
      return NextResponse.json({ error: 'Missing pay_month or pay_year' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if already generated
    const [existing] = await connection.query(`
      SELECT COUNT(*) as count FROM tbl_payroll WHERE pay_month = ? AND pay_year = ?
    `, [pay_month, pay_year]);

    if ((existing as any[])[0].count > 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ error: 'รอบเงินเดือนนี้ถูกสร้างไปแล้ว' }, { status: 400 });
    }

    // Get Deduction Types
    const [deducTypes] = await connection.query(`SELECT id, type_name FROM tbl_deduction_types`);
    let ssfTypeId = (deducTypes as any[]).find(t => t.type_name.includes('ประกันสังคม'))?.id;
    let taxTypeId = (deducTypes as any[]).find(t => t.type_name.includes('ภาษี'))?.id;

    // Insert if missing
    if (!ssfTypeId) {
      const [res] = await connection.query(`INSERT INTO tbl_deduction_types (type_name) VALUES ('ประกันสังคม (5%)')`);
      ssfTypeId = (res as any).insertId;
    }
    if (!taxTypeId) {
      const [res] = await connection.query(`INSERT INTO tbl_deduction_types (type_name) VALUES ('ภาษี หัก ณ ที่จ่าย')`);
      taxTypeId = (res as any).insertId;
    }

    // Fetch active employees
    const [employees] = await connection.query(`
      SELECT emp_id, base_salary, citizen_id FROM tbl_employees WHERE status = 'Active'
    `);

    if ((employees as any[]).length === 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ error: 'ไม่พบพนักงานที่สถานะ Active' }, { status: 400 });
    }

    // Insert payroll records with Auto Calculation
    for (const emp of employees as any[]) {
      const baseSalary = Number(emp.base_salary || 0);
      const payroll_id = `PR-${pay_year}${String(pay_month).padStart(2, '0')}-${emp.emp_id}`;
      
      let ssfAmount = 0;
      let taxAmount = 0;

      // 1. SSF (ประกันสังคม 5% max 750)
      if (baseSalary >= 1650) {
        ssfAmount = Math.min(750, Math.floor(baseSalary * 0.05));
      }
      
      // 2. Simple Tax (ภาษีหัก ณ ที่จ่าย 3% เบื้องต้นถ้าฐานเงินเดือนถึงเกณฑ์)
      if (baseSalary >= 26000) {
        taxAmount = Math.floor(baseSalary * 0.03); 
      }

      const totalDeduction = ssfAmount + taxAmount;
      const netSalary = baseSalary - totalDeduction;

      await connection.query(`
        INSERT INTO tbl_payroll 
        (payroll_id, emp_id, pay_month, pay_year, base_salary, total_allowance, total_deduction, net_salary, status)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'Draft')
      `, [payroll_id, emp.emp_id, pay_month, pay_year, baseSalary, totalDeduction, netSalary]);

      // Insert Deductions Details
      if (ssfAmount > 0) {
         await connection.query(`
          INSERT INTO tbl_payroll_deductions (payroll_id, deduction_type_id, amount, remark)
          VALUES (?, ?, ?, 'หักประกันสังคม 5% (อัตโนมัติ)')
        `, [payroll_id, ssfTypeId, ssfAmount]);
      }

      if (taxAmount > 0) {
         await connection.query(`
          INSERT INTO tbl_payroll_deductions (payroll_id, deduction_type_id, amount, remark)
          VALUES (?, ?, ?, 'หักภาษีเงินได้ PND 1 (อัตโนมัติ)')
        `, [payroll_id, taxTypeId, taxAmount]);
      }
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ message: '✅ สร้างรอบเดือนพร้อมคำนวณหักลบอัตโนมัติสำเร็จ!' });
  } catch (err: any) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
