import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';
import { verifyJWT } from '@/lib/jwt';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// ─── Helper: verify token & extract payload ───────────────────────────────────
async function getUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyJWT(token);
}

// ─── Helper: file upload ──────────────────────────────────────────────────────
async function saveFile(file: File): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(uploadDir, fileName), buffer);
  return fileName;
}

function deleteFile(fileName: string | null) {
  if (!fileName) return;
  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // silent — best effort cleanup
  }
}

// ─── Base JOIN query ──────────────────────────────────────────────────────────
const BASE_QUERY = `
  SELECT
    t.*,
    CONCAT(COALESCE(e.prefix,''), e.first_name_th, ' ', e.last_name_th) AS emp_name,
    e.birth_date AS emp_dob,
    e.citizen_id AS emp_id_card,
    e.start_date AS emp_start_date,
    od.dept_name AS old_dept_name,
    nd.dept_name AS new_dept_name,
    COALESCE(op.pos_name, t.old_position) AS old_pos_name,
    COALESCE(np.pos_name, t.new_position) AS new_pos_name
  FROM tbl_transfers t
  LEFT JOIN tbl_employees  e  ON t.emp_id       = e.emp_id
  LEFT JOIN tbl_departments od ON t.old_dept_id  = od.dept_id
  LEFT JOIN tbl_departments nd ON t.new_dept_id  = nd.dept_id
  LEFT JOIN tbl_positions   op ON t.old_position = op.pos_id
  LEFT JOIN tbl_positions   np ON t.new_position = np.pos_id
`;

// ─── Helper: update employee after approval ───────────────────────────────────
async function updateEmployeeOnApproval(connection: any, data: any) {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.newDeptId)                          { fields.push('dept_id = ?');      values.push(data.newDeptId); }
  if (data.newPos)                             { fields.push('pos_id = ?');       values.push(data.newPos); }
  if (data.newSalary && Number(data.newSalary) > 0) { fields.push('base_salary = ?'); values.push(data.newSalary); }
  if (fields.length === 0) return;
  values.push(data.empId);
  await connection.query(
    `UPDATE tbl_employees SET ${fields.join(', ')} WHERE emp_id = ?`,
    values
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/transfers
// Query params: page, limit, status, sort (asc|desc)
// ═══════════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page   = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const status = searchParams.get('status') || '';
  const sort   = searchParams.get('sort')?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  try {
    const conditions: string[] = [];
    const params: unknown[]    = [];

    if (status && status !== 'all') {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tbl_transfers t ${whereClause}`,
      params
    ) as any[];
    const total = (countRows as any[])[0]?.total ?? 0;

    // Paginated data
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `${BASE_QUERY} ${whereClause} ORDER BY t.effective_date ${sort} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any[];

    return NextResponse.json({
      success: true,
      data: rows as any[],
      pagination: { page, limit, total },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ success: false, message, error: message }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/transfers  — Admin only
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  // Role check
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }
  const isAdmin = ['Admin', 'admin', 'HR'].includes(user.role ?? '');
  if (!isAdmin) {
    return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง (Admin เท่านั้น)' }, { status: 403 });
  }

  const connection = await pool.getConnection();
  let savedFileName: string | null = null;
  let savedRequestFile: string | null = null;

  try {
    const formData = await req.formData();
    const dataStr  = formData.get('data') as string | null;
    if (!dataStr) {
      return NextResponse.json({ success: false, message: 'ไม่พบข้อมูล (data field missing)', error: 'ไม่พบข้อมูล (data field missing)' }, { status: 400 });
    }
    const data = JSON.parse(dataStr);

    // Identify if the request comes from the new strict frontend
    // By checking if it's the exact format or has a specific flag.
    const isLegacy = !data.effectDate || !data.title;

    const required: [string, string][] = [
      ['empId',      'รหัสพนักงาน'],
      ['orderNo',    'เลขที่คำสั่ง'],
      ['newDeptId',  'หน่วยงานใหม่'],
    ];
    if (!isLegacy) {
      required.push(
        ['orderDate',  'วันที่ออกคำสั่ง'],
        ['effectDate', 'วันที่มีผล'],
        ['title',      'เรื่อง']
      );
    }
    for (const [key, label] of required) {
      if (!data[key] || String(data[key]).trim() === '') {
        return NextResponse.json({ success: false, message: `กรุณากรอก: ${label}`, error: `กรุณากรอก: ${label}` }, { status: 400 });
      }
    }

    // ── Validate PDF file ─────────────────────────────────────────────────────
    const orderFile = formData.get('order_file') as File | null;
    if (!isLegacy) {
      if (!orderFile || orderFile.size === 0) {
        return NextResponse.json({ success: false, message: 'กรุณาแนบไฟล์ PDF คำสั่ง', error: 'กรุณาแนบไฟล์ PDF คำสั่ง' }, { status: 400 });
      }
      const ext = path.extname(orderFile.name).toLowerCase();
      if (ext !== '.pdf') {
        return NextResponse.json({ success: false, message: 'ไฟล์ต้องเป็น .pdf เท่านั้น', error: 'ไฟล์ต้องเป็น .pdf เท่านั้น' }, { status: 400 });
      }
      const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
      if (orderFile.size > MAX_BYTES) {
        return NextResponse.json({ success: false, message: 'ขนาดไฟล์ต้องไม่เกิน 5 MB', error: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' }, { status: 400 });
      }
    }

    // ── Begin transaction ─────────────────────────────────────────────────────
    await connection.beginTransaction();

    // Upload file INSIDE transaction scope so we can rollback on DB failure
    if (orderFile && orderFile.size > 0) {
      savedFileName = await saveFile(orderFile);
    }
    const requestFile = formData.get('request_file') as File | null;
    if (requestFile && requestFile.size > 0) {
      savedRequestFile = await saveFile(requestFile);
    }

    const transfer_id = 'TRF' + Date.now().toString().slice(-8);

    const TRANSFER_TYPE_MAP: Record<string, string> = {
      '01': 'บรรจุ/แต่งตั้ง',
      '02': 'เลื่อนตำแหน่ง',
      '03': 'ย้าย/สับเปลี่ยนตำแหน่ง',
      '04': 'โอน',
      '05': 'ช่วยราชการ',
    };
    const transferTypeName = TRANSFER_TYPE_MAP[data.transferType] || data.transferType || '';

    const status = data.status || 'Pending';

    await connection.query(
      `INSERT INTO tbl_transfers
        (transfer_id, order_no, order_date, subject, transfer_type, effective_date, emp_id,
         old_dept_id, new_dept_id, old_position, new_position, old_level, new_level,
         old_position_no, new_position_no, old_salary, new_salary, transfer_file, status,
         remark, promotion_order, request_memo, request_file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transfer_id,
        data.orderNo,
        data.orderDate || null,
        data.title,
        transferTypeName,
        data.effectDate || data.orderDate || null,
        data.empId,
        data.oldDeptId  || null,
        data.newDeptId  || null,
        data.oldPos     || null,
        data.newPos     || null,
        data.oldLevel   || null,
        data.newLevel   || null,
        data.oldPosNo   || null,
        data.newPosNo   || null,
        data.oldSalary  || 0,
        data.newSalary  || 0,
        savedFileName   || '',
        status,
        data.remark || null,
        data.promotionOrder || null,
        data.requestMemo || null,
        savedRequestFile || null
      ]
    );

    if (status === 'Approved') {
      await updateEmployeeOnApproval(connection, data);
      await connection.query(
        'INSERT INTO tbl_notifications (emp_id, title, message) VALUES (?, ?, ?)',
        [data.empId, 'คำสั่งย้ายอนุมัติแล้ว', `คำสั่ง ${data.orderNo} ย้ายคุณไปแผนกใหม่ อนุมัติแล้วและมีผลใช้งาน`]
      );
    }

    await connection.commit();
    await logAudit(
      req.headers.get('x-user-id'),
      `สร้างคำสั่งย้าย/แต่งตั้ง: ${data.orderNo} สำหรับพนักงาน ${data.empId}`,
      connection
    );

    return NextResponse.json({ success: true, transfer_id }, { status: 200 });

  } catch (err: unknown) {
    await connection.rollback();
    // Cleanup uploaded file on DB failure
    deleteFile(savedFileName);
    deleteFile(savedRequestFile);
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUT /api/transfers  — Admin only
// ═══════════════════════════════════════════════════════════════════════════════
export async function PUT(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (!['Admin', 'admin', 'HR'].includes(user.role ?? '')) {
    return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง (Admin เท่านั้น)' }, { status: 403 });
  }

  const connection = await pool.getConnection();
  try {
    const formData  = await req.formData();
    const dataStr   = formData.get('data') as string;
    const data      = JSON.parse(dataStr);
    const transfer_id = data.transfer_id;

    if (!transfer_id) {
      return NextResponse.json({ success: false, message: 'ไม่พบ transfer_id' }, { status: 400 });
    }

    // Optional new PDF upload
    let fileName = data.order_file || null;
    const orderFile = formData.get('order_file') as File | null;
    if (orderFile && orderFile.size > 0) {
      const ext = path.extname(orderFile.name).toLowerCase();
      if (ext !== '.pdf') {
        return NextResponse.json({ success: false, message: 'ไฟล์ต้องเป็น .pdf เท่านั้น' }, { status: 400 });
      }
      if (orderFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ success: false, message: 'ขนาดไฟล์ต้องไม่เกิน 5 MB' }, { status: 400 });
      }
      fileName = await saveFile(orderFile);
    }
    
    let reqFileName = data.request_file || null;
    const requestFile = formData.get('request_file') as File | null;
    if (requestFile && requestFile.size > 0) {
      reqFileName = await saveFile(requestFile);
    }

    await connection.beginTransaction();

    const status = data.status || 'Pending';
    await connection.query(
      `UPDATE tbl_transfers SET
        order_no = ?, order_date = ?, subject = ?, transfer_type = ?, effective_date = ?,
        old_dept_id = ?, new_dept_id = ?, old_position = ?, new_position = ?,
        old_level = ?, new_level = ?, old_position_no = ?, new_position_no = ?,
        old_salary = ?, new_salary = ?, transfer_file = ?, status = ?,
        remark = ?, promotion_order = ?, request_memo = ?, request_file = ?
       WHERE transfer_id = ?`,
      [
        data.orderNo, data.orderDate || null, data.title, data.transferType,
        data.effectDate || null, data.oldDeptId || null, data.newDeptId || null,
        data.oldPos || null, data.newPos || null,
        data.oldLevel || null, data.newLevel || null,
        data.oldPosNo || null, data.newPosNo || null,
        data.oldSalary || 0, data.newSalary || 0,
        fileName, status,
        data.remark || null, data.promotionOrder || null, data.requestMemo || null, reqFileName || null,
        transfer_id,
      ]
    );

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
    await logAudit(
      req.headers.get('x-user-id'),
      `แก้ไขคำสั่งย้าย/แต่งตั้ง: ${data.orderNo} สถานะ ${status}`,
      connection
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    await connection.rollback();
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  } finally {
    connection.release();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/transfers?id=xxx  — Admin only
// ═══════════════════════════════════════════════════════════════════════════════
export async function DELETE(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ success: false, message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  if (!['Admin', 'admin', 'HR'].includes(user.role ?? '')) {
    return NextResponse.json({ success: false, message: 'ไม่มีสิทธิ์เข้าถึง (Admin เท่านั้น)' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Missing ID' }, { status: 400 });

    // Get file name before deleting
    const [rows] = await pool.query(
      'SELECT transfer_file, request_file FROM tbl_transfers WHERE transfer_id = ?',
      [id]
    ) as any[];
    const record = (rows as any[])[0];

    await pool.query('DELETE FROM tbl_transfers WHERE transfer_id = ?', [id]);

    // Clean up associated PDF file
    if (record?.transfer_file) deleteFile(record.transfer_file);
    if (record?.request_file) deleteFile(record.request_file);

    await logAudit(req.headers.get('x-user-id'), `ลบคำสั่งย้าย/แต่งตั้ง ID: ${id}`);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
