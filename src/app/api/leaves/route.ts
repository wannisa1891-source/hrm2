import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `SELECT l.*, 
        e.first_name_th, e.last_name_th, e.image, e.emp_type, e.start_date AS start_date_work,
        e.quota_personal, e.quota_vacation, e.quota_sick, e.accumulated_vacation,
        d.dept_name 
      FROM tbl_leaves l 
      LEFT JOIN tbl_employees e ON l.emp_id = e.emp_id OR l.emp_id = e.citizen_id
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id 
      ORDER BY l.start_date DESC`;
    const [rows] = await pool.query(sql);
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Auto-fix schema: Ensure 'attachment' column exists
    try {
      await pool.query("ALTER TABLE tbl_leaves ADD COLUMN attachment VARCHAR(255) DEFAULT NULL AFTER current_stage");
    } catch (e) {}

    const formData = await req.formData();
    let emp_id = formData.get('emp_id') as string;
    const leave_type_id = formData.get('leave_type_id') as string;
    const leave_category = formData.get('leave_category') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const reason = formData.get('reason') as string;
    const attachment = formData.get('attachment') as File | null;

    // Resolve employee and ensure they have an ID
    const [empRows] = await pool.query("SELECT emp_id, citizen_id FROM tbl_employees WHERE emp_id = ? OR citizen_id = ?", [emp_id, emp_id]);
    const emps = empRows as any[];
    if (emps.length > 0) {
      const emp = emps[0];
      // If we found them but the provided ID was citizen_id, or their current emp_id is empty
      if (!emp.emp_id || emp.emp_id.trim() === '') {
        // Auto-fix: set emp_id to citizen_id
        await pool.query("UPDATE tbl_employees SET emp_id = ? WHERE citizen_id = ?", [emp.citizen_id, emp.citizen_id]);
        emp_id = emp.citizen_id;
      } else {
        // Use the real emp_id found in DB
        emp_id = emp.emp_id;
      }
    }

    let attachmentPath = null;
    if (attachment && attachment.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      
      const ext = path.extname(attachment.name);
      attachmentPath = `leave_${emp_id}_${Date.now()}${ext}`;
      const buffer = Buffer.from(await attachment.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, attachmentPath), buffer);
    }

    const leave_id = 'L' + Date.now().toString().slice(-4);
    await pool.query(
      `INSERT INTO tbl_leaves 
       (leave_id, emp_id, leave_type_id, leave_category, start_date, end_date, reason, status, 
        dept_head_status, admin_status, housekeeper_status, director_status, current_stage, attachment) 
       VALUES (?,?,?,?,?,?,?,'Pending', 'Pending', 'Pending', 'Pending', 'Pending', 'Head of Dept', ?)`,
      [leave_id, emp_id, leave_type_id, leave_category || 'Sick', start_date, end_date, reason, attachmentPath]
    );

    // Notify Admins
    await pool.query(
      "INSERT INTO tbl_notifications (emp_id, title, message, metadata) VALUES (?, ?, ?, ?)",
      ['admin', 'ยื่นขอลาใหม่', `พนักงานรหัส ${emp_id} ได้ยื่นขอลาตั้งแต่วันที่ ${start_date} ถึง ${end_date}`, JSON.stringify({ type: 'leave', id: leave_id })]
    );

    await logAudit(req.headers.get('x-user-id'), `ยื่นขอลาพักผ่อน/หยุดงาน: พนักงาน ${emp_id} รหัสการลา ${leave_id}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Create Leave Error:', err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.message.includes('foreign key constraint fails')) {
      return NextResponse.json(
        { error: 'บัญชีนี้ยังไม่ได้ผูกกับประวัติพนักงานในระบบ (HR) จึงไม่สามารถยื่นใบลาได้' },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
