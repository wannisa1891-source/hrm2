import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing employee ID' }, { status: 400 });

    const [rows] = await pool.query(`SELECT emp_id, first_name_th, last_name_th, email FROM tbl_employees WHERE emp_id = ?`, [id]);
    const emp = (rows as any[])[0];

    if (!emp) {
      return NextResponse.json({ error: 'ไม่พบพนักงานในระบบ' }, { status: 404 });
    }

    const hasEmail = Boolean(emp.email);

    // Generate random 8 character password
    const newPassword = Math.random().toString(36).slice(-8); 
    const hashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');

    // Update password
    await pool.query(`UPDATE tbl_employees SET password = ? WHERE emp_id = ?`, [hashedPassword, id]);

    // Send email gracefully if they have an email
    let emailSent = false;
    let smtpError = false;

    if (hasEmail) {
      try {
      const smtpUser = (process.env.SMTP_USER || '').replace(/^"|"$/g, '');
      const smtpPass = (process.env.SMTP_PASS || '').replace(/^"|"$/g, '');
      const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').replace(/^"|"$/g, '');
      const smtpPort = Number((process.env.SMTP_PORT || '587').replace(/^"|"$/g, ''));
      const smtpFrom = (process.env.SMTP_FROM_NAME || 'Hospital HRM System').replace(/^"|"$/g, '');

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: `"${smtpFrom}" <${smtpUser}>`,
        to: emp.email,
        subject: `🔑 แจ้งรีเซ็ตรหัสผ่านบัญชี HRM ของคุณ`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #0284c7;">แจ้งรีเซ็ตรหัสผ่าน</h2>
            <p>เรียน คุณ${emp.first_name_th} ${emp.last_name_th},</p>
            <p>ระบบได้ทำการรีเซ็ตรหัสผ่านสำหรับการเข้าใช้งานระบบ HRM ของคุณเรียบร้อยแล้ว</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>รหัสผ่านใหม่ของคุณคือ:</strong> <span style="color: #ef4444; font-weight: bold; font-size: 18px;">${newPassword}</span></p>
            </div>
            
            <p>กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่นี้ และคุณสามารถเปลี่ยนรหัสผ่านอีกครั้งด้วยตัวเองได้ในเมนูแก้ไขโปรไฟล์ส่วนตัว</p>
            <p style="color: #666; font-size: 13px; margin-top: 30px;">
              *อีเมลฉบับนี้เป็นการส่งอัตโนมัติจากระบบ HRM ทรัพยากรบุคคล กรุณาอย่าตอบกลับ
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      } catch (mailErr: any) {
        console.error('Failed to send mail:', mailErr.message);
        smtpError = true;
        // Suppress the error so the password reset doesn't fail
      }
    }

    const userId = req.headers.get('x-user-id');
    if (userId) {
      await logAudit(userId, `รีเซ็ตรหัสผ่านพนักงาน: ${id} (${emp.first_name_th} ${emp.last_name_th})`, pool);
    }

    if (!hasEmail) {
      return NextResponse.json({ 
        message: 'รีเซ็ตรหัสผ่านสำเร็จ! แต่พนักงานรายนี้ไม่มีข้อมูลอีเมลในระบบ (รหัสผ่านใหม่คือ: ' + newPassword + ')', 
        newPassword: newPassword 
      });
    }

    if (smtpError) {
      return NextResponse.json({ 
        message: 'รีเซ็ตรหัสผ่านสำเร็จ! แต่ระบบส่งอีเมลไม่ได้ครบ โปรดเช็คการตั้งค่า Email SMTP (รหัสผ่านใหม่คือ: ' + newPassword + ')', 
        newPassword: newPassword 
      });
    }

    return NextResponse.json({ message: 'รีเซ็ตรหัสผ่านและส่งอีเมลแจ้งพนักงานเรียบร้อยแล้ว รหัสผ่านใหม่คือ: ' + newPassword, newPassword: newPassword });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Error processing request' }, { status: 500 });
  }
}
