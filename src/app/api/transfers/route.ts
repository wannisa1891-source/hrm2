import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT t.*,
        CONCAT(e.prefix, e.first_name_th, ' ', e.last_name_th) AS emp_name,
        od.dept_name AS old_dept_name,
        nd.dept_name AS new_dept_name
      FROM tbl_transfers t
      LEFT JOIN tbl_employees e ON t.emp_id = e.emp_id
      LEFT JOIN tbl_departments od ON t.old_dept_id = od.dept_id
      LEFT JOIN tbl_departments nd ON t.new_dept_id = nd.dept_id
      ORDER BY t.order_date DESC
    `) as any[];
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const formData = await req.formData();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    let fileName: string | null = null;
    const orderFile = formData.get('order_file') as File | null;
    if (orderFile && orderFile.size > 0) {
      const ext = path.extname(orderFile.name);
      fileName = `${Date.now()}${ext}`;
      const buffer = Buffer.from(await orderFile.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    }

    const dataStr = formData.get('data') as string;
    const data = JSON.parse(dataStr);
    const transfer_id = 'TRF' + Date.now().toString().slice(-8);

    await connection.beginTransaction();

    // 1. Insert complete transfer record
    const transferTypeName = {
      '01': 'บรรจุ/แต่งตั้ง',
      '02': 'เลื่อนตำแหน่ง',
      '03': 'ย้าย/สับเปลี่ยนตำแหน่ง',
      '04': 'โอน',
      '05': 'ช่วยราชการ',
    }[data.transferType as string] || data.transferType;

    // Check if tbl_transfers has the extra columns; use a safe INSERT
    const sql = `INSERT INTO tbl_transfers 
      (transfer_id, order_no, order_date, subject, transfer_type, effective_date, emp_id, 
       old_dept_id, new_dept_id, old_position, new_position, order_file, old_salary, new_salary) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await connection.query(sql, [
      transfer_id,
      data.orderNo,
      data.orderDate || null,
      data.title,
      transferTypeName,
      data.effectDate || data.orderDate || null,
      data.empId,
      data.oldDeptId || null,
      data.newDeptId,
      data.oldPos,
      data.newPos,
      fileName,
      data.oldSalary,
      data.newSalary,
    ]);

    // 2. Auto-update employee record with new data
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];

    if (data.newDeptId) {
      updateFields.push('dept_id = ?');
      updateValues.push(data.newDeptId);
    }
    if (data.newPos) {
      updateFields.push('position = ?');
      updateValues.push(data.newPos);
    }
    if (data.newSalary && Number(data.newSalary) > 0) {
      updateFields.push('salary = ?');
      updateValues.push(data.newSalary);
    }

    if (updateFields.length > 0) {
      updateValues.push(data.empId);
      await connection.query(
        `UPDATE tbl_employees SET ${updateFields.join(', ')} WHERE emp_id = ?`,
        updateValues
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, transfer_id });
  } catch (err: unknown) {
    await connection.rollback();
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    connection.release();
  }
}
