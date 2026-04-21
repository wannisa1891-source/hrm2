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
      if (!username || !password) {
        return NextResponse.json(
          { success: false, message: 'กรุณากรอข้อมูลให้ครบถ้วน' },
          { status: 400 }
        );
      }

      // 2. Hash password ด้วย SHA-256
      const password_hash = sha256(password);
      const bcrypt = require('bcrypt');

      // 3. Query จาก tbl_employees โดยเช็ค emp_id, username หรือ email
      const [rows]: any = await pool.query(
        'SELECT emp_id, username, first_name_th, last_name_th, email, role, status, password, citizen_id, image, photo, login_attempts FROM tbl_employees WHERE emp_id = ? OR username = ? OR email = ?',
        [username, username, username]
      );

      if (rows.length === 0) {
        return NextResponse.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
      }

      const user = rows[0];

      // 4. Check status
      if (user.status && user.status !== 'Active') {
        return NextResponse.json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน' }, { status: 403 });
      }

      let isMatch = false;

      // 5. Check password
      if (!user.password) {
        // Fallback สำหรับกรณีรหัสผ่านเป็น null
        const defaultPass1 = user.citizen_id ? String(user.citizen_id) : '123456';
        const defaultPass2 = '123456';
        if (password === defaultPass1 || password === defaultPass2) {
          isMatch = true;
        }
      } else {
        // ตรวจสอบทั้ง Bcrypt และ SHA-256 (เพื่อความปลอดภัยย้อนหลัง)
        if (user.password.startsWith('$2')) {
          isMatch = await bcrypt.compare(password, user.password);
        } else if (user.password === password_hash || user.password === password) {
          isMatch = true;
        }
      }

      if (isMatch) {
        // Success: Reset login_attempts and update last_login
        await pool.query(
          'UPDATE tbl_employees SET login_attempts = 0, last_login = NOW() WHERE emp_id = ?',
          [user.emp_id]
        );

        const payload = { 
          id: user.emp_id, 
          emp_id: user.emp_id,
          username: user.username || user.emp_id,
          name: `${user.first_name_th} ${user.last_name_th}`, 
          email: user.email || '', 
          role: user.role || 'User',
          image: user.image || user.photo || null
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
          user: payload
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
