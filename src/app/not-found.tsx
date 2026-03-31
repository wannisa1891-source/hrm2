'use client';

import Link from 'next/link';
import { SearchX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%', padding: '24px',
      background: 'linear-gradient(135deg, #f0f4f8 0%, #e1e8ed 100%)',
      fontFamily: "'Sarabun', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '540px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        textAlign: 'center',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{
          margin: '0 auto 32px auto', width: '120px', height: '120px',
          backgroundColor: '#f8fafc', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', border: '2px dashed #e2e8f0'
        }}>
            <SearchX size={56} color="#94a3b8" strokeWidth={1.5} />
            <div style={{
              position: 'absolute', bottom: '-10px', right: '-10px',
              backgroundColor: '#fff', borderRadius: '16px', padding: '8px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #f8fafc',
              transform: 'rotate(10deg)'
            }}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>404</span>
            </div>
        </div>
        
        <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>
          ไม่พบหน้าที่คุณต้องการ
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '16px', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 40px auto' }}>
          ขออภัย หน้าเว็บที่คุณพยายามเข้าถึงอาจถูกลบไปแล้ว หรือคุณอาจพิมพ์ URL ผิดพลาด
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px',
              background: '#3b82f6', color: 'white', fontWeight: 600, borderRadius: '14px',
              textDecoration: 'none', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
            }}
          >
            <Home size={18} />
            กลับสู่หน้าหลัก
          </Link>
          
          <button 
            onClick={() => { if (typeof window !== 'undefined') window.history.back(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px',
              background: '#ffffff', color: '#475569', fontWeight: 600, borderRadius: '14px',
              border: '2px solid #e2e8f0', cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
