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

      // 3. Query จาก tbl_users โดยเช็ค username + password_hash
      const [rows]: any = await pool.query(
        'SELECT u.*, e.image, e.photo, e.first_name_th, e.last_name_th FROM tbl_users u LEFT JOIN tbl_employees e ON u.emp_id = e.emp_id WHERE u.username = ? AND u.password_hash = ?',
        [username, password_hash]
      );

      if (rows.length > 0) {
        const user = rows[0];
        if (user.status && user.status !== 'Active') {
           return NextResponse.json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน' }, { status: 403 });
        }
        
        // Use user.user_id if available, fallback to user.id
        const userId = user.user_id || user.id;
        
        const payload = { 
          id: userId, 
          emp_id: user.emp_id || '',
          username: user.username,
          name: (user.first_name_th && user.last_name_th) ? `${user.first_name_th} ${user.last_name_th}` : user.username, 
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
      }

      // 4. ถ้าไม่พบใน tbl_users ลองค้นหาใน tbl_employees
      const [empRows]: any = await pool.query(
        'SELECT emp_id, first_name_th, last_name_th, email, role, status, password, citizen_id, image, photo FROM tbl_employees WHERE emp_id = ? OR email = ?',
        [username, username]
      );

      let empMatch = null;
      if (empRows.length > 0) {
        const emp = empRows[0];
        
        if (!emp.password) {
          // Fallback สำหรับกรณีรหัสผ่านเป็น null หรือค่าว่าง (ยังไม่ได้ตั้ง)
          // ให้ใช้เลขบัตรประชาชน หรือ '123456' เป็นรหัสแทน
          const defaultPass1 = emp.citizen_id ? String(emp.citizen_id) : '123456';
          const defaultPass2 = '123456';
          
          if (password === defaultPass1 || password === defaultPass2) {
            empMatch = emp;
          }
        } else {
          // กรณีมีรหัสผ่าน Hash แล้ว
          if (emp.password.startsWith('$2')) {
            const bcrypt = require('bcrypt');
            if (await bcrypt.compare(password, emp.password)) {
               empMatch = emp;
            }
          } else if (emp.password === password_hash || emp.password === password) {
            empMatch = emp;
          }
        }
      }

      if (empMatch) {
        const emp = empMatch;
        if (emp.status !== 'Active') {
          return NextResponse.json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน' }, { status: 403 });
        }
        
        const payload = { 
          id: emp.emp_id, 
          emp_id: emp.emp_id, 
          username: emp.emp_id,
          name: `${emp.first_name_th} ${emp.last_name_th}`, 
          email: emp.email || '', 
          role: emp.role || 'User',
          image: emp.image || emp.photo || null
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
      }

      return NextResponse.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
    } catch (error: any) {
      console.error('Login API Error:', error);
      console.error('Login Route Error:', error);
      return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', details: error.message }, { status: 500 });
    }
  }
