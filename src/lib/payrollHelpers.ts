import { Connection } from 'mysql2/promise';

export async function updatePayrollTotals(connection: Connection, payroll_id: string) {
  // Recalculate totals
  const [allowRows] = await connection.query(`SELECT SUM(amount) as total FROM tbl_payroll_allowances WHERE payroll_id = ?`, [payroll_id]);
  const total_allowance = parseFloat((allowRows as any[])[0].total) || 0;

  const [deducRows] = await connection.query(`SELECT SUM(amount) as total FROM tbl_payroll_deductions WHERE payroll_id = ?`, [payroll_id]);
  const total_deduction = parseFloat((deducRows as any[])[0].total) || 0;

  await connection.query(`
    UPDATE tbl_payroll 
    SET total_allowance = ?, 
        total_deduction = ?, 
        net_salary = base_salary + ? - ?
    WHERE payroll_id = ?
  `, [total_allowance, total_deduction, total_allowance, total_deduction, payroll_id]);
}
