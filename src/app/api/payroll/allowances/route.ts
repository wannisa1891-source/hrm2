import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { updatePayrollTotals } from '@/lib/payrollHelpers';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const payroll_id = url.searchParams.get('payroll_id');
    if (!payroll_id) return NextResponse.json({ error: 'Missing payroll_id' }, { status: 400 });

    const [rows] = await pool.query(`
      SELECT pa.*, t.type_name, t.is_taxable 
      FROM tbl_payroll_allowances pa
      JOIN tbl_allowance_types t ON pa.allowance_type_id = t.id
      WHERE pa.payroll_id = ?
    `, [payroll_id]);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const { payroll_id, allowance_type_id, amount, remark } = await req.json();
    if (!payroll_id || !allowance_type_id || amount === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connection.beginTransaction();

    await connection.query(`
      INSERT INTO tbl_payroll_allowances (payroll_id, allowance_type_id, amount, remark)
      VALUES (?, ?, ?, ?)
    `, [payroll_id, allowance_type_id, amount, remark || '']);

    // Update totals
    await updatePayrollTotals(connection, payroll_id);

    await connection.commit();
    return NextResponse.json({ message: 'Added allowance' });
  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const payroll_id = url.searchParams.get('payroll_id');
    
    if (!id || !payroll_id) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    await connection.beginTransaction();

    await connection.query(`DELETE FROM tbl_payroll_allowances WHERE id = ?`, [id]);
    
    // Update totals
    await updatePayrollTotals(connection, payroll_id);

    await connection.commit();
    return NextResponse.json({ message: 'Deleted allowance' });
  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}
