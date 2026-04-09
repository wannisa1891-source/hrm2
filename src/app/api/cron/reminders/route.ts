import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Determine target dates: 90 days, 30 days, 7 days from today
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const getTargetDateStr = (daysOut: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysOut);
      return d.toISOString().split('T')[0];
    };

    const target90 = getTargetDateStr(90);
    const target30 = getTargetDateStr(30);
    const target7 = getTargetDateStr(7);

    // Query licenses expiring exactly on these dates
    const query = `
      SELECT 
        l.id as license_id,
        l.license_no,
        l.expire_date,
        l.status as license_status,
        l.license_name,
        l.license_type,
        e.emp_id,
        e.first_name_th,
        e.last_name_th,
        e.email
      FROM tbl_employee_licenses l
      JOIN tbl_employees e ON l.emp_id = e.emp_id
      WHERE l.expire_date IN (?, ?, ?)
        AND l.status != 'Expired'
        AND l.status != 'Suspended'
    `;

    let rows: any[] = [];
    try {
      [rows] = await pool.query(query, [target90, target30, target7]);
    } catch (dbErr: any) {
      if (dbErr.code === 'ER_BAD_FIELD_ERROR' && dbErr.message.includes('email')) {
         // Fallback if no email column exists yet
         return NextResponse.json({ error: 'The email column does not exist in tbl_employees. Please create it first.' }, { status: 400 });
      }
      throw dbErr;
    }

    if (rows.length === 0) {
      return NextResponse.json({ message: 'No licenses expiring on the target dates. No emails sent.', count: 0 });
    }

    // Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_SENDER || 'yourcompany.hr@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password-here'
      }
    });

    let emailsSent = 0;
    let failedEmails = 0;

    for (const row of rows) {
      if (!row.email) continue; // Skip if no email is set for this person

      const daysLeft = Math.ceil((new Date(row.expire_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const typeStr = row.license_name || row.license_type || 'ใบประกอบวิชาชีพ';
      
      const mailOptions = {
        from: `"HRM System " <${process.env.EMAIL_SENDER || 'yourcompany.hr@gmail.com'}>`,
        to: row.email,
        subject: `⚠️ แจ้งเตือน: ${typeStr} ของคุณกำลังจะหมดอายุในอีก ${daysLeft} วัน`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #ea580c;">แจ้งเตือนใบประกอบวิชาชีพใกล้หมดอายุ</h2>
            <p>เรียน คุณ${row.first_name_th} ${row.last_name_th},</p>
            <p>ระบบตรวจสอบพบว่าใบประกอบวิชาชีพของคุณกำลังจะหมดอายุ กรุณาตรวจสอบรายละเอียดด้านล่างและดำเนินการต่ออายุเพื่อหลีกเลี่ยงผลกระทบต่อการปฏิบัติงาน:</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>ประเภท:</strong> ${typeStr}</p>
              <p><strong>เลขที่ใบอนุญาต:</strong> ${row.license_no || '-'}</p>
              <p><strong>วันหมดอายุ:</strong> ${new Date(row.expire_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric'})}</p>
              <p><strong>เวลาที่เหลือ:</strong> <span style="color: #ef4444; font-weight: bold;">${daysLeft} วัน</span></p>
            </div>
            
            <p>กรุณาดำเนินการต่ออายุ และนำส่งเอกสารให้ฝ่ายบุคคลโดยเร็วที่สุด</p>
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              *อีเมลฉบับนี้เป็นการส่งอัตโนมัติจากระบบ HRM ไม่ต้องตอบกลับ
            </p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        emailsSent++;
      } catch (err) {
        console.error('Failed to send email to:', row.email, err);
        failedEmails++;
      }
    }

    return NextResponse.json({ 
      message: 'Processing complete', 
      totalFound: rows.length,
      emailsSent,
      failedEmails 
    });

  } catch (error: any) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
