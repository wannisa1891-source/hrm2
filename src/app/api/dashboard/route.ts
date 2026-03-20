import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empId = searchParams.get('emp_id');
    const role = searchParams.get('role');
    const today = new Date().toISOString().split('T')[0];

    // Determine License Query
    let licenseQuery = `
      SELECT expire_date 
      FROM tbl_employee_licenses 
      WHERE status != 'Expired' AND status != 'Suspended'
    `;
    const queryParams: any[] = [];
    if (role !== 'admin' && empId) {
      licenseQuery += ` AND emp_id = ?`;
      queryParams.push(empId);
    }

    // Execute all queries in parallel
    const [
      empResult,
      leaveResult,
      profResult,
      transferResult,
      pendingLeavesResult,
      licenseResult
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM tbl_employees WHERE status = 'Active'"),
      pool.query("SELECT COUNT(*) as count FROM tbl_leaves WHERE ? >= start_date AND ? <= end_date", [today, today]),
      pool.query(`
        SELECT p.pos_name as name, COUNT(e.emp_id) as value
        FROM tbl_employees e
        LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
        WHERE e.status = 'Active'
        GROUP BY p.pos_name
      `),
      pool.query("SELECT COUNT(*) as count FROM tbl_transfers").catch(() => [[{ count: 0 }]]),
      pool.query("SELECT COUNT(*) as count FROM tbl_leaves WHERE status = 'Pending'"),
      pool.query(licenseQuery, queryParams)
    ]);

    const empCount = (empResult[0] as any[])[0].count;
    const leaveTodayCount = (leaveResult[0] as any[])[0].count;
    const vacantCount = 0;

    const colors = ['#4A5644', '#C5A073', '#8884d8', '#82ca9d', '#ffc658'];
    const professions = (profResult[0] as any[]).map((row, index) => ({
      name: row.name || 'ไม่ระบุ',
      value: row.value,
      color: colors[index % colors.length]
    }));

    const pendingTransfers = (transferResult[0] as any[])[0].count;
    const pendingLeaves = (pendingLeavesResult[0] as any[])[0].count;

    let expiringLicenses = 0;
    let expiredLicenses = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    (licenseResult[0] as any[]).forEach(row => {
      if (row.expire_date) {
        const expDate = new Date(row.expire_date);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
          expiredLicenses++;
        } else if (daysLeft <= 90) {
          expiringLicenses++;
        }
      }
    });

    return NextResponse.json({
      empCount,
      leaveTodayCount,
      vacantCount,
      professions,
      pendingTransfers,
      pendingLeaves,
      expiringLicenses,
      expiredLicenses
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
