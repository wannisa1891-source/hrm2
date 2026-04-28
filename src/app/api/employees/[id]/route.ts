import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';
import nodemailer from 'nodemailer'; // เพิ่ม nodemailer เข้ามา

export const dynamic = 'force-dynamic';

// --- ฟังก์ชันช่วยเหลือสำหรับส่งอีเมล ---
async function sendEmailNotification(to: string, employeeName: string, newPassword?: string) {
  // ตั้งค่าการเชื่อมต่อกับ Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'อีเมลของคุณ@gmail.com', // *** เปลี่ยนเป็น Gmail ของคุณ ***
      pass: 'xxxx xxxx xxxx xxxx'  // *** เปลี่ยนเป็นรหัส App Password 16 หลักที่ก๊อปมา ***
    }
  });

  const mailOptions = {
    from: '"HR System" <อีเมลของคุณ@gmail.com>',
    to: to,
    subject: 'แจ้งเตือน: ข้อมูลพนักงานของคุณได้รับการอัปเดต',
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>สวัสดีคุณ ${employeeName}</h2>
        <p>ขณะนี้เจ้าหน้าที่ได้ทำการอัปเดตข้อมูลพนักงานของคุณในระบบ HRM เรียบร้อยแล้ว</p>
        ${newPassword ? `
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
            <p style="margin: 0;"><b>รหัสผ่านใหม่ของคุณคือ:</b> <span style="color: #d9534f; font-size: 1.2em;">${newPassword}</span></p>
          </div>
          <p style="color: #888;">* กรุณาเปลี่ยนรหัสผ่านทันทีหลังจากเข้าสู่ระบบเพื่อความปลอดภัย</p>
        ` : ''}
        <p>คุณสามารถเข้าตรวจสอบข้อมูลล่าสุดได้ที่หน้าเว็บไซต์ของบริษัท</p>
        <hr>
        <p style="font-size: 0.8em; color: #aaa;">นี่เป็นอีเมลอัตโนมัติ กรุณาอย่าตอบกลับ</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let empId = params.id;
  if (!empId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const formData = await req.formData();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    let imageName: string | null = null;
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      const ext = path.extname(imageFile.name);
      imageName = `${Date.now()}${ext}`;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, imageName), buffer);
    }

    const d = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string]));

    let licenses: any[] = [];
    if (d.licenses_data) {
      try { licenses = JSON.parse(d.licenses_data); } catch (e) { }
    }
    let trainings: any[] = [];
    if (d.trainings_data) {
      try { trainings = JSON.parse(d.trainings_data); } catch (e) { }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [existingRows] = await connection.query('SELECT * FROM tbl_employees WHERE emp_id = ?', [empId]);
      if ((existingRows as any[]).length === 0) {
        throw new Error('Employee not found');
      }
      const existing = (existingRows as any[])[0];

      let updateFields = [
        `prefix = ?`, `first_name_th = ?`, `last_name_th = ?`, `nickname = ?`,
        `birth_date = ?`, `gender = ?`, `address = ?`, `citizen_id = ?`, `phone = ?`, `email = ?`, `role = ?`,
        `emp_type = ?`, `dept_id = ?`, `pos_id = ?`, `start_date = ?`, `admission_date = ?`, `retirement_date = ?`, 
        `status = ?`, `position_no = ?`,
        `quota_personal = ?`, `quota_vacation = ?`, `quota_sick = ?`, `working_at = ?`
      ];

      const safeVal = (v: any, fallback: any) => (v === undefined || v === null || v === 'null' || v === 'undefined') ? fallback : v;

      const values: any[] = [
        safeVal(d.prefix, existing.prefix),
        safeVal(d.first_name_th, existing.first_name_th),
        safeVal(d.last_name_th, existing.last_name_th),
        safeVal(d.nickname, existing.nickname),
        (d.birth_date && d.birth_date !== '' && d.birth_date !== 'null') ? d.birth_date : (existing.birth_date || '1900-01-01'),
        safeVal(d.gender, existing.gender),
        safeVal(d.address, existing.address),
        (() => {
          const cid = d.id_card || d.citizen_id;
          if (cid === undefined || cid === 'undefined') return existing.citizen_id;
          if (cid === null || cid === 'null' || cid.trim() === '') return null;
          return cid.trim();
        })(),
        safeVal(d.phone, existing.phone),
        safeVal(d.email, existing.email),
        safeVal(d.role, existing.role),
        safeVal(d.emp_type, existing.emp_type),
        safeVal(d.dept_id, existing.dept_id),
        safeVal(d.pos_id, existing.pos_id),
        safeVal(d.start_date, existing.start_date),
        safeVal(d.admission_date, existing.admission_date),
        safeVal(d.retirement_date, existing.retirement_date),
        safeVal(d.status, existing.status),
        (() => {
          const pno = d.position_no;
          if (pno === undefined || pno === 'undefined') return existing.position_no;
          if (pno === null || pno === 'null' || pno.trim() === '') return '-';
          return pno.trim();
        })(),
        d.quota_personal ? parseInt(d.quota_personal) : existing.quota_personal,
        d.quota_vacation ? parseInt(d.quota_vacation) : existing.quota_vacation,
        d.quota_sick ? parseInt(d.quota_sick) : existing.quota_sick,
        safeVal(d.working_at, existing.working_at)
      ];

      if (imageName) {
        updateFields.push(`image = ?`);
        values.push(imageName);
      }

      // Automatic credentials: Username = Citizen ID, Password = DDMMYYYY (BE) from birth_date
      const citizenId = d.id_card || d.citizen_id || existing.citizen_id;
      if (citizenId && !existing.username) {
        updateFields.push(`username = ?`);
        values.push(citizenId);
      }

      // ตรวจสอบการเปลี่ยนรหัสผ่าน หรือกำหนดรหัสผ่านอัตโนมัติ
      let rawPassword = "";
      let autoPassword = "";
      const birthDate = d.birth_date || existing.birth_date;
      
      if (birthDate && String(birthDate).includes('-')) {
        const parts = String(birthDate).split('T')[0].split('-'); // [YYYY, MM, DD]
        if (parts.length === 3) {
          const beYear = parseInt(parts[0]) + 543;
          autoPassword = `${parts[2]}${parts[1]}${beYear}`; // DDMMYYYY (BE)
        }
      }

      if (d.password && d.password.trim() !== '') {
        rawPassword = d.password;
        const hashedPassword = crypto.createHash('sha256').update(d.password).digest('hex');
        updateFields.push(`password = ?`);
        values.push(hashedPassword);
      } else if (autoPassword && (!existing.password || existing.password === '')) {
        // กำหนดรหัสผ่านอัตโนมัติเฉพาะกรณีที่ยังไม่มีรหัสผ่าน
        const hashedPassword = crypto.createHash('sha256').update(autoPassword).digest('hex');
        updateFields.push(`password = ?`);
        values.push(hashedPassword);
      }

      // Check if emp_id has changed
      let newEmpId = empId;
      if (d.emp_id && d.emp_id !== empId) {
        newEmpId = d.emp_id;
        updateFields.push(`emp_id = ?`);
        // Insert newEmpId before the last element of values (which is empId for WHERE clause)
        values.push(newEmpId); 
      }

      // Re-order values to match SET fields + WHERE clause
      // The last value in 'values' should be the original 'empId' for the WHERE clause
      const finalValues = [...values, empId];

      const sql = `UPDATE tbl_employees SET ${updateFields.join(', ')} WHERE emp_id = ?`;
      await connection.query(sql, finalValues);

      // If emp_id changed, update references in other tables
      if (newEmpId !== empId) {
        await connection.query('UPDATE tbl_employee_licenses SET emp_id = ? WHERE emp_id = ?', [newEmpId, empId]);
        await connection.query('UPDATE tbl_employee_trainings SET emp_id = ? WHERE emp_id = ?', [newEmpId, empId]);
        await connection.query('UPDATE tbl_leaves SET emp_id = ? WHERE emp_id = ?', [newEmpId, empId]);
        await connection.query('UPDATE tbl_payroll SET emp_id = ? WHERE emp_id = ?', [newEmpId, empId]);
        await connection.query('UPDATE tbl_transfers SET emp_id = ? WHERE emp_id = ?', [newEmpId, empId]);
        await connection.query('UPDATE tbl_notifications SET emp_id = ? WHERE emp_id = ?', [newEmpId, empId]);
        
        // Use the new ID for subsequent queries in this request (licenses/trainings)
        empId = newEmpId; 
      }

      await connection.query('DELETE FROM tbl_employee_licenses WHERE emp_id = ?', [empId]);

      if (licenses.length > 0) {
        for (let i = 0; i < licenses.length; i++) {
          const fileCountStr = formData.get(`license_file_count_${i}`);
          const fileCount = fileCountStr ? parseInt(fileCountStr as string) : 0;
          let fileNames: string[] = [];

          if (fileCount > 0) {
            for (let j = 0; j < fileCount; j++) {
              const licFile = formData.get(`license_file_${i}_${j}`) as File | null;
              if (licFile && licFile.size > 0) {
                const ext = path.extname(licFile.name);
                const licFileName = `lic_${empId}_${i}_${j}_${Date.now()}${ext}`;
                const buffer = Buffer.from(await licFile.arrayBuffer());
                fs.writeFileSync(path.join(uploadDir, licFileName), buffer);
                fileNames.push(licFileName);
              }
            }
          } else {
            // Backward compatibility
            const licFile = formData.get(`license_file_${i}_0`) || formData.get(`license_file_${i}`) as File | null;
            if (licFile && (licFile as File).size > 0) {
              const ext = path.extname((licFile as File).name);
              const licFileName = `lic_${empId}_${i}_${Date.now()}${ext}`;
              const buffer = Buffer.from(await (licFile as File).arrayBuffer());
              fs.writeFileSync(path.join(uploadDir, licFileName), buffer);
              fileNames.push(licFileName);
            } else if (licenses[i].file_path) {
              try {
                const parsed = JSON.parse(licenses[i].file_path);
                if (Array.isArray(parsed)) {
                  fileNames = parsed;
                } else {
                  fileNames.push(licenses[i].file_path);
                }
              } catch (e) {
                fileNames.push(licenses[i].file_path);
              }
            }
          }

          const lic = licenses[i];
          const licSql = `INSERT INTO tbl_employee_licenses 
            (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const finalFilePath = fileNames.length > 0 ? JSON.stringify(fileNames) : null;
          const licValues = [
            empId, lic.license_name || null, lic.license_type || null, lic.license_no || null,
            lic.institution || null, lic.issue_date || null, lic.expire_date || null,
            lic.status || 'ปกติ', finalFilePath
          ];
          await connection.query(licSql, licValues);
        }
      }

      await connection.query('DELETE FROM tbl_employee_trainings WHERE emp_id = ?', [empId]);
      if (trainings.length > 0) {
        for (let i = 0; i < trainings.length; i++) {
          let certFile: string | null = null;
          let imgFile: string | null = null;
          
          const cf = formData.get(`training_cert_${i}`) as File | null;
          if (cf && cf.size > 0) {
            const ext = path.extname(cf.name);
            certFile = `tr_cert_${empId}_${i}_${Date.now()}${ext}`;
            fs.writeFileSync(path.join(uploadDir, certFile), Buffer.from(await cf.arrayBuffer()));
          } else { certFile = trainings[i].certificate_file || null; }

          const imf = formData.get(`training_img_${i}`) as File | null;
          if (imf && imf.size > 0) {
            const ext = path.extname(imf.name);
            imgFile = `tr_img_${empId}_${i}_${Date.now()}${ext}`;
            fs.writeFileSync(path.join(uploadDir, imgFile), Buffer.from(await imf.arrayBuffer()));
          } else { imgFile = trainings[i].image_file || null; }

          const tr = trainings[i];
          const trSql = `INSERT INTO tbl_employee_trainings 
            (emp_id, course_name, institution, location, start_date, end_date, certificate_file, image_file)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          const trValues = [
            empId, tr.course_name, tr.institution || null, tr.location || null,
            tr.start_date || null, tr.end_date || null, certFile, imgFile
          ];
          await connection.query(trSql, trValues);
        }
      }

      await connection.commit();

      // --- ส่วนการส่งอีเมล: ทำงานหลังจาก Commit สำเร็จ ---
      if (d.email) {
        try {
          const fullName = `${d.first_name_th} ${d.last_name_th}`;
          await sendEmailNotification(d.email, fullName, rawPassword || undefined);
        } catch (mailError) {
          console.error("Mail Error:", mailError);
          // ไม่ต้อง throw error เพื่อให้ผลลัพธ์การบันทึก DB ยังถือว่าสำเร็จ
        }
      }

      await logAudit(req.headers.get('x-user-id'), `แก้ไขข้อมูลพนักงาน: ${empId}`, connection);
      connection.release();
      return NextResponse.json({ message: '✅ อัปเดตข้อมูลสำเร็จ !', image: imageName });

    } catch (e: any) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const empId = params.id;
  if (!empId) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM tbl_employee_licenses WHERE emp_id = ?', [empId]);
      await connection.query('DELETE FROM tbl_employees WHERE emp_id = ?', [empId]);
      await connection.commit();
      await logAudit(req.headers.get('x-user-id'), `ลบข้อมูลพนักงาน: ${empId}`, connection);
      connection.release();
      return NextResponse.json({ message: '✅ ลบข้อมูลพนักงานสำเร็จ!' });
    } catch (e: any) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}