'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';

export default function EmployeeCardPage() {
  const { user, isLoggedIn } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      fetchProfile();
    }
  }, [isLoggedIn, router, user]);

  const fetchProfile = async () => {
    if (!user?.emp_id) return;
    try {
      const res = await fetch(`/api/profile?emp_id=${user.emp_id}`);
      const result = await res.json();
      if (result.success) {
        setProfile(result.data.profile);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    </AppLayout>
  );

  if (!profile) return (
    <AppLayout>
      <div style={{ textAlign: 'center', padding: '50px' }}>ไม่พบข้อมูลพนักงาน</div>
    </AppLayout>
  );

  const empForCard = profile;
  const fullName = `${empForCard.prefix || ''}${empForCard.first_name_th} ${empForCard.last_name_th}`;

  return (
    <AppLayout>
      <div style={{ 
        minHeight: 'calc(100vh - 100px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#f8fafc'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>บัตรพนักงาน</h1>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Official Employee Identification Card</p>
        </div>

        {/* Card Container - Flexbox to show front and back */}
        <div style={{ 
          display: 'flex', 
          gap: '40px', 
          flexWrap: 'wrap', 
          justifyContent: 'center',
          maxWidth: '1000px',
          width: '100%'
        }}>
          
          {/* --- Front Card (Matched with Admin Sidebar design) --- */}
          <div style={{ width: '300px', height: '480px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', color: '#1e293b', flexShrink: 0 }}>

            {/* Abstract blobs */}
            <div style={{ position: 'absolute', top: '-40px', left: '-20px', width: '280px', height: '260px', background: '#0f172a', borderRadius: '0 0 60% 40% / 0 0 50% 70%', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 0, right: '-60px', width: '200px', height: '280px', background: '#f59e0b', borderRadius: '0 0 40% 60%', zIndex: 1 }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', background: '#f59e0b', borderRadius: '50%', zIndex: 1 }} />

            {/* Logo / Tagline */}
            <div style={{ position: 'relative', zIndex: 3, padding: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', background: '#f59e0b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: '12px', height: '12px', border: '2px solid #0f172a', borderRadius: '50%' }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1 }}>HRM SYSTEM</div>
                <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '2px', letterSpacing: '0.5px' }}>EMPLOYEE ID CARD</div>
              </div>
            </div>

            {/* Image */}
            <div style={{ position: 'relative', zIndex: 3, marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '130px', height: '130px', position: 'relative', borderRadius: '50%', border: '6px solid #ffffff', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', background: '#f1f5f9', overflow: 'hidden' }}>
                <Image fill src={empForCard.image ? `/uploads/${empForCard.image}` : `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>`} alt="Employee" style={{ objectFit: 'cover' }} unoptimized onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }} />
              </div>
            </div>

            {/* Name & Title */}
            <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', marginTop: '16px', padding: '0 20px' }}>
              <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{empForCard.first_name_en || (empForCard.first_name_th + ' ' + empForCard.last_name_th)}</h2>
              {empForCard.first_name_en && empForCard.last_name_en && (
                <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{empForCard.last_name_en}</h2>
              )}
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>{empForCard.pos_name}</p>
            </div>

            {/* Details Info Grid */}
            <div style={{ position: 'relative', zIndex: 3, marginTop: '24px', padding: '0 32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr', gap: '6px 8px', fontSize: '11px' }}>
                <div style={{ color: '#64748b', fontWeight: 600 }}>ID</div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>: {empForCard.emp_id}</div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>DOB</div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>: {empForCard.birth_date ? new Date(empForCard.birth_date).toLocaleDateString('en-GB') : '-'}</div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Phone</div>
                <div style={{ color: '#0f172a', fontWeight: 700 }}>: {empForCard.phone || empForCard.mobile_no || '-'}</div>
                <div style={{ color: '#64748b', fontWeight: 600 }}>Email</div>
                <div style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>: {empForCard.email || '-'}</div>
              </div>
            </div>

            {/* Barcode/QR wrapper */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', right: '0', display: 'flex', justifyContent: 'center', zIndex: 3 }}>
              <QRCodeSVG value={empForCard.emp_id} size={48} level="M" />
            </div>

          </div>

          {/* --- Back Card (Matched with Admin Sidebar design) --- */}
          <div style={{ width: '300px', height: '480px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', color: '#1e293b', flexShrink: 0 }}>

            {/* Blobs Back */}
            <div style={{ position: 'absolute', top: '-60px', left: '-20px', width: '360px', height: '180px', background: '#0f172a', borderRadius: '0 0 50% 50%', zIndex: 2 }} />
            <div style={{ position: 'absolute', top: 0, right: '-40px', width: '160px', height: '160px', background: '#f59e0b', borderRadius: '0 0 0 60%', zIndex: 1 }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '120px', height: '120px', background: '#f59e0b', borderRadius: '50%', zIndex: 1 }} />

            {/* Logo / Tagline */}
            <div style={{ position: 'relative', zIndex: 3, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '24px', height: '24px', background: '#f59e0b', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '10px', height: '10px', border: '2px solid #0f172a', borderRadius: '50%' }} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px', lineHeight: 1 }}>HRM SYSTEM</div>
              </div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 3, padding: '20px 28px', marginTop: '40px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', textAlign: 'center', margin: '0 0 20px 0', letterSpacing: '0.5px' }}>ข้อกำหนดและเงื่อนไข</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '4px' }} />
                  <div>บัตรนี้เป็นทรัพย์สินของบริษัทและต้องคืนเมื่อสิ้นสุดการจ้างงาน</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '4px' }} />
                  <div>ท่านต้องสวมบัตรประจำตัวนี้ให้เห็นชัดเจนตลอดเวลาขณะอยู่ในบริเวณบริษัท</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '4px' }} />
                  <div>หากพบเห็นโปรดส่งคืนฝ่ายทรัพยากรบุคคลทันที</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                <div>
                  <div style={{ marginBottom: '6px' }}>วันที่เริ่มงาน &nbsp;: <span style={{ color: '#0f172a' }}>{empForCard.start_date ? new Date(empForCard.start_date).toLocaleDateString('en-GB') : '-'}</span></div>
                  <div>วันหมดอายุ &nbsp;: <span style={{ color: '#0f172a' }}>{empForCard.start_date ? new Date(new Date(empForCard.start_date).setFullYear(new Date(empForCard.start_date).getFullYear() + 5)).toLocaleDateString('en-GB') : '-'}</span></div>
                </div>
              </div>

              {/* Signature */}
              <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive", fontSize: '24px', color: '#0f172a', margin: '0', lineHeight: 1, height: '24px' }}>Wannisa</div>
                <div style={{ borderTop: '1px solid #cbd5e1', margin: '8px auto 0', width: '140px', paddingTop: '6px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>ลายมือชื่อผู้มีอำนาจ</div>
              </div>

            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '60px', display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => window.print()}
            style={{ 
              padding: '12px 28px', 
              background: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)'
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            พิมพ์บัตรพนักงาน
          </button>
          
          <button 
            onClick={() => router.back()}
            style={{ 
              padding: '12px 28px', 
              background: 'white', 
              color: '#475569', 
              border: '1px solid #e2e8f0', 
              borderRadius: '12px', 
              fontWeight: 700, 
              cursor: 'pointer'
            }}
          >
            ย้อนกลับ
          </button>
        </div>

        <style jsx global>{`
          @media print {
            .sidebar-hybrid, .nav-label, .profile-tabs, button, h1, p { display: none !important; }
            body { background: white !important; padding: 0 !important; }
            .main-content { padding: 0 !important; margin: 0 !important; }
            div[style*="calc(100vh - 100px)"] { height: auto !important; min-height: auto !important; padding: 0 !important; }
            div[style*="max-width: 1000px"] { transform: scale(1); gap: 20px !important; }
          }
        `}</style>

      </div>
    </AppLayout>
  );
}
