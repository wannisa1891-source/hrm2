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

    if (empId) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const isPostOct = now.getMonth() >= 9;
      const fyStart = isPostOct ? `${currentYear}-10-01` : `${currentYear - 1}-10-01`;
      const fyEnd = isPostOct ? `${currentYear + 1}-09-30` : `${currentYear}-09-30`;

      employeeQuotaQuery = pool.query('SELECT quota_vacation, quota_personal, quota_sick, accumulated_vacation FROM tbl_employees WHERE emp_id = ?', [empId]);
      employeeUsedLeavesQuery = pool.query(`
        SELECT leave_type_id, DATEDIFF(end_date, start_date) + 1 AS used_days 
        FROM tbl_leaves 
        WHERE emp_id = ? AND status = 'Approved'
        AND start_date >= ? AND start_date <= ?
      `, [empId, fyStart, fyEnd]);
      employeeRecentLeavesQuery = pool.query(`
        SELECT * 
        FROM tbl_leaves 
        WHERE emp_id = ? 
        ORDER BY start_date DESC 
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
      capacityResult,
      reimburseResult
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM tbl_employees WHERE status IN ('Active', 'A', 'ทำงานปกติ')"),
      pool.query("SELECT COUNT(*) as count FROM tbl_leaves WHERE ? >= start_date AND ? <= end_date", [today, today]),
      pool.query(`
        SELECT d.division as name, COALESCE(d.dept_name, e.working_at) as dept_name, COUNT(e.emp_id) as value
        FROM tbl_employees e
        LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
        GROUP BY d.division, COALESCE(d.dept_name, e.working_at)

      `),
      pool.query("SELECT COUNT(*) as count FROM tbl_transfers").catch(() => [[{ count: 0 }]]),
      pool.query("SELECT COUNT(*) as count FROM tbl_leaves WHERE status = 'Pending'"),
      pool.query(licenseQuery, queryParams),
      employeeQuotaQuery,
      employeeUsedLeavesQuery,
      employeeRecentLeavesQuery,
      pool.query("SELECT SUM(capacity) as total_capacity FROM tbl_departments"),
      pool.query("SELECT COUNT(*) as count FROM tbl_reimbursements").catch(() => [[{ count: 0 }]])
    ]);

    const empCount = (empResult[0] as any[])[0].count;
    const leaveTodayCount = (leaveResult[0] as any[])[0].count;
    const totalCapacity = (capacityResult[0] as any[])[0].total_capacity || 0;
    const vacantCount = Math.max(0, totalCapacity - empCount);
    const reimburseCount = (reimburseResult[0] as any[])[0].count || 0;

    const [allDivisionsResult]: any = await pool.query("SELECT DISTINCT division FROM tbl_departments WHERE division IS NOT NULL AND division != ''");

    const colors = ['#4A5644', '#C5A073', '#8884d8', '#82ca9d', '#ffc658', '#4b5563', '#10b981', '#3b82f6'];
    const divisionMap = new Map<string, { name: string; value: number; subDepts: any[] }>();
    
    // Initialize "แอดมิน"
    divisionMap.set('แอดมิน', { name: 'แอดมิน', value: 0, subDepts: [] });
    
    // Initialize all divisions from DB
    (allDivisionsResult as any[]).forEach(row => {
      const divName = row.division;
      if (!divisionMap.has(divName)) {
        divisionMap.set(divName, { name: divName, value: 0, subDepts: [] });
      }
    });

    
    (profResult[0] as any[]).forEach(row => {
      let divName = row.name;
      if (!divName) {
        divName = 'กลุ่มงานบริหารทั่วไป';
      } else if (divName === 'กลุ่มงานบริหารทั่วไป') {
        divName = 'แอดมิน';
      }
      const deptName = row.dept_name || 'ไม่ระบุ';


      const count = Number(row.value) || 0;

      if (!divisionMap.has(divName)) {
        divisionMap.set(divName, { name: divName, value: 0, subDepts: [] });
      }

      const div = divisionMap.get(divName)!;
      div.value += count;
      div.subDepts.push({ name: deptName, value: count });
    });

    const professions = Array.from(divisionMap.values())
      .map((div) => ({
        name: div.name,
        value: div.value,
        subDepts: div.subDepts.sort((a, b) => b.value - a.value)
      }))
      .sort((a, b) => {
        if (a.name === 'แอดมิน') return -1;
        if (b.name === 'แอดมิน') return 1;
        return 0;
      })
      .map((prof, index) => ({
        ...prof,
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
        leaveStats.vacation.raw = (quotaRows[0].quota_vacation || 0) + (quotaRows[0].accumulated_vacation || 0);
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



    // Calculate retirement count for current FY
    const nowRetire = new Date();
    let currentFY = nowRetire.getFullYear() + 543;
    if (nowRetire.getMonth() >= 9) {
      currentFY += 1;
    }

    const [birthDates]: any = await pool.query(`
      SELECT birth_date 
      FROM tbl_employees 
      WHERE birth_date IS NOT NULL AND birth_date != '1900-01-01' AND status IN ('Active', 'A', 'ทำงานปกติ')
    `);

    let retirementCount = 0;
    birthDates.forEach((emp: any) => {
      const birthDate = new Date(emp.birth_date);
      const birthYearBE = birthDate.getFullYear() + 543;
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();

      let retirementYearBE = birthYearBE + 60;
      if (birthMonth > 10 || (birthMonth === 10 && birthDay >= 2)) {
        retirementYearBE += 1;
      }

      if (retirementYearBE === currentFY) {
        retirementCount += 1;
      }
    });

    return NextResponse.json({


      empCount,
      leaveTodayCount,
      vacantCount,
      reimburseCount,
      professions,
      pendingTransfers,
      pendingLeaves,
      expiringLicenses,
      expiredLicenses,
      leaveStats,
      recentLeaves,
      retirementCount
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DB Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
