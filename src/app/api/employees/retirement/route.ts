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
      WHERE e.birth_date IS NOT NULL AND e.birth_date != '1900-01-01' AND e.status = 'ทำงานปกติ'
    `);

    const retiringEmployees = employees.map((emp: any) => {
      const birthDate = new Date(emp.birth_date);
      const birthYearBE = birthDate.getFullYear() + 543;
      const birthMonth = birthDate.getMonth() + 1; // 1-12
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
    }).filter((emp: any) => emp.retirement_year_be === targetFY);

    // Sort by age youngest first (birth_date DESC)
    retiringEmployees.sort((a: any, b: any) => new Date(b.birth_date).getTime() - new Date(a.birth_date).getTime());

    // Group by department
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
      employees: retiringEmployees
    });
  } catch (err: any) {
    console.error('Error in retirement API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
