import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    console.log('--- License Renew API: Received Data ---');
    
    const license_id = formData.get('license_id') as string;
    const emp_id = formData.get('emp_id') as string;
    const expire_date = formData.get('expire_date') as string;
    const license_no = formData.get('license_no') as string;
    const license_name = formData.get('license_name') as string;
    const license_type = formData.get('license_type') as string;
    const institution = formData.get('institution') as string;
    const issuer = formData.get('issuer') as string;
    const issue_date = formData.get('issue_date') as string;
    const remarks = formData.get('remarks') as string;
    const warning_days_override = formData.get('warning_days_override') as string;
    const verified_status = formData.get('verified_status') as string;
    const file = formData.get('file') as File;

    console.log({ license_id, emp_id, license_name, expire_date });

    if (!expire_date || (!license_id && !emp_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let filePath = '';
    if (file && file.size > 0) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${emp_id || 'unknown'}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const path = join(process.cwd(), 'public', 'uploads', 'licenses', fileName);
        await writeFile(path, buffer);
        filePath = `/uploads/licenses/${fileName}`;
        console.log('File saved to:', filePath);
      } catch (fileErr) {
        console.error('File Upload Error:', fileErr);
      }
    }

    const connection = await pool.getConnection();
    try {
      // --- Improved Self-healing: Ensure required columns exist individually ---
      const [columns]: any = await connection.query("SHOW COLUMNS FROM tbl_employee_licenses");
      const columnNames = columns.map((c: any) => c.Field);
      
      const missing = [];
      if (!columnNames.includes('institution')) missing.push("ADD COLUMN institution VARCHAR(255) AFTER license_no");
      if (!columnNames.includes('issuer')) missing.push("ADD COLUMN issuer VARCHAR(255) AFTER institution");
      if (!columnNames.includes('issue_date')) missing.push("ADD COLUMN issue_date DATE AFTER issuer");
      if (!columnNames.includes('points')) missing.push("ADD COLUMN points DECIMAL(10,2) DEFAULT 0.00 AFTER issue_date");
      if (!columnNames.includes('verified_status')) missing.push("ADD COLUMN verified_status VARCHAR(50) DEFAULT 'Pending' AFTER expire_date");
      if (!columnNames.includes('verified_at')) missing.push("ADD COLUMN verified_at DATETIME AFTER verified_status");
      if (!columnNames.includes('verified_by')) missing.push("ADD COLUMN verified_by VARCHAR(100) AFTER verified_at");
      if (!columnNames.includes('remarks')) missing.push("ADD COLUMN remarks TEXT AFTER verified_by");
      if (!columnNames.includes('warning_days_override')) missing.push("ADD COLUMN warning_days_override INT AFTER remarks");

      if (missing.length > 0) {
        console.log(`Self-healing: Adding ${missing.length} missing columns...`);
        await connection.query(`ALTER TABLE tbl_employee_licenses ${missing.join(', ')}`);
      }

      await connection.beginTransaction();

      const points = formData.get('points') as string;

      if (license_id) {
        console.log('Action: Renewal for License ID', license_id);
        // 1. Archive the OLD record
        await connection.query('UPDATE tbl_employee_licenses SET status = "Renewed" WHERE id = ?', [license_id]);

        // 2. Insert NEW record as Active
        const insertQuery = `
          INSERT INTO tbl_employee_licenses 
          (emp_id, license_name, license_type, license_no, institution, issuer, issue_date, points, expire_date, status, verified_status, remarks, warning_days_override, file_path)
          SELECT emp_id, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?
          FROM tbl_employee_licenses WHERE id = ?
        `;
        
        const values = [
          license_name, license_type, license_no, institution, issuer, issue_date, points || 0, expire_date, 
          verified_status || 'Pending', remarks, warning_days_override || null, filePath || null, license_id
        ];
        await connection.query(insertQuery, values);
      } else {
        console.log('Action: Initial Create for EMP', emp_id);
        const insertQuery = `
          INSERT INTO tbl_employee_licenses 
          (emp_id, license_name, license_type, license_no, institution, issuer, issue_date, points, expire_date, status, verified_status, remarks, warning_days_override, file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?)
        `;
        const values = [
          emp_id, license_name, license_type, license_no, institution, issuer, issue_date, points || 0, expire_date,
          verified_status || 'Pending', remarks, warning_days_override || null, filePath || null
        ];
        await connection.query(insertQuery, values);
      }
      
      await connection.commit();
      console.log('DB Transaction Committed Successfully');
      return NextResponse.json({ message: 'License updated successfully (Versioned with File)' });
    } catch (dbErr: any) {
      await connection.rollback();
      console.error('DB Transaction Error:', dbErr);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (err: any) {
    console.error('Critical API Error:', err);
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
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
