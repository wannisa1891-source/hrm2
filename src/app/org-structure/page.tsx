'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useDepartments';
import { usePositions } from '@/hooks/usePositions';
import type { Employee } from '@/services/apiService';

export default function PremiumEmployeePage() {
  const { employees, loading, loadEmployees, removeEmployee } = useEmployees();
  const { departments, loadDepartments } = useDepartments();
  const { positions, loadPositions } = usePositions();

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    loadPositions();
  }, []);

  const selectedEmp = useMemo(() =>
    employees.find(e => e.emp_id === selectedId),
    [selectedId, employees]
  );

  const getDeptName = (id: string) => departments.find(d => d.dept_id === id)?.dept_name || id;
  const getPosName = (id: string) => positions.find(p => p.pos_id === id)?.pos_name || id;

  const filtered = employees.filter(e =>
    `${e.first_name_th} ${e.last_name_th} ${e.emp_id}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div style={{ padding: '32px', background: '#fcfcfd', minHeight: '100vh', fontFamily: "'Inter', 'Sarabun', sans-serif" }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Directory</h1>
            <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '16px' }}>จัดการและดูข้อมูลสมาชิกในองค์กรของคุณ</p>
          </div>
          <button style={{
            background: '#111827', color: 'white', border: 'none', padding: '12px 24px',
            borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            + Add Employee
          </button>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <StatCard label="พนักงานทั้งหมด" value={employees.length} color="#6366f1" />
          <StatCard label="แผนก" value={departments.length} color="#10b981" />
          <StatCard label="ตำแหน่ง" value={positions.length} color="#f59e0b" />
        </div>

        {/* Search & Filter Bar */}
        <div style={{
          background: 'white', padding: '12px', borderRadius: '16px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f3f4f6'
        }}>
          <span style={{ margin: '0 12px', fontSize: '20px' }}>🔍</span>
          <input
            placeholder="Search by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', padding: '8px' }}
          />
        </div>

        {/* Data Table */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                <th style={thStyle}>NAME</th>
                <th style={thStyle}>ID / POSITION</th>
                <th style={thStyle}>DEPARTMENT</th>
                <th style={thStyle}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr
                  key={emp.emp_id}
                  onClick={() => setSelectedId(emp.emp_id)}
                  className="table-row"
                  style={{ borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.2s' }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6366f1' }}>
                        {emp.first_name_th[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{emp.first_name_th} {emp.last_name_th}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{emp.first_name_en}</div>
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{emp.emp_id}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{getPosName(emp.pos_id)}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ padding: '4px 12px', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontSize: '13px', fontWeight: 500 }}>
                      {getDeptName(emp.dept_id)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: emp.status === 'Active' ? '#10b981' : '#d1d5db' }} />
                      <span style={{ fontSize: '14px', color: '#374151' }}>{emp.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Sidebar Overlay */}
        {selectedId && <div style={overlayStyle} onClick={() => setSelectedId(null)} />}
        <div style={{
          ...sidebarStyle,
          transform: selectedId ? 'translateX(0)' : 'translateX(100%)',
          visibility: selectedId ? 'visible' : 'hidden'
        }}>
          {selectedEmp && (
            <div style={{ padding: '40px 32px' }}>
              <button onClick={() => setSelectedId(null)} style={closeBtnStyle}>✕</button>

              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '32px', background: '#f3f4f6', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  👤
                </div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>{selectedEmp.prefix}{selectedEmp.first_name_th}</h2>
                <p style={{ color: '#6b7280', margin: '4px 0' }}>{getPosName(selectedEmp.pos_id)}</p>
              </div>

              <DetailSection title="ข้อมูลการทำงาน">
                <DetailRow label="รหัสพนักงาน" value={selectedEmp.emp_id} />
                <DetailRow label="แผนก" value={getDeptName(selectedEmp.dept_id)} />
                <DetailRow label="ประเภทงาน" value={selectedEmp.emp_type} />
                <DetailRow label="วันที่เริ่มงาน" value={selectedEmp.start_date} />
              </DetailSection>

              <DetailSection title="การติดต่อ">
                <DetailRow label="เบอร์โทรศัพท์" value={selectedEmp.phone || '-'} />
                <DetailRow label="เลขบัตรประชาชน" value={selectedEmp.citizen_id} />
                <DetailRow label="ที่อยู่" value={selectedEmp.address} isLong />
              </DetailSection>

              <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                <button style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', fontWeight: 600, cursor: 'pointer' }}>แก้ไขข้อมูล</button>
                <button
                  onClick={() => { if (confirm('ต้องการลบพนักงาน?')) removeEmployee(selectedEmp.emp_id); }}
                  style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                >
                  🗑️
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// --- Sub-Components & Styles ---

function StatCard({ label, value, color }: any) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid #f3f4f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: color }}>{value}</div>
    </div>
  );
}

function DetailSection({ title, children }: any) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h4 style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', borderBottom: '1px solid #f3f4f6', paddingBottom: '8px' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</div>
    </div>
  );
}

function DetailRow({ label, value, isLong }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: isLong ? 'column' : 'row', justifyContent: 'space-between', gap: '4px' }}>
      <span style={{ fontSize: '14px', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500, textAlign: isLong ? 'left' : 'right' }}>{value}</span>
    </div>
  );
}

const thStyle: React.CSSProperties = { padding: '16px 24px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em' };
const tdStyle: React.CSSProperties = { padding: '20px 24px' };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.1)', backdropFilter: 'blur(4px)', zIndex: 40 };
const sidebarStyle: React.CSSProperties = {
  position: 'fixed', right: 0, top: 0, width: '420px', height: '100vh', background: 'white',
  zIndex: 50, transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '-20px 0 25px -5px rgba(0,0,0,0.1)'
};
const closeBtnStyle: React.CSSProperties = { position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' };