
$filePath = "c:\xampp\htdocs\hrm2\src\app\license\page.tsx"
$content = [System.IO.File]::ReadAllText($filePath)

# 1. Update the Renew Modal Grid
$oldGrid = '<div style={{ display: ''grid'', gridTemplateColumns: ''1fr 1fr'', gap: ''16px'' }}>\s+<div>\s+<div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#94a3b8'', marginBottom: ''4px'' }}>รหัสพนักงาน</div>\s+<div style={{ fontSize: ''15px'', fontWeight: 800 }}>{formData\.emp_id || selectedLicense\?\.emp_id}</div>\s+</div>\s+<div>\s+<div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#94a3b8'', marginBottom: ''4px'' }}>ตำแหน่ง</div>\s+<div style={{ fontSize: ''14px'', fontWeight: 800 }}>{currentEmp\?\.pos_name || ''-''}</div>\s+</div>\s+</div>'

$newGrid = '<div style={{ display: ''grid'', gridTemplateColumns: ''1fr 1fr'', gap: ''16px 20px'' }}>
                                           <div>
                                              <div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#94a3b8'', marginBottom: ''4px'' }}>รหัสพนักงาน</div>
                                              <div style={{ fontSize: ''15px'', fontWeight: 800, color: ''#0f172a'' }}>{formData.emp_id || selectedLicense?.emp_id}</div>
                                           </div>
                                           <div>
                                              <div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#94a3b8'', marginBottom: ''4px'' }}>ตำแหน่ง</div>
                                              <div style={{ fontSize: ''14px'', fontWeight: 800, color: ''#0f172a'' }}>{currentEmp?.pos_name || ''-''}</div>
                                           </div>
                                           <div>
                                              <div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#94a3b8'', marginBottom: ''4px'' }}>แผนก/หน่วยงาน</div>
                                              <div style={{ fontSize: ''14px'', fontWeight: 800, color: ''#0f172a'' }}>{currentEmp?.dept_name || ''-''}</div>
                                           </div>
                                           <div>
                                              <div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#94a3b8'', marginBottom: ''4px'' }}>ประเภทการจ้าง</div>
                                              <div style={{ fontSize: ''14px'', fontWeight: 800, color: ''#0f172a'' }}>{currentEmp?.emp_type || ''-''}</div>
                                           </div>
                                           <div style={{ gridColumn: ''span 2'', marginTop: ''4px'', paddingTop: ''12px'', borderTop: ''1px dashed #e2e8f0'' }}>
                                              <div style={{ fontSize: ''11px'', fontWeight: 800, color: ''#2563eb'', marginBottom: ''4px'' }}>คะแนนสะสม CNEU/CME ทั้งหมด</div>
                                              <div style={{ fontSize: ''20px'', fontWeight: 900, color: ''#1e40af'' }}>{currentEmp?.cneu_cme_points || ''0.00''}</div>
                                           </div>
                                        </div>'

$content = [regex]::Replace($content, $oldGrid, $newGrid)

# 2. Update remaining headers if missed
$content = $content -replace "Professional Credential", "ข้อมูลวุฒิบัตรและใบอนุญาต"
$content = $content -replace "Employee track record & past credentials", "ประวัติการต่ออายุและข้อมูลใบประกาศย้อนหลังทั้งหมด"

[System.IO.File]::WriteAllText($filePath, $content)
Write-Output "File updated successfully via Regex PowerShell script."
