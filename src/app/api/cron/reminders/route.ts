import { NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('--- Starting License Compliance Scan (Automatic) ---');
    const now = new Date();
    now.setHours(0,0,0,0);

    // 1. Fetch licenses with their respective config thresholds
    // We join with tbl_license_configs to get the 'warning_days' for each specific position/dept
    const query = `
      SELECT 
        l.id as license_id,
        l.license_no,
        l.expire_date,
        l.license_name,
        e.emp_id,
        e.first_name_th,
        e.last_name_th,
        e.email,
        c.warning_days
      FROM tbl_employee_licenses l
      JOIN tbl_employees e ON l.emp_id = e.emp_id
      LEFT JOIN tbl_license_configs c ON 
        (c.dept_id = e.dept_id OR c.dept_id IS NULL) AND 
        (c.pos_id = e.pos_id OR c.pos_id IS NULL) AND
        (c.license_name = l.license_name)
      WHERE l.status = 'Active'
    `;

    const [rows]: any = await pool.query(query);

    // 2. Setup Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let emailsSent = 0;

    for (const row of rows) {
      if (!row.email) continue;

      const expireDate = new Date(row.expire_date);
      const diffTime = expireDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Milestones: Configured Threshold, 30 days, 7 days
      const threshold = row.warning_days || 90;
      const shouldNotify = (diffDays === threshold) || (diffDays === 30) || (diffDays <= 7 && diffDays >= 0);

      if (shouldNotify) {
        console.log(`Notifying ${row.emp_id} - ${row.license_name} - ${diffDays} days left`);
        
        const mailOptions = {
          from: `"HR Compliance System" <${process.env.SMTP_USER}>`,
          to: row.email,
          subject: `Formal Notification: Professional License Expiration in ${diffDays} Days`,
          html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: #0f172a; padding: 32px; color: #fff; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Professional Compliance Notification</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.7;">Automated Surveillance Engine</p>
              </div>
              <div style="padding: 40px; color: #1e293b; line-height: 1.6;">
                <p>Dear <strong>${row.first_name_th} ${row.last_name_th}</strong>,</p>
                <p>Our records indicate that your professional license is approaching its expiration date. This is an automated notification to ensure you remain compliant with institutional and regulatory standards.</p>
                
                <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
                  <h3 style="margin: 0 0 16px 0; color: #0f172a;">License Compliance Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #64748b;">License:</td><td style="font-weight: 700;">${row.license_name}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">License No:</td><td style="font-weight: 700;">${row.license_no}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Expiry Date:</td><td style="font-weight: 700; color: #dc2626;">${row.expire_date}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">Status:</td><td style="font-weight: 700; color: #ca8a04;">Expires in ${diffDays} days</td></tr>
                  </table>
                </div>

                <p>Please initiate the renewal process immediately. Once renewed, please upload the new certificate to the HR portal to maintain your active status.</p>
                
                <div style="text-align: center; margin-top: 32px;">
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/license" style="background: #0f172a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; display: inline-block;">Upload New License Data</a>
                </div>
              </div>
              <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                Institutional Compliance Management - Human Resources Division
              </div>
            </div>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
          emailsSent++;
        } catch (mailErr) {
          console.error(`Email Failure for ${row.email}:`, mailErr);
        }
      }
    }

    return NextResponse.json({ message: 'Compliance scan completed', totalSent: emailsSent });
  } catch (error: any) {
    console.error('Compliance Scan Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
