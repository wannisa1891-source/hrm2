const fs = require('fs');

const orig = fs.readFileSync('src/app/employees/page.tsx', 'utf8');
const lines = orig.split('\n');

// Find start and end exactly.
let startIdx = lines.findIndex(l => l.includes('<AppLayout>'));
let endIdx = lines.findIndex(l => l.includes('{/* Beautiful High-End Edit/Add Modal */}'));

if (startIdx !== -1 && endIdx !== -1) {
  const newLines = `    <AppLayout>
      <div style={{ padding: '24px', minHeight: 'calc(100vh - 65px)' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">ทะเบียนบุคลากร</h1>
            <div className="page-subtitle">จัดการรายชื่อและข้อมูลส่วนตัวของพนักงานทั้งหมดในระบบ</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline hover-glow" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              ดาวน์โหลด EXCEL
            </button>
            <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              เพิ่มพนักงานใหม่
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div className="filter-bar">
            <div className="search-input-wrap" style={{ flex: '1 1 300px' }}>
              <svg className="search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="ค้นหาชื่อหรือรหัสพนักงาน..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="all">ทุกแผนก</option>
                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterPos} onChange={e => setFilterPos(e.target.value)}>
                <option value="all">ทุกตำแหน่ง</option>
                {positions.map(p => <option key={p.pos_id} value={p.pos_id}>{p.pos_name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">สถานะการทำงาน: ทั้งหมด</option>
                <option value="Active">Active (ทำงานอยู่)</option>
                <option value="Inactive">Inactive (พ้นสภาพ)</option>
            </select>
            <select className="form-select" style={{ width: 'auto', minWidth: '160px' }} value={filterLicense} onChange={e => setFilterLicense(e.target.value)}>
                <option value="all">ใบประกอบฯ: ทั้งหมด</option>
                <option value="Active">ปกติ (Active)</option>
                <option value="Expiring Soon">ใกล้หมดอายุ</option>
                <option value="Expired">หมดอายุแล้ว</option>
                <option value="Suspended">พักใช้/ระงับ</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '80px' }}>รูปภาพ</th>
                  <th>ชื่อ-สกุลพนักงาน</th>
                  <th>ตำแหน่ง</th>
                  <th>แผนก/งาน</th>
                  <th style={{ textAlign: 'center' }}>สถานะ</th>
                  <th style={{ textAlign: 'center', width: '120px' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูลพนักงาน...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>ไม่มีข้อมูลพนักงานที่ตรงกับการค้นหา</td></tr>
                ) : (
                  currentData.map((emp) => (
                    <tr key={emp.emp_id} style={{ background: emp.license_status === 'Expired' ? '#fff5f5' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '0 auto', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                          {emp.image ? <img src={\`/uploads/\${emp.image}\`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{color:'#94a3b8', fontSize: '20px'}}>👤</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                          {emp.prefix}{emp.first_name_th} {emp.last_name_th} 
                          {emp.license_status === 'Expired' && <span className="badge badge-red" title="ใบประกอบวิชาชีพหมดอายุ">หมดอายุ</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>รหัส: {emp.emp_id}</div>
                      </td>
                      <td style={{ color: '#334155', fontWeight: 500 }}>{getPosName(emp.pos_id)}</td>
                      <td style={{ color: '#334155' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                          {getDeptName(emp.dept_id)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={\`badge \${emp.status === 'Active' ? 'badge-green' : 'badge-gray'}\`}>
                          {emp.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-btn-group" style={{ justifyContent: 'center' }}>
                          <button className="icon-btn hover-glow" onClick={() => openEdit(emp)} title="แก้ไขข้อมูล" style={{ color: '#3b82f6' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button className="icon-btn hover-glow" onClick={() => handleDelete(emp.emp_id)} title="ลบข้อมูล" style={{ color: '#ef4444', background: '#fef2f2' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>แสดงรายการจากทั้งหมด {filteredData.length} รายการ</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  หน้าก่อน
                </button>
                <div style={{ background: '#f1f5f9', padding: '6px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
                  {currentPage} / {totalPages}
                </div>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  หน้าถัดไป
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
`.split('\\n');

  lines.splice(startIdx, endIdx - startIdx, ...newLines);
  fs.writeFileSync('src/app/employees/page.tsx', lines.join('\\n'), 'utf8');
} else {
  console.error("Tags not found");
}
