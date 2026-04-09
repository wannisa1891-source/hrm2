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
      WHERE e.status = 'Active'
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

      let empStatus = 'Compliant';
      const empLicensesNeeded: any[] = [];

      relevantConfigs.forEach(config => {
        const found = licenses.find(l => {
          if (l.emp_id !== emp.emp_id) return false;
          
          const dbName = (l.license_name || '').toLowerCase().trim();
          const configLicense = (config.license_name || '').toLowerCase().trim();
          const configType = (config.config_name || '').toLowerCase().trim();

          // Match if exact OR if one contains the other (robust matching)
          return (
            (dbName && configLicense && (dbName.includes(configLicense) || configLicense.includes(dbName))) ||
            (dbName && configType && (dbName.includes(configType) || configType.includes(dbName)))
          );
        });

        if (!found) {
          if (config.is_mandatory) {
            empStatus = 'Missing';
            empLicensesNeeded.push({ name: config.license_name, status: 'Missing' });
          }
        } else {
          const expDate = found.expire_date ? new Date(found.expire_date) : null;
          const isVerified = found.verified_status === 'Verified';

          if (!isVerified) {
            // Found but not audited yet
            if (empStatus !== 'Missing') empStatus = 'PendingAudit';
            empLicensesNeeded.push({ name: config.license_name, status: 'PendingAudit' });
          } else if (expDate) {
            const today = new Date();
            const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 0) {
              empStatus = 'Expired';
              empLicensesNeeded.push({ name: config.license_name, status: 'Expired', daysLeft: diffDays });
            } else if (diffDays <= config.warning_days) {
              if (empStatus !== 'Missing' && empStatus !== 'Expired' && empStatus !== 'PendingAudit') {
                empStatus = 'Expiring';
              }
              empLicensesNeeded.push({ name: config.license_name, status: 'Expiring', daysLeft: diffDays });
            } else {
              empLicensesNeeded.push({ name: config.license_name, status: 'Active', daysLeft: diffDays });
            }
          }
        }
      });

      if (relevantConfigs.length === 0) empStatus = 'Exempt';

      // Update summary
      if (empStatus === 'Compliant') summary.compliant++;
      if (empStatus === 'Missing' || empStatus === 'PendingAudit' || empStatus === 'Expired') summary.missing++;
      if (empStatus === 'Expiring') summary.expiring++;

      // Dept Stats
      const deptName = emp.dept_name || 'ไม่ระบุ';
      if (!summary.departmentStats[deptName]) {
        summary.departmentStats[deptName] = { total: 0, compliant: 0, missing: 0, expiring: 0 };
      }
      summary.departmentStats[deptName].total++;
      if (empStatus === 'Compliant') summary.departmentStats[deptName].compliant++;
      if (empStatus === 'Missing' || empStatus === 'PendingAudit' || empStatus === 'Expired') summary.departmentStats[deptName].missing++;
      if (empStatus === 'Expiring') summary.departmentStats[deptName].expiring++;

      summary.details.push({
        ...emp,
        status: empStatus,
        licenses: empLicensesNeeded
      });
    });

    return NextResponse.json(summary);
  } catch (err: any) {
    console.error('Monitor API Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
