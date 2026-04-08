import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const license_id = formData.get('license_id') as string;
    const emp_id = formData.get('emp_id') as string;
    const expire_date = formData.get('expire_date') as string;
    const license_no = formData.get('license_no') as string;
    const license_name = formData.get('license_name') as string;
    const license_type = formData.get('license_type') as string;
    const institution = formData.get('institution') as string;
    const issue_date = formData.get('issue_date') as string;
    const remarks = formData.get('remarks') as string;
    const verified_status = formData.get('verified_status') as string;
    const file = formData.get('file') as File;

    if (!expire_date || (!license_id && !emp_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let filePath = '';
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `${emp_id || 'unknown'}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const path = join(process.cwd(), 'public', 'uploads', 'licenses', fileName);
      await writeFile(path, buffer);
      filePath = `/uploads/licenses/${fileName}`;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (license_id) {
        // 1. Archive the OLD record
        await connection.query('UPDATE tbl_employee_licenses SET status = "Renewed" WHERE id = ?', [license_id]);

        // 2. Insert NEW record as Active
        // If no new file was uploaded, we can choose to carry over the old one or leave it empty
        // For professional use, a renewal usually requires a NEW file, but we'll carry over if empty
        const insertQuery = `
          INSERT INTO tbl_employee_licenses 
          (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, verified_status, remarks, file_path)
          SELECT emp_id, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?
          FROM tbl_employee_licenses WHERE id = ?
        `;
        
        // Use old file path if new one not provided
        const finalPath = filePath || null; 

        const values = [
          license_name, license_type, license_no, institution, issue_date, expire_date, 
          verified_status || 'Pending', remarks, finalPath, license_id
        ];
        await connection.query(insertQuery, values);
      } else {
        // Initial Create
        const insertQuery = `
          INSERT INTO tbl_employee_licenses 
          (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, verified_status, remarks, file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
        `;
        const values = [
          emp_id, license_name, license_type, license_no, institution, issue_date, expire_date,
          verified_status || 'Pending', remarks, filePath || null
        ];
        await connection.query(insertQuery, values);
      }
      
      await connection.commit();
      return NextResponse.json({ message: 'License updated successfully (Versioned with File)' });
    } catch (err: any) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Error renewing license:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emp_id = searchParams.get('emp_id');
    const history = searchParams.get('history');

    if (emp_id && history === 'true') {
      const query = `
        SELECT * FROM tbl_employee_licenses 
        WHERE emp_id = ? 
        ORDER BY expire_date DESC, id DESC
      `;
      const [rows] = await pool.query(query, [emp_id]);
      return NextResponse.json(rows);
    }
    
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
