import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const empId = params.id;
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
      try { licenses = JSON.parse(d.licenses_data); } catch(e) {}
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let updateFields = [
        `prefix = ?`, `first_name_th = ?`, `last_name_th = ?`, `first_name_en = ?`, `last_name_en = ?`,
        `birth_date = ?`, `gender = ?`, `address = ?`, `citizen_id = ?`, `phone = ?`, `email = ?`, `role = ?`,
        `emp_type = ?`, `dept_id = ?`, `pos_id = ?`, `start_date = ?`, `base_salary = ?`, `status = ?`, `cneu_cme_points = ?`
      ];
      
      const values: any[] = [
        d.prefix || '-', d.first_name_th || '', d.last_name_th || '', d.first_name_en || '', d.last_name_en || '',
        d.birth_date || null, d.gender || 'ชาย', d.address || '', d.id_card || d.citizen_id || '0000000000000', 
        d.phone || '', d.email || null, d.role || 'User',
        d.emp_type || 'พนักงานประจำ', d.dept_id || null, d.pos_id || null, d.start_date || null,
        d.base_salary || 0, d.status || 'Active', d.cneu_cme_points ? parseFloat(d.cneu_cme_points) : 0
      ];

      if (imageName) {
        updateFields.push(`image = ?`);
        values.push(imageName);
      }

      // If user typed a new password, hash it and update
      if (d.password && d.password.trim() !== '') {
        const hashedPassword = crypto.createHash('sha256').update(d.password).digest('hex');
        updateFields.push(`password = ?`);
        values.push(hashedPassword);
      }

      values.push(empId);

      const sql = `UPDATE tbl_employees SET ${updateFields.join(', ')} WHERE emp_id = ?`;
      await connection.query(sql, values);

      // Handle Licenses: Delete old ones and re-insert the provided array
      await connection.query('DELETE FROM tbl_employee_licenses WHERE emp_id = ?', [empId]);

      if (licenses.length > 0) {
        for (let i = 0; i < licenses.length; i++) {
          let licFileName: string | null = null;
          const licFile = formData.get(`license_file_${i}`) as File | null;
          if (licFile && licFile.size > 0) {
            const ext = path.extname(licFile.name);
            licFileName = `lic_${empId}_${i}_${Date.now()}${ext}`;
            const buffer = Buffer.from(await licFile.arrayBuffer());
            fs.writeFileSync(path.join(uploadDir, licFileName), buffer);
          } else {
             licFileName = licenses[i].file_path || null;
          }

          const lic = licenses[i];
          const licSql = `INSERT INTO tbl_employee_licenses 
            (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const licValues = [
            empId, lic.license_name || null, lic.license_type || null, lic.license_no || null,
            lic.institution || null, lic.issue_date || null, lic.expire_date || null,
            lic.status || 'Active', licFileName
          ];
          await connection.query(licSql, licValues);
        }
      }

      await connection.commit();
      await logAudit(req.headers.get('x-user-id'), `แก้ไขข้อมูลพนักงาน: ${empId}`, connection);
      connection.release();
      return NextResponse.json({ message: '✅ อัปเดตข้อมูลพนักงานสำเร็จ!' });
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
    } catch(e: any) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
