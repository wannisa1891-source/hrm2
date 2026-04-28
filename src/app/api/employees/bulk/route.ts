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
      let updateCount = 0;
      let insertCount = 0;
      let errors = [];

      const processedNames = new Set<string>();
      const processedCitizenIds = new Set<string>();

      for (const emp of data) {
        try {
          let rawPrefix = String(emp.prefix || '').trim();
          let rawFirst = String(emp.first_name_th || '').trim();
          let rawLast = String(emp.last_name_th || '').trim();

          // Support combined 'ชื่อ-สกุล' single column or client-side aggregated string
          if (rawLast === '' || rawPrefix === '' || rawPrefix === '-') {
            let combinedName = String(emp['ชื่อ-สกุล'] || emp['ชื่อสกุล'] || emp['ชื่อ นามสกุล'] || emp['name'] || emp['ชื่อ สกุล'] || '').trim();
            if (combinedName === '') {
              combinedName = (rawFirst + ' ' + rawLast).trim();
            }
            if (combinedName !== '') {
              const prefixes = ['นาย', 'นางสาว', 'นาง', 'น.ส.', 'นส.', 'นส', 'ด.ญ.', 'ด.ช.', 'เด็กชาย', 'เด็กหญิง', 'ว่าที่ ร.ต.', 'ดร.', 'นพ.', 'พญ.', 'พล.ต.', 'พ.ต.ท.', 'พ.ต.ต.', 'พ.ต.อ.', 'ร.ต.อ.', 'ร.ต.ท.', 'ร.ต.ต.'];
              
              let matchedPrefix = false;
              for (const p of prefixes) {
                if (combinedName.startsWith(p)) {
                  rawPrefix = p;
                  const nameNoPrefix = combinedName.slice(p.length).trim();
                  const parts = nameNoPrefix.split(/\s+/);
                  if (parts.length > 0) {
                    rawFirst = parts[0];
                    rawLast = parts.slice(1).join(' ').trim();
                  }
                  matchedPrefix = true;
                  break;
                }
              }

              if (!matchedPrefix) {
                const parts = combinedName.split(/\s+/);
                if (parts.length > 0) {
                  rawFirst = parts[0];
                  rawLast = parts.slice(1).join(' ').trim();
                }
              }
            }
          }

          // Abbreviation Mapping for Prefixes
          const prefixAbbr: { [key: string]: string } = {
            'น.ส.': 'นางสาว',
            'นส.': 'นางสาว',
            'นส': 'นางสาว',
            'ด.ญ.': 'เด็กหญิง',
            'ด.ช.': 'เด็กชาย',
          };

          if (prefixAbbr[rawPrefix]) {
            rawPrefix = prefixAbbr[rawPrefix];
          }


          const trimmedFirst = rawFirst;
          const trimmedLast = rawLast;
          const trimmedCitizen = String(emp.citizen_id || '').trim();

          // --- SKIP HEADER/GARBAGE ROWS ---
          const combinedNameForCheck = (trimmedFirst + ' ' + trimmedLast).trim();
          if (!combinedNameForCheck || combinedNameForCheck === '-' || combinedNameForCheck === '.') {
            continue; // Skip empty or placeholder rows
          }

          // Heuristic: If it looks like a header (starts with number, contains 'กลุ่มงาน', or is just a short department name)
          // AND it doesn't have a citizen_id or phone number, it's likely a header.
          const isHeaderRow = 
            /^\d+[\.\s]/.test(combinedNameForCheck) || 
            combinedNameForCheck.includes('กลุ่มงาน') || 
            (trimmedLast === '' && combinedNameForCheck.length < 20);

          if (isHeaderRow && !trimmedCitizen && !emp.phone && !emp.position_no) {
            continue; // Skip headers silently
          }
          // ---------------------------------

          if (trimmedFirst && trimmedLast) {
            const nameKey = `${trimmedFirst}|${trimmedLast}`;
            
            // 1. Check name duplicates within the Excel file itself
            if (processedNames.has(nameKey)) {
              throw new Error(`ข้อมูลซ้ำซ้อน: มีรายชื่อ "${trimmedFirst} ${trimmedLast}" ซ้ำกันในไฟล์ Excel`);
            }
            processedNames.add(nameKey);
          } else {
            // If it's missing names, and passed the header check, we still probably shouldn't import it as an employee
            continue; 
          }

          // 3. Check citizen_id duplicates within the Excel file itself
          if (trimmedCitizen && trimmedCitizen !== '' && trimmedCitizen !== '-') {
            if (processedCitizenIds.has(trimmedCitizen)) {
              throw new Error(`ข้อมูลซ้ำซ้อน: มีเลขบัตรประชาชน "${trimmedCitizen}" ซ้ำกันในไฟล์ Excel`);
            }
            processedCitizenIds.add(trimmedCitizen);
          }

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

          // --- RESOLVE DEPT_ID (Division + Department) ---
          let finalDeptId = null;
          const trimmedDept = String(emp.dept_id || '').trim();
          const trimmedDiv = String(emp.division || '').trim();

          if (trimmedDept !== '') {
            // 1. Try to find department in the specific division first
            if (trimmedDiv !== '') {
              const [matchedInDiv]: any = await connection.query(
                "SELECT dept_id FROM tbl_departments WHERE division = ? AND (dept_name = ? OR dept_id = ?) LIMIT 1",
                [trimmedDiv, trimmedDept, trimmedDept]
              );
              if (matchedInDiv.length > 0) {
                finalDeptId = matchedInDiv[0].dept_id;
              }
            }

            // 2. If not found in division, try global search
            if (!finalDeptId) {
              if (deptMap.has(trimmedDept)) {
                finalDeptId = deptMap.get(trimmedDept);
              } else {
                // 3. Auto-create department (Assign division if available)
                const newDeptId = `D-${Math.floor(1000 + Math.random() * 9000)}`;
                await connection.query(
                  'INSERT INTO tbl_departments (dept_id, dept_name, division) VALUES (?, ?, ?)',
                  [newDeptId, trimmedDept, trimmedDiv || null]
                );
                deptMap.set(trimmedDept, newDeptId);
                finalDeptId = newDeptId;
              }
            }
          }

          // 4. Resolve by division + working_at or just working_at
          if (!finalDeptId) {
            // Master Alias Mapping for common "working_at" names that should go to specific departments
            const deptAliasMap: { [key: string]: string } = {
              'ER': 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉินและนิติเวช',
              'อุบัติเหตุ': 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉินและนิติเวช',
              'นิติเวช': 'งานการพยาบาลผู้ป่วยอุบัติเหตุฉุกเฉินและนิติเวช',
              'จ่ายกลาง': 'ซัพพลาย',
              'ซักฟอก': 'ซัพพลาย',
              'คลัง': 'ซัพพลาย',
              'ตึกหญิง': 'หญิง',
              'ตึกชาย': 'ชาย',
              'ตึกพิเศษ': 'พิเศษ',
              'หัตถการ': 'OPD',
              'สูตินรีเวช': 'OPD',
              'หัวหน้ากลุ่มการพยาบาล': 'หัวหน้ากลุ่มงานการพยาบาล',
              'พขร': 'ADM-DRV',
              'ขับรถ': 'ADM-DRV',
              'โสต': 'ADM-AV'
            };

            if (emp.working_at) {
              const trimmedWorkAt = String(emp.working_at).trim();
              if (trimmedWorkAt !== '') {
                // Check alias map first
                let searchName = trimmedWorkAt;
                for (const [alias, official] of Object.entries(deptAliasMap)) {
                  if (trimmedWorkAt.includes(alias)) {
                    searchName = official;
                    break;
                  }
                }

                if (trimmedDiv !== '') {
                  const [matchedByWorkAt]: any = await connection.query(
                    "SELECT dept_id FROM tbl_departments WHERE division = ? AND (dept_name = ? OR dept_name LIKE ? OR dept_id = ?) LIMIT 1",
                    [trimmedDiv, searchName, `%${searchName}%`, searchName]
                  );
                  if (matchedByWorkAt.length > 0) {
                    finalDeptId = matchedByWorkAt[0].dept_id;
                  }
                } else {
                  const [matchedByWorkAt]: any = await connection.query(
                    "SELECT dept_id FROM tbl_departments WHERE (dept_name = ? OR dept_name LIKE ? OR dept_id = ?) LIMIT 1",
                    [searchName, `%${searchName}%`, searchName]
                  );
                  if (matchedByWorkAt.length > 0) {
                    finalDeptId = matchedByWorkAt[0].dept_id;
                  }
                }
              }
            }

            // 5. If still not resolved, pick the first department in this division as default (only if division is provided)
            if (!finalDeptId && trimmedDiv !== '') {
              const [existingDept]: any = await connection.query(
                "SELECT dept_id FROM tbl_departments WHERE division = ? LIMIT 1",
                [trimmedDiv]
              );
              
              if (existingDept.length > 0) {
                finalDeptId = existingDept[0].dept_id;
              } else {
                // Create a default department named after the division
                const newDeptId = `DIV-${Math.floor(1000 + Math.random() * 9000)}`;
                await connection.query(
                  "INSERT INTO tbl_departments (dept_id, division, dept_name) VALUES (?, ?, ?)",
                  [newDeptId, trimmedDiv, trimmedDiv]
                );
                finalDeptId = newDeptId;
              }
            }
          }
          // ---------------------------------------------


          // Resolve pos_id
          let finalPosId = null;
          if (emp.pos_id) {
            let trimmedPos = String(emp.pos_id).trim();
            if (trimmedPos !== '') {
              // Abbreviation Mapping
              const posAbbr: { [key: string]: string } = {
                'นวก.': 'นักวิชาการ',
                'จพ.': 'เจ้าพนักงาน',
                'พ.ช่วยเหลือคนไข้ ส 1': 'พนักงานช่วยเหลือคนไข้สนับสนุน 1',
                'พขร.': 'พนักงานขับรถ',
                'พขร': 'พนักงานขับรถ',
                'พกส.': 'พนักงานกระทรวงสาธารณสุข',
                'พกส': 'พนักงานกระทรวงสาธารณสุข',
                'พ.': 'พนักงาน'
              };

              for (const [abbr, full] of Object.entries(posAbbr)) {
                if (trimmedPos.startsWith(abbr)) {
                  trimmedPos = trimmedPos.replace(abbr, full);
                  break;
                }
              }

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
          let finalGender = String(emp.gender || '').trim();
          if (['ชาย', 'Male', 'M'].includes(finalGender)) {
            finalGender = 'ชาย';
          } else if (['หญิง', 'Female', 'F'].includes(finalGender)) {
            finalGender = 'หญิง';
          } else {
            // Check if gender field contains clues, or fallback to prefix
            if (finalGender.includes('หญิง') || finalGender.includes('นาง') || finalGender.includes('น.ส.') || finalGender.includes('นส.') || finalGender.includes('นส')) {
              finalGender = 'หญิง';
            } else if (finalGender.includes('ชาย') || finalGender.includes('นาย')) {
              finalGender = 'ชาย';
            } else {
              const prefix = rawPrefix;
              if (['นาง', 'นางสาว', 'น.ส.', 'นส.', 'นส', 'ด.ญ.', 'เด็กหญิง', 'พญ.'].includes(prefix)) {
                finalGender = 'หญิง';
              } else {
                finalGender = 'ชาย';
              }
            }

          }

          // Resolve Position Number
          const finalPositionNo = emp.position_no && String(emp.position_no).trim() !== '' ? String(emp.position_no).trim() : '-';

          // Resolve Start Date
          const finalStartDate = emp.start_date && String(emp.start_date).trim() !== '' ? emp.start_date : null;

          // Resolve Citizen ID
          const finalCitizenId = emp.citizen_id && String(emp.citizen_id).trim() !== '' ? String(emp.citizen_id).trim() : null;

          // Check if employee with same First/Last name already exists in DB
          if (trimmedFirst && trimmedLast) {
            const [existingEmp]: any = await connection.query(
              'SELECT emp_id FROM tbl_employees WHERE TRIM(first_name_th) = ? AND TRIM(last_name_th) = ? LIMIT 1',
              [trimmedFirst, trimmedLast]
            );
            
            if (existingEmp.length > 0) {
              const existingId = existingEmp[0].emp_id;
              
              const updateSql = `UPDATE tbl_employees SET 
                prefix = ?, nickname = ?, birth_date = ?, gender = ?, address = ?, citizen_id = ?, 
                phone = ?, email = ?, emp_type = ?, dept_id = ?, pos_id = ?, start_date = ?, 
                status = ?, position_no = ?, admission_date = ?, retirement_date = ?, working_at = ?
                WHERE emp_id = ?`;
                
              const updateValues = [
                rawPrefix || '',
                emp.nickname || null,
                emp.birth_date && emp.birth_date !== '' ? emp.birth_date : '1900-01-01',
                finalGender,
                emp.address || '',
                finalCitizenId,
                emp.phone || null,
                emp.email || null,
                emp.emp_type || 'พนักงานราชการ',
                finalDeptId,
                finalPosId,
                finalStartDate,
                emp.status || 'ทำงานปกติ',
                finalPositionNo,
                emp.admission_date || null,
                emp.retirement_date || null,
                emp.working_at || null,
                existingId
              ];
              
              await connection.query(updateSql, updateValues);
              
              // Process licenses if provided
              if (emp.licenses && Array.isArray(emp.licenses) && emp.licenses.length > 0) {
                await connection.query('DELETE FROM tbl_employee_licenses WHERE emp_id = ?', [existingId]);
                for (const lic of emp.licenses) {
                  const licSql = `INSERT INTO tbl_employee_licenses 
                    (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, file_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                  const licValues = [
                    existingId, 
                    lic.license_name || null, 
                    lic.license_type || null, 
                    lic.license_no || null,
                    lic.institution || null, 
                    lic.issue_date || null, 
                    lic.expire_date || null,
                    lic.status || 'ปกติ', 
                    null
                  ];
                  await connection.query(licSql, licValues);
                }
              }
              
              updateCount++;
              successCount++;
              continue; // Skip Insert
            }
          }

          // Map values
          const values = [
            finalEmpId,
            rawPrefix || '',
            trimmedFirst || '',
            trimmedLast || '',
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

          insertCount++;
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
        updateCount,
        insertCount,
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
