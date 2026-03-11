import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

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
      'แต่งตั้งโยกย้าย', data.orderDate, data.empId,
      data.oldDeptId, data.newDeptId, data.oldPos, data.newPos,
      fileName, data.oldSalary, data.newSalary,
    ]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
