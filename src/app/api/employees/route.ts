import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrn_db';
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
       birth_date, gender, address, citizen_id, phone, emp_type, 
       dept_id, pos_id, start_date, base_salary, status, image) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?)`;

    const values = [
      d.emp_id, d.prefix, d.first_name_th, d.last_name_th,
      d.first_name_en || '', d.last_name_en || '',
      d.birth_date || null, d.gender || 'ชาย', d.address || '',
      d.id_card || d.citizen_id || '0000000000000', d.phone || '',
      d.emp_type, d.dept_id, d.pos_id, d.start_date || null,
      d.base_salary || 0, imageName,
    ];

    await pool.query(sql, values);
    return NextResponse.json({ message: '✅ บันทึกพนักงานใหม่สำเร็จ!' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
