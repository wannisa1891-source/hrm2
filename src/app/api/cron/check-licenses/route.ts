import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { sendMail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Get all Active licenses and their associated configurations
    const query = `
      SELECT l.*, e.email, e.first_name_th, e.last_name_th, e.dept_id, e.pos_id,
             c.warning_days, c.license_name as required_license_name
      FROM tbl_employee_licenses l
      JOIN tbl_employees e ON l.emp_id = e.emp_id
      LEFT JOIN tbl_license_configs c ON 
        (c.dept_id IS NULL OR c.dept_id = e.dept_id) AND 
        (c.pos_id IS NULL OR c.pos_id = e.pos_id)
      WHERE l.status IN ('Active', 'ปกติ') AND e.email IS NOT NULL
    `;
    const [rows] = await pool.query(query);
    const licenses = rows as any[];

    const today = new Date();
    const results = { sent: 0, skipped: 0, errors: 0 };

    for (const lic of licenses) {
      if (!lic.expire_date || !lic.email) continue;

      const expDate = new Date(lic.expire_date);
      const diffMs = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Use warning_days from config, default to 90 if not set
      const warningThreshold = lic.warning_days || 90;
      
      let shouldNotify = false;
      let subject = '';
      let message = '';

      // Notification Logic: Every day if within critical (30 days), or at specific thresholds
      if (diffDays <= 0) {
        shouldNotify = true;
        subject = `[แจ้งเตือน] ใบประกอบวิชาชีพหมดอายุแล้ว (${Math.abs(diffDays)} วัน)`;
        message = `ใบประกอบวิชาชีพ ${lic.license_name} ของคุณหมดอายุแล้วเมื่อวันที่ ${lic.expire_date}. กรุณาดำเนินการต่ออายุทันทีเพื่อรักษาคุณสมบัติในการทำงาน.`;
      } else if (diffDays === 30 || diffDays === 15 || diffDays === 7 || diffDays === 3 || diffDays === 1) {
        shouldNotify = true;
        subject = `[ด่วน] ใบประกอบวิชาชีพจะหมดอายุใน ${diffDays} วัน`;
        message = `ใบประกอบวิชาชีพ ${lic.license_name} จะหมดอายุในอีก ${diffDays} วัน (${lic.expire_date}). กรุณาเตรียมเอกสารและดำเนินการต่ออายุ.`;
      } else if (diffDays === warningThreshold) {
        shouldNotify = true;
        subject = `แจ้งเตือนต่ออายุใบประกอบวิชาชีพล่วงหน้า (${diffDays} วัน)`;
        message = `ใบประกอบวิชาชีพ ${lic.license_name} ของคุณจะหมดอายุในอีก ${diffDays} วัน. นี่เป็นการแจ้งเตือนล่วงหน้าตามเกณฑ์มาตรฐานของตำแหน่งงานท่าน.`;
      }

      if (shouldNotify) {
        try {
          await sendMail({
            to: lic.email,
            subject: `[HRM System] ${subject}`,
            html: `
              <div style="font-family: 'Prompt', sans-serif; padding: 40px; background: #f8fafc; border-radius: 20px;">
                <div style="background: #fff; padding: 40px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                  <h2 style="color: #0f172a; margin-top: 0;">ระบบจัดการใบประกอบวิชาชีพ (HRM)</h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #334155;">
                    เรียนคุณ <strong>${lic.first_name_th} ${lic.last_name_th}</strong>,
                  </p>
                  <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px;">รายการที่มีการแจ้งเตือน:</p>
                    <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: 800; color: #0f172a;">${lic.license_name}</p>
                    <p style="margin: 4px 0 0 0; font-size: 14px; color: #ef4444;">วันหมดอายุ: ${lic.expire_date}</p>
                  </div>
                  <p style="font-size: 15px; color: #334155;">${message}</p>
                  <div style="margin-top: 32px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/license" style="background: #0f172a; color: #fff; padding: 14px 40px; border-radius: 10px; text-decoration: none; font-weight: 800; display: inline-block;">เข้าสู่หน้าจัดการใบประกอบ</a>
                  </div>
                </div>
                <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 24px;">© 2026 Hospital HRM System | ระบบอัตโนมัติ กรุณาอย่าตอบกลับอีเมลฉบับนี้</p>
              </div>
            `
          });
          results.sent++;
        } catch (e) {
          console.error(`Failed to send mail:`, e);
          results.errors++;
        }
      } else {
        results.skipped++;
      }
    }

    return NextResponse.json({ message: 'License check completed', results });
  } catch (err: any) {
    console.error('Check Licenses Cron Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
