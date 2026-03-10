'use client';

import AppLayout from '@/components/AppLayout';

const SHIFTS = [
  { id: 'A', name: 'เวรเช้า', time: '08:00 - 16:00', color: '#dbeafe', textColor: '#1d4ed8' },
  { id: 'B', name: 'เวรบ่าย', time: '16:00 - 00:00', color: '#fef9c3', textColor: '#a16207' },
  { id: 'C', name: 'เวรดึก', time: '00:00 - 08:00', color: '#fce7f3', textColor: '#be185d' },
  { id: 'D', name: 'วันหยุด', time: '-', color: '#dcfce7', textColor: '#166534' },
];

const STAFF = ['กมลพร ใจดี', 'สมชาย จริงใจ', 'วนิดา สุขใจ', 'อรทัย แก้วมณี', 'พิมลพร ลือชา'];

const DAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

function randomShift(dayIdx: number, staffIdx: number): string {
  const seed = (dayIdx * 13 + staffIdx * 7) % 4;
  return SHIFTS[seed].id;
}

export default function SchedulePage() {
  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🗓️ ตารางเวร</h1>
          <p className="page-subtitle">ตารางเวรประจำสัปดาห์ (ข้อมูลตัวอย่าง)</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {SHIFTS.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: s.color, color: s.textColor, padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{s.id}</span>
              <span style={{ fontSize: 13, color: '#666' }}>{s.name} ({s.time})</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อพนักงาน</th>
              {DAYS.map(d => <th key={d} style={{ textAlign: 'center' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {STAFF.map((name, si) => (
              <tr key={name}>
                <td style={{ fontWeight: 600 }}>{name}</td>
                {DAYS.map((_, di) => {
                  const shift = SHIFTS.find(s => s.id === randomShift(di, si));
                  return (
                    <td key={di} style={{ textAlign: 'center' }}>
                      <span style={{ background: shift?.color, color: shift?.textColor, padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: 13 }}>
                        {shift?.id}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
