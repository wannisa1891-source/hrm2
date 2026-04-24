import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';
import { signJWT } from '@/lib/jwt';

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    console.log('📥 LOGIN INPUT:', { username });

    // 1. Validate input
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // 2. Hash password ด้วย SHA-256
    const password_hash = sha256(cleanPassword);
    let bcrypt: any;
    try {
      bcrypt = require('bcryptjs'); // Prefer bcryptjs for cross-platform compatibility
    } catch (e) {
      try {
        bcrypt = require('bcrypt');
      } catch (e2) {
        console.error('Bcrypt module not found');
      }
    }

    // 3. Query จาก tbl_employees โดยเช็ค emp_id, username หรือ email
    const [rows]: any = await pool.query(
      'SELECT emp_id, username, first_name_th, last_name_th, email, role, status, password, citizen_id, birth_date, image, login_attempts, dept_id, last_login FROM tbl_employees WHERE emp_id = ? OR username = ? OR email = ? OR citizen_id = ?',
      [cleanUsername, cleanUsername, cleanUsername, cleanUsername]
    );

    // Log for debugging
    const fs = require('fs');
    // const logMsg = `[LOGIN TEST] ${new Date().toISOString()} - Input: ${cleanUsername} / Password: ${cleanPassword} / Rows: ${rows.length}\n`;
    // fs.appendFileSync('login_debug.log', logMsg);

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ' }, { status: 401 });
    }

    const user = rows[0];
    const userStatus = String(user.status || '').trim();

    // 4. Check status (รองรับทั้งภาษาอังกฤษเดิมและภาษาไทยมาตรฐาน)
    const inactiveStatuses = ['I', 'Inactive', 'Suspended', '0', 'ระงับ', 'ลาออก/พ้นสภาพ', 'ให้ออก', 'หยุดปฏิบัติงาน'];
    if (userStatus && inactiveStatuses.some(s => userStatus.toLowerCase().includes(s.toLowerCase()))) {
      return NextResponse.json({ success: false, message: `บัญชีนี้ถูกระงับการใช้งานหรือพ้นสภาพพนักงาน (Status: ${userStatus})` }, { status: 403 });
    }

    let isMatch = false;

    // 5. Check password
    if (!user.password || user.password === '') {
      // Fallback สำหรับกรณีรหัสผ่านเป็น null
      const defaultPass1 = user.citizen_id ? String(user.citizen_id).trim() : '123456';
      if (cleanPassword === defaultPass1 || cleanPassword === '123456') {
        isMatch = true;
      }
    } else {
      // ตรวจสอบทั้ง Bcrypt และ SHA-256
      if (user.password.startsWith('$2')) {
        if (bcrypt) {
          isMatch = await bcrypt.compare(cleanPassword, user.password);
        } else {
          console.error('Cannot verify Bcrypt password: bcrypt module missing');
        }
      } else if (user.password === password_hash || user.password === cleanPassword) {
        isMatch = true;
      }

      // 6. Fallback: Check Birth Date (DDMMYYYY BE)
      if (!isMatch && user.birth_date) {
        try {
          // birth_date is usually 'YYYY-MM-DD' or a Date object
          let dateStr = '';
          if (user.birth_date instanceof Date) {
            const y = user.birth_date.getFullYear();
            const m = String(user.birth_date.getMonth() + 1).padStart(2, '0');
            const d = String(user.birth_date.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${d}`;
          } else {
            dateStr = String(user.birth_date).split('T')[0];
          }

          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const adYear = parts[0]; // YYYY (AD)
            const birthPass = `${parts[2]}${parts[1]}${adYear}`; // DDMMYYYY (AD)
            
            if (cleanPassword === birthPass) {
              isMatch = true;
            }
          }
        } catch (e) {
          console.error('Birth date fallback error:', e);
        }
      }
    }

    if (isMatch) {
      // Success: Reset login_attempts and update last_login
      const isFirstLogin = user.last_login === null;
      await pool.query(
        'UPDATE tbl_employees SET login_attempts = 0, last_login = NOW() WHERE emp_id = ?',
        [user.emp_id]
      );

      const payload = {
        id: user.emp_id,
        emp_id: user.emp_id,
        dept_id: user.dept_id || '',
        username: user.username || user.emp_id,
        name: `${user.first_name_th} ${user.last_name_th}`,
        email: user.email || '',
        role: user.role || 'User',
        image: user.image || null
      };
      const token = await signJWT(payload, '24h');

      cookies().set({
        name: 'token',
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 // 1 day
      });

      return NextResponse.json({
        success: true,
        token: token,
        user: payload,
        isFirstLogin: isFirstLogin
      });
    } else {
      // Failure: Increment login_attempts
      await pool.query(
        'UPDATE tbl_employees SET login_attempts = login_attempts + 1 WHERE emp_id = ?',
        [user.emp_id]
      );
      return NextResponse.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
    }

    return NextResponse.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
  } catch (error: any) {
    console.error('Login API Error:', error);
    console.error('Login Route Error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', details: error.message }, { status: 500 });
  }
}
