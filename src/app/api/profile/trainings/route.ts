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
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;
    const certificateFile = formData.get('certificate_file') as File;

    if (!emp_id || !course_name) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    let filePath = null;

    if (certificateFile && certificateFile.size > 0) {
      const buffer = Buffer.from(await certificateFile.arrayBuffer());
      const filename = `${Date.now()}-${certificateFile.name}`;
      const uploadDir = join(process.cwd(), 'public/uploads');
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      filePath = filename;
    }

    const [result] = await pool.query(
      `INSERT INTO tbl_employee_trainings 
      (emp_id, course_name, institution, start_date, end_date, certificate_file)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [emp_id, course_name, institution, start_date || null, end_date || null, filePath]
    );

    return NextResponse.json({ success: true, message: 'บันทึกประวัติการอบรมเรียบร้อยแล้ว' });

  } catch (error: any) {
    console.error('Error adding training:', error);
    return NextResponse.json({ success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }
}
