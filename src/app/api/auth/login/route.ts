import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'กรุณากรอก Username และ Password' }, { status: 400 });
    }

    // tbl_users schema: user_id, emp_id, username, password_hash, role, status
    const [users]: any = await pool.query(
      'SELECT user_id, username, role, emp_id FROM tbl_users WHERE username = ? AND password_hash = ? AND (status = "Active" OR status IS NULL)',
      [username, password]
    );

    if (users.length > 0) {
      const user = users[0];
      const mockToken = `token_${user.user_id}_${Date.now()}`;
      
      return NextResponse.json({ 
        success: true, 
        token: mockToken,
        user: { 
          id: user.user_id, 
          emp_id: user.emp_id, 
          name: user.username, 
          email: user.username, 
          role: user.role 
        }
      });
    }

    return NextResponse.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' }, { status: 401 });
  } catch (error) {
    console.error('Login API Error:', error);
    console.error('Login Route Error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 });
  }
}
