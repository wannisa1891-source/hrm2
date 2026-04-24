import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/hrm_db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [configsResult] = await pool.query('SELECT * FROM tbl_license_configs');
    const [employeesResult] = await pool.query(`
      SELECT e.emp_id, e.first_name_th, e.last_name_th, e.dept_id, e.pos_id, d.dept_name, p.pos_name, e.image, e.gender
      FROM tbl_employees e
      LEFT JOIN tbl_departments d ON e.dept_id = d.dept_id
      LEFT JOIN tbl_positions p ON e.pos_id = p.pos_id
      WHERE e.status IN ('Active', 'ทำงานปกติ')
    `);
    const [licensesResult] = await pool.query(`
      SELECT * FROM tbl_employee_licenses 
      WHERE id IN (
        SELECT MAX(id) FROM tbl_employee_licenses GROUP BY emp_id, license_name
      )
    `);

    const configs = configsResult as any[];
    const employees = employeesResult as any[];
    const licenses = licensesResult as any[];

    const summary = {
      totalEmployees: employees.length,
      compliant: 0,
      missing: 0, 
      pending: 0, 
      expiring: 0,
      departmentStats: {} as Record<string, any>,
      details: [] as any[]
    };

    employees.forEach(emp => {
      // Find configs that apply to this employee
      const relevantConfigs = configs.filter(c => 
        (!c.dept_id || c.dept_id === emp.dept_id) && 
        (!c.pos_id || c.pos_id === emp.pos_id)
      );

      // Find all latest licenses for this employee
      const empLicenses = licenses.filter(l => l.emp_id === emp.emp_id);
      
      let empStatus = 'Exempt'; 
      const empLicensesDetail: any[] = [];

      // 1. Evaluate existing licenses
      empLicenses.forEach(l => {
        const expDate = l.expire_date ? new Date(l.expire_date) : null;
        const isVerified = l.verified_status === 'Verified';
        
        let lStatus = 'ปกติ';

        if (!isVerified) {
          lStatus = 'PendingAudit';
        } else if (expDate) {
          const today = new Date();
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 0) {
            lStatus = 'Expired';
          } else {
            // Find relevant config for warning days
            const matchingConfig = relevantConfigs.find(c => {
               const dbName = (l.license_name || '').toLowerCase().trim();
               const configLicense = (c.license_name || '').toLowerCase().trim();
               return (dbName.includes(configLicense) || configLicense.includes(dbName));
            });
            const warningDays = matchingConfig ? matchingConfig.warning_days : 30;
            if (diffDays <= warningDays) {
              lStatus = 'Expiring';
            }
          }
        }

        empLicensesDetail.push({ name: l.license_name, status: lStatus });

        // Update overall employee status based on priority
        const priority = { 'Expired': 5, 'PendingAudit': 4, 'Missing': 3, 'Expiring': 2, 'Active': 1, 'ทำงานปกติ': 1, 'ปกติ': 1, 'Exempt': 0 };
        if (priority[lStatus as keyof typeof priority] > priority[empStatus as keyof typeof priority]) {
          empStatus = lStatus;
        }
      });

      // 2. Check for missing mandatory licenses
      relevantConfigs.forEach(config => {
        if (config.is_mandatory) {
          const hasIt = empLicenses.some(l => {
            const dbName = (l.license_name || '').toLowerCase().trim();
            const configLicense = (config.license_name || '').toLowerCase().trim();
            return (dbName.includes(configLicense) || configLicense.includes(dbName));
          });

          if (!hasIt) {
            // If missing a required license, status is at least Missing
            if (empStatus === 'Exempt' || empStatus === 'Active' || empStatus === 'Expiring') {
                empStatus = 'Missing';
            }
            empLicensesDetail.push({ name: config.license_name, status: 'Missing' });
          }
        }
      });

      // Handle translation to status cards
      if (empStatus === 'Exempt' && relevantConfigs.length > 0) {
          empStatus = 'Active';
      }

      const finalStatusName = (empStatus === 'Active' || empStatus === 'ทำงานปกติ' || empStatus === 'ปกติ') ? 'Compliant' : empStatus;

      // Update counters
      if (finalStatusName === 'Compliant') summary.compliant++;
      if (finalStatusName === 'Missing' || finalStatusName === 'Expired') summary.missing++;
      if (finalStatusName === 'PendingAudit') summary.pending++;
      if (finalStatusName === 'Expiring') summary.expiring++;

      // Update Department Stats
      const deptName = emp.dept_name || 'ไม่ระบุ';
      if (!summary.departmentStats[deptName]) {
        summary.departmentStats[deptName] = { total: 0, compliant: 0, missing: 0, pending: 0, expiring: 0 };
      }
      summary.departmentStats[deptName].total++;
      if (finalStatusName === 'Compliant') summary.departmentStats[deptName].compliant++;
      if (finalStatusName === 'Missing' || finalStatusName === 'Expired') summary.departmentStats[deptName].missing++;
      if (finalStatusName === 'PendingAudit') summary.departmentStats[deptName].pending++;
      if (finalStatusName === 'Expiring') summary.departmentStats[deptName].expiring++;

      summary.details.push({
        ...emp,
        status: finalStatusName,
        licenses: empLicensesDetail
      });
    });

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Monitor API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
