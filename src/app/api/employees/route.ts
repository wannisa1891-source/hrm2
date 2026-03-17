import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Removed deprecated router config

// GET /api/employees
export async function GET() {
  try {
    const [rows] = await pool.query('SELECT * FROM tbl_employees ORDER BY emp_id DESC');
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/employees  (multipart/form-data)
export async function POST(req: NextRequest) {
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

    const d = Object.fromEntries(
      [...formData.entries()].filter(([, v]) => typeof v === 'string').map(([k, v]) => [k, v as string])
    );

    const sql = `INSERT INTO tbl_employees 
      (emp_id, prefix, first_name_th, last_name_th, first_name_en, last_name_en, 
       birth_date, gender, address, addr_no, addr_moo, addr_village, addr_soi, addr_road,
       addr_province, addr_district, addr_subdistrict, addr_zipcode,
       citizen_id, phone, email, password, role,
       emp_type, dept_id, pos_id, start_date, base_salary, status, image,
       has_license, license_no, license_expire) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)`;

    const values = [
      d.emp_id || '', d.prefix || '-', d.first_name_th || '', d.last_name_th || '',
      d.first_name_en || '', d.last_name_en || '',
      d.birth_date || null, d.gender || 'ชาย', d.address || '',
      d.addr_no || null, d.addr_moo || null, d.addr_village || null, d.addr_soi || null, d.addr_road || null,
      d.addr_province || null, d.addr_district || null, d.addr_subdistrict || null, d.addr_zipcode || null,
      d.id_card || d.citizen_id || '0000000000000', d.phone || '',
      d.email || null, d.password || null, d.role || 'User',
      d.emp_type || 'พนักงานประจำ', d.dept_id || null, d.pos_id || null, d.start_date || null,
      d.base_salary || 0, imageName,
      d.has_license === 'true' ? 1 : 0, d.license_no || null, d.license_expire || null
    ];

    await pool.query(sql, values);
    return NextResponse.json({ message: '✅ บันทึกพนักงานใหม่สำเร็จ!' });
  } catch (err: any) {
    console.error('Error creating employee:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}
