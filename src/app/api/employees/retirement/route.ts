import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fiscalYearStr = searchParams.get('fiscal_year');
    
    const today = new Date();
    let currentFY = today.getFullYear() + 543; // Convert to BE
    if (today.getMonth() >= 9) { // Oct is month 9
      currentFY += 1;
    }
    
    const targetFY = fiscalYearStr ? parseInt(fiscalYearStr) : currentFY;

    const [employees]: any = await pool.query(`
      SELECT e.emp_id, e.prefix, e.first_name_th, e.last_name_th, e.birth_date, e.dept_id, d.dept_name, p.pos_name
      FROM tbl_employees e
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
      LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
      WHERE e.status = 'ทำงานปกติ'
    `);

    const allProcessed = employees.map((emp: any) => {
      if (!emp.birth_date || String(emp.birth_date).startsWith('1900-01-01') || String(emp.birth_date) === '0000-00-00') {
        return {
          ...emp,
          retirement_year_be: null,
          retirement_date: null
        };
      }
      const birthDate = new Date(emp.birth_date);
      const birthYearBE = birthDate.getFullYear() + 543;
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();

      let retirementYearBE = birthYearBE + 60;
      if (birthMonth > 10 || (birthMonth === 10 && birthDay >= 2)) {
        retirementYearBE += 1;
      }
      const retirementDate = `${retirementYearBE - 543}-10-01`;

      return {
        ...emp,
        retirement_year_be: retirementYearBE,
        retirement_date: retirementDate
      };
    });

    const yearlySummary: { [key: number]: number } = {};
    allProcessed.forEach((emp: any) => {
      if (emp.retirement_year_be) {
        yearlySummary[emp.retirement_year_be] = (yearlySummary[emp.retirement_year_be] || 0) + 1;
      }
    });

    const yearlySummaryList = Object.entries(yearlySummary)
      .map(([yr, count]) => ({ fiscal_year: parseInt(yr), count }))
      .sort((a, b) => a.fiscal_year - b.fiscal_year);

    const retiringEmployees = fiscalYearStr === 'all' 
      ? allProcessed 
      : allProcessed.filter((emp: any) => emp.retirement_year_be === targetFY);

    // Sort: those with no birth date first or last?
    // Let's sort by retirement_year_be ASC, and nulls at the top (to alert HR).
    retiringEmployees.sort((a: any, b: any) => {
      if (!a.retirement_year_be && !b.retirement_year_be) return 0;
      if (!a.retirement_year_be) return -1;
      if (!b.retirement_year_be) return 1;
      return a.retirement_year_be - b.retirement_year_be;
    });

    const summaryByDept: { [key: string]: { dept_id: string, dept_name: string, count: number, employees: any[] } } = {};
    
    retiringEmployees.forEach((emp: any) => {
      const deptId = emp.dept_id || 'unknown';
      const deptName = emp.dept_name || 'ไม่ระบุหน่วยงาน';
      
      if (!summaryByDept[deptId]) {
        summaryByDept[deptId] = {
          dept_id: deptId,
          dept_name: deptName,
          count: 0,
          employees: []
        };
      }
      
      summaryByDept[deptId].count += 1;
      summaryByDept[deptId].employees.push(emp);
    });

    return NextResponse.json({
      fiscal_year: targetFY,
      total_retiring: retiringEmployees.length,
      summary_by_dept: Object.values(summaryByDept),
      employees: retiringEmployees,
      yearly_summary: yearlySummaryList
    });
  } catch (err: any) {
    console.error('Error in retirement API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
