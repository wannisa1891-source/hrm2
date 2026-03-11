'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const SLIDES = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1600&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80',
  'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&q=80',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1600&q=80',
  'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&q=80',
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(s => (s + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      alert('กรุณากรอก Username และ Password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        login(data.username);
        router.push('/dashboard');
      } else {
        alert('Username หรือ Password ไม่ถูกต้อง');
      }
    } catch {
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
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

        {/* Username */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7fb', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <span style={{ marginRight: 8, fontSize: 18 }}>👤</span>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
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
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ border: 'none', background: 'none', width: '100%', fontSize: 15, color: '#333', outline: 'none', fontFamily: 'Sarabun, sans-serif' }}
          />
        </div>

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

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.7 }}>Hospital Management Platform</p>
      </div>
    </div>
  );
}
