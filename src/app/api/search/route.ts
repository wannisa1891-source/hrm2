import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/hrm_db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ success: true, results: [] });
    }

    const keyword = `%${q.trim()}%`;
    // 1. Search Employees
    // Search fields: first_name_th, last_name_th, emp_id, citizen_id, phone
    const employeesP = db.query(`
      SELECT 'employee' AS type, emp_id AS id, 
             CONCAT(first_name_th, ' ', last_name_th) AS title, 
             CONCAT('รหัส: ', emp_id, ' • แผนก: ', COALESCE(d.dept_name, 'ไม่ระบุ')) AS subtitle
      FROM tbl_employees e
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
      WHERE first_name_th LIKE ? OR last_name_th LIKE ? OR emp_id LIKE ? OR citizen_id LIKE ?
      LIMIT 5
    `, [keyword, keyword, keyword, keyword]);

    // 2. Search Leaves
    // Search fields: leave_id, status AND joined employee name
    const leavesP = db.query(`
      SELECT 'leave' AS type, leave_id AS id, 
             CONCAT('ใบลา ', leave_id) AS title,
             CONCAT('ผู้ลา: ', e.first_name_th, ' ', e.last_name_th, ' • สถานะ: ', l.status) AS subtitle
      FROM tbl_leaves l
      LEFT JOIN tbl_employees e ON l.emp_id = e.emp_id
      WHERE l.leave_id LIKE ? OR l.status LIKE ? OR e.first_name_th LIKE ? OR e.last_name_th LIKE ?
      LIMIT 5
    `, [keyword, keyword, keyword, keyword]);

    // 3. Search Transfers
    // Search fields: transfer_id, subject, order_no
    const transfersP = db.query(`
      SELECT 'transfer' AS type, transfer_id AS id,
             CONCAT('โยกย้าย: ', subject) AS title,
             CONCAT('เลขที่คำสั่ง: ', order_no) AS subtitle
      FROM tbl_transfers
      WHERE transfer_id LIKE ? OR subject LIKE ? OR order_no LIKE ?
      LIMIT 5
    `, [keyword, keyword, keyword]);

    // 4. Search Schedules
    // Search fields: nurse_name, shift
    const schedulesP = db.query(`
      SELECT 'schedule' AS type, id,
             CONCAT('เวร: ', nurse_name) AS title,
             CONCAT('วันที่: ', schedule_date, ' • กะ: ', shift) AS subtitle
      FROM tbl_schedules
      WHERE nurse_name LIKE ? OR shift LIKE ?
      LIMIT 5
    `, [keyword, keyword]);

    // 5. Search Announcements
    // Search fields: title
    const announcementsP = db.query(`
      SELECT 'announcement' AS type, id,
             title,
             CONCAT('วันที่ประกาศ: ', DATE_FORMAT(created_at, '%d/%m/%Y')) AS subtitle
      FROM tbl_announcements
      WHERE title LIKE ?
      LIMIT 5
    `, [keyword]);


    const results: any[] = [];
    const errors: any[] = [];

    await Promise.allSettled([
      employeesP.then((res: any) => results.push(...(Array.isArray(res[0]) ? res[0] : []))).catch((e: any) => errors.push({ type: 'employees', msg: e.message })),
      leavesP.then((res: any) => results.push(...(Array.isArray(res[0]) ? res[0] : []))).catch((e: any) => errors.push({ type: 'leaves', msg: e.message })),
      transfersP.then((res: any) => results.push(...(Array.isArray(res[0]) ? res[0] : []))).catch((e: any) => errors.push({ type: 'transfers', msg: e.message })),
      schedulesP.then((res: any) => results.push(...(Array.isArray(res[0]) ? res[0] : []))).catch((e: any) => errors.push({ type: 'schedules', msg: e.message })),
      announcementsP.then((res: any) => results.push(...(Array.isArray(res[0]) ? res[0] : []))).catch((e: any) => errors.push({ type: 'announcements', msg: e.message }))
    ]);

    if (errors.length > 0) {
      console.error('Global Search Partial Errors:', errors);
      // Return success with whatever we got, but attach errors for debugging
      return NextResponse.json({ success: true, results, debug_errors: errors });
    }

    return NextResponse.json({ success: true, results });

  } catch (err: any) {
    console.error('Global Search Fatal Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Search failed', stack: err.stack }, { status: 500 });
  }
}
