'use client';

import AppLayout from '@/components/layout/AppLayout';

const licenses = [
  { id: 'LC001', name: 'นพ.สมชาย รักษาคน', type: 'ใบประกอบวิชาชีพเวชกรรม', issued: '2021-05-01', expires: '2026-04-30' },
  { id: 'LC002', name: 'นางพิม ใจดี', type: 'ใบอนุญาตพยาบาลวิชาชีพ', issued: '2023-01-15', expires: '2026-04-15' },
  { id: 'LC003', name: 'นายอนันต์ สุขใจ', type: 'ใบอนุญาตเภสัชกรรม', issued: '2022-06-20', expires: '2026-06-19' },
  { id: 'LC004', name: 'นางสาวมณี แก้วใส', type: 'ใบอนุญาตพยาบาลวิชาชีพ', issued: '2020-03-10', expires: '2026-03-09' },
  { id: 'LC005', name: 'นพ.วิชัย ดีมาก', type: 'ใบประกอบวิชาชีพเวชกรรม', issued: '2022-09-01', expires: '2027-08-31' },
];

function getStatus(days: number) {
  if (days < 0) return { label: 'หมดอายุแล้ว', cls: 'badge-red' };
  if (days <= 30) return { label: `หมดใน ${days} วัน`, cls: 'badge-red' };
  if (days <= 90) return { label: `หมดใน ${days} วัน`, cls: 'badge-yellow' };
  return { label: 'ปกติ', cls: 'badge-green' };
}

export default function LicensePage() {
  const calcDaysLeft = (expDate: string) => {
    const timeDiff = new Date(expDate).getTime() - new Date().getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const processedData = licenses.map(l => ({ ...l, daysLeft: calcDaysLeft(l.expires) })).sort((a,b) => a.daysLeft - b.daysLeft);
  const expiring = processedData.filter(l => l.daysLeft <= 90);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 ใบประกอบวิชาชีพ</h1>
          <p className="page-subtitle">
            {expiring.length} รายการใกล้หมดอายุหรือหมดแล้ว
          </p>
        </div>
      </div>

      {expiring.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 20, padding: '24px 28px', color: 'white', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>⚠️</div>
            <div>
              <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>System Alert</div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>พบใบประกอบวิชาชีพใกล้หมดอายุ {expiring.length} รายการ</div>
              <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>กรุณาดำเนินการแจ้งพนักงานเพื่อต่ออายุเอกสารโดยด่วน (เหลือน้อยกว่า 90 วัน)</div>
            </div>
          </div>
          <button style={{ background: '#fff', color: '#dc2626', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            ส่งอีเมลแจ้งเตือนทั้งหมด
          </button>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>รหัส</th><th>ชื่อ</th><th>ประเภทใบประกอบ</th><th>วันออก</th><th>หมดอายุ</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {processedData.map(l => {
              const { label, cls } = getStatus(l.daysLeft);
              return (
                <tr key={l.id} style={{ background: l.daysLeft < 0 ? '#fef2f2' : l.daysLeft <= 30 ? '#fff5f5' : l.daysLeft <= 90 ? '#fefce8' : 'transparent', transition: 'background 0.2s' }}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, color: '#475569' }}>{l.id}</span></td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{l.name}</div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>{l.type}</td>
                  <td style={{ fontSize: 13, color: '#475569' }}>{l.issued}</td>
                  <td style={{ fontSize: 13, color: l.daysLeft <= 90 ? '#ef4444' : '#475569', fontWeight: l.daysLeft <= 90 ? 700 : 400 }}>{l.expires}</td>
                  <td><span className={`badge ${cls}`}>{label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
