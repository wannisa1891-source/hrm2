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
    fetch('/api/departments').then(r => r.json()).then(setDepartments);
  }, []);

  const loadDept = async (deptId: string) => {
    if (openDept === deptId) { setOpenDept(null); return; }
    setOpenDept(deptId);
    if (!empsByDept[deptId]) {
      const res = await fetch(`/api/employees/dept/${deptId}`);
      const data = await res.json();
      setEmpsByDept(p => ({ ...p, [deptId]: data }));
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 ผังองค์กร</h1>
          <p className="page-subtitle">{departments.length} แผนก</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {departments.map(dept => (
          <div key={dept.dept_id} className="glass-card" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <div
              onClick={() => loadDept(dept.dept_id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '4px 0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#4A5644', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                  {dept.dept_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{dept.dept_name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>รหัส: {dept.dept_id}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, color: '#888', background: '#f8fafc', padding: '4px 10px', borderRadius: 20 }}>
                {openDept === dept.dept_id ? '▲ ปิด' : '▼ ดูบุคลากร'}
              </span>
            </div>

            {openDept === dept.dept_id && (
              <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                {(empsByDept[dept.dept_id] || []).length === 0 ? (
                  <p style={{ color: '#888', fontSize: 13, textAlign: 'center' }}>ไม่มีบุคลากร</p>
                ) : (empsByDept[dept.dept_id] || []).map(e => (
                  <div key={e.emp_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      {e.first_name_th[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{e.prefix}{e.first_name_th} {e.last_name_th}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{e.pos_name}</div>
                    </div>
                    <span className="badge badge-green" style={{ marginLeft: 'auto' }}>Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
