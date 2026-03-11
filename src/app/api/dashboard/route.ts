import { NextResponse } from 'next/server';
import pool from '@/lib/hrn_db';

export async function GET() {
  try {
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

    return NextResponse.json({
      empCount,
      leaveTodayCount,
      vacantCount,
      professions,
      pendingTransfers,
      pendingLeaves
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
