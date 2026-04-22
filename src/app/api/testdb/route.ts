import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET() {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    let dirContents = [];
    try {
      dirContents = fs.readdirSync(uploadDir);
    } catch (e: any) {
      dirContents = [e.message];
    }

    const [matchImage] = await pool.query('SELECT emp_id, image FROM tbl_employees WHERE image LIKE "%1773808015435%"');
    const [matchLicense] = await pool.query('SELECT emp_id, file_path FROM tbl_employee_licenses WHERE file_path LIKE "%1773808015435%"');

    return NextResponse.json({ 
      cwd: process.cwd(),
      uploadDir,
      dirContents,
      matchImage,
      matchLicense
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
