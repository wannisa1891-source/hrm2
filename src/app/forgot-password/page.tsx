'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    // Simulate API call or real API depending on your backend
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setErrorMessage(data?.message || 'ไม่สามารถส่งลิงก์ได้ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบอินเทอร์เน็ต');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-blue-50 relative overflow-hidden font-sans">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 -left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute top-0 -right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Main Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 z-10 animate-slide-up overflow-hidden">
        
        <div className="px-8 pt-10 pb-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6 shadow-md border border-white">
              <span className="text-3xl">🏥</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">
              ลืมรหัสผ่าน?
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              กรุณากรอกอีเมลที่ผูกกับบัญชีของท่าน <br />
              เราจะส่งลิงก์เพื่อรีเซ็ตรหัสผ่านกลับไปให้
            </p>
          </div>

          {status === 'success' ? (
            /* Success State */
            <div className="animate-slide-up text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ส่งลิงก์สำเร็จแล้ว</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                เราได้ส่งคำแนะนำการรีเซ็ตรหัสผ่านไปยังอีเมล <br/>
                <strong className="text-indigo-600">{email}</strong> แล้ว <br/>
                โปรดตรวจสอบกล่องข้อความของคุณ
              </p>
              <Link 
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-gray-50 border border-gray-200 px-4 py-3.5 text-sm font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                  ที่อยู่อีเมล (Email Address)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-gray-900 sm:text-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 disabled:bg-gray-100 outline-none"
                    placeholder="example@hospital.com"
                  />
                </div>
              </div>

              {status === 'error' && errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-red-600 animate-slide-up flex items-center">
                  <span className="mr-2">⚠️</span> {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading' || !email}
                className="group relative w-full flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    ส่งลิงก์รีเซ็ตรหัสผ่าน
                    <span className="absolute right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      →
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <div className="bg-gray-50/80 border-t border-gray-100 px-8 py-5 text-center">
          <Link 
            href="/login"
            className="inline-flex items-center justify-center text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับไปยังเข้าสู่ระบบ
          </Link>
        </div>

      </div>
    </div>
  );
}
