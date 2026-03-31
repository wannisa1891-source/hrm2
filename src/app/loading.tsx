import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%',
      // Using a subtle backdrop blur and light transparent background to match the professional HRM feel
      background: 'rgba(255, 255, 255, 0.4)',
      backdropFilter: 'blur(12px)',
      fontFamily: "'Sarabun', sans-serif",
      position: 'fixed', top: 0, left: 0, zIndex: 9999
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px', position: 'relative'
      }}>
        {/* Modern, pulse-like light background instead of a stiff box */}
        <div style={{
          position: 'absolute', width: '120px', height: '120px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          animation: 'pulse 2s infinite ease-in-out'
        }} />

        <div style={{
          position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <div style={{ 
            color: '#2563eb', marginBottom: '16px', 
            background: 'white', padding: '12px', borderRadius: '50%',
            boxShadow: '0 8px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9'
          }}>
            <Loader2 size={36} style={{ animation: 'spin 1.2s linear infinite' }} />
          </div>
          
          <div style={{ 
            fontSize: '15px', fontWeight: 600, color: '#475569', 
            letterSpacing: '0.5px'
          }}>
            กำลังประมวลผล...
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse {
          0% { transform: scale(0.85); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
          100% { transform: scale(0.85); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
