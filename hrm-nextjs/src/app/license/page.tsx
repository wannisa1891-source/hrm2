'use client';

import AppLayout from '@/components/AppLayout';

const licenses = [
  { id: 'LC001', name: 'นพ.สมชาย รักษาคน', type: 'ใบประกอบวิชาชีพเวชกรรม', issued: '2021-05-01', expires: '2026-04-30', daysLeft: 51 },
  { id: 'LC002', name: 'นางพิม ใจดี', type: 'ใบอนุญาตพยาบาลวิชาชีพ', issued: '2023-01-15', expires: '2026-04-15', daysLeft: 36 },
  { id: 'LC003', name: 'นายอนันต์ สุขใจ', type: 'ใบอนุญาตเภสัชกรรม', issued: '2022-06-20', expires: '2026-06-19', daysLeft: 101 },
  { id: 'LC004', name: 'นางสาวมณี แก้วใส', type: 'ใบอนุญาตพยาบาลวิชาชีพ', issued: '2020-03-10', expires: '2026-03-09', daysLeft: -1 },
  { id: 'LC005', name: 'นพ.วิชัย ดีมาก', type: 'ใบประกอบวิชาชีพเวชกรรม', issued: '2022-09-01', expires: '2027-08-31', daysLeft: 540 },
];

function getStatus(days: number) {
  if (days < 0) return { label: 'หมดอายุแล้ว', cls: 'badge-red' };
  if (days <= 30) return { label: `หมดใน ${days} วัน`, cls: 'badge-red' };
  if (days <= 90) return { label: `หมดใน ${days} วัน`, cls: 'badge-yellow' };
  return { label: 'ปกติ', cls: 'badge-green' };
}

export default function LicensePage() {
  const expiring = licenses.filter(l => l.daysLeft <= 90);

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
        <div style={{ background: 'linear-gradient(135deg, #4A5644, #2d3436)', borderRadius: 20, padding: '20px 24px', color: 'white', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>🔔 System Alert</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>มีใบประกอบวิชาชีพใกล้หมดอายุ {expiring.length} รายการ</div>
          </div>
          <span style={{ background: '#C5A073', padding: '8px 20px', borderRadius: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>จำเป็นต้องต่ออายุ</span>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr><th>รหัส</th><th>ชื่อ</th><th>ประเภทใบประกอบ</th><th>วันออก</th><th>หมดอายุ</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {licenses.map(l => {
              const { label, cls } = getStatus(l.daysLeft);
              return (
                <tr key={l.id}>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.id}</span></td>
                  <td style={{ fontWeight: 600 }}>{l.name}</td>
                  <td style={{ fontSize: 13, color: '#666' }}>{l.type}</td>
                  <td style={{ fontSize: 13 }}>{l.issued}</td>
                  <td style={{ fontSize: 13 }}>{l.expires}</td>
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
