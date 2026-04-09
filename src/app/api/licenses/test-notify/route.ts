import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { emp_id } = await req.json();

    if (!emp_id) {
       return NextResponse.json({ error: 'Missing Employee ID' }, { status: 400 });
    }

    // 1. Fetch Employee and their Active License
    const [rows]: any = await pool.query(`
      SELECT e.first_name_th, e.last_name_th, e.email, l.license_name, l.expire_date, l.license_no
      FROM tbl_employees e
      JOIN tbl_employee_licenses l ON e.emp_id = l.emp_id
      WHERE e.emp_id = ? AND l.status = 'Active'
      LIMIT 1
    `, [emp_id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No active license found for this employee to test.' }, { status: 404 });
    }

    const emp = rows[0];
    const targetEmail = emp.email || process.env.SMTP_USER;

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

    // 3. Send Email
    const mailOptions = {
      from: `"HR Compliance System" <${process.env.SMTP_USER}>`,
      to: targetEmail,
      subject: `[TEST] Notification: License Renewal Required - ${emp.license_name}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #0f172a; padding: 32px; color: #fff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Professional Compliance Notification</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.7;">Quality Assurance & Regulatory Affairs</p>
          </div>
          <div style={{ padding: '40px', color: '#1e293b', line-height: '1.6' }}>
            <p>Dear <strong>${emp.first_name_th} ${emp.last_name_th}</strong>,</p>
            <p>This is a formal test notification regarding your professional license compliance status. This message confirms that the automated surveillance system is functioning correctly.</p>
            
            <div style="background: #f8fafc; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
               <h3 style="margin: 0 0 16px 0; color: #0f172a;">License Details</h3>
               <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #64748b;">License Name:</td><td style="font-weight: 700;">${emp.license_name}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">License Number:</td><td style="font-weight: 700;">${emp.license_no}</td></tr>
                  <tr><td style="padding: 8px 0; color: #64748b;">Expiration Date:</td><td style="font-weight: 700; color: #dc2626;">${emp.expire_date}</td></tr>
               </table>
            </div>

            <p>Please ensure your documents are prepared and renewals are processed before the expiration date to maintain operational compliance.</p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/license" style="background: #0f172a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; display: inline-block;">Manage License</a>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
             Human Resources Management System - Enterprise Compliance Module
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: `Test email sent successfully to ${targetEmail}` });
  } catch (err: any) {
    console.error('Test Notify Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
