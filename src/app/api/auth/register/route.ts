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

    // 4. Handle Employee Profile Creation/Linking
    let final_emp_id = emp_id;
    if (final_emp_id) {
      // Check if employee already exists in tbl_employees
      const [existingEmp]: any = await connection.query(
        'SELECT emp_id FROM tbl_employees WHERE emp_id = ?',
        [final_emp_id]
      );
      if (existingEmp.length === 0) {
        // If they provided an ID but it doesn't exist, create it
        await connection.query(
          `INSERT INTO tbl_employees 
            (emp_id, prefix, first_name_th, last_name_th, email, phone, gender, birth_date, start_date, citizen_id, base_salary, status, role)
           VALUES (?, '-', ?, ?, ?, ?, ?, ?, ?, '0000000000000', 0, 'Active', 'User')`,
          [final_emp_id, first_name, last_name, email, phone || '', gender || 'ชาย', date_of_birth || null, start_date || null]
        );
      }
    } else {
      // Auto-generate emp_id and create new employee
      final_emp_id = 'E' + Date.now().toString().slice(-5);
      await connection.query(
        `INSERT INTO tbl_employees 
          (emp_id, prefix, first_name_th, last_name_th, email, phone, gender, birth_date, start_date, citizen_id, base_salary, status, role)
         VALUES (?, '-', ?, ?, ?, ?, ?, ?, ?, '0000000000000', 0, 'Active', 'User')`,
        [final_emp_id, first_name, last_name, email, phone || '', gender || 'ชาย', date_of_birth || null, start_date || null]
      );
    }

    // 5. Create user_id = 'U' + timestamp
    const user_id = 'U' + Date.now();

    // 6. Hash password ด้วย SHA-256
    const password_hash = sha256(password);

    // 7. Insert into tbl_users
    await connection.query(
      `INSERT INTO tbl_users 
        (user_id, username, password_hash, first_name, last_name, email,
         emp_id, gender, date_of_birth, phone, position, department,
         start_date, employee_type, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 'Active')`,
      [
        user_id, username, password_hash, first_name, last_name, email,
        final_emp_id, gender || null, date_of_birth || null, phone || null,
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
