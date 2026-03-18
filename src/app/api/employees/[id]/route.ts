import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'; // Disable Next.js caching

// PUT /api/employees/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const empId = params.id;
    const formData = await req.formData();
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    let imageName: string | undefined;
    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      const ext = path.extname(imageFile.name);
      imageName = `${Date.now()}${ext}`;
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, imageName), buffer);
    }

    const d = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string])
    );

    let licenses: any[] = [];
    if (d.licenses_data) {
      try { licenses = JSON.parse(d.licenses_data); } catch(e) {}
    }

    const finalImage = imageName ?? (d.image || null);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `UPDATE tbl_employees SET 
        prefix=?, first_name_th=?, last_name_th=?, first_name_en=?, last_name_en=?,
        birth_date=?, gender=?, address=?, citizen_id=?, phone=?, 
        emp_type=?, dept_id=?, pos_id=?, start_date=?, base_salary=?, image=?, cneu_cme_points=?
        WHERE emp_id=?`;

      const values = [
        d.prefix || '-', d.first_name_th || '', d.last_name_th || '', d.first_name_en || '', d.last_name_en || '',
        d.birth_date || null, d.gender || 'ชาย', d.address || '', 
        d.id_card || d.citizen_id || '0000000000000', d.phone || '', 
        d.emp_type || 'พนักงานประจำ', d.dept_id || null, d.pos_id || null, d.start_date || null, d.base_salary || 0, finalImage,
        d.cneu_cme_points ? parseFloat(d.cneu_cme_points) : 0,
        empId,
      ];
      await connection.query(sql, values);

      // Process licenses
      const existingLicenseIds = licenses.filter(l => l.id).map(l => l.id);
      
      if (existingLicenseIds.length > 0) {
        // Delete licenses that are NOT in the incoming array
        await connection.query(
          `DELETE FROM tbl_employee_licenses WHERE emp_id = ? AND id NOT IN (?)`,
          [empId, existingLicenseIds]
        );
      } else {
        // if no existing licenses were sent back, it means user removed all of them
        await connection.query(`DELETE FROM tbl_employee_licenses WHERE emp_id = ?`, [empId]);
      }

      for (let i = 0; i < licenses.length; i++) {
        const lic = licenses[i];
        let licFileName: string | undefined = undefined;
        
        // Check if there is a NEW uploaded file for this index
        const licFile = formData.get(`license_file_${i}`) as File | null;
        if (licFile && licFile.size > 0) {
          const ext = path.extname(licFile.name);
          licFileName = `lic_${empId}_${i}_${Date.now()}${ext}`;
          const buffer = Buffer.from(await licFile.arrayBuffer());
          fs.writeFileSync(path.join(uploadDir, licFileName), buffer);
        }

        const finalLicFile = licFileName ?? lic.file_path ?? null;

        if (lic.id) {
          // Update existing
          const licSql = `UPDATE tbl_employee_licenses 
            SET license_name=?, license_type=?, license_no=?, institution=?, issue_date=?, expire_date=?, status=?, file_path=?
            WHERE id=? AND emp_id=?`;
          await connection.query(licSql, [
            lic.license_name || null, lic.license_type || null, lic.license_no || null, lic.institution || null,
            lic.issue_date || null, lic.expire_date || null, lic.status || 'Active', finalLicFile,
            lic.id, empId
          ]);
        } else {
          // Insert new
          const licSql = `INSERT INTO tbl_employee_licenses 
            (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          await connection.query(licSql, [
            empId, lic.license_name || null, lic.license_type || null, lic.license_no || null, lic.institution || null,
            lic.issue_date || null, lic.expire_date || null, lic.status || 'Active', finalLicFile
          ]);
        }
      }

      await connection.commit();
      connection.release();
      return NextResponse.json({ message: '✅ แก้ไขสำเร็จ!' });
    } catch (err: any) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err: any) {
    console.error('Error updating employee:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}

// DELETE /api/employees/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Foreign key ON DELETE CASCADE will handle tbl_employee_licenses deletion
    await pool.query('DELETE FROM tbl_employees WHERE emp_id = ?', [params.id]);
    return NextResponse.json({ message: '✅ ลบสำเร็จ!' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
