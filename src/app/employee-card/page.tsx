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

  const fullName = `${profile.prefix || ''}${profile.first_name_th} ${profile.last_name_th}`;
  const fullNameEn = `${profile.first_name_en || ''} ${profile.last_name_en || ''}`;

  return (
    <AppLayout>
      <div style={{ 
        minHeight: 'calc(100vh - 100px)', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '24px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>บัตรพนักงานดิจิทัล</h1>
          <p style={{ color: '#64748b', fontWeight: 500 }}>Digital Employee Identification Card</p>
        </div>

        {/* Card Container */}
        <div className="id-card-wrap" style={{ 
          width: '100%', 
          maxWidth: '400px', 
          height: '600px', 
          perspective: '1000px',
        }}>
          <div className="id-card" style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.8)'
          }}>
            
            {/* Header / Hospital Logo Placeholder */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>HOSPITAL NAME</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>HEALTHCARE SERVICES</div>
              </div>
            </div>

            {/* Photo */}
            <div style={{ 
              width: '180px', 
              height: '180px', 
              borderRadius: '20px', 
              overflow: 'hidden', 
              marginBottom: '24px',
              border: '6px solid white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              background: '#f1f5f9'
            }}>
              <Image 
                src={profile.image ? `/uploads/${profile.image}` : (profile.photo ? `/uploads/${profile.photo}` : 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png')} 
                alt="employee photo" 
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
                onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text fill="%2394a3b8" font-size="50" x="50" y="68" text-anchor="middle">👤</text></svg>'; }}
              />
            </div>

            {/* Name Details */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{fullName}</h2>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{fullNameEn}</p>
            </div>

            {/* Divider */}
            <div style={{ width: '60px', height: '4px', background: '#3b82f6', borderRadius: '2px', margin: '24px 0' }}></div>

            {/* Position & Department */}
            <div style={{ textAlign: 'center', marginBottom: '32px', width: '100%' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#3b82f6' }}>{profile.pos_name}</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>{profile.dept_name}</div>
            </div>

            {/* ID Number */}
            <div style={{ 
              background: '#f8fafc', 
              padding: '12px 24px', 
              borderRadius: '12px', 
              border: '1px solid #e2e8f0',
              marginBottom: '32px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>ID NUMBER:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.1em' }}>{profile.emp_id}</span>
            </div>

            {/* Footer / QR Code */}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'white', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <QRCodeSVG value={`EMPLOYEE:${profile.emp_id}`} size={80} level="H" includeMargin={false} />
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>SCAN TO VERIFY</span>
            </div>

            {/* Holographic Decoration */}
            <div style={{
              position: 'absolute',
              top: '-10%',
              right: '-10%',
              width: '150px',
              height: '150px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => window.print()}
            style={{ 
              padding: '12px 24px', 
              background: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)'
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            พิมพ์บัตรพนักงาน
          </button>
          
          <button 
            onClick={() => router.back()}
            style={{ 
              padding: '12px 24px', 
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
            .sidebar-hybrid, .nav-label, .profile-tabs, button { display: none !important; }
            .id-card-wrap { margin: 0 !important; transform: scale(1.5); transform-origin: top center; }
            body { background: white !important; }
            .main-content { padding: 0 !important; margin: 0 !important; }
          }
          .id-card-wrap:hover .id-card {
            transform: translateY(-5px) rotateX(2deg);
            transition: all 0.3s ease;
          }
        `}</style>

      </div>
    </AppLayout>
  );
}
