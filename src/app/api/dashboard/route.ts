import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

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

    // Employee-specific queries for Dashboard
    let employeeQuotaQuery: Promise<any> = Promise.resolve([[]]);
    let employeeUsedLeavesQuery: Promise<any> = Promise.resolve([[]]);
    let employeeRecentLeavesQuery: Promise<any> = Promise.resolve([[]]);
    let employeePayrollQuery: Promise<any> = Promise.resolve([[]]);

    if (empId) {
      employeeQuotaQuery = pool.query('SELECT quota_vacation, quota_personal, quota_sick FROM tbl_employees WHERE emp_id = ?', [empId]);
      employeeUsedLeavesQuery = pool.query(`
        SELECT leave_type_id, DATEDIFF(end_date, start_date) + 1 AS used_days 
        FROM tbl_leaves 
        WHERE emp_id = ? AND status = 'Approved'
      `, [empId]);
      employeeRecentLeavesQuery = pool.query(`
        SELECT * 
        FROM tbl_leaves 
        WHERE emp_id = ? 
        ORDER BY start_date DESC 
        LIMIT 5
      `, [empId]);
      employeePayrollQuery = pool.query(`
        SELECT net_salary as currentNetSalary, pay_month, pay_year, status, payroll_id
        FROM tbl_payroll
        WHERE emp_id = ?
        ORDER BY pay_year DESC, pay_month DESC
        LIMIT 5
      `, [empId]);
    }

    // Execute all queries in parallel
    const [
      empResult,
      leaveResult,
      profResult,
      transferResult,
      pendingLeavesResult,
      licenseResult,
      userQuotaResult,
      userUsedResult,
      userRecentResult,
      userPayrollResult
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
      pool.query(licenseQuery, queryParams),
      employeeQuotaQuery,
      employeeUsedLeavesQuery,
      employeeRecentLeavesQuery,
      employeePayrollQuery
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

    let leaveStats = {
      vacation: { remain: 0, used: 0, raw: 0 },
      personal: { remain: 0, used: 0, raw: 0 },
      sick: { remain: 0, used: 0, raw: 0 },
    };
    let recentLeaves: any[] = [];

    if (empId) {
      const quotaRows = userQuotaResult[0] as any[];
      if (quotaRows.length > 0) {
        leaveStats.vacation.raw = quotaRows[0].quota_vacation || 0;
        leaveStats.personal.raw = quotaRows[0].quota_personal || 0;
        leaveStats.sick.raw = quotaRows[0].quota_sick || 0;
      }

      const usedRows = userUsedResult[0] as any[];
      usedRows.forEach((row: any) => {
        const days = Number(row.used_days) || 0;
        if (row.leave_type_id === 'L03') leaveStats.vacation.used += days;
        if (row.leave_type_id === 'L02') leaveStats.personal.used += days;
        if (row.leave_type_id === 'L01') leaveStats.sick.used += days;
      });

      leaveStats.vacation.remain = Math.max(0, leaveStats.vacation.raw - leaveStats.vacation.used);
      leaveStats.personal.remain = Math.max(0, leaveStats.personal.raw - leaveStats.personal.used);
      leaveStats.sick.remain = Math.max(0, leaveStats.sick.raw - leaveStats.sick.used);

      recentLeaves = userRecentResult[0] as any[];
    }

    const MONTHS_TH = [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ];

    let payrollSummary = null;
    if (empId) {
      const payrollRows = userPayrollResult[0] as any[];
      if (payrollRows.length > 0) {
        payrollSummary = {
          currentNetSalary: Number(payrollRows[0].currentNetSalary || 0),
          paymentDate: payrollRows[0].status === 'Paid' ? 'โอนเข้าบัญชีสำเร็จ' : 'รอสั่งจ่าย',
          history: payrollRows.slice(0, 3).map((r: any) => ({
            month: `${MONTHS_TH[r.pay_month - 1]} ${r.pay_year}`,
            amount: Number(r.currentNetSalary || 0),
            date: r.status === 'Paid' ? 'โอนเงินแล้ว' : 'ยังไม่ระบุ'
          }))
        };
      } else {
        payrollSummary = {
          currentNetSalary: 0,
          paymentDate: '-',
          history: []
        };
      }
    }

    return NextResponse.json({
      empCount,
      leaveTodayCount,
      vacantCount,
      professions,
      pendingTransfers,
      pendingLeaves,
      expiringLicenses,
      expiredLicenses,
      leaveStats,
      recentLeaves,
      payrollData: payrollSummary
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
