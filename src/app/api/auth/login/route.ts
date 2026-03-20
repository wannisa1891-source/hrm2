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

    if (users.length > 0) {
      const user = users[0];
      const mockToken = `token_${user.user_id}_${Date.now()}`;
      
      return NextResponse.json({ 
        success: true, 
        token: mockToken,
        user: { id: user.user_id, name: user.username, email: user.username, role: user.role }
      });
    }

    return NextResponse.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
  } catch (error) {
    console.error('Login API Error:', error);
    console.error('Login Route Error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
