import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const emp_id = formData.get('emp_id') as string;
    const course_name = formData.get('course_name') as string;
    const institution = formData.get('institution') as string;
    const location = formData.get('location') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const certificateFile = formData.get('certificate_file') as File;
    const imageFile = formData.get('image_file') as File;

    if (!emp_id || !course_name) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    let filePath = null;
    let imagePath = null;
    const uploadDir = join(process.cwd(), 'public/uploads');

    if (certificateFile && certificateFile.size > 0) {
      const buffer = Buffer.from(await certificateFile.arrayBuffer());
      const filename = `${Date.now()}-cert-${certificateFile.name}`;
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      filePath = filename;
    }

    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const filename = `${Date.now()}-img-${imageFile.name}`;
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      imagePath = filename;
    }

    const [result] = await pool.query(
      `INSERT INTO tbl_employee_trainings 
      (emp_id, course_name, institution, location, start_date, end_date, certificate_file, image_file)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [emp_id, course_name, institution, location || null, start_date || null, end_date || null, filePath, imagePath]
    );

    return NextResponse.json({ success: true, message: 'บันทึกประวัติการอบรมเรียบร้อยแล้ว' });

  } catch (error: any) {
    console.error('Error adding training:', error);
    return NextResponse.json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}
