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
      <style>{`
        /* CSS for Tree Diagram */
        .org-tree {
          display: flex;
          justify-content: center;
          padding: 40px;
          overflow-x: auto;
          background: #f8fafc;
          border-radius: 24px;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.02);
        }
        .org-tree ul {
          padding-top: 20px; position: relative;
          transition: all 0.5s;
          -webkit-transition: all 0.5s;
          -moz-transition: all 0.5s;
          display: flex;
          justify-content: center;
          padding-left: 0;
        }
        .org-tree li {
          float: left; text-align: center;
          list-style-type: none;
          position: relative;
          padding: 20px 5px 0 5px;
          transition: all 0.5s;
          -webkit-transition: all 0.5s;
          -moz-transition: all 0.5s;
        }
        /* Connectors */
        .org-tree li::before, .org-tree li::after {
          content: ''; position: absolute; top: 0; right: 50%;
          border-top: 2px solid #cbd5e1;
          width: 50%; height: 20px;
        }
        .org-tree li::after {
          right: auto; left: 50%;
          border-left: 2px solid #cbd5e1;
        }
        /* Remove connectors for single children */
        .org-tree li:only-child::after, .org-tree li:only-child::before {
          display: none;
        }
        .org-tree li:only-child { padding-top: 0; }
        /* Remove left connector from first child and right from last */
        .org-tree li:first-child::before, .org-tree li:last-child::after {
          border: 0 none;
        }
        /* Add back vertical line for first/last nodes */
        .org-tree li:first-child::after {
          border-radius: 6px 0 0 0;
          -webkit-border-radius: 6px 0 0 0;
          -moz-border-radius: 6px 0 0 0;
        }
        .org-tree li:last-child::before {
          border-right: 2px solid #cbd5e1;
          border-radius: 0 6px 0 0;
          -webkit-border-radius: 0 6px 0 0;
          -moz-border-radius: 0 6px 0 0;
        }
        /* Connector to children */
        .org-tree ul ul::before {
          content: '';
          position: absolute; top: 0; left: 50%;
          border-left: 2px solid #cbd5e1;
          width: 0; height: 20px;
          transform: translateX(-50%);
        }
        /* The node card */
        .org-node {
          background: #fff;
          border: 1px solid #e2e8f0;
          padding: 16px 24px;
          border-radius: 16px;
          display: inline-block;
          min-width: 160px;
          box-shadow: 0 4px 14px rgba(0,0,0,0.05);
          position: relative;
          z-index: 1;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .org-node:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          border-color: #6366f1;
        }
        .org-node-title {
          font-weight: 800;
          font-size: 15px;
          color: #1e293b;
          margin-bottom: 4px;
        }
        .org-node-sub {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .org-node-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800;
          margin: 0 auto 12px auto;
          box-shadow: 0 4px 10px rgba(99,102,241,0.3);
        }
        /* Level variations */
        .level-0 .org-node-icon { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 4px 10px rgba(245,158,11,0.3); }
        .level-1 .org-node-icon { background: linear-gradient(135deg, #0ea5e9, #0284c7); box-shadow: 0 4px 10px rgba(14,165,233,0.3); }
        
        .org-emp-list {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed #e2e8f0;
          display: flex; flex-direction: column; gap: 8px;
          max-height: 200px;
          overflow-y: auto;
          text-align: left;
        }
        .org-emp-item {
          display: flex; align-items: center; gap: 8px;
          padding: 6px; border-radius: 8px;
          background: #f8fafc;
        }
        .org-emp-item:hover { background: #f1f5f9; }
        .org-emp-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #e2e8f0; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #475569;
          flex-shrink: 0;
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 โครงสร้างองค์กร (Organization Chart)</h1>
          <p className="page-subtitle">แสดงสายการบังคับบัญชาและบุคลากรในแต่ละแผนก</p>
        </div>
      </div>

      <div className="org-tree">
        <ul>
          <li className="level-0">
            <div className="org-node">
              <div className="org-node-icon">💼</div>
              <div className="org-node-title">ผู้อำนวยการ / ผู้บริหาร</div>
              <div className="org-node-sub">Executive Level</div>
            </div>
            <ul>
              {departments.map((dept, idx) => (
                <li key={dept.dept_id} className={idx % 2 === 0 ? "level-1" : "level-2"}>
                  <div className="org-node">
                    <div className="org-node-icon">{dept.dept_name.substring(0, 1)}</div>
                    <div className="org-node-title">{dept.dept_name}</div>
                    <div className="org-node-sub">รหัส: {dept.dept_id}</div>
                    
                    <button 
                      onClick={() => loadDept(dept.dept_id)} 
                      style={{ marginTop: 12, width: '100%', padding: '6px 0', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#475569' }}
                    >
                      {openDept === dept.dept_id ? '▲ ซ่อนบุคลากร' : `▼ ดูบุคลากร (${empsByDept[dept.dept_id]?.length || '?'})`}
                    </button>

                    {openDept === dept.dept_id && empsByDept[dept.dept_id] && (
                      <div className="org-emp-list">
                        {empsByDept[dept.dept_id].length === 0 ? (
                          <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', padding: '10px 0' }}>ไม่มีบุคลากร</div>
                        ) : empsByDept[dept.dept_id].map(e => (
                          <div key={e.emp_id} className="org-emp-item">
                            <div className="org-emp-avatar">{e.first_name_th.substring(0, 1)}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.prefix}{e.first_name_th} {e.last_name_th}</div>
                              <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.pos_name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </div>
    </AppLayout>
  );
}
