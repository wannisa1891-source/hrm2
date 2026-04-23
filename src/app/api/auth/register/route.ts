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

    // 2. Check duplicate username or email in tbl_employees
    const [existing]: any = await connection.query(
      'SELECT emp_id FROM tbl_employees WHERE username = ? OR email = ? OR (emp_id IS NOT NULL AND emp_id = ?)',
      [username, email, emp_id || '']
    );
    if (existing.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, message: 'Username, Email หรือ รหัสพนักงานนี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    // 4. Handle Employee Profile Creation
    let final_emp_id = emp_id;
    if (!final_emp_id) {
       final_emp_id = 'E' + Date.now().toString().slice(-5);
    }

    // Hash password สำหรับ tbl_employees
    const password_hash = sha256(password);

    // 5. Insert or Update tbl_employees
    // ตรวจสอบว่ามีแถวที่สร้างไว้ล่วงหน้า (ไม่มีรหัสผ่าน) หรือไม่
    const [existingEmpById]: any = await connection.query(
      'SELECT emp_id FROM tbl_employees WHERE emp_id = ?',
      [final_emp_id]
    );

    if (existingEmpById.length > 0) {
      // Update existing record with login info
      await connection.query(
        `UPDATE tbl_employees SET 
          username = ?, password = ?, first_name_th = ?, last_name_th = ?, email = ?, phone = ?, gender = ?, birth_date = ?, status = 'Active'
         WHERE emp_id = ?`,
        [username, password_hash, first_name, last_name, email, phone || '', gender || 'ชาย', date_of_birth || null, final_emp_id]
      );
      } else {
        // Insert new record
        await connection.query(
          `INSERT INTO tbl_employees 
            (emp_id, username, password, prefix, first_name_th, last_name_th, email, phone, gender, birth_date, start_date, citizen_id, status, role, dept_id, pos_id, emp_type)
           VALUES (?, ?, ?, '-', ?, ?, ?, ?, ?, ?, ?, '0000000000000', 'Active', 'User', ?, ?, ?)`,
          [
            final_emp_id, username, password_hash, first_name, last_name, email, phone || '', 
            gender || 'ชาย', date_of_birth || null, start_date || null,
            department || 'ADM-ADM', position || 'P001', employee_type || 'พนักงานประจำ'
          ]
        );
      }

    await connection.commit();
    console.log('✅ REGISTER SUCCESS:', final_emp_id);

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      emp_id: final_emp_id
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
