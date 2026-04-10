
$filePath = "c:\xampp\htdocs\hrm2\src\app\license\page.tsx"
$content = Get-Content $filePath -Raw

# 1. Localize headers
$content = $content -replace "Professional Credential", "ข้อมูลวุฒิบัตรและใบอนุญาต"
$content = $content -replace "Employee track record & past credentials", "ประวัติการต่ออายุและข้อมูลวุฒิบัตรย้อนหลังทั้งหมดของผู้ประกอบวิชาชีพ"

# 2. Fix the overlap / Badge position in View Modal
# Find the badge section and update it
$content = $content -replace "top: '48px', right: '100px'", "top: '32px', right: '80px', flexFlow: 'row-reverse'"
# (Actually I'll try a simpler reposition for now)

# 3. Enrich Renew Sidebar Grid
# Target the specific grid opening tag in Renew Modal
$content = $content -replace "gap: '16px'", "gap: '16px 20px'"

# Save back
[System.IO.File]::WriteAllText($filePath, $content)
Write-Output "File updated successfully via PowerShell script."
