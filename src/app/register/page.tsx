'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/services/authService';

const SLIDES = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=80',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80',
];

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleRegister = async () => {
    setErrorMessage('');
    if (!name || !email || !password) {
      setErrorMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setLoading(true);
    try {
      const result = await registerUser(name, email, password);
      
      if (result.success) {
        // redirect ไปหน้า login 
        router.push('/login?registered=true');
      } else {
        setErrorMessage(result.message || 'สมัครสมาชิกไม่สำเร็จ');
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
        width: 360,
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
          <img
            src="https://cdn-icons-png.flaticon.com/512/3063/3063176.png"
            alt="logo"
            style={{ width: 64, display: 'block', margin: '0 auto 12px' }}
          />
          <h2 style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1, margin: 0 }}>สมัครสมาชิก</h2>
          <p style={{ fontSize: 13, opacity: 0.85, margin: '6px 0 0' }}>HOSPITAL HRM</p>
        </div>

        {/* Name */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7fb', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <span style={{ marginRight: 8, fontSize: 18 }}>📝</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="ชื่อ - นามสกุล"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={{ border: 'none', background: 'none', width: '100%', fontSize: 15, color: '#333', outline: 'none', fontFamily: 'Sarabun, sans-serif' }}
          />
        </div>

        {/* Email */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7fb', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <span style={{ marginRight: 8, fontSize: 18 }}>✉️</span>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={{ border: 'none', background: 'none', width: '100%', fontSize: 15, color: '#333', outline: 'none', fontFamily: 'Sarabun, sans-serif' }}
          />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7fb', borderRadius: 12, padding: '10px 14px', marginBottom: 24 }}>
          <span style={{ marginRight: 8, fontSize: 18 }}>🔒</span>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            onKeyDown={e => e.key === 'Enter' && handleRegister()}
            style={{ border: 'none', background: 'none', width: '100%', fontSize: 15, color: '#333', outline: 'none', fontFamily: 'Sarabun, sans-serif' }}
          />
        </div>

        {/* Error Message */}
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
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            border: 'none',
            borderRadius: 12,
            background: loading ? '#999' : '#10b981',
            color: 'white',
            fontWeight: 700,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Sarabun, sans-serif',
            transition: '0.25s',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={e => {
            if(!loading) e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            if(!loading) e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิกเลย'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>หรือ</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* Login Link */}
        <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
          <p style={{ margin: 0 }}>
            มีบัญชีอยู่แล้ว?{' '}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); router.push('/login'); }}
              onMouseEnter={e => { e.currentTarget.style.color = '#93c5fd'; e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#60a5fa'; e.currentTarget.style.textDecoration = 'none'; }}
              style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
            >
              เข้าสู่ระบบ
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}