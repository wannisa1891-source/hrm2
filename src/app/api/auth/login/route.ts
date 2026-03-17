import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'กรุณากรอก Email และ Password' }, { status: 400 });
    }

    const [users]: any = await pool.query(
      'SELECT id, name, email, role FROM tbl_users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (users.length > 0) {
      const user = users[0];
      // Generate a mock token for frontend to use in localStorage
      const mockToken = `token_${user.id}_${Date.now()}`;
      
      return NextResponse.json({ 
        success: true, 
        token: mockToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    }

    return NextResponse.json({ success: false, message: 'Email หรือ Password ไม่ถูกต้อง' }, { status: 401 });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
