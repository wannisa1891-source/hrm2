'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';

export default function EmployeesSplitPage() {
  const { employees, loading, loadEmployees } = useEmployees();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  const filtered = employees.filter(e =>
    `${e.first_name_th} ${e.last_name_th}`.includes(search) || e.emp_id.includes(search)
  );

  const selectedEmp = employees.find(e => e.emp_id === selectedId) || filtered[0];

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].emp_id);
  }, [filtered, selectedId]);

  return (
    <AppLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 100px)', background: '#f8fafc', margin: '-20px', overflow: 'hidden' }}>

        {/* --- ฝั่งซ้าย: รายชื่อ (Master List) --- */}
        <div style={{ width: '350px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '15px' }}>พนักงาน ({filtered.length})</h2>
            <div style={{ position: 'relative' }}>
              <input
                placeholder="ค้นหาชื่อหรือรหัส..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 12px 10px 35px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>🔍</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(emp => (
              <div
                key={emp.emp_id}
                onClick={() => setSelectedId(emp.emp_id)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f8fafc',
                  background: selectedId === emp.emp_id ? '#eff6ff' : 'transparent',
                  borderLeft: selectedId === emp.emp_id ? '4px solid #2563eb' : '4px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                    {emp.first_name_th[0]}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{emp.first_name_th} {emp.last_name_th}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>#{emp.emp_id} • {emp.emp_type}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- ฝั่งขวา: รายละเอียด (Detail View) --- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px', background: 'white' }}>
          {selectedEmp ? (
            <div style={{ maxWidth: '800px' }}>
              {/* Header Profile */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: '#f1f5f9', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
                    {selectedEmp.image ? <img src={`/uploads/${selectedEmp.image}`} alt="" style={{ width: '100%', height: '100%', borderRadius: '26px', objectFit: 'cover' }} /> : '👤'}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>{selectedEmp.prefix}{selectedEmp.first_name_th} {selectedEmp.last_name_th}</h1>
                    <p style={{ color: '#64748b', fontSize: '16px', margin: '5px 0' }}>{selectedEmp.first_name_en} {selectedEmp.last_name_en}</p>
                    <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#16a34a', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{selectedEmp.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>แก้ไขข้อมูล</button>
                  <button style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer' }}>ลบ</button>
                </div>
              </div>

              {/* Data Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px' }}>
                <section>
                  <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>ข้อมูลการทำงาน</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <InfoItem label="แผนก" value={selectedEmp.dept_id} />
                    <InfoItem label="ตำแหน่ง" value={selectedEmp.pos_id} />
                    <InfoItem label="ประเภทการจ้างงาน" value={selectedEmp.emp_type} />
                    <InfoItem label="วันที่เริ่มงาน" value={selectedEmp.start_date} />
                  </div>
                </section>
                <section>
                  <h3 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>ข้อมูลส่วนตัว</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <InfoItem label="เลขบัตรประชาชน" value={selectedEmp.citizen_id} />
                    <InfoItem label="เบอร์โทรศัพท์" value={selectedEmp.phone} />
                    <InfoItem label="เพศ" value={selectedEmp.gender} />
                    <InfoItem label="เงินเดือนพื้นฐาน" value={`฿${Number(selectedEmp.base_salary).toLocaleString()}`} />
                  </div>
                </section>
              </div>

              <div style={{ marginTop: '40px', padding: '20px', background: '#f8fafc', borderRadius: '15px' }}>
                <h3 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '10px' }}>ที่อยู่ปัจจุบัน</h3>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{selectedEmp.address || 'ไม่ได้ระบุข้อมูลที่อยู่'}</p>
              </div>

            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              กรุณาเลือกพนักงานเพื่อดูรายละเอียด
            </div>
          )}
        </div>

      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string, value: any }) {
  return (
    <div>
      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: 500 }}>{value || '-'}</div>
    </div>
  );
}