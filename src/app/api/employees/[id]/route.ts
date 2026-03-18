import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

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

    let licenseFileName: string | undefined;
    const licenseFile = formData.get('license_file') as File | null;
    if (licenseFile && licenseFile.size > 0) {
      const ext = path.extname(licenseFile.name);
      licenseFileName = `lic_${Date.now()}${ext}`;
      const buffer = Buffer.from(await licenseFile.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, licenseFileName), buffer);
    }

    const d = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string])
    );

    const finalImage = imageName ?? (d.image || null);
    const finalLicenseFile = licenseFileName ?? (d.license_file || null);

    const sql = `UPDATE tbl_employees SET 
      prefix=?, first_name_th=?, last_name_th=?, first_name_en=?, last_name_en=?,
      birth_date=?, gender=?, address=?, 
      citizen_id=?, phone=?, 
      emp_type=?, dept_id=?, pos_id=?, start_date=?, base_salary=?, image=?,
      has_license=?, license_no=?, license_expire=?, license_name=?, license_type=?, 
      license_institution=?, license_issue_date=?, license_status=?, license_file=?, cneu_cme_points=?
      WHERE emp_id=?`;

    const values = [
      d.prefix || '-', d.first_name_th || '', d.last_name_th || '', d.first_name_en || '', d.last_name_en || '',
      d.birth_date || null, d.gender || 'ชาย', d.address || '', 
      d.id_card || d.citizen_id || '0000000000000', d.phone || '', 
      d.emp_type || 'พนักงานประจำ', d.dept_id || null, d.pos_id || null, d.start_date || null, d.base_salary || 0, finalImage,
      d.has_license === 'true' ? 1 : 0, d.license_no || null, d.license_expire || null,
      d.license_name || null, d.license_type || null, d.license_institution || null,
      d.license_issue_date || null, d.license_status || null, finalLicenseFile,
      d.cneu_cme_points ? parseFloat(d.cneu_cme_points) : 0,
      empId,
    ];

    await pool.query(sql, values);
    return NextResponse.json({ message: '✅ แก้ไขสำเร็จ!' });
  } catch (err: any) {
    console.error('Error updating employee:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}

// DELETE /api/employees/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query('DELETE FROM tbl_employees WHERE emp_id = ?', [params.id]);
    return NextResponse.json({ message: '✅ ลบสำเร็จ!' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
