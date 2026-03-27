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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden py-12">
      <div className="absolute top-0 right-0 w-full h-80 bg-gradient-to-bl from-indigo-700 to-blue-600 rounded-b-[60px] transform -translate-y-20 skew-y-1 shadow-lg z-0"></div>
      
      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 pt-10 pb-6 border-b border-slate-100">
            <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
              ตั้งรหัสผ่านใหม่
            </h1>
            <p className="text-center text-slate-500 text-sm">
              กรุณากำหนดรหัสผ่านใหม่ที่คาดเดายาก 
              และไม่ซ้ำกับรหัสผ่านเดิมที่เคยใช้งาน
            </p>
          </div>

          <div className="px-8 py-8 bg-slate-50/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">รหัสผ่านใหม่</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'loading'}
                    className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                    placeholder="กรอกรหัสผ่านใหม่"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CheckCircle2 className={`h-5 w-5 ${rules.match ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === 'loading'}
                    className={`block w-full pl-10 pr-12 py-3 border rounded-xl bg-white transition duration-200 focus:ring-2 focus:outline-none ${
                        confirmPassword.length > 0 
                        ? rules.match 
                          ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500' 
                          : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {confirmPassword.length > 0 && !rules.match && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <XCircle className="w-4 h-4 mr-1" /> รหัสผ่านไม่ตรงกัน
                  </p>
                )}
              </div>

              {/* Validation Rules Checklist */}
              <div className="bg-slate-100/50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm font-medium text-slate-700 mb-3">เงื่อนไขรหัสผ่าน:</p>
                <ul className="space-y-2 text-sm">
                  <li className={`flex items-center ${rules.length ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {rules.length ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 opacity-50" />}
                    มีความยาวอย่างน้อย 8 ตัวอักษร
                  </li>
                  <li className={`flex items-center ${rules.uppercase ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {rules.uppercase ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 opacity-50" />}
                    มีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว
                  </li>
                  <li className={`flex items-center ${rules.lowercase ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {rules.lowercase ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 opacity-50" />}
                    มีตัวอักษรพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว
                  </li>
                  <li className={`flex items-center ${rules.number ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {rules.number ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 opacity-50" />}
                    มีตัวเลข (0-9) อย่างน้อย 1 ตัว
                  </li>
                  <li className={`flex items-center ${rules.symbol ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {rules.symbol ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2 opacity-50" />}
                    มีสัญลักษณ์พิเศษ (!@#$%^&*) อย่างน้อย 1 ตัว
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || status === 'loading'}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังบันทึกรหัสผ่าน...
                  </>
                ) : (
                  <>
                    บันทึกรหัสผ่านใหม่ <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
