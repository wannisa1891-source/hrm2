import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const { emp_id, oldPassword, newPassword } = await req.json();

    if (!emp_id || !oldPassword || !newPassword) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // Hash the old password to check
    const hashedOldPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');

    const [rows]: any = await pool.query(
      `SELECT password FROM tbl_employees WHERE emp_id = ? LIMIT 1`,
      [emp_id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งานในระบบ' }, { status: 404 });
    }

    if (rows[0].password !== hashedOldPassword) {
      return NextResponse.json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' }, { status: 401 });
    }

    // Hash the new password and update
    const hashedNewPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Also update force_password_change if such column exists (ignore if error)
    try {
      await pool.query(
        `UPDATE tbl_employees SET password = ?, force_password_change = 0 WHERE emp_id = ?`,
        [hashedNewPassword, emp_id]
      );
    } catch {
       await pool.query(
        `UPDATE tbl_employees SET password = ? WHERE emp_id = ?`,
        [hashedNewPassword, emp_id]
      );
    }

    const userId = req.headers.get('x-user-id');
    if (userId) {
      await logAudit(userId, `พนักงานเปลี่ยนรหัสผ่านของตนเอง: ${emp_id}`, pool);
    }

    return NextResponse.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });

  } catch (error: any) {
    console.error('Change Password Error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, { status: 500 });
  }
}
