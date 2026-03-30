'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error('Frontend Error Boundary Caught:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%', padding: '24px',
      background: 'linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%)',
      fontFamily: "'Sarabun', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(220, 38, 38, 0.08)',
        textAlign: 'center',
        border: '1px solid #fee2e2'
      }}>
        <div style={{
          margin: '0 auto 24px auto', width: '96px', height: '96px',
          backgroundColor: '#fef2f2', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #fecaca'
        }}>
            <AlertCircle size={48} color="#ef4444" strokeWidth={1.5} />
        </div>
        
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', marginTop: 0 }}>
          ขออภัย ระบบขัดข้องชั่วคราว
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 24px auto' }}>
          เกิดข้อผิดพลาดในการแสดงผลหน้านี้ โปรดลองโหลดใหม่อีกครั้ง หรือกลับสู่หน้าหลักหากยังพบปัญหา
        </p>

        <div style={{
          backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px',
          marginBottom: '32px', textAlign: 'left', border: '1px solid #f1f5f9',
          maxHeight: '120px', overflowY: 'auto'
        }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-word', margin: 0 }}>
            {error.message || 'เกิดข้อผิดพลาดที่ระบบไม่สามารถระบุได้'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => reset()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: 'linear-gradient(to right, #ef4444, #f43f5e)', color: 'white', fontWeight: 600, borderRadius: '12px',
              border: 'none', cursor: 'pointer', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.2)'
            }}
          >
            <RefreshCcw size={16} />
            ลองใหม่อีกครั้ง
          </button>
          
          <Link
            href="/"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              background: '#ffffff', color: '#475569', fontWeight: 600, borderRadius: '12px',
              border: '1px solid #e2e8f0', textDecoration: 'none'
            }}
          >
            <Home size={16} color="#94a3b8" />
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}
