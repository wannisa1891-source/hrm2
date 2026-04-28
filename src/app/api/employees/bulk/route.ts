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

      // Ensure optional columns allow NULL
      await connection.query('ALTER TABLE tbl_employees MODIFY COLUMN start_date DATE NULL').catch(() => {});


      // Fetch departments and positions for fallback mapping
      const [deptRows]: any = await connection.query('SELECT dept_id, dept_name FROM tbl_departments');
      const deptMap = new Map<string, string>();
      deptRows.forEach((row: any) => {
        if (row.dept_name) deptMap.set(row.dept_name.trim(), row.dept_id);
        if (row.dept_id) deptMap.set(row.dept_id.trim(), row.dept_id);
      });

      const [posRows]: any = await connection.query('SELECT pos_id, pos_name FROM tbl_positions');
      const posMap = new Map<string, string>();
      posRows.forEach((row: any) => {
        if (row.pos_name) posMap.set(row.pos_name.trim(), row.pos_id);
        if (row.pos_id) posMap.set(row.pos_id.trim(), row.pos_id);
      });


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

          // Resolve dept_id
          let finalDeptId = null;
          if (emp.dept_id) {
            const trimmedDept = String(emp.dept_id).trim();
            if (trimmedDept !== '') {
              if (deptMap.has(trimmedDept)) {
                finalDeptId = deptMap.get(trimmedDept);
              } else {
                // Auto-create department
                const newDeptId = `D-${Math.floor(1000 + Math.random() * 9000)}`;
                await connection.query(
                  'INSERT INTO tbl_departments (dept_id, dept_name) VALUES (?, ?)',
                  [newDeptId, trimmedDept]
                );
                deptMap.set(trimmedDept, newDeptId);
                finalDeptId = newDeptId;
              }
            }
          }

          // Resolve division if dept_id is still null
          if (!finalDeptId && emp.division) {
            const trimmedDiv = String(emp.division).trim();
            if (trimmedDiv !== '') {
              // Check if a dummy department for this division already exists
              const [existingDept]: any = await connection.query(
                "SELECT dept_id FROM tbl_departments WHERE division = ? AND (dept_name = '-' OR dept_name = '' OR dept_name IS NULL) LIMIT 1",
                [trimmedDiv]
              );
              
              if (existingDept.length > 0) {
                finalDeptId = existingDept[0].dept_id;
              } else {
                // Create a dummy department for this division
                const newDeptId = `DIV-${Math.floor(1000 + Math.random() * 9000)}`;
                await connection.query(
                  "INSERT INTO tbl_departments (dept_id, division, dept_name) VALUES (?, ?, '-')",
                  [newDeptId, trimmedDiv]
                );
                finalDeptId = newDeptId;
              }
            }
          }

          // Resolve pos_id
          let finalPosId = null;
          if (emp.pos_id) {
            const trimmedPos = String(emp.pos_id).trim();
            if (trimmedPos !== '') {
              if (posMap.has(trimmedPos)) {
                finalPosId = posMap.get(trimmedPos);
              } else {
                // Auto-create position
                const newPosId = `P-${Math.floor(1000 + Math.random() * 9000)}`;
                await connection.query(
                  'INSERT INTO tbl_positions (pos_id, pos_name) VALUES (?, ?)',
                  [newPosId, trimmedPos]
                );
                posMap.set(trimmedPos, newPosId);
                finalPosId = newPosId;
              }
            }
          }

          // Resolve Gender
          let finalGender = emp.gender;
          if (!finalGender || finalGender.trim() === '') {
            const prefix = String(emp.prefix || '').trim();
            if (['นาง', 'นางสาว', 'น.ส.', 'ด.ญ.'].includes(prefix)) {
              finalGender = 'หญิง';
            } else {
              finalGender = 'ชาย';
            }
          }

          // Resolve Position Number
          const finalPositionNo = emp.position_no && String(emp.position_no).trim() !== '' ? String(emp.position_no).trim() : '-';

          // Resolve Start Date
          const finalStartDate = emp.start_date && String(emp.start_date).trim() !== '' ? emp.start_date : null;

          // Resolve Citizen ID
          const finalCitizenId = emp.citizen_id && String(emp.citizen_id).trim() !== '' ? String(emp.citizen_id).trim() : null;

          // Map values
          const values = [
            finalEmpId,
            emp.prefix || '-',
            emp.first_name_th || '',
            emp.last_name_th || '',
            emp.nickname || null,
            emp.birth_date && emp.birth_date !== '' ? emp.birth_date : '1900-01-01',
            finalGender,
            emp.address || '',
            finalCitizenId,
            emp.phone || null,
            emp.email || null,
            hashedPassword,
            emp.role || 'User',
            emp.emp_type || 'พนักงานราชการ',
            finalDeptId,
            finalPosId,
            finalStartDate,
            emp.status || 'ทำงานปกติ',
            null, // image
            finalPositionNo,
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
