import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    // 1. Password Policy Validation (Backend check again in case Frontend bypassed)
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasNonalphas = /\W/.test(newPassword);

    if (newPassword.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumbers || !hasNonalphas) {
      return NextResponse.json({ 
        success: false, 
        message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวพิมพ์ใหญ่, ตัวพิมพ์เล็ก, ตัวเลข, สัญลักษณ์' 
      }, { status: 400 });
    }

    // 2. Hash token ที่แนบมากับคำขอ (เพื่อไปสืบใน Database)
    const hashedProvidedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 3. ป้องกัน Timing Attack
    // เราดึงข้อมูลจาก Database ผ่าน Hash ตรงๆ ได้เลย เนื่องจาก Hash token ถูกสุ่มมาแบบ Cryptographically Secure ยากที่จะเดาได้
    const [rows]: any = await pool.query(
      'SELECT emp_id, reset_token_hash, reset_token_expiry, password FROM tbl_employees WHERE reset_token_hash = ?',
      [hashedProvidedToken]
    );

    if (rows.length === 0) {
      await logAudit('System', `Password Reset Token Invalid | IP: ${ip} | UA: ${userAgent}`);
      return NextResponse.json({ success: false, message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว' }, { status: 400 });
    }

    const emp = rows[0];

    // 4. ตรวจสอบเวลา Token Expiry
    const now = new Date();
    const expiry = new Date(emp.reset_token_expiry);
    
    if (now > expiry) {
      // ล้าง Token ทิ้งเพื่อป้องกันการใช้ซ้ำ
      await pool.query('UPDATE tbl_employees SET reset_token_hash = NULL, reset_token_expiry = NULL WHERE emp_id = ?', [emp.emp_id]);
      await logAudit(emp.emp_id, `Password Reset Token Expired | IP: ${ip} | UA: ${userAgent}`);
      return NextResponse.json({ success: false, message: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาทำรายการใหม่' }, { status: 400 });
    }

    // 5. ป้องกันรหัสผ่านซ้ำเดิม (Safe compare hash)
    const oldPasswordStr = emp.password;
    let isSameAsOld = false;
    
    if (oldPasswordStr) {
      if (oldPasswordStr.startsWith('$2')) {
        // ใช้ bcrypt
        isSameAsOld = await bcrypt.compare(newPassword, oldPasswordStr);
      } else {
        // ใช้ SHA-256 (ระบบเก่า) ป้องกัน Timing Attack ผ่าน crypto.timingSafeEqual
        const newPasswordSha256 = crypto.createHash('sha256').update(newPassword).digest('hex');
        const buf1 = Buffer.from(newPasswordSha256);
        const buf2 = Buffer.from(oldPasswordStr);
        if (buf1.length === buf2.length) {
           isSameAsOld = crypto.timingSafeEqual(buf1, buf2);
        } else {
           isSameAsOld = newPasswordSha256 === oldPasswordStr;
        }
      }
    }

    if (isSameAsOld) {
      await logAudit(emp.emp_id, `Password Reset Failed (Used old password) | IP: ${ip}`);
      return NextResponse.json({ success: false, message: 'ไม่อนุญาตให้ใช้รหัสผ่านเดิม กรุณาตั้งรหัสผ่านใหม่ที่แตกต่างออกไป' }, { status: 400 });
    }

    // 6. Hash new password ด้วย bcrypt 12 rounds
    const saltRounds = 12;
    const newPasswordBcrypt = await bcrypt.hash(newPassword, saltRounds);

    // 7. บันทึกและล้าง Token
    await pool.query(
      'UPDATE tbl_employees SET password = ?, reset_token_hash = NULL, reset_token_expiry = NULL WHERE emp_id = ?',
      [newPasswordBcrypt, emp.emp_id]
    );

    // 8. Audit Log Success
    await logAudit(emp.emp_id, `Password Reset Success | IP: ${ip} | UA: ${userAgent}`);

    return NextResponse.json({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ ท่านสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที' });

  } catch (error: any) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}
