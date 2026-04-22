import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import fs from 'fs';
import path from 'path';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic'; // Disable Next.js caching for this route
import crypto from 'crypto';

// GET /api/employees

export async function GET() {
  try {
    const [
      empResult,
      licenseResult,
      trainingResult
    ] = await Promise.all([
      pool.query(`
        SELECT e.*, p.pos_name, d.dept_name
        FROM tbl_employees e
        LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
        LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
        ORDER BY e.emp_id ASC
      `),
      pool.query(`
        SELECT * FROM tbl_employee_licenses
      `),
      pool.query(`
        SELECT * FROM tbl_employee_trainings
      `)
    ]);

    const rows = empResult[0];
    const licenses = licenseResult[0];
    const trainings = trainingResult[0];

    // Map licenses and trainings to their corresponding employees
    const employees = (rows as any[]).map(emp => {
      const empLicenses = (licenses as any[]).filter(l => l.emp_id === emp.emp_id);
      const empTrainings = (trainings as any[]).filter(t => t.emp_id === emp.emp_id);
      
      // Determine primary license for table display
      const activeLicenses = empLicenses.filter(l => l.status !== 'Expired' && l.status !== 'Suspended');
      const primaryLicense = activeLicenses.length > 0 ? activeLicenses[0] : (empLicenses.length > 0 ? empLicenses[0] : null);

      return {
        ...emp,
        licenses: empLicenses,
        trainings: empTrainings,
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

    // Parse licenses and trainings arrays from stringified JSON
    let licenses: any[] = [];
    if (d.licenses_data) {
      try { licenses = JSON.parse(d.licenses_data); } catch(e) {}
    }
    let trainings: any[] = [];
    if (d.trainings_data) {
      try { trainings = JSON.parse(d.trainings_data); } catch(e) {}
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `INSERT INTO tbl_employees 
        (emp_id, prefix, first_name_th, last_name_th, first_name_en, last_name_en, nickname,
         birth_date, gender, address, citizen_id, phone, email, password, role, 
         emp_type, dept_id, pos_id, start_date, admission_date, retirement_date, base_salary, status, image, cneu_cme_points,
         quota_personal, quota_vacation, quota_sick) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?)`;

      const hashedPassword = d.password ? crypto.createHash('sha256').update(d.password).digest('hex') : '';

      const values = [
        d.emp_id || '', d.prefix || '-', d.first_name_th || '', d.last_name_th || '',
        d.first_name_en || '', d.last_name_en || '', d.nickname || '',
        d.birth_date || null, d.gender || 'ชาย', d.address || '',
        d.id_card || d.citizen_id || '0000000000000', d.phone || '',
        d.email || null, hashedPassword, d.role || 'User',
        d.emp_type || 'พนักงานประจำ', d.dept_id || '', d.pos_id || '', 
        d.start_date || new Date().toISOString().split('T')[0],
        d.admission_date || null, d.retirement_date || null,
        d.base_salary || 0, imageName,
        d.cneu_cme_points ? parseFloat(d.cneu_cme_points) : 0,
        d.quota_personal ? parseInt(d.quota_personal) : 0,
        d.quota_vacation ? parseInt(d.quota_vacation) : 0,
        d.quota_sick ? parseInt(d.quota_sick) : 0
      ];

      await connection.query(sql, values);

      // Insert multiple licenses
      if (licenses.length > 0) {
        for (let i = 0; i < licenses.length; i++) {
          let licFileName: string | null = null;
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
            d.emp_id, lic.license_name || null, lic.license_type || null, lic.license_no || null,
            lic.institution || null, lic.issue_date || null, lic.expire_date || null,
            lic.status || 'Active', licFileName
          ];
          await connection.query(licSql, licValues);
        }
      }

      // Insert multiple trainings
      if (trainings.length > 0) {
        for (let i = 0; i < trainings.length; i++) {
          let certFile: string | null = null;
          let imgFile: string | null = null;
          
          const cf = formData.get(`training_cert_${i}`) as File | null;
          if (cf && cf.size > 0) {
            const ext = path.extname(cf.name);
            certFile = `tr_cert_${d.emp_id}_${i}_${Date.now()}${ext}`;
            fs.writeFileSync(path.join(uploadDir, certFile), Buffer.from(await cf.arrayBuffer()));
          }
          const imf = formData.get(`training_img_${i}`) as File | null;
          if (imf && imf.size > 0) {
            const ext = path.extname(imf.name);
            imgFile = `tr_img_${d.emp_id}_${i}_${Date.now()}${ext}`;
            fs.writeFileSync(path.join(uploadDir, imgFile), Buffer.from(await imf.arrayBuffer()));
          }

          const tr = trainings[i];
          const trSql = `INSERT INTO tbl_employee_trainings 
            (emp_id, course_name, institution, location, start_date, end_date, certificate_file, image_file)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
          const trValues = [
            d.emp_id, tr.course_name, tr.institution || null, tr.location || null,
            tr.start_date || null, tr.end_date || null, certFile, imgFile
          ];
          await connection.query(trSql, trValues);
        }
      }

      await connection.commit();
      await logAudit(req.headers.get('x-user-id'), `เพิ่มประวัติพนักงานใหม่: ${d.emp_id} (${d.first_name_th} ${d.last_name_th})`, connection);
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
