import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';
import { getQuotaByType, ACCUMULATION_LIMITS } from '@/constants/leaveRules';
import { getCurrentFiscalYearRange } from '@/lib/dateUtils';

export async function POST(req: NextRequest) {
  try {
    // This should ideally be protected by a secret or internal network check
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { start: currentFYStart, end: currentFYEnd } = getCurrentFiscalYearRange();
    
    // We want to calculate based on the fiscal year that JUST ENDED
    // If today is Oct 1, 2026, getCurrentFiscalYearRange returns Oct 1, 2026 - Sep 30, 2027.
    // The previous FY was Oct 1, 2025 - Sep 30, 2026.
    const prevFYStart = new Date(currentFYStart);
    prevFYStart.setFullYear(prevFYStart.getFullYear() - 1);
    const prevFYEnd = new Date(currentFYEnd);
    prevFYEnd.setFullYear(prevFYEnd.getFullYear() - 1);

    console.log(`Resetting quotas. Previous FY: ${prevFYStart.toISOString()} to ${prevFYEnd.toISOString()}`);

    const [employees] = await pool.query('SELECT * FROM tbl_employees') as any[];

    for (const emp of employees) {
      const baseQuotas = getQuotaByType(emp.emp_type, emp.start_date);
      
      // 1. Calculate used vacation in the previous FY
      const [usedRes] = await pool.query(
        `SELECT SUM(DATEDIFF(end_date, start_date) + 1) as used 
         FROM tbl_leaves 
         WHERE emp_id = ? AND leave_type_id = 'L03' AND status = 'Approved' 
         AND start_date >= ? AND start_date <= ?`,
        [emp.emp_id, prevFYStart, prevFYEnd]
      ) as any[];
      
      const usedVacation = usedRes[0].used || 0;
      const totalAvailablePrev = (emp.quota_vacation || 0) + (emp.accumulated_vacation || 0);
      const remainingVacation = Math.max(0, totalAvailablePrev - usedVacation);

      // 2. Calculate new accumulation
      let newAccumulated = 0;
      if (baseQuotas.canAccumulateVacation) {
        const limit = ACCUMULATION_LIMITS[emp.emp_type as keyof typeof ACCUMULATION_LIMITS] || 20;
        newAccumulated = Math.min(remainingVacation, limit);
      }

      // 3. Update employee with new base quotas and accumulated days
      await pool.query(
        `UPDATE tbl_employees 
         SET quota_personal = ?, quota_sick = ?, quota_vacation = ?, accumulated_vacation = ? 
         WHERE emp_id = ?`,
        [baseQuotas.personal, baseQuotas.sick, baseQuotas.vacation, newAccumulated, emp.emp_id]
      );
    }

    return NextResponse.json({ success: true, message: 'Quotas reset and accumulation calculated successfully' });
  } catch (error: any) {
    console.error('Reset Quotas Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
