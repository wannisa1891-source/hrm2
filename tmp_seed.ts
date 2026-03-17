import db from "C:/xampp/htdocs/hrm2/src/lib/hrm_db";

async function seed() {
  try {
    // get a random employee
    const [emps]: any = await db.query("SELECT emp_id FROM tbl_employees LIMIT 1");
    if (emps.length === 0) {
      console.log("No employees found to seed.");
      process.exit(1);
    }
    const emp_id = emps[0].emp_id;

    // update employee with license info
    await db.query(`
      UPDATE tbl_employees 
      SET license_name = 'ใบประกอบวิชาชีพเวชกรรม', 
          license_type = 'แพทย์', 
          license_issue_date = '2020-01-01' 
      WHERE emp_id = ?`, [emp_id]);

    // create an expiring license in tbl_licenses
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const expireDateStr = nextWeek.toISOString().split('T')[0];

    // Check if license exists for this employee
    const [lics]: any = await db.query("SELECT license_id FROM tbl_licenses WHERE emp_id = ?", [emp_id]);
    if (lics.length > 0) {
      await db.query("UPDATE tbl_licenses SET expire_date = ?, license_no = 'TEST-123' WHERE emp_id = ?", [expireDateStr, emp_id]);
    } else {
      await db.query("INSERT INTO tbl_licenses (emp_id, license_no, expire_date) VALUES (?, 'TEST-123', ?)", [emp_id, expireDateStr]);
    }

    console.log("Seeded successfully for employee:", emp_id);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seed();
