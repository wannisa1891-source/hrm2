import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const baseQuery = `
  SELECT t.*,
    CONCAT(e.prefix, e.first_name_th, ' ', e.last_name_th) AS emp_name,
    od.dept_name AS old_dept_name,
    nd.dept_name AS new_dept_name,
    COALESCE(op.pos_name, t.old_position) AS old_pos_name,
    COALESCE(np.pos_name, t.new_position) AS new_pos_name
  FROM tbl_transfers t
  LEFT JOIN tbl_employees e ON t.emp_id = e.emp_id
  LEFT JOIN tbl_departments od ON t.old_dept_id = od.dept_id
  LEFT JOIN tbl_departments nd ON t.new_dept_id = nd.dept_id
  LEFT JOIN tbl_positions op ON t.old_position = op.pos_id
  LEFT JOIN tbl_positions np ON t.new_position = np.pos_id
`;

async function handleFileUpload(orderFile: File | null, existingFileName: string | null = null) {
  let fileName = existingFileName;
  if (orderFile && orderFile.size > 0) {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    
    const ext = path.extname(orderFile.name);
    fileName = `${Date.now()}${ext}`;
    const buffer = Buffer.from(await orderFile.arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
  }
  return fileName;
}

async function updateEmployeeOnApproval(connection: any, data: any) {
  const updateFields: string[] = [];
  const updateValues: unknown[] = [];
  if (data.newDeptId) { updateFields.push('dept_id = ?'); updateValues.push(data.newDeptId); }
  if (data.newPos) { updateFields.push('pos_id = ?'); updateValues.push(data.newPos); }
  if (data.newSalary && Number(data.newSalary) > 0) { updateFields.push('base_salary = ?'); updateValues.push(data.newSalary); }
  
  if (updateFields.length > 0) {
    updateValues.push(data.empId);
    await connection.query(`UPDATE tbl_employees SET ${updateFields.join(', ')} WHERE emp_id = ?`, updateValues);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const [rows] = await pool.query(`${baseQuery} WHERE t.transfer_id = ?`, [id]) as any[];
      return NextResponse.json(rows[0] || { error: 'Not found' });
    }

    const [rows] = await pool.query(`${baseQuery} ORDER BY t.order_date DESC`) as any[];
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
    
    const orderFile = formData.get('order_file') as File | null;
    const fileName = await handleFileUpload(orderFile);

    const dataStr = formData.get('data') as string;
    const data = JSON.parse(dataStr);
    const transfer_id = 'TRF' + Date.now().toString().slice(-8);

    await connection.beginTransaction();

    const transferTypeName = {
      '01': 'บรรจุ/แต่งตั้ง',
      '02': 'เลื่อนตำแหน่ง',
      '03': 'ย้าย/สับเปลี่ยนตำแหน่ง',
      '04': 'โอน',
      '05': 'ช่วยราชการ',
    }[data.transferType as string] || data.transferType;

    const sql = `INSERT INTO tbl_transfers 
      (transfer_id, order_no, order_date, subject, transfer_type, effective_date, emp_id, 
       old_dept_id, new_dept_id, old_position, new_position, old_level, new_level, 
       old_salary, new_salary, order_file, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const status = data.status || 'Pending';

    await connection.query(sql, [
      transfer_id, data.orderNo, data.orderDate || null, data.title,
      transferTypeName, data.effectDate || data.orderDate || null, data.empId,
      data.oldDeptId || null, data.newDeptId || null, data.oldPos || null, data.newPos || null,
      data.oldLevel, data.newLevel,
      data.oldSalary, data.newSalary, fileName, status
    ]);

    if (status === 'Approved') {
      await updateEmployeeOnApproval(connection, data);

      await connection.query(
        'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
        [data.empId, 'คำสั่งย้ายอนุมัติแล้ว', `คำสั่ง ${data.orderNo} ย้ายคุณไปแผนกใหม่ อนุมัติแล้วและมีผลใช้งาน`]
      );
    }

    await connection.commit();
    await logAudit(req.headers.get('x-user-id'), `สร้างคำสั่งย้าย/แต่งตั้ง: ${data.orderNo} สำหรับพนักงาน ${data.empId}`, connection);
    return NextResponse.json({ success: true, transfer_id });
  } catch (err: unknown) {
    await connection.rollback();
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PUT(req: NextRequest) {
  const connection = await pool.getConnection();
  try {
    const formData = await req.formData();
    const dataStr = formData.get('data') as string;
    const data = JSON.parse(dataStr);
    const transfer_id = data.transfer_id;

    if (!transfer_id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const orderFile = formData.get('order_file') as File | null;
    const fileName = await handleFileUpload(orderFile, data.order_file);

    await connection.beginTransaction();

    const status = data.status || 'Pending';
    const sql = `UPDATE tbl_transfers SET 
      order_no = ?, order_date = ?, subject = ?, transfer_type = ?, effective_date = ?, 
      old_dept_id = ?, new_dept_id = ?, old_position = ?, new_position = ?, 
      old_level = ?, new_level = ?, old_salary = ?, new_salary = ?, 
      order_file = ?, status = ?
      WHERE transfer_id = ?`;

    await connection.query(sql, [
      data.orderNo, data.orderDate || null, data.title, data.transferType, data.effectDate || null,
      data.oldDeptId || null, data.newDeptId || null, data.oldPos || null, data.newPos || null, 
      data.oldLevel, data.newLevel, data.oldSalary, data.newSalary, 
      fileName, status, transfer_id
    ]);

    // Only update employee record if approved
    if (status === 'Approved') {
      await updateEmployeeOnApproval(connection, data);

      await connection.query(
        'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
        [data.empId, 'คำสั่งย้ายอนุมัติแล้ว', `คำสั่ง ${data.orderNo} แก้ไขและได้รับการอนุมัติเรียบร้อย`]
      );
    } else if (status === 'Rejected') {
      await connection.query(
        'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
        [data.empId, 'คำสั่งย้ายถูกตีตก (ไม่อนุมัติ)', `คำสั่ง ${data.orderNo} ไม่ได้รับการอนุมัติ`]
      );
    }

    await connection.commit();
    await logAudit(req.headers.get('x-user-id'), `แก้ไขคำสั่งย้าย/แต่งตั้ง: ${data.orderNo} สถานะปัจจุบัน ${status}`, connection);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    await connection.rollback();
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await pool.query('DELETE FROM tbl_transfers WHERE transfer_id = ?', [id]);
    await logAudit('Admin', `ลบคำสั่งย้าย/แต่งตั้ง ID: ${id}`);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
