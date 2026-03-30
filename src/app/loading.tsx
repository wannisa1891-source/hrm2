import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%',
      background: 'rgba(240, 242, 245, 0.6)', backdropFilter: 'blur(8px)',
      fontFamily: "'Sarabun', sans-serif"
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        padding: '32px 48px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        border: '1px solid rgba(255,255,255,0.8)'
      }}>
        <div style={{
          backgroundColor: '#eff6ff', borderRadius: '50%', padding: '16px',
          marginBottom: '20px', border: '1px solid #dbeafe'
        }}>
          <Loader2 size={40} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
        
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '8px', margin: 0 }}>
          กำลังประมวลผลข้อมูล...
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
          <span>กรุณารอสักครู่</span>
        </div>
      </div>
    </div>
  );
}
