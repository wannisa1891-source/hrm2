import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

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

    const sql = `INSERT INTO tbl_transfers 
      (transfer_id, order_no, order_date, subject, transfer_type, effective_date, emp_id, 
       old_dept_id, new_dept_id, old_position, new_position, order_file, old_salary, new_salary) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    await pool.query(sql, [
      transfer_id, data.orderNo, data.orderDate, data.title,
      data.transferType, data.effectDate, data.empId,
      data.oldDeptId || null, data.newDeptId || null, data.oldPos || '', data.newPos || '',
      fileName, data.oldSalary || 0, data.newSalary || 0,
    ]);

    // Update the employee record in tbl_employees
    if (data.empId) {
      const updateSql = `UPDATE tbl_employees 
        SET dept_id = ?, base_salary = ?
        WHERE emp_id = ?`;
      await pool.query(updateSql, [data.newDeptId || data.oldDeptId, data.newSalary || data.oldSalary, data.empId]);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
