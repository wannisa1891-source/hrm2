'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Real-time Validation Checks
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    symbol: /\W/.test(password),
    match: password === confirmPassword && confirmPassword !== '',
  };

  const isFormValid = Object.values(rules).every(Boolean);

  useEffect(() => {
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่พบ Token',
        text: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือคุณไม่ได้เข้าใช้งานผ่านลิงก์ในอีเมล',
        allowOutsideClick: false,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'กลับหน้าแรก',
      }).then(() => {
        router.push('/login');
      });
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านไม่ตรงตามเงื่อนไข',
        text: 'กรุณาตรวจสอบเงื่อนไขรหัสผ่านให้ครบถ้วนทุกข้อ',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: data.message || 'รหัสผ่านของคุณถูกตั้งใหม่เรียบร้อยแล้ว',
          confirmButtonColor: '#10b981',
          confirmButtonText: 'เข้าสู่ระบบเลย',
          allowOutsideClick: false
        }).then(() => {
          router.push('/login');
        });
      } else {
        setStatus('idle');
        Swal.fire({
          icon: 'error',
          title: 'ไม่สามารถรีเซ็ตรหัสผ่านได้',
          text: data.message || 'เกิดข้อผิดพลาดบางอย่าง โปรดลองใหม่อีกครั้ง หรือขอลิงก์ใหม่',
          confirmButtonColor: '#ef4444',
          confirmButtonText: 'รับทราบ'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setStatus('idle');
      Swal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาดเครือข่าย',
        text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <Loader2 style={{ width: 40, height: 40, color: '#2563eb', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f0f2f5', 
      fontFamily: "'Sarabun', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 20px'
    }}>
      {/* Background Accent Like Login Page Slides Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '35vh',
        background: 'linear-gradient(135deg, #002D55, #2563eb)',
        zIndex: 0,
        borderBottomLeftRadius: '100px',
        borderBottomRightRadius: '100px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }} />
      
      <div className="glass-card" style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        maxWight: '480px', 
        maxWidth: '480px',
        padding: '0',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        background: '#ffffff'
      }}>
        {/* Header Section */}
        <div style={{ 
          padding: '40px 40px 24px', 
          textAlign: 'center', 
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div style={{ marginBottom: 20 }}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/3063/3063176.png"
              alt="logo"
              style={{ width: 64, display: 'block', margin: '0 auto' }}
            />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>
            ตั้งรหัสผ่านใหม่
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            กรุณากำหนดรหัสผ่านใหม่ที่คาดเดายาก<br/>และไม่ซ้ำกับรหัสผ่านเดิม
          </p>
        </div>

        {/* Form Section */}
        <div style={{ padding: '32px 40px 40px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                รหัสผ่านใหม่
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'loading'}
                  suppressHydrationWarning
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 40px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                ยืนยันรหัสผ่านใหม่
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: rules.match ? '#10b981' : '#94a3b8' }}>
                  <CheckCircle2 size={18} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={status === 'loading'}
                  suppressHydrationWarning
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 40px',
                    borderRadius: '12px',
                    border: `1px solid ${confirmPassword ? (rules.match ? '#10b981' : '#ef4444') : '#e2e8f0'}`,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit'
                  }}
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Validation Rules */}
            <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#475569', margin: '0 0 10px' }}>เงื่อนไขความปลอดภัย:</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {[
                  { label: 'ยาวอย่างน้อย 8 ตัวอักษร', valid: rules.length },
                  { label: 'มีตัวพิมพ์ใหญ่ (A-Z)', valid: rules.uppercase },
                  { label: 'มีตัวพิมพ์เล็ก (a-z)', valid: rules.lowercase },
                  { label: 'มีตัวเลข (0-9)', valid: rules.number },
                  { label: 'มีสัญลักษณ์พิเศษ (!@#$%)', valid: rules.symbol },
                ].map((rule, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: rule.valid ? '#059669' : '#64748b' }}>
                    {rule.valid ? <CheckCircle2 size={14} /> : <XCircle size={14} style={{ opacity: 0.5 }} />}
                    {rule.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || status === 'loading'}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: 'none',
                background: !isFormValid || status === 'loading' ? '#cbd5e1' : 'linear-gradient(135deg, #002D55, #2563eb)',
                color: 'white',
                fontWeight: 700,
                fontSize: '16px',
                cursor: !isFormValid || status === 'loading' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.25s ease',
                boxShadow: isFormValid && status !== 'loading' ? '0 10px 20px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  บันทึกรหัสผ่านใหม่ <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer Link */}
        <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', fontSize: '13px' }}>
          <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
