import { NextResponse } from 'next/server';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const data = [
      { 'รหัสพนักงาน': 'EMP901', 'คำนำหน้า': 'นาย', 'ชื่อ (TH)': 'สมชาย', 'นามสกุล (TH)': 'ใจดี', 'บัตรประชาชน': '1111111111111', 'เบอร์โทร': '0812345678', 'อีเมล': 'somchai@test.com', 'เงินเดือน': 25000, 'แผนก': 'อายุรกรรม', 'ตำแหน่ง': 'แพทย์' },
      { 'รหัสพนักงาน': 'EMP902', 'คำนำหน้า': 'นางสาว', 'ชื่อ (TH)': 'สมหญิง', 'นามสกุล (TH)': 'รักเรียน', 'บัตรประชาชน': '2222222222222', 'เบอร์โทร': '', 'อีเมล': '', 'เงินเดือน': 28000, 'แผนก': 'ศัลยกรรม', 'ตำแหน่ง': 'พยาบาลวิชาชีพ' }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="sample_employees.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
