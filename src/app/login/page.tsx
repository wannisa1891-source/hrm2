'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser } from '@/services/authService';

const SLIDES = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=80',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('กรุณากรอก Email และ Password');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUser(email, password);
      
      if (result.success) {
        // เก็บข้อมูล user ใน localStorage
        if (result.user) {

           login(result.user);
        } else {
           login({ username: email });
        }
        // redirect ไปหน้า dashboard
        router.push('/dashboard');
      } else {
        setErrorMessage(result.message || 'รหัสผ่านหรือผู้ใช้ไม่ถูกต้อง');
      }
    } catch {
      setErrorMessage('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100%',
      backgroundImage: `url(${SLIDES[slide]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      transition: 'background-image 1s ease',
    }}>
      {/* Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0,40,80,0.65), rgba(0,120,200,0.35))',
      }} />

      {/* Panel */}
      <div style={{
        position: 'relative',
        width: 340,
        padding: '44px 40px',
        borderRadius: 20,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        textAlign: 'center',
        color: 'white',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn-icons-png.flaticon.com/512/3063/3063176.png"
            alt="logo"
            style={{ width: 72, display: 'block', margin: '0 auto 12px' }}
          />
          <h2 style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1, margin: 0 }}>HOSPITAL HRM</h2>
          <p style={{ fontSize: 13, opacity: 0.85, margin: '6px 0 0' }}>Human Resource Management System</p>
        </div>

        {/* Email */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7fb', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="text"
            placeholder="Username"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ border: 'none', background: 'none', width: '100%', fontSize: 15, color: '#333', outline: 'none', fontFamily: 'Sarabun, sans-serif' }}
          />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7fb', borderRadius: 12, padding: '10px 14px', marginBottom: 24 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" style={{ marginRight: 8, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ border: 'none', background: 'none', width: '100%', fontSize: 15, color: '#333', outline: 'none', fontFamily: 'Sarabun, sans-serif' }}
          />
        </div>

        {/* แสดง Error Message ถ้ามี */}
        {errorMessage && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            color: '#ff8080',
            fontSize: 13,
            padding: 10,
            borderRadius: 8,
            marginBottom: 15,
            border: '1px solid rgba(220, 38, 38, 0.3)'
          }}>
            {errorMessage}
          </div>
        )}

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            border: 'none',
            borderRadius: 12,
            background: loading ? '#999' : 'linear-gradient(135deg, #002D55, #2563eb)',
            color: 'white',
            fontWeight: 700,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Sarabun, sans-serif',
            transition: '0.25s',
          }}
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>หรือ</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* Sign Up / สมัครสมาชิก Button */}
        <button
          onClick={() => router.push('/register')}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
            e.currentTarget.style.borderColor = 'rgba(96,165,250,0.5)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(96,165,250,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={{
            width: '100%',
            padding: '13px',
            border: '2px solid rgba(255,255,255,0.25)',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(6px)',
            color: 'white',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            fontFamily: 'Sarabun, sans-serif',
            transition: 'all 0.3s ease',
            letterSpacing: 0.5,
          }}
        >
          Sign Up / สมัครสมาชิก
        </button>

        {/* Register Link */}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          <p style={{ margin: 0 }}>
            ยังไม่มีบัญชี?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); router.push('/register'); }}
              onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.textDecoration = 'none'; }}
              style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            >
              สมัครสมาชิกที่นี่
            </a>
          </p>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.7 }}>Hospital Management Platform</p>
      </div>
    </div>
  );
}
