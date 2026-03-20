import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export async function POST(req: NextRequest) {
  let connection;
  try {
    const body = await req.json();
    const {
      username, password, first_name, last_name, email,
      emp_id, gender, date_of_birth, phone,
      position, department, start_date, employee_type
    } = body;

    console.log('📥 REGISTER INPUT:', { username, email, emp_id });

    // 1. Basic validation
    if (!username || !password || !first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 2. Check duplicate username
    const [existingUser]: any = await connection.query(
      'SELECT user_id FROM tbl_users WHERE username = ?',
      [username]
    );
    if (existingUser.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'Username นี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    // 3. Check duplicate email
    const [existingEmail]: any = await connection.query(
      'SELECT user_id FROM tbl_users WHERE email = ?',
      [email]
    );
    if (existingEmail.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'Email นี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    // 4. Create user_id = 'U' + timestamp
    const user_id = 'U' + Date.now();

    // 5. Hash password ด้วย SHA-256
    const password_hash = sha256(password);

    // 6. Insert into tbl_users
    await connection.query(
      `INSERT INTO tbl_users 
        (user_id, username, password_hash, first_name, last_name, email,
         emp_id, gender, date_of_birth, phone, position, department,
         start_date, employee_type, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'Active')`,
      [
        user_id, username, password_hash, first_name, last_name, email,
        emp_id || null, gender || null, date_of_birth || null, phone || null,
        position || null, department || null,
        start_date || null, employee_type || null
      ]
    );

    await connection.commit();
    console.log('✅ REGISTER SUCCESS:', user_id);

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user_id
    });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error('🔥 REGISTER ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก',
        error: error.message
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
