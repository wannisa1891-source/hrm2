import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const empId = searchParams.get('emp_id');
    const role = searchParams.get('role');
    // 1. Employee Count
    const [empRows] = await pool.query("SELECT COUNT(*) as count FROM tbl_employees WHERE status = 'Active'");
    const empCount = (empRows as any[])[0].count;

    // 2. Leaves Today (Overlapping with today)
    const today = new Date().toISOString().split('T')[0];
    const [leaveRows] = await pool.query("SELECT COUNT(*) as count FROM tbl_leaves WHERE ? >= start_date AND ? <= end_date", [today, today]);
    const leaveTodayCount = (leaveRows as any[])[0].count;

    // 3. Vacant Positions (Mock for now)
    const vacantCount = 0;

    // 4. Professions (Donut chart data)
    const [profRows] = await pool.query(`
      SELECT p.pos_name as name, COUNT(e.emp_id) as value
      FROM tbl_employees e
      LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
      WHERE e.status = 'Active'
      GROUP BY p.pos_name
    `);

    const colors = ['#4A5644', '#C5A073', '#8884d8', '#82ca9d', '#ffc658'];
    const professions = (profRows as any[]).map((row, index) => ({
      name: row.name || 'ไม่ระบุ',
      value: row.value,
      color: colors[index % colors.length]
    }));

    // 5. Pending Transfers (Assume all in tbl_transfers are pending for now if no status column)
    let pendingTransfers = 0;
    try {
      const [transferRows] = await pool.query("SELECT COUNT(*) as count FROM tbl_transfers");
      pendingTransfers = (transferRows as any[])[0].count;
    } catch (e) {
      // Fallback if table doesn't exist
    }

    // 6. Pending Leaves
    const [pendingLeavesRows] = await pool.query("SELECT COUNT(*) as count FROM tbl_leaves WHERE status = 'Pending'");
    const pendingLeaves = (pendingLeavesRows as any[])[0].count;

    // 7. Expiring and Expired Licenses
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

    const [licenseRows] = await pool.query(licenseQuery, queryParams);
    
    let expiringLicenses = 0;
    let expiredLicenses = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    (licenseRows as any[]).forEach(row => {
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
