import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // สร้างตารางถ้ายังไม่มี
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ตรวจสอบอีเมลซ้ำ
    const [existingUsers]: any = await pool.query(
      'SELECT id FROM tbl_users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    // บันทึกผู้ใช้ใหม่
    await pool.query(
      'INSERT INTO tbl_users (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );

    return NextResponse.json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    console.error('Register API Error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    );
  }
}
