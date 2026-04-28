import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'invalid data format or empty array' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let successCount = 0;
      let errorCount = 0;
      let errors = [];

      for (const emp of data) {
        try {
          const sql = `INSERT INTO tbl_employees 
            (emp_id, prefix, first_name_th, last_name_th, nickname, 
             birth_date, gender, address, citizen_id, phone, email, password, role, 
             emp_type, dept_id, pos_id, start_date, status, image, 
             position_no, admission_date, retirement_date, working_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          // Default password for excel import is the citizen_id or '123456'
          const plainPass = emp.citizen_id ? String(emp.citizen_id) : '123456';
          const hashedPassword = crypto.createHash('sha256').update(plainPass).digest('hex');

          const finalEmpId = emp.emp_id || `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          // Map values
          const values = [
            finalEmpId,
            emp.prefix || '-',
            emp.first_name_th || '',
            emp.last_name_th || '',
            emp.nickname || null,
            emp.birth_date && emp.birth_date !== '' ? emp.birth_date : '1900-01-01',
            emp.gender || 'ชาย',
            emp.address || '',
            emp.citizen_id || null,
            emp.phone || null,
            emp.email || null,
            hashedPassword,
            emp.role || 'User',
            emp.emp_type || 'พนักงานราชการ',
            emp.dept_id || null,
            emp.pos_id || null,
            emp.start_date || new Date().toISOString().split('T')[0],
            emp.status || 'ทำงานปกติ',
            null, // image
            emp.position_no || null,
            emp.admission_date || null,
            emp.retirement_date || null,
            emp.working_at || null
          ];

          await connection.query(sql, values);

          // Insert multiple licenses if provided
          if (emp.licenses && Array.isArray(emp.licenses) && emp.licenses.length > 0) {
            for (const lic of emp.licenses) {
              const licSql = `INSERT INTO tbl_employee_licenses 
                (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, file_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
              const licValues = [
                finalEmpId, 
                lic.license_name || null, 
                lic.license_type || null, 
                lic.license_no || null,
                lic.institution || null, 
                lic.issue_date || null, 
                lic.expire_date || null,
                lic.status || 'ปกติ', 
                null // file_path
              ];
              await connection.query(licSql, licValues);
            }
          }

          successCount++;
        } catch (rowErr: any) {
          errorCount++;
          let errmsg = rowErr.message || '';
          
          if (errmsg.includes('foreign key constraint fails')) {
            if (errmsg.includes('dept_id')) {
              errmsg = 'ไม่พบข้อมูลแผนกนี้ในระบบ';
            } else if (errmsg.includes('pos_id')) {
              errmsg = 'ไม่พบข้อมูลตำแหน่งนี้ในระบบ';
            } else {
              errmsg = 'ข้อมูลอ้างอิงไม่ถูกต้อง';
            }
          } else if (errmsg.includes('Duplicate entry')) {
            if (errmsg.includes('citizen_id') || errmsg.includes('citizen')) {
              errmsg = 'เลขบัตรประชาชนซ้ำซ้อนในระบบ';
            } else if (errmsg.includes('email')) {
              errmsg = 'อีเมลซ้ำซ้อนในระบบ';
            } else if (errmsg.includes('phone')) {
              errmsg = 'เบอร์โทรศัพท์ซ้ำซ้อนในระบบ';
            } else if (errmsg.includes('PRIMARY') || errmsg.includes('emp_id')) {
              errmsg = 'รหัสพนักงานมีซ้ำซ้อนในระบบแล้ว';
            } else {
              // Extract the duplicate value/key to show exactly what's wrong
              const match = errmsg.match(/Duplicate entry '(.*?)' for key '(.*?)'/);
              if (match) {
                errmsg = `ข้อมูลซ้ำซ้อน: ค่า '${match[1]}' ในช่อง '${match[2]}'`;
              } else {
                errmsg = 'ข้อมูลบางอย่างมีซ้ำซ้อนในระบบ (เช่น อีเมล หรือ เลขบัตรประชาชน)';
              }
            }
          } else if (errmsg.includes('Data too long')) {
            errmsg = 'ข้อมูลยาวเกินกว่าที่ระบบรองรับได้';
          } else if (errmsg.includes('Incorrect date value')) {
            errmsg = 'รูปแบบวันที่ไม่ถูกต้อง';
          } else {
            errmsg = `ข้อผิดพลาดฐานข้อมูล: ${errmsg}`;
          }

          errors.push(`${emp.emp_id || emp.first_name_th} แจ้งเตือน: ${errmsg}`);
        }
      }

      await connection.commit();
      
      const userId = req.headers.get('x-user-id');
      if (userId && successCount > 0) {
        await logAudit(userId, `นำเข้าพนักงานจาก EXCEL สำเร็จจำนวน ${successCount} รายการ`, connection);
      }
      
      connection.release();

      return NextResponse.json({ 
        message: 'Import processed', 
        successCount, 
        errorCount, 
        errors 
      });
    } catch (err: any) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err: any) {
    console.error('Bulk insert error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
