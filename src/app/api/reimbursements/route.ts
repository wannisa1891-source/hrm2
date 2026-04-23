import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const empId = formData.get('empId') as string;
    const topic = formData.get('topic') as string;
    const date = formData.get('date') as string;
    const transportCost = formData.get('transportCost') as string;
    const accommodationCost = formData.get('accommodationCost') as string;
    const organizerPay = formData.get('organizerPay') as string;
    const parentPay = formData.get('parentPay') as string;

    if (!empId || !topic || !date) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ (รหัสพนักงาน, หัวข้อ, วันที่)' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    let memoFileName: string | null = null;
    const memoFile = formData.get('memoFile') as File | null;
    if (memoFile && memoFile.size > 0) {
      const ext = path.extname(memoFile.name);
      memoFileName = `reimb_memo_${empId}_${Date.now()}${ext}`;
      const buffer = Buffer.from(await memoFile.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, memoFileName), buffer);
    }

    let projectFileName: string | null = null;
    const projectFile = formData.get('projectFile') as File | null;
    if (projectFile && projectFile.size > 0) {
      const ext = path.extname(projectFile.name);
      projectFileName = `reimb_proj_${empId}_${Date.now()}${ext}`;
      const buffer = Buffer.from(await projectFile.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, projectFileName), buffer);
    }

    const [result]: any = await pool.query(
      `INSERT INTO tbl_reimbursements 
       (emp_id, topic, memo_file, project_file, transport_cost, accommodation_cost, organizer_pay, parent_pay, reimbursement_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empId, topic, memoFileName || '', projectFileName || '', 
        transportCost || 0, accommodationCost || 0, organizerPay || 0, parentPay || 0,
        date
      ]
    );

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err: any) {
    console.error('Reimbursement Error:', err);
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
