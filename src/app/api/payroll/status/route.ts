import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function POST(req: NextRequest) {
  try {
    const { month, year, fromStatus, toStatus } = await req.json();

    if (!month || !year || !fromStatus || !toStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.query(`
        UPDATE tbl_payroll 
        SET status = ? 
        WHERE pay_month = ? AND pay_year = ? AND status = ?
      `, [toStatus, month, year, fromStatus]);

      connection.release();
      return NextResponse.json({ message: `อัปเดตสถานะเป็น ${toStatus} เรียบร้อยแล้ว!` });
    } catch (err: any) {
      connection.release();
      throw err;
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
