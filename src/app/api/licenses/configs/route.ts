import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(req: NextRequest) {
  try {
    // Ensure table exists (Lazy Migration)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tbl_license_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_name VARCHAR(100) NOT NULL,
        pos_id VARCHAR(50) NULL,
        dept_id VARCHAR(50) NULL,
        license_name VARCHAR(255) NOT NULL,
        valid_years INT DEFAULT 5,
        warning_days INT DEFAULT 90,
        is_mandatory TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [rows]: any = await pool.query('SELECT * FROM tbl_license_configs ORDER BY created_at DESC');
    
    // Auto-Seed if empty
    if (rows.length === 0) {
      console.log('Seeding initial license configurations...');
      const [positions]: any = await pool.query('SELECT pos_id, pos_name FROM tbl_positions WHERE pos_name LIKE ? OR pos_name LIKE ? OR pos_name LIKE ?', ['%พยาบาล%', '%แพทย์%', '%เภสัช%']);
      
      for (const pos of positions) {
        let licenseName = 'ใบประกอบวิชาชีพ';
        if (pos.pos_name.includes('พยาบาล')) licenseName = 'ใบประกอบวิชาชีพการพยาบาลและการผดุงครรภ์';
        if (pos.pos_name.includes('แพทย์')) licenseName = 'ใบประกอบวิชาชีพเวชกรรม';
        if (pos.pos_name.includes('เภสัช')) licenseName = 'ใบประกอบวิชาชีพเภสัชกรรม';

        await pool.query(`
          INSERT INTO tbl_license_configs (config_name, pos_id, license_name, valid_years, warning_days, is_mandatory)
          VALUES (?, ?, ?, 5, 90, 1)
        `, [`เกณฑ์สำหรับ ${pos.pos_name}`, pos.pos_id, licenseName]);
      }
      
      const [newRows] = await pool.query('SELECT * FROM tbl_license_configs ORDER BY created_at DESC');
      return NextResponse.json(newRows);
    }

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Error fetching license configs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const d = await req.json();
    const query = `
      INSERT INTO tbl_license_configs 
      (config_name, pos_id, dept_id, license_name, valid_years, warning_days, is_mandatory)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      d.config_name,
      d.pos_id || null,
      d.dept_id || null,
      d.license_name,
      d.valid_years || 5,
      d.warning_days || 90,
      d.is_mandatory !== undefined ? d.is_mandatory : 1
    ];
    await pool.query(query, values);
    return NextResponse.json({ message: 'License configuration created successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const d = await req.json();
    const query = `
      UPDATE tbl_license_configs 
      SET config_name = ?, pos_id = ?, dept_id = ?, license_name = ?, valid_years = ?, warning_days = ?, is_mandatory = ?
      WHERE id = ?
    `;
    const values = [
      d.config_name,
      d.pos_id || null,
      d.dept_id || null,
      d.license_name,
      d.valid_years || 5,
      d.warning_days || 90,
      d.is_mandatory !== undefined ? d.is_mandatory : 1,
      d.id
    ];
    await pool.query(query, values);
    return NextResponse.json({ message: 'License configuration updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await pool.query('DELETE FROM tbl_license_configs WHERE id = ?', [id]);
    return NextResponse.json({ message: 'License configuration deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
