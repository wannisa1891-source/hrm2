import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { logAudit } from '@/lib/audit';
import redis from '@/lib/redis';

// Base64url encode helper (URL-safe)
function base64urlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // การตอบกลับ Generic เสมอ ป้องกัน Email Enumeration
    const genericResponse = NextResponse.json({ 
      success: true, 
      message: 'หากมีบัญชีนี้อยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของท่าน' 
    });

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'กรุณาระบุอีเมล' }, { status: 400 });
    }

    // Sanitize input
    const sanitizedEmail = email.trim().toLowerCase();

    // 1. Rate Limit ด้วย Redis: 5 ครั้ง / นาที / IP
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const rateLimitKey = `rate_limit:forgot_pwd:${ip}`;
    
    let currentCount = 0;
    try {
      if (redis) {
        currentCount = await redis.incr(rateLimitKey);
        if (currentCount === 1) {
          await redis.expire(rateLimitKey, 60); // 1 นาที
        }
      }
    } catch (redisError) {
      console.warn("Redis Error (Rate Limit อาจไม่ทำงาน):", redisError);
    }

    if (currentCount > 5) {
      const userAgent = req.headers.get('user-agent') || 'unknown';
      // บันทึก Log กรณีถูก Brute force / Spam
      await logAudit('System', `Rate Limit Exceeded (Forgot Password) | Status: Failed | IP: ${ip} | UA: ${userAgent}`);
      return NextResponse.json(
        { success: false, message: 'ท่านทำรายการบ่อยเกินไป กรุณารอสักครู่' },
        { status: 429 }
      );
    }

    // 2. ค้นหาผู้ใช้ในระบบ
    const [rows]: any = await pool.query(
      'SELECT emp_id, first_name_th, last_name_th FROM tbl_employees WHERE email = ?',
      [sanitizedEmail]
    );

    if (rows.length === 0) {
      // ตอบกลับทันทีหากไม่พบ เพื่อป้องกัน Timing Attack แบบเล็กน้อย
      return genericResponse;
    }

    const emp = rows[0];

    // 3. สร้าง Token (32 Bytes URL-Safe)
    const rawTokenBytes = crypto.randomBytes(32);
    const token = base64urlEncode(rawTokenBytes);
    
    // Hash Token (SHA-256) ก่อนเก็บลง Database ตามข้อกำหนด Secruity
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 4. บันทึก Token Hash ติดกับ Employee พร้อมวันหมดอายุ (15 นาที)
    await pool.query(
      'UPDATE tbl_employees SET reset_token_hash = ?, reset_token_expiry = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE emp_id = ?',
      [tokenHash, emp.emp_id]
    );

    // 5. ส่งอีเมล
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'localhost:3000';
    
    // บังคับใช้ HTTPS
    const secureProtocol = process.env.NODE_ENV === 'production' ? 'https' : protocol;
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${secureProtocol}://${host}`;
    
    const resetUrl = `${origin}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // ในกรณีไม่ได้ใช้ HTTPS สำหรับ SMTP บางแห่ง
      secure: Number(process.env.SMTP_PORT) === 465, 
    });

    const htmlEmail = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Sarabun', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .title { color: #1e3a8a; font-size: 26px; font-weight: bold; margin: 0; }
        .subtitle { color: #64748b; font-size: 16px; margin-top: 8px; }
        .content { color: #334155; font-size: 16px; line-height: 1.6; }
        .btn-container { text-align: center; margin: 40px 0; }
        .btn { background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; }
        .url-box { margin-top: 10px; padding: 12px; background-color: #f1f5f9; border-radius: 6px; word-break: break-all; color: #3b82f6; font-size: 14px; }
        .divider { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
        .warning-box { background-color: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; }
        .warning-text { color: #b91c1c; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 class="title">คำขอรีเซ็ตรหัสผ่าน</h2>
          <p class="subtitle">ระบบบริหารจัดการบุคลากร (HRM)</p>
        </div>
        
        <div class="content">
          <p>เรียน คุณ ${emp.first_name_th} ${emp.last_name_th},</p>
          <p>
            เราได้รับการร้องขอให้รีเซ็ตรหัสผ่านสำหรับบัญชีที่เชื่อมโยงกับอีเมลนี้ 
            หากคุณเป็นผู้ทำรายการ กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์นี้จะหมดอายุใน <strong>15 นาที</strong>
          </p>
        </div>
        
        <div class="btn-container">
          <a href="${resetUrl}" class="btn">รีเซ็ตรหัสผ่านของคุณ</a>
        </div>
        
        <div class="content">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 5px;">หรือคัดลอกลิงก์ด้านล่างไปวางในเบราว์เซอร์ของคุณ:</p>
          <div class="url-box">${resetUrl}</div>
        </div>
        
        <hr class="divider" />
        
        <div class="warning-box">
          <p class="warning-text">
            <strong>คำเตือนความปลอดภัย:</strong> หากคุณไม่ได้เป็นผู้ร้องขอให้เปลี่ยนรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้ รหัสผ่านเดิมของคุณจะยังคงปลอดภัยและสามารถใช้งานได้ตามปกติ
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    try {
      await transporter.sendMail({
        from: `"HRM Security" <${process.env.SMTP_USER || 'noreply@hrm-system.com'}>`,
        to: sanitizedEmail,
        subject: '🔐 คำขอรีเซ็ตรหัสผ่าน - ระบบ HRM',
        html: htmlEmail,
      });

      // Audit Log Success (บันทึกเฉพาะคนที่ทำสำเร็จเพื่อป้องกันข้อมูลรกเกินไป)
      const userAgent = req.headers.get('user-agent') || 'unknown';
      await logAudit(emp.emp_id, `Forgot Password Email Sent | Status: Success | IP: ${ip} | UA: ${userAgent}`);
      
    } catch (emailError) {
      console.error("Nodemailer Error:", emailError);
      const userAgent = req.headers.get('user-agent') || 'unknown';
      await logAudit(emp.emp_id, `Forgot Password Email Error | Status: Failed | IP: ${ip} | UA: ${userAgent}`);
      // หากส่งเมลล้มเหลว ก็ยังคงย้อนกลับ Generic Response เพื่อซ่อนข้อมูล
    }

    return genericResponse;

  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}
