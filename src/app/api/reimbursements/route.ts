import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      empId, topic, memoFile, projectFile, 
      transportCost, accommodationCost, organizerPay, parentPay,
      date 
    } = body;

    if (!empId || !topic || !date) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ (รหัสพนักงาน, หัวข้อ, วันที่)' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO tbl_reimbursements 
       (emp_id, topic, memo_file, project_file, transport_cost, accommodation_cost, organizer_pay, parent_pay, reimbursement_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId, topic, memoFile || '', projectFile || '', 
        transportCost || 0, accommodationCost || 0, organizerPay || 0, parentPay || 0,
        date
      ]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empId = searchParams.get('empId');

    let sql = 'SELECT * FROM tbl_reimbursements';
    const params = [];

    if (empId) {
      sql += ' WHERE emp_id = ?';
      params.push(empId);
    }

    sql += ' ORDER BY reimbursement_date DESC';

    const [rows]: any = await pool.query(sql, params);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
