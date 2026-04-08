import pool from './src/lib/hrm_db';

async function fix() {
  try {
    console.log("Fixing DB schema...");
    await pool.query("ALTER TABLE tbl_employee_licenses ADD COLUMN IF NOT EXISTS institution VARCHAR(255) AFTER license_no");
    await pool.query("ALTER TABLE tbl_employee_licenses ADD COLUMN IF NOT EXISTS issue_date DATE AFTER institution");
    await pool.query("ALTER TABLE tbl_employee_licenses ADD COLUMN IF NOT EXISTS verified_status VARCHAR(50) DEFAULT 'Pending' AFTER expire_date");
    await pool.query("ALTER TABLE tbl_employee_licenses ADD COLUMN IF NOT EXISTS remarks TEXT AFTER verified_status");
    console.log("DB Schema Fixed Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Fix Error:", err);
    process.exit(1);
  }
}

fix();
