import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await ensureTableExists();
    const [rows] = await pool.query('SELECT * FROM tbl_reimbursements ORDER BY reimbursement_date DESC, id DESC');
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Reimbursement GET API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Auto-create table tbl_reimbursements if it doesn't exist
 */
async function ensureTableExists() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tbl_reimbursements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      reimbursement_date DATE NOT NULL,
      organizer_amount DECIMAL(10, 2) DEFAULT 0,
      parent_amount DECIMAL(10, 2) DEFAULT 0,
      memo_file VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await pool.query(sql);
}

export async function POST(req: NextRequest) {
  try {
    await ensureTableExists();

    const formData = await req.formData();
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const organizerAmount = formData.get('organizer_amount') as string;
    const parentAmount = formData.get('parent_amount') as string;
    const file = formData.get('file') as File | null;

    if (!title || !date) {
      return NextResponse.json({ error: 'กรุณากรอกหัวข้อและวันที่' }, { status: 400 });
    }

    let filePath = null;
    if (file && file.size > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(file.name);
      const fileName = `reimburse_${Date.now()}${ext}`;
      filePath = fileName;
      
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    }

    const [result]: any = await pool.query(
      'INSERT INTO tbl_reimbursements (title, reimbursement_date, organizer_amount, parent_amount, memo_file) VALUES (?, ?, ?, ?, ?)',
      [
        title,
        date,
        parseFloat(organizerAmount) || 0,
        parseFloat(parentAmount) || 0,
        filePath
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId 
    });
  } catch (err: any) {
    console.error('Reimbursement API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
