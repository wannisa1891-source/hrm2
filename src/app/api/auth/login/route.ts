import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';

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
      'SELECT user_id, username, first_name, last_name, email, role, status FROM tbl_users WHERE username = ? AND password_hash = ?',
      [username, password_hash]
    );

    console.log('📊 DB RESULT count:', rows.length);

    // 4. ถ้าไม่เจอ -> error
    if (rows.length === 0) {
      console.log('❌ Invalid username or password');
      return NextResponse.json(
        { success: false, message: 'รหัสผ่านหรือผู้ใช้ไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 5. ตรวจสอบสถานะผู้ใช้ต้องเป็น 'Active'
    if (user.status !== 'Active') {
      console.log('❌ User inactive -> status:', user.status);
      return NextResponse.json(
        { success: false, message: 'บัญชีผู้ใช้งานนี้ถูกระงับหรือยังไม่เปิดใช้งาน' },
        { status: 403 }
      );
    }

    console.log('✅ LOGIN SUCCESS:', user.user_id);

    // 6. ส่ง response success พร้อมข้อมูล user
    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        user_id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error: any) {
    console.error('🔥 LOGIN ERROR:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message },
      { status: 500 }
    );
  }
}
