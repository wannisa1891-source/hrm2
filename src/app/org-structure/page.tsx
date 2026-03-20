'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';

interface Department { dept_id: string; dept_name: string; }
interface Employee { emp_id: string; prefix: string; first_name_th: string; last_name_th: string; pos_name: string; status: string; image: string; }

export default function OrgStructurePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [empsByDept, setEmpsByDept] = useState<Record<string, Employee[]>>({});
  const [openDept, setOpenDept] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then(data => {
        setDepartments(data);
      });
  }, []);

  const loadDept = async (deptId: string) => {
    if (openDept === deptId) { setOpenDept(null); return; }
    setOpenDept(deptId);
    if (!empsByDept[deptId]) {
      const res = await fetch(`/api/employees/dept/${deptId}`);
      const data = await res.json();
      setEmpsByDept(p => ({ ...p, [deptId]: data.data || data }));
    }
  };

  return (
    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">🏢 ผังองค์กร</h1>
            <p className="page-subtitle">โครงสร้างแผนกและบุคลากรทั้งหมด ({departments.length} แผนก)</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {departments.map(dept => (
            <div key={dept.dept_id} className="glass-card hover-glow" style={{ borderRadius: '20px', overflow: 'hidden', padding: '20px', transition: 'all 0.3s ease' }}>
              <div
                onClick={() => loadDept(dept.dept_id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #bc9c72 0%, #9d8461 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', boxShadow: '0 4px 10px rgba(188, 156, 114, 0.3)' }}>
                    {dept.dept_name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>{dept.dept_name}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>รหัส: {dept.dept_id}</div>
                  </div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: openDept === dept.dept_id ? '#3b82f6' : '#64748b', background: openDept === dept.dept_id ? '#eff6ff' : '#f1f5f9', padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s' }}>
                  {openDept === dept.dept_id ? '▲ ซ่อน' : '▼ ดูบุคลากร'}
                </span>
              </div>

              {openDept === dept.dept_id && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px', animation: 'fadeIn 0.3s ease' }}>
                  {(empsByDept[dept.dept_id] || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '14px' }}>ไม่มีบุคลากรในแผนกนี้</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {(empsByDept[dept.dept_id] || []).map(e => (
                        <div key={e.emp_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', transition: 'background 0.2s' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, color: '#64748b', overflow: 'hidden' }}>
                            {e.image ? <img src={`/uploads/${e.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : e.first_name_th[0]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a' }}>{e.prefix}{e.first_name_th} {e.last_name_th}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{e.pos_name}</div>
                          </div>
                          <span className={`badge ${e.status === 'Active' ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '11px' }}>{e.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
