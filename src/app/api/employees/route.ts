import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic'; // Disable Next.js caching for this route
import crypto from 'crypto';

// GET /api/employees
export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT e.* 
      FROM tbl_employees e
      ORDER BY e.emp_id DESC
    `);
    
    // Fetch all licenses to attach them to employees
    const [licenses] = await pool.query(`
      SELECT * FROM tbl_employee_licenses
    `);

    // Map licenses to their corresponding employees
    const employees = (rows as any[]).map(emp => {
      const empLicenses = (licenses as any[]).filter(l => l.emp_id === emp.emp_id);
      // Determine primary license for table display
      const activeLicenses = empLicenses.filter(l => l.status !== 'Expired' && l.status !== 'Suspended');
      const primaryLicense = activeLicenses.length > 0 ? activeLicenses[0] : (empLicenses.length > 0 ? empLicenses[0] : null);

      return {
        ...emp,
        licenses: empLicenses,
        license_status: primaryLicense ? primaryLicense.status : null,
        license_expire: primaryLicense ? primaryLicense.expire_date : null
      };
    });

    return NextResponse.json(employees);
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

    // Parse licenses array from stringified JSON
    let licenses: any[] = [];
    if (d.licenses_data) {
      try {
        licenses = JSON.parse(d.licenses_data);
      } catch(e) {
        console.error("Failed to parse licenses_data:", e);
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `INSERT INTO tbl_employees 
        (emp_id, prefix, first_name_th, last_name_th, first_name_en, last_name_en, 
         birth_date, gender, address, citizen_id, phone, email, password, role, 
         emp_type, dept_id, pos_id, start_date, base_salary, status, image, cneu_cme_points) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?)`;

      const hashedPassword = d.password ? crypto.createHash('sha256').update(d.password).digest('hex') : '';

      const values = [
        d.emp_id || '', d.prefix || '-', d.first_name_th || '', d.last_name_th || '',
        d.first_name_en || '', d.last_name_en || '',
        d.birth_date || null, d.gender || 'ชาย', d.address || '',
        d.id_card || d.citizen_id || '0000000000000', d.phone || '',
        d.email || null, hashedPassword, d.role || 'User',
        d.emp_type || 'พนักงานประจำ', d.dept_id || null, d.pos_id || null, d.start_date || null,
        d.base_salary || 0, imageName,
        d.cneu_cme_points ? parseFloat(d.cneu_cme_points) : 0
      ];

      await connection.query(sql, values);

      // Insert multiple licenses
      if (licenses.length > 0) {
        for (let i = 0; i < licenses.length; i++) {
          let licFileName: string | null = null;
          // Check if there is an uploaded file for this specific license index
          const licFile = formData.get(`license_file_${i}`) as File | null;
          if (licFile && licFile.size > 0) {
            const ext = path.extname(licFile.name);
            licFileName = `lic_${d.emp_id}_${i}_${Date.now()}${ext}`;
            const buffer = Buffer.from(await licFile.arrayBuffer());
            fs.writeFileSync(path.join(uploadDir, licFileName), buffer);
          }

          const lic = licenses[i];
          const licSql = `INSERT INTO tbl_employee_licenses 
            (emp_id, license_name, license_type, license_no, institution, issue_date, expire_date, status, file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const licValues = [
            d.emp_id,
            lic.license_name || null,
            lic.license_type || null,
            lic.license_no || null,
            lic.institution || null,
            lic.issue_date || null,
            lic.expire_date || null,
            lic.status || 'Active',
            licFileName
          ];
          await connection.query(licSql, licValues);
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ message: '✅ บันทึกพนักงานใหม่สำเร็จ!' });
    } catch (err: any) {
      await connection.rollback();
      connection.release();
      fs.writeFileSync(path.join(process.cwd(), 'public', 'db_error.txt'), err.toString() + '\\n' + err.stack);
      console.error("DB INSERT ERR:", err);
      throw err;
    }
  } catch (err: any) {
    console.error('Error creating employee:', err);
    return NextResponse.json({ error: err.message || 'DB Error' }, { status: 500 });
  }
}
